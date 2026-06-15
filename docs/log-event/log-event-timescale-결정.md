# log_event만 TimescaleDB Hypertable로 두는 설계 결정

> 생성일: 2026-06-15
> 대상 브랜치: main
> 성격: 설계 결정 기록(ADR) + 장점 정리

## 1. 목표 & 배경

- **무엇을**: 6개 테이블 중 **`log_event` 하나만** TimescaleDB hypertable로 전환하고, 나머지(`event_store`, `projection_cursor`, `read_grip_result`, `read_multimodal`, `log_cursor`)는 일반 Postgres 테이블로 유지한다.
- **왜**:
  - `docker-compose.yml`은 `timescale/timescaledb:2.17.2-pg17` 이미지를 쓰고 `shared_preload_libraries=timescaledb`로 확장을 **로드**하지만, 코드 어디에도 `create_hypertable()` 호출이 없다. 즉 **현재는 TimescaleDB 기능을 하나도 안 쓰는, 사실상 순수 Postgres 상태**다.
  - `log_event`는 `(time, log_id)`를 PK로 갖는 전형적인 **시계열 append-only 테이블**이고, 연구 구조상 **LLM 컨텍스트의 Logging 소스**라 시간이 갈수록 무한정 쌓인다. 이 테이블만큼은 hypertable의 파티셔닝/압축/보존 정책이 실질적 이득을 준다.

## 2. 현재 구조 분석

스키마는 `src/shared/database/schema/index.ts`가 6개 테이블을 export 한다.

| 파일 | 테이블 | PK | 시계열 성격 | 역할(CQRS) |
|---|---|---|---|---|
| `event.ts` | `event_store` | `global_seq` (bigserial) | 약함 | Write Model (Event Store) |
| `projection-cursor.ts` | `projection_cursor` | `projector_name` | 없음 | 동기화 커서 |
| `read-grip-result.ts` | `read_grip_result` | `(scene_key, attempt_num)` | 없음 | Read Model |
| `read-multimodal.ts` | `read_multimodal` | `(scene_key, attempt_num)` | 없음 | Read Model |
| `log-event.ts` | **`log_event`** | **`(time, log_id)`** | **강함** | **LLM 컨텍스트(Logging)** |
| `log-cursor.ts` | `log_cursor` | `source_file` | 없음 | 로그 수집 커서 |

- `log_event` 정의(`src/shared/database/schema/log-event.ts`): PK `(time, log_id)` + 시간 기반 보조 인덱스 4개(`idx_log_level_time`, `idx_log_action_time`, `idx_log_scene_time`, `idx_log_projector_time`). 모든 인덱스의 선두 또는 후행이 `time`이라 시간 범위 쿼리에 최적화돼 있다.
- 실제 DDL은 `drizzle/migrations/0003_right_ozymandias.sql`에서 `log_event` / `log_cursor`를 생성한다. 이 마이그레이션은 평범한 `CREATE TABLE`까지만 하고 hypertable 전환은 하지 않는다.
- 인프라: `docker/docker-compose.yml`이 TimescaleDB 이미지 + `shared_preload_libraries=timescaledb`. 마이그레이션 도구는 drizzle-kit(`src/config/drizzle.config.ts`, `out: ./drizzle/migrations`).

## 3. 왜 `log_event`만인가 — 테이블별 판단 근거

### 전환한다: `log_event`

- **시계열 append-only**: 로그는 과거 행을 거의 수정하지 않고 시간순으로 계속 쌓인다. hypertable이 가정하는 워크로드와 정확히 일치한다.
- **PK가 hypertable 제약을 이미 만족**: TimescaleDB는 모든 UNIQUE/PRIMARY KEY가 파티션 컬럼(`time`)을 포함할 것을 요구한다. `log_event` PK가 `(time, log_id)`라 추가 변경 없이 전환 가능하다. → **도입 비용이 사실상 0**이라는 게 "안 할 이유가 없다"의 근거다.
- **무한 성장 + LLM 컨텍스트 소스**: 연구 구조상 LLM에 주입할 로그가 끝없이 누적된다. 아래 §4의 기능들이 비용 효율적 운영의 핵심이 된다.

### 전환하지 않는다: 나머지 5개

- **`event_store`** — append-only이긴 하나 PK가 `global_seq`(bigserial)라 시간 파티셔닝의 자연스러운 키가 아니다. 이벤트 소싱의 진실 원천(source of truth)이라 청크 drop 류의 보존 정책과 상성이 나쁘고, `uq_event_stream_attempt` 같은 비-시간 유니크 제약이 hypertable 제약과 충돌한다. **굳이 hypertable로 얻을 이득이 없다.**
- **`read_grip_result`, `read_multimodal`** — Read Model이다. `(scene_key, attempt_num)`로 조회하는 키-기반 테이블이지 시간 구간 스캔 테이블이 아니다. 게다가 본 연구에서 이 테이블들은 **LLM이 버전 교체·재생성하는 대상**이라 구조가 유동적이다. 시계열 인프라를 입힐 동기가 없다.
- **`projection_cursor`, `log_cursor`** — 사실상 단일 행 수준의 커서 상태 테이블. 시계열과 무관하며 hypertable은 명백한 오버엔지니어링이다.

> 요약: hypertable은 "공짜 성능 향상"이 아니라 **시간 파티셔닝 + 보존/압축 워크로드에 맞는 테이블에만** 이득이 있는 특화 도구다. 이 저장소에서 그 조건을 만족하는 건 `log_event` 하나뿐이다.

## 4. 일반 Postgres 대비 장점 (왜 TimescaleDB인가)

일반 PG 테이블에 `time` 인덱스만 걸어도 어느 정도는 동작한다. 하지만 **무한정 쌓이는 `log_event`** 에서는 hypertable이 구조적으로 다른 이점을 준다. 이 프로젝트 맥락(LLM 컨텍스트 소스, 끝없는 적재)에 묶어 4가지로 정리한다.

### 4.0 먼저: chunk 파티셔닝이란?

아래 모든 이점의 토대가 되는 개념이라 먼저 짚는다.

**한 문장으로**: 하나의 큰 테이블을 시간(`time`) 기준으로 여러 개의 작은 물리 테이블 조각으로 자동으로 쪼개 저장하는 것. 그 조각 하나하나를 **chunk(청크)** 라고 부른다.

지금 `log_event`는 일반 PG에서 한 덩어리다:

```
log_event  (테이블 1개, 인덱스 1개)
┌─────────────────────────────────────────────┐
│ 1월 │ 2월 │ 3월 │ 4월 │ 5월 │ 6월 │ ...        │   ← 전부 한 곳에 섞여 있음
└─────────────────────────────────────────────┘
```

hypertable로 바꾸면 겉보기엔 여전히 `log_event` 테이블 하나지만, 내부적으로 `time` 기준(예: 7일 단위)으로 쪼개진다:

```
log_event  (논리적으로는 테이블 1개 = "hypertable")
   │
   ├── chunk_1  [6/1 ~ 6/7]   ← 실제 물리 테이블, 자기 인덱스 보유
   ├── chunk_2  [6/8 ~ 6/14]  ← 실제 물리 테이블, 자기 인덱스 보유
   ├── chunk_3  [6/15 ~ 6/21] ← 지금 쓰는 중 (hot chunk)
   └── ...                       새 주가 되면 청크가 자동 생성됨
```

**핵심은 청크를 직접 다루지 않는다는 점이다.** `INSERT INTO log_event ...` 하면 엔진이 그 행의 `time` 값을 보고 알아서 맞는 청크에 넣고, `SELECT ... WHERE time > ...` 하면 알아서 맞는 청크만 읽는다. SQL은 일반 테이블과 100% 동일하게 쓰며, 쪼개고 합치는 건 엔진이 뒤에서 처리한다. (그래서 §3의 "기존 코드 수정 없이 동작"이 성립한다.)

> 참고: 일반 Postgres도 `PARTITION BY RANGE (time)`으로 수동 파티셔닝은 된다. 차이는 **자동화**다. PG 네이티브는 "다음 주 파티션"을 미리 만드는 관리와 압축·보존 정책을 사람이 직접 짜야 하지만, TimescaleDB는 청크 생성·압축·보존·집계를 **정책 한 줄로 자동화**한다.

| 용어 | 의미 |
|---|---|
| **hypertable** | 겉보기엔 일반 테이블 1개지만, 내부적으로 청크로 쪼개진 테이블 (`log_event`가 될 대상) |
| **chunk** | `time` 구간 하나에 해당하는 실제 물리 테이블 조각 (예: "6/15~6/21") |
| **chunk_time_interval** | 청크 하나가 담는 시간 폭 (본 결정 예시에선 `7 days`) |
| **chunk exclusion** | 쿼리 시 무관한 청크를 통째로 건너뛰는 최적화 (§4.1) |
| **hot chunk** | 지금 삽입이 일어나는 최신 청크 (§4.2) |

쉽게 말해 **"시간으로 자른 서랍장"** 이다. 한 칸에 다 쑤셔넣는 대신 주(週)별 서랍에 나눠 넣으니, 찾을 때도 해당 서랍만 열고, 오래된 서랍은 통째로 압축하거나 버릴 수 있다.

### 4.1 Chunk 파티셔닝 → 시간 범위 쿼리가 빨라짐

일반 PG는 `log_event`가 **하나의 거대한 테이블 + 하나의 거대한 B-tree 인덱스**다. "최근 1시간 에러 로그"를 조회해도 인덱스 전체가 경합한다.

hypertable은 `time` 기준으로 테이블을 **여러 물리 조각(chunk)으로 자동 분할**한다(예: 7일 단위면 각 주가 별도 테이블 + 별도 인덱스).

- **Chunk exclusion**: `WHERE time > now() - interval '1 hour'` 쿼리에서 플래너가 **해당 청크만 스캔하고 나머지는 아예 건너뛴다.** 1년치가 쌓여도 "오늘" 쿼리는 오늘 청크 하나만 본다.
- 일반 PG는 인덱스가 1년치 전체를 커버해 트리가 깊어질수록 느려지지만, hypertable은 **데이터가 늘어도 최근 구간 쿼리 성능이 거의 일정**하다.
- `log_event`의 보조 인덱스 4개(`idx_log_level_time` 등)도 청크별로 작게 쪼개져 인덱스 자체가 가벼워진다.

### 4.2 대량 insert가 느려지지 않음

`log_event`는 LLM 컨텍스트 소스라 **계속 append만** 된다. 일반 PG는 인덱스가 커질수록 새 행 삽입 시 B-tree 재조정 비용이 커진다(특히 인덱스 5개).

hypertable은 **항상 최신 청크(hot chunk)에만 삽입**하고 그 청크의 인덱스는 작아 캐시에 잘 맞는다. → 1년 뒤에도 삽입 속도가 초기와 비슷하다.

### 4.3 오래된 로그 압축 (compression)

비용 측면에서 가장 큰 이점이다.

| | 일반 PG | TimescaleDB |
|---|---|---|
| 오래된 로그 저장 | 행(row) 그대로, 압축 없음 | 청크를 **컬럼형으로 압축** |
| 절감폭 | — | 보통 **10~20배**, 반복 많은 로그는 더 |

`add_compression_policy('log_event', INTERVAL '7 days')` 한 줄이면 "7일 지난 청크 자동 압축"이 정책으로 돈다. 압축돼도 SQL 조회는 그대로 된다.

#### 어떻게 압축되나 — 행 저장을 열 저장으로 눕힘

일반 PG는 **행(row) 단위**로 저장한다(한 줄이 통째로 한 곳에). 압축은 이걸 **열(column) 단위로 눕혀서(transpose)** 다시 저장한다.

```
압축 전 (행 저장)                          압축 후 (열 저장)
[6/15 10:00, 30, "project", "GripProj"]   time:      [6/15 10:00, 6/15 10:00, 6/15 10:01, ...]
[6/15 10:00, 30, "project", "GripProj"]   level:     [30, 30, 50, ...]
[6/15 10:01, 50, "project", "GripProj"]   action:    ["project", "project", "project", ...]
                                          projector: ["GripProj", "GripProj", "GripProj", ...]
```

**왜 열로 눕히면 잘 줄어드나**: 같은 컬럼의 값들은 **타입이 같고 값이 비슷**하다. `level`은 30/40/50 몇 종류뿐이고 `action`·`projector_name`은 같은 문자열이 수천 번 반복된다. 행 저장에서는 이 반복값이 다른 컬럼 사이에 흩어져 압축기가 패턴을 못 찾지만, 열로 모으면 "30이 1000번 반복" 같은 패턴이 명확해져 압축률이 폭발한다. `log_event`의 `level`/`action`/`projector_name`/`scene_key`가 정확히 이런 저-카디널리티 반복 컬럼이라 효율이 특히 좋다.

#### 내부 동작: 1000행씩 묶어 "배열 한 칸"으로

TimescaleDB는 청크를 압축할 때 행을 **최대 1000개씩 배치(batch)로 묶고**, 각 컬럼을 배열로 만들어 **압축된 행 하나에 통째로** 집어넣는다(1000 rows → 1 row). 컬럼 타입마다 다른 알고리즘을 쓴다:

| 컬럼 종류 | 알고리즘 | log_event 예시 |
|---|---|---|
| 시간/정수(증가 추세) | **Delta-of-delta** (차이의 차이만 저장) | `time`, `global_seq` |
| 반복 많은 값 | **Run-length / Dictionary** (값+반복횟수 또는 사전 인덱스) | `level`, `action`, `projector_name` |
| 일반 데이터 | **LZ 계열 범용 압축** | `msg`, `payload` |

예: `time`은 로그가 거의 일정 간격이라 "+1초, +1초..." 차이만 저장하면 0에 수렴하고, `level`은 "30이 850번, 50이 150번"으로 1000개가 몇 바이트로 줄어든다.

#### 언제 압축되나 — 정책 + 백그라운드 워커

`add_compression_policy('log_event', INTERVAL '7 days')`를 걸면 내장 스케줄러가 주기적으로 깨어나, 카탈로그에서 "마지막 데이터가 7일보다 오래된 청크"를 찾아 자동 압축하고 "압축됨" 상태로 표시한다.

> **하이브리드가 핵심**: 최신 청크(hot chunk)는 계속 INSERT가 일어나니 **행 저장 그대로** 두고(삽입이 빠름), 더 이상 안 변하는 오래된 청크만 **열 저장으로 압축**한다. 한 테이블 안에서 청크별로 저장 방식이 다르다. `log_event`처럼 "최근 로그는 자주 쓰고 과거는 가끔 분석"하는 패턴에 정확히 맞는다.

#### 트레이드오프 — 압축 청크는 append-only에 적합

| 항목 | 압축된 청크에서 |
|---|---|
| 조회(SELECT) | OK (자동 해제), 컬럼 집계는 오히려 더 빠를 수 있음 |
| 삽입(INSERT) | 가능하나 느림 → 오래된(더 안 들어오는) 청크만 압축하는 이유 |
| 수정/삭제(UPDATE/DELETE) | 비쌈 — 배치를 풀고 다시 압축해야 함 |
| 개별 단건 조회 | 1000행 배치를 풀어야 해 불리 |

→ `log_event`는 append-only고 과거를 안 고치니 이 트레이드오프가 거의 무해하다. 압축에 이상적인 후보인 이유다. (그래서 압축 정책 자체는 운영 요건 확정 후 §5 따라 별도로 켠다.)

#### (선택) 압축 튜닝 노브 — segmentby / orderby

```sql
ALTER TABLE log_event SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'projector_name',  -- 이 값으로 그룹핑해 압축
  timescaledb.compress_orderby   = 'time DESC'         -- 배치 내부 정렬 기준
);
```

- **`segmentby`**: 지정 컬럼별로 묶어 압축 → `WHERE projector_name = ...` 쿼리에서 다른 그룹 배치를 건너뛰어 빨라진다(`log_event`라면 `projector_name`·`level`이 후보).
- **`orderby`**: 배치 내부 정렬. 보통 `time DESC`가 최근 조회와 delta 압축에 유리.
- 데이터 분포를 보고 정하는 튜닝 영역이라, 처음엔 기본값으로 켜고 나중에 조정한다.

### 4.4 보존(retention) & 연속 집계(continuous aggregate)

- **Retention**: 일반 PG에서 "90일 지난 로그 삭제"는 `DELETE FROM log_event WHERE time < ...` — 수백만 행을 지우며 테이블 bloat + VACUUM 부담이 크다. hypertable은 `add_retention_policy`로 **오래된 청크를 통째로 drop** → `DROP TABLE` 수준으로 즉각적이고 bloat가 없다.
- **Continuous aggregate**: "시간당 에러 수", "projector별 평균 duration" 같은 롤업을 **증분 갱신되는 머티리얼라이즈드 뷰**로 유지한다. 일반 PG에서 배치 잡으로 직접 구현해야 할 걸 인프라가 대신 해준다.

> **연구 맥락 연결**: `log_event`는 LLM에 주입할 컨텍스트의 원천이다. 원본 로그를 통째로 LLM에 넣으면 토큰이 폭발한다. continuous aggregate로 "최근 N시간 동안 어떤 action이 몇 번 실패했나" 같은 **요약 컨텍스트**를 싸게 미리 만들어두면, LLM이 Read Model 적응 판단을 할 때 줄 입력을 비용 효율적으로 구성할 수 있다.

### 4.5 한눈 비교

| 항목 | 일반 PG (time 인덱스만) | TimescaleDB hypertable |
|---|---|---|
| 최근 구간 조회 | 데이터 늘수록 느려짐 | **거의 일정** (chunk exclusion) |
| 지속적 append | 인덱스 커져 점점 느려짐 | **일정** (hot chunk만) |
| 저장 비용 | 압축 없음 | **10~20배 절감** (압축 정책) |
| 오래된 데이터 삭제 | `DELETE` + bloat + VACUUM | **청크 drop** (즉시) |
| 요약 집계 | 배치 직접 구현 | **continuous aggregate** 내장 |

> **솔직한 전제**: 이 이점들은 데이터가 어느 정도 쌓이고(수백만~수천만 행) 보존/압축 정책을 실제로 켰을 때 체감된다. 로그가 적을 땐 일반 PG와 차이가 거의 없다. 그래서 **데이터가 적을 때 미리 전환해두고 정책은 나중에 켜는** 편이 비용상 유리하다(`create_hypertable`의 `migrate_data` 비용이 작을 때 끝내는 셈).

## 5. 주의사항 & 리스크

- **drizzle 스키마 drift 미해결**: 본 결정과 별개로, `src/shared/database/schema/event.ts`는 테이블명을 `event_store`로 정의하지만 마이그레이션 `0000`은 `event`라는 이름으로 만들었다(`stream_version` vs `attempt_num` 컬럼 차이도 존재). hypertable 작업과 무관하지만, 향후 `db:generate`가 의도치 않은 diff를 만들 수 있으므로 별도로 정리 권장.
- **압축/보존은 분리**: `add_compression_policy` / `add_retention_policy`는 데이터 손실·복구 비용과 직결되므로 본 결정 범위에서 제외했다. 운영 요건이 확정된 뒤 별도로 다룬다.
- **롤백**: hypertable → 일반 테이블 역전환은 단순하지 않다(청크 구조 해제 필요). 롤백이 필요하면 보통 **새 일반 테이블로 데이터 복사 후 swap**하는 편이 안전하다.

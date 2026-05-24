# toy-data → Drizzle 스키마 매핑 정리

> 생성일: 2026-05-22
> 대상 브랜치: main
> 범위: `src/shared/database/schema/*` + `src/insert/*` + `data/toy-data/*.json`

---

## 1. 목표 & 배경

- **무엇을**: AI Hub 「로봇 행동 데이터(3D 물건 파지)」 라벨링 JSON(`data/toy-data/*.json`)을 본 프로젝트의 PostgreSQL 스키마(`src/shared/database/schema/`)에 어떻게 적재하는지 매핑을 정리한다.
- **왜**: Self-Adaptive CQRS 연구에서 Write Model(Event Store)과 Read Model(Insight EE 학습용 정형 뷰 + 멀티모달 RAG 뷰)을 분리한 본 프로젝트의 구조상, "원본 JSON의 어떤 필드가 어느 컬럼에 들어가는지" 가 모든 후속 작업(프로젝터 구현, Insight EE 학습 파이프라인, World Model RAG 인덱스 구축)의 출발점이기 때문이다.
- **성공 기준**:
  - toy-data JSON 1개가 어떤 식별자(streamId, attemptNum, sceneKey)로 변환되는지 한눈에 보인다.
  - 4개 테이블(`event_store`, `read_grip_result`, `read_multimodal`, `projection_cursor`)의 책임이 명확하다.
  - 각 테이블의 컬럼이 JSON의 어느 필드에서 왔는지 1:1로 추적 가능하다.

---

## 2. 전체 구조 — Write 쪽 1개, Read 쪽 2개, 동기화 보조 1개

```
data/toy-data/*.json
        │
        │  ① parseToyDataFileName  (파일명 → sceneKey/attemptNum/capturedDate)
        │  ② toyDataSchema.parse   (Zod로 JSON 내용 검증)
        ▼
┌─────────────────────────────────────┐
│  event_store  (Write Model)          │   ← append-only, payload는 jsonb 원본 통째로
│   PK: global_seq                     │
│   UQ: (stream_id, attempt_num)       │
└────────────┬────────────────────────┘
             │ (아직 구현 안 됨) Projector가 event_store 를 catch-up
             ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│  read_grip_result         │   │  read_multimodal          │
│  (Insight EE 학습용 정형) │   │  (World Model / RAG 자산) │
│  PK: (sceneKey,attempt)   │   │  PK: (sceneKey,attempt)   │
└──────────────────────────┘   └──────────────────────────┘
             ▲                              ▲
             └──────────────┬───────────────┘
                            │
                ┌────────────────────────┐
                │  projection_cursor      │
                │  (projectorName → seq)  │
                └────────────────────────┘
```

`★ 매핑의 핵심 원칙`
1. **JSON 1개 = 이벤트 1개 = 파지 시도 1회.** 동일 `sceneKey` 안에서 `attemptNum`(01, 02, 03 …)으로 시도별 이벤트가 누적된다.
2. **Write는 손실 없이.** `event_store.payload(jsonb)`에 raw JSON을 통째로 박아 향후 어떤 Read Model로도 재투영 가능하게 한다.
3. **Read는 use-case별로.** 정형 통계가 필요한 Insight EE는 `read_grip_result`, 멀티모달 검색이 필요한 World Model/RAG는 `read_multimodal`을 각각 본다.

---

## 3. 영향 받는 파일

- `src/insert/parser/toy-data-file-name.parser.ts` — 파일명 정규식으로 식별자 추출
- `src/insert/dto/toy-data.dto.ts` — Zod로 raw JSON 형태 검증
- `src/insert/repository/event-store.repository.ts` — `EventStoreRepository` interface + DI 토큰 + `DrizzleEventStoreRepository` 구현체
- `src/insert/repository/event-store.repository.impl.ts` — `EventStoreRepositoryImpl` 구현체 (현재 `.repository.ts`의 `DrizzleEventStoreRepository`와 중복 — §7 참고)
- `src/insert/insert.service.ts` — 디렉터리 스캔 → 파싱 → append 오케스트레이션
- `src/shared/database/schema/event.ts` — `event_store` 테이블 정의
- `src/shared/database/schema/read-grip-result.ts` — `read_grip_result` 테이블 정의
- `src/shared/database/schema/read-multimodal.ts` — `read_multimodal` 테이블 정의
- `src/shared/database/schema/projection-cursor.ts` — `projection_cursor` 테이블 정의
- `src/shared/database/schema/index.ts` — barrel export
- `docs/활용데이터구조.md` — 원본 JSON 스펙 (본 문서의 기반 자료)

---

## 4. 파일명 → 도메인 식별자 추출

### 4.1 파일명 규칙

```
{categoryPrefix}_{cameraCode}_{objectName}_{sceneNum5}_{attempt2}_{YYYYMMDD}.json
```

예: `반려동물용품_CR01_강아지공룡알장난감_00001_01_20230923.json`

| 토큰 | 값 (예시) | 의미 |
|---|---|---|
| `categoryPrefix` | `반려동물용품` | 상품 카테고리 |
| `cameraCode` | `CR01` | 촬영 카메라 ID (`CR\d+`) |
| `objectName` | `강아지공룡알장난감` | 객체(클래스) 이름 |
| `sceneNum5` | `00001` | 씬 일련번호(5자리, zero-pad) |
| `attempt2` | `01` | 시도번호(2자리, zero-pad) |
| `YYYYMMDD` | `20230923` | 촬영 날짜 |

### 4.2 `parseToyDataFileName` 변환 결과

`src/insert/parser/toy-data-file-name.parser.ts`:

| 도출 필드 | 계산 방식 | 후속 사용처 |
|---|---|---|
| `categoryPrefix` | 정규식 그룹 1 | `sceneKey` 조립용 |
| `cameraCode` | 정규식 그룹 2 | `sceneKey` 조립용 |
| `objectName` | 정규식 그룹 3 | `sceneKey` 조립용, 추후 `read_grip_result.object_name` 매핑 후보 |
| `sceneNum` | 정규식 그룹 4 (문자열 유지) | `sceneKey` 조립용 |
| `attemptNum` | 정규식 그룹 5 → `Number(...)` | `event_store.attempt_num`, `read_*.attempt_num` |
| `capturedDate` | `Date.UTC(year, month-1, day)` | `event_store.occurred_at` (이벤트 발생 시각) |
| `sceneKey` | `` `${categoryPrefix}_${cameraCode}_${objectName}_${sceneNum}` `` | `event_store.stream_id`의 일부 + Read Model PK 일부 |

### 4.3 `streamId` 조립 규칙

`InsertService.ingestToyData`에서:

```ts
streamId: `grip-attempt:${meta.sceneKey}`
```

`grip-attempt:` 접두사가 stream의 **kind**를 표시. 향후 다른 종류의 stream(`world-model-update:...`, `insight-decision:...` 등)이 추가될 가능성을 고려한 네임스페이스 prefix.

`★ 식별자 설계 포인트`
- **stream = "한 객체의 한 씬"**, **event = "그 씬에서의 한 시도"** 라는 분해 덕분에, 동일 씬을 재촬영해도 (`attemptNum`만 다르고 `streamId`는 같음) append-only 모델이 깨지지 않는다.
- `(streamId, attemptNum)` 유니크 제약(`uq_event_stream_attempt`) + `onConflictDoNothing` → 같은 JSON을 두 번 ingest해도 중복 이벤트가 생기지 않는 **멱등 적재**.

---

## 5. `event_store` — Write Model 매핑

### 5.1 컬럼 정의 (요약)

`src/shared/database/schema/event.ts`:

| 컬럼 | 타입 | 비고 |
|---|---|---|
| `global_seq` | `bigserial` PK | 전역 단조 증가 시퀀스. Projector의 catch-up 기준값 |
| `event_id` | `uuid` (default random, unique) | 외부 노출용 ID |
| `stream_id` | `varchar` | `grip-attempt:{sceneKey}` |
| `attempt_num` | `integer` | 시도번호 |
| `event_type` | `varchar(64)` | 현재는 항상 `"GripAttemptRecorded"` |
| `occurred_at` | `timestamptz` | 도메인 사건 발생 시각 (= `capturedDate`) |
| `recorded_at` | `timestamptz` (default now) | DB에 적재된 시각 (시스템 시계) |
| `payload` | `jsonb` | toy-data JSON 원본 전체 |
| 유니크 인덱스 | `uq_event_stream_attempt` on `(stream_id, attempt_num)` | 멱등 키 |

### 5.2 컬럼별 매핑 출처

| event_store 컬럼 | 값의 출처 | 코드 위치 |
|---|---|---|
| `global_seq` | DB가 자동 생성 (`bigserial`) | schema |
| `event_id` | DB가 자동 생성 (`defaultRandom`) | schema |
| `stream_id` | `` `grip-attempt:${meta.sceneKey}` `` | `insert.service.ts:60` |
| `attempt_num` | `meta.attemptNum` (파일명에서 추출) | `insert.service.ts:61` |
| `event_type` | 고정 문자열 `"GripAttemptRecorded"` | `insert.service.ts:62` |
| `occurred_at` | `meta.capturedDate` (파일명의 `YYYYMMDD` → UTC 자정) | `insert.service.ts:63` |
| `recorded_at` | DB가 자동 생성 (`defaultNow`) | schema |
| `payload` | `toyDataSchema.parse(JSON.parse(raw))` 결과 객체 전체 | `insert.service.ts:55-65` |

### 5.3 `payload` 안에 들어가는 raw JSON 필드

Zod 검증을 통과한 후 jsonb로 저장되는 필드는 `toyDataSchema`(`src/insert/dto/toy-data.dto.ts`)에 1:1로 대응한다:

| JSON 키 | Zod 타입 |
|---|---|
| `2D_image_file_name` | `string` |
| `3D_image_file_name` | `string` |
| `video_file_name` | `string` (프로젝트 확장 필드, `활용데이터구조.md` §11 참조) |
| `box_type` | `string` (`"None"`) |
| `camera_info.camera_intrinsic_param` | 14개 number 필드 (`fx, fy, cx, cy, k1~k6, p1, p2, codx, cody`) |
| `camera_info.camera_name` | `string` |
| `camera_info.camera_type` | `string` (`"고정형"`) |
| `data_key` | `string` |
| `grip_data.grip_2d_pose` | `{ xl, xr, yl, yr }` (핑거그리퍼 가정) |
| `grip_data.grip_3d_pose` | `{ x1..x8, y1..y8, z1..z8 }` (3D 박스 8꼭짓점) |
| `grip_succeed` | `0 \| 1` |
| `objects[]` | `{ annotation_type, class_name, package_type, object_properties[], id, segmentation_points[][][] }` |
| `robot_tf.rotation_3x3` | `number[9]` |
| `robot_tf.translation_3x1` | `number[3]` |
| `human_annotation_grasp[]` | `{ annotation_type, id, annotation_points[], num_keypoints }` |

> ⚠️ 현재 Zod 스키마는 **핑거그리퍼**(`grip_2d_pose = {xl,xr,yl,yr}`) 만 받는다. 흡착그리퍼(`grip_2d_pose = {x,y}`) 데이터가 들어오면 검증에서 실패한다. `활용데이터구조.md` §6 참조.

---

## 6. Read Model 매핑 (현재는 스키마만, projector 미구현)

> 두 Read 테이블 모두 **아직 적재 로직은 없다**. 스키마만 정의돼 있으므로 본 절은 "Projector가 만들어질 때 어느 jsonb 필드에서 어느 컬럼으로 풀어내야 하는가" 의 설계를 정리한다.

### 6.1 `read_grip_result` — Insight EE 학습용 정형 뷰

`src/shared/database/schema/read-grip-result.ts`:

| 컬럼 | 타입 | 매핑 출처 (event_store.payload 경로 또는 식별자) |
|---|---|---|
| `scene_key` (PK1) | `varchar` | `stream_id`에서 `grip-attempt:` 떼어낸 값 |
| `attempt_num` (PK2) | `smallint` | `event_store.attempt_num` |
| `object_name` | `varchar` | `payload.objects[0].class_name` (또는 파일명에서 추출한 `objectName`) |
| `grip_succeed` | `smallint` | `payload.grip_succeed` (0/1) |
| `gripper_type` | `varchar(16)` | 현재 JSON에 명시 필드 없음 → `grip_2d_pose` 형태로 추론 (`xl/xr/yl/yr` 있으면 `"finger"`, `x/y`만 있으면 `"suction"`) |
| `occurred_at` | `timestamptz` | `event_store.occurred_at` |
| `grip_2d_pose` | `jsonb` | `payload.grip_data.grip_2d_pose` 통째 |
| `grip_3d_pose` | `jsonb` | `payload.grip_data.grip_3d_pose` 통째 |
| `robot_tf` | `jsonb` | `payload.robot_tf` 통째 |
| `human_annotation_grasp` | `jsonb` | `payload.human_annotation_grasp` 통째 |
| `stream_id` | `varchar` | `event_store.stream_id` (역추적용 사본) |
| `global_seq` | `bigint` | `event_store.global_seq` (catch-up watermark) |
| `idx_grip_result_object` | index on `(object_name, occurred_at)` | "객체별 시간순 조회" 쿼리 가속 |
| `idx_grip_result_succeed` | index on `(grip_succeed, occurred_at)` | "성공/실패 시계열 분석" 가속 |

`★ 설계 의도`
- 정형으로 풀 수 있는 것(`grip_succeed`, `object_name`, 인덱싱 가능한 시계열 필드)만 컬럼화하고, 6D 포즈처럼 구조가 단단하지만 분석마다 쓰임이 다른 부분은 `jsonb`로 둔다 → Insight EE가 "성공률 vs 객체" 같은 쿼리를 빠르게 돌릴 수 있게 한다.
- `global_seq`를 사본으로 가지는 이유: Projector가 어디까지 따라잡았는지 (`projection_cursor.last_event_seq`)와 비교하기 위함.

### 6.2 `read_multimodal` — World Model / RAG용 멀티모달 자산 뷰

`src/shared/database/schema/read-multimodal.ts`:

| 컬럼 | 타입 | 매핑 출처 |
|---|---|---|
| `scene_key` (PK1) | `varchar` | 〃 |
| `attempt_num` (PK2) | `smallint` | 〃 |
| `occurred_at` | `timestamptz` | 〃 |
| `image_2d_file_name` | `varchar` | `payload["2D_image_file_name"]` |
| `image_2d_uri` | `text` | (외부 스토리지에 업로드 시 채워질 URI — 현재는 null) |
| `video_file_name` | `varchar` | `payload.video_file_name` |
| `video_uri` | `text` | (외부 스토리지 URI — 현재는 null) |
| `stream_id` | `varchar` | 〃 |
| `global_seq` | `bigint` | 〃 |

`★ 설계 의도`
- 3D PCD 파일(`3D_image_file_name`)은 현재 컬럼이 없음 — 3D 검색이 필요해지면 컬럼 추가 또는 별도 read-* 테이블 신설.
- `*_uri`는 비어 있어도 `*_file_name`만으로 로컬 `data/toy-data/`·`data/toy-video/` 경로로 해석 가능 → 외부 스토리지 도입 전·후 모두 호환.
- 파일명 ↔ 비디오 N:1 관계(`활용데이터구조.md` §11) 때문에 RAG 인덱스를 만들 때 비디오 단위로 dedup이 필요. 현 스키마는 attempt 단위라 dedup은 application layer 책임.

### 6.3 `projection_cursor` — Read 동기화 워터마크

`src/shared/database/schema/projection-cursor.ts`:

| 컬럼 | 타입 | 의미 |
|---|---|---|
| `projector_name` (PK) | `varchar` | 예: `"grip-result-projector"`, `"multimodal-projector"` |
| `last_event_seq` | `bigint` (default 0) | 마지막으로 처리한 `event_store.global_seq` |
| `updated_at` | `timestamptz` (default now) | 마지막 진행 시각 |

`★ Self-Adaptive Loop 관점`
- 연구계획서의 "Read Model Adaptive Loop"는 이 cursor를 보고 *어디서 끊겼는지*, *얼마나 밀렸는지*(`max(global_seq) − last_event_seq`)를 측정해 Read Model을 재구성·재투영·확장할 수 있게 한다.
- projector마다 독립 cursor를 가지므로 Insight EE용 뷰와 World Model용 뷰가 서로 다른 속도로 catch-up 가능.

---

## 7. 현재 적재 흐름 (실행 시점에 일어나는 일)

`src/insert/insert.service.ts: ingestToyData()` 한 사이클:

```
data/toy-data/ 디렉터리 스캔 → *.json 만 필터, 파일명 정렬
└─ for each file
   ├─ ① parseToyDataFileName(file)
   │     → { categoryPrefix, cameraCode, objectName, sceneNum,
   │         attemptNum, capturedDate, sceneKey }
   ├─ ② fs.readFile + JSON.parse
   ├─ ③ toyDataSchema.parse(...)      ← Zod 검증, 실패 시 catch
   ├─ ④ eventStore.append({
   │       streamId: `grip-attempt:${sceneKey}`,
   │       attemptNum, eventType: "GripAttemptRecorded",
   │       occurredAt: capturedDate, payload: parsed,
   │     })
   │     → DB: INSERT ... ON CONFLICT (stream_id, attempt_num) DO NOTHING
   │            RETURNING global_seq
   │     → 신규: globalSeq 반환 → inserted++
   │       중복: null 반환             → skipped++
   └─ 실패: result.failed[]에 reason 누적, 다음 파일로 계속
```

리턴값:

```ts
type IngestResult = {
  totalFiles: number;
  inserted: number;
  skipped: number;
  failed: { file: string; reason: string }[];
};
```

`★ 흐름 포인트`
- 검증·식별자 추출·적재가 **파일 1개 단위**의 try/catch로 묶여 있어, 한 JSON이 깨져도 나머지는 계속 처리된다.
- 멱등성은 DB UQ + `onConflictDoNothing`이 책임. 같은 디렉터리를 두 번 ingest해도 두 번째는 전부 `skipped`로 떨어진다.
- 이 시점에서 Read Model에는 **아직 아무것도 들어가지 않는다** — 향후 Projector가 별도로 event_store를 읽고 채울 예정.

---

## 8. 주의사항 & 리스크

- **`event-store.repository.impl.ts`가 사실상 `.repository.ts` 안의 `DrizzleEventStoreRepository`와 중복.** 두 파일 모두 `EventStoreRepositoryImpl` / `DrizzleEventStoreRepository` 라는 다른 클래스명을 갖지만 동작은 동일하다. `.impl.ts`의 `implements EventStoreRepositoryImpl`은 자기 자신을 implements하는 **순환 implements**가 되어 의미가 없음 — `EventStoreRepository` 인터페이스를 implements하도록 수정하거나, 한쪽 파일을 제거하는 정리가 필요.
- **`*.ts` 파일들의 `// biome-ignore lint/suspicious/noExplicitAny`**: Drizzle의 `PgTableWithColumns<any>` 캐스팅은 jsonb 컬럼이 들어간 테이블 타입을 Drizzle이 자동 추론하기 어려워서 도입된 회피책이다. 프로젝트 규칙(`CLAUDE.md §2`)은 `any` 금지지만 이건 schema 정의의 외부 라이브러리 한계로, 코드 작성 시점이 아니라 schema 선언 시점의 어쩔 수 없는 경우. **새로운 코드를 쓸 때는 절대 따라하지 말 것.**
- **Zod 스키마는 핑거그리퍼 전용.** 흡착그리퍼 JSON(`grip_2d_pose = {x,y}`)이 섞이면 ingest 단계에서 실패한다. `data/toy-data/`가 현재 100% 핑거그리퍼라는 전제가 깨지는 순간 `toyDataSchema`를 `z.discriminatedUnion`으로 바꿔야 한다.
- **`read_grip_result.object_name`의 출처 미확정.** 파일명에서 뽑은 `objectName`(파일명 토큰)과 JSON 안의 `objects[0].class_name`이 동일하다고 보장되지 않으면 projector에서 어느 쪽을 권위 소스로 쓸지 결정해야 한다. 현 데이터 샘플로는 같지만, 잡음을 대비해 둘을 비교·로깅하는 단계가 projector에 필요할 수 있다.
- **`projection_cursor` 갱신 트랜잭션 미설계.** projector 구현 시 `read_*` INSERT와 `projection_cursor.last_event_seq` 갱신을 같은 트랜잭션으로 묶어야 at-least-once → effectively-once를 만들 수 있다. 향후 projector 구현 가이드에서 다룰 사항.

---

## 9. 한 줄 요약

> **파일명에서 식별자, JSON 내용은 jsonb 통째 → `event_store` (Write 끝). 이후 Read Model 두 갈래(`read_grip_result`=Insight EE 정형 / `read_multimodal`=World Model 멀티모달)는 projector가 catch-up하며 채우고, 그 진행 위치는 `projection_cursor`가 기록한다.**

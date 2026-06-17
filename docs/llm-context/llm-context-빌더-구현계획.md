# LLM 컨텍스트 빌더 구현 계획 (Insight Read DB + Event Log → Markdown Context → LLM 판정)

> **문서 성격**: 구현 계획 문서. "LLM이 어떻게 이상을 **판정**하도록 컨텍스트를 만드는가"의 청사진이다.
> **작성 기준**: `CLAUDE.md` 연구 다이제스트 + 짝 설계 문서 2종
> (`docs/log-event/llm-context-log.md`, `docs/insight-read-db/insight-read-db-설계.md`) + 본 라운드 설계 대화.
> **이전 판과의 차이**: 결정적 임계 detector(표준 `TriggerType` 유니온 + threshold 룰)와 **사람이 박은 게이트 필터(`failureActions`)** 를 **모두 폐기**하는 것은 유지한다.
> 그 위에 두 가지를 더한다: (a) **선판단 LLM을 트리거로 도입** — 트리거가 "모든 드레인 배치"가 아니라 **"싼 선판단 LLM이 문제를 발견했을 때"** 가 된다. (b) **LLM 실행(선판단 + langchain 분석)을 본 문서 범위로 편입** — 이전 판이 "다음 라운드"로 미뤘던 판정 실행까지 본 문서가 다룬다.
> 임계로 "이상이다/아니다"를 코드가 판정하던 구조를, **Kafka 토픽(영속 배치 큐) → 배치 드레인(운반, 의미 판단 없음) → 선판단 LLM(싼 선별 = 트리거) → 트리거 시 컨텍스트 조립 → langchain 심층 분석 LLM(3출력)** 의 2단계 LLM 구조로 갈아엎는다.

---

## Context

Self-Adaptive CQRS 연구의 핵심 질문은 **"LLM이 무엇을 컨텍스트로 받아 Read Model을 자가 적응적으로
바꾸는가"**다. 본 계획의 결정: **이상 판정 자체를 LLM에 맡긴다.** 코드는 임계로 판정하지 않고,
**판정에 필요한 컨텍스트만** 잘 조립해 LLM에 넘긴다. 단 LLM은 **2단계**로 일한다 — ① 싼 **선판단 LLM**이
드레인 배치를 훑어 "문제?"를 1차 선별(= 트리거)하고, ② 트리거 시 조립된 컨텍스트로 무거운 **분석 LLM**이
이상을 확정하고 3출력을 낸다. 본 계획은 이 두 LLM **실행까지** 다룬다. 컨텍스트는 두 소스에서 만들어진다.

- **(1) Insight Read DB** (`src/insight`): "도메인이 실제로 어떻게 생겼나" — 현재 제공 중인 Read Model·원천
  Event의 스키마. LLM 판정의 **사실 기반(grounding)**. (RAG에서 retrieval로 주입하는 지식에 해당.)
- **(2) Event Log** (`src/log-collector`, `src/shared/logger`): "지금 무엇이 터졌나" — 이상 신호. 단,
  **단일 에러 줄이 아니라 그 줄의 위아래 ±N줄(주변 맥락 윈도우)**을 증거로 쓴다.

설계 문서는 컨텍스트 구조를 정의했으나, 둘을 조합해 **LLM 판정용 컨텍스트를 만드는 모듈은 아직 없다.**
`InsightService.renderAllCards()`(카드→마크다운)와 `log_event` 적재는 존재하지만, 둘을 묶어
LLM 입력을 만드는 코드가 비어 있다. 본 계획은 신규 **`src/llm-context` 모듈**로 그 구멍을 채운다.

### 목표 사용 흐름

```
[생산]      로그 생산자 N개 ──produce──▶ Kafka 토픽(log-events) ──▶ writer 컨슈머 ──▶ log_event(hypertable)
                                                                                  └▶ continuous aggregate(빈도 롤업)
[1 선판단]  컨슈머 배치 드레인(운반) + 빈도 롤업 요약 ──▶ 싼 선판단 LLM "문제?"(순서 이상 + 반복/빈도 이상) ──┐
                                                                              (문제 발견 = 트리거)          │
[2 컨텍스트] 트리거 ──────────────────────────────▶ Insight 스키마(§1) + log_event ±N 윈도우(§2) + 빈도 요약 ▶ 컨텍스트 .md
[pull]      사용자 요청 ──────────────────────────▶ Insight 스키마(§1) + 사용자 요청(§3)                   ▶ 컨텍스트 .md
[3 분석]    LangChain PromptTemplate(역할+3출력 지시) + .md(로그 + Insight DB 사실) ▶ 분석 LLM ▶ 권고(3출력) 생성
```

이 구조는 **2단계 LLM**이다 — 싼 선판단(이상 탐지) → 무거운 분석(권고 생성). Kafka 컨슈머(드레인)는 여전히 "이상인가?"를
판정하지 **않는다.** 단지 토픽에 쌓인 로그를 **의미 판단 없이** 배치로 드레인할 뿐이다. **이상 탐지는 컨슈머가 아니라
그 뒤의 싼 LLM**이 한다 — 단 빈도/반복 같은 **개수 세기는 LLM이 아니라 집계(continuous aggregate)가** 하고, 선판단 LLM은
그 **요약을 받아 "이게 비정상인가"를 해석**한다(카운팅은 DB, 판단은 LLM). 트리거되면 **(2차) 분석 LLM이 로그 + Insight DB를
보고 사용자가 원하는 권고(3출력)를 생성**한다. 비용은 게이트 임계가 아니라 **(a) 선판단의 배치 크기 + poll 주기 + (b) 선판단이
트리거한 경우에만 무거운 분석이 도는 2단 구조**로 통제한다.
(이전 판의 `threshold≥0.5` 하드 임계, per-Read-Model 룰 레지스트리는 모두 폐기 — 아래 §판정 메커니즘 참조.)

### 범위

- ✅ **컨텍스트 마크다운(.md) 산출** — 내부는 타입 있는 구조체로 조립하되, LLM 주입물은 마크다운.
- ✅ **.md는 '사실'만** (도메인 스키마 / 이상 로그 윈도우 / 사용자 요청). **역할·3출력 지시는 .md에 넣지 않음** → LangChain 프롬프트 템플릿이 담당.
- ✅ **출력 = 파일 저장 + 엔드포인트 응답 둘 다.**
- ✅ **경로 push(선판단 LLM 트리거) + pull(사용자 요청) 둘 다.**
- ✅ **Kafka 토픽 + `llm-context` 컨슈머 그룹(배치 드레인)** — 본 모듈의 입력 경로. 브로커는 Kafka 호환 단일 바이너리 **Redpanda** 권장.
- ✅ **선판단 LLM(1단계 = 트리거)** — 드레인 배치를 싼 모델로 훑어 "문제?" 1차 판정. 트리거 verdict 산출.
- ✅ **langchain 심층 분석 LLM(3단계) + 3출력 실행** — 컨텍스트 .md(로그 + Insight DB)를 받아 **권고 생성**: ① 버전 교체 / ② 권고 문서 / ③ 신규 Read Model 중 택1 산출. (이전 판은 "다음 라운드"였으나 본 판에서 편입.)
- ✅ **±N 윈도우(§2)는 `log_event` hypertable 질의로 생성** — 파일 tail 아님(Kafka는 운반, hypertable은 윈도우 질의).
- ⚠️ **적재 경계(로그 생산자 → 토픽 → writer 컨슈머 → `log_event`)** 는 엄밀히 본 모듈 밖이지만, Kafka 도입에 수반되는 변경이라 §파일 목록에 함께 기록한다.
- ❌ 범위 밖: `continuous aggregate` 정의 SQL(Timescale 결정 문서 소관), Kafka exactly-once·파티셔닝/복제 튜닝·lag 모니터링·dead-letter 토픽, TimescaleDB 마이그레이션, 닫힌 고리(출력 ③ → 신규 Read Model 자동 등록).
  → 본 문서는 **선판단 LLM(트리거) → 컨텍스트 빌더 → langchain 분석(3출력)** 까지의 판정 파이프라인 전체를 다룬다.

---

## 설계 근거 (논문) — 두 축

본 설계의 두 결정("컨텍스트를 어떻게 잘 만드나" / "왜 LLM이 주변 윈도우로 판정하나")은 각각 논문 근거를 갖는다.
arXiv ID는 실제 페이지로 검증함.

### 축 A — 컨텍스트를 "잘" 만드는 법 (포맷 + grounding)

| 발견 | 출처 | 설계 반영 |
| --- | --- | --- |
| **JSON-mode 강제 시 추론력 유의하게 저하**, free-form/마크다운이 추론 보존 | Tam et al. 2024, *Let Me Speak Freely?* (arXiv 2408.02442) | LLM 주입은 마크다운. JSON은 내부 표현으로만. 판정 출력도 free-form/마크다운 권고. |
| 포맷 민감도는 **모델 크기 의존** — 작은 모델(GPT-3.5급)은 포맷에 따라 최대 40% 출렁, 마크다운이 추론에 유리 | He et al. 2024, *Does Prompt Formatting Have Any Impact?* (arXiv 2411.10541) | 10B 로컬 모델은 포맷 영향이 큼 → 마크다운 고정 + 템플릿을 실측 검증(§검증). |
| **표 데이터의 직렬화 방식**(포맷·정렬·구분)이 LLM 이해도를 좌우 | Sui et al. *Table Meets LLM* (arXiv 2305.13062) | §1 스키마·§2 로그 윈도우 모두 **마크다운 파이프 표**로 렌더(기존 카드 형식 유지). |
| **검색된 사실 컨텍스트를 주입하면 생성의 사실성↑** (RAG의 비모수 메모리) | Lewis et al. *RAG* (arXiv 2005.11401, NeurIPS 2020) | Insight Read DB 스키마(§1)를 판정 전에 grounding으로 주입 = RAG의 retrieval 단계에 해당. |

### 축 B — 왜 "LLM이 주변 윈도우로 판정"하나

| 발견 | 출처 | 설계 반영 |
| --- | --- | --- |
| **단일 로그 줄은 의미가 없다** — LSTM이 직전 *m*개 로그 키 시퀀스(슬라이딩 윈도우)로 다음 키를 예측, 벗어나면 이상 | Du et al. *DeepLog* (ACM CCS 2017) | "주변 ±N줄 윈도우"의 직접 근거. 단일 줄이 아니라 **드레인 배치(시간 연속 슬라이스)** 를 증거로 사용. |
| **시퀀스 이상 + 정량(빈도) 이상**을 세션 윈도우에서 함께 탐지 | Meng et al. *LogAnomaly* (IJCAI 2019) | §2 윈도우에 **순서(시간순 줄) + 빈도 요약**(같은 에러 N회)을 함께 실어 LLM에 제공. |
| 윈도우 단위 표현은 **로그 템플릿 드리프트(배포로 로그가 바뀜)에 강건** | Zhang et al. *LogRobust* (ESEC/FSE 2019) | 단일 줄 매칭 대신 윈도우를 넘김 → 서비스 변경에도 컨텍스트가 안정. |
| **LLM이 결정적 베이스라인보다 우수 + 해석 가능한 판정** 산출(BGL·Spirit) | Qi et al. *LogGPT* (arXiv 2309.01189) | 임계 detector 폐기, LLM이 "왜 이상인지"까지 판정하게 하는 방향의 근거. |
| **싼 전처리(regex/BERT) + LLM 분류**의 2단 구조가 SOTA | Guan et al. *LogLLM* (arXiv 2411.08561) | 본 설계도 2단 구조 — **싼 선판단 LLM(1차 이상 탐지=트리거) + 무거운 분석 LLM(2차 권고 생성=3출력)**. LogLLM의 "싼 전처리 + LLM 분류"에 직접 부합(차이점: 1차 탐지도 코드 룰이 아니라 LLM). Kafka 배치 드레인은 그 앞단의 운반. |
| **RAG로 도메인 컨텍스트를 주입**해 라벨 없이 로그 이상 판정 | Pan et al. *RAGLog* (arXiv 2311.05261, ICWS 2024) | 우리와 동일: Insight 스키마를 retrieval로 주입 → LLM이 신규성 판단. 가장 가까운 선례. |
| **컨텍스트 프롬프트의 구조**가 (모델 크기·파인튜닝보다) 품질의 1차 레버, 오픈소스 소형 LLM에서도 작동 | Liu et al. *LogPrompt* (arXiv 2308.07610, ICPC 2024) | 컨텍스트 .md 설계에 투자하는 것의 정당화. 10B 로컬 모델로 충분. |

> 종합: 컨텍스트 .md는 **(축 A) 마크다운·표·RAG grounding 원칙**으로 만들고, **(축 B) 이상 신호는 단일 줄이
> 아니라 주변 윈도우 + 빈도로** 싣는다. 판정은 LLM이 한다.

---

## 큐/전송 인프라 — 왜 Kafka인가

본 모듈의 입력 로그는 단발이 아니라 **Physical AI 도메인의 고빈도 스트림**(로봇·센서 텔레메트리, 피크 시 초당 수만
이벤트 규모)에서 파생된다. 이 스트림을 LLM 판정으로 잇는 **전송 계층으로 Kafka**(연구 환경에서는 Kafka 호환 단일
바이너리인 **Redpanda** — Zookeeper 불필요, 도커 1개)를 둔다. 이전 라운드에서 검토한 "테이블+커서" 단순안 대신
Kafka를 채택한 근거는 다음과 같다.

### 채택 근거 (6가지)

1. **Firehose 쓰기 흡수 (생산자 ≫ 소비자).** 현행 적재는 `log.json` 파일을 byteOffset로 tail하는
   단일 파일·단일 라이터 구조(`src/log-collector/log.service.ts:43-99`)다. 초당 수만 건에서는 파일 회전·단일 호스트가
   병목이 된다. Kafka는 파티션 분할 + 디스크 기반 순차 쓰기로 수십만~수백만 건/초를 받아낸다.
2. **느린 LLM 소비자 + 큰 lag 허용.** 2단계 LLM 모두 소비가 느리다 — 1차 선판단 LLM은 싸도 배치마다 추론이 들어가 피크
   firehose를 완전히는 못 따라잡고, 2차 분석 LLM(10B)은 한 배치 권고 생성에 수 초가 걸린다(단, 분석은 **트리거된 경우에만** 돈다).
   "빠른 생산자 + 느린 소비자 + lag 누적 OK"는 Kafka의 정석 패턴이다. 토픽이 retention 기간 동안 데이터를 보존하므로
   느린 컨슈머가 데이터를 잃지 않고 **자기 속도로** 소비한다 — 2단 구조라 오히려 lag 허용 요건이 강해진다.
3. **재생 가능성(replay).** 컨슈머 그룹의 offset만 되돌리면 과거 로그를 LLM에 **재투입**할 수 있다(예: 개선된 프롬프트로
   과거 구간 재판정). 파일 tail은 깔끔한 재생이 어렵다.
4. **다중 소비자 디커플링.** 같은 토픽을 **writer 컨슈머**(→ `log_event` 적재)와 **llm-context 컨슈머**가 독립
   컨슈머 그룹으로 각자 소비한다. LLM 소비자를 붙여도 적재 경로를 건드리지 않는다(생산자/소비자 완전 분리).
5. **컨슈머 그룹 offset = 내장 커서.** Kafka가 그룹별 offset을 영속 관리하므로, 이전 안에서 추가하려던 별도
   `llm_log_cursor` 테이블이 **불필요**해진다. 백프레셔·lag이 1급 관측 지표로 제공된다.
6. **영속성·HA.** 파티션 복제로 단일 호스트 장애를 견딘다. 단일 로그 파일 대비 내구성이 구조적으로 높다.

### 대안을 버린 이유 (Redis / BullMQ)

- **BullMQ ❌ — 카테고리가 다름.** BullMQ는 *job 큐*(개별 작업 + 재시도/우선순위)다. job당 Redis 자료구조 오버헤드가
  붙어 초당 수만 건의 텔레메트리 firehose에는 Redis가 먼저 무너진다. 처리량 흡수 목적엔 잘못된 도구.
- **Redis Streams △ — 가벼운 절충이지만 탈락.** `XADD/XREADGROUP` + `MAXLEN`으로 빠른 바운디드 버퍼는 되나,
  RAM 바운드라 보존·내구성이 약하다. Physical AI 규모의 영속 버퍼·재생 요건에는 디스크 기반 Kafka가 정합.

### Kafka ↔ TimescaleDB 역할 분담 (경쟁이 아니라 보완)

Kafka가 hypertable·continuous aggregate를 **대체하지 않는다.** 둘은 서로 다른 층을 맡는다.

| 층 | 담당 | 역할 |
| --- | --- | --- |
| **전송/버퍼 (in-flight)** | **Kafka 토픽** | firehose 흡수, lag 허용, 재생, 다중 컨슈머 분리 |
| **분석 저장 (at-rest)** | **`log_event` hypertable** | §2 윈도우/±N 주변 **질의**, 시간 범위 스캔(chunk exclusion) |
| **요약 (precompute)** | **continuous aggregate** | §2 빈도 롤업("최근 1h `db.error` 4회")을 firehose 규모에서 싸게 |

> 즉 **Kafka가 받아내고(운반) → writer가 hypertable에 질의 가능한 형태로 보존 → continuous aggregate가 빈도를
> 미리 굴려두고 → llm-context 컨슈머가 배치를 드레인**한다. §2의 "이상 로그 맥락"은 스트림(Kafka)이 아니라
> **질의 가능한 저장소(hypertable)** 에서 만든다 — Kafka는 시퀀스 운반, hypertable은 윈도우 질의.

> **솔직한 트레이드오프**: Kafka/Redpanda는 새 인프라이며 운영 부담(브로커·토픽·파티션 관리)이 있다. 이 비용은
> **Physical AI firehose 규모 가정** 위에서만 정당화된다. 연구 데모를 저빈도로 돌리더라도, 아키텍처를
> *scale-defensible* 하게 두기 위한 선택이다(소규모에서는 단일 파티션 1개로 시작해도 무방).

---

## 판정 메커니즘 (본 문서의 핵심)

"코드가 어디까지 하고, LLM이 무엇을 판정하는가"의 경계를 4단계로 명확히 한다. **코드 = (1) 운반 + (3) 컨텍스트 조립(빈도 카운팅 포함)**,
**LLM = (2) 싼 선판단=이상 탐지(트리거) + (4) 무거운 분석=권고(3출력) 생성**. 즉 LLM이 두 번 등장하는 2단계 구조다 — 탐지는 (2), 권고는 (4).

### (1) Kafka 컨슈머 배치 드레인 — 의미 판단 없음 (코드가 함). "판정"이 아니라 "운반"

무거운 분석 LLM을 모든 로그마다 돌릴 수 없으므로, 로그는 Kafka 토픽에 영속 버퍼링되고 llm-context 빌더는 **독립 컨슈머
그룹**으로 배치를 드레인한다. 이 단계는 **의미 판단을 하지 않는다** — 이전 판의 `failureActions` 같은 사람이 박은
이상 목록을 **완전히 제거**한다. 컨슈머는 들어온 레코드를 그대로 배치로 모으고, "이게 이상인가"의 선별은 다음 단계의
선판단 LLM이 한다. 설정은 도메인 비종속 **소량 상수**다.

```ts
// kafka/log-consumer.config.ts — 컨슈머 설정(타입 있는 상수, any 금지)
const LOG_CONSUMER_CONFIG = {
  topic: "log-events",
  groupId: "llm-context-builder",     // 독립 컨슈머 그룹 = 독립 offset(= 커서). 별도 커서 테이블 불필요
  maxBatchSize: 500,                  // 한 번에 LLM에 넘길 최대 레코드 — 토큰 통제 손잡이
  pollIntervalMs: 5 * 60_000,         // 주기 드레인(0이면 연속 소비). 트래픽 적으면 시간이, 폭주하면 maxBatch가 끊음
} as const;
```

- 드레인 = 토픽에 쌓인 레코드를 `maxBatchSize`까지 시간순으로 가져오는 것. **선별·필터 없음.**
- **비용 통제** = `maxBatchSize` + `pollIntervalMs` (선판단 입력량 통제) + 무거운 분석은 **트리거 시에만** 도는 2단 구조 (이전 판의 게이트 임계·per-Read-Model 룰 레지스트리를 대체).
- **dedup**: Kafka offset이 단조 증가하므로 같은 레코드를 두 번 선판단에 먹이지 않는다 — **구조적 dedup**(이전 판이
  cooldown으로 막던 "한 사고로 컨텍스트 100개" 문제가 offset만으로 해소). 사고가 배치 경계에 걸치는 경우만 선판단층의 가벼운 문제로 남는다.

### (2) 선판단 LLM — 싼 이상 탐지 = 트리거 (LLM이 함). 1차 판정, 본 모듈 범위 안

**입력 = (a) 드레인된 raw 배치 + (b) 빈도 롤업 요약(continuous aggregate)** 을 **싼 LLM**(작은 모델 / 짧은 프롬프트)에
넘겨 **"이 구간에 들여다볼 문제가 있나?"** 만 가볍게 1차 판정한다. "문제 있음"이 나오면 그것이 **트리거**가 되어 (3) 컨텍스트
조립을 깨운다. 트리거가 아니면 배치는 버려진다(offset만 전진).

- **잡으려는 두 종류의 이상**: ① raw 배치의 **순서/시퀀스 이상**(DeepLog), ② **반복/빈도 이상**(LogAnomaly) — 예: "같은 요청이 평소 5회/분인데 487회".
- **카운팅은 LLM이 아니라 집계가 한다**: "몇 번 들어왔나"의 *세기*는 LLM의 약점(산수)이라 **continuous aggregate가 정확·즉시·싸게** 미리 굴려두고, 선판단 LLM은 그 **압축 요약을 받아 "이 수치가 비정상인가"만 해석**한다. 그래서 raw 500줄을 LLM에 던져 세게 하지 않는다 — 요약 해석은 싼 모델도 안정적이다(He et al.의 포맷 출렁임은 *복잡한 추론*에서지 *압축 숫자 비교*에서가 아님).
- 선판단은 **분류·확정이 아니라 선별**이다 — false positive를 여기서 다 거를 필요 없다. 빠뜨리지 않는 쪽(recall)에 기울인다.
- **비용 핵심**: 무거운 분석(10B + 풍부한 컨텍스트)을 firehose 전체가 아니라 **선판단이 통과시킨 구간에만** 적용 → 토큰/지연 비용을 트리거 빈도로 압축.
- **트리거 정의**: push 경로의 트리거 = **선판단 LLM verdict**(코드 임계·게이트 아님). 트리거 레코드(들)의 위치·`correlationId`를 (3)에 넘겨 ±N 윈도우를 가리킨다.

### (3) 트리거 시 컨텍스트 조립 — 증거 (코드가 함). DeepLog/LogAnomaly 근거

선판단이 트리거한 배치는 **시간 연속 슬라이스**라 그 자체가 윈도우다(단일 줄이 아니라 시퀀스). DeepLog의 "직전 m개
로그 키 시퀀스(슬라이딩 윈도우)"와 동형. 단, §2 표/빈도의 실제 콘텐츠는 **질의 가능한 저장소(`log_event` hypertable)**
에서 만든다 — Kafka는 시퀀스 운반, hypertable은 윈도우 질의(역할 분담은 §큐/전송 인프라 참조). 선판단이 가리킨
트립 레코드의 위치·`correlationId`를 기준으로 ±N 윈도우를 조립한다.

- **순서**: 배치는 시간순(Kafka 파티션 내 순서 보존). 표는 `time` 순으로 렌더.
- **±N 주변/관련성 정제(선택)**: 특정 레코드의 위아래 ±N행 또는 같은 `correlationId`(동일 요청 트레이스)·`streamId`는
  `log_event`를 질의해 보강. Phase 1은 **드레인 배치 자체를 윈도우로** 쓰고, ±N 정제는 트립 레코드에 `correlationId`가
  있을 때만 적용.
- **빈도 요약 동봉**(LogAnomaly): firehose 규모에서 매번 집계하면 비싸므로, **continuous aggregate**(Timescale 결정
  §4.4)에서 "최근 N시간 `action`/`level`별 횟수" 롤업을 싸게 읽어 한 줄로 동봉. (Phase 1에 continuous aggregate가
  아직 없으면 `log_event` 위 범위 집계 쿼리로 폴백.)

### (4) langchain 심층 분석 LLM — 권고(3출력) 생성 (LLM이 함). 본 모듈 범위 안

이상 탐지는 (2)에서 끝났다. (4)의 역할은 **단지** (3)이 조립한 컨텍스트 .md(**로그 §2 윈도우 + Insight DB 스키마 §1**,
pull이면 §3)를 보고 **사용자가 원하는 권고 형태(3출력)를 만들어주는** 것이다. **LangChain PromptTemplate**(역할 + 3출력
지시)에 .md를 실어 **무거운 분석 LLM**(10B)에 넘기면, LLM이 로그(무엇이 터졌나)와 Insight DB(도메인이 어떻게 생겼나)를
대조해 3출력 중 무엇이 맞는지 산출한다:

1. **① 버전 교체** — 기존 Read Model의 다른 버전으로 스위치
2. **② 권고 문서** — 어떤 Read Model을 어떻게 보강할지 가이드
3. **③ 신규 Read Model** — 요청을 만족하는 새 Read Model 구성

> 정밀 확정은 (4)가 권고를 만드는 과정에서 자연히 일어난다 — 컨텍스트를 보고 정작 손댈 게 없으면 "조치 불필요"를 낼 수 있다(선판단의 false positive를 흡수하는 안전판). 단 (4)의 1차 책임은 *재판정*이 아니라 **권고 생성**이다.

> 본 판은 이 실행(LangChain + 분석 LLM 호출 + 3출력 산출)까지 **범위에 포함**한다. 단 역할·3출력 지시는 .md가
> 아니라 **프롬프트 템플릿**이 담는다(Tam et al. 근거로 사실/지시 분리). 그래서 §2는 **권고 생성을 위해** 설계된다 —
> 순서·빈도·주변 맥락을 싣는다. (출력 ③의 신규 Read Model을 InsightDB에 **자동 등록**하는 닫힌 고리는 범위 밖.)

### 경로별 채워지는 섹션

| 경로 | 트리거 | §1 스키마 | §2 이상 로그 윈도우 | §3 사용자 요청 |
| --- | --- | --- | --- | --- |
| **push** | **선판단 LLM이 문제 발견**(드레인 배치를 싼 모델로 선별) | ✅ | ✅ (트리거 구간 ±N 윈도우 + 빈도) | — |
| **pull** | 사용자 요청 | ✅ | — | ✅ |

---

## 컨텍스트 .md 섹션 구조 (사실만, 지시 미포함)

```markdown
# Self-Adaptive CQRS — LLM Context

## 1. 도메인 스키마 (Insight Read DB)
   ← InsightService.renderAllCards() 마크다운 카드 그대로 (read_grip_result, read_multimodal, GripAttemptRecorded)
   ← 항상 포함. LLM 판정의 grounding (RAG retrieval에 해당).

## 2. 이상 로그 맥락 (Event Log)        ← (push) 선판단이 가리킨 트립 줄 + 위아래 ±N줄 마크다운 표 + 빈도 요약 1줄
## 3. 사용자 요청                       ← (pull) userRequest.text
```

> §1은 항상. §2는 push, §3은 pull. **역할·3출력 지시는 .md에 없음**(LangChain 담당) — Tam et al. 근거로 사실/지시 분리.

§2 예시(파이프 표 — Sui et al. 근거):

```markdown
## 2. 이상 로그 맥락
> 빈도: 최근 1h 윈도우에서 `db.error` 4회, `projection.map.failed` 1회.

| time | level | action | correlation_id | msg |
| --- | --- | --- | --- | --- |
| 12:00:01 | info  | projection.start      | abc | ... |
| 12:00:02 | error | db.error              | abc | connection reset |   ← 트립 줄
| 12:00:02 | warn  | projection.map.failed | abc | ... |
```

---

## 신규/수정 파일 (`src/insight` 모듈 구조를 모사)

### 신규 (`src/llm-context/`)
| 파일 | 책임 |
| --- | --- |
| `llm-context.module.ts` | NestJS 모듈. `InsightModule` import(렌더 재사용), Kafka 컨슈머 + 선판단/분석 LLM + repository 토큰 provide |
| `llm-context.controller.ts` | `POST /llm-context/build`(pull, body=userRequest), `GET /llm-context/detect`(push **수동** 1회 드레인→선판단→분석 — 평소엔 컨슈머가 자동, 이건 디버그/테스트용). 둘 다 **.md 파일 저장 + 분석 결과(3출력) 응답** |
| `llm-context.service.ts` | 오케스트레이터: (push) 컨슈머 배치 → **선판단 LLM** → (트리거 시) §2 조립 → 렌더 → **분석 LLM(3출력)** / (pull) 요청 → 패킷 조립 → 렌더 → 분석 LLM. 파일 쓰기 + 반환 |
| `llm-context.type.ts` | 내부 패킷 zod 스키마 + 인터페이스. `LogConsumerConfig`·`AnomalyLogWindow`·`ContextPacket`·`PrejudgeVerdict` 타입 (표준 `TriggerType` 유니온은 **삭제**) |
| `llm-context.renderer.ts` | **타입 패킷 → 마크다운 문서**(사실만, §1–§3). §1은 `InsightService.renderAllCards()` 재사용 |
| `kafka/log-consumer.config.ts` | **컨슈머 설정 상수**(topic·groupId·maxBatchSize·pollIntervalMs). 타입 있는 상수, any 금지 |
| `kafka/log-consumer.ts` | **Kafka 컨슈머**: `log-events` 토픽 구독, 배치 드레인, offset 커밋. *판정 아님, 운반만* (이전 판 `gate/anomaly-gate.ts` 대체) |
| `screener/prejudge.ts` | **선판단 LLM(1차)**: (raw 배치 + 빈도 롤업 요약) → 싼 모델로 "문제?"(순서 이상 + 반복/빈도 이상) 1차 판정 → `PrejudgeVerdict`(트리거 여부 + 트립 레코드 위치/correlationId). *카운팅은 집계가, 해석만 LLM. 확정 아님, 선별만* |
| `screener/prejudge.config.ts` | 선판단 설정 상수(모델명·프롬프트·recall 편향). 타입 있는 상수, any 금지 |
| `analysis/analyzer.ts` | **분석 LLM(2차, langchain)**: 컨텍스트 .md → `LangChain PromptTemplate` + 분석 LLM 호출 → 3출력 산출 |
| `analysis/prompt-template.ts` | 역할 + 3출력 지시 프롬프트(.md 사실과 **분리**, Tam et al. 근거) |
| `analysis/output.type.ts` | 3출력 zod 스키마: ① 버전 교체 / ② 권고 문서 / ③ 신규 Read Model |
| `repository/log-window.repository.ts` | 인터페이스 + `LOG_WINDOW` 심볼 토큰 (기존 `INSIGHT_CATALOG` 패턴) |
| `repository/log-window.repository.impl.ts` | Drizzle: `log_event`에서 ① 선판단이 가리킨 레코드의 **±N행 주변 조회**(time 순, 선택적 correlationId) ② **빈도 집계**(continuous aggregate 우선, 없으면 범위 집계 폴백) |

> **삭제된 것(이전 판 대비)**: `detector/trigger-rule.ts`(threshold 룰 레지스트리), `detector/problem-detector.ts`
> (임계 판정기), `log-aggregate.repository`(불량비율 집계), **`gate/anomaly-gate.ts`(level/action 게이트 필터)**.
> 이상 판정을 LLM에 넘기고 전송을 Kafka에 맡기므로 임계 인프라 + 의미 판단 게이트가 통째로 불필요.
> **불필요해진 것**: 별도 `llm_log_cursor` 테이블 — Kafka 컨슈머 그룹 offset이 커서를 대신한다.

### 수정
| 파일 | 변경 |
| --- | --- |
| `src/app.module.ts` | `LlmContextModule` 등록 |
| `src/shared/logger/logging-context.ts` | 필요 시 `LogAction`에 `llm.context.built`·`llm.prejudge.triggered`·`llm.analysis.done` 등 추가 |
| `docker/docker-compose.yml` | **Redpanda(Kafka) 브로커 추가** (기존 TimescaleDB 컨테이너와 나란히) |
| `package.json` | Kafka 클라이언트(`kafkajs` 등) + **LangChain**(선판단/분석 LLM 호출) 의존성 추가 |

### 적재 경계 (본 모듈 밖이지만 Kafka 도입에 수반)
| 파일 | 변경 |
| --- | --- |
| 로그 생산자(pino) → 토픽 | pino → `log-events` 토픽 produce. **pino Kafka transport** 또는 기존 파일 tail(`log.service.ts`)을 토픽으로 흘리는 브리지 — 둘 중 택1(sub-decision). firehose면 transport 직결이 유리 |
| writer 컨슈머 → `log_event` | `log-events` 토픽을 소비해 hypertable에 배치 적재(현행 `LogService` 역할을 파일 tail → Kafka 컨슈머로 이관) |

### 출력 위치
- `src/llm-context/output/context-<correlationId|timestamp>.md` (경로는 사소, 변경 용이).
- 파일 쓰기는 `LogService`의 `fs.promises.writeFile` + `mkdir` 패턴 재사용.

---

## 재사용할 기존 자산 (신규 작성 금지)

- **`InsightService.renderAllCards()`** (`@/insight/insight.service`): **§1 도메인 스키마를 그대로 생성** — 마크다운 카드(키·타입·예시 포함). 가장 큰 재사용 지점.
- **`InsightCatalogRepository`** (토큰 `INSIGHT_CATALOG`): 필요 시 §1 `domainSummary`(name·purpose·kind) 구조화.
- **`DRIZZLE`** + 스키마: `logEvents`(트립 스캔·주변 윈도우 조회 대상), `eventStore` 등 (`@/shared/database/schema/...`).
- **`LogContext` / `LogAction`**: §2 로그 윈도우 표의 컬럼·action 라벨 출처(이전 판의 `failureActions` 필터는 폐기).
- **`PinoLogger`**, **경로 별칭 `@/*`**, **zod 검증 패턴**, **Node `fs`** (파일 쓰기).

---

## 구현 순서 (각 단계 검증 포함)

0. `docker/docker-compose.yml`에 Redpanda 추가 + `kafkajs`·LangChain 의존성 설치 + `log-events` 토픽 생성.
   → verify: 브로커 부팅, 토픽 생성, 콘솔 produce/consume 왕복 확인.
1. `llm-context.type.ts` — `LogConsumerConfig`·`AnomalyLogWindow`·`ContextPacket`·`PrejudgeVerdict` zod 스키마 + 인터페이스
   → verify: `tsc --noEmit` 통과, `any` 0건, 약어 식별자 0건.
2. `kafka/log-consumer.config.ts` + `kafka/log-consumer.ts` — 토픽 구독, 배치 드레인(maxBatchSize), offset 커밋
   → verify: 토픽에 N건 produce → 컨슈머가 시간순 배치로 받음, 재시작 시 마지막 offset부터 재개(누락·중복 0).
3. `repository/log-window.repository.{ts,impl.ts}` — ① **빈도 집계**(continuous aggregate 우선/범위 집계 폴백) + ② 트립 레코드의 ±N행 주변 조회(time 순). *선판단이 ①을 먼저 쓰므로 repo를 screener보다 앞에 둔다.*
   → verify: 빈도 합 일치, 트립 레코드 전후 N행이 시간순으로 조회됨, correlationId 있으면 정제됨.
4. `screener/prejudge.{ts,config.ts}` — (raw 배치 + repo의 빈도 롤업) → 싼 LLM "문제?" 1차 판정 → `PrejudgeVerdict`(트리거 여부 + 트립 위치/correlationId)
   → verify: 정상 배치는 트리거 안 됨, 실패 로그/빈도 급증("같은 요청 487회") 섞인 배치는 트리거됨(recall 편향), verdict에 트립 위치 포함.
5. `llm-context.renderer.ts` — 타입 패킷 → 마크다운(§1=renderAllCards 재사용, §2 윈도우 표+빈도, §3 요청; 지시 미포함)
   → verify: pull은 §1+§3, push는 §1+§2 채워진 .md 생성. 파이프 이스케이프 정상.
6. `llm-context.service.ts` — (push) 컨슈머 배치→선판단→(트리거 시)윈도우→패킷 / (pull) 요청→패킷 → 렌더 → 파일 쓰기.
7. `llm-context.controller.ts` + `llm-context.module.ts` + `app.module.ts` 등록.
   → verify: 앱 부팅, 컨슈머 토픽 구독, 라우트 노출, .md 파일 + 응답 동시 생성.
8. `analysis/{prompt-template.ts,output.type.ts,analyzer.ts}` — 컨텍스트 .md → LangChain PromptTemplate(역할+3출력 지시) + 분석 LLM 호출 → 3출력
   → verify: 트리거된 .md를 분석 LLM에 넣어 3출력 중 하나가 `output.type` 스키마로 산출됨, false positive .md는 "문제 아님"으로 반려.

---

## 검증 (end-to-end)

1. **빌드/타입**: `tsc --noEmit`(또는 `bun run`) — 통과, `any`·약어 식별자 0건 (CLAUDE.md 규칙).
2. **pull(.md 생성)**: `POST /insight/seed` 후 `POST /llm-context/build`
   body `{ "userRequest": { "text": "객체별 실패율 추세를 보고 싶다" } }`
   → `output/*.md` 에 §1(카드) + §3(요청) 포함 확인. §2 없음.
3. **push(선판단 트리거 → .md)**: `db.error` 등 실패 로그를 `log-events` 토픽에 produce 후 컨슈머 드레인(또는 `GET /llm-context/detect`)
   → 선판단 LLM이 **트리거**되고, §2에 **트립 구간 ±N 윈도우 + 빈도 요약**이 시간순 표로 §1과 함께 채워진 .md 확인. (정상 로그만이면 트리거 안 됨 = .md 미생성도 확인.)
4. **분석(3출력) e2e**: 트리거로 생성된 .md를 langchain 분석 LLM에 투입 → ① 버전 교체 / ② 권고 문서 / ③ 신규 Read Model 중 하나가 `output.type` 스키마로 산출됨. false positive .md는 "문제 아님"으로 반려되는지도 확인.
5. **replay 검증**: 컨슈머 그룹 offset을 되돌린 뒤 재드레인 → 같은 배치가 재투입되어 동일 선판단·§2 생성(재생 가능성 확인).
6. **단위/통합 테스트**: 배치 드레인(maxBatchSize 경계·시간순), offset 재개(재시작 시 누락·중복 0), 선판단(정상=무트리거/실패=트리거, recall 편향), 윈도우 조회(±N 행 수·시간순), 빈도 집계 합.
7. **포맷 점검**: 생성된 .md를 로컬 10B 모델 또는 마크다운 뷰어로 열어 표/섹션이 안 깨지는지(He et al.·Sui et al. 근거로 포맷 실측).

---

## Out of Scope (다음 라운드)

> 선판단 LLM + langchain 분석(3출력) **실행은 본 판에 편입됨** — 더 이상 범위 밖이 아니다(§범위·§판정 메커니즘 (4) 참조).

- 선판단/분석 프롬프트의 정밀 튜닝·모델 파인튜닝·실측 벤치마크(본 판은 동작하는 1차 구현까지).
- §1 카드 관련성 선별(카드가 많아질 때 분량 제어), §2 윈도우 크기 자동 튜닝.
- TimescaleDB 확장/하이퍼테이블 마이그레이션 + `continuous aggregate` 정의 SQL(Timescale 결정 문서 소관).
- Kafka 운영 심화: exactly-once 시맨틱(현재 at-least-once), 파티셔닝/복제·consumer lag 모니터링·dead-letter 토픽.
- 닫힌 고리(출력 ③ → 신규 Read Model 자동 등록). 임계 룰을 폐기했으므로, 신규 Read Model은 §1 스키마(InsightDB)에
  등록되면 자동으로 다음 컨텍스트에 포함된다 — 별도 트리거 룰 등록 불필요(설계 단순화의 부수 효과).

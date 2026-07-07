# Self-Adaptive CQRS 성능 평가 계획 (초안)

> 논문의 성능 평가(Evaluation) 장을 위한 설계 문서.
> 비교 대상: **베이스라인(Docs 없음, 원본 로그만) vs 제안 시스템(LLM 생성 Docs 제공)**.
> 전제: 본 시스템은 `sensor-observer`/`llm-context` 스크리너가 로그·이벤트에서 이상을 탐지하고,
> `analysis` LangGraph 파이프라인(aggregate → data-quality → root-cause → decision → new-read-model → recommendation-docs → version-switch)이
> **권고 문서 + Read Model 생성 SQL + API Versioning**을 포함한 단일 Docs를 산출한다.

---

## 1. 평가 프레임: 3층 구조

"Docs 있음 vs 없음"을 하나의 실험으로 뭉뚱그리지 않고, 파이프라인 단계별로 3층으로 나누어 평가한다.

| 층 | 질문 | 주요 지표 |
|---|---|---|
| **층 1. 탐지(Detection)** | 스크리너(prejudge, sensor-screener)가 이상을 올바르게 판정하는가? | Precision / Recall / F1, False Positive Rate |
| **층 2. Docs 품질** | 생성된 Docs가 그 자체로 정확·실행가능한가? | SQL Execution Accuracy(자동), 루브릭 채점(LLM-as-Judge + 사람 검증, Cohen's κ 보고) |
| **층 3. 다운스트림 효과** | Docs가 Local LLM의 문제 해결을 실제로 돕는가? | Task Success Rate, pass@k, 대화 턴 수, 토큰 사용량, MTTR |

### 층 2 루브릭 (각 1~5점)

1. **근거 충실성(Groundedness)** — 로그/이벤트에 실제로 존재하는 내용에 기반하는가 (환각 없음)
2. **원인 진단 정확성** — 정답 원인(ground truth)과 일치하는가
3. **실행 가능성(Actionability)** — 권고를 따라 하면 실제로 문제가 해결되는가
4. **완결성** — 권고 문서 + SQL + API Versioning 3요소가 모두 유효하게 포함되는가

LLM-as-Judge로 전량 채점하되, 샘플 30%는 사람이 직접 채점하여 judge와의 일치도(Cohen's κ)를 함께 보고한다.

### 층 3 실험 조건 (같은 Local LLM, 같은 질의, 컨텍스트만 상이)

| 조건 | Local LLM에 주는 컨텍스트 | 역할 |
|---|---|---|
| **A** | 원본 로그만 | 베이스라인 (공정성 핵심: 로그는 동일하게 제공) |
| **B** | 생성된 Docs만 | 제안 시스템 |
| **C** | 원본 로그 + Docs | 결합 조건 (선택) |
| **D** | Docs에서 구성요소 제거 (SQL 제외 / API Versioning 제외 등) | Ablation — 3요소 각각의 기여 입증 |

### 통계 처리

- 시나리오당 **k회 반복**(권장 k=5, LLM 비결정성 대응) → **pass@k** 보고
- 성공/실패 이진 지표: **McNemar test** (paired)
- 점수형 지표: **Wilcoxon signed-rank test**
- 모든 지표는 평균 ± 표준편차와 함께 보고

---

## 2. Fault Injection 시나리오 세트 (초안, 23개)

각 시나리오는 다음을 갖춘다:

- **주입 방법**: 재현 가능한 스크립트/조작
- **정답 라벨**: 층 1 탐지 기대값 (이상 여부 + 유형)
- **기대 Docs**: 층 2 채점 기준이 되는 정답 요지
- **성공 기준**: 층 3에서 Local LLM 응답을 성공으로 판정하는 조건

난이도: ● 하 / ●● 중 / ●●● 상

### A. 이벤트·페이로드 이상 (Write 측, `insert` 모듈)

| ID | 시나리오 | 주입 방법 | 정답 라벨 | 기대 Docs 요지 | 난이도 |
|---|---|---|---|---|---|
| A1 | Payload Drift — 신규 필드 유입 | toy-data payload에 스키마에 없는 top-level 키(예: `gripper_temperature`) 추가 전송 | 이상 / payload-drift | 새 필드 수용을 위한 Read Model 컬럼 추가 SQL + API v+1 | ● |
| A2 | 알려진 필드의 타입 변화 | `grip_succeed`를 숫자 대신 문자열 `"true"`로 전송 | 이상 / type-mismatch | 파싱 실패 원인 지목, 타입 정규화 권고 | ●● |
| A3 | 필수 필드 누락 | `object_name` 없는 payload 전송 | 이상 / missing-field | zod 검증 실패 지점 지목, 대응 가이드 | ● |
| A4 | 물리적으로 불가능한 값 | `grip_2d_pose` 좌표에 NaN/음수·범위 밖 값 주입 | 이상 / out-of-range | 데이터 품질 이슈로 진단, 필터링/검증 권고 | ●● |
| A5 | 중복 이벤트 재전송 | 동일 `(stream_id, attempt_num)` 이벤트 2회 전송 → `uq_event_stream_attempt` 충돌 | 이상 / duplicate-event | 유니크 제약 충돌 원인 + 멱등 처리 권고 | ●● |
| A6 | 이벤트 시간 역행 | `occurred_at`이 이전 이벤트보다 과거인 이벤트 전송 | 이상 / out-of-order | 순서 보장 문제 진단, 정렬 기준(global_seq vs occurred_at) 권고 | ●●● |

### B. 프로젝션 장애 (Read 측, `projection` 모듈)

| ID | 시나리오 | 주입 방법 | 정답 라벨 | 기대 Docs 요지 | 난이도 |
|---|---|---|---|---|---|
| B1 | 프로젝션 커서 정지 | projection runner 중단 → `projection_cursor` 미전진, Read Model lag 증가 | 이상 / projection-lag | event_store 대비 read model 지연 진단, 커서 재가동 절차 | ●● |
| B2 | 특정 event_type 프로젝션 누락 | projector에 특정 `event_type` 처리 시 예외 발생하도록 조작 | 이상 / partial-projection-failure | 누락 event_type 특정 + 재프로젝션(replay) SQL/절차 | ●●● |
| B3 | Read Model PK 충돌 | `read_grip_result`에 동일 `(scene_key, attempt_num)` upsert 충돌 유발 | 이상 / write-conflict | 충돌 원인(중복 attempt) 진단, upsert 전략 권고 | ●● |
| B4 | Kafka consumer lag | consumer 일시 중지 또는 처리 지연 주입 | 이상 / consumer-lag | 적재 지연 진단, 소비 재개·오프셋 확인 절차 | ●● |

### C. 센서 이상 (`sensor-observer` 모듈)

| ID | 시나리오 | 주입 방법 | 정답 라벨 | 기대 Docs 요지 | 난이도 |
|---|---|---|---|---|---|
| C1 | 센서값 스파이크 | 정상 스트림 중간에 급격한 이상치 삽입 | 이상 / sensor-spike | 이상 구간 특정, 원인 후보 제시 | ● |
| C2 | 센서값 플랫라인(고착) | 동일 값이 비정상적으로 장시간 반복되도록 주입 | 이상 / sensor-stuck | 고착 감지 근거 + 점검 권고 | ●● |
| C3 | 샘플링 결측/주기 드리프트 | 일정 구간 샘플 누락 또는 주기 불규칙화 | 이상 / sampling-gap | 결측 구간 특정, 보간/재수집 권고 | ●●● |

### D. HTTP/API 요청 이상

| ID | 시나리오 | 주입 방법 | 정답 라벨 | 기대 Docs 요지 | 난이도 |
|---|---|---|---|---|---|
| D1 | 4xx 급증 | 검증 실패하는 payload를 단시간 대량 전송 | 이상 / client-error-burst | 실패 원인 필드 특정, 클라이언트 스키마 안내 | ● |
| D2 | 5xx — DB 연결 실패 | DB 커넥션 차단(컨테이너 일시 중지 등) | 이상 / server-error | 인프라 원인 진단, 복구 절차 | ●● |
| D3 | 응답 지연 급증 | 인위적 지연 주입(대량 동시 요청 등) | 이상 / latency-degradation | 병목 지점 추정, 완화 권고 | ●●● |

### E. Read Model 부적합 — Self-Adaptive 핵심 시나리오

> 본 연구의 우선 목표(Read Model 재생성)를 직접 검증하는 그룹. "이상"이라기보다 **새 조회 요구**가 트리거.

| ID | 시나리오 | 주입 방법 | 정답 라벨 | 기대 Docs 요지 | 난이도 |
|---|---|---|---|---|---|
| E1 | Drift 필드 조회 요구 | A1 이후 "새 필드(`gripper_temperature`)를 조회하고 싶다"는 사용자 요청 | 재생성 필요 / new-column | 컬럼 추가된 Read Model DDL + 백필 SQL + API v+1 | ●● |
| E2 | 집계 Read Model 부재 | "object_name별 그립 성공률을 보고 싶다" 요청 (기존 Read Model로 불가) | 재생성 필요 / new-aggregate | 집계 Read Model DDL(성공률 뷰/테이블) + 프로젝션 가이드 | ●● |
| E3 | 조인 Read Model 부재 | "그립 결과와 멀티모달(이미지/영상)을 한 번에 보고 싶다" 요청 | 재생성 필요 / new-join | `read_grip_result` ⋈ `read_multimodal` 통합 Read Model DDL | ●●● |
| E4 | 컬럼 변경에 따른 버전 전환 | 기존 컬럼 rename/제거가 필요한 요구 주입 | 재생성 필요 / breaking-change | 신구 병행 전략 + API 버전 전환 계획 | ●●● |

### F. 복합·노이즈 시나리오 (강건성 검증)

| ID | 시나리오 | 주입 방법 | 정답 라벨 | 기대 Docs 요지 | 난이도 |
|---|---|---|---|---|---|
| F1 | 동시 다발 이상 | A1(drift) + B1(projection lag) 동시 주입 | 이상 2건 모두 | 두 이슈를 분리 진단, 우선순위 제시 | ●●● |
| F2 | 정상인데 이상처럼 보임 (FP 테스트) | 정상적인 재시도로 `attempt_num` 증가하는 패턴 대량 전송 | **정상** | 트리거 없음 (문서 미생성이 정답) | ●● |
| F3 | 대량 정상 속 소량 이상 | 정상 로그 1,000건 사이에 이상 3건 삽입 | 이상 3건 | 소수 이상만 정확히 특정 | ●●● |
| F4 | 이상 원인의 오귀인 유도 | B4(consumer lag) 주입하되 동시에 무해한 4xx 소량 발생 | 이상 / consumer-lag | 4xx가 아닌 lag를 원인으로 지목해야 성공 | ●●● |
| F5 | 완전 정상 (컨트롤) | 아무 주입 없음 | **정상** | 트리거 없음 | ● |
| F6 | 반복 발생 이상 | 동일 이상(A1)을 시차를 두고 3회 반복 | 이상 / recurring | 재발 패턴 인지, 근본 대응(스키마 확장) 권고 | ●●● |

> F2·F5처럼 **정답이 "정상"인 시나리오**는 층 1의 Precision(오탐 억제)을 측정하기 위해 반드시 포함한다.
> 이상 시나리오만으로 구성하면 Recall만 측정되고 "다 이상이라고 답하는 시스템"과 구별할 수 없다.

---

## 3. 층 3 성공 기준(ground truth) 정의 원칙

시나리오마다 아래를 사전에 문서화해 둔다 (평가 후 소급 정의 금지):

1. **정답 원인**: 한 문장 (예: "projector가 X event_type 처리 중 예외로 프로젝션 누락")
2. **정답 수정**: 검증 가능한 형태
   - SQL이 산출물이면 → **실행 성공 + 기대 스키마/기대 행 결과와 일치** (Execution Accuracy)
   - 절차가 산출물이면 → 체크리스트 항목 충족 여부 (예: "커서 리셋 언급", "replay 범위 특정")
3. **부분 점수 규칙**: 원인은 맞았으나 수정이 불완전한 경우의 처리 (권장: 원인 정확성과 수정 정확성을 분리 보고)

---

## 4. 실행 순서

```
1. 시나리오 주입 스크립트 작성 (시나리오별 재현 가능하게)
   → 검증: 같은 스크립트 2회 실행 시 동일 이상 재현
2. 각 시나리오 주입 → 시스템 가동 → 층 1 탐지 결과 + 층 2 Docs 수집
   → 검증: 시나리오 23개 × 탐지 판정 기록 완료
3. 층 3: 조건 A/B/(C/D) × 시나리오 × k=5회 Local LLM 질의
   → 검증: 응답 로그 전량 저장 (재채점 가능하게)
4. 채점: SQL 자동 실행 채점 + LLM judge 루브릭 채점 + 30% 수동 검증(κ 산출)
5. 통계 분석 (McNemar, Wilcoxon) → 표/그래프 작성
```

## 5. 참고 평가 체계

| 체계 | 차용 지점 |
|---|---|
| **RAGAS** (RAG 평가) | 층 2·3 지표 설계 — faithfulness, answer relevance, context precision |
| **Spider / BIRD** (text-to-SQL) | 층 2 SQL 평가 — Execution Accuracy |
| **LogHub / DeepLog 계열** (AIOps 로그 이상탐지) | 층 1 — Precision/Recall 기반 탐지 평가 |
| **SWE-bench** | 층 3 철학 — "실제로 고쳐졌는가"를 실행으로 검증 |

## 6. 예상 반론과 방어

| 반론 | 방어 |
|---|---|
| "베이스라인이 불공정하다 (정보량 차이일 뿐)" | 조건 A에도 동일 원본 로그를 제공 → Docs의 *가공·구조화* 기여만 측정 |
| "LLM이 LLM을 평가하는 순환" | 실행 기반 지표(SQL Execution Accuracy, Task Success)를 주 지표로, judge 점수는 보조 지표로 |
| "오탐 측정이 없다" | F2·F5 정상 시나리오 포함, FPR 별도 보고 |
| "한 번 돌린 결과다 (재현성)" | k=5 반복 + pass@k + 주입 스크립트 공개 |

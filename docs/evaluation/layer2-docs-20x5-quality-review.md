# 층2 확장 본평가 Docs 품질 심층 리뷰 — 사람 활용성 관점 (2026-08-09)

> `docs/evaluation/layer2-docs-20x5-results.md`(결정론 검증 + SQL 실행 검증)의 후속 3차 평가.
> 대상: `scripts/eval/results/layer2-docs-llm-only-20x5/`의 문서 100건 전수.
> 방법: Claude Sonnet 서브에이전트 8개 병렬 리뷰(시나리오 그룹별 분담).
> 질문: **"개발자가 이 Docs만 보고 Read Model을 그대로 재생성해도 되는가"** —
> 자동 검증(결정론 체크리스트·SQL 실행)이 보증하지 못하는 상위 품질 축을 평가한다.

## 0. 평가 방법

각 에이전트는 (1) `layer2-docs-scenarios.md`의 시나리오 정의, (2) `src/` 실제 Read Model
스키마·이벤트 payload 구조, (3) `sql-verification-2026-08-08T16-06-33-148Z.json`의
실측 실행 결과를 참조한 뒤, 문서마다 5개 축으로 심사했다:

| 축 | 내용 |
|---|---|
| 진단/요청 이해 정확성 | 주입 이상(A·B 계열) 또는 사용자 쿼리 의도(E 계열)와 문서 진단의 일치 |
| 권고 실행 가능성 | 권고만 읽고 바로 조치 가능한가 — 프로젝션 가이드 포함 여부 |
| SQL 의미적 정확성 | 실행 가능 그 너머: 스키마 정합·순서 의존·권고와의 일치·도메인 합당성 |
| API Versioning 구체성 | from/to·affectedEndpoints가 실제 변경과 맞고 실행에 충분한가 |
| 문서 내 일관성 | frontmatter ↔ 본문 SQL ↔ 권고 대상 ↔ 부속 코드의 상호 일치 |

문서별 3단계 판정: **즉시 활용 가능**(그대로 따라해도 됨) / **소폭 수정 필요**(오탈자·
순서 등 단시간 수정) / **부적합**(오진이거나 따라하면 사고).

**평가자 한계.** 판정 주체가 LLM(Sonnet)이므로 개별 판정에 오차 가능성이 있다.
특히 "부적합" 20건과 §2-1의 Projector 매핑 버그 주장은 인용 전 사람 스팟체크를 권한다.
에이전트 원 보고서 8건은 세션 스크래치패드에 보존.

## 1. 한 줄 요약

**즉시 활용 가능 41 / 소폭 수정 필요 39 / 부적합 20 (100건).**
자동 검증 수치(결정론 전항목통과 87%, SQL 블록 실행 96%)보다 낮으며, 격차의 원인은
자동 검증이 구조적으로 못 보는 결함 — **부속 TypeScript 코드의 payload 매핑 버그,
비권장 대안에 숨은 논리 버그, 의미적으로 빗나간 SQL(silent no-op)** — 이다.
진단 정확성 자체는 거의 전 채널에서 높았고(§3), 결함은 "복잡한 코드 합성"과
"폴백 렌더링"에 집중되어 개선 지점이 명확하다.

## 2. 시나리오별 판정 분포

| 시나리오 | 문서 | 즉시 | 소폭 | 부적합 | 비고 |
|---|---|---|---|---|---|
| A1-payload-drift | 5 | 2 | 2 | 1 | rep-3 문서 내 3중 대상 불일치 |
| A2-type-mismatch | 5 | 3 | 2 | 0 | 격리 판단 5/5 정확 |
| A3-missing-field | 5 | 5 | 0 | 0 | **최상** — 전부 일관·정확 |
| A4-physical-impossible | 5 | 0 | 5 | 0 | 5건 전부 동일 Projector 매핑 버그(§2-1) |
| A5-consistency-violation | 5 | 4 | 0 | 1 | rep-1만 폴백 스텁 |
| A6-depth-jump | 5 | 3 | 1 | 1 | rep-4 폴백 + unknown 불일치 |
| A7-grip-depth-underflow | 5 | 2 | 3 | 0 | harden CHECK 게이팅 누락(§2-3) |
| A8-translation-x-violation | 5 | 0 | 5 | 0 | 동일 CHECK 버그 + outlier flag 오탐 설계 |
| A9-non-integer-id | 6 | 4 | 1 | 1 | analysis 문서는 전부 정확 |
| A10-null-intrinsic-param | 10 | 4 | 4 | 2 | analysis 5건 정확, dq 부속 5건이 문제(§2-6) |
| B1-projection-map-failed | 5 | 4 | 1 | 0 | 진단 5/5 완전 일치, 환각 인용 0건 |
| B2-multimodal-integrity | 10 | 2 | 2 | 6 | **최하** — 센서 채널 반복 오탐(§2-2) |
| E1-new-column-query | 5 | 1 | 2 | 2 | rep-5만 코드까지 완결 |
| E2-new-aggregate-query | 5 | 0 | 3 | 2 | 성공률 컬럼 누락 2건 |
| E3-new-join-query | 8 | 6 | 2 | 0 | E 계열 최상 — 누적 로직 불필요 구조 덕 |
| E4-time-series-query | 6 | 1 | 2 | 3 | 누적 upsert 코드 4/6 고장 |
| E5-failure-ranking-query | 5 | 0 | 4 | 1 | 실패율 컬럼 4/5 누락 |
| **합계** | **100** | **41** | **39** | **20** | |

(F2·F3·F5 대조군은 "미생성 = 정답"으로 문서가 없어 본 리뷰 대상 외.)

## 2-1. 결함 클래스 ① Optional Projector 코드의 payload 매핑 버그 (최광역)

부속 자료의 Projector 코드가 실제 이벤트 payload 구조(`grip3dPose.z1`,
camelCase `objectName`) 대신 **DB 컬럼명을 flat 키로 읽는 보일러플레이트**
(`payload["z1_raw"]`, `payload["date_key"]`, `payload["total_attempts"]`)를 사용한다.

- A4: 5/5 전건 재현 — `read_grip_outlier_v2`의 이상 플래그가 전부 null로 채워져
  테이블 목적이 조용히 무력화됨.
- E4: 6건 중 4건 — rep-2·rep-3은 존재하지 않는 payload 필드 참조("결정론 합성 —
  보정하라" 주석으로 미완성 자인), rep-5는 `excluded.totalAttempts`(camelCase)로
  2번째 이벤트부터 런타임 오류 + 요청 핵심인 `success_rate`가 항상 null.
- E1 rep-1: timestamptz PK 컬럼에 `Number(payload["occurred_at_hour"] ?? 0)` 캐스팅 —
  모든 행이 단일 PK로 충돌.
- E2 rep-4: `excluded(${value})` 무효 문법 — 동일 object_name 재적재 순간 오류.

**공통 특징: §2의 텍스트 투영 매핑 명세는 정확한데 코드가 어긋난다.** 원인은 LLM의
개별 실수가 아니라 코드 합성 템플릿(`toNumberOrNull(payload["<db_column>"])`)의
구조적 결함으로 판단됨. **DDL은 실행 가능하므로 sql-verification 96%에 전혀 걸리지
않는다** — 에러 없이 무의미한 Read Model이 배포되는 최악 유형의 조용한 실패.

## 2-2. 결함 클래스 ② B2 센서 채널의 룰북 위반 오탐 (연구적 최중요)

B2의 5개 rep 중 4개(rep-1·2·4·5)에서 센서 채널이 **룰북에 없는 규칙(grip3dPose
X축 부호)을 발명**해 `read_grip_result`를 "critical"로 오진하고 v2 설계까지 반복
생산했다. `src/analysis/context/sensor-value-baseline.md:4`의 "여기 없는 차원은
기대 범위를 발명하지 말고 판정하지 않는다" 가드레일을 정면으로 위반한 사례다.
**rep-5는 이 오탐 문서가 유일한 산출물이라, B2가 주입한 실제 이상(모달 파일명
불일치)의 탐지에 사실상 실패했다**(생성률 100% 통계의 이면).

A7 초안 폐기 사유(R4 회전행렬 — CHECK 서면화 없는 암산 룰의 llm-only 사각지대,
`layer2-docs-llm-only-20x5-archive/` 실측)와 대칭을 이루는 발견이다:
**서면화되지 않은 룰은 못 잡고(위음성), 서면화 범위 밖은 발명해서 잡는다(위양성)**.
둘을 묶으면 hybrid(결정론 주석 + LLM) 조건의 필요성을 뒷받침하는 핵심 논거가 된다.

추가로 rep-1에서는 무관한 인프라 잡음(HTTP 404)이 프리게이트를 재트리거해 서로
배타적인 해법 3건(프로젝터 보강 / PK 재정의 / 신규 테이블)이 한 폴더에 병존했다.
그중 2건은 `docsValid: false`인데 .md 파일만으로는 유효본을 구분할 수 없다 —
파이프라인 차원의 dedup·무효본 마킹이 필요하다.

## 2-3. 결함 클래스 ③ 비권장 대안(harden)에 숨은 논리 버그 — A7·A8 6개 문서

"grip_succeed=1일 때만 성립해야 하는 규칙"을 무조건(unconditional) CHECK 제약으로
표현 — 그대로 적용하면 실패 시도 행(grip_succeed=0) 삽입이 전부 거부된다.
6건 모두 권장 경로는 fix(TS checkIntegrity)라 추천대로면 안전하지만, 문서에 실린
SQL을 선별 실행하는 사용자는 사고를 만난다. A7 rep-1만 올바른 함의 논리
(`grip_succeed <> 1 OR min_z >= 0.01 OR flag = 1`)를 썼다.
sql-verification은 harden 블록을 독립 실행해 "relation does not exist"로만 기록 —
이 논리 버그는 자동 검증에 전혀 잡히지 않았다.

## 2-4. 결함 클래스 ④ 결정론 폴백 문서의 자기모순 — 약 7건

LLM 권고 생성이 재시도까지 실패하면 결정론 폴백이 문서를 채우는데, 두 가지 문제가
공존한다:

1. **경고와 완결 코드의 공존** (A9/rep-4, A10/rep-1 등): "재실행 권장·최소 근거만
   수록" 경고 바로 아래 완결돼 보이는 DDL·Drizzle·Projector·배선 코드가 통째로 실림.
   경고를 못 본 개발자가 코드만 복사하는 사고 유발 구조.
2. **frontmatter 불일치** (A6/rep-4, E1/rep-2·3, E2/rep-3, A1/rep-4): 제목·
   `targetReadModel`이 `unknown`이거나 본문 SQL 대상과 다른 테이블을 가리킴.
   E1/rep-2는 같은 파일의 두 코드 블록이 서로 다른 필드명을 쓰는 자기모순까지.

폴백 산출물의 코드 블록 억제 또는 "DRAFT" 워터마킹, frontmatter 재추출 보정 등
렌더링 수준 수정으로 해결 가능한 클래스다.

## 2-5. 결함 클래스 ⑤ 의미적으로 빗나간 SQL — sql-verification 맹점의 실증

- **B2/rep-4 silent no-op DELETE**: `WHERE scene_key = 'grip-attempt:...'` —
  `scene_key` 컬럼에 stream_id 형식 값(prefix 포함)을 넣어 0건 매칭. 검증기는
  "실행 성공(failedBlocks: [])"으로 기록했다. 실행 성공 ≠ 의도 달성의 실증 사례.
- **A10/rep-5 격리 순서 역전**: v1 운영 테이블에 CHECK를 먼저 추가해 기존 오염 행과
  충돌(실측 실패). "contain(DELETE) 먼저"가 옵션 병렬 나열로만 존재해 강제되지 않음.

## 2-6. 기타 반복 패턴

| 패턴 | 건수 | 성격 |
|---|---|---|
| 사용자 명시 요구값(성공률·실패율) 미제공 | E2·E4·E5에서 7건 | 요청 충족 실패 — E5는 4/5가 count만 저장, 랭킹 예시 SELECT도 부재 |
| DDL ↔ Drizzle 테이블명 접미사(`_v1`/`_v2`) 불일치 | 4건 (E3·E5·E2) | 부속 코드 복사 시 다른 테이블 생성 트랩 |
| TL;DR "보강한다" 템플릿 오표기 | 격리 lane 10건 | `src/analysis/render.ts:183-189` — `newReadModel` 부재 시 무조건 "보강" 렌더링. LLM 아닌 코드 결함, 분기 수정으로 해결 |
| 시나리오 범위 밖 문서 혼입 | 6건 (A10 dq×5, A9 dq×1) | 데이터셋 내재 경계값 이상(R5/R6)의 재탐지 — "rep당 문서 2건 = 이상 파일 2건 트리거" 전제가 A10에선 불성립. 통계 해석 시 주석 필요 |
| doubleprecision/double_precision 타입 오탈자 | 8건 | 기지(旣知) — sql-verification에서 이미 계수됨 |
| 한자·타 문자 혼입 | 13건+α | 기지 — 산문만 오염, SQL 블록은 항상 정상 |

## 3. 긍정 소견

- **진단 정확성은 전 채널에서 높다.** A2·A3·A5·B1은 5회 반복이 사실상 동일한 올바른
  결론에 수렴(높은 재현성). B1은 환각 인용 0건 + "projection_cursor 직접 전진 금지"
  안전 경고 5/5 일관.
- **"신규 Read Model을 만들지 않는 것이 정답"인 케이스(A2·A3·A9·A10 analysis)를
  흔들림 없이 판단** — Zod 완화·기본값 치환 같은 위험 대안을 Non-Goals로 명시 배제.
- **실행 순서 의존을 스스로 주석으로 명시**하는 좋은 관행이 A6·A7 다수 문서에서 관찰.
- **E3(조인)은 8건 중 6건 즉시 활용** — 누적 로직이 필요 없는 "필드 복사" 구조에서는
  코드 합성도 안정적. 결함이 누적 upsert 합성에 집중된다는 진단 근거.

## 4. 개선 우선순위 제안

1. **[코드] Projector 합성 템플릿 수정** — §2 텍스트 매핑 명세(정확함)를 소스로
   payload 실제 경로 기반 코드를 생성하도록 변경. 결함 클래스 ① 전량 해소 대상.
2. **[코드] 폴백 렌더링 정비** — 폴백 시 코드 블록 억제 또는 DRAFT 마킹,
   frontmatter 대상 재추출. 결함 클래스 ④ 해소.
3. **[코드] render.ts TL;DR 동사 분기** — 격리 lane "보강한다" 오표기 10건 해소.
4. **[검증기] sql-verifier 확장** — (a) 타입 정규화(doubleprecision→double precision)
   후 재검증, (b) DELETE/UPDATE의 영향 행 수 0건 경고(silent no-op 탐지),
   (c) 문서 내 블록 순서 의존 자동 재배열 시도.
5. **[파이프라인] 재트리거 dedup + `docsValid: false` 문서의 파일명 마킹** —
   B2/rep-1형 병존 해소.
6. **[평가 설계] hybrid 조건 추가** — §2-2의 위양성/위음성 대칭 발견을 근거로,
   결정론 주석 병행 조건과의 비교 실험이 자연스러운 후속.

## 5. 자동 검증과의 관계 (3층 평가 체계로서의 위치)

| 층 | 방법 | 결과 | 보증 범위 |
|---|---|---|---|
| 1차 | 결정론 체크리스트 (verify-layer2-docs) | 87/100 전항목통과 | 구조 완결성·grounding·표기 |
| 2차 | 실 Postgres 실행 (verify-layer2-sql) | 블록 240/250 (96%) | DDL/SQL 실행 가능성 |
| 3차 (본 문서) | LLM 심층 리뷰 — 사람 활용성 | 즉시 41 / 소폭 39 / 부적합 20 | 의미 정합·코드 정확성·요청 충족 |

세 수치는 모순이 아니라 **측정 대상이 다르다**: 1·2차가 통과한 문서도 부속 코드가
틀리거나(①) 의도를 빗나간 SQL(⑤)일 수 있음을 3차가 드러냈다. 역으로 3차의 "즉시
활용 가능 41%"도 진단 정확성(§3)과는 별개 축이다 — 진단은 맞았으나 산출물 마감이
부족한 경우가 소폭 39건의 대부분을 차지한다.

# 층2 Docs 생성 평가 — 시나리오 50런 정리

> 논문 Evaluation 층2(데이터 품질 이상·Read Model 부적합 → **LLM Docs 산출**)의
> 시나리오 구성 문서. "50개"는 **Docs 산출을 기대하는 시나리오 10종 × 반복 5회(k=5)
> = 50런**을 뜻한다. 반복 5회는 LLM 판정의 비결정성을 흡수하기 위한 프로토콜이다
> (`data/eval/layer23-scenarios/README.md`).
>
> 데이터셋: `data/eval/layer23-scenarios/` (12종, 결정론 생성) /
> 평가 러너: `scripts/eval/run-layer2-docs.mjs` /
> 결정론 검증기: `scripts/eval/verify-layer2-docs.mjs`

---

## 1. 전체 구성

| 그룹 | 시나리오 | 런 수 | Docs 기대 | 탐지/트리거 채널 |
|---|---|---|---|---|
| A — 데이터 품질 이상 | A1~A6, B1 (7종) | 35 | 생성 | 로그 또는 센서 관찰 |
| E — Read Model 재생성 | E1~E3 (3종) | 15 | 생성 | 사용자 질의(카드 miss) |
| F — 정상 대조군 | F2, F5 (2종) | (50런 외) | **미생성이 정답** | 없음 |

데이터셋 자체는 12종이지만, 층2 Docs 생성 평가의 50런은 Docs 를 기대하는 10종만
대상으로 한다. F2/F5 는 오탐(정상인데 Docs 생성) 측정용 대조군으로 별도 실행한다.

모든 시나리오는 `data/toy-data/` 실측 JSON 139건을 원천으로
`scripts/eval/generate-layer23-scenarios.mjs` 가 결정론적으로 생성했다. 변이/신규
파일은 장면번호 `02000~02999` 를 전역 중복 없이 할당하며, 파일명은 정상 파일과
구별 불가능하다(`ANOMALY_` 같은 접두사 없음).

> **한 줄 요약.** 현실에서 벌어질 수 있는 10가지 곤란한 상황(7개는 **나쁜 데이터**,
> 3개는 **기존 Read Model 로 못 푸는 질문**)을 실행 중인 시스템에 하나씩 주입했을 때,
> LLM 파이프라인이 매번 올바른 **진단 + SQL + API 버전** Docs 를 자동 생성하는지 각
> 5회씩 검증하는 실험이다. 결과 폴더(`scripts/eval/results/layer2-docs-llm-only-k5/`)의
> `A1-payload-drift` ~ `E3-new-join-query` 10개 하위 폴더가 이 10종에 1:1 대응한다.

## 2. 탐지 채널 — 시나리오가 LLM에 도달하는 3가지 경로

같은 "이상"이라도 시스템에 들어가는 경로가 다르다. LLM 에 주입되는 컨텍스트 소스가
시나리오마다 다르다는 점이 이 평가 설계의 핵심이다.

1. **로그 채널** (A1, A2, A3, B1): 적재/투영 중 warn·error 로그 발생 → Kafka →
   prejudge(qwen3.5-9b) → llm-context 분석(qwen3.6-35b) → Docs.
   완료 신호: `llm.analysis.aggregate.done`
2. **센서 채널** (A4, A5, A6): 투영 성공 → 센서 관찰자가 값 이상 감지 → 에피소드
   적립·마감 → sensor-observer 분석 → Docs.
   완료 신호: `sensor.analysis.done`
3. **질의 채널** (E1, E2, E3): `GET /insight/cards/<사용자 질의>` 를 3회 반복 —
   카드 miss 반복이 "기존 Read Model 로 답할 수 없는 조회 의도" 신호 → prejudge →
   llm-context 분석 → Docs.

## 3. A그룹 — 데이터 품질 이상 (7종 × 5회 = 35런)

**검증 질문: 나쁜 데이터를 하나 심어놓으면 시스템이 자동으로 그것을 잡아내고 격리(A1만
보강) Docs 를 내는가.** "주입 이상"이 무엇을 심었는지라면, "검증 목적"은 그것으로 무엇을
테스트하는지다.

| ID | 주입 이상 (무엇을 심었나) | 검증 목적 (무엇을 테스트하나) | 채널 | 이상 파일 수 |
|---|---|---|---|---|
| A1-payload-drift | 스키마 밖 신규 필드(`gripper_temperature`, `conveyor_speed`) 유입. 기존 zod 스키마는 통과·무시하므로 drift 감시 로그로만 드러난다 | 스키마 드리프트를 로그로 감지 → 신규 필드를 반영한 Read Model **보강** Docs | 로그 | 2/27 |
| A2-type-mismatch | `grip_succeed` 타입/도메인 위반(문자열 `"true"`, 도메인 밖 정수 `2`). JSON 자체는 유효하나 zod parse 실패 → `projection.map.failed` | 타입/도메인 위반 감지 → 오염 데이터 **격리** Docs | 로그 | 2/27 |
| A3-missing-field | 필수 필드(`grip_data`, `robot_tf`) 삭제 → zod 파싱 실패 | 필수 필드 누락 감지 → 격리 Docs | 로그 | 2/27 |
| A4-physical-impossible | 값 하나만 봐도 물리적으로 불가능(깊이 z1 < 0, 이미지 밖 픽셀 xl = 2500) | 센서 관찰자가 단일 값의 물리 불가능성 감지 → 격리 Docs | 센서 | 2/27 |
| A5-consistency-violation | `grip_succeed = 1`(성공) 맥락과 모순되는 센서 값(`robot_tf.translation[2]` 1.02 → 1.5 m) — 성공인데 잡을 수 없는 위치/깊이 | 개별 값은 정상이나 성공 맥락과의 **모순** 감지 → 격리 Docs | 센서 | 2/27 |
| A6-depth-jump | 같은 scene 내 시도 01(정상) → 02(이상) 깊이 평균 급변(Δ > 0.10 m). 값 자체는 정상 분포 클러스터 안이라 physical/consistency 로는 걸리지 않음 — jump 전용 | physical/consistency 로 안 잡히는 **급변(추세 이상)**만 분리 감지 → 격리 Docs | 센서 | 1/26 |
| B1-projection-map-failed | `objects` 빈 배열 → `GripResultProjector.map` 이 예외를 던져 투영 자체가 실패(poison) | 투영 실패(poison 이벤트) 감지 → 격리 Docs | 로그 | 2/27 |

**기대 Docs 요지 (공통 구조).** 이상 원인 진단(권고 문서) + 격리(containment) SQL +
API Versioning. A1 만 예외적으로 "격리"가 아니라 신규 필드를 반영한 **Read Model
보강**(컬럼 추가 SQL + API 버전 변경)이 기대 산출물이다.

## 4. E그룹 — Read Model 재생성 (3종 × 5회 = 15런)

**검증 질문: 기존 Read Model 로 답할 수 없는 조회 요청이 들어오면, 그것을 감지하고 새
Read Model 설계 Docs 를 내는가.** A그룹과 달리 데이터가 나쁜 게 아니라 "질문이 기존
모델과 안 맞는" 상황이다. 신호는 `GET /insight/cards/<질의>` 를 반복해도 카드가 계속
miss 되는 것("기존 Read Model 로 답할 수 없는 조회 의도"). 아래 "기대 Read Model 요지"가
곧 각 시나리오의 검증 목적이다.

| ID | 배경 데이터 | 사용자 질의 | 기대 Read Model 요지 |
|---|---|---|---|
| E1-new-column-query | 정상 + payload-drift 변이(A1 동일 유형, 별도 장면번호) | "최근 적재 데이터에 gripper_temperature 필드가 들어오기 시작했다. 이 값을 시간대별로 조회하고 싶다. 현재 Read Model로 가능한가?" | `gripper_temperature` 시간대별 조회용 컬럼/테이블 DDL + 프로젝션 가이드 + API v+1 |
| E2-new-aggregate-query | 정상만(이상 없음) 30건 | "객체(object_name)별 파지 성공률을 한 번에 조회하고 싶다. 시도 수, 성공 수, 성공률이 필요하다." | object_name 별 집계 테이블(시도 수·성공 수·성공률) DDL + 프로젝션 가이드 + API v+1 |
| E3-new-join-query | 정상만(이상 없음) 30건 | "파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다." | `read_grip_result ⋈ read_multimodal` 조인 뷰/테이블 DDL + 프로젝션 가이드 + API v+1 |

## 5. F그룹 — 정상 대조군 (50런 외, 별도 실행)

| ID | 구성 | 정답 |
|---|---|---|
| F2-normal-retry | 정상 배경 + 재시도 씬 3개(같은 원본으로 시도 01/02/03, 깊이 Δ=0) — 정상 재시도가 jump 로 오인되지 않아야 한다 | 트리거 없음 → **Docs 미생성** |
| F5-all-normal | 정상 배경 30건만 — 완전 정상 베이스라인 | 트리거 없음 → **Docs 미생성** |

## 6. 실행 프로토콜

```bash
# 전제: 앱이 다음 env 로 떠 있어야 한다
#   TOY_DATA_DIRECTORY=data/eval/layer2-staging
#   SENSOR_OBSERVER_ANALYSIS_DISABLED=0
#   LLM_CONTEXT_ANALYSIS_DISABLED=0

# 50런 (Docs 기대 10종 × 5회) — 단일 러너 호출(단일 앱 프로세스)
node scripts/eval/run-layer2-docs.mjs \
  --scenarios A1,A2,A3,A4,A5,A6,B1,E1,E2,E3 --reps 5

# 50런 캠페인 — 런마다 앱 재기동 + Kafka 정리(권장, §9 llm-only 본평가에 사용).
# 장시간 단일 프로세스의 분석 정체·낙오 분석의 런 간 오염을 원천 차단하고,
# 중단 시 같은 명령으로 이어하기(수집된 런 건너뜀)가 된다.
bash scripts/eval/run-layer2-k5-campaign.sh 5 <results-name>

# 대조군 (10런)
node scripts/eval/run-layer2-docs.mjs --scenarios F2,F5 --reps 5

# 수집물 결정론 검증
node scripts/eval/verify-layer2-docs.mjs
```

- **시나리오 = 독립 런.** 러너가 런마다 `event_store`·read model·`projection_cursor`·
  로그를 전부 초기화한다. `onConflictDoNothing`(멱등 처리) 때문에 초기화 없이
  재적재하면 새 이벤트가 조용히 스킵되어 이전 런의 상태가 섞인다.
- **완료 판정.** 채널별 완료 이벤트(`sensor.analysis.done` /
  `llm.analysis.aggregate.done`)를 수집하고, 진행 중 분석(닫힌 에피소드·prejudge
  트리거)이 전부 정산될 때까지 기다린 뒤 quiet 구간으로 종료한다 — 늦게 도착한
  Docs 가 다음 런에 오염 수집되는 것을 막는다.
- **산출물 위치.** `scripts/eval/results/layer2-docs/<시나리오>/rep-<n>/` 에
  Docs(md)와 `run-meta.json`(주입·투영·이벤트 타임라인)이 저장된다.

## 7. 채점 체계

**결정론 사전 검증** (`verify-layer2-docs.mjs`) — 런당 7개 체크:

| 체크 | 내용 |
|---|---|
| frontMatterPresent | front-matter 존재 |
| sufficientEvidence | `sufficientEvidence: true` |
| verdictNotNoAction | TL;DR 이 "조치 불필요"가 아님 |
| recommendationFilled | §1 권고가 비-센티넬(INSUFFICIENT_EVIDENCE 아님) |
| sqlFilled | §2 Read Model 생성 SQL 채워짐 |
| versioningFilled | §3 API Versioning 채워짐 |
| grounding | 시나리오별 앵커 문자열(이상 장면/필드/유형)이 본문에 실재 |

grounding 앵커 예: A1 은 `drift/드리프트/신규 키/newKeys`, E1 은
`gripper_temperature`, A6 은 `jump/급변/Δ/델타` 중 하나 이상이 본문에 나타나야 한다.

**내용 채점(루브릭식 LLM 채점)은 층3 본평가의 몫이다.** 층3에서는 각 런의 컨텍스트를
B0(로그만) / B1(로그+Insight 카드) / A(생성 Docs) 로 나눠 비교한다.

## 8. 실행 결과 (2026-07-15 ~ 07-16, hybrid 모드, k=5 완주)

50런 전부에서 Docs 생성 성공(생성률 100%). 결정론 7체크 요약:

| 시나리오 | 전항목 통과 | 평균 | rep 간 패턴 |
|---|---|---|---|
| A1-payload-drift | 5/5 | 100% | 완전 일관 |
| A2-type-mismatch | 0/5 | 51% | 진단·grounding 통과, sufficientEvidence=false 고정(1회는 '조치 불필요') |
| A3-missing-field | 0/5 | 46% | A2 와 동일 계열, '조치 불필요' 2회 |
| A4-physical-impossible | 0/5 | 71% | 5회 모두 동일: 격리 SQL 채움, Versioning 만 센티넬 |
| A5-consistency-violation | 5/5 | 100% | 완전 일관 |
| A6-depth-jump | 5/5 | 100% | 완전 일관 |
| B1-projection-map-failed | 0/5 | 57% | 5회 모두 동일한 보수 판정 |
| E1-new-column-query | 5/6 | 95% | rep-4 만 sufficientEvidence=false (rep-3 은 유효 문서 2건) |
| E2-new-aggregate-query | 3/5 | 86% | rep-4·5 보수 판정 |
| E3-new-join-query | 3/5 | 83% | rep-2·5 보수 판정 — E 계열 비결정성 대표 |

**감점의 단일 근원**: 부분 통과 24건 전부가 `sufficientEvidence: false` 자기 판정에서
비롯됐다(탐지 실패·grounding 실패 0건). 격리 계열(A2/A3/B1) 15/15 가 "Read Model
구조는 정상, 결함은 발생원" 논리로 SQL/Versioning 을 보류했다 — 시나리오 정답
기준(격리 SQL 포함)과 분석 프롬프트의 판정 기준이 어긋나는 지점으로, 층2 프롬프트
개선의 1순위 후보다.

**운영 기록**: llm-only 잔존 플래그로 인한 초기 무효런(폐기 후 hybrid 재실행),
E 계열 낙오 분석의 런 간 오염(→ 런 단위 앱 재기동 격리로 해결), Kafka KRaft
컨트롤러 장애 2회(→ 브로커 재시작 + 배수 앱으로 백로그 소진 후 재개). 오염·장애
구간의 런은 전부 폐기·재실행되어 최종 50런은 모두 동일 조건(hybrid + 런 격리)이다.

## 9. 실행 결과 (2026-07-19 ~ 07-20, llm-only 모드 + 개선 스택, k=5 완주)

§8 이후 llm-only 조건에서 시나리오별 1런 반복(실패 진단 → 개선 → 재검)으로 층1·층2를
개선한 뒤, 최종 조건을 고정해 50런 본평가를 재실행했다. 실행:
`scripts/eval/run-layer2-k5-campaign.sh`(런마다 앱 재기동 + Kafka 두 토픽 정리,
런당 타임아웃 60분), env 는 §6 공통 + `SENSOR_OBSERVER_JUDGE_MODE=llm-only` +
`SENSOR_OBSERVER_EPISODE_CLOSE_NORMAL_STREAK=2`. 소요 16시간(21:54~14:00),
50/50런 완주 — 타임아웃·미생성·인프라 장애·오염 0건.

### 9-1. 사전 개선 스택 (본평가 조건에 고정된 변경)

**층1 탐지 (llm-only 전용)** — 룰북 v2 → v4.3, 각 반복은 실측 실패에서 도출:

| 반복 | 실측 실패 | 처방 |
|---|---|---|
| v4.0 | 고립 이상값 암산 미탐 (A4 전량 미탐 — 층1 벤치마크의 '동거 효과' 경고가 실전 재현) | 레코드당 CHECK 라인(값 추출 서면화) |
| v4.1 | R5 복합 비교 누락(값을 적어놓고 비교 안 함) + 구간 포함(⊆) 오판 | s=1 레코드당 R5-CHECK 라인, 스칼라 비교로 분해 |
| v4.2 | 필드/축 혼동 추출 환각(x값→z, t_z→Y) | 필드 앵커링 명시 + X 표기 전 원문 재대조 규칙 |
| v4.3 | 자연 부동소수 8개의 min/max 추출 붕괴 + few-shot 예시 수치 앵커링 (A6 미탐) | z8 전체 복사("복사 먼저, 선택은 그다음") + 예시 복사 금지 |

코드: 2-pass 지목(트리거 윈도우 한정 전수 지목 재질의 — v3 의 작화 부작용을 구조로
회피), 지목 sceneKey 의 NFC→레코드 원형 복원(런타임 버그 수정 — 에피소드 dedupe 와
분석 입력의 지목 우선 보존이 조용히 무력화되고 있었다), 에피소드 마감 히스테리시스.

**층2 분석 (모드 무관 공통 개선 — hybrid 재실행 시에도 동일 이득)**:

1. 층1 사유의 **가설 격하**(`render-sensor.ts`) — 인용 수치·부등호를 원시 레코드에서
   재검증, 재확인 안 되는 사유는 기각. 실측: 1차의 거짓 부등호 인용을 35B 가 기각하고
   정확한 값(xl=2500)으로 재인용, 오탐 scene 을 결론에서 배제.
2. **격리 계열 3요소 보장** — `recommendationDocs` 에 `containmentSql`(표준 격리 SQL
   템플릿 제공: poison 커서 전진/오염 행 정리/무유입 검증)·`apiVersionImpact` 필드
   추가, §2/§3 렌더와 `sufficientEvidence` 판정을 동기화. §8 감점의 단일 근원이던
   "격리 계열 보류"를 연구 명세(3요소 항상 포함)와 정합시킨 것.
3. **decision 로그 경로 가드**(코드 버그 수정) — LLM 이 로그 경로에서 센서 전용
   `dataQualityRecommendation` 을 선택하면 생성기가 조용히 빈 출력으로 강등되고
   무결성 게이트가 문서 전체를 보류하던 결함. §8 의 A3 0/5 도 동일 메커니즘 의심.
4. 에피소드 분석 실패 로그 error→info — error 로그의 Kafka 재유입이 선판단을
   재트리거하는 피드백 루프 차단(층1 평가에서 확립된 정책의 누락 지점).

### 9-2. 결정론 7체크 결과

50런 전부 Docs 생성(생성률 100%), 산출 문서 53건 중 52건 전항목 통과:

| 시나리오 | 전항목 통과 | 평균 | (참고: §8 hybrid) | rep 간 패턴 |
|---|---|---|---|---|
| A1-payload-drift | 5/5 | 100% | 100% | 완전 일관 |
| A2-type-mismatch | 5/5 | 100% | 51% | 완전 일관 |
| A3-missing-field | 4/5 | 83% | 46% | rep-5 만 decision 이 '조치 불필요' 보수 판정(비결정성 잔존) |
| A4-physical-impossible | 5/5 | 100% | 71% | 완전 일관, Versioning 포함 |
| A5-consistency-violation | 5/5 | 100% | 100% | 완전 일관 |
| A6-depth-jump | 5/5 | 100% | 100% | 완전 일관 |
| B1-projection-map-failed | 5/5 | 100% | 57% | 완전 일관, §2 에 표준 격리 SQL(커서 전진) |
| E1-new-column-query | 5/5 | 100% | 95% | 완전 일관 |
| E2-new-aggregate-query | 7/7 | 100% | 86% | rep-3·5 는 유효 문서 2건 |
| E3-new-join-query | 6/6 | 100% | 83% | rep-4 는 유효 문서 2건 |
| **런 기준 합계** | **49/50 (98%)** | | **26/50 (52%)** | |

유일한 부분 통과(A3 rep-5)는 decision(35B)의 '조치 불필요' 자기 판정 — 가드가 막는
유형(잘못된 생성기 선택)이 아니라 "아무것도 선택하지 않음"이라 결정론으로 강제할 수
없는 LLM 비결정성의 잔존이며, k=5 반복 프로토콜이 흡수하도록 설계된 바로 그 영역이다.

### 9-3. 해석 시 주의 (논문 서술에 반드시 병기)

1. **"개선 후 llm-only vs 개선 전 hybrid" 비교다.** §9-1 의 층2 공통 개선(가설 격하·
   격리 3요소·decision 가드)은 판정 모드와 무관해 hybrid 재실행 시에도 같은 이득을
   받는다. 모드 간 공정 비교표를 만들려면 hybrid 를 동일 개선 스택으로 재실행해야
   하며, 본 결과의 주장은 "llm-only 도 컨텍스트·구조 개선으로 이 수준의 문서 품질에
   도달 가능"까지다.
2. **완전한 llm-only 가 아니다.** 층2 분석 입력의 배치 텍스트(`batchText`)에는 판정
   모드와 무관하게 결정론 ⚠ 주석이 포함된다(`renderAnnotatedSensorBatch`). 정확한
   조건 명칭은 "llm-only 탐지 + 주석 컨텍스트 분석"이다.
3. **추출 환각 오탐은 0이 아니다.** 룰북 4회 반복으로도 소형 9B 의 추출 환각(필드
   혼동·예시 앵커링)은 완전히 사라지지 않았고, 같은 모델의 2차 재검증은 오류가
   상관되어 이를 못 잡는다(실측). 문서 오염은 층2 의 가설 격하 + grounding 필터가
   방어했다 — 이 잔존 한계 자체가 hybrid(결정론 주석)의 필요성을 뒷받침하는 근거다.
4. F2/F5 정상 대조군은 본평가 조건(v4.3)으로 미실행 — 탐지 민감도를 올린 만큼
   오탐(정상인데 Docs 생성) 측정이 후속 과제다.

**산출물**: 본평가 `scripts/eval/results/layer2-docs-llm-only-k5/`(53 문서 +
run-meta 50 + verification). 개선 반복 단계의 중간 수집물은
`scripts/eval/results/layer2-docs-llm-only/` — 룰북 버전·코드 수정 시점이 런마다
섞여 있어 정량 표에는 쓰지 않는다(rule 엔지니어링 사례 연구 재료).

# Self-Adaptive CQRS 설계와 구현 비교

> 자가 적응 시스템(MAPE-K) 이론과 7/6 설계 문서를 실제 `src/` 구현과 대조하고, 석사 논문 3장에 무엇을 어떻게 반영했는지 정리한 노트.

---

## 개요

<aside> 💡

Self-Adaptive CQRS는 기존 이벤트 소싱·CQRS(관리 대상 시스템) 위에 LLM 분석 영역(관리 시스템)을 얹어, 이상 신호 → 1차 선별 → 분석 그래프 → 단일 Docs(권고·DDL·API Versioning) → 인간 승인 → 카드 등록 → 다음 컨텍스트로 순환하는 구조다. 이 노트는 세 층을 비교한다. ① MAPE-K 이론 ↔ 코드, ② 설계 문서(`docs/architecture/self-adaptive-cqrs-아키텍처.md`, 7/6) ↔ 코드(2026-08 스냅샷), ③ 논문 3장에 반영한 것과 뺀 것.

<aside>

---

## 1. MAPE-K 이론 ↔ 구현 매핑

- **핵심**: 관리 시스템/관리 대상 시스템 분리(Weyns)를 그대로 따르되, 센서는 새로 붙이지 않고 기존 관측 수단(구조화 로그 레일, sensor-values 토픽)을 재사용한다. 실행기(effector)는 사람이다.
- **특징**: 전통 MAPE-K는 Plan이 "사전 정의 전략 중 선택"인데, 여기서는 Plan이 산출물(DDL·프로젝터·버전 전환)을 실행 시점에 생성한다. 대신 조치의 종류는 4종 닫힌 enum으로 고정 — 조치 종류는 닫힘, 내용은 열림.

| MAPE-K | 이론적 역할 | 구현 요소 (파일) | 판단 주체 |
| --- | --- | --- | --- |
| Monitor | 센서로 관측 데이터 수집 | 로깅 규약(action 사전·correlationId·level≥40) `shared/logger/*`, TCP→fluent-bit→Kafka `log-events`, 파일 tail→`log_event` `log-collector/*`, 센서 값 발행 `projection/kafka/sensor-value.publisher.ts`, `insight/observer/card-drift.observer.ts` | 결정론 |
| Analyze | 적응 필요성 판단 | 로그 레인 `llm-context/*`(필터→프리게이트→prejudge), 센서 레인 `sensor-observer/*`(4층 주석→스크리너→에피소드), 진단 에이전트 `analysis/nodes/root-cause.node.ts` + `invoke-agent.ts` + `tools/diagnosis-toolkit*.ts` | 결정론 + 소형 LLM + 에이전트 |
| Plan | 대응 방안 수립 | `nodes/decision.node.ts`(프리게이트·LLM 선택·불변식), 생성기 5종 `nodes/*.node.ts`, 검증 `validation/*` + `typescript-synthesis.ts` + `fallback-recommendation.ts`, 조립 `aggregate.node.ts` + `render.ts` | LLM 설계 판단 + 결정론 검증·합성 |
| Execute | 적응 행동 적용 | `llm-docs/` 저장 + `validate-docs.ts` → **사람이** DDL 실행·프로젝터 배선·리플레이·카드 INSERT·컷오버 | 사람 (human-in-the-loop) |
| Knowledge | 공유 지식 | Insight Read DB(`insight_entity`/`insight_field`, M-Schema 렌더 `insight-card.renderer.ts`), Log DB, `sensor-value-baseline.md`·`sensor-observer-rulebook.md`, `context/source-examples.ts` | — |

```tsx
// 자가 적응 루프 한 바퀴 (코드 기준)
Monitor   warn/error 로그 → Kafka log-events ─┐   센서 값 → Kafka sensor-values ─┐
Analyze   필터 → level≥40 프리게이트 → prejudge(9B) │   4층 주석 → screener(9B) → 에피소드 │
          └──────────── invoke({window|sensorFinding, insightCards}) ────────────┘
          analyzeRootCause (ReAct, 도구 5종, 4/2/8 상한) → anomalyKind(open-set)
Plan      decide (프리게이트×2 → LLM ≤3 → 재요청 → 앵커별 폴백 → 불변식)
          newReadModel 포함 ? genNewReadModel → genProjectionMapping → 잔여 fan-out : 병렬 fan-out
          검증 7단 (zod → 한자 → 실DB/tsc/키 → grounding → 합성 → 무결성 → Docs 계약)
Execute   llm-docs/<날짜>-<시각>-<docId>.md → [사람] DDL·카드 INSERT·배선·리플레이·컷오버
Knowledge 카드 등록 → renderAllCards() → 다음 분석 컨텍스트 (카탈로그 폐쇄)
```

- **개입 지점 ① Plan→Execute 경계**: 시스템은 Docs 생성에서 멈춘다. `render.ts`의 `HUMAN_GATE` 문구("인간 승인 후에만 적용")가 §2·§3 첫머리에 고정.
- **개입 지점 ② Knowledge 갱신**: 카드 등록은 사람 몫. 누락은 `CardDriftObserver`(60s, 1h 억제)가 `insight.card.drift`로 회수.
- **루프 안정성(음의 피드백)**: 파이프라인 자기 로그는 info(30)만 — 안 지키면 자기 로그가 Kafka로 재유입 → prejudge 재트립 → 무한 Docs. 진단 궤적도 Docs가 아니라 서비스 로그에만.

## 2. 자가 적응 개념별 대응 — 어디가 같고 어디가 다른가

| 개념 (이론) | 전통적 구현 (Rainbow 등) | 이 구현 | 논문에서의 위치 |
| --- | --- | --- | --- |
| 적응 공간 | 설계 시점에 닫힘 (전략 집합 중 선택) | 조치 종류는 닫힘(4 enum), 조치 내용은 열림(DDL·코드 생성) | 3.1 원칙 ②, 3.6 |
| 감지 분류 | 규칙·모델 위반 탐지 | `anomalyKind` open-set 문자열 (미지 유형도 명명) | 3.5 진단 에이전트 |
| 센서 | 관리 대상에 부착 | 기존 로그 레일·토픽 재사용, 별도 인터페이스 없음 | 3.2 마지막 문단, 3.6 Monitor |
| 실행기 | 자동 적용 | 사람 (Docs 따라 수행) — 자동 적용 없음 | 3.4.4, 3.6 Execute |
| 지식 베이스 | 아키텍처 모델·정책 (설계 시 확정) | Insight Read DB가 적응 결과로 갱신 (self-configuration) | 3.3.2, 3.6 Knowledge |
| 불확실성 통제 | 검증된 전략만 실행 | 프리게이트·불변식·7단 검증·결정론 합성·센티넬 | 3.5 응답 검증 |
| 루프 안정성 | 제어 이론적 안정성 | 자기 로그 info 규약, 에피소드 사건당 1회 승급 | 3.3.1 규약 ④, 3.4.4 루프 C |
| 비용 | — | 2단 선별: 모든 배치는 결정론+9B, 트립 시만 27B 그래프 | 3.1 원칙 ④ |

## 3. 설계 문서(7/6) ↔ 코드(8월 스냅샷) 델타

- **핵심**: 설계 문서와 코드가 다르면 논문은 **코드 기준**으로 썼다. 아래는 그 목록. 아티팩트 "Self-Adaptive CQRS 아키텍처"(8/28)의 Δ 섹션과 일치.

| # | 설계 문서 (7/6) | 실제 코드 | 근거 |
| --- | --- | --- | --- |
| 1 | 그래프: decide → 생성기 병렬 fan-out | newReadModel 포함 시 `genNewReadModel → genProjectionMapping` **선확정 체인** 후 잔여 fan-out (§1/§2/§3가 다른 테이블을 가리키던 자기모순 봉쇄) | `annalysis.graph.ts:41-77`, `render.ts renderConfirmedDesign` |
| 2 | 검증 3단 (zod · substring · Docs 계약) | **7단**: zod → 한자 혼입 → 의미(실 Postgres BEGIN→ROLLBACK, `tsc --noEmit`, zod 확장·payload 키) → grounding → 결정론 합성 → 무결성 게이트 → Docs 계약 | `invoke.ts`, `validation/*`, `typescript-synthesis.ts`(813줄), `fallback-recommendation.ts` |
| 3 | decide 가드 = 프리게이트 1종 + 불변식 1종 | 프리게이트 2종(card.miss 단독 → [] · zod 거절 단독 → 권고 단독), 빈 선택 재요청, 앵커별 폴백, `newReadModel ⇒ versionSwitch` 동반 | `decision.node.ts:17-235` |
| 4 | 카드 miss = 단순 HTTP 이상 | miss **2회 이상 = 사용자 조회 의도 신호** → Read Model 재생성 lane (연구 주제의 실제 진입 경로) | `decision.node.ts:23-45`, `prompts/index.ts:100` |
| 5 | 1차 선별 = 순수 LLM | **hybrid**: level≥40 결정론 프리게이트 선행, 센서는 4층 주석 + 룰북 주입, 주석 없으면 LLM 미호출. `SENSOR_OBSERVER_JUDGE_MODE=llm-only`가 ablation | `prejudge.ts:44-70`, `sensor-batch-annotator.ts`, `sensor-screener.ts` |
| 6 | 센서 윈도우마다 승급 | **에피소드** 단위 승급 (정상 N회·15s 무입력·64건 닫힘, 분석 입력 ≤16건) | `sensor-observer.service.ts:296-420` |
| 7 | LLM 호출 규약: 재시도 2회 | 직렬 큐 `runExclusive`, thinking 억제(`reasoning_effort: none`), 전송 실패 예산 3(별도), 마지막 JSON 펜스 + jsonrepair | `shared/llm/*`, `invoke.ts:11-25` |
| 8 | 신호 5종 (S1~S5) | 7~8종: zod 거절(S2)·카드 miss(S6)를 분리, 센서 값(S8)은 토픽 | `logging-context.ts`, 각 발생 지점 |
| 9 | 산출물 경로 `docs/`·`docs/dq/` | `llm-docs/<YYYY-MM-DD>-<HHmmss>-<docId>.md` | `report-filename.ts` |
| 10 | 평가 = 계획 (LLM-as-Judge 미구현) | 층1(500건 룰북 ablation)·층2(20×k5=100런, Claude Sonnet 8병렬 리뷰) **완료**, 층3 계획 | `scripts/eval/*`, `docs/evaluation/*` |
| 11 | 출력 토큰 상한 1,024/2,048/8,192 | 8,192 공통 (thinking 여유) | `prejudge.config.ts`, `analysis.config.ts` |
| 12 | 투영 매핑 = newReadModel 동반 스테이지 (동일) | 동일 + grounding(targetColumn은 fields 대조, sourceField는 카드 substring) | `projection-mapping.node.ts` |
| 13 | 카드 렌더링 | M-Schema, LLM 주입 시 Examples 제거(값 환각 방지), 매핑 노드·Docs 근거 블록만 원문 | `insight-card.renderer.ts`, `prompts/index.ts INSIGHT_CARDS_CAVEAT` |

```tsx
// 델타 ①·②를 한 줄로 — 왜 바뀌었나
7/21 품질 감사: 생성기마다 스키마를 즉흥 창안 → §1/§2/§3가 서로 다른 테이블
  → 선확정 체인 (설계를 먼저 확정하고 주입)
층2 평가: 자동 검증 통과(87%·96%) vs Judge 즉시 활용 41% 격차
  → 의미 검증(실DB·tsc) + 결정론 합성(payload 접근 경로를 ToyDataDto에서 유도)
```

## 4. 논문 3장에 반영한 것 / 뺀 것

- **반영 (코드 기준)**: 선확정 체인, 7단 검증, hybrid 선별, 에피소드, 카드 miss ≥2 = 조회 의도, `llm-docs/` 경로, 6개 Guardrails 원문, 진단 상한 4/2/8, 윈도우 ±20·프루닝 4/6·80행, 도구 상한(40행·120행·4,000자), 코어 예산 8K/20K.
- **압축 (표·그림으로)**: 신호 카탈로그(표), 진단 도구 5종(표), 노드별 프롬프트 구성(표), 검증 7단(표+그림 3-9), MAPE-K 매핑(표+그림 3-10). 프롬프트 원문·Docs 실물 발췌는 본문에 넣지 않음.
- **뺀 것**: 평가 하네스 수치(4장으로), LangGraph 상태 채널 리듀서 세부, `ReadMe`·CLI 실행 절차, 파일:라인 근거(논문 어투와 안 맞음 — 이 노트에만), 설계 문서 대비 변경 이력(이 노트 3절).
- **사실 확인 필요**: (1) `logger.module.ts`의 pino-http 옵션명 `customLevels` → 4xx가 정말 warn으로 찍히는지 실측 (문서상 `customLogLevel`이어야 함). (2) 분석 모델명 표기(qwen3.6-27b-a3b-coder-mtp) 4장과 통일. (3) fluent-bit 설정 파일이 저장소에 없어 TCP→Kafka 브리지는 docker-compose 기준으로만 서술.

```tsx
// 3장 그림 ↔ 근거 파일
그림 3-1  전체 아키텍처        app.module.ts · 각 모듈 서비스
그림 3-2  Event Store·프로젝션  insert.service.ts · catch-up.runner.ts · projector.ts
그림 3-3  로그 컨텍스트         logger.module.ts · log.service.ts · log-window.repository.impl.ts
그림 3-4  Insight Read DB       schema/insight/* · insight-card.renderer.ts · card-drift.observer.ts
그림 3-5  컨텍스트 주입         prompts/index.ts · diagnosis-toolkit.ts · render.ts
그림 3-6  Docs 레이아웃         docs-format-spec.md · render.ts · front-matter.ts
그림 3-7  워크플로·피드백 루프   llm-context.service.ts · card-drift.observer.ts
그림 3-8  파이프라인·그래프      annalysis.graph.ts · prejudge.ts · sensor-observer.service.ts
그림 3-9  검증 계층            invoke.ts · validation/* · typescript-synthesis.ts
그림 3-10 MAPE-K 매핑          (3.6절 표와 동일)
```

---

## 참고 자료

- 대화 맥락에서 정리 — 2026-09-04
- 저장소 `self-adaptive-cqrs`: `docs/architecture/self-adaptive-cqrs-아키텍처.md`(7/6), `src/`(2026-08 스냅샷), `docs/thesis/제3장-설계및구현-초안.md`
- 아티팩트 "Self-Adaptive CQRS 아키텍처" (2026-08-28 구현 스냅샷, 그림 8장)
- Kephart & Chess, "The Vision of Autonomic Computing," 2003 · Weyns, *An Introduction to Self-Adaptive Systems*, 2020 · Garlan et al., "Rainbow," 2004

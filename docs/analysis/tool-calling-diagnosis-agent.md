# 2차 진단 노드의 Tool-Calling 에이전트 전환

## 배경

Self-Adaptive CQRS 연구에서 이상신호 판정은 기존에 신규 키 유입·투영 정합성 위반·카드 없는 Read Model 테이블·요청 충족 실패·센서 베이스라인 이탈이라는 5가지 고정 분류를 프롬프트에 열거해 판정하는 방식이었다. 이번 변경은 그중 2차 진단 단계(근본원인 분석 노드)를 LangChain tool-calling 에이전트로 전환해, LLM이 로그 DB·Insight 카드·센서 베이스라인·소스 코드를 도구로 직접 조회하며 증거를 수집하고 미리 열거하지 않은 미지의 이상 유형도 스스로 명명(open-set 분류)하도록 했다. 1차 선별(prejudge / sensor-screener의 싼 게이트)은 손대지 않았다.

후속 변경으로 에러 관측 강화를 위해 Sentry 도입을 검토했으나 채택하지 않았다. Sentry의 핵심 가치인 "스택 트레이스 + 코드 위치 열람"을 자체 도구 2개(search_logs의 스택 발췌 + read_source_code)로 흡수하는 쪽을 선택했다 — 자체 호스팅 운영 부담, 실험 재현성이 외부 시스템에 의존하게 되는 문제, 그리고 연구 기여가 '에러 수리'가 아니라 'Read Model 재생성 Docs'라는 점 때문이다.

## 아키텍처 변화

```
[변경 전]
로그/센서 윈도우 → (프롬프트에 5분류 열거) → invokeNode(one-shot) → RootCauseAnalysis
                                                                    (닫힌 분류 없음, 서술만)

[변경 후]
로그/센서 윈도우 → invokeAgentNode(ReAct 루프, 도구 왕복 상한 4회)
                     ├─ search_logs (스택 트레이스 상단 프레임 발췌 포함)
                     ├─ read_source_code (스택의 파일:라인 열람, 읽기 전용)
                     ├─ list_insight_cards / get_insight_card
                     ├─ get_sensor_baseline
                     └─ RootCauseAnalysis { ..., anomalyKind(open-set) }
                     (DIAGNOSIS_TOOLKIT 미주입 시 기존 invokeNode로 폴백 — 하위호환)
```

전형적 진단 루프: search_logs로 에러 로그와 스택의 파일:라인 확보 → read_source_code로 해당 코드 위치 확인 → Insight 카드/센서 베이스라인과 대조 → anomalyKind 판정.

의사결정(decisionNode) 이후의 출력 종류(outputKindSchema: versionSwitch / recommendationDocs / newReadModel / dataQualityRecommendation)는 그대로 닫힌 enum이다. 즉 "감지는 open, 행동은 closed" 구조로, 미지 신호가 미지 행동으로 이어지지 않게 했다.

## 파일별 변경 요약

### 신규 파일

| 파일 | 내용 |
|---|---|
| `src/analysis/tools/diagnosis-toolkit.ts` | `DiagnosisToolkit` 인터페이스(순수 데이터 접근 계약), `DIAGNOSIS_TOOLKIT` DI 심볼, `buildDiagnosisTools()` — LangChain `tool()` 5종(`search_logs`, `list_insight_cards`, `get_insight_card`, `get_sensor_baseline`, `read_source_code`) 정의. `read_source_code`는 `SourceCodeRange`(filePath/startLine/endLine)로 저장소 소스 파일을 라인 번호와 함께 읽기 전용 열람. 모든 도구 결과는 4000자에서 truncate(context rot 방지). |
| `src/analysis/tools/diagnosis-toolkit.impl.ts` | Nest `@Injectable` 구현체. Drizzle로 `log_event` 테이블을 `correlationId`/`action`/`sceneKey`/`minLevel`/`limit`(상한 40) 조건 조회해 시간순 JSON 라인으로 반환하되, payload의 `err`/`error` 키에서 스택을 추출(`extractStack()` — export, 테스트 대상)해 상단 6프레임만 `stack` 필드로 발췌(전체 payload는 토큰 잠식이라 미포함). `readSourceCode`: 경로 정규화 후 저장소 내부 + `src/`·`dist/` 접두사만 허용(default-deny), 라인 범위 상한 120줄, 없는 파일은 throw 대신 에이전트가 읽을 수 있는 실패 메시지 반환. `InsightService`로 카탈로그 이름·카드 조회, `readSensorBaseline()`으로 베이스라인 조회. |
| `src/analysis/tools/diagnosis-toolkit.impl.spec.ts` | jest 유닛 테스트 9건 — `extractStack` 3건(err 키/error 키/부재), `readSourceCode` 6건(정상 열람, `../` 탈출 거부, 접두사 밖(.env·node_modules·`src/../.env` 위장 탈출) 거부, 저장소 내부 절대 경로 허용, 파일 없음 메시지, 120줄 캡). |
| `src/analysis/nodes/invoke-agent.ts` | `invokeAgentNode()` — tool-calling 에이전트 루프(ReAct). 도구 왕복 상한 4회(도달 시 수집분만으로 최종 판정 강제), 최종 JSON 스키마 검증 실패 시 `invoke.ts`와 동일한 re-ask 재시도(2회), 전체 호출 수 안전핀(`MAX_TOTAL_INVOCATIONS`). 도구 호출 궤적(`DiagnosisTrajectoryStep`: tool/input/resultPreview)을 함께 반환. |
| `src/analysis/nodes/invoke-agent.spec.ts` | jest 유닛 테스트 4건: 도구 없이 최종 출력, tool_call 실행 및 궤적 기록, re-ask 동작, 최종 실패 시 throw. 가짜 툴킷에 `readSourceCode` 스텁 포함. |

### 수정 파일

| 파일 | 변경 내용 |
|---|---|
| `src/analysis/type/output.type.ts` | `rootCauseAnalysisSchema`에 `anomalyKind: z.string().default("미분류")` 추가. 닫힌 enum이 아닌 open-set — 알려진 유형명 또는 모델이 창안한 새 유형명. |
| `src/analysis/prompts/index.ts` | `ROOT_CAUSE_PROMPT` / `SENSOR_ROOT_CAUSE_PROMPT`에 `(d) anomalyKind` 판정 지시와 JSON 스키마에 `anomalyKind` 필드 추가. 신규 `DIAGNOSIS_TOOLS_GUIDE`(판정 전 증거 수집, 카드로 확인하기 전 "컬럼 없음" 단정 금지, 도구 결과가 발췌와 모순되면 도구 결과 우선). 이후 '스택→소스' 워크플로 지시 추가: search_logs로 stack의 파일:라인 확보 → read_source_code로 해당 라인 주변만 열람(파일 전체 훑기 금지), 실제 읽은 줄만 인용. |
| `src/analysis/nodes/root-cause.node.ts` | `rootCauseNode` → `makeRootCauseNode(toolkit)` 팩토리로 전환. 툴킷 주입 시 `invokeAgentNode`(에이전트), `null`이면 기존 one-shot `invokeNode`(하위호환). 도구 호출 궤적을 `diagnosisTrajectory` 상태로 반환. |
| `src/analysis/analysis.state.ts` | `diagnosisTrajectory: string[]` 상태 채널 추가. 산출 Docs에는 포함하지 않고 서비스가 로그로 남겨 재현성·LLM judge 평가용으로 사용. |
| `src/analysis/annalysis.graph.ts` | `buildAnalysisGraph(toolkit: DiagnosisToolkit | null = null)`로 시그니처 변경. |
| `src/analysis/render.ts` | `renderRootCause`에 "이상 유형" 라인 추가(의사결정 노드 컨텍스트), `renderVerdict`의 TL;DR에 "(이상 유형: X · 심각도: Y)" 표기 추가(산출 Docs에 노출). |
| `src/shared/logger/logger.module.ts` | pino serializers에 `error: stdSerializers.err` 추가. 기존 콜사이트가 `err` 키(pino 기본 직렬화)와 `error` 키(직렬화기 없음 → `{}`로 스택 소실)를 혼용하고 있었는데, 이제 두 키 모두 스택이 `log_event.payload`까지 보존된다. |
| `src/llm-context/llm-context.service.ts`, `src/sensor-observer/sensor-observer.service.ts` | `DIAGNOSIS_TOOLKIT` 주입, `buildAnalysisGraph(toolkit)`로 그래프 생성, 분석 완료 로그에 `diagnosisTrajectory` 기록. |
| `src/llm-context/llm.module.ts`, `src/sensor-observer/sensor-observer.module.ts` | `{ provide: DIAGNOSIS_TOOLKIT, useClass: DiagnosisToolkitImpl }` 프로바이더 등록. |
| `src/insight/insight.service.ts` | `listEntityNames()` 패스스루 추가(카탈로그가 미수출 상태였던 문제 회피). |

## 설계 결정

- **1차/2차 분리 유지**: 1차 스크리너(prejudge/sensor-screener)는 프롬프트 기반을 유지한다. 모든 배치에 실행되어 비용을 지배하기 때문이다. 에이전트는 트리거된 소수의 2차 진단에만 붙어 품질을 지배한다.
- **감지는 open, 행동은 closed**: `anomalyKind`는 자유 문자열(open-set)이지만, 이후 행동을 결정하는 `outputKindSchema`는 여전히 닫힌 enum이다. 미지 신호가 미지 행동으로 이어지지 않도록 경계를 둔다.
- **구조화 출력 방식 유지**: `withStructuredOutput` 대신 기존의 "산문 → ` ```json ` 펜스" + `extractJson` + re-ask 패턴을 그대로 유지했다. 로컬 모델 호환성 때문이다.
- **Sentry 대신 자체 도구**: Sentry의 핵심 가치(스택 트레이스 확보 + 코드 위치 열람)를 pino serializer 수정 + search_logs 스택 발췌 + read_source_code 도구로 흡수했다. 외부 시스템 도입 없이 진단 에이전트가 동일 정보에 접근하며, 실험 재현성도 저장소 안에서 닫힌다.
- **read_source_code 보안 경계(default-deny)**: 경로를 정규화한 뒤 저장소 내부이면서 최상위 세그먼트가 `src/`·`dist/`인 경로만 허용한다. `.env`, `node_modules`, 로그 파일, `../` 탈출, `src/../.env` 같은 위장 탈출을 모두 차단하고, 한 번에 최대 120줄만 반환한다.

## 검증 결과

- `tsc --noEmit` 통과.
- jest 5 suites, 24 tests 전부 통과.

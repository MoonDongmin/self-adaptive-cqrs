# 요청↔에러 매칭 기준 — 여러 요청 중 "어느 요청에서 이 에러가 났는가"

여러 API 요청이 동시에 들어와 로그가 뒤섞여도, 파이프라인은 아래 4단계 기준으로
"이 요청에서 이 에러가 났다"를 특정한 뒤 권고 문서(Docs)를 생성한다.

```
[요청별 correlationId 부여] → [선판단: tripCorrelationIds 선별]
    → [트립 앵커(anchor) 확정] → [±N 윈도우 조립 → 분석 그래프 → Docs]
```

## 1단계 — correlationId: 요청 단위 식별자 (결정론)

모든 HTTP 요청은 진입 시점에 **correlationId** 를 부여받는다
(`src/shared/logger/logger.module.ts` — `x-correlation-id` 헤더가 있으면 그 값,
없으면 `randomUUID()`).

- 그 요청이 처리되는 동안 찍히는 **모든 로그 라인이 같은 correlationId 를 공유**한다.
- 따라서 여러 요청의 로그가 시간순으로 뒤섞여 있어도, correlationId 로 그룹핑하면
  요청별 트레이스가 복원된다. **이것이 요청↔에러 매칭의 1차 기준이다.**

로그는 Kafka 로 흘러 `LogConsumer` 가 버퍼링하는데, 이때 이미 요청 단위 필터가 걸린다
(`src/llm-context/kafka/log-consumer.ts`):

| 버퍼에 남는 로그 | 버퍼에서 제외되는 로그 |
| --- | --- |
| correlationId 보유(=API 요청 기인) | 쓰기 측 적재 로그(`insert.*`, `/insert`) |
| level ≥ 40 (요청 스코프 밖 백그라운드 장애) | correlationId 없고 에러도 아닌 부트/프레임워크 로그 |

## 2단계 — 선판단(prejudge): 문제 요청의 correlationId 선별 (LLM)

버퍼가 주기적으로 드레인되면, 배치 전체(여러 요청의 로그가 섞인 상태)를 소형 LLM
선별기에 원본 JSON 그대로 넘긴다(`src/llm-context/screener/prejudge.ts`).

선별기의 판정 단위가 곧 **correlationId 단위**다:

- "한 correlationId 가 요청 수신 → 처리 → 2xx 완료로 끝나고 사이에 level≥40 이
  없으면 정상" — 즉 **정상/이상 판별 자체를 요청(correlationId) 흐름 단위로 수행**한다.
- 이상으로 판정되면 출력 JSON 의 **`tripCorrelationIds: string[]`** 에 문제가 된
  요청의 correlationId 목록을 담아 반환한다. 배치에 요청이 10개 섞여 있어도
  "이 2개 요청이 문제"라고 집어내는 지점이 여기다.

이상 판정 기준 4가지(시스템 프롬프트에 명시):

1. **순서/시퀀스 이상** — 요청 시작만 있고 완료가 없음
2. **오류/경고** — level ≥ 40 또는 `res.statusCode` ≥ 400
3. **요청 충족 실패** — 'miss' / 'not found' 등 (원인 단정은 의사결정 단계로 이월)
4. **반복 요청** — 서로 다른 correlationId 라도 동일 요청(method+url)이 거듭 유입

## 3단계 — 트립 앵커(anchor): "이 에러"의 확정 (결정론)

`LogWindowRepositoryImpl.buildWindow(tripCorrelationIds)` 가
(`src/llm-context/repository/log-window.repository.impl.ts`) 선별된 요청들의 전체
트레이스를 DB 에서 다시 조회한 뒤, **앵커 = 이 분석이 다루는 단일 에러 지점**을
아래 우선순위로 확정한다(`resolveAnchor`):

1. 트립 트레이스 내 **첫 번째 level ≥ 40 행** (`WINDOW_CONFIG.errorLevel`)
2. 없으면 트레이스의 첫 행 (에러 레벨은 아니지만 이상 흐름의 시작점)
3. 트레이스가 비면 DB 전체에서 가장 최근 level ≥ 40 행 (백그라운드 장애 폴백)

앵커가 기준점이 되어:

- 앵커 앞뒤 ±20행 + 트립 트레이스를 병합하고, 신호 라인(에러/트립 correlationId)
  주변 앞 4줄/뒤 6줄만 남기는 노이즈 프루닝(LogSage 패턴)으로 윈도우를 만든다.
- 렌더된 윈도우 표에서 앵커 행에 `← 트립 앵커` 마크가 붙는다(`src/analysis/render.ts`).
- **에러 발생 시각 = 앵커 행 시각**으로 확정되어 Docs 파일명
  `{발생시각}-{correlationId}.md` 의 프리픽스가 된다.
- `docId = analysis-{tripCorrelationIds[0]}` — 산출 Docs 자체가 문제 요청의
  correlationId 로 명명된다(`src/llm-context/llm-context.service.ts`).

## 4단계 — 권고 문서 생성: [corr:id] 그라운딩 (LLM + 결정론 게이트)

분석 그래프(`src/analysis/annalysis.graph.ts`)는 윈도우를 근거로
근본원인 분석 → 의사결정 → 생성기 fan-out 을 거치는데, 요청↔에러 매칭이 문서까지
유지되도록 두 장치가 있다:

- **결정론 프리게이트** (`src/analysis/nodes/decision.node.ts`): 앵커가
  `insight.card.miss`(존재하지 않는 카드 이름 404)뿐이고 다른 에러 신호가 없으면
  LLM 을 부르지 않고 '조치 불필요'로 확정한다 — 요청은 실패했지만 Read Model 부족
  신호가 아닌 케이스를 걸러낸다.
- **근거 인용 강제**: 권고 문서 생성 프롬프트는 윈도우 표에 실재하는 행만 인용하게
  하고, 각 주장 끝에 `[corr:<correlation_id>]` 를 붙이도록 강제한다. 렌더러도
  evidence 의 correlationId 를 `[corr:id]` 인용으로 출력한다(`renderRecommendationAdr`).
  즉 최종 Docs 의 모든 근거 주장이 "어느 요청의 어느 로그 행" 인지로 역추적된다.

### 정리 — 매칭 기준 요약

| 질문 | 기준 | 성격 |
| --- | --- | --- |
| 이 로그는 어느 요청 것인가 | correlationId (요청 진입 시 부여, 전 로그 전파) | 결정론 |
| 어느 요청이 문제인가 | 선판단 LLM 의 `tripCorrelationIds` | LLM |
| "이 에러"는 어느 행인가 | 트립 트레이스 내 첫 level≥40 행 = 앵커 | 결정론 |
| 문서의 주장은 어느 로그 근거인가 | `[corr:id]` 인용 (윈도우 표의 값만 허용) | LLM + 렌더 검증 |

## 프롬프트 예시 (간략)

시나리오: 투영 실행 중 `MultiModalProjector` 가 `projection.integrity.violation`(level 40,
`read_multimodal.image_2d_uri` 가 null) 경고를 남긴 요청 `ccc-333`. 이 유형은 결정론
프리게이트에 걸리지 않고 decision 노드까지 가서 `recommendationDocs` lane 으로
라우팅되는, 권고 문서가 실제로 생성되는 케이스다.
(반면 `insight.card.miss` 단독 앵커는 프리게이트에서 '조치 불필요'로 종결되어
권고 문서 생성기에 도달하지 않는다.)

### (a) 선판단 — 배치에서 문제 요청 선별

```text
[System]
너는 로그 이상 1차 선별기다. 최근 로그 원본(JSON 한 줄당 한 레코드)을 보고
"들여다볼 문제가 있는가"만 판정해.

확실한 정상: 한 correlationId가 요청 수신 → 도메인 처리 → 'request completed'(2xx)로
끝나고 사이에 level>=40 로그가 없는 흐름.
이상: ① 시작만 있고 완료 없음 ② level>=40 또는 statusCode>=400 ③ 요청 충족 실패
④ 동일 요청 반복(다른 correlationId 여도).

마지막에 JSON만 출력:
{ "triggered": boolean, "reason": string, "tripCorrelationIds": string[] }

[User]
(A) 최근 로그 원본:
{"time":1720240000123,"level":30,"correlationId":"ccc-333","action":"projection.request","req":{"method":"POST","url":"/projection/multimodal"},...}
{"time":1720240000456,"level":40,"correlationId":"ccc-333","action":"projection.integrity.violation","msg":"image_2d_uri null — 정합성 위반",...}
{"time":1720240000789,"level":30,"correlationId":"bbb-222","msg":"request completed","res":{"statusCode":200},...}

[기대 출력]
{ "triggered": true,
  "reason": "ccc-333 요청 처리 중 level 40 정합성 위반 발생. bbb-222는 정상 완료.",
  "tripCorrelationIds": ["ccc-333"] }
```

### (b) 권고 문서 — 근본원인+윈도우+스키마+소스 4종 입력, [corr:id] 인용

실제 노드(`recommendation-docs.node.ts`)는 윈도우 표만 주지 않는다. **① 근본원인 분석
(rootCause 노드 산출) ② 이상 로그 윈도우 ③ Insight 카드(현재 스키마) ④ 기존 구현
실제 소스**(프로젝터/테이블/컨트롤러 — `source-examples.ts` 가 디스크에서 로드) 4종을
합쳐 넘기고, 출력은 ADR 구조(evidence → observations → solutionOptions)의 JSON 이다.

```text
[System — RECOMMENDATION_DOCS_PROMPT 발췌]
너는 Read Model 보강 권고 문서 생성자다. 입력은 (1) 근본원인 분석, (2) 이상 로그 ±N 윈도우(표),
(3) 현재 도메인 스키마(Insight 카드), (4) 기존 구현 실제 소스다.

[1단계 — 근거(evidence)] 윈도우 표에서 문제를 가리키는 로그를 그대로 인용하라.
  - 각 근거는 그 행의 correlation_id, action, level, msg 를 표의 셀 값 그대로 옮긴다(지어내지 말 것).
[2단계 — 관찰(observations)] 근거 + 현재 스키마 + 실제 소스를 대조해 읽히는 상황을 항목으로.
  - Insight 카드의 실제 컬럼명·의미를 인용하라. 주입된 소스의 실제 코드 위치를 짚어라.
[3단계 — 해결책(solutionOptions)] 성립하는 옵션만, 가능하면 서로 구별되는 2개 이상.
[근거 id 인용] evidence·observations 각 주장 끝에 [corr:<correlation_id>]를 붙여라.

[User — 4종 입력 발췌]
## 근본원인 분석
- 이상 유형: 투영 정합성 위반
- 요약: multimodal 투영에서 image_2d_uri 가 null 로 적재되어 정합성 위반 경고 발생
- 실패한 요청 의도: 2D 이미지 경로가 채워진 멀티모달 Read Model 조회
- 의심되는 Read Model 부족: read_multimodal.image_2d_uri 미투영(프로젝터가 null 고정)

## 이상 로그 맥락 (±N 윈도우)
| time | level | action | correlation_id | msg |
| --- | --- | --- | --- | --- |
| 12:00:00.123 | 30 | projection.request | ccc-333 | POST /projection/multimodal |
| 12:00:00.456 | 40 | projection.integrity.violation | ccc-333 | image_2d_uri null — 정합성 위반 ← 트립 앵커 |

## 도메인 스키마(Insight 카드)
## ReadModel: read_multimodal
- image_2d_uri (text): 2D 이미지 저장 경로 — 현재 전 행 null

### 기존 구현 실제 소스 — MultiModalProjector (발췌)
map(event: EventStoreEventRow): Insert { ... image2dUri: null, ... }

[기대 출력 — 일부]
{ "targetReadModel": "read_multimodal",
  "evidence": [{ "correlationId": "ccc-333", "action": "projection.integrity.violation", "level": 40,
    "logQuote": "image_2d_uri null — 정합성 위반",
    "interpretation": "read_multimodal 의 image_2d_uri 가 투영되지 않아 조회 의도를 못 채움 [corr:ccc-333]" }],
  "observations": ["Insight 카드상 image_2d_uri 는 2D 이미지 경로 컬럼이나 전 행 null [corr:ccc-333]",
    "multimodal.projector.ts 의 map() 이 image2dUri 를 null 로 고정하고 있음"],
  "solutionOptions": [{ "title": "프로젝터 map() 보강", "approach": "map()에서 payload 의 이미지 경로를 매핑",
    "suggestedFields": ["image_2d_uri"], "tradeoffs": "기존 행은 재투영(catch-up) 필요", "codeSnippet": "..." }],
  "recommendedOption": "프로젝터 map() 보강 — 스키마 변경 없이 값 결손만 해소", ... }
```

이 JSON 이 그대로 문서가 되는 것이 아니라, `render.ts` 의 `renderRecommendationAdr` 가
ADR 골격(Status/Context/Decision Drivers/Considered Options/Decision Outcome/
Consequences/Non-Goals)으로 결정론 렌더링하며, 이때 evidence 의 correlationId 가
`[corr:ccc-333]` 인용으로 §1 권고 섹션에 박힌다.

## 관련 소스

- correlationId 부여: `src/shared/logger/logger.module.ts` (`genReqId`)
- 버퍼 필터: `src/llm-context/kafka/log-consumer.ts`
- 선판단: `src/llm-context/screener/prejudge.ts`
- 앵커·윈도우: `src/llm-context/repository/log-window.repository.impl.ts`, `log-window.config.ts`
- 오케스트레이션(docId·파일명): `src/llm-context/llm-context.service.ts`, `src/analysis/report-filename.ts`
- 프리게이트·근거 인용: `src/analysis/nodes/decision.node.ts`, `src/analysis/prompts/index.ts`, `src/analysis/render.ts`

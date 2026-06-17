# prejudge LLM 호출: Ollama → LM Studio 전환 구현 가이드

> 생성일: 2026-06-17
> 대상 브랜치: main

## 1. 목표 & 배경

- **무엇을**: 선판단(prejudge) 단계의 LLM 호출 대상을 Ollama(`ChatOllama`, 포트 `11434`)에서 mac mini의 **LM Studio**(OpenAI 호환 API, 포트 `1234`, 모델 `qwen/qwen3-14b`)로 전환한다.
- **왜**: 현재 `prejudge.ts`는 `@langchain/ollama`의 `ChatOllama`로 Ollama 전용 API(`/api/chat`)를 호출하는데, 실제 가동 중인 추론 서버는 mac mini의 LM Studio다. LM Studio는 **Ollama 프로토콜을 말하지 못하고 OpenAI 호환 API(`/v1/chat/completions`)만 노출**한다. 그래서 `/llm-context/detect` 와 주기 실행 모두 `TypeError: fetch failed: connect ECONNREFUSED ...:11434` 로 매번 실패한다.
- **성공 기준**:
  - [ ] `prejudge`가 `ChatOpenAI`(OpenAI 호환 클라이언트)로 LM Studio에 붙는다.
  - [ ] `GET /llm-context/detect` 수동 트리거가 500 없이 `PrejudgeChecked` 결과를 반환한다.
  - [ ] 주기 실행 로그에 `선판단 주기 실행 실패`(fetch failed)가 더 이상 찍히지 않는다.
  - [ ] `any` 미사용, 전체 단어 식별자 등 프로젝트 규칙 준수.

## 2. 현재 구조 분석

- `src/llm-context/screener/prejudge.ts` — `prejudge()` 함수. `new ChatOllama({ model, baseUrl, temperature })` 로 모델 생성 후 `model.invoke([SystemMessage, HumanMessage])` 호출. 응답에서 `extractJson` → `prejudgeCheckedSchema.parse` 로 검증. **이 파일이 핵심 변경 대상.**
- `src/llm-context/screener/prejudge.config.ts` — `PREJUDGE_CONFIG` 상수. `model`, `baseUrl`, `temperature`, `frequencyWindowHours` 보유. `baseUrl`이 `process.env.OLLAMA_BASE_URL ?? "http://localhost:11434"`.
- `src/llm-context/llm-context.service.ts` — `LLMContextService.detectOnce()`가 `prejudge(batch, summary)` 호출. 주기 실행(`setInterval`) + 수동 트리거 양쪽의 진입점. **변경 불필요**(prejudge 시그니처를 유지하므로).
- `src/llm-context/llm-context.controller.ts` — `GET /llm-context/detect` 가 `detectOnce()`를 수동 호출. **변경 불필요.**
- `.env` — 현재 다음과 같이 **일부만** 수정된 상태:
  ```
  OLLAMA_BASE_URL=dongmin-macmini.tailbcf5e6.ts.net:1234
  PREJUDGE_MODEL=qwen/qwen3-14b
  ```
  포트/모델은 LM Studio에 맞춰졌지만 **`http://` 스킴과 `/v1` 경로가 빠져 있다.** OpenAI 호환 클라이언트는 `http://host:1234/v1` 형태의 baseURL을 요구한다.
- `package.json` — 의존성에 `@langchain/core`, `@langchain/ollama`만 있고 **`@langchain/openai` 없음**. 패키지 매니저는 bun(`bun.lock`).

### 호출 흐름 (현재)

```
LLMContextService.detectOnce()
  └─ prejudge(batch, summary)            # prejudge.ts
       └─ new ChatOllama({ baseUrl })    # ← 11434 / Ollama 프로토콜 (문제 지점)
            └─ fetch http://...:11434/api/chat   # ← ECONNREFUSED
```

## 3. 변경 사항 요약

- `[mod]` `package.json` (+ `bun.lock`) — `@langchain/openai` 의존성 추가
- `[mod]` `src/llm-context/screener/prejudge.config.ts` — `baseUrl` 기본값을 LM Studio `/v1` 형태로, env 이름/조립 방식 정리
- `[mod]` `src/llm-context/screener/prejudge.ts` — `ChatOllama` → `ChatOpenAI` 교체 (생성 부분만; 프롬프트·파싱 로직은 그대로)
- `[mod]` `.env` — `OLLAMA_BASE_URL` 값에 `http://` + `/v1` 보강 (또는 변수명 변경 시 함께 정리)

> 파싱 로직(`extractJson`, `contentToString`, `prejudgeCheckedSchema.parse`)과 프롬프트(`SYSTEM_PROMPT`, 표 렌더링)는 **전혀 건드리지 않는다.** 클라이언트 교체만으로 충분하다.

## 4. 구현 순서 (Bottom-up)

### Step 1: `@langchain/openai` 의존성 추가

**파일**: `package.json` *(수정)* — 명령으로 자동 갱신

**목표**: OpenAI 호환 클라이언트 `ChatOpenAI`를 쓸 수 있게 패키지를 설치한다.

**왜 이 순서**: 이후 Step 3에서 `import { ChatOpenAI } from "@langchain/openai"` 가 해석되려면 패키지가 먼저 존재해야 한다. 코드 의존성의 최하단.

**구현**:
```bash
bun add @langchain/openai
```

**주의사항**:
- `@langchain/core` 버전(`^1.1.49`)과 호환되는 `@langchain/openai` 버전이 설치되는지 확인한다. peer 경고가 뜨면 `@langchain/openai@latest`가 `@langchain/core` v1 라인을 요구하는지 확인.
- 설치 후 `@langchain/ollama` 는 더 이상 prejudge에서 쓰지 않게 된다. 다른 곳에서 import하지 않는다면 Step 3 완료 후 `bun remove @langchain/ollama` 로 정리해도 된다(선택). **단, 본인 변경으로 고아가 된 것만 제거** — 다른 사용처가 없는지 `grep -rn "@langchain/ollama" src` 로 먼저 확인.

### Step 2: `prejudge.config.ts` — LM Studio용 baseURL/model 정리

**파일**: `src/llm-context/screener/prejudge.config.ts` *(수정)*

**목표**: 설정값을 OpenAI 호환(`http://host:1234/v1`) 형태로 맞추고, 빈 env일 때의 기본값도 LM Studio 기준으로 둔다.

**왜 이 순서**: Step 3의 `prejudge.ts`가 이 설정을 읽는다. 설정이 올바른 형태(스킴 + `/v1`)여야 클라이언트가 동작하므로 클라이언트 교체보다 먼저 정리한다.

**변경 전**:
```typescript
export const PREJUDGE_CONFIG = {
  model: process.env.PREJUDGE_MODEL ?? "qwen2.5:7b",
  baseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
  temperature: 0,
  frequencyWindowHours: 1,
} as const;
```

**변경 후** (변수명을 의미에 맞게 `LLM_BASE_URL`로 바꾸는 안 — 권장):
```typescript
export const PREJUDGE_CONFIG = {
  model: process.env.PREJUDGE_MODEL ?? "qwen/qwen3-14b",
  baseUrl:
    process.env.LLM_BASE_URL ??
    "http://dongmin-macmini.tailbcf5e6.ts.net:1234/v1",
  apiKey: process.env.LLM_API_KEY ?? "lm-studio",
  temperature: 0,
  frequencyWindowHours: 1,
} as const;
```

**주의사항**:
- LM Studio는 API 키 검증을 하지 않지만 `ChatOpenAI`(OpenAI SDK)는 빈 키면 throw하므로 더미 `apiKey`("lm-studio")를 둔다.
- `baseUrl`은 반드시 **스킴(`http://`)과 `/v1` 경로**를 포함해야 한다. LM Studio의 모델 목록 엔드포인트는 `GET {baseUrl}/models`, 채팅은 `POST {baseUrl}/chat/completions`로 동작한다.
- 변수명을 `OLLAMA_BASE_URL` 그대로 두고 싶다면 이 Step의 `LLM_BASE_URL`을 `OLLAMA_BASE_URL`로 바꾸고, Step 4의 `.env`도 그에 맞춘다. 다만 더 이상 Ollama가 아니므로 이름을 바꾸는 쪽이 혼동을 줄인다(약어 금지 규칙과 무관하게 의미 일치 차원의 권장).

### Step 3: `prejudge.ts` — `ChatOllama` → `ChatOpenAI` 교체

**파일**: `src/llm-context/screener/prejudge.ts` *(수정)*

**목표**: 모델 생성 부분만 OpenAI 호환 클라이언트로 바꾼다. 나머지(프롬프트, 표 렌더링, `extractJson`, zod 검증)는 그대로 둔다.

**왜 이 순서**: Step 1(패키지)과 Step 2(설정)가 끝나야 import와 설정 참조가 모두 성립한다.

**변경 전** (상단 import):
```typescript
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOllama } from "@langchain/ollama";
```

**변경 후** (상단 import):
```typescript
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
```

**변경 전** (`prejudge` 함수 내 모델 생성):
```typescript
  const model = new ChatOllama({
    model: PREJUDGE_CONFIG.model,
    baseUrl: PREJUDGE_CONFIG.baseUrl,
    temperature: PREJUDGE_CONFIG.temperature,
  });
```

**변경 후**:
```typescript
  const model = new ChatOpenAI({
    model: PREJUDGE_CONFIG.model,
    apiKey: PREJUDGE_CONFIG.apiKey,
    temperature: PREJUDGE_CONFIG.temperature,
    configuration: {
      baseURL: PREJUDGE_CONFIG.baseUrl,
    },
  });
```

**주의사항**:
- `ChatOpenAI`는 baseURL을 최상위 `baseUrl`이 아니라 **`configuration.baseURL`** (OpenAI SDK ClientOptions)로 받는다. 이름과 위치를 혼동하지 말 것 (`ChatOllama`의 `baseUrl`과 다름).
- `model.invoke([SystemMessage, HumanMessage])` 호출부와 `response.content` 처리(`contentToString`)는 그대로 동작한다. `ChatOpenAI`도 동일한 `BaseChatModel` 인터페이스를 따르므로 메시지 타입(`SystemMessage`/`HumanMessage`)을 그대로 쓸 수 있다.
- **qwen3 추론(thinking) 모델 주의**: `qwen/qwen3-14b`는 `<think>...</think>` 추론 블록을 응답 앞에 붙일 수 있다. 현재 `extractJson`은 **마지막 ` ```json ` 블록**(없으면 첫 `{` ~ 마지막 `}`)을 집으므로(`prejudge.ts:69`) 추론 텍스트가 앞에 와도 동작한다. 만약 모델이 ` ```json ` 펜스 없이 추론만 길게 뱉어 JSON을 안 주면 `JSON.parse`가 throw → `LLMContextService`의 catch에서 로깅된다. 이 경우 프롬프트의 출력 형식 지시를 강화하거나, LM Studio에서 추론 모드를 끄는 것으로 대응(이번 변경 범위 밖, 관찰되면 후속 조치).
- `as any` / 암시적 any 금지. `ChatOpenAI` 생성자 옵션은 타입이 잡혀 있으므로 단언 없이 그대로 통과해야 정상.

### Step 4: `.env` 정리

**파일**: `.env` *(수정)*

**목표**: 런타임 env를 Step 2의 키 이름/형식과 일치시킨다.

**왜 이 순서**: 코드가 읽는 변수명과 형식이 확정된 뒤 env를 맞춘다.

**변경 전**:
```
OLLAMA_BASE_URL=dongmin-macmini.tailbcf5e6.ts.net:1234
PREJUDGE_MODEL=qwen/qwen3-14b
```

**변경 후** (Step 2에서 `LLM_BASE_URL` 채택 시):
```
LLM_BASE_URL=http://dongmin-macmini.tailbcf5e6.ts.net:1234/v1
LLM_API_KEY=lm-studio
PREJUDGE_MODEL=qwen/qwen3-14b
```

**주의사항**:
- 핵심 수정 두 가지: **(1) `http://` 스킴 추가, (2) 끝에 `/v1` 추가.** 이 둘 중 하나라도 빠지면 OpenAI SDK가 잘못된 URL로 요청해 404 또는 연결 오류가 난다.
- 변수명을 `OLLAMA_BASE_URL`로 유지하기로 했다면 Step 2와 여기 둘 다 그 이름으로 통일.

## 5. 테스트 포인트

- **수동 확인 (가장 빠름)**: 서버 기동 후
  ```bash
  curl http://localhost:3000/llm-context/detect
  ```
  - 배치가 비어 있으면 `null`(정상 — drain할 로그 없음).
  - 배치가 있으면 `PrejudgeChecked`(`{ triggered, reason, tripCorrelationIds }`) JSON. 500이 안 나면 LM Studio 연결 성공.
- **LM Studio 직접 확인** (코드 수정 전/후 비교용):
  ```bash
  curl http://dongmin-macmini.tailbcf5e6.ts.net:1234/v1/models
  ```
  `qwen/qwen3-14b` 가 목록에 보이면 서버·모델 준비 완료.
- **주기 실행 로그**: `start:dev` 로 띄워두고 `선판단: 트리거` / `선판단: 정상` INFO 로그가 찍히는지, `선판단 주기 실행 실패` ERROR가 사라졌는지 관찰.
- **타입/린트**:
  ```bash
  bunx tsc --noEmit
  bun run lint
  ```

## 6. 체크리스트

- [ ] Step 1: `bun add @langchain/openai` 완료, `bun.lock` 갱신
- [ ] Step 2: `prejudge.config.ts` baseURL `/v1` 형태 + `apiKey` 추가
- [ ] Step 3: `prejudge.ts` import 및 모델 생성 `ChatOpenAI`로 교체 (`configuration.baseURL` 위치 확인)
- [ ] Step 4: `.env` 에 `http://` + `/v1` 보강 (변수명 통일)
- [ ] (선택) 미사용 `@langchain/ollama` 제거 — 다른 사용처 없을 때만
- [ ] `bunx tsc --noEmit` 통과 (any 없음 확인)
- [ ] `bun run lint` 통과
- [ ] `GET /llm-context/detect` 500 없이 응답
- [ ] 주기 실행 로그에서 fetch failed 소멸 확인

## 7. 주의사항 & 리스크

- **네트워크 의존**: LM Studio는 Tailscale 너머 mac mini에 있다. mac mini가 꺼져 있거나 LM Studio 서버가 내려가면 다시 `ECONNREFUSED`가 난다. 또한 LM Studio의 "Local Server"가 외부(0.0.0.0) 바인딩이어야 Tailscale로 들어오는 요청을 받는다(localhost 전용이면 거부). 현재 `:1234`가 응답 중인 것은 확인됨.
- **모델 로드 상태**: LM Studio는 요청 시 모델이 메모리에 로드돼 있어야 한다. 언로드 상태면 첫 요청에서 지연되거나 모델 not found가 날 수 있다.
- **추론 모델 출력 변동성**: 위 Step 3 주의사항대로 `qwen3`가 JSON을 안정적으로 안 줄 가능성이 있다. 실패가 잦으면 프롬프트 보강이 후속 과제가 될 수 있다(이번 범위 밖).
- **변경 범위 최소화**: 이번 작업은 "클라이언트 교체"가 전부다. `LLMContextService`, 컨트롤러, 프롬프트, 파싱 로직은 건드리지 않는다 — 변경 라인이 늘면 그만큼 회귀 위험만 커진다.

import type { BaseMessage } from '@langchain/core/messages';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import type { z } from 'zod';
import { ANALYSIS_CONFIG } from '@/analysis/analysis.config';
import { findHanCharacterProblems } from '@/analysis/validation/text-quality';
import { contentToString, extractJson } from '@/shared/llm/llm-json';
import { runExclusive } from '@/shared/llm/llm-serial-queue';
import { thinkingControlKwargs } from '@/shared/llm/thinking-control';

// 코드가 담긴 큰 JSON 출력은 파싱/스키마 검증이 확률적으로 깨진다. 한 번 깨졌다고
// 섹션을 통째로 비우면(§1 센티넬 + §2/§3 충실) 자기모순 Docs 가 되므로 1회 재시도한다.
// 단 temperature 0 에서 동일 프롬프트 재전송은 같은 실패를 그대로 재현하므로(블라인드 재시도 무효),
// 재시도 시에는 직전 응답 + 검증 에러를 대화에 누적해 모델이 자기 출력을 고치게 한다(re-ask).
const MAX_ATTEMPTS = 2;

// 전송 계층 실패(타임아웃·서버 순단)는 모델 출력 실패와 별개 예산으로 센다 — 실측상
// 정상 서버에서 dataQuality 급 요청은 ~141초인데 서버 행/순단이 끼면 900초 타임아웃이
// 연쇄돼 시도 2회가 전부 전송 실패로 증발, §1 이 통째로 강등된다(2026-07-24 A4 실측:
// SQL 품질과 무관한 껍데기 문서). 전송 실패는 re-ask 와 달리 고칠 출력이 없는 확률적
// 실패이므로 추가 재시도가 유효하다.
const MAX_TRANSPORT_FAILURES = 3;

// 의미 검증기: 형태(zod)는 통과했지만 내용이 깨진 출력(실행 불능 SQL, 컴파일 불능 코드)을
// 잡는다. 문제 목록(빈 배열 = 통과)을 반환하면 invokeNode 가 같은 re-ask 루프로 오류를
// 보여주며 재생성시킨다. 재시도 소진 시에는 마지막 출력을 그대로 반환한다 — 노드별
// 결정론 폴백(격리 SQL 합성 등)이 최종 안전망이므로 여기서 문서를 통째로 죽이지 않는다.
export type SemanticValidator<T> = (output: T) => Promise<string[]>;

export async function invokeNode<T>(
  rolePrompt: string,
  facts: string,
  schema: z.ZodType<T>,
  semanticValidate?: SemanticValidator<T>,
): Promise<T> {
  const model = new ChatOpenAI({
    model: ANALYSIS_CONFIG.model,
    apiKey: ANALYSIS_CONFIG.apiKey,
    temperature: ANALYSIS_CONFIG.temperature,
    maxTokens: ANALYSIS_CONFIG.maxOutputTokens,
    // qwen3.6 계열은 하이브리드 thinking 모델 — 추론이 출력 상한을 전부 잠식해
    // content 0자(finish=length, reasoning_tokens=완전 소진)로 JSON 파싱이 죽는다
    // (2026-07-14 실측: 511/511 토큰이 전부 reasoning). sensor-screener·prejudge 와
    // 동일하게 LM Studio 의 reasoning_effort 매핑으로 thinking 을 끈다.
    modelKwargs: thinkingControlKwargs(ANALYSIS_CONFIG.baseUrl),
    // 요청 단위 타임아웃 — 미설정 시 서버 순단·요청 유실에 사이클이 영원히 매달린다
    // (2026-07-14 실측: 동시 요청 시 LM Studio 가 한쪽을 응답 없이 유실). 재시도는
    // LangChain 기본(6회) 그대로 두면 실패 표면화까지 시간이 과도해 2회로 제한한다.
    timeout: ANALYSIS_CONFIG.timeoutMS,
    maxRetries: 2,
    configuration: {
      baseURL: ANALYSIS_CONFIG.baseUrl,
      timeout: ANALYSIS_CONFIG.timeoutMS,
    },
  });

  const messages: BaseMessage[] = [
    new SystemMessage(rolePrompt),
    new HumanMessage(facts),
  ];

  let lastError: unknown;
  let lastSemanticallyInvalid: T | undefined;
  let transportFailures = 0;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    // fan-out 된 생성기들이 동시에 서버를 치지 않게 직렬화(큐 대기가 타임아웃을 잠식하는 것 방지).
    let response: BaseMessage;
    try {
      response = await runExclusive(() => model.invoke(messages));
    } catch (error) {
      // 전송 계층 실패(타임아웃·서버 순단)는 파싱 실패와 달리 고칠 출력이 없으므로
      // 같은 대화로 재시도만 한다. temperature 0 재전송 무효 원칙은 '모델이 낸 출력'에만
      // 해당하고, 타임아웃은 서버 부하에 따른 확률적 실패라 재시도가 유효하다
      // (2026-07-23 A4 실측: versionSwitch 타임아웃 1회로 필수 §3 가 통째로 소실 —
      // 루프 밖에서 던져져 re-ask/폴백 어느 층도 작동하지 않았다).
      // 전송 실패는 모델 출력 시도(MAX_ATTEMPTS)를 소모하지 않는다 — 별도 예산으로 세어,
      // 서버 행 연쇄가 re-ask 기회까지 증발시키는 것을 막는다(2026-07-24 A4 실측).
      lastError = error;
      transportFailures++;
      console.warn(
        `[invokeNode] LLM 호출 실패(전송 ${transportFailures}/${MAX_TRANSPORT_FAILURES}):`,
        String(error),
      );
      if (transportFailures < MAX_TRANSPORT_FAILURES) {
        i--;
      }
      continue;
    }

    let parsed: T;
    try {
      parsed = schema.parse(extractJson(contentToString(response.content)));
    } catch (error) {
      lastError = error;
      messages.push(
        response, // 모델이 자기가 낸 출력을 보고 고치도록 실패 응답을 대화에 남긴다
        new HumanMessage(
          [
            "직전 출력이 JSON 추출 또는 스키마 검증에 실패했다. 오류:",
            String(error),
            "위 오류를 반영해 수정하고, 동일한 스키마의 JSON만 코드블록으로 다시 출력하라.",
          ].join("\n"),
        ),
      );
      continue;
    }

    // 한자 혼입 검사는 노드 공통이다 — 로컬 모델이 한국어 산문에 且 류 한자를 섞는 오염은
    // 어느 생성 노드에서든 발생하므로(2026-07-23 fix1 실측: dataQuality·versionSwitch 양쪽)
    // 노드별 semanticValidate 가 아니라 이 공통 관문에서 잡는다.
    const problems = [
      ...findHanCharacterProblems(parsed),
      ...(semanticValidate !== undefined ? await semanticValidate(parsed) : []),
    ];
    if (problems.length === 0) {
      return parsed;
    }

    lastSemanticallyInvalid = parsed;
    console.warn(
      `[invokeNode] 의미 검증 실패(시도 ${i + 1}/${MAX_ATTEMPTS}):`,
      problems,
    );
    messages.push(
      response,
      new HumanMessage(
        [
          "직전 출력의 형태는 유효하나, 산출물을 실제로 검증한 결과 아래 문제가 확인됐다:",
          ...problems.map((problem) => `- ${problem}`),
          "각 문제를 수정해 동일한 스키마의 JSON만 코드블록으로 다시 출력하라.",
          "SQL 은 실제 DB 에서 그대로 실행되고, 코드는 그대로 컴파일돼야 한다.",
        ].join("\n"),
      ),
    );
  }

  // 의미 검증만 실패한 경우엔 마지막 출력을 살린다 — 노드별 결정론 폴백이 보정한다.
  if (lastSemanticallyInvalid !== undefined) {
    console.warn("[invokeNode] 의미 검증 재시도 소진 — 마지막 출력 유지(폴백에 위임)");
    return lastSemanticallyInvalid;
  }

  throw lastError;
}

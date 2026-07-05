import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { type LogBatchRecord, type PrejudgeChecked, prejudgeCheckedSchema } from '@/llm-context/llm-context.type';
import { PREJUDGE_CONFIG } from '@/llm-context/screener/prejudge.config';
import { contentToString, extractJson } from '@/shared/llm/llm-json';

const SYSTEM_PROMPT: string = [
  "너는 로그 이상 1차 선별기다. 아래 (A) 최근 로그 원본(JSON 한 줄당 한 레코드)을",
  '보고 "들여다볼 문제가 있는가"만 판정해.',
  "",
  "다음은 '확실한 정상'이다(애매가 아니므로 triggered=false):",
  "  - 한 correlationId가 요청 수신 → 도메인 처리 → 'request completed'",
  "    (res.statusCode 2xx)로 끝나고, 그 사이에 warning/error(level>=40) 로그가",
  "    하나도 없는 정상 요청 흐름.",
  "  - action 필드가 없는 로그(DEBUG, 'request completed' 등 프레임워크/자동",
  "    로그)는 그 자체로 정상이다. action 부재를 '단계 누락'으로 보지 마라.",
  "",
  "다음은 이상이다(triggered=true). HTTP가 2xx로 끝나더라도 아래 신호가 있으면",
  "정상이 아니라 이상으로 본다:",
  "  ① 순서/시퀀스 이상 — 정상 흐름을 벗어난 순서(예: 요청 시작만 있고 완료 없음).",
  "  ② 오류/경고 — level>=40(warning·error·fatal) 또는 res.statusCode>=400.",
  "  ③ 요청 충족 실패 — 요청한 리소스가 존재하지 않음(예: 'miss'/'not found'/",
  "     '카드 없음'). 다만 이것이 'Read Model 부족'인지 '단순히 잘못된/존재하지 않는",
  "     이름 조회'인지는 선판단에서 단정하지 마라. 들여다볼 가치가 있으면 triggered=true로",
  "     넘기되, 원인 판정과 조치 여부는 의사결정 단계에 맡긴다.",
  "  ④ 반복 요청 — 같은 요청(동일 req.method+req.url, 또는 동일 action+대상",
  "     리소스)이 배치 안에서 여러 번 반복됨. 서로 다른 correlationId라도 동일",
  "     요청이 거듭 들어오면 이상으로 본다.",
  "",
  "위 '확실한 정상'에 해당하지 않으면서 판단이 애매하면 triggered=true 로 둬.",
  "추론은 자유롭게 산문으로 한 뒤, 마지막에 아래 형식의 JSON만 코드블록으로 출력:",
  "```json",
  '{ "triggered": boolean, "reason": string, "tripCorrelationIds": string[] }',
  "```",
].join("\n");

// 배치를 원본 JSON 그대로(레코드당 한 줄) 넘긴다. 표로 압축하면 req/res/
// responseTime 같은 맥락 필드가 사라지고, action 없는 정상 로그가 빈 칸이 되어
// "단계 누락"처럼 오해되므로 원본을 통째로 준다.
function renderBatchRaw(batch: LogBatchRecord[]): string {
  return batch.map((record) => JSON.stringify(record)).join("\n");
}

export async function prejudge(
  batch: LogBatchRecord[],
): Promise<PrejudgeChecked> {
  const model = new ChatOpenAI({
    model: PREJUDGE_CONFIG.model,
    apiKey: PREJUDGE_CONFIG.apiKey,
    temperature: PREJUDGE_CONFIG.temperature,
    maxTokens: PREJUDGE_CONFIG.maxOutputTokens,
    configuration: {
      baseURL: PREJUDGE_CONFIG.baseUrl,
    },
  });

  const userPrompt: string = [
    "(A) 최근 로그 원본 (시간순, JSON 한 줄당 한 레코드):",
    renderBatchRaw(batch),
  ].join("\n");

  const response = await model.invoke([
    new SystemMessage(SYSTEM_PROMPT),
    new HumanMessage(userPrompt),
  ]);

  // unknown → zod 검증. 파싱 실패하면 throw → service에서 잡아 로깅.
  return prejudgeCheckedSchema.parse(
    extractJson(contentToString(response.content)),
  );
}

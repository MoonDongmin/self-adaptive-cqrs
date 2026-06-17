import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import {
  type FrequencySummary,
  type LogBatchRecord,
  type PrejudgeChecked,
  prejudgeCheckedSchema,
} from "@/llm-context/llm-context.type";
import { PREJUDGE_CONFIG } from "@/llm-context/screener/prejudge.config";

const SYSTEM_PROMPT: string = [
  "너는 로그 이상 1차 선별기다. 아래 (A) 최근 배치와 (B) 빈도 요약을 보고",
  '"들여다볼 문제가 있는가"만 판정해. 개수는 (B)에 이미 집계돼 있으니',
  "세지 말고 해석만 하라. 두 종류의 이상을 노린다:",
  "  ① 순서/시퀀스 이상 — 배치 안에서 정상 흐름을 벗어난 순서.",
  "  ② 반복/빈도 이상 — 같은 action이 평소보다 비정상적으로 많은 경우.",
  "중요: 확신이 없으면 triggered=true 로 둬.",
  "추론은 자유롭게 산문으로 한 뒤, 마지막에 아래 형식의 JSON만 코드블록으로 출력:",
  "```json",
  '{ "triggered": boolean, "reason": string, "tripCorrelationIds": string[] }',
  "```",
].join("\n");

// 배치를 시간순 마크다운 표로. time(epoch ms)은 ISO로 보여 가독성↑.
function renderBatchTable(batch: LogBatchRecord[]): string {
  const header =
    "| time | level | action | correlation_id | msg |\n| --- | --- | --- | --- | --- |";

  const lines: string[] = batch.map((record) => {
    const time: string = new Date(record.time).toISOString();
    return `| ${time} | ${record.level} | ${record.action ?? ""} | ${record.correlation_id ?? ""} | ${record.msg ?? ""} |`;
  });

  return [header, ...lines].join("\n");
}

// 빈도 요약을 마크다운 표로.
function renderFrequencyTable(frequency: FrequencySummary): string {
  const header = "| action | level | count |\n| --- | --- | --- |";

  const lines: string[] = frequency.rows.map(
    (row) => `| ${row.action ?? ""} | ${row.level} | ${row.count} |`,
  );

  return [header, ...lines].join("\n");
}

// AIMessage.content는 string | 복합블록[] 둘 다 가능 → 안전하게 문자열로.
function contentToString(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) =>
        typeof part === "object" && part !== null && "text" in part
          ? String((part as { text: unknown }).text)
          : "",
      )
      .join("");
  }

  return "";
}

// 마지막 ```json 블록(없으면 첫 { ~ 마지막 })만 뽑아 unknown으로 반환.
function extractJson(text: string): unknown {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);

  const raw = fenced
    ? fenced[1]
    : text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);

  return JSON.parse(raw);
}

export async function prejudge(
  batch: LogBatchRecord[],
  frequency: FrequencySummary,
): Promise<PrejudgeChecked> {
  const model = new ChatOpenAI({
    model: PREJUDGE_CONFIG.model,
    apiKey: PREJUDGE_CONFIG.apiKey,
    temperature: PREJUDGE_CONFIG.temperature,
    configuration: {
      baseURL: PREJUDGE_CONFIG.baseUrl,
    },
  });

  const userPrompt: string = [
    "(A) 최근 배치 (시간순):",
    renderBatchTable(batch),
    "",
    `(B) 최근 ${frequency.windowHours}시간 빈도:`,
    renderFrequencyTable(frequency),
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

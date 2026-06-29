export const ROOT_CAUSE_PROMPT: string = [
  "너는 로그 이상 **근본원인 분석가**다. 아래 ±N 윈도우(트레이스 + 앞뒤 맥락 + 빈도)를 보고,",
  "(a) 무슨 일이 일어났는지 시간순으로 재구성하고, (b) 어떤 요청이 무엇을 원했는데 왜 실패했는지,",
  "(c) 기존 Read Model의 어떤 부족이 원인인지 추론해라. 추론은 자유롭게 산문으로 한 뒤,",
  "마지막에 아래 JSON만 코드블록으로 출력:",
  "```json",
  '{ "summary": string, "timeline": string, "failedIntent": string, "suspectedReadModelGap": string }',
  "```",
].join("\n");

export const DECISION_PROMPT: string = [
  "너는 **Self-Adaptive CQRS 의사결정자**다. 근본원인 + 현재 도메인 스키마(Insight 카드)를 대조해,",
  "다음 조치 중 **필요한 것만** 고르고 근거를 달아라(손댈 게 없으면 빈 배열):",
  "  - versionSwitch     : 기존 Read Model을 다른 버전으로 교체하면 해결되는 경우",
  "  - recommendationDocs : 기존 Read Model을 보강하면 되는 경우(가이드 문서 필요)",
  "  - newReadModel       : 어떤 기존 모델로도 요청을 못 채워 신규 모델이 필요한 경우",
  "selected는 위 키들의 배열(0~3개). 마지막에 아래 JSON만 출력:",
  "```json",
  '{ "selected": string[], "reasoning": string }',
  "```",
].join("\n");

export const VERSION_SWITCH_PROMPT: string = [
  "너는 **버전 교체 생성자**다. 근본원인 + Insight 카드를 보고, 어떤 Read Model을 어느 버전으로",
  "교체해야 하는지 권고해라. 마지막에 아래 JSON만 출력:",
  "```json",
  '{ "readModelName": string, "fromVersion": string, "toVersion": string, "reason": string }',
  "```",
].join("\n");

export const RECOMMENDATION_DOCS_PROMPT: string = [
  "너는 **권고 문서 생성자**다. 어떤 Read Model을 어떻게 보강할지 가이드 문서를 작성해라",
  "(부족한 필드·근거·마이그레이션 노트). markdownDoc에 문서 본문(.md)을 담아라. 마지막에 JSON만:",
  "```json",
  '{ "targetReadModel": string, "gaps": string[], "suggestedFields": string[], "markdownDoc": string }',
  "```",
].join("\n");

export const NEW_READ_MODEL_PROMPT: string = [
  "너는 **신규 Read Model 생성자**다. 요청을 만족하는 새 Read Model의 스키마와 projector 스케치를",
  "구성해라(키·필드·원천 이벤트). 마지막에 JSON만:",
  "```json",
  '{ "proposedName": string, "purpose": string, "keyColumns": string,',
  '  "fields": [{ "name": string, "dataType": string, "meaning": string }],',
  '  "sourceEvents": string[], "projectorSketch": string }',
  "```",
].join("\n");

export const AGGREGATE_PROMPT: string = [
  "너는 **추합자**다. 선택된 1~3개 출력을 하나의 일관된 권고 리포트(.md)로 통합해라 —",
  "우선순위, 상호 의존, 실행 순서를 정리. 선택이 없으면 '조치 불필요'와 그 근거를 적어라.",
  "마지막에 아래 JSON만 출력(report에 마크다운 리포트 본문):",
  "```json",
  '{ "report": string }',
  "```",
].join("\n");

// LM Studio(로컬 qwen 계열)는 reasoning_effort 를 thinking 스위치로 매핑하므로 "none" 으로
// 추론을 꺼야 한다(2026-07-13 실측: thinking 이 출력 상한을 잠식해 content 0자).
// 반면 OpenAI 공식 API 는 이 인자를 모르는 모델(gpt-4o-mini 등)에서 400 을 반환한다
// (2026-07-21 실측: "Unrecognized request argument supplied: reasoning_effort") — 보내지 않는다.
export function thinkingControlKwargs(
  baseUrl: string | undefined,
): Record<string, unknown> {
  // baseUrl 미설정은 SDK 기본(공식 OpenAI API)이므로 동일하게 보내지 않는다.
  if (baseUrl === undefined || baseUrl.includes("api.openai.com")) {
    return {};
  }
  return { reasoning_effort: "none" };
}

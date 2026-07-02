export const CARD_DRIFT_CONFIG = {
  intervalMS: 60_000, // 주기 검사 간격
  // 같은 테이블에 대한 warn 재발행 억제 창. Docs 가 나와도 사람이 카드를 등록하기
  // 전까지 드리프트는 계속 존재하므로, 이 창이 없으면 매 주기 트립해 문서가 폭주한다.
  reportSuppressMS: 60 * 60 * 1000,
} as const;

// Read Model 판별 = public 테이블 − 아래 인프라 목록 − 카드 있는 테이블.
// 'read_%' 네이밍 휴리스틱을 쓰지 않는 이유: 접두 없는 Read Model 은 조용히 누락되고
// (fail-silent), 반전 목록의 실패는 오탐 warn 으로 드러나 자기교정된다(fail-loud).
// 새 인프라 테이블 추가 시 여기 등록 — 누락 시 오탐 warn 이 떠서 바로 발견된다.
export const INFRASTRUCTURE_TABLES: ReadonlySet<string> = new Set([
  "event_store",
  "projection_cursor",
  "log_event",
  "log_cursor",
  "insight_entity",
  "insight_field",
  "__drizzle_migrations", // drizzle-kit 메타(기본은 drizzle 스키마라 public 조회엔 미노출)
]);

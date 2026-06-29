export const WINDOW_CONFIG = {
  beforeCount: 20, // 앵커 기준 앞 행 수
  afterCount: 20, // 앵커 기준 뒤 행 수
  maxLines: 80, // 트레이스 + 패딩 합산 상한(토큰 통제)
  errorLevel: 40, // 앵커 후보 레벨(pino warn 이상)
  frequencyHours: 1, // 빈도 집계 구간(시간)
} as const;

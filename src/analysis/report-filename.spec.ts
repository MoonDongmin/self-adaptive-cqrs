import { buildReportFileName } from '@/analysis/report-filename';

describe('buildReportFileName', () => {
  it('{에러 발생 시각}-{id}.md 형식으로 만든다(로컬 시간, 자리수 패딩)', () => {
    const occurredAt = new Date(2026, 6, 5, 14, 57, 27); // 2026-07-05 14:57:27 로컬

    expect(buildReportFileName(occurredAt, "abc-123")).toBe(
      "2026-07-05-145727-abc-123.md",
    );
  });

  it('한 자리 월·일·시각을 0 으로 패딩한다', () => {
    const occurredAt = new Date(2026, 0, 3, 4, 5, 6);

    expect(buildReportFileName(occurredAt, "sensor")).toBe(
      "2026-01-03-040506-sensor.md",
    );
  });
});

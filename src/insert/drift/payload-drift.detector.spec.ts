import { detectPayloadDrift } from '@/insert/drift/payload-drift.detector';

// toyDataSchema 가 아는 top-level 키(대표): grip_succeed, objects, grip_data, robot_tf 등.
describe('detectPayloadDrift', () => {
  it('스키마가 모르는 신규 top-level 키를 검출한다', () => {
    const drifts = detectPayloadDrift({
      grip_succeed: 1,
      new_sensor_field: 1.23,
    });
    expect(drifts).toEqual([
      { key: "new_sensor_field", sampleValue: "1.23" },
    ]);
  });

  it('스키마가 아는 키만 있으면 빈 배열을 반환한다', () => {
    const drifts = detectPayloadDrift({
      grip_succeed: 1,
      objects: [],
      robot_tf: {},
    });
    expect(drifts).toEqual([]);
  });

  it('객체가 아닌 입력(null·문자열·숫자)은 빈 배열을 반환한다', () => {
    expect(detectPayloadDrift(null)).toEqual([]);
    expect(detectPayloadDrift("not-object")).toEqual([]);
    expect(detectPayloadDrift(42)).toEqual([]);
  });

  it('대표값을 120자로 제한한다', () => {
    const longValue = "x".repeat(500);
    const drifts = detectPayloadDrift({ unknown_blob: longValue });
    expect(drifts).toHaveLength(1);
    // JSON.stringify 가 따옴표를 더하므로 잘린 길이는 120.
    expect(drifts[0].sampleValue.length).toBe(120);
  });
});

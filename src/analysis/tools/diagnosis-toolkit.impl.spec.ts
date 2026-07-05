import { DiagnosisToolkitImpl, extractStack } from '@/analysis/tools/diagnosis-toolkit.impl';
import type { InsightService } from '@/insight/insight.service';
import type { Drizzle } from '@/shared/database/drizzle.provider';

// readSourceCode/extractStack 은 DB·Insight 를 쓰지 않는 순수 로직이라
// 의존성은 빈 스텁으로 채운다(호출되면 테스트가 실패해야 정상).
function makeToolkit(): DiagnosisToolkitImpl {
  return new DiagnosisToolkitImpl(
    {} as unknown as Drizzle,
    {} as unknown as InsightService,
  );
}

describe('extractStack', () => {
  it("payload.err.stack('err' = pino 기본 키)을 꺼낸다", () => {
    const stack = "Error: boom\n    at map (src/a.ts:10:5)";
    expect(extractStack({ err: { stack } })).toBe(stack);
  });

  it("payload.error.stack('error' = 커스텀 직렬화 키)을 꺼낸다", () => {
    const stack = "Error: boom\n    at upsert (src/b.ts:20:3)";
    expect(extractStack({ error: { stack } })).toBe(stack);
  });

  it('스택이 없으면 null 을 반환한다', () => {
    expect(extractStack({ msg: "정상 로그" })).toBeNull();
    expect(extractStack({ error: {} })).toBeNull();
    expect(extractStack(null)).toBeNull();
    expect(extractStack("문자열")).toBeNull();
  });
});

describe('DiagnosisToolkitImpl.readSourceCode', () => {
  const toolkit = makeToolkit();

  it('src/ 아래 실제 파일을 라인 번호와 함께 읽는다', async () => {
    const result = await toolkit.readSourceCode({
      filePath: "src/analysis/tools/diagnosis-toolkit.impl.ts",
      startLine: 1,
      endLine: 3,
    });

    expect(result).toContain("# src/analysis/tools/diagnosis-toolkit.impl.ts (1-3/");
    expect(result).toContain("1 | ");
  });

  it('저장소 밖 경로 탈출(../)을 거부한다', async () => {
    const result = await toolkit.readSourceCode({
      filePath: "../outside/secret.ts",
    });

    expect(result).toContain("접근 거부");
  });

  it('허용 접두사(src/·dist/) 밖 파일(.env 등)을 거부한다', async () => {
    expect(await toolkit.readSourceCode({ filePath: ".env" })).toContain(
      "접근 거부",
    );
    expect(
      await toolkit.readSourceCode({ filePath: "node_modules/pino/lib/tools.js" }),
    ).toContain("접근 거부");
    // src/ 를 접두사로 위장한 탈출도 거부(경로 정규화 후 판정).
    expect(
      await toolkit.readSourceCode({ filePath: "src/../.env" }),
    ).toContain("접근 거부");
  });

  it('저장소 내부 절대 경로는 허용한다', async () => {
    const result = await toolkit.readSourceCode({
      filePath: `${process.cwd()}/src/analysis/analysis.config.ts`,
      startLine: 1,
      endLine: 2,
    });

    expect(result).toContain("# src/analysis/analysis.config.ts");
  });

  it('없는 파일이면 에이전트가 읽을 수 있는 실패 메시지를 반환한다(throw 금지)', async () => {
    const result = await toolkit.readSourceCode({
      filePath: "src/does-not-exist.ts",
    });

    expect(result).toContain("파일 없음");
  });

  it('라인 범위를 상한(120줄)으로 캡한다', async () => {
    const result = await toolkit.readSourceCode({
      filePath: "src/analysis/render.ts",
      startLine: 1,
      endLine: 9999,
    });

    const bodyLines = result.split("\n").length - 1; // 헤더 1줄 제외
    expect(bodyLines).toBeLessThanOrEqual(120);
  });
});

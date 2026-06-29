import { open, stat } from 'fs/promises';

export interface NdjsonReadResult {
  lines: string[];
  nextOffset: number;
}

export async function readNewLines(
  filePath: string,
  fromOffset: number,
): Promise<NdjsonReadResult> {
  const stats = await stat(filePath).catch(() => null);
  if (stats === null || stats.size <= fromOffset) {
    return { lines: [], nextOffset: fromOffset };
  }

  const length: number = stats.size - fromOffset;
  const handle = await open(filePath, "r");

  try {
    const buffer: Buffer = Buffer.alloc(length);
    await handle.read(buffer, 0, length, fromOffset);

    const chunk: string = buffer.toString("utf8");
    const lastNewline: number = chunk.lastIndexOf("\n");

    if (lastNewline === -1) {
      // 완결된 줄 없음 → 진행하지 않음
      return { lines: [], nextOffset: fromOffset };
    }

    const complete: string = chunk.slice(0, lastNewline);
    const lines: string[] = complete.split("\n").filter((l) => l.length > 0);

    // 바이트 기준 오프셋 전진 (+1 = 마지막 개행 문자)
    const consumedBytes: number = Buffer.byteLength(complete, "utf8") + 1;

    return { lines, nextOffset: fromOffset + consumedBytes };
  } finally {
    await handle.close();
  }
}

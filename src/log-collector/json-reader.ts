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
  if (stats === null) {
    return { lines: [], nextOffset: fromOffset };
  }

  // 파일이 잘렸으면(로그 파일을 비우거나 재생성하면 현재 크기 < 커서) 오프셋을 0으로
  // 되감아 처음부터 다시 읽는다. 안 그러면 커서가 새 파일 크기보다 커서 영원히 적재가 멈춘다.
  const startOffset: number = stats.size < fromOffset ? 0 : fromOffset;

  if (stats.size <= startOffset) {
    return { lines: [], nextOffset: startOffset };
  }

  const length: number = stats.size - startOffset;
  const handle = await open(filePath, "r");

  try {
    const buffer: Buffer = Buffer.alloc(length);
    await handle.read(buffer, 0, length, startOffset);

    const chunk: string = buffer.toString("utf8");
    const lastNewline: number = chunk.lastIndexOf("\n");

    if (lastNewline === -1) {
      // 완결된 줄 없음 → 진행하지 않음
      return { lines: [], nextOffset: startOffset };
    }

    const complete: string = chunk.slice(0, lastNewline);
    const lines: string[] = complete.split("\n").filter((l) => l.length > 0);

    // 바이트 기준 오프셋 전진 (+1 = 마지막 개행 문자)
    const consumedBytes: number = Buffer.byteLength(complete, "utf8") + 1;

    return { lines, nextOffset: startOffset + consumedBytes };
  } finally {
    await handle.close();
  }
}

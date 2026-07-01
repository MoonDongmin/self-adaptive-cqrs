import * as fs from 'node:fs';
import { join } from 'node:path';

// 센서 값 관찰자/문서 노드에 주입할 수기 기준선을 런타임에 디스크에서 읽는다.
// source-examples.ts 와 동일 패턴(process.cwd() 기준) — 인라인 스냅샷 드리프트를 피한다.
export async function readSensorBaseline(): Promise<string> {
  const source: string = await fs.promises.readFile(
    join(process.cwd(), "src/analysis/context/sensor-value-baseline.md"),
    "utf-8",
  );

  return ["## 센서 값 베이스라인 (이 규칙명·기대범위만 인용하라)", source].join(
    "\n\n",
  );
}

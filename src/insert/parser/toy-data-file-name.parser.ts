const FILE_NAME_RE = /^(.+?)_(CR\d+)_(.+?)_(\d{5})_(\d{2})_(\d{8})\.json$/;

export type ParsedFileName = {
  categoryPrefix: string;
  cameraCode: string;
  objectName: string;
  sceneNo: string;
  attemptNo: number;
  capturedDate: Date;
  sceneKey: string;
};

export function parseToyDataFileName(fileName: string): ParsedFileName {
  const m = FILE_NAME_RE.exec(fileName);

  if (!m) {
    throw new Error(`Invalid toy-data file name: ${fileName}`);
  }

  const [
    ,
    categoryPrefix,
    cameraCode,
    objectName,
    sceneNo,
    attemptStr,
    dateStr,
  ] = m;

  const year: number = Number(dateStr.slice(0, 4));
  const month: number = Number(dateStr.slice(4, 6));
  const day: number = Number(dateStr.slice(6, 8));

  return {
    categoryPrefix,
    cameraCode,
    objectName,
    sceneNo,
    attemptNo: Number(attemptStr),
    capturedDate: new Date(Date.UTC(year, month - 1, day)),
    sceneKey: `${categoryPrefix}_${cameraCode}_${objectName}_${sceneNo}`,
  };
}

import { SensorValueMessage } from '@/projection/kafka/sensor-value.message';
import {
  checkRotationMatrix,
  DimensionStatistics,
  GRIP_3D_POSE_Z_STATISTICS,
  ROBUST_Z_THRESHOLD,
  robustZ,
  ROTATION_TOLERANCE,
  RotationCheckResult,
  TRANSLATION_X_STATISTICS,
  TRANSLATION_Y_STATISTICS,
  TRANSLATION_Z_STATISTICS,
} from '@/sensor-observer/sensor-value-statistics';

// 배치를 원본 JSON 그대로(레코드당 한 줄) 손실 없이 직렬화하고(observedValue verbatim
// substring 검증 원천), 결정론적으로 계산한 통계 근거(robust-z, 회전행렬 항등식)가
// 걸린 레코드에만 바로 아래에 "⚠ stat" 라인을 붙인다. prejudge.renderBatchRaw 의
// 센서 버전. 산수는 코드가, 해석과 최종 판정은 LLM 이 한다.

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asFiniteNumberArray(value: unknown, length: number): number[] | null {
  if (!Array.isArray(value) || value.length !== length) {
    return null;
  }
  const numbers: number[] = [];
  for (const item of value) {
    if (typeof item !== "number" || !Number.isFinite(item)) {
      return null;
    }
    numbers.push(item);
  }

  return numbers;
}

function extractTranslation(robotTf: unknown): number[] | null {
  if (!isRecord(robotTf)) {
    return null;
  }

  return asFiniteNumberArray(robotTf.translation_3x1, 3);
}

function extractRotation(robotTf: unknown): number[] | null {
  if (!isRecord(robotTf)) {
    return null;
  }

  return asFiniteNumberArray(robotTf.rotation_3x3, 9);
}

// grip_3d_pose 의 z1..z8 (카메라 프레임 깊이). 형태가 다르면 판정하지 않는다.
function extractGripDepths(grip3dPose: unknown): number[] | null {
  if (!isRecord(grip3dPose)) {
    return null;
  }
  const depths: number[] = [];
  for (let i = 1; i <= 8; i++) {
    const value: unknown = grip3dPose[`z${i}`];
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return null;
    }
    depths.push(value);
  }

  return depths;
}

function flagOutlier(
  value: number,
  statistics: DimensionStatistics,
  suffix: string = "",
): string | null {
  const z: number = robustZ(value, statistics);
  if (z <= ROBUST_Z_THRESHOLD) {
    return null;
  }

  return `${statistics.dimension}${suffix}=${value} robust-z=${z.toFixed(1)} (임계 ${ROBUST_Z_THRESHOLD}, 관측 분포 클러스터 밖)`;
}

function annotateSensorMessage(message: SensorValueMessage): string | null {
  const flags: string[] = [];

  const translation: number[] | null = extractTranslation(message.robotTf);
  if (translation !== null) {
    const dimensionStatistics: DimensionStatistics[] = [
      TRANSLATION_X_STATISTICS,
      TRANSLATION_Y_STATISTICS,
      TRANSLATION_Z_STATISTICS,
    ];
    for (let i = 0; i < 3; i++) {
      const flag: string | null = flagOutlier(
        translation[i],
        dimensionStatistics[i],
      );
      if (flag !== null) {
        flags.push(flag);
      }
    }
  }

  const rotation: number[] | null = extractRotation(message.robotTf);
  if (rotation !== null) {
    const check: RotationCheckResult = checkRotationMatrix(rotation);
    if (!check.valid) {
      flags.push(
        `robotTfRotation: R·Rᵀ 편차 ${check.orthogonalityDeviation.toFixed(3)} det=${check.determinant.toFixed(3)} (허용 ±${ROTATION_TOLERANCE}, 기대 det=+1) — 유효한 회전행렬 아님`,
      );
    }
  }

  const gripDepths: number[] | null = extractGripDepths(message.grip3dPose);
  if (gripDepths !== null) {
    for (let i = 0; i < gripDepths.length; i++) {
      const flag: string | null = flagOutlier(
        gripDepths[i],
        GRIP_3D_POSE_Z_STATISTICS,
        `(z${i + 1})`,
      );
      if (flag !== null) {
        flags.push(flag);
      }
    }
  }

  if (flags.length === 0) {
    return null;
  }

  return flags
    .map(
      (flag) => `⚠ stat [${message.sceneKey}#${message.attemptNumber}] ${flag}`,
    )
    .join("\n");
}

// JSON-per-line + 걸린 레코드 아래 ⚠ stat 주석 라인.
export function renderAnnotatedSensorBatch(
  batch: SensorValueMessage[],
): string {
  return batch
    .map((message) => {
      const line: string = JSON.stringify(message);
      const annotation: string | null = annotateSensorMessage(message);

      return annotation === null ? line : [line, annotation].join("\n");
    })
    .join("\n");
}

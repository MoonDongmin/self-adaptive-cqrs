// toy-data 139건(2026-07-07 산출)에서 계산한 차원별 분포 통계. 로봇이 소수의 고정
// 마운트 위치에서 촬영한 데이터라 translation 이 이산 클러스터를 이룬다(x 3개, y 2개).
// 그래서 단일 median 기반 z-score 는 정상 클러스터 전체를 오탐하므로, "가장 가까운
// 관측 클러스터 envelope 밖으로 벗어난 거리"를 MAD 스케일로 정규화한 robust-z 를 쓴다:
//   - 관측 envelope [low, high] 안 → z = 0
//   - 밖 → z = 0.6745 × (envelope 까지 거리) / max(클러스터 MAD, scaleFloor)
// 이 정의상 산출 코퍼스 139건의 z 는 전부 0 — 정상 코퍼스 오탐이 구조적으로 없다.

export interface ValueCluster {
  low: number;
  high: number;
  medianAbsoluteDeviation: number;
}

export interface DimensionStatistics {
  dimension: string; // 주석 라인에 인용할 차원명 (베이스라인 rule 접두와 일치)
  clusters: ValueCluster[];
  scaleFloor: number; // MAD 하한 — 값 중복이 많아 MAD=0 인 클러스터의 0-나눗셈 방지 (m)
}

export const ROBUST_Z_THRESHOLD: number = 3.5;

export const TRANSLATION_X_STATISTICS: DimensionStatistics = {
  dimension: "robotTfTranslationX",
  clusters: [
    { low: -0.3485, high: -0.3325, medianAbsoluteDeviation: 0 },
    { low: -0.012, high: 0.0008, medianAbsoluteDeviation: 0 },
    { low: 0.3277, high: 0.3277, medianAbsoluteDeviation: 0 },
  ],
  scaleFloor: 0.002,
};

export const TRANSLATION_Y_STATISTICS: DimensionStatistics = {
  dimension: "robotTfTranslationY",
  clusters: [
    { low: 0.7501, high: 0.7621, medianAbsoluteDeviation: 0 },
    { low: 0.8214, high: 0.8214, medianAbsoluteDeviation: 0 },
  ],
  scaleFloor: 0.002,
};

export const TRANSLATION_Z_STATISTICS: DimensionStatistics = {
  dimension: "robotTfTranslationZ",
  clusters: [{ low: 1.0205, high: 1.0476, medianAbsoluteDeviation: 0.00435 }],
  scaleFloor: 0.002,
};

export const GRIP_3D_POSE_Z_STATISTICS: DimensionStatistics = {
  dimension: "grip3dPoseZ",
  clusters: [{ low: 0.0336, high: 0.1998, medianAbsoluteDeviation: 0.031338 }],
  scaleFloor: 0.002,
};

// 가장 가까운 클러스터 기준 robust-z. envelope 안이면 0.
export function robustZ(
  value: number,
  statistics: DimensionStatistics,
): number {
  return Math.min(
    ...statistics.clusters.map((cluster) => {
      const gap: number =
        value < cluster.low
          ? cluster.low - value
          : value > cluster.high
            ? value - cluster.high
            : 0;
      const scale: number = Math.max(
        cluster.medianAbsoluteDeviation,
        statistics.scaleFloor,
      );

      return (0.6745 * gap) / scale;
    }),
  );
}

// 회전행렬 항등식 검사. 열 노름만으로는 부족하다 — 열 노름이 전부 1이어도 직교가
// 아니면(R·Rᵀ ≠ I) 혹은 반사행렬이면(det = -1) 유효한 회전이 아니다.
// 산출 코퍼스 139건의 실측: R·Rᵀ 편차 최대 1e-6, det ∈ [0.999999, 1.000001].
export const ROTATION_TOLERANCE: number = 0.01;

export interface RotationCheckResult {
  orthogonalityDeviation: number; // max |R·Rᵀ − I| 성분
  determinant: number;
  valid: boolean;
}

export function checkRotationMatrix(
  rotation: readonly number[],
): RotationCheckResult {
  const rows: number[][] = [
    [rotation[0], rotation[1], rotation[2]],
    [rotation[3], rotation[4], rotation[5]],
    [rotation[6], rotation[7], rotation[8]],
  ];

  let orthogonalityDeviation: number = 0;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const dot: number =
        rows[i][0] * rows[j][0] +
        rows[i][1] * rows[j][1] +
        rows[i][2] * rows[j][2];
      const expected: number = i === j ? 1 : 0;
      orthogonalityDeviation = Math.max(
        orthogonalityDeviation,
        Math.abs(dot - expected),
      );
    }
  }

  const determinant: number =
    rows[0][0] * (rows[1][1] * rows[2][2] - rows[1][2] * rows[2][1]) -
    rows[0][1] * (rows[1][0] * rows[2][2] - rows[1][2] * rows[2][0]) +
    rows[0][2] * (rows[1][0] * rows[2][1] - rows[1][1] * rows[2][0]);

  return {
    orthogonalityDeviation,
    determinant,
    valid:
      orthogonalityDeviation <= ROTATION_TOLERANCE &&
      Math.abs(determinant - 1) <= ROTATION_TOLERANCE,
  };
}

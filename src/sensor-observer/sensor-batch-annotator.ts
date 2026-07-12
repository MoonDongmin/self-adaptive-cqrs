import { SensorValueMessage } from "@/projection/kafka/sensor-value.message";
import {
  checkRotationMatrix,
  DimensionStatistics,
  GRIP_3D_POSE_Z_STATISTICS,
  ROBUST_Z_THRESHOLD,
  ROTATION_TOLERANCE,
  RotationCheckResult,
  robustZ,
  TRANSLATION_X_STATISTICS,
  TRANSLATION_Y_STATISTICS,
  TRANSLATION_Z_STATISTICS,
} from "@/sensor-observer/sensor-value-statistics";

// 배치를 원본 JSON 그대로(레코드당 한 줄) 손실 없이 직렬화하고(observedValue verbatim
// substring 검증 원천), 걸린 레코드 바로 아래에 4층 판정 주석을 붙인다:
//   ⚠ physical    — 그 자체로 불가능한 값(항등식 위반·음수 깊이·이미지 밖 좌표·도메인 위반)
//   ⚠ consistency — 값들끼리의 모순(grip 성공인데 pose/깊이가 작업범위 밖)
//   ⚠ jump        — 같은 scene 내 직전 레코드 대비 급변
//   ⚠ stat        — 관측 분포(139건) 밖 신규값. 참고 정보일 뿐 단독 판정 근거가 아니다
// 산수는 코드가, 해석과 최종 판정은 LLM 이 한다. prejudge.renderBatchRaw 의 센서 버전.

// 수기 베이스라인(sensor-value-baseline.md)의 기대 작업범위 — consistency 판정용.
// 관측 분포 클러스터(sensor-value-statistics)보다 훨씬 넓은, 물리적 허용 범위다.
const WORKSPACE_TRANSLATION_RANGES: ReadonlyArray<{
  axis: "X" | "Y" | "Z";
  low: number;
  high: number;
}> = [
  { axis: "X", low: -0.5, high: 0.5 },
  { axis: "Y", low: 0.65, high: 0.95 },
  { axis: "Z", low: 0.95, high: 1.15 },
];
const GRIP_DEPTH_WORKSPACE = { low: 0.01, high: 0.3 } as const; // meters
const IMAGE_BOUNDS = { maxX: 1920, maxY: 1110 } as const; // pixels (~= 2*cx, 2*cy)

// scene 내 급변 임계(깊이 평균). 코퍼스 실측 연속 attempt 간 Δ평균깊이 최대 0.043m 의
// 2.3배 여유. translation 임계는 없다 — attempt 간 마운트 이동(ΔX 최대 0.68m)이 정상이라
// translation 급변 판정은 오탐 공장이 된다(2026-07-07 실측으로 제거).
const GRIP_DEPTH_JUMP_THRESHOLD_METERS: number = 0.1;

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

// grip_2d_pose 의 {xl, xr, yl, yr} (픽셀). 형태가 다르면 판정하지 않는다.
function extractGrip2dPose(
  grip2dPose: unknown,
): { xl: number; xr: number; yl: number; yr: number } | null {
  if (!isRecord(grip2dPose)) {
    return null;
  }
  const values: number[] = [];
  for (const key of ["xl", "xr", "yl", "yr"]) {
    const value: unknown = grip2dPose[key];
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return null;
    }
    values.push(value);
  }

  return { xl: values[0], xr: values[1], yl: values[2], yr: values[3] };
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

// ── 1층: physical — 값 하나만 봐도 불가능 ─────────────────────────────────────
function physicalFlags(message: SensorValueMessage): string[] {
  const flags: string[] = [];

  if (message.gripSucceed !== 0 && message.gripSucceed !== 1) {
    flags.push(
      `gripSucceed=${message.gripSucceed} (도메인 {0,1} 위반 — 성공/실패 어느 쪽도 아님)`,
    );
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
      if (gripDepths[i] <= 0) {
        flags.push(
          `grip3dPoseZ(z${i + 1})=${gripDepths[i]} (깊이 ≤ 0 — 카메라 뒤/평면 위 물체는 불가능)`,
        );
      }
    }
  }

  const pose2d = extractGrip2dPose(message.grip2dPose);
  if (pose2d !== null) {
    for (const [key, value, max] of [
      ["xl", pose2d.xl, IMAGE_BOUNDS.maxX],
      ["xr", pose2d.xr, IMAGE_BOUNDS.maxX],
      ["yl", pose2d.yl, IMAGE_BOUNDS.maxY],
      ["yr", pose2d.yr, IMAGE_BOUNDS.maxY],
    ] as const) {
      if (value < 0 || value > max) {
        flags.push(
          `grip2dPose(${key})=${value} (이미지 경계 [0, ${max}]px 밖 — 화면 밖 픽셀 좌표는 불가능)`,
        );
      }
    }
  }

  return flags;
}

// ── 2층: consistency — grip 성공(1) 맥락과 값의 모순 ──────────────────────────
// 실패(0) 시도의 범위 밖 값은 자연 노이즈일 수 있어 여기서 판정하지 않는다(⚠ stat 가
// 참고로 남긴다). physical 이 이미 잡는 값(깊이 ≤ 0, 이미지 밖)은 중복 판정하지 않는다.
function consistencyFlags(message: SensorValueMessage): string[] {
  if (message.gripSucceed !== 1) {
    return [];
  }

  const flags: string[] = [];

  const translation: number[] | null = extractTranslation(message.robotTf);
  if (translation !== null) {
    for (let i = 0; i < WORKSPACE_TRANSLATION_RANGES.length; i++) {
      const range = WORKSPACE_TRANSLATION_RANGES[i];
      if (translation[i] < range.low || translation[i] > range.high) {
        flags.push(
          `gripSucceed=1(성공)인데 robotTfTranslation${range.axis}=${translation[i]} 작업범위 [${range.low}, ${range.high}]m 밖 — 잡을 수 없는 위치에서 성공은 모순`,
        );
      }
    }
  }

  const gripDepths: number[] | null = extractGripDepths(message.grip3dPose);
  if (gripDepths !== null) {
    for (let i = 0; i < gripDepths.length; i++) {
      const depth: number = gripDepths[i];
      if (
        depth > 0 &&
        (depth < GRIP_DEPTH_WORKSPACE.low || depth > GRIP_DEPTH_WORKSPACE.high)
      ) {
        flags.push(
          `gripSucceed=1(성공)인데 grip3dPoseZ(z${i + 1})=${depth} 파지 가능 깊이 [${GRIP_DEPTH_WORKSPACE.low}, ${GRIP_DEPTH_WORKSPACE.high}]m 밖 — 닿지 않는 깊이에서 성공은 모순`,
        );
      }
    }
  }

  return flags;
}

// ── 3층: jump — 같은 scene 내 직전 레코드 대비 급변 ───────────────────────────
// scene 이 바뀌면 마운트·물체가 바뀌어 값이 크게 달라지는 게 정상이므로 반드시 같은
// sceneKey 안에서만 비교한다. 비교 순서는 배치 정렬(globalSequence)을 그대로 따른다.
// translation 은 여기서 판정하지 않는다 — 같은 scene 이라도 attempt 가 바뀌면 로봇이
// 다른 마운트로 이동하는 게 정상이다(코퍼스 실측: 연속 attempt 간 ΔX 최대 0.68m).
// 마운트 클러스터 밖 위치는 ⚠ stat 이 참고로 잡는다. 깊이 평균만 급변을 본다
// (코퍼스 실측: 연속 attempt 간 Δ평균깊이 최대 0.043m < 임계 0.10m).
export interface ScenePreviousValues {
  attemptNumber: number;
  meanGripDepth: number | null;
}

function jumpFlags(
  message: SensorValueMessage,
  previousByScene: Map<string, ScenePreviousValues>,
): string[] {
  const gripDepths: number[] | null = extractGripDepths(message.grip3dPose);
  const meanGripDepth: number | null =
    gripDepths !== null ? mean(gripDepths) : null;

  const previous: ScenePreviousValues | undefined = previousByScene.get(
    message.sceneKey,
  );

  const flags: string[] = [];
  if (
    previous !== undefined &&
    meanGripDepth !== null &&
    previous.meanGripDepth !== null
  ) {
    const delta: number = Math.abs(meanGripDepth - previous.meanGripDepth);
    if (delta > GRIP_DEPTH_JUMP_THRESHOLD_METERS) {
      flags.push(
        `grip3dPoseZ 평균 직전(#${previous.attemptNumber}) 대비 Δ${delta.toFixed(4)}m (임계 ${GRIP_DEPTH_JUMP_THRESHOLD_METERS}m — 같은 scene 내 급변)`,
      );
    }
  }

  // 추출 실패(null)면 마지막으로 관측된 값을 유지해 gap 너머 비교를 잇는다.
  previousByScene.set(message.sceneKey, {
    attemptNumber: message.attemptNumber,
    meanGripDepth: meanGripDepth ?? previous?.meanGripDepth ?? null,
  });

  return flags;
}

// ── 4층: stat — 관측 분포(139건) 밖 신규값. 참고 정보(단독 판정 근거 아님) ─────
function flagOutlier(
  value: number,
  statistics: DimensionStatistics,
  suffix: string = "",
): string | null {
  const z: number = robustZ(value, statistics);
  if (z <= ROBUST_Z_THRESHOLD) {
    return null;
  }

  return `${statistics.dimension}${suffix}=${value} robust-z=${z.toFixed(1)} (임계 ${ROBUST_Z_THRESHOLD}, 관측 분포 클러스터 밖 — 신규값 참고 정보)`;
}

function statFlags(message: SensorValueMessage): string[] {
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

  return flags;
}

function prefixTier(
  tier: "physical" | "consistency" | "jump" | "stat",
  message: SensorValueMessage,
  flags: string[],
): string[] {
  return flags.map(
    (flag) =>
      `⚠ ${tier} [${message.sceneKey}#${message.attemptNumber}] ${flag}`,
  );
}

// 배치의 결정론적 판정 결과. text 는 LLM 프롬프트용 렌더링이고, scene 목록 두 개는
// LLM 출력과 무관하게 보존해야 하는 판정 근거다:
//   deterministicSceneKeys — physical/consistency 확정 위반. LLM 이 뒤집을 수 없다.
//   jumpSceneKeys          — 급변 감지. 재시도 등 정상 맥락일 수 있어 판정은 LLM 몫이나,
//                            LLM 불가 시 폴백 판정의 근거가 된다.
export interface SensorBatchAnnotations {
  text: string;
  deterministicSceneKeys: string[];
  jumpSceneKeys: string[];
}

// JSON-per-line + 걸린 레코드 아래 층위별 ⚠ 주석 라인. jump 비교가 직전 레코드에
// 의존하므로 호출 측은 globalSequence 오름차순으로 정렬해 넘겨야 한다.
// previousByScene 을 넘기면 이전 배치(윈도우)의 scene별 마지막 값을 비교 기준으로
// 이어 써서, 급변 쌍이 윈도우 경계에 갈려도 jump 를 놓치지 않는다. Map 은 이 함수가
// 배치 내용으로 갱신하므로(in-place), 호출 측이 커밋 시점을 통제하려면 사본을 넘긴다.
export function annotateSensorBatch(
  batch: SensorValueMessage[],
  previousByScene: Map<string, ScenePreviousValues> = new Map(),
): SensorBatchAnnotations {
  const deterministicSceneKeys = new Set<string>();
  const jumpSceneKeys = new Set<string>();

  const text: string = batch
    .map((message) => {
      const line: string = JSON.stringify(message);
      const physical: string[] = physicalFlags(message);
      const consistency: string[] = consistencyFlags(message);
      const jump: string[] = jumpFlags(message, previousByScene);

      if (physical.length > 0 || consistency.length > 0) {
        deterministicSceneKeys.add(message.sceneKey);
      }
      if (jump.length > 0) {
        jumpSceneKeys.add(message.sceneKey);
      }

      const annotations: string[] = [
        ...prefixTier("physical", message, physical),
        ...prefixTier("consistency", message, consistency),
        ...prefixTier("jump", message, jump),
        ...prefixTier("stat", message, statFlags(message)),
      ];

      return annotations.length === 0
        ? line
        : [line, ...annotations].join("\n");
    })
    .join("\n");

  return {
    text,
    deterministicSceneKeys: [...deterministicSceneKeys],
    jumpSceneKeys: [...jumpSceneKeys],
  };
}

export function renderAnnotatedSensorBatch(
  batch: SensorValueMessage[],
): string {
  return annotateSensorBatch(batch).text;
}

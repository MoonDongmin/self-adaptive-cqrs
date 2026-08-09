#!/usr/bin/env node
// 층2·3 시나리오 확장 생성기 — 기존 12종(장면번호 02000~02017) 위에 8종을 추가한다.
//
// 원 생성기(generate-layer23-scenarios.mjs)는 유실되어, 기존 산출물의 계약을 따른다:
//   - 정상 배경 = data/toy-data 원본의 바이트 동일 복사 (폴더 간 재사용 허용)
//   - 변이/신규 파일 = 장면번호 02018~ 를 전역 무중복 순차 할당, 접두사 없음
//   - 신규 파일명은 payload 내부 4필드(2D/3D/video/data_key) 동기화
//     (B2 는 이 동기화를 의도적으로 위반하는 시나리오 — manifest 에 기록)
//   - manifest.json 은 기존 A/E/F 3변종 스키마를 따른다
//
// 재실행 시 자기 소유 8개 폴더만 지우고 동일 결과를 재생성한다(결정론 —
// 원본 선택은 정렬된 파일 목록의 고정 오프셋/고정 술어 기반).
//
// 사용: node scripts/eval/generate-additional-layer23-scenarios.mjs

import { promises as fs } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIRECTORY, "..", "..");
const TOY_DATA_DIRECTORY = path.join(REPOSITORY_ROOT, "data", "toy-data");
const SCENARIO_ROOT = path.join(REPOSITORY_ROOT, "data", "eval", "layer23-scenarios");
const INDEX_PATH = path.join(SCENARIO_ROOT, "index.json");

const FILE_NAME_PATTERN = /^(.+?_CR\d+_.+?)_(\d{5})_(\d{2})_(\d{8})\.json$/;
const FIRST_NEW_SCENE_NUMBER = 2018;
const SUBTHRESHOLD_JUMP_DELTA = 0.07; // R6 임계 0.10 의 70% — 미발동이 정답

let nextSceneNumber = FIRST_NEW_SCENE_NUMBER;
function allocateSceneNumber() {
  const scene = String(nextSceneNumber).padStart(5, "0");
  nextSceneNumber += 1;
  return scene;
}

function parseFileName(fileName) {
  const match = FILE_NAME_PATTERN.exec(fileName);
  if (!match) {
    throw new Error(`파일명 규칙 위반: ${fileName}`);
  }
  return { prefix: match[1], scene: match[2], attempt: match[3], date: match[4] };
}

function buildFileName(prefix, scene, attempt, date) {
  return `${prefix}_${scene}_${attempt}_${date}.json`;
}

// 신규 파일명 기준으로 payload 내부 4필드를 동기화한다(video 는 시도 자리 항상 00).
function synchronizeInternalNames(payload, prefix, scene, attempt, date) {
  const base = `${prefix}_${scene}_${attempt}_${date}`;
  payload["2D_image_file_name"] = `${base}.jpg`;
  payload["3D_image_file_name"] = `${base}.pcd`;
  payload["data_key"] = `${base}.jpg`;
  payload["video_file_name"] = `${prefix}_${scene}_00_${date}.mp4`;
}

async function readToyData(fileName) {
  return JSON.parse(await fs.readFile(path.join(TOY_DATA_DIRECTORY, fileName), "utf8"));
}

function zValues(payload) {
  return Array.from({ length: 8 }, (unused, i) => payload.grip_data.grip_3d_pose[`z${i + 1}`]);
}

async function main() {
  const allFileNames = (await fs.readdir(TOY_DATA_DIRECTORY))
    .filter((name) => name.endsWith(".json"))
    .sort();
  if (allFileNames.length !== 139) {
    throw new Error(`data/toy-data 파일 수가 139가 아님: ${allFileNames.length}`);
  }

  // ── 결정론 원본 선정 ──────────────────────────────────────────────
  // 고정 오프셋(임의지만 불변)에서 술어를 만족하는 첫 파일들을 취한다.
  function pickFromOffset(offset, count, predicateResults, exclude = new Set()) {
    const picked = [];
    for (let i = 0; i < allFileNames.length && picked.length < count; i++) {
      const name = allFileNames[(offset + i) % allFileNames.length];
      if (exclude.has(name) || picked.includes(name)) continue;
      if (predicateResults && !predicateResults.get(name)) continue;
      picked.push(name);
    }
    if (picked.length < count) {
      throw new Error(`원본 선정 실패: offset=${offset} count=${count}`);
    }
    return picked;
  }

  // 술어 사전 계산 (전 파일 1회 스캔)
  const gripSucceedOne = new Map();
  const subthresholdJumpSource = new Map();
  for (const name of allFileNames) {
    const payload = await readToyData(name);
    const zs = zValues(payload);
    gripSucceedOne.set(name, payload.grip_succeed === 1);
    subthresholdJumpSource.set(
      name,
      Math.min(...zs) >= 0.034 && Math.max(...zs) <= 0.1998 - SUBTHRESHOLD_JUMP_DELTA,
    );
  }

  // ── 시나리오 정의 ────────────────────────────────────────────────
  // mutate(payload, sourceName) → { anomalyType, mutations, postCheck? }
  // mutations 는 manifest 기록용 {path, from, to}.
  const anomalyScenarios = [
    {
      // 초안은 R4(회전행렬) 위반이었으나 llm-only 9B 가 반사행렬·영행렬·×10 스케일을
      // 전부 정상 판정(2026-08-03 스모크 2회 실측 — R4 는 CHECK 라인이 없는 암산 룰이라
      // llm-only 사각지대). R5 깊이 "하한"(zmin ≥ 0.01, 기존 미사용 방향) 위반으로 재지정.
      scenarioId: "A7-grip-depth-underflow",
      description:
        "grip 성공 맥락인데 파지 깊이가 전부 0.01m 미만(z1~z8 을 1/20 축소, 0 초과라 R2 회피) — A5(깊이 상한 초과)가 쓰지 않은 R5 깊이 하한의 모순",
      channel: "sensor",
      expectedSignal: "⚠ consistency (grip depth zmin < 0.01 workspace 하한)",
      expectedDocsGist: "성공 맥락 모순(파지 깊이 하한 미달) 진단 + 격리(containment) SQL + 데이터 품질 권고",
      layer3SuccessCriteria: [
        "원인으로 파지 깊이(z)가 작업 하한 0.01m 미만인데 grip_succeed=1 인 모순을 지목",
        "이상 장면을 특정하는 격리 SQL 이 샌드박스에서 실행 성공한다",
      ],
      sourceOffset: 40,
      sourcePredicate: gripSucceedOne, // R5 는 grip_succeed===1 일 때만 발동
      mutate: [
        (payload) => {
          const mutations = [];
          for (let i = 1; i <= 8; i++) {
            const key = `z${i}`;
            const from = payload.grip_data.grip_3d_pose[key];
            const to = from / 20; // 0 < to < 0.01 — R2(≤0) 미발동, R5 하한 위반
            payload.grip_data.grip_3d_pose[key] = to;
            mutations.push({ path: `grip_data.grip_3d_pose.${key}`, from, to });
          }
          return { anomalyType: "consistency", mutations };
        },
        (payload) => {
          const mutations = [];
          for (let i = 1; i <= 8; i++) {
            const key = `z${i}`;
            const from = payload.grip_data.grip_3d_pose[key];
            const to = from / 20;
            payload.grip_data.grip_3d_pose[key] = to;
            mutations.push({ path: `grip_data.grip_3d_pose.${key}`, from, to });
          }
          return { anomalyType: "consistency", mutations };
        },
      ],
    },
    {
      scenarioId: "A8-translation-x-violation",
      description:
        "grip 성공 맥락인데 로봇 위치가 작업영역 밖(X=1.2m / Y=0.20m) — A5(Z축·깊이 상한)가 쓰지 않은 R5 축의 모순",
      channel: "sensor",
      expectedSignal: "⚠ consistency (workspace translation X/Y 범위 이탈)",
      expectedDocsGist: "성공 맥락 모순(작업영역 이탈) 진단 + 격리(containment) SQL + 데이터 품질 권고",
      layer3SuccessCriteria: [
        "원인으로 translation X(또는 Y) 작업범위 이탈과 grip_succeed=1 의 모순을 지목",
        "이상 장면을 특정하는 격리 SQL 이 샌드박스에서 실행 성공한다",
      ],
      sourceOffset: 55,
      sourcePredicate: gripSucceedOne, // R5 는 grip_succeed===1 일 때만 발동
      mutate: [
        (payload) => {
          const from = payload.robot_tf.translation_3x1[0];
          payload.robot_tf.translation_3x1[0] = 1.2; // X 범위 [-0.5, 0.5] 초과
          return { anomalyType: "consistency", mutations: [{ path: "robot_tf.translation_3x1[0]", from, to: 1.2 }] };
        },
        (payload) => {
          const from = payload.robot_tf.translation_3x1[1];
          payload.robot_tf.translation_3x1[1] = 0.2; // Y 범위 [0.65, 0.95] 미달
          return { anomalyType: "consistency", mutations: [{ path: "robot_tf.translation_3x1[1]", from, to: 0.2 }] };
        },
      ],
    },
    {
      scenarioId: "A9-non-integer-id",
      description:
        "정수여야 하는 식별 필드에 소수 유입(objects[0].id=1.5, num_keypoints=2.5) — zod .int() 위반으로 적재가 거부된다",
      channel: "log",
      expectedSignal: "insert.file.failed (zod parse 실패: 정수 제약 위반)",
      expectedDocsGist: "정수 제약 위반 진단 + 오염 데이터 격리(containment) SQL + 데이터 품질 권고",
      layer3SuccessCriteria: [
        "원인으로 정수 필드(objects id / num_keypoints)에 소수가 들어와 zod 파싱이 실패했음을 지목",
        "이상 레코드를 특정하는 격리 SQL 이 샌드박스에서 실행 성공한다",
      ],
      sourceOffset: 70,
      mutate: [
        (payload) => {
          const from = payload.objects[0].id;
          payload.objects[0].id = 1.5;
          return { anomalyType: "zod-reject", mutations: [{ path: "objects[0].id", from, to: 1.5 }] };
        },
        (payload) => {
          const from = payload.human_annotation_grasp[0].num_keypoints;
          payload.human_annotation_grasp[0].num_keypoints = 2.5;
          return {
            anomalyType: "zod-reject",
            mutations: [{ path: "human_annotation_grasp[0].num_keypoints", from, to: 2.5 }],
          };
        },
      ],
    },
    {
      scenarioId: "A10-null-intrinsic-param",
      description:
        "카메라 내부 파라미터에 null 유입(cody/fx) — codx 만 nullable 인 스키마 비대칭을 찌르는 zod 위반",
      channel: "log",
      expectedSignal: "insert.file.failed (zod parse 실패: null 비허용 필드)",
      expectedDocsGist: "null 비허용 필드 위반 진단 + 오염 데이터 격리(containment) SQL + 데이터 품질 권고",
      layer3SuccessCriteria: [
        "원인으로 camera_intrinsic_param 의 null 비허용 필드(cody/fx)에 null 이 들어왔음을 지목",
        "이상 레코드를 특정하는 격리 SQL 이 샌드박스에서 실행 성공한다",
      ],
      sourceOffset: 85,
      mutate: [
        (payload) => {
          const from = payload.camera_info.camera_intrinsic_param.cody;
          payload.camera_info.camera_intrinsic_param.cody = null;
          return {
            anomalyType: "zod-reject",
            mutations: [{ path: "camera_info.camera_intrinsic_param.cody", from, to: null }],
          };
        },
        (payload) => {
          const from = payload.camera_info.camera_intrinsic_param.fx;
          payload.camera_info.camera_intrinsic_param.fx = null;
          return {
            anomalyType: "zod-reject",
            mutations: [{ path: "camera_info.camera_intrinsic_param.fx", from, to: null }],
          };
        },
      ],
    },
    {
      scenarioId: "B2-multimodal-integrity",
      description:
        "모달 파일명과 레코드 좌표(scene/attempt) 불일치 — zod·투영은 통과하나 read_multimodal 정합성 검사(projection.integrity.violation)가 잡는다",
      channel: "log",
      expectedSignal: "projection.integrity.violation (modalFileName attempt/scene 불일치)",
      expectedDocsGist: "모달 파일명 정합성 위반 진단 + 격리(containment) SQL + 데이터 품질 권고",
      layer3SuccessCriteria: [
        "원인으로 모달 파일명(2D/video)의 attempt 또는 scene 이 레코드와 불일치함을 지목",
        "이상 행을 특정하는 격리 SQL 이 샌드박스에서 실행 성공한다",
      ],
      sourceOffset: 100,
      // 내부 4필드 동기화 이후에 적용되는 변이 — 동기화 위반 자체가 시나리오다.
      mutate: [
        (payload, context) => {
          const from = payload["2D_image_file_name"];
          const to = `${context.prefix}_${context.scene}_02_${context.date}.jpg`; // 파일은 _01_
          payload["2D_image_file_name"] = to;
          return { anomalyType: "projection.integrity.violation", mutations: [{ path: "2D_image_file_name", from, to }] };
        },
        (payload, context) => {
          const from = payload["video_file_name"];
          const to = `${context.prefix}_09999_00_${context.date}.mp4`; // scene_key 와 불일치
          payload["video_file_name"] = to;
          return { anomalyType: "projection.integrity.violation", mutations: [{ path: "video_file_name", from, to }] };
        },
      ],
    },
  ];

  const queryScenarios = [
    {
      scenarioId: "E4-time-series-query",
      kind: "new-timeseries",
      description: "정상 배경만(이상 없음) 위에서 사용자가 일자별 성공률 추이 조회를 요청",
      userQuery:
        "일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가?",
      expectedReadModelGist: "일자(occurred_at 날짜) 기준 시계열 집계 테이블(시도 수·성공 수·성공률) DDL + 프로젝션 가이드 + API v+1",
      layer3SuccessCriteria: [
        "일자 기준 시계열 집계가 필요함을 정확히 진단한다",
        "산출 SQL이 샌드박스에서 실행 성공하고 날짜별 시도 수/성공 수/성공률을 시간 순으로 반환한다",
      ],
      sourceOffset: 20,
    },
    {
      scenarioId: "E5-failure-ranking-query",
      kind: "new-ranking",
      description: "정상 배경만(이상 없음) 위에서 사용자가 실패 상위 객체 랭킹 조회를 요청",
      userQuery:
        "파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객체별 실패 수와 실패율을 순위대로 보고 싶다.",
      expectedReadModelGist: "object_name 별 실패 수·실패율 랭킹 테이블(정렬 가능) DDL + 프로젝션 가이드 + API v+1",
      layer3SuccessCriteria: [
        "객체별 실패 집계와 순위 정렬이 필요함을 정확히 진단한다",
        "산출 SQL이 샌드박스에서 실행 성공하고 객체별 실패 수/실패율을 순위대로 반환한다",
      ],
      sourceOffset: 35,
    },
  ];

  // ── 폴더 재생성(자기 소유분만) ───────────────────────────────────
  const ownScenarioIds = [
    ...anomalyScenarios.map((s) => s.scenarioId),
    ...queryScenarios.map((s) => s.scenarioId),
    "F3-subthreshold-jump",
  ];
  const legacyScenarioIds = ["A7-rotation-matrix-invalid"]; // R4 재지정 이전의 폐기 시나리오
  for (const scenarioId of [...ownScenarioIds, ...legacyScenarioIds]) {
    await fs.rm(path.join(SCENARIO_ROOT, `scenario-${scenarioId}`), { recursive: true, force: true });
  }

  const indexEntries = [];

  async function writeScenario(scenarioId, fileEntries, manifestBody, groundTruth) {
    const folder = path.join(SCENARIO_ROOT, `scenario-${scenarioId}`);
    await fs.mkdir(folder, { recursive: true });
    let anomalousCount = 0;
    for (const entry of fileEntries) {
      if (entry.label === "anomalous") anomalousCount += 1;
      if (entry.content === null) {
        await fs.copyFile(path.join(TOY_DATA_DIRECTORY, entry.fileName), path.join(folder, entry.fileName));
      } else {
        await fs.writeFile(path.join(folder, entry.fileName), entry.content);
      }
    }
    const manifest = {
      scenarioId,
      layer: "2-3",
      ...manifestBody,
      files: fileEntries.map((entry) => ({
        fileName: entry.fileName,
        label: entry.label,
        anomalyType: entry.anomalyType ?? null,
        sourceFile: entry.sourceFile ?? null,
        mutations: entry.mutations ?? [],
      })),
      ...manifestBody.tail,
    };
    delete manifest.tail;
    await fs.writeFile(path.join(folder, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
    indexEntries.push({
      scenarioId,
      folder: `scenario-${scenarioId}`,
      fileCount: fileEntries.length,
      anomalousFileCount: anomalousCount,
      groundTruth,
    });
    console.log(`생성: ${scenarioId} — 파일 ${fileEntries.length}건(이상 ${anomalousCount})`);
  }

  // A/B 계열: 정상 배경 25 + 변이 2 = 27
  for (const scenario of anomalyScenarios) {
    const sources = pickFromOffset(scenario.sourceOffset, 2, scenario.sourcePredicate ?? null);
    const background = pickFromOffset(scenario.sourceOffset + 7, 25, null, new Set(sources));
    const fileEntries = background.map((name) => ({ fileName: name, label: "normal", content: null }));
    const mutationRecords = [];
    for (let i = 0; i < 2; i++) {
      const sourceName = sources[i];
      const parsed = parseFileName(sourceName);
      const scene = allocateSceneNumber();
      const payload = await readToyData(sourceName);
      synchronizeInternalNames(payload, parsed.prefix, scene, "01", parsed.date);
      const context = { prefix: parsed.prefix, scene, date: parsed.date };
      const result = scenario.mutate[i](payload, context);
      mutationRecords.push(result);
      fileEntries.push({
        fileName: buildFileName(parsed.prefix, scene, "01", parsed.date),
        label: "anomalous",
        anomalyType: result.anomalyType,
        sourceFile: sourceName,
        mutations: result.mutations,
        content: `${JSON.stringify(payload, null, 2)}\n`,
      });
    }
    await writeScenario(
      scenario.scenarioId,
      fileEntries,
      {
        description: scenario.description,
        tail: {
          expectedDetection: {
            anomalous: true,
            kind: mutationRecords[0].anomalyType,
            expectedSignal: scenario.expectedSignal,
          },
          expectedDocsGist: scenario.expectedDocsGist,
          layer3SuccessCriteria: scenario.layer3SuccessCriteria,
        },
      },
      `이상 / ${mutationRecords[0].anomalyType}`,
    );
  }

  // E 계열: 정상 배경 30, 변이 없음
  for (const scenario of queryScenarios) {
    const background = pickFromOffset(scenario.sourceOffset, 30, null);
    const fileEntries = background.map((name) => ({ fileName: name, label: "normal", content: null }));
    await writeScenario(
      scenario.scenarioId,
      fileEntries,
      {
        kind: scenario.kind,
        description: scenario.description,
        tail: {
          userQuery: scenario.userQuery,
          expectedReadModelGist: scenario.expectedReadModelGist,
          layer3SuccessCriteria: scenario.layer3SuccessCriteria,
        },
      },
      `재생성 필요 / ${scenario.kind}`,
    );
  }

  // F3: 정상 배경 24 + 재시도 씬 3개 × 시도 01/02 (시도 02 의 z 를 +Δ, Δ=0.07 < 임계 0.10)
  {
    const retrySources = pickFromOffset(0, 3, subthresholdJumpSource);
    const background = pickFromOffset(110, 24, null, new Set(retrySources));
    const fileEntries = background.map((name) => ({ fileName: name, label: "normal", content: null }));
    for (const sourceName of retrySources) {
      const parsed = parseFileName(sourceName);
      const scene = allocateSceneNumber();
      for (const attempt of ["01", "02"]) {
        const payload = await readToyData(sourceName);
        synchronizeInternalNames(payload, parsed.prefix, scene, attempt, parsed.date);
        const mutations = [];
        if (attempt === "02") {
          for (let i = 1; i <= 8; i++) {
            const key = `z${i}`;
            const from = payload.grip_data.grip_3d_pose[key];
            const to = from + SUBTHRESHOLD_JUMP_DELTA;
            if (to > 0.1998) {
              throw new Error(`F3 z 시프트가 관측 클러스터 밖: ${sourceName} ${key}=${to}`);
            }
            payload.grip_data.grip_3d_pose[key] = to;
            mutations.push({ path: `grip_data.grip_3d_pose.${key}`, from, to });
          }
        }
        fileEntries.push({
          fileName: buildFileName(parsed.prefix, scene, attempt, parsed.date),
          label: "normal",
          sourceFile: sourceName,
          mutations,
          content: `${JSON.stringify(payload, null, 2)}\n`,
        });
      }
    }
    await writeScenario(
      "F3-subthreshold-jump",
      fileEntries,
      {
        description:
          "정상 배경 + 재시도 씬 3개(시도 01→02 깊이 Δ=+0.07, R6 임계 0.10 미만) — 임계 이하 변화가 jump 로 오인되지 않아야 한다",
        tail: {
          expectedDetection: { anomalous: false },
          expectedDocsGist: "트리거 없음이 정답 — Docs 미생성",
          layer3SuccessCriteria: [
            "어떤 레코드에서도 physical/consistency/jump 판정이 발생하지 않고 Docs 가 생성되지 않는다",
          ],
        },
      },
      "정상(트리거 없음)",
    );
  }

  // ── index.json 갱신(자기 소유분 교체 append) ─────────────────────
  const index = JSON.parse(await fs.readFile(INDEX_PATH, "utf8"));
  index.scenarios = index.scenarios.filter(
    (entry) => !ownScenarioIds.includes(entry.scenarioId) && !legacyScenarioIds.includes(entry.scenarioId),
  );
  index.scenarios.push(...indexEntries);
  await fs.writeFile(INDEX_PATH, `${JSON.stringify(index, null, 2)}\n`);

  // ── 전역 무중복 검증 ─────────────────────────────────────────────
  const seenScenes = new Map();
  for (const entry of index.scenarios) {
    const folder = path.join(SCENARIO_ROOT, entry.folder);
    for (const name of await fs.readdir(folder)) {
      const match = FILE_NAME_PATTERN.exec(name);
      if (!match) continue;
      const scene = match[2];
      if (Number(scene) < 2000) continue;
      const owner = seenScenes.get(scene);
      if (owner && owner !== entry.scenarioId) {
        throw new Error(`신규 장면번호 전역 중복: ${scene} (${owner} ↔ ${entry.scenarioId})`);
      }
      seenScenes.set(scene, entry.scenarioId);
    }
  }
  console.log(`index.json 갱신 완료 — 시나리오 ${index.scenarios.length}종, 신규 장면번호 ${seenScenes.size}개 전역 무중복 확인`);
}

await main();

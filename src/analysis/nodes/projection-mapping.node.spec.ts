import { AnalysisState } from "@/analysis/analysis.state";
import {
  groundMappingRows,
  projectionMappingNode,
} from "@/analysis/nodes/projection-mapping.node";
import {
  NewReadModelOutput,
  ProjectionMappingOutput,
} from "@/analysis/type/output.type";

const newReadModel: NewReadModelOutput = {
  proposedName: "read_grip_pose",
  purpose: "파지 시도의 pose 조회",
  rationale: "기존 모델에 pose 컬럼 부재",
  sourceEvents: ["grip.attempted"],
  keyColumns: "(scene_key, attempt_num)",
  fields: [
    { name: "scene_key", dataType: "text", meaning: "장면 키" },
    { name: "grip_2d_pose", dataType: "jsonb", meaning: "2D 파지 pose" },
  ],
  drizzleSchema: "",
  migrationSql: "",
  projectorCode: "",
  controllerWiring: "",
};

const evidenceText =
  "## Event: grip.attempted\n(grip_2d_pose:jsonb, 2D 파지 pose)\n(robot_tf:jsonb, 로봇 변환)";

function mapping(
  overrides: Partial<ProjectionMappingOutput>,
): ProjectionMappingOutput {
  return {
    readModelName: "read_grip_pose",
    upsertKey: "(scene_key, attempt_num)",
    rows: [],
    derivedColumns: [],
    replayNote: "커서 0 초기화 후 catch-up",
    ...overrides,
  };
}

describe("groundMappingRows", () => {
  it("targetColumn 이 fields 에 있고 sourceField 가 근거에 실재하는 행은 유지한다", () => {
    const grounded = groundMappingRows(
      mapping({
        rows: [
          {
            sourceEvent: "grip.attempted",
            sourceField: "grip_2d_pose",
            targetColumn: "grip_2d_pose",
            transform: "verbatim",
          },
        ],
      }),
      newReadModel,
      evidenceText,
    );

    expect(grounded.rows).toHaveLength(1);
  });

  it("fields 에 없는 targetColumn 행은 strip 한다", () => {
    const grounded = groundMappingRows(
      mapping({
        rows: [
          {
            sourceEvent: "grip.attempted",
            sourceField: "grip_2d_pose",
            targetColumn: "invented_column",
            transform: "verbatim",
          },
        ],
      }),
      newReadModel,
      evidenceText,
    );

    expect(grounded.rows).toHaveLength(0);
  });

  it("근거 텍스트에 실재하지 않는 sourceField 행은 strip 한다", () => {
    const grounded = groundMappingRows(
      mapping({
        rows: [
          {
            sourceEvent: "grip.attempted",
            sourceField: "invented_payload_field",
            targetColumn: "grip_2d_pose",
            transform: "verbatim",
          },
        ],
      }),
      newReadModel,
      evidenceText,
    );

    expect(grounded.rows).toHaveLength(0);
  });

  it("fields 에 없는 컬럼의 derivedColumns 항목은 strip 한다", () => {
    const grounded = groundMappingRows(
      mapping({
        derivedColumns: [
          { column: "scene_key", derivation: "streamId 접두 제거" },
          { column: "invented_column", derivation: "발명된 규칙" },
        ],
      }),
      newReadModel,
      evidenceText,
    );

    expect(grounded.derivedColumns).toEqual([
      { column: "scene_key", derivation: "streamId 접두 제거" },
    ]);
  });
});

describe("projectionMappingNode", () => {
  it("newReadModel 출력이 없으면 LLM 호출 없이 빈 outputs 로 통과한다", async () => {
    const state: typeof AnalysisState.State = {
      window: null,
      sensorFinding: null,
      insightCards: "",
      docId: "analysis-test",
      generatedAt: "2026-07-06T00:00:00.000Z",
      rootCause: null,
      diagnosisTrajectory: [],
      decision: null,
      outputs: {},
      report: null,
    };

    await expect(projectionMappingNode(state)).resolves.toEqual({
      outputs: {},
    });
  });
});

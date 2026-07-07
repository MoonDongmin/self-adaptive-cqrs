import { AnalysisState } from '@/analysis/analysis.state';
import { invokeNode } from '@/analysis/nodes/invoke';
import { PROJECTION_MAPPING_PROMPT } from '@/analysis/prompts';
import { renderEvidenceContext, renderRootCause } from '@/analysis/render';
import {
  NewReadModelOutput,
  ProjectionMappingOutput,
  projectionMappingOutputSchema,
} from '@/analysis/type/output.type';

// 결정론 사후검증: 매핑 행의 양끝이 실재하는 것만 남긴다(환각 행 strip).
// - targetColumn 은 방금 설계된 newReadModel.fields 에 있어야 하고,
// - sourceField 는 근거 텍스트(Insight 카드 + 윈도우/배치)의 부분문자열이어야 한다.
// 구조적으로 valid 한 JSON 도 지어낸 필드명을 가질 수 있어 zod 로는 못 잡는다
// (data-quality.node 의 observedValue substring 검증과 동일 패턴).
export function groundMappingRows(
  mapping: ProjectionMappingOutput,
  newReadModel: NewReadModelOutput,
  evidenceText: string,
): ProjectionMappingOutput {
  const knownColumns = new Set(newReadModel.fields.map((field) => field.name));

  return {
    ...mapping,
    rows: mapping.rows.filter(
      (row) =>
        knownColumns.has(row.targetColumn) &&
        evidenceText.includes(row.sourceField),
    ),
    derivedColumns: mapping.derivedColumns.filter((item) =>
      knownColumns.has(item.column),
    ),
  };
}

// 매핑 프롬프트에 주입할 신규 Read Model 설계 요약(코드 필드 제외 — 매핑에 불필요한 토큰).
function renderNewReadModelDesign(newReadModel: NewReadModelOutput): string {
  const fields = newReadModel.fields
    .map((field) => `- ${field.name} (${field.dataType}): ${field.meaning}`)
    .join("\n");

  return [
    "## 신규 Read Model 설계",
    `- 이름: ${newReadModel.proposedName}`,
    `- 키: ${newReadModel.keyColumns}`,
    `- 원천 이벤트: ${newReadModel.sourceEvents.join(", ") || "-"}`,
    "- 컬럼:",
    fields,
  ].join("\n");
}

// newReadModel 의 동반 스테이지: genNewReadModel 뒤에 체인되어, 설계된 fields 를 보고
// 이벤트→컬럼 매핑 명세를 생성한다. decide 가 고르는 OutputKind 가 아니다.
export async function projectionMappingNode(state: typeof AnalysisState.State) {
  const newReadModel = state.outputs.newReadModel;
  // genNewReadModel 이 degrade 했으면 매핑도 성립하지 않는다 — 조용히 통과.
  if (newReadModel === undefined) {
    return { outputs: {} };
  }

  // sourceField 실재성 판정 원천: 설계 요약을 넣으면 컬럼명이 payload 필드로 오인 통과하므로 제외.
  const evidenceText = [
    renderEvidenceContext(state.window, state.sensorFinding),
    state.insightCards,
  ].join("\n\n");

  const facts = [
    renderRootCause(state.rootCause!),
    evidenceText,
    renderNewReadModelDesign(newReadModel),
  ].join("\n\n");

  try {
    const mapping = await invokeNode(
      PROJECTION_MAPPING_PROMPT,
      facts,
      projectionMappingOutputSchema,
    );

    const grounded = groundMappingRows(mapping, newReadModel, evidenceText);

    // 매핑 행이 전부 환각이라 strip 되면 산출하지 않는다(newReadModel 출력은 영향 없음).
    if (grounded.rows.length === 0) {
      return { outputs: {} };
    }

    return { outputs: { projectionMapping: grounded } };
  } catch {
    // 매핑 실패가 신규 Read Model 산출 전체를 죽이지 않게 degrade(기존 생성기 노드와 동일).
    return { outputs: {} };
  }
}

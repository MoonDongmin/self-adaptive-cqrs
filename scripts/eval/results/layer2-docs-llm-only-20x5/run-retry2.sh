#!/usr/bin/env bash
# 2차 수동 재시도 (2026-08-08) — 1차 재시도 후 잔여 타임아웃 런(~10개)만 재수집하고 재채점.
set -uo pipefail

REPOSITORY_ROOT="/Users/dongmin/Developments/graduate-school/self-adaptive-cqrs"
RESULTS_NAME="layer2-docs-llm-only-20x5"
RESULTS_DIRECTORY="$REPOSITORY_ROOT/scripts/eval/results/$RESULTS_NAME"
WRAPPER_LOG="$RESULTS_DIRECTORY/wrapper.log"

ALL_SCENARIOS="A1-payload-drift A2-type-mismatch A3-missing-field \
A4-physical-impossible A5-consistency-violation A6-depth-jump \
A7-grip-depth-underflow A8-translation-x-violation A9-non-integer-id \
A10-null-intrinsic-param B1-projection-map-failed B2-multimodal-integrity \
E1-new-column-query E2-new-aggregate-query E3-new-join-query \
E4-time-series-query E5-failure-ranking-query \
F2-normal-retry F3-subthreshold-jump F5-all-normal"

cd "$REPOSITORY_ROOT"
echo "[retry2] 시작: $(date '+%F %T')" >> "$WRAPPER_LOG"

removedCount=$(python3 - <<'PYTHON'
import glob
import json
import os
import shutil

resultsRoot = "scripts/eval/results/layer2-docs-llm-only-20x5"
removed = 0
for metaPath in glob.glob(f"{resultsRoot}/*/rep-*/run-meta.json"):
    with open(metaPath) as metaFile:
        meta = json.load(metaFile)
    expected = "docs-collected" if meta.get("expectsDocs") else "clean-no-docs"
    if meta.get("exitReason") != expected:
        shutil.rmtree(os.path.dirname(metaPath))
        removed += 1
print(removed)
PYTHON
)
echo "[retry2] 재수집 대상 ${removedCount}런" >> "$WRAPPER_LOG"

CAMPAIGN_SCENARIOS="$ALL_SCENARIOS" \
  bash scripts/eval/run-layer2-k5-campaign.sh 5 "$RESULTS_NAME" >> "$WRAPPER_LOG" 2>&1
echo "[retry2] 캠페인 종료: $(date '+%F %T')" >> "$WRAPPER_LOG"

{
  echo "# 층2 확장 본평가 요약 — 20종 × k5 (2차 재시도 후, $(date '+%F %T'))"
  echo
  echo "- 시나리오: 기존 12종 + 확장 8종(A7~A10·B2·E4·E5·F3), llm-only, 로컬 LLM"
  echo
  echo "## 결정론 검증 (verify-layer2-docs)"
  echo '```'
  node scripts/eval/verify-layer2-docs.mjs --results "scripts/eval/results/$RESULTS_NAME" 2>&1
  echo '```'
  echo
  echo "## SQL 실행 가능성 (verify-layer2-sql)"
  echo '```'
  node scripts/eval/verify-layer2-sql.mjs --results "scripts/eval/results/$RESULTS_NAME" 2>&1
  echo '```'
} > "$RESULTS_DIRECTORY/verify-summary.md"

touch "$RESULTS_DIRECTORY/.retry2-done"
echo "[retry2] 전부 완료: $(date '+%F %T')" >> "$WRAPPER_LOG"

#!/usr/bin/env bash
# 3차 재시도 — A7 rep-3 단일 런 재수집 후 최종 재채점.
set -uo pipefail
REPOSITORY_ROOT="/Users/dongmin/Developments/graduate-school/self-adaptive-cqrs"
RESULTS_NAME="layer2-docs-llm-only-20x5"
RESULTS_DIRECTORY="$REPOSITORY_ROOT/scripts/eval/results/$RESULTS_NAME"
cd "$REPOSITORY_ROOT"
echo "[retry3] 시작: $(date '+%F %T')" >> "$RESULTS_DIRECTORY/wrapper.log"
CAMPAIGN_SCENARIOS="A7-grip-depth-underflow" \
  bash scripts/eval/run-layer2-k5-campaign.sh 5 "$RESULTS_NAME" >> "$RESULTS_DIRECTORY/wrapper.log" 2>&1
{
  echo "# 층2 확장 본평가 최종 요약 — 20종 × k5 ($(date '+%F %T'))"
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
touch "$RESULTS_DIRECTORY/.retry3-done"
echo "[retry3] 전부 완료: $(date '+%F %T')" >> "$RESULTS_DIRECTORY/wrapper.log"

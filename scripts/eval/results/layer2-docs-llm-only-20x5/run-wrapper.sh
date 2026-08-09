#!/usr/bin/env bash
# 층2 확장 본평가 (2026-08-03) — 20종 × k5 = 100런. nohup 으로 세션과 무관하게 실행.
#
# 1) 스모크: 신규 시나리오 중 리스크 큰 3종(B2·A7·E4) × rep-1
# 2) 게이트: 세 시나리오 모두 Docs 가 수집됐는지 확인 — 실패 시 전체 캠페인 중단
#    (깨진 시나리오로 40시간+ 를 태우지 않기 위한 안전장치)
# 3) 전체 캠페인: 20종 × rep 1..5 (스모크 수집분은 이어하기로 건너뜀)
# 4) 채점: verify-layer2-docs + verify-layer2-sql → verify-summary.md
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
SMOKE_SCENARIOS="B2-multimodal-integrity A7-grip-depth-underflow A8-translation-x-violation E4-time-series-query"

cd "$REPOSITORY_ROOT"
mkdir -p "$RESULTS_DIRECTORY"
echo "[wrapper] 시작: $(date '+%F %T')" > "$WRAPPER_LOG"

# ── 1) 스모크 ──────────────────────────────────────────────────────
echo "[wrapper] 스모크 시작 (B2·A7·E4 × rep-1): $(date '+%F %T')" >> "$WRAPPER_LOG"
CAMPAIGN_SCENARIOS="$SMOKE_SCENARIOS" \
  bash scripts/eval/run-layer2-k5-campaign.sh 1 "$RESULTS_NAME" >> "$WRAPPER_LOG" 2>&1

# ── 2) 게이트 ──────────────────────────────────────────────────────
smokeFailed=0
for scenario in $SMOKE_SCENARIOS; do
  docCount=$(find "$RESULTS_DIRECTORY/$scenario/rep-1" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
  echo "[wrapper] 게이트: $scenario rep-1 문서 ${docCount}건" >> "$WRAPPER_LOG"
  if [ "$docCount" = "0" ]; then
    smokeFailed=1
  fi
done
if [ "$smokeFailed" = "1" ]; then
  echo "[wrapper] SMOKE-FAILED: 신규 시나리오가 Docs 를 산출하지 못함 — 전체 캠페인 중단" >> "$WRAPPER_LOG"
  touch "$RESULTS_DIRECTORY/.wrapper-done"
  exit 1
fi
echo "[wrapper] SMOKE-PASSED: 전체 캠페인 진행" >> "$WRAPPER_LOG"

# ── 3) 전체 캠페인 (스모크 수집분은 건너뜀) ────────────────────────
CAMPAIGN_SCENARIOS="$ALL_SCENARIOS" \
  bash scripts/eval/run-layer2-k5-campaign.sh 5 "$RESULTS_NAME" >> "$WRAPPER_LOG" 2>&1
campaignExit=$?
echo "[wrapper] 캠페인 종료: $(date '+%F %T') exit=$campaignExit" >> "$WRAPPER_LOG"

# ── 3b) 타임아웃 런 재시도 라운드 (1회) ────────────────────────────
# 일시적 LLM 서버 정체(2026-08-03 18~22시 실측)로 타임아웃된 런은 run-meta 가 남아
# 이어하기가 영원히 건너뛴다 — 해당 런만 지우고 캠페인을 한 번 더 돌려 재수집한다.
retryRemoved=$(python3 - <<'PYTHON'
import glob
import json
import os
import shutil

resultsRoot = "scripts/eval/results/layer2-docs-llm-only-20x5"
removedCount = 0
for metaPath in glob.glob(f"{resultsRoot}/*/rep-*/run-meta.json"):
    with open(metaPath) as metaFile:
        meta = json.load(metaFile)
    if meta.get("expectsDocs") and meta.get("exitReason") in ("timeout", "no-docs-timeout"):
        shutil.rmtree(os.path.dirname(metaPath))
        removedCount += 1
print(removedCount)
PYTHON
)
if [ "$retryRemoved" != "0" ]; then
  echo "[wrapper] 재시도 라운드: 타임아웃 런 ${retryRemoved}개 재수집 시작 $(date '+%F %T')" >> "$WRAPPER_LOG"
  CAMPAIGN_SCENARIOS="$ALL_SCENARIOS" \
    bash scripts/eval/run-layer2-k5-campaign.sh 5 "$RESULTS_NAME" >> "$WRAPPER_LOG" 2>&1
  echo "[wrapper] 재시도 라운드 종료: $(date '+%F %T')" >> "$WRAPPER_LOG"
else
  echo "[wrapper] 재시도 라운드: 대상 없음" >> "$WRAPPER_LOG"
fi

# ── 4) 채점 ────────────────────────────────────────────────────────
{
  echo "# 층2 확장 본평가 요약 — 20종 × k5 ($(date '+%F %T'))"
  echo
  echo "- 시나리오: 기존 12종 + 확장 8종(A7~A10·B2·E4·E5·F3), llm-only, 로컬 LLM"
  echo "- 캠페인 종료 코드: $campaignExit"
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

touch "$RESULTS_DIRECTORY/.wrapper-done"
echo "[wrapper] 전부 완료: $(date '+%F %T')" >> "$WRAPPER_LOG"

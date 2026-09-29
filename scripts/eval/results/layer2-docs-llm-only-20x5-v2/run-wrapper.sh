#!/usr/bin/env bash
# 층2 확장 본평가 v2 (2026-08-10) — 20종 × k5 = 100런. nohup 으로 세션과 무관하게 실행.
# v1(layer2-docs-llm-only-20x5) 과의 차이: TS 합성 파이프라인 수정본
# (payload 경로 결정론 색인·시간 버킷·집계 증분 upsert + payload 키/pgTable명/excluded
# 결정론 검증, 2026-08-09~10) 적용 후의 재평가. 조건·시나리오·게이트는 v1 과 동일.
#
# 1) 스모크: 리스크 큰 4종(B2·A7·A8·E4) × rep-1
# 2) 게이트: 스모크 전부 Docs 수집 확인 — 실패 시 전체 캠페인 중단
# 3) 전체 캠페인: 20종 × rep 1..5 (스모크 수집분은 이어하기로 건너뜀)
# 3b) 타임아웃 런 재시도 라운드 (1회)
# 4) 채점: verify-layer2-docs + verify-layer2-sql → verify-summary.md
set -uo pipefail

REPOSITORY_ROOT="/Users/dongmin/Developments/graduate-school/self-adaptive-cqrs"
RESULTS_NAME="layer2-docs-llm-only-20x5-v2"
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
echo "[wrapper] git HEAD: $(git rev-parse --short HEAD) (+작업트리 수정분 = TS 합성 개선)" >> "$WRAPPER_LOG"

# ── 1) 스모크 ──────────────────────────────────────────────────────
echo "[wrapper] 스모크 시작 (B2·A7·A8·E4 × rep-1): $(date '+%F %T')" >> "$WRAPPER_LOG"
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
  echo "[wrapper] SMOKE-FAILED: 스모크 시나리오가 Docs 를 산출하지 못함 — 전체 캠페인 중단" >> "$WRAPPER_LOG"
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
retryRemoved=$(python3 - <<'PYTHON'
import glob
import json
import os
import shutil

resultsRoot = "scripts/eval/results/layer2-docs-llm-only-20x5-v2"
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
  echo "# 층2 확장 본평가 v2 요약 — 20종 × k5 ($(date '+%F %T'))"
  echo
  echo "- 시나리오: v1 과 동일 20종, llm-only, 로컬 LLM. TS 합성 파이프라인 수정본 적용"
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

#!/usr/bin/env bash
# 층3 본평가 캠페인 — 러너(17종 × k5 × B1/A × T1~T4) → 자동 채점 → LLM judge 를 한 프로세스에서 순서대로 실행한다.
# caffeinate 로 감싸 실행하면 끝날 때까지 노트북이 잠들지 않는다:
#   nohup caffeinate -dims bash scripts/eval/run-layer3-campaign.sh > scripts/eval/results/layer3-campaign.log 2>&1 &
# 중단되면 같은 명령으로 이어하기(저장된 응답·judge 는 건너뜀).
set -uo pipefail
cd "$(dirname "$0")/../.."

RESULTS_NAME="${1:-layer3-downstream-9b-17x5}"
CONSUMER_MODEL="${CONSUMER_MODEL:-qwen/qwen3.5-9b}"
JUDGE_MODEL="${JUDGE_MODEL:-qwen3.6-35b-a3b-ud-mlx}"

echo "[$(date '+%F %T')] 캠페인 시작 — results=${RESULTS_NAME} consumer=${CONSUMER_MODEL} judge=${JUDGE_MODEL}"

echo "[$(date '+%F %T')] 1/3 러너"
node scripts/eval/run-layer3-downstream.mjs --reps 5 --conditions B1,A --model "${CONSUMER_MODEL}" --max-tokens 8192 --results-name "${RESULTS_NAME}"

echo "[$(date '+%F %T')] 2/3 자동 채점"
node scripts/eval/verify-layer3.mjs --results "scripts/eval/results/${RESULTS_NAME}"

echo "[$(date '+%F %T')] 3/3 LLM judge"
node scripts/eval/judge-layer3.mjs --results "scripts/eval/results/${RESULTS_NAME}" --judge-model "${JUDGE_MODEL}"

echo "[$(date '+%F %T')] 캠페인 완료"

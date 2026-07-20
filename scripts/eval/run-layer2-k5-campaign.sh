#!/usr/bin/env bash
# 층2 Docs 본평가 캠페인: 10종 × k회 = 50런(기본), llm-only 모드.
#
# 런마다 (1) 앱 재기동 (2) Kafka 두 토픽 정리 후 run-layer2-docs.mjs 를 단일 런으로
# 호출한다 — 장시간 단일 앱 프로세스의 분석 정체(2026-07-19 실측: E 계열 30분 타임아웃)와
# 낙오 분석의 런 간 오염(hybrid 50런 운영 기록)을 원천 차단하기 위함이다.
# rep-메이저 순서(전 시나리오 rep-1 → rep-2 …)로 돌아, 중단돼도 앞 rep 까지는 완전한
# 커버리지가 남는다. 이미 수집된 (시나리오, rep) 는 건너뛴다(중단 후 재실행 = 이어하기).
#
# 사용: bash scripts/eval/run-layer2-k5-campaign.sh [reps=5] [results-name=layer2-docs-llm-only-k5]
set -uo pipefail

REPOSITORY_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPOSITORY_ROOT"

TOTAL_REPS="${1:-5}"
RESULTS_NAME="${2:-layer2-docs-llm-only-k5}"
APP_LOG="$REPOSITORY_ROOT/scripts/eval/results/$RESULTS_NAME/app-campaign.log"
SCENARIO_DIRECTORY_NAMES=(
  "A1-payload-drift" "A2-type-mismatch" "A3-missing-field"
  "A4-physical-impossible" "A5-consistency-violation" "A6-depth-jump"
  "B1-projection-map-failed" "E1-new-column-query" "E2-new-aggregate-query"
  "E3-new-join-query"
)

mkdir -p "$REPOSITORY_ROOT/scripts/eval/results/$RESULTS_NAME"

stop_app() {
  pkill -f "nest start" 2>/dev/null
  # 포트 점유 프로세스까지 확실히 정리
  local pids
  pids=$(lsof -ti :3000 2>/dev/null || true)
  if [ -n "$pids" ]; then
    kill $pids 2>/dev/null
  fi
  sleep 2
}

start_app() {
  TOY_DATA_DIRECTORY=data/eval/layer2-staging \
  SENSOR_OBSERVER_JUDGE_MODE=llm-only \
  SENSOR_OBSERVER_ANALYSIS_DISABLED=0 \
  LLM_CONTEXT_ANALYSIS_DISABLED=0 \
  SENSOR_OBSERVER_EPISODE_CLOSE_NORMAL_STREAK=2 \
  npm run start >> "$APP_LOG" 2>&1 &
  for i in $(seq 1 36); do
    if [ "$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 http://localhost:3000/insight/cards)" = "200" ]; then
      return 0
    fi
    sleep 5
  done
  echo "[k5] 앱 기동 실패" >&2
  return 1
}

purge_kafka() {
  bash scripts/kafka-purge.sh --yes >/dev/null 2>&1
  KAFKA_TOPIC=sensor-values KAFKA_GROUP=sensor-value-observer \
    bash scripts/kafka-purge.sh --yes >/dev/null 2>&1
}

echo "[k5] 캠페인 시작: ${#SCENARIO_DIRECTORY_NAMES[@]}종 × rep 1..$TOTAL_REPS → results/$RESULTS_NAME"

for rep in $(seq 1 "$TOTAL_REPS"); do
  for scenarioDirectoryName in "${SCENARIO_DIRECTORY_NAMES[@]}"; do
    metaPath="$REPOSITORY_ROOT/scripts/eval/results/$RESULTS_NAME/$scenarioDirectoryName/rep-$rep/run-meta.json"
    if [ -f "$metaPath" ]; then
      echo "[k5] $scenarioDirectoryName rep-$rep 이미 수집됨 — 건너뜀"
      continue
    fi

    scenarioPrefix="${scenarioDirectoryName%%-*}" # A1, E2 등 — 러너의 prefix 매칭에 사용
    echo "[k5] ━━ $scenarioDirectoryName rep-$rep 시작 ($(date '+%H:%M:%S'))"

    stop_app
    purge_kafka
    if ! start_app; then
      echo "[k5] $scenarioDirectoryName rep-$rep: 앱 기동 실패로 건너뜀 — 다음 런에서 재시도됨"
      continue
    fi

    EVAL_DOC_TIMEOUT_MS=3600000 node scripts/eval/run-layer2-docs.mjs \
      --scenarios "$scenarioPrefix" --reps "$rep" --start-rep "$rep" \
      --results-name "$RESULTS_NAME"
    echo "[k5] ━━ $scenarioDirectoryName rep-$rep 종료 ($(date '+%H:%M:%S'))"
  done
done

stop_app
echo "[k5] 캠페인 완료: $(date '+%H:%M:%S')"

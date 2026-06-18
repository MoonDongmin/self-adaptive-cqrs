#!/usr/bin/env bash
# log-events 토픽에 얼마나 쌓였고, 컨슈머가 얼마나 밀렸는지(LAG) 확인.
# 읽기 전용. 안전하게 아무 때나 실행 가능.
set -euo pipefail

CONTAINER="${KAFKA_CONTAINER:-self-adaptive-cqrs-kafka1}"
BROKER="${KAFKA_BROKER:-kafka1:9092}"
TOPIC="${KAFKA_TOPIC:-log-events}"
GROUP="${KAFKA_GROUP:-llm-context-builder}"

run() { docker exec "$CONTAINER" "$@"; }

echo "=== 토픽 시작/끝 offset ('${TOPIC}') ==="
echo "시작: $(run /opt/kafka/bin/kafka-get-offsets.sh --bootstrap-server "$BROKER" --topic "$TOPIC" --time -2)"
echo "끝  : $(run /opt/kafka/bin/kafka-get-offsets.sh --bootstrap-server "$BROKER" --topic "$TOPIC" --time -1)"
echo "  (시작 == 끝 이면 잔여 메시지 0건)"
echo
echo "=== 컨슈머 그룹 LAG ('${GROUP}') ==="
run /opt/kafka/bin/kafka-consumer-groups.sh --bootstrap-server "$BROKER" --describe --group "$GROUP"

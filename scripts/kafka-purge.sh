#!/usr/bin/env bash
# log-events 토픽의 메시지를 전부 삭제하고, 컨슈머 위치를 맨 끝으로 정렬.
# 파괴적 동작이므로 앱(컨슈머)을 끈 상태에서 실행할 것.
# 확인 없이 실행하려면: kafka-purge.sh --yes
set -euo pipefail

CONTAINER="${KAFKA_CONTAINER:-self-adaptive-cqrs-kafka1}"
BROKER="${KAFKA_BROKER:-kafka1:9092}"
TOPIC="${KAFKA_TOPIC:-log-events}"
GROUP="${KAFKA_GROUP:-llm-context-builder}"

run() { docker exec "$CONTAINER" "$@"; }

if [[ "${1:-}" != "--yes" ]]; then
  echo "토픽 '${TOPIC}'의 모든 메시지를 삭제하고 그룹 '${GROUP}' 오프셋을 끝으로 옮깁니다."
  read -r -p "계속하려면 'yes' 입력: " reply
  [[ "$reply" == "yes" ]] || { echo "취소됨."; exit 1; }
fi

echo "1) 레코드 전체 삭제..."
run sh -c "echo '{\"partitions\":[{\"topic\":\"${TOPIC}\",\"partition\":0,\"offset\":-1}],\"version\":1}' > /tmp/kafka-purge.json \
  && /opt/kafka/bin/kafka-delete-records.sh --bootstrap-server ${BROKER} --offset-json-file /tmp/kafka-purge.json"

echo "2) 컨슈머 오프셋을 끝으로 정렬..."
run /opt/kafka/bin/kafka-consumer-groups.sh --bootstrap-server "$BROKER" \
  --group "$GROUP" --reset-offsets --to-latest --topic "$TOPIC" --execute

echo "완료. (확인은 scripts/kafka-status.sh)"

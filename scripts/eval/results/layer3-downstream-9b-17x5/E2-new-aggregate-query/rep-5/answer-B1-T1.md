사용자가 객체별 파지 성공률 (시도 수, 성공 수, 성공률) 을 한 번에 조회하는 요청을 보냈으나, 기존 Read Model 은 이를 지원할 수 없는 문제가 발생했습니다.
원인은 `read_grip_result` 테이블의 `object_name` 필드가 파지 대상 객체명을 저장하고 있으나, `stream_id` 필드가 `object_name` 을 포함하지 않아 `object_name` 으로 직접 그룹화할 수 없기 때문입니다.
또한 `read_grip_result` 에는 `object_name` 을 기준으로 집계할 수 있는 `attempt_num` 필드가 존재하지 않아, 시도 수와 성공 수를 `object_name` 단위로 계산하는 쿼리 구조를 구성할 수 없습니다.
로그 분석 결과, `insight.card.request` 와 `insight.card.miss` 로그가 반복적으로 발생하고 있으며, `detail` 필드에 "객체 (object_name) 별 파지 성공률을 한 번에 조회하고 싶다"는 구체적인 요청 내용이 포함되어 있어, 이 요청이 현재 시스템의 한계로 인해 실패했음을 확인할 수 있습니다.
따라서 `object_name` 을 기준으로 `attempt_num` 과 `object_name` 을 함께 그룹화하여 `SUM(grip_succeed)` 과 `COUNT(*)` 을 계산하는 SQL 을 작성하려면, `object_name` 을 `stream_id` 에서 추출하거나 별도의 집계 로직이 필요한 추가적인 데이터 가공이 선행되어야 합니다.
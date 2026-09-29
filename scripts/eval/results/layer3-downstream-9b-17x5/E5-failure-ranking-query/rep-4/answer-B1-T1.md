사용자가 '파지 실패가 가장 많은 객체 상위 목록'을 조회했으나, 제공된 Read Model 은 `read_grip_result` 의 `object_name` 과 `attempt_num` 을 기본 키로 하여 개별 시도별 성공/실패 여부만 저장하고 있어, 객체 단위의 집계 데이터가 존재하지 않습니다.

구체적으로 `insight.card.miss` 로그에서 "파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다"는 요청이 발생했으나, 이를 처리할 수 있는 `object_name` 과 `object_fail_count` 같은 필드가 Read Model 에 정의되어 있지 않습니다.

또한 `read_grip_result` 테이블의 `object_name` 은 `stream_id` 에서 'grip-attempt:' 를 제거하여 파생된 값이며, `object_name` 을 기준으로 `attempt_num` 을 그룹화한 집계 쿼리가 바로 실행 가능한 구조가 아닙니다.

따라서 사용자가 요청한 '객체별 실패 수와 실패율 순위'를 제공하기 위해서는 먼저 `read_grip_result` 테이블을 `object_name` 으로 그룹화하여 `attempt_num` 과 `sum(grip_succeed)` 을 계산하는 중간 집계 단계가 추가로 필요합니다.

마지막으로 현재 Read Model 은 `object_name` 을 기준으로 한 실패율 계산에 필요한 `object_total_count` 와 `object_fail_count` 두 가지 메트릭을 동시에 포함하지 않으므로, 단일 쿼리로 위 요청을 충족시킬 수 없습니다.
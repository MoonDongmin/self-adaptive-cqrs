사용자가 '일자별 파지 성공률 추이'를 포함한 집계 및 시간순 정렬 조회를 요청했으나, 기존 Read Model 은 `read_grip_result` 테이블의 `stream_id` 필드가 `grip-attempt:{scene_key}` 형식인 반면, 사용자 요청의 `correlation_id` 가 `insight.card.miss` 에 포함된 "일자별 파지 성공률 추이를 보고 싶다..."라는 텍스트 문자열로 일치하지 않아 조회가 실패했습니다.

로그에서 `insight.card.miss` 레벨 40 로그의 `detail` 필드에 "일자별 파지 성공률 추이를 보고 싶다..."라는 문자열이 그대로 저장되어 있어, 이를 `stream_id` 또는 `correlation_id` 로 매핑하려는 로직이 실패했고, 결과적으로 `insight.card.miss`가 발생했습니다.

Read Model 의 `stream_id` 는 이벤트 소싱의 고유한 스트림 식별자여야 하지만, 사용자 요청은 특정 스트림 ID 가 아닌 '일자'라는 시간 단위의 집계 개념을 포함하고 있어, `read_grip_result` 테이블의 `(scene_key, attempt_num)` 기반 키 구조로는 직접적인 조회가 불가능합니다.

따라서 현재 Read Model 은 특정 장면별 파지 결과를 조회하는 용도로 설계되어 있어, 시간 범위에 따른 시도 수와 성공 수를 집계하고 정렬하는 새로운 Read Model 이나 별도 집계 쿼리가 필요합니다.
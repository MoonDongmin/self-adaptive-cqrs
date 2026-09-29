사용자가 객체별 파지 성공률 (시도 수, 성공 수, 성공률) 을 한 번에 조회하는 요청을 보냈으나, `insight.card.request` 로그의 `detail` 필드에 "객체 (object_name) 별 파지 성공률을 한 번에 조회하고 싶다"라는 메시지가 포함되어 있어 해당 기능이 현재 구현되지 않았음을 알 수 있습니다.

이 요청을 처리하기 위해 `read_grip_result` 테이블을 조회해야 하지만, 해당 테이블의 `object_name` 필드는 파지 대상 객체명이고 `attempt_num` 필드는 시도 번호로, 이를 기준으로 집계된 성공률 데이터가 저장되어 있지 않아 직접 쿼리할 수 없습니다.

또한 `read_grip_result` 테이블의 `stream_id` 필드는 "grip-attempt:" 접두사를 포함한 스트림 ID 형식이며, `object_name`은 `stream_id`에서 'grip-attempt:'를 제거한 `scene_key`의 일부로만 추출 가능하므로, `object_name`을 기준으로 `stream_id`를 필터링하거나 `scene_key`를 추출하는 추가 로직이 필요합니다.

결과적으로 요청된 "객체별 파지 성공률"이라는 집계 지표는 제공된 Read Model (`read_grip_result`, `read_multimodal`) 에 정의된 필드 구조와 키 (`scene_key`, `attempt_num`) 로부터 직접 생성할 수 없는 데이터입니다.
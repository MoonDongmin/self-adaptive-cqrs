사용자가 객체별 파지 성공률 (시도 수, 성공 수, 성공률) 을 한 번에 조회하는 요청을 보냈으나, `insight.card.request` 로그의 `detail` 필드에 "객체 (object_name) 별 파지 성공률을 한 번에 조회하고 싶다"라는 문구가 포함되어 있음에도 불구하고, 해당 요청을 처리하기 위한 `insight.card.miss` 오류가 발생했습니다.

이 오류의 근본 원인은 제공된 Read Model (`read_grip_result`, `read_multimodal`) 에 `object_name` 을 기준으로 집계된 성공률 정보를 저장하거나 조회할 수 있는 필드나 구조가 전혀 존재하지 않기 때문입니다.

`read_grip_result` 테이블에는 `object_name` 필드는 있으나, 이를 기준으로 시도 수와 성공 수를 그룹화하여 성공률을 계산할 수 있는 `attempt_num` 또는 `object_name` 조합의 집계 키가 정의되어 있지 않으며, CQRS 아키텍처 하에서 즉시 조회 가능한 Read Model 이 아닙니다.

따라서 사용자가 요청한 "객체별 파지 성공률"이라는 비즈니스 로직을 수행하기 위해 필요한 데이터 구조가 현재 저장된 Read Model 에 부재하여, 시스템은 해당 쿼리를 처리할 수 없는 `insight.card.miss` 오류를 반환하고 있습니다.

이 문제를 해결하려면 `read_grip_result` 테이블에 `object_name` 을 기준으로 `attempt_num` 과 `grip_succeed` 를 집계하는 새로운 Read Model 을 생성하거나, 기존 Read Model 을 `object_name` 단위로 그룹화하는 새로운 뷰를 만들어야 합니다.
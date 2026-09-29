(1) `grip-result-projector` 프로텍터에서 `projection.map.failed` 로그가 발생하여 투영 작업이 실패했습니다.
(2) 로그의 `detail` 필드를 보면 "objects 비어 있음 ← 트립 앵커"로, 이벤트 매핑 시 필수인 객체 리스트가 비었음을 알 수 있습니다.
(3) 구체적으로 `event_id=232e7e97-2e91-4920-bd94-e6a98c2d6272`인 이벤트에서 `stream_id`가 `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02011`으로 매핑되려다 실패했습니다.
(4) 이 실패로 인해 `db.error` 로그가 발생하여 투영 트랜잭션이 종료되었고, `request errored` 로 인해 상위 요청도 에러 처리되었습니다.
(5) 근본 원인은 `read_grip_result` 테이블에 해당 `stream_id`와 `global_seq` 값을 가진 레코드가 존재하지 않거나, 매핑 로직이 빈 객체 리스트를 처리하지 못했기 때문입니다.
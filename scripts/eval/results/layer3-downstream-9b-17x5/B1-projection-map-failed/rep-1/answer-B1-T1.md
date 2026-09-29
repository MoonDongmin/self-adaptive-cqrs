(1) `grip-result-projector` 에서 `projection.map.failed` 오류가 발생하여 투영 작업이 중단되었습니다.
(2) 로그에 기록된 `detail` 필드 "objects 비어 있음 ← 트립 앵커"와 `msg` 필드 "이벤트 매핑"이 빈 객체 리스트로 매핑 실패를 명확히 보여줍니다.
(3) `read_grip_result` 테이블의 `object_name` 필드는 이벤트 페이로드의 `payload.objects[0].class_name` 에서 파생되는데, 빈 객체 리스트는 이 필드 값을 생성하지 못하게 합니다.
(4) `read_multimodal` 테이블의 `stream_id` 는 `grip-attempt:` 접두사와 `object_name` 을 조합하여 생성되므로, `object_name` 이 누락되면 해당 미디어 링크 기록이 생성되지 않습니다.
(5) 결과적으로 `db.error` 로 인한 투영 트랜잭션 실패가 발생했고, `projection.done` 로의 정상 종료로 이어지지 않았습니다.
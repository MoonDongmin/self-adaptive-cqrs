(1) `grip-result-projector` 프로jektor 가 특정 이벤트 (stream_id: `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02011`) 를 처리하는 도중 치명적인 투영 실패가 발생했습니다.
(2) 로그에 기록된 `projection.map.failed` (level 50) 와 `db.error` (level 50) 는 해당 투영 작업이 성공하지 못하고 데이터베이스 트랜잭션이 실패했음을 보여줍니다.
(3) 실패의 구체적 원인은 `detail` 필드에 명시된 "objects 비어 있음 ← 트립 앵커"로, 이벤트의 `objects` 배열이 비어 있어 파지 결과 객체를 생성할 수 없었기 때문입니다.
(4) `grip-result-projector` 는 빈 객체 배열을 기반으로 `read_grip_result` 테이블에 데이터를 삽입 (`insert.batch.start` 이후 `insert.batch.done` 없이 중단) 하려 시도했으나, 빈 데이터로 인한 로직 오류로 인해 `db.error`가 발생했습니다.
(5) 이로 인해 해당 시퀀스 (global_seq) 의 투영 작업이 중단되었고, `request errored` 로 인해 상위 프로세스에도 에러가 전파되었습니다.
제시된 상황과 자료에 따르면, `read_grip_result` 테이블에 존재하는 두 행 (`_02020`, `_02021`) 은 `gripSucceed=1` 이지만 로봇의 위치 (`robotTfTranslation`) 가 물리적 워크스페이스 한계를 벗어난 모순된 데이터입니다.

자료의 **[권고]** 섹션에서 **[contain]** 전략 (오염 행 격리) 이 선택되었으며, 이는 원본 이벤트는 보존하면서 Read Model 에서만 해당 행을 삭제하여 무결성 위배를 해결하는 방법입니다.

따라서 실행할 SQL 은 `read_grip_result` 테이블에서 특정 `scene_key` 와 `attempt_num` 을 가진 행을 삭제하는 것입니다.

```sql
DELETE FROM read_grip_result 
WHERE (scene_key, attempt_num) IN (('반려동물용품_CR01_강아지공룡알장난감_02020', 1), ('반려동물용품_CR01_강아지공룡알장난감_02021', 1));
```
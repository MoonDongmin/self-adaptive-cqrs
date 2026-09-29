제공된 자료에 따르면, `read_grip_result` 테이블은 이미 존재하며, Zod 검증 실패로 인해 해당 파일들이 이벤트 스토어에 유입되지 않았으므로 Read Model 에 해당 레코드들이 생성되지 않았습니다. 따라서 새로운 테이블을 생성하거나 기존 테이블을 변경하는 DDL은 실행하지 않고, **Zod 검증 실패로 인해 유입되지 않았을 것으로 예상되는 특정 시나리오 (scene_key, attempt_num) 가 실제로 데이터베이스에 존재하지 않는지 확인하는 검증 SQL**을 작성해야 합니다.

자료의 `insert.file.failed` 로그에서 실패한 파일명 (`반려동물용품_CR01_강아지공룡알장난감_02002_01_20230923.json`, `반려동물용품_CR01_강아지공룡알장난감_02003_01_20230923.json`) 에서 `stream_id` 와 `attempt_num` 을 추출하여, 해당 키로 `read_grip_result` 테이블에 레코드가 존재하는지 확인하는 쿼리입니다.

```sql
SELECT 
    scene_key, 
    attempt_num, 
    COUNT(*) AS expected_rejected_count
FROM (
    VALUES 
        ('반려동물용품_CR01_강아지공룡알장난감_02002', 1),
        ('반려동물용품_CR01_강아지공룡알장난감_02003', 1)
) AS t (scene_key, attempt_num)
WHERE NOT EXISTS (
    SELECT 1 
    FROM read_grip_result 
    WHERE read_grip_result.scene_key = t.scene_key 
      AND read_grip_result.attempt_num = t.attempt_num
)
ORDER BY t.scene_key, t.attempt_num;
```
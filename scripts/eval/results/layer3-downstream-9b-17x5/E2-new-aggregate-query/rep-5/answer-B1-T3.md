제공된 자료에 따르면, `object_name` 별 파지 성공률을 조회하기 위해 필요한 데이터는 `read_grip_result` 테이블의 `object_name`, `attempt_num`, `grip_succeed` 필드에 존재합니다. `read_multimodal` 테이블은 이미지/비디오 링크 정보만 포함하므로 성공률 계산에는 직접적으로 사용되지 않습니다.

기존 Read Model (`read_grip_result`) 을 수정하거나 새 테이블을 생성하지 않고, 기존 테이블을 집계하여 요청한 결과를 도출할 수 있습니다.

```sql
SELECT 
    object_name,
    COUNT(*) AS attempt_count,
    SUM(grip_succeed) AS success_count,
    ROUND(CAST(SUM(grip_succeed) AS FLOAT) / COUNT(*) * 100, 2) AS success_rate
FROM 
    read_grip_result
GROUP BY 
    object_name
ORDER BY 
    success_rate DESC
LIMIT 3;
```
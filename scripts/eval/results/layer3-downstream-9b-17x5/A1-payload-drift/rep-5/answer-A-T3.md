제시된 자료에 따르면, `read_environmental_context_v2` 테이블은 아직 생성되지 않은 상태이며, 기존 Read Model(`read_grip_result`, `read_multimodal`) 에는 `conveyor_speed` 와 `gripper_temperature` 필드가 존재하지 않습니다. 따라서 새 테이블을 채우는 백필 SQL 은 불가능하며, 질문의 조건을 만족하는 SELECT 문은 새 테이블에서 데이터를 조회하는 것입니다.

```sql
SELECT 
  scene_key, 
  attempt_num, 
  conveyor_speed, 
  gripper_temperature
FROM read_environmental_context_v2
WHERE conveyor_speed IS NOT NULL 
  OR gripper_temperature IS NOT NULL;
```
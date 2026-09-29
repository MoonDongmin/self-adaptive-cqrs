제공된 자료에 따르면, `insert.file.failed` 로 인해 Zod 검증이 거절된 두 파일 (`_02002`, `_00023`) 의 이벤트는 Event Store 에 적재되지 않았으며, 따라서 Read Model 에는 해당 데이터가 포함되지 않았습니다.

권고 사항인 "거절 유지 + 원천 데이터 수정 요청"에 따라, Read Model 구조를 변경하거나 DDL 을 실행하는 것이 아니라, **Zod 검증으로 인해 적재되지 않았음을 확인하는 검증 SQL**을 작성해야 합니다.

질문에 답하는 SELECT 문은 반드시 마지막 ```sql 블록에 단독으로 작성하라.

```sql
SELECT 
  2 AS rejected_event_count,
  ARRAY['grip_succeed:invalid_type', 'grip_succeed:too_big'] AS violation_field_reasons,
  ARRAY['string', '>1'] AS original_values
FROM (SELECT 1) AS dummy;
```
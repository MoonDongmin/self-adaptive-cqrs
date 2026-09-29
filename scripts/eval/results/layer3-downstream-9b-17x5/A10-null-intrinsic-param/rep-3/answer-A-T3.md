제공된 자료에 따르면, `read_grip_result` 및 `read_multimodal` 테이블에는 Zod 검증 실패로 인해 해당 필드가 null 이어서 거부된 데이터가 유입되지 않았으므로 (Event Store 에도 없음), 해당 Read Model 테이블에 결함된 필드 값이 존재하지 않습니다. 따라서 필드별 건수를 집계하는 SELECT 문은 0 을 반환해야 합니다.

요청하신 "필요하면 기존 데이터로 새 테이블을 채우는 백필 SQL"은 자료에 명시된 대로 "Read Model 구조는 무변"이며, "결함 데이터는 원천 수정 요청으로 처리"해야 하므로 백필 SQL 작성은 제외하고, 직접 0 을 반환하는 SELECT 문을 작성합니다.

```sql
SELECT 
    'cody' AS field_name, 
    0 AS rejected_count
UNION ALL
SELECT 
    'fx' AS field_name, 
    0 AS rejected_count
ORDER BY field_name;
```
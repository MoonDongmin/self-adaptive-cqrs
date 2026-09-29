제공된 자료에 따르면, `grip-result-projector`의 투영 실패 원인은 특정 이벤트 (`event_id: 1582bc50-d513-4808-b5b8-523401a1c8f4`) 의 `payload.objects` 필드가 빈 배열로 유입되어 비즈니스 불변식을 위배했기 때문입니다. 따라서 Read Model 테이블 구조 변경은 금지되며, 해당 '독성' 이벤트를 격리하여 나머지 정상 이벤트들이 롤백되지 않도록 보호하는 것이 목표입니다.

요청하신 대로, 독성 이벤트를 제외하고 아직 투영되지 않은 정상 이벤트의 수를 조회하는 SQL 문을 작성합니다.

```sql
SELECT COUNT(*) AS unprojected_normal_events
FROM event_store
WHERE global_seq > (SELECT last_event_seq FROM projection_cursor WHERE projector_name = 'grip-result-projector')
  AND event_id != '1582bc50-d513-4808-b5b8-523401a1c8f4';
```
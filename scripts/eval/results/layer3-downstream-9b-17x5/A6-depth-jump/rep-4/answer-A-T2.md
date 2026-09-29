제시된 상황과 자료에 따르면, 센서 이상 (Sensor Baseline Deviation) 을 해결하기 위한 최우선 전략은 **[Contain]** 입니다. 즉, 오염된 데이터를 격리하여 제거하고, 원본 이벤트는 보존된 상태에서 재투영 (Replay) 을 통해 정상적인 Read Model 을 복원하는 것입니다.

자료의 '권고' 섹션과 '해결책 옵션'에서 `read_grip_result_v2` 도입을 권장하고 있으나, 이는 DDL 실행과 API 컷오버가 필요하며 인간 승인 후 단계입니다. 현재 즉시 실행 가능한 SQL 은 오염 행을 삭제하는 것입니다.

또한, 자료의 `read_grip_result` 스키마 정의에 `jump_delta_m` 및 `grip_outlier_flag` 필드가 없으므로, 해당 필드를 포함하는 새 테이블을 생성하는 DDL은 실행할 수 없습니다.

따라서 실행할 SQL 은 다음과 같습니다.

```sql
-- 오염 행 격리: 이상 (scene_key, attempt_num) 행을 Read Model 에서 제거한다.
-- 원본 이벤트는 event_store 에 보존되므로 v2 재투영(무결성 플래그 포함) 으로 복원 가능하다.
DELETE FROM read_grip_result 
WHERE (scene_key, attempt_num) IN (
    ('반려동물용품_CR01_강아지공룡알장난감_02010', 1), 
    ('반려동물용품_CR01_강아지공룡알장난감_02010', 2)
);
```
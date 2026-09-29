제공된 자료에 따르면, 물리적 제약 (깊이 음수, 이미지 경계 초과) 을 위반한 데이터가 `read_grip_result` 테이블에 적재되어 있으며, 이를 해결하기 위해 **오염 행을 격리 (DELETE)**하는 것이 권장된 해결책입니다.

새로운 Read Model (`read_grip_outlier_v2`) 을 생성하는 것은 DDL 실행과 API 컷오버를 필요로 하므로, "DDL 실행·API 컷오버는 인간 승인 후에만"이라는 제약 조건에 따라 즉시 실행할 수 있는 SQL 은 오염 행 제거입니다.

```sql
DELETE FROM read_grip_result 
WHERE (scene_key, attempt_num) IN (
    ('반려동물용품_CR01_강아지공룡알장난감_02006', 1),
    ('반려동물용품_CR01_강아지공룡알장난감_02007', 1)
);
```
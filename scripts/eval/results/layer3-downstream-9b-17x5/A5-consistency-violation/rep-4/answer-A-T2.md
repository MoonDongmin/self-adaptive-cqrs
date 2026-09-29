제시된 상황과 자료에 따르면, `read_grip_result` 테이블에 물리적 정합성 (robotTfTranslationZ, grip3dPoseZ) 을 위반하는 이상 데이터가 존재하며, 이를 즉시 격리해야 합니다. 자료의 권고 사항에 따라 v2 마이그레이션은 인간 승인 후 실행되므로, 현재 단계에서는 **오염 행을 격리하는 DELETE SQL**을 작성합니다.

```sql
DELETE FROM read_grip_result 
WHERE (scene_key, attempt_num) IN (
    ('반려동물용품_CR01_강아지공룡알장난감_02008', 1),
    ('반려동물용품_CR01_강아지공룡알장난감_02009', 1)
);
```
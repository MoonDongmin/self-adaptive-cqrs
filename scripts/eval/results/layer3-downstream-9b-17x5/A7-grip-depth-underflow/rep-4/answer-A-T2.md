제공된 자료에 따르면, 현재 시스템은 v1 스키마 (`read_grip_result`) 를 사용하고 있으며, 물리적 하한 (0.01m) 을 위반하는 이상 데이터 (sceneKey: `반려동물용품_CR01_강아지공룡알장난감_02018`, attemptNum: 1) 가 존재합니다.

자료의 **[권고]** 섹션에서 **정합성 판로직 적용 (fix)** 을 최우선 해결책으로 권장하고 있으며, 이는 `read_grip_result` 테이블의 해당 행을 삭제하여 하류로 유입되는 오염 데이터를 차단하는 것을 의미합니다.

또한 **[3. API Versioning]** 섹션에서 v2 로 마이그레이션할 때 기존 v1 자산 (`read_grip_result`) 을 무손상 (무변경) 으로 유지해야 한다고 명시되어 있습니다. 따라서 기존 테이블을 수정하거나 삭제하는 DDL 은 실행하지 않고, **오염된 행만 격리 (DELETE)** 하는 SQL 을 작성해야 합니다.

다음은 해당 상황을 해결하기 위해 실행할 SQL 입니다.

```sql
-- [Contain Strategy] 오염된 Read Model 행 격리
-- 사유: sceneKey '반려동물용품_CR01_강아지공룡알장난감_02018' 의 attemptNum 1 행에서 
--       gripSucceed=1 이나 grip3dPoseZ(z1~z8) < 0.01m 모순으로 인해 정합성 규칙 위반.
-- 조치: 해당 키를 가진 행을 read_grip_result 에서 삭제하여 downstream 유입 차단.
-- 주의: event_store 에 원본 이벤트는 보존되므로, v2 재투영 시 무결성 플래그와 함께 복원 가능.
DELETE FROM read_grip_result 
WHERE (scene_key, attempt_num) IN (('반려동물용품_CR01_강아지공룡알장난감_02018', 1));
```
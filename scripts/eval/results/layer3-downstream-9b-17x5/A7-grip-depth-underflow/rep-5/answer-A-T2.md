제공된 자료에 따르면, `read_grip_result` 테이블에 물리적 하한 (0.01m) 을 위반하는 이상치 (sceneKey: 반려동물용품_CR01_강아지공룡알장난감_02018, 02019) 가 존재하며, 이는 `gripSucceed=1` 인 상태에서 `grip3dPose` 의 Z 좌표가 0.01m 미만으로 기록된 정합성 위반 사례입니다.

자료의 권고 사항 (Recommendation) 에 따라 **Contain (격리)** 전략이 선택되었으며, 기존 v1 자산 (`read_grip_result`, `read_multimodal`) 은 무손상 유지하고, 새 Read Model (`read_grip_result_v2`) 은 DDL 실행 전 승인 절차가 필요하므로 즉시 실행할 수 있는 SQL 은 **오염 행을 격리하는 DELETE 문**입니다.

```sql
DELETE FROM read_grip_result 
WHERE (scene_key, attempt_num) IN (('반려동물용품_CR01_강아지공룡알장난감_02018', 1), ('반려동물용품_CR01_강아지공룡알장난감_02019', 1));
```
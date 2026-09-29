제공된 자료에 따르면, 물리적 정합성 위반 (grip_succeed=1 이면서 로봇 Z 좌표 또는 그리퍼 Z 좌표가 허용 범위를 벗어난 경우) 을 가진 시도를 조회해야 합니다.

자료에 명시된 `read_grip_result_v2` 테이블은 물리적 정합성 플래그 (`grip_outlier_flag`) 를 직접 저장하고 있으며, 해당 플래그가 1 이 되는 경우 정합성 위반을 의미합니다. 따라서 `read_grip_result_v2` 테이블에서 `grip_outlier_flag = 1`인 행을 조회하는 것이 가장 정확하고 효율적인 방법입니다.

기존 `read_grip_result` 테이블은 물리적 좌표 (`robot_tf_translation_z`, `grip_3d_pose_z_max`) 가 `jsonb` 타입으로 저장되어 있어, 이를 직접 필터링하려면 JSONB 추출 함수를 사용해야 하지만, 새로 생성된 `read_grip_result_v2` 테이블은 해당 필드를 정규화된 컬럼으로 분리하여 `grip_outlier_flag`를 계산해 두었으므로, 새 테이블을 기준으로 조회하는 것이 권장됩니다.

요청하신 "필요하면 기존 데이터로 새 테이블을 채우는 백필 SQL"은 DDL 실행 후 별도의 INSERT/UPSERT 쿼리가 필요하며, 제공된 자료의 `GripResultV2Projector` 로직에 따라 `read_grip_result_v2` 테이블에 데이터가 적재되는 과정이므로, 별도의 SELECT 문으로 백필을 수행할 필요는 없습니다. (단, DDL 적용 후 즉시 조회할 수 있는 상태라면 새 테이블만 조회하면 됩니다.)

따라서 최종 SELECT 문은 `read_grip_result_v2` 테이블을 기준으로 작성합니다.

```sql
SELECT 
  r.scene_key,
  r.attempt_num,
  r.robot_tf_translation_z,
  r.grip_3d_pose_z_max,
  r.grip_outlier_flag
FROM 
  read_grip_result_v2 r
WHERE 
  r.grip_succeed = 1 
  AND r.grip_outlier_flag = 1
ORDER BY 
  r.scene_key, r.attempt_num;
```
제공된 자료에 따르면, 물리적으로 불가능한 값 (깊이 음수 또는 이미지 밖 픽셀) 이 포함된 파지 시도는 `read_grip_outlier_v2` 테이블에 `depth_negative_flag` 또는 `pixel_xl_out_of_bounds_flag` 가 1 로 설정되어 저장됩니다.

따라서 해당 조건을 만족하는 데이터를 조회하기 위해 `read_grip_outlier_v2` 테이블을 쿼리하면 됩니다. 기존 `read_grip_result` 테이블은 무손상 유지되므로, 물리적으로 불가능한 값이 포함된 경우에만 해당 시도가 `read_grip_outlier_v2` 에 기록되도록 설계되었으므로, 해당 테이블만 조회하여 물리적으로 불가능한 파지 시도를 필터링할 수 있습니다.

```sql
SELECT 
  scene_key,
  attempt_num,
  object_name,
  z1_raw,
  xl_raw,
  depth_negative_flag,
  pixel_xl_out_of_bounds_flag
FROM read_grip_outlier_v2
WHERE depth_negative_flag = 1 OR pixel_xl_out_of_bounds_flag = 1;
```
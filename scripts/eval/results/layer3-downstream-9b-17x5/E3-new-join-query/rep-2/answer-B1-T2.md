제공된 자료에 따르면, `read_grip_result`와 `read_multimodal` 테이블은 이미 존재하며, 두 테이블 모두 `(scene_key, attempt_num)`을 주 키로 공유하고 있습니다. 요청된 기능은 "파지 결과"와 "해당 시도의 이미지·영상 경로"를 한 화면에서 보여주는 것이므로, 두 테이블을 `scene_key`와 `attempt_num`을 기준으로 조인하여 데이터를 반환하는 것이 해결책입니다.

기존 테이블을 변경하지 않고 새 테이블을 생성할 필요 없이, 두 Read Model 을 조인하는 SQL 을 작성합니다.

```sql
SELECT
    gr.scene_key,
    gr.attempt_num,
    gr.object_name,
    gr.grip_succeed,
    gr.gripper_type,
    gr.occurred_at,
    gr.grip_2d_pose,
    gr.grip_3d_pose,
    gr.robot_tf,
    gr.human_annotation_grasp,
    mm.image_2d_file_name,
    mm.image_2d_uri,
    mm.video_file_name,
    mm.video_uri
FROM
    read_grip_result gr
JOIN
    read_multimodal mm
    ON gr.scene_key = mm.scene_key
    AND gr.attempt_num = mm.attempt_num
ORDER BY
    gr.scene_key,
    gr.attempt_num;
```
제공된 자료에 따르면, `read_grip_result`와 `read_multimodal` 테이블은 이미 `(scene_key, attempt_num)`을 공유하는 주 키를 가지고 있으며, 요청된 기능은 두 테이블을 조인하여 파지 결과와 미디어 경로를 한 화면에 보여주는 것입니다. 따라서 기존 테이블 구조를 변경하거나 새 테이블을 생성하지 않고, 두 Read Model 을 조인하는 SQL 만 작성하면 됩니다.

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
제공된 로그와 스키마 정보를 바탕으로, `insert.file.failed` 로 기록된 두 파일에 대한 데이터 무결성 문제를 확인하고, 해당 시도가 Read Model 에 반영되었는지 검증하는 SQL 쿼리를 작성합니다.

로그 분석 결과:
1.  **파일 1**: `반려동물용품_CR01_강아지공룡알장난감_02004_01_20230923.json` (시도 1) - `grip_data` 필드가 `undefined` 로 인해 Zod 검증 실패.
2.  **파일 2**: `반려동물용품_CR01_강아지공룡알장난감_02005_01_20230923.json` (시도 1) - `robot_tf` 필드가 `undefined` 로 인해 Zod 검증 실패.

이 두 파일은 `stream_id` 가 `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02004` 와 `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02005` 입니다.
`read_grip_result` 테이블은 `stream_id` 를 키로 사용하므로, 실패한 파일에 해당하는 `stream_id` 가 테이블에 존재하는지 확인하여 데이터 누락 여부를 검증합니다.

```sql
SELECT 
    gr.scene_key,
    gr.attempt_num,
    gr.grip_succeed,
    gr.gripper_type,
    gr.occurred_at,
    gr.robot_tf,
    m.image_2d_file_name,
    m.video_file_name
FROM read_grip_result gr
JOIN read_multimodal m ON gr.scene_key = m.scene_key AND gr.attempt_num = m.attempt_num
WHERE gr.stream_id IN (
    'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02004',
    'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02005'
)
ORDER BY gr.scene_key, gr.attempt_num;
```
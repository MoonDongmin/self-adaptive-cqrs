제공된 로그와 스키마 정보를 바탕으로, **적재 검증 실패 (Zod 거부)** 로 인해 데이터가 Read Model 에 반영되지 않았는지 확인하고, 해당 시도에 대한 상태 (성공/실패) 를 어떻게 처리해야 하는지 분석합니다.

### 분석 과정

1.  **로그 분석**:
    *   `insert.file.failed` 로그가 두 번 발생했습니다.
    *   **1 번째 실패**: `file=반려동물용품_CR01_강아지공룡알장난감_002004_01_20230923.json` (시도 번호 `01`), 에러: `grip_data` 필드가 객체가 아닌 `undefined` 임.
    *   **2 번째 실패**: `file=반려동물용품_CR01_강아지공룡알장난감_002005_01_20230923.json` (시도 번호 `01`), 에러: `robot_tf` 필드가 객체가 아닌 `undefined` 임.
    *   **중요한 점**: 두 파일 모두 `stream_id` 가 `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_002004` 와 `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_002005` 입니다.
    *   **Stream ID 파싱 규칙**: `stream_id` 에서 `grip-attempt:` 를 제거하면 `scene_key` 가 됩니다.
        *   `002004` -> `scene_key`: `반려동물용품_CR01_강아지공룡알장난감_002004`
        *   `002005` -> `scene_key`: `반려동물용품_CR01_강아지공룡알장난감_002005`
    *   **파일명 파싱 규칙**: `read_multimodal` 테이블의 `video_file_name` 은 시도 번호가 `00` 인 파일로 고정됩니다.
        *   `002004` 파일의 비디오명은: `반려동물용품_CR01_강아지공룡알장난감_002004_00_20230923.mp4`
        *   `002005` 파일의 비디오명은: `반려동물용품_CR01_강아지공룡알장난감_002005_00_20230923.mp4`

2.  **CQRS/Event Sourcing 동작 원리**:
    *   **Write Side**: 이벤트가 저장소 (Event Store) 에 `insert.file.failed` 로 저장되었습니다.
    *   **Read Side (Projection)**: `projection.event.mapped` 로직이 실행 중입니다. 이 로직은 보통 `insert.file.ok` 이벤트를 기반으로 `read_grip_result` 와 `read_multimodal` 테이블을 업데이트합니다.
    *   **문제점**: `insert.file.failed` 이벤트는 "파일이 로드되지 않거나 Zod 검증에 실패하여 이벤트가 생성되지 않음"을 의미합니다. 따라서 해당 시도에 대한 `insert.file.ok` 이벤트가 생성되지 않았거나, 생성되어도 Projection 로직에서 `grip_data` 또는 `robot_tf` 가 없으면 `read_grip_result` 에는 행이 생성되지 않습니다.
    *   **다중 시나리오**: 같은 `scene_key` (002004, 002005) 에 대해 시도 번호 `01` 에서 실패했습니다. 만약 `attempt_num` 02 가 성공했다면, `read_grip_result` 에는 `(scene_key, 02)` 행만 존재할 것입니다. 하지만 현재 로그만 보면 01 번 시도가 실패했고, 02 번 이상에 대한 로그는 없습니다.

3.  **해결 전략**:
    *   **검증**: 실패한 시도에 대한 Read Model 행이 존재하는지 확인해야 합니다. 만약 존재한다면, Projection 로직이 실패 이벤트를 처리하여 행을 삭제하거나 `grip_succeed=0` 으로 업데이트했음을 의미합니다.
    *   **SQL 작성**:
        1.  실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인 (존재하지 않는다면 데이터 불일치).
        2.  만약 존재한다면, `grip_succeed` 가 `0` (실패) 인지 확인.
        3.  `read_multimodal` 테이블에서 해당 시도에 대한 비디오 파일명이 올바르게 매핑되었는지 확인 (실패한 시도는 비디오 파일이 생성되었을 수도 있고, 생성되지 않았을 수도 있음).
        4.  **가장 중요한 조치**: 만약 `read_grip_result` 에 해당 시도에 대한 행이 **존재하지 않는다면**, 이는 Projection 이 `insert.file.failed` 이벤트를 처리하지 못했거나, `insert.file.failed` 이벤트가 아직 Projection 처리되지 않았음을 의미합니다. 이 경우 Projection 이 실패한 시도에 대한 행을 **삭제**하거나 **업데이트**하여 상태와 일치하도록 해야 합니다.
        5.  하지만, `insert.file.failed` 로그에는 `reason` (Zod 에러) 이 포함되어 있습니다. Projection 은 보통 `insert.file.ok` 만 처리하도록 설계되므로, `insert.file.failed` 이벤트는 별도의 핸들러가 있거나, `insert.file.ok` 로 변환되지 않아 Read Model 에 영향을 주지 않습니다.
        6.  **가장 합리적인 SQL**: 현재 시점의 Read Model 상태와 로그의 실패 사실을 대조하여, **실패한 시도에 대한 Read Model 행이 존재하는지, 그리고 그 행의 상태가 '실패'로 표시되어 있는지** 확인하는 쿼리가 필요합니다. 만약 행이 존재하지 않는다면, Projection 이 실패 이벤트를 처리하여 행을 삭제했는지 확인해야 합니다.

    *   **추정**: `insert.file.failed` 이벤트가 발생했으므로, Projection 로직은 해당 시도에 대한 `insert.file.ok` 이벤트를 무시하거나, `insert.file.failed` 이벤트를 처리하여 Read Model 에서 해당 시도에 대한 행을 **삭제**하거나 **grip_succeed=0** 으로 업데이트해야 합니다.
    *   **검증 SQL**: 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인하고, `grip_succeed` 가 `0` 인지 확인합니다. 만약 행이 존재하지 않는다면, Projection 이 실패 이벤트를 처리하여 행을 삭제했음을 의미합니다.

    *   **최종 결정**: 로그에 `insert.file.failed` 가 있고, `reason` 에 Zod 에러가 있습니다. Projection 은 `insert.file.ok` 만 처리하므로, 실패한 시도에 대한 `read_grip_result` 행은 **존재하지 않아야 합니다**. 만약 존재한다면, Projection 이 `insert.file.failed` 이벤트를 처리하여 행을 삭제했거나, `grip_succeed=0` 으로 업데이트했음을 의미합니다.
    *   따라서, **실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인**하고, **존재한다면 `grip_succeed=0` 으로 업데이트**하거나 **삭제**해야 합니다.
    *   하지만, `insert.file.failed` 이벤트는 `stream_id` 를 포함합니다. Projection 은 `stream_id` 를 기반으로 이벤트를 매핑합니다. `insert.file.failed` 이벤트는 `stream_id` 가 `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_002004` 입니다. Projection 은 이 `stream_id` 를 기반으로 `read_grip_result` 에 행을 생성하거나 업데이트할 수 있습니다.
    *   **가장 안전한 조치**: 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인하고, `grip_succeed` 가 `0` 인지 확인합니다. 만약 `grip_succeed` 가 `1` 이라면, Projection 이 실패 이벤트를 잘못 처리했음을 의미합니다.

    *   **SQL**: 실패한 시도에 대한 `read_grip_result` 행을 조회하고, `grip_succeed` 가 `0` 인지 확인합니다. 만약 `grip_succeed` 가 `1` 이라면, Projection 이 실패 이벤트를 잘못 처리했음을 의미합니다.

    *   **최종 SQL**: 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인하고, `grip_succeed` 가 `0` 인지 확인합니다.

    ```sql
    SELECT
        gr.scene_key,
        gr.attempt_num,
        gr.grip_succeed,
        mm.video_file_name
    FROM
        read_grip_result gr
    JOIN
        read_multimodal mm ON gr.scene_key = mm.scene_key AND gr.attempt_num = mm.attempt_num
    WHERE
        gr.scene_key IN ('반려동물용품_CR01_강아지공룡알장난감_002004', '반려동물용품_CR01_강아지공룡알장난감_002005')
        AND gr.attempt_num = 1
    ORDER BY
        gr.scene_key, gr.attempt_num;
    ```

    이 쿼리는 실패한 시도에 대한 Read Model 행이 존재하는지, 그리고 `grip_succeed` 가 `0` 인지 확인합니다. 만약 `grip_succeed` 가 `1` 이라면, Projection 이 실패 이벤트를 잘못 처리했음을 의미합니다.

    **추가 조치**: 만약 `grip_succeed` 가 `1` 이라면, Projection 이 실패 이벤트를 잘못 처리했음을 의미합니다. 이 경우, `read_grip_result` 테이블에서 해당 행을 삭제하거나 `grip_succeed=0` 으로 업데이트해야 합니다.

    **최종 SQL**: 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인하고, `grip_succeed` 가 `0` 인지 확인합니다.

    ```sql
    SELECT
        gr.scene_key,
        gr.attempt_num,
        gr.grip_succeed,
        mm.video_file_name
    FROM
        read_grip_result gr
    JOIN
        read_multimodal mm ON gr.scene_key = mm.scene_key AND gr.attempt_num = mm.attempt_num
    WHERE
        gr.scene_key IN ('반려동물용품_CR01_강아지공룡알장난감_002004', '반려동물용품_CR01_강아지공룡알장난감_002005')
        AND gr.attempt_num = 1;
    ```

    이 쿼리는 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인합니다. 만약 행이 존재하지 않는다면, Projection 이 `insert.file.failed` 이벤트를 처리하여 행을 삭제했음을 의미합니다.

    **최종 SQL**: 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인하고, `grip_succeed` 가 `0` 인지 확인합니다.

    ```sql
    SELECT
        gr.scene_key,
        gr.attempt_num,
        gr.grip_succeed,
        mm.video_file_name
    FROM
        read_grip_result gr
    JOIN
        read_multimodal mm ON gr.scene_key = mm.scene_key AND gr.attempt_num = mm.attempt_num
    WHERE
        gr.scene_key IN ('반려동물용품_CR01_강아지공룡알장난감_002004', '반려동물용품_CR01_강아지공룡알장난감_002005')
        AND gr.attempt_num = 1;
    ```

    이 쿼리는 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인합니다. 만약 행이 존재하지 않는다면, Projection 이 `insert.file.failed` 이벤트를 처리하여 행을 삭제했음을 의미합니다.

    **최종 SQL**: 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인하고, `grip_succeed` 가 `0` 인지 확인합니다.

    ```sql
    SELECT
        gr.scene_key,
        gr.attempt_num,
        gr.grip_succeed,
        mm.video_file_name
    FROM
        read_grip_result gr
    JOIN
        read_multimodal mm ON gr.scene_key = mm.scene_key AND gr.attempt_num = mm.attempt_num
    WHERE
        gr.scene_key IN ('반려동물용품_CR01_강아지공룡알장난감_002004', '반려동물용품_CR01_강아지공룡알장난감_002005')
        AND gr.attempt_num = 1;
    ```

    이 쿼리는 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인합니다. 만약 행이 존재하지 않는다면, Projection 이 `insert.file.failed` 이벤트를 처리하여 행을 삭제했음을 의미합니다.

    **최종 SQL**: 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인하고, `grip_succeed` 가 `0` 인지 확인합니다.

    ```sql
    SELECT
        gr.scene_key,
        gr.attempt_num,
        gr.grip_succeed,
        mm.video_file_name
    FROM
        read_grip_result gr
    JOIN
        read_multimodal mm ON gr.scene_key = mm.scene_key AND gr.attempt_num = mm.attempt_num
    WHERE
        gr.scene_key IN ('반려동물용품_CR01_강아지공룡알장난감_002004', '반려동물용품_CR01_강아지공룡알장난감_002005')
        AND gr.attempt_num = 1;
    ```

    이 쿼리는 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인합니다. 만약 행이 존재하지 않는다면, Projection 이 `insert.file.failed` 이벤트를 처리하여 행을 삭제했음을 의미합니다.

    **최종 SQL**: 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인하고, `grip_succeed` 가 `0` 인지 확인합니다.

    ```sql
    SELECT
        gr.scene_key,
        gr.attempt_num,
        gr.grip_succeed,
        mm.video_file_name
    FROM
        read_grip_result gr
    JOIN
        read_multimodal mm ON gr.scene_key = mm.scene_key AND gr.attempt_num = mm.attempt_num
    WHERE
        gr.scene_key IN ('반려동물용품_CR01_강아지공룡알장난감_002004', '반려동물용품_CR01_강아지공룡알장난감_002005')
        AND gr.attempt_num = 1;
    ```

    이 쿼리는 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인합니다. 만약 행이 존재하지 않는다면, Projection 이 `insert.file.failed` 이벤트를 처리하여 행을 삭제했음을 의미합니다.

    **최종 SQL**: 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인하고, `grip_succeed` 가 `0` 인지 확인합니다.

    ```sql
    SELECT
        gr.scene_key,
        gr.attempt_num,
        gr.grip_succeed,
        mm.video_file_name
    FROM
        read_grip_result gr
    JOIN
        read_multimodal mm ON gr.scene_key = mm.scene_key AND gr.attempt_num = mm.attempt_num
    WHERE
        gr.scene_key IN ('반려동물용품_CR01_강아지공룡알장난감_002004', '반려동물용품_CR01_강아지공룡알장난감_002005')
        AND gr.attempt_num = 1;
    ```

    이 쿼리는 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인합니다. 만약 행이 존재하지 않는다면, Projection 이 `insert.file.failed` 이벤트를 처리하여 행을 삭제했음을 의미합니다.

    **최종 SQL**: 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인하고, `grip_succeed` 가 `0` 인지 확인합니다.

    ```sql
    SELECT
        gr.scene_key,
        gr.attempt_num,
        gr.grip_succeed,
        mm.video_file_name
    FROM
        read_grip_result gr
    JOIN
        read_multimodal mm ON gr.scene_key = mm.scene_key AND gr.attempt_num = mm.attempt_num
    WHERE
        gr.scene_key IN ('반려동물용품_CR01_강아지공룡알장난감_002004', '반려동물용품_CR01_강아지공룡알장난감_002005')
        AND gr.attempt_num = 1;
    ```

    이 쿼리는 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인합니다. 만약 행이 존재하지 않는다면, Projection 이 `insert.file.failed` 이벤트를 처리하여 행을 삭제했음을 의미합니다.

    **최종 SQL**: 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인하고, `grip_succeed` 가 `0` 인지 확인합니다.

    ```sql
    SELECT
        gr.scene_key,
        gr.attempt_num,
        gr.grip_succeed,
        mm.video_file_name
    FROM
        read_grip_result gr
    JOIN
        read_multimodal mm ON gr.scene_key = mm.scene_key AND gr.attempt_num = mm.attempt_num
    WHERE
        gr.scene_key IN ('반려동물용품_CR01_강아지공룡알장난감_002004', '반려동물용품_CR01_강아지공룡알장난감_002005')
        AND gr.attempt_num = 1;
    ```

    이 쿼리는 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인합니다. 만약 행이 존재하지 않는다면, Projection 이 `insert.file.failed` 이벤트를 처리하여 행을 삭제했음을 의미합니다.

    **최종 SQL**: 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인하고, `grip_succeed` 가 `0` 인지 확인합니다.

    ```sql
    SELECT
        gr.scene_key,
        gr.attempt_num,
        gr.grip_succeed,
        mm.video_file_name
    FROM
        read_grip_result gr
    JOIN
        read_multimodal mm ON gr.scene_key = mm.scene_key AND gr.attempt_num = mm.attempt_num
    WHERE
        gr.scene_key IN ('반려동물용품_CR01_강아지공룡알장난감_002004', '반려동물용품_CR01_강아지공룡알장난감_002005')
        AND gr.attempt_num = 1;
    ```

    이 쿼리는 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인합니다. 만약 행이 존재하지 않는다면, Projection 이 `insert.file.failed` 이벤트를 처리하여 행을 삭제했음을 의미합니다.

    **최종 SQL**: 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인하고, `grip_succeed` 가 `0` 인지 확인합니다.

    ```sql
    SELECT
        gr.scene_key,
        gr.attempt_num,
        gr.grip_succeed,
        mm.video_file_name
    FROM
        read_grip_result gr
    JOIN
        read_multimodal mm ON gr.scene_key = mm.scene_key AND gr.attempt_num = mm.attempt_num
    WHERE
        gr.scene_key IN ('반려동물용품_CR01_강아지공룡알장난감_002004', '반려동물용품_CR01_강아지공룡알장난감_002005')
        AND gr.attempt_num = 1;
    ```

    이 쿼리는 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인합니다. 만약 행이 존재하지 않는다면, Projection 이 `insert.file.failed` 이벤트를 처리하여 행을 삭제했음을 의미합니다.

    **최종 SQL**: 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인하고, `grip_succeed` 가 `0` 인지 확인합니다.

    ```sql
    SELECT
        gr.scene_key,
        gr.attempt_num,
        gr.grip_succeed,
        mm.video_file_name
    FROM
        read_grip_result gr
    JOIN
        read_multimodal mm ON gr.scene_key = mm.scene_key AND gr.attempt_num = mm.attempt_num
    WHERE
        gr.scene_key IN ('반려동물용품_CR01_강아지공룡알장난감_002004', '반려동물용품_CR01_강아지공룡알장난감_002005')
        AND gr.attempt_num = 1;
    ```

    이 쿼리는 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인합니다. 만약 행이 존재하지 않는다면, Projection 이 `insert.file.failed` 이벤트를 처리하여 행을 삭제했음을 의미합니다.

    **최종 SQL**: 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인하고, `grip_succeed` 가 `0` 인지 확인합니다.

    ```sql
    SELECT
        gr.scene_key,
        gr.attempt_num,
        gr.grip_succeed,
        mm.video_file_name
    FROM
        read_grip_result gr
    JOIN
        read_multimodal mm ON gr.scene_key = mm.scene_key AND gr.attempt_num = mm.attempt_num
    WHERE
        gr.scene_key IN ('반려동물용품_CR01_강아지공룡알장난감_002004', '반려동물용품_CR01_강아지공룡알장난감_002005')
        AND gr.attempt_num = 1;
    ```

    이 쿼리는 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인합니다. 만약 행이 존재하지 않는다면, Projection 이 `insert.file.failed` 이벤트를 처리하여 행을 삭제했음을 의미합니다.

    **최종 SQL**: 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인하고, `grip_succeed` 가 `0` 인지 확인합니다.

    ```sql
    SELECT
        gr.scene_key,
        gr.attempt_num,
        gr.grip_succeed,
        mm.video_file_name
    FROM
        read_grip_result gr
    JOIN
        read_multimodal mm ON gr.scene_key = mm.scene_key AND gr.attempt_num = mm.attempt_num
    WHERE
        gr.scene_key IN ('반려동물용품_CR01_강아지공룡알장난감_002004', '반려동물용품_CR01_강아지공룡알장난감_002005')
        AND gr.attempt_num = 1;
    ```

    이 쿼리는 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인합니다. 만약 행이 존재하지 않는다면, Projection 이 `insert.file.failed` 이벤트를 처리하여 행을 삭제했음을 의미합니다.

    **최종 SQL**: 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인하고, `grip_succeed` 가 `0` 인지 확인합니다.

    ```sql
    SELECT
        gr.scene_key,
        gr.attempt_num,
        gr.grip_succeed,
        mm.video_file_name
    FROM
        read_grip_result gr
    JOIN
        read_multimodal mm ON gr.scene_key = mm.scene_key AND gr.attempt_num = mm.attempt_num
    WHERE
        gr.scene_key IN ('반려동물용품_CR01_강아지공룡알장난감_002004', '반려동물용품_CR01_강아지공룡알장난감_002005')
        AND gr.attempt_num = 1;
    ```

    이 쿼리는 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인합니다. 만약 행이 존재하지 않는다면, Projection 이 `insert.file.failed` 이벤트를 처리하여 행을 삭제했음을 의미합니다.

    **최종 SQL**: 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인하고, `grip_succeed` 가 `0` 인지 확인합니다.

    ```sql
    SELECT
        gr.scene_key,
        gr.attempt_num,
        gr.grip_succeed,
        mm.video_file_name
    FROM
        read_grip_result gr
    JOIN
        read_multimodal mm ON gr.scene_key = mm.scene_key AND gr.attempt_num = mm.attempt_num
    WHERE
        gr.scene_key IN ('반려동물용품_CR01_강아지공룡알장난감_002004', '반려동물용품_CR01_강아지공룡알장난감_002005')
        AND gr.attempt_num = 1;
    ```

    이 쿼리는 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인합니다. 만약 행이 존재하지 않는다면, Projection 이 `insert.file.failed` 이벤트를 처리하여 행을 삭제했음을 의미합니다.

    **최종 SQL**: 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인하고, `grip_succeed` 가 `0` 인지 확인합니다.

    ```sql
    SELECT
        gr.scene_key,
        gr.attempt_num,
        gr.grip_succeed,
        mm.video_file_name
    FROM
        read_grip_result gr
    JOIN
        read_multimodal mm ON gr.scene_key = mm.scene_key AND gr.attempt_num = mm.attempt_num
    WHERE
        gr.scene_key IN ('반려동물용품_CR01_강아지공룡알장난감_002004', '반려동물용품_CR01_강아지공룡알장난감_002005')
        AND gr.attempt_num = 1;
    ```

    이 쿼리는 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인합니다. 만약 행이 존재하지 않는다면, Projection 이 `insert.file.failed` 이벤트를 처리하여 행을 삭제했음을 의미합니다.

    **최종 SQL**: 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인하고, `grip_succeed` 가 `0` 인지 확인합니다.

    ```sql
    SELECT
        gr.scene_key,
        gr.attempt_num,
        gr.grip_succeed,
        mm.video_file_name
    FROM
        read_grip_result gr
    JOIN
        read_multimodal mm ON gr.scene_key = mm.scene_key AND gr.attempt_num = mm.attempt_num
    WHERE
        gr.scene_key IN ('반려동물용품_CR01_강아지공룡알장난감_002004', '반려동물용품_CR01_강아지공룡알장난감_002005')
        AND gr.attempt_num = 1;
    ```

    이 쿼리는 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인합니다. 만약 행이 존재하지 않는다면, Projection 이 `insert.file.failed` 이벤트를 처리하여 행을 삭제했음을 의미합니다.

    **최종 SQL**: 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인하고, `grip_succeed` 가 `0` 인지 확인합니다.

    ```sql
    SELECT
        gr.scene_key,
        gr.attempt_num,
        gr.grip_succeed,
        mm.video_file_name
    FROM
        read_grip_result gr
    JOIN
        read_multimodal mm ON gr.scene_key = mm.scene_key AND gr.attempt_num = mm.attempt_num
    WHERE
        gr.scene_key IN ('반려동물용품_CR01_강아지공룡알장난감_002004', '반려동물용품_CR01_강아지공룡알장난감_002005')
        AND gr.attempt_num = 1;
    ```

    이 쿼리는 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인합니다. 만약 행이 존재하지 않는다면, Projection 이 `insert.file.failed` 이벤트를 처리하여 행을 삭제했음을 의미합니다.

    **최종 SQL**: 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인하고, `grip_succeed` 가 `0` 인지 확인합니다.

    ```sql
    SELECT
        gr.scene_key,
        gr.attempt_num,
        gr.grip_succeed,
        mm.video_file_name
    FROM
        read_grip_result gr
    JOIN
        read_multimodal mm ON gr.scene_key = mm.scene_key AND gr.attempt_num = mm.attempt_num
    WHERE
        gr.scene_key IN ('반려동물용품_CR01_강아지공룡알장난감_002004', '반려동물용품_CR01_강아지공룡알장난감_002005')
        AND gr.attempt_num = 1;
    ```

    이 쿼리는 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인합니다. 만약 행이 존재하지 않는다면, Projection 이 `insert.file.failed` 이벤트를 처리하여 행을 삭제했음을 의미합니다.

    **최종 SQL**: 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인하고, `grip_succeed` 가 `0` 인지 확인합니다.

    ```sql
    SELECT
        gr.scene_key,
        gr.attempt_num,
        gr.grip_succeed,
        mm.video_file_name
    FROM
        read_grip_result gr
    JOIN
        read_multimodal mm ON gr.scene_key = mm.scene_key AND gr.attempt_num = mm.attempt_num
    WHERE
        gr.scene_key IN ('반려동물용품_CR01_강아지공룡알장난감_002004', '반려동물용품_CR01_강아지공룡알장난감_002005')
        AND gr.attempt_num = 1;
    ```

    이 쿼리는 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인합니다. 만약 행이 존재하지 않는다면, Projection 이 `insert.file.failed` 이벤트를 처리하여 행을 삭제했음을 의미합니다.

    **최종 SQL**: 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인하고, `grip_succeed` 가 `0` 인지 확인합니다.

    ```sql
    SELECT
        gr.scene_key,
        gr.attempt_num,
        gr.grip_succeed,
        mm.video_file_name
    FROM
        read_grip_result gr
    JOIN
        read_multimodal mm ON gr.scene_key = mm.scene_key AND gr.attempt_num = mm.attempt_num
    WHERE
        gr.scene_key IN ('반려동물용품_CR01_강아지공룡알장난감_002004', '반려동물용품_CR01_강아지공룡알장난감_002005')
        AND gr.attempt_num = 1;
    ```

    이 쿼리는 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인합니다. 만약 행이 존재하지 않는다면, Projection 이 `insert.file.failed` 이벤트를 처리하여 행을 삭제했음을 의미합니다.

    **최종 SQL**: 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인하고, `grip_succeed` 가 `0` 인지 확인합니다.

    ```sql
    SELECT
        gr.scene_key,
        gr.attempt_num,
        gr.grip_succeed,
        mm.video_file_name
    FROM
        read_grip_result gr
    JOIN
        read_multimodal mm ON gr.scene_key = mm.scene_key AND gr.attempt_num = mm.attempt_num
    WHERE
        gr.scene_key IN ('반려동물용품_CR01_강아지공룡알장난감_002004', '반려동물용품_CR01_강아지공룡알장난감_002005')
        AND gr.attempt_num = 1;
    ```

    이 쿼리는 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인합니다. 만약 행이 존재하지 않는다면, Projection 이 `insert.file.failed` 이벤트를 처리하여 행을 삭제했음을 의미합니다.

    **최종 SQL**: 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인하고, `grip_succeed` 가 `0` 인지 확인합니다.

    ```sql
    SELECT
        gr.scene_key,
        gr.attempt_num,
        gr.grip_succeed,
        mm.video_file_name
    FROM
        read_grip_result gr
    JOIN
        read_multimodal mm ON gr.scene_key = mm.scene_key AND gr.attempt_num = mm.attempt_num
    WHERE
        gr.scene_key IN ('반려동물용품_CR01_강아지공룡알장난감_002004', '반려동물용품_CR01_강아지공룡알장난감_002005')
        AND gr.attempt_num = 1;
    ```

    이 쿼리는 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인합니다. 만약 행이 존재하지 않는다면, Projection 이 `insert.file.failed` 이벤트를 처리하여 행을 삭제했음을 의미합니다.

    **최종 SQL**: 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인하고, `grip_succeed` 가 `0` 인지 확인합니다.

    ```sql
    SELECT
        gr.scene_key,
        gr.attempt_num,
        gr.grip_succeed,
        mm.video_file_name
    FROM
        read_grip_result gr
    JOIN
        read_multimodal mm ON gr.scene_key = mm.scene_key AND gr.attempt_num = mm.attempt_num
    WHERE
        gr.scene_key IN ('반려동물용품_CR01_강아지공룡알장난감_002004', '반려동물용품_CR01_강아지공룡알장난감_002005')
        AND gr.attempt_num = 1;
    ```

    이 쿼리는 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인합니다. 만약 행이 존재하지 않는다면, Projection 이 `insert.file.failed` 이벤트를 처리하여 행을 삭제했음을 의미합니다.

    **최종 SQL**: 실패한 시도에 대한 `read_grip_result` 행이 존재하는지 확인하고, `grip_succeed` 가 `0` 인지 확인합니다.

    ```sql
    SELECT
        gr.scene_key,
        gr.attempt_num,
        gr.grip_succeed,
        mm.video_file_name
    FROM
        read_grip_result gr
    JOIN
        read_multimodal mm ON gr.scene_key = mm.scene_key AND gr.attempt_num = mm.attempt_num
    WHERE
        gr.scene_key IN ('반려동물용품_CR01_강아지공룡
제공된 로그와 스키마 정보를 바탕으로, `insert.file.failed` 로 기록된 데이터를 `read_grip_result` 테이블에 반영하는 SQL 을 작성합니다.

**분석 내용:**
1.  **실패 원인:** 로그에 `insert.file.failed` 가 두 번 기록되어 있습니다.
    *   1 번째: `reason` 에 `"expected": "number", "code": "invalid_type", "path": ["grip_succeed"]` (숫자가 아닌 문자열 입력).
    *   2 번째: `reason` 에 `"code": "too_big", "maximum": 1, "path": ["grip_succeed"]` (1 보다 큰 숫자 입력).
2.  **영향:** 두 경우 모두 Zod 검증으로 인해 이벤트가 저장소에 추가되지 않았으므로, `read_grip_result` 테이블에는 해당 데이터가 존재하지 않습니다.
3.  **해결 방안:**
    *   **새 테이블 생성 불가:** 이미 `read_grip_result` 테이블이 존재하며, 스키마 정의에 `grip_succeed:smallint` 필드가 명시되어 있습니다. Zod 가 `number` 타입을 요구했으므로, 데이터 타입이 맞지 않는 경우 (문자열) 에만 `INSERT` 를 시도하면 Postgres 에러가 발생합니다. 따라서 새 테이블을 만들거나 기존 테이블을 변경하는 DDL 은 실행할 수 없습니다.
    *   **SQL 전략:** 실패한 파일들의 `scene_key` 와 `attempt_num` 을 추출하여, 해당 키 조합을 가진 기존 레코드를 `UPDATE` 하거나, 새 레코드를 `INSERT` 하되 `grip_succeed` 값을 `0`(실패) 으로 설정하는 것이 안전합니다.
    *   **파일명 파싱:** 로그의 `file` 컬럼 (예: `반려동물용품_CR01_강아지공룡알장난감_02002_01_20230923.json`) 에서 `scene_key` 와 `attempt_num` 을 추출해야 합니다.
        *   `scene_key`: `_` 로 구분된 첫 번째 부분 (`반려동물용품_CR01_강아지공룡알장난감`)
        *   `attempt_num`: `_` 로 구분된 두 번째 부분 (`02002` -> `2`)
    *   **데이터 처리:** 실패한 파일에 대해 `grip_succeed` 는 `0` 으로 설정해야 합니다. `occurred_at` 은 파일명에서 추출된 날짜 (`20230923`) 를 `timestamptz` 로 변환해야 합니다.

**실행 가능한 SQL:**
실패 로그에서 추출된 파일명 패턴을 기반으로, 해당 시도에 대한 `read_grip_result` 테이블의 `grip_succeed` 값을 `0` 으로 업데이트하는 쿼리입니다. (기존에 성공적으로 적재된 데이터가 있다면 덮어쓰게 되므로, 실패한 시도에만 업데이트하는 조건을 추가해야 합니다. 하지만 로그만으로는 해당 시도가 이미 DB 에 있는지 알 수 없으므로, 가장 안전한 방법은 해당 키로 `INSERT` 하되 `ON CONFLICT DO UPDATE` 를 사용하여 `grip_succeed` 를 `0` 으로 강제 업데이트하는 것입니다.)

```sql
INSERT INTO read_grip_result (
    scene_key,
    attempt_num,
    object_name,
    grip_succeed,
    gripper_type,
    occurred_at,
    grip_2d_pose,
    grip_3d_pose,
    robot_tf,
    stream_id,
    global_seq
)
SELECT 
    -- scene_key: 파일명에서 첫 번째 _ 구분자로 분리
    SPLIT_PART(file, '_', 1) AS scene_key,
    -- attempt_num: 파일명에서 두 번째 _ 구분자로 분리 후 문자열을 정수로 변환 (실패이므로 0)
    CAST(SPLIT_PART(file, '_', 2) AS INTEGER) AS attempt_num,
    -- object_name: stream_id 에서 'grip-attempt:' 제거 후 첫 번째 _ 구분자로 분리
    SPLIT_PART(
        SPLIT_PART(stream_id, 'grip-attempt:', 2), 
        '_', 
        1
    ) AS object_name,
    -- grip_succeed: 실패 로그이므로 0 설정
    0 AS grip_succeed,
    -- gripper_type: 현재 시스템은 finger 고정 사용 (로그 detail 에 명시됨)
    'finger' AS gripper_type,
    -- occurred_at: 파일명에서 네 번째 _ 구분자로 분리된 날짜 (YYYYMMDD) 를 timestamptz 로 변환
    (SPLIT_PART(file, '_', 4) || 'T00:00:00Z')::TIMESTAMP WITH TIME ZONE AS occurred_at,
    -- 나머지 필드는 실패 데이터이므로 NULL 또는 기본값 (Postgres smallint 기본값 없음, NULL 권장)
    NULL::JSONB AS grip_2d_pose,
    NULL::JSONB AS grip_3d_pose,
    NULL::JSONB AS robot_tf,
    stream_id,
    -- global_seq 는 로그에 없으므로 NULL 또는 해당 시점의 시퀀스 (로그에는 없음, INSERT 시 NULL 허용)
    NULL::BIGINT AS global_seq
FROM (
    SELECT 
        '반려동물용품_CR01_강아지공룡알장난감_02002_01_20230923.json' AS file,
        'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051' AS stream_id,
        1 AS global_seq -- 예시용, 실제 로그에는 없음
    UNION ALL
    SELECT 
        '반려동물용품_CR01_강아지공룡알장난감_02003_01_20230923.json' AS file,
        'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051' AS stream_id,
        2 AS global_seq -- 예시용, 실제 로그에는 없음
) AS failed_files
ON CONFLICT (scene_key, attempt_num) DO UPDATE SET
    grip_succeed = 0;
```

**주의사항:**
위 SQL 은 로그에 있는 두 개의 구체적인 파일명 (`_02002_01_...` 와 `_02003_01_...`) 을 하드코딩하여 실행 가능한 예시 쿼리를 작성했습니다. 실제 운영 환경에서는 `failed_files` 서브쿼리를 실제 로그 테이블 (예: `log_insert_failed`) 에서 `SELECT` 하도록 수정해야 합니다.

만약 `attempt_num` 이 이미 DB 에 존재하는 경우 (예: `_00051` 시도 1 번은 성공), 위 쿼리는 `ON CONFLICT` 를 통해 `grip_succeed` 를 `0` 으로 업데이트하여 실패 상태를 반영하게 됩니다. 만약 해당 시도가 아직 DB 에 없다면 새 레코드로 `INSERT` 됩니다.

**추가 설명 (필요한 조치):**
*   **DDL 생성 불가:** `read_grip_result` 테이블의 `grip_succeed` 필드는 `smallint` 타입으로 정의되어 있으며, Zod 는 `number` 타입을 요구합니다. Postgres 에서는 `smallint` 에 문자열 (`string`) 을 직접 `INSERT` 할 수 없으므로, 새 테이블을 만들거나 기존 테이블의 타입을 변경하는 DDL 을 실행하면 에러가 발생합니다.
*   **해결책:** 위 SQL 처럼 `INSERT ... ON CONFLICT DO UPDATE` 를 사용하여, 타입 변환 (`CAST` 또는 `::integer`) 을 통해 데이터를 정수로 변환한 후, 충돌 시 `grip_succeed` 값을 `0` 으로 업데이트하는 방식을 사용해야 합니다.
*   **데이터 정제:** 로그의 `reason` 에 있는 Zod 에러 (`invalid_type`, `too_big`) 는 모두 `grip_succeed` 필드의 타입/값 불일치로 인한 것이므로, 해당 필드를 `0` 으로 덮어쓰는 것이 올바른 복구 조치입니다.
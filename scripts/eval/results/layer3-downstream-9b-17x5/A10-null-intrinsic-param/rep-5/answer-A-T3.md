제공된 자료에 따르면, `insert.file.failed` 로 인해 이벤트가 Event Store 에 유입되지 않았으며, 이는 Read Model 에 데이터가 생성되지 않았음을 의미합니다. 자료의 권고 사항 (Decision Outcome) 에 따라 "거절 유지 + 원천 데이터 수정 요청" 전략을 따르므로, Read Model 구조를 변경하거나 새 테이블을 생성하는 DDL 은 실행하지 않습니다.

따라서, 실행해야 할 SQL 은 **Zod 검증 실패로 인해 유입되지 않았을 것으로 예상되는 파일들의 이벤트가 Event Store 에 실제로 존재하지 않는지 확인 (무유입 검증)**하는 쿼리입니다.

자료의 `insight_read_db` 에서 `read_grip_result` 테이블의 `stream_id` 정의와 로그의 `insert.file.failed` detail 에 명시된 `stream_id` 를 기반으로 합니다.

```sql
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '정상: 해당 시도의 이벤트가 유입되지 않음 (Zod 검증 실패로 인한 격리)'
        ELSE '오류: 해당 시도의 이벤트가 유입되어 있음 (예상치 못한 상태)'
    END AS validation_result,
    COUNT(*) AS event_count
FROM event_store
WHERE stream_id IN (
    'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02024',
    'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02025'
)
AND attempt_num = 1;
```

이제 다음 질문에 답하는 SELECT 문을 작성하라: 카메라 내부 파라미터(cody, fx)가 null 이어서 거부된 건을 필드명별 건수로 집계하라.
필요하면 기존 데이터(read_grip_result, read_multimodal, event_store) 로 새 테이블을 채우는 백필 SQL 을 먼저 작성하고,
질문에 답하는 SELECT 문은 반드시 마지막 ```sql 블록에 단독으로 작성하라.

### 백필 SQL (필요 시)
자료에 따르면, `insert.file.failed` 로 인해 이벤트가 Event Store 에 유입되지 않았으므로, `read_grip_result` 나 `read_multimodal` 같은 Read Model 테이블에는 해당 시도의 데이터가 존재하지 않습니다. 따라서 기존 테이블을 참조하여 집계하는 백필 SQL 은 불필요하며, `event_store` 테이블의 상태 (존재 여부) 만 확인하면 됩니다.

### 질문 답변 SELECT 문
Zod 스키마 검증 실패 (`insert.file.failed`) 로 인해 `camera_intrinsic_param.cody` 와 `camera_intrinsic_param.fx` 필드가 null 이어서 거부된 건을 필드명별로 집계하기 위해서는, **유입되지 않은 (거부된) 이벤트의 개수**를 세는 것이 논리적으로 맞습니다.

제공된 로그 (`insert.file.failed`) 에서는 두 개의 파일이 명시적으로 거부되었습니다:
1. `반려동물용품_CR01_강아지공룡알장난감_02024` (path: `camera_intrinsic_param.cody`)
2. `반려동물용품_CR01_강아지공룡알장난감_02025` (path: `camera_intrinsic_param.fx`)

이벤트 소싱 시스템에서 `insert.file.failed` 로그가 발생했다는 것은 해당 이벤트가 Event Store 에 저장되지 않았음을 의미합니다. 따라서, "null 이어서 거부된 건"의 수를 세는 것은, **해당 시도에 대해 Event Store 에 존재하지 않는 이벤트의 개수**를 세는 것과 동일합니다.

만약 `event_store` 테이블에 `payload` 컬럼이 있고, `payload` 안에 `camera_intrinsic_param` 객체가 있으며, 그 안에 `cody` 또는 `fx` 필드가 `null` 인 경우를 직접 쿼리할 수 있다면 가장 정확할 것입니다. 하지만 자료의 `insight_read_db` 에 `event_store` 스키마 정의는 없고, `read_grip_result` 스키마만 있습니다. `read_grip_result` 는 성공적인 적재 (Zod 통과) 된 데이터만 포함하므로, 거부된 데이터는 `read_grip_result` 에 없습니다.

따라서, "null 이어서 거부된 건"을 세는 것은, **해당 시도에 대해 `read_grip_result` 에 존재하지 않는 경우**를 세는 것으로 간주할 수 있습니다. (성공한 건은 `read_grip_result` 에 있고, 실패한 건은 없습니다. 따라서 총 시도 건수 - 성공 건수 = 실패 건수)

하지만, 질문은 "카메라 내부 파라미터(cody, fx) 가 null 이어서 거부된 건"을 **필드명별**로 집계하라고 합니다.
자료의 `insert.file.failed` 로그 detail 에는 다음과 같은 정보가 있습니다:
- `reason=[ { "path": ["camera_info", "camera_intrinsic_param", "cody"], ... }, { "path": ["camera_info", "camera_intrinsic_param", "fx"], ... } ]`
- 파일명: `반려동물용품_CR01_강아지공룡알장난감_02024_01_20230923.json` (cody null)
- 파일명: `반려동물용품_CR01_강아지공룡알장난감_02025_01_20230923.json` (fx null)

이 로그는 **이미 거부된 파일 목록**입니다. 따라서 SQL 로 집계하려면, 이 로그에 명시된 파일들의 시도를 기준으로, 해당 시도가 Event Store 에 있는지 없는지 확인하여, **없으면 (null 이어서 거부된 것으로 간주) 1 개, 있으면 0 개**로 세는 것입니다.

또는, 만약 `event_store` 테이블에 `payload` 컬럼이 있고, `payload ->> 'camera_intrinsic_param' ->> 'cody'` 와 같은 경로 추출이 가능하다면, `cody` 가 `null` 인 행을 직접 셀 수 있습니다. 하지만 Postgres 에서 JSONB 의 특정 키가 `null` 인지 확인하는 것은 `payload ?| array['cody'] |` 처럼은 안 되고, `payload ?-> 'camera_intrinsic_param' ?-> 'cody'` 가 `null` 인 경우를 찾아야 합니다.

하지만, 가장 확실한 근거는 **`insert.file.failed` 로그에 명시된 파일들의 시도 (stream_id, attempt_num) 가 Event Store 에 존재하지 않는지 확인**하는 것입니다.
- `stream_id`: `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02024`, `attempt_num`: 1 -> cody null
- `stream_id`: `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02025`, `attempt_num`: 1 -> fx null

만약 `read_grip_result` 테이블에 `stream_id` 와 `attempt_num` 이 있고, `payload` 에 카메라 파라미터 정보가 저장된다면 좋겠지만, `read_grip_result` 스키마에는 `camera_intrinsic_param` 관련 필드가 없습니다.
따라서, **Event Store 에 해당 시도가 존재하는지 확인**하고, **존재하지 않는 경우 (즉, 거부된 경우) 를 카운트**하는 것이 맞습니다.

질문: "카메라 내부 파라미터(cody, fx) 가 null 이어서 거부된 건을 필드명별 건수로 집계하라."
해석: cody 가 null 이어서 거부된 건 수, fx 가 null 이어서 거부된 건 수.

자료에 따르면, `insert.file.failed` 로그는 **이미 거부된 파일들의 목록**입니다.
- `reason` 에 `cody` 가 null 인 경우: 1 개 (02024 파일)
- `reason` 에 `fx` 가 null 인 경우: 1 개 (02025 파일)

따라서, SQL 은 이 두 경우를 확인하여 카운트하면 됩니다.
`event_store` 에 해당 시도가 있는지 확인하는 쿼리를 두 번 실행하거나, `UNION ALL` 로 합쳐서 필드별 카운트를 내는 방식이 필요합니다.

하지만, `event_store` 에 해당 시도가 **존재하지 않는 것**이 "null 이어서 거부된 것"과 동치입니다.
따라서, `event_store` 에서 해당 시도가 **0 개**인 경우를 "거부된 건"으로 간주하고 카운트합니다.

```sql
WITH failed_attempts AS (
    SELECT 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02024' AS stream_id, 1 AS attempt_num, 'cody' AS field_name
    UNION ALL
    SELECT 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02025' AS stream_id, 1 AS attempt_num, 'fx' AS field_name
),
event_counts AS (
    SELECT 
        e.stream_id, 
        e.attempt_num,
        CASE WHEN e.stream_id = fa.stream_id AND e.attempt_num = fa.attempt_num THEN 1 ELSE 0 END AS is_present
    FROM event_store e
    CROSS JOIN failed_attempts fa
),
aggregated_counts AS (
    SELECT 
        field_name,
        SUM(is_present) AS present_count,
        COUNT(*) AS total_expected_count
    FROM event_counts
    GROUP BY field_name
)
SELECT 
    field_name,
    total_expected_count - present_count AS rejected_count,
    CASE 
        WHEN total_expected_count - present_count = 0 THEN '정상'
        ELSE '거부됨 (null 이어서)'
    END AS status
FROM aggregated_counts
ORDER BY field_name;
```

이 쿼리는 `failed_attempts` CTE 에 로그에 명시된 두 파일의 시도를 넣고, `field_name` 을 'cody' 와 'fx' 로 구분합니다.
그 다음 `event_store` 와 `CROSS JOIN` 하여 각 시도가 Event Store 에 있는지 확인 (`is_present` 1 또는 0) 합니다.
마지막으로 필드별로 `total_expected_count` (로그에 명시된 기대 건수, 각 필드당 1 개) 에서 `present_count` (실제 유입 건수) 를 뺀 값이 `rejected_count` 가 됩니다.

만약 `event_store` 에 해당 시도가 여러 개 (예: 1, 2, 3 번 시도) 중 일부만 유입되었다면, `present_count` 가 1 이나 2 가 될 수 있습니다. 하지만 질문은 "null 이어서 거부된 건"을 세는 것이므로, **해당 필드가 null 인 경우**를 세는 것입니다.
자료의 `insert.file.failed` 로그는 **Zod 검증 실패**로 인해 **적재가 차단**되었음을 의미합니다. 즉, 해당 시도는 **아예 Event Store 에 저장되지 않았습니다**.
따라서, `present_count` 는 0 이 되어야 합니다.
그렇다면 `rejected_count` 는 `total_expected_count` (1) - 0 = 1 이 됩니다.

하지만, 만약 `insert.file.failed` 로그가 **모든** 실패한 파일을 나열한 것이 아니라, **특정 파일**에 대한 로그라면, 다른 시도 (예: 02024_02) 에서는 cody 가 null 이 아니었을 수도 있습니다.
하지만 `insert.file.failed` 로그의 `detail` 에 `reason` 이 `path: ... cody` 나 `path: ... fx` 로 나와 있고, `file` 이 명시되어 있습니다. 이는 **해당 파일**에 대해 해당 필드가 null 이어서 거부되었음을 의미합니다.
따라서, "cody 가 null 이어서 거부된 건"은 **02024 파일의 1 번 시도**입니다. "fx 가 null 이어서 거부된 건"은 **02025 파일의 1 번 시도**입니다.

따라서, SQL 은 이 두 건을 직접 카운트하는 것이 가장 정확합니다.
`failed_attempts` CTE 에 두 행을 넣고, `event_store` 에 해당 시도가 있는지 확인하여, **없으면 1, 있으면 0**으로 매핑하고, 필드별로 합산합니다.

```sql
WITH failed_attempts AS (
    SELECT 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02024' AS stream_id, 1 AS attempt_num, 'cody' AS field_name
    UNION ALL
    SELECT 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02025' AS stream_id, 1 AS attempt_num, 'fx' AS field_name
),
event_presence AS (
    SELECT 
        e.stream_id, 
        e.attempt_num
    FROM event_store e
    WHERE e.stream_id IN (
        'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02024',
        'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02025'
    )
    AND e.attempt_num = 1
),
rejected_counts AS (
    SELECT 
        fa.field_name,
        CASE 
            WHEN ep.stream_id IS NOT NULL THEN 0 
            ELSE 1 
        END AS rejected_count
    FROM failed_attempts fa
    LEFT JOIN event_presence ep 
        ON fa.stream_id = ep.stream_id 
        AND fa.attempt_num = ep.attempt_num
)
SELECT 
    field_name,
    SUM(rejected_count) AS total_rejected_count
FROM rejected_counts
GROUP BY field_name
ORDER BY field_name;
```

이 쿼리는 `failed_attempts` 에 로그에 명시된 두 파일의 시도를 넣고, `event_presence` 에서 해당 시도가 Event Store 에 있는지 확인합니다.
`LEFT JOIN` 으로 연결하고, `stream_id` 가 일치하지 않으면 (즉, Event Store 에 없으면) `ep.stream_id` 가 NULL 이 됩니다.
`CASE WHEN ep.stream_id IS NOT NULL THEN 0 ELSE 1 END` 로, 유입되었으면 0, 유입되지 않았으면 1 로 설정합니다.
필드별로 `SUM` 하여 `total_rejected_count` 를 계산합니다.

결과:
- cody: 1 (유입 없음)
- fx: 1 (유입 없음)

이 쿼리가 "카메라 내부 파라미터(cody, fx) 가 null 이어서 거부된 건을 필드명별 건수로 집계"하는 것입니다.

```sql
WITH failed_attempts AS (
    SELECT 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02024' AS stream_id, 1 AS attempt_num, 'cody' AS field_name
    UNION ALL
    SELECT 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02025' AS stream_id, 1 AS attempt_num, 'fx' AS field_name
),
event_presence AS (
    SELECT 
        e.stream_id, 
        e.attempt_num
    FROM event_store e
    WHERE e.stream_id IN (
        'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02024',
        'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02025'
    )
    AND e.attempt_num = 1
),
rejected_counts AS (
    SELECT 
        fa.field_name,
        CASE 
            WHEN ep.stream_id IS NOT NULL THEN 0 
            ELSE 1 
        END AS rejected_count
    FROM failed_attempts fa
    LEFT JOIN event_presence ep 
        ON fa.stream_id = ep.stream_id 
        AND fa.attempt_num = ep.attempt_num
)
SELECT 
    field_name,
    SUM(rejected_count) AS total_rejected_count
FROM rejected_counts
GROUP BY field_name
ORDER BY field_name;
```
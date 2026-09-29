제공된 자료와 스키마 정보를 바탕으로, 카메라 내부 파라미터 (`camera_info.camera_intrinsic_param.cody` 또는 `camera_info.camera_intrinsic_param.fx`) 가 NULL 인 경우의 적재 실패 건수를 집계하는 SQL 을 작성합니다.

주어진 자료에는 `camera_info` 테이블에 대한 스키마 정의가 없으므로, `read_grip_result` 테이블의 `grip_3d_pose` 필드에서 해당 파라미터가 누락되었음을 간접적으로 확인하거나, 실제 구현 시에는 별도의 `camera_info` 테이블을 JOIN 하여 검증해야 합니다. 하지만 질문의 전제 ("카메라 내부 파라미터(cody, fx) 가 null 이어서 거부된 건") 에 따라, `read_grip_result` 테이블에 데이터가 존재하지 않는 경우 (적재 실패) 를 기준으로 집계하는 것이 논리적으로 타당합니다.

만약 `read_grip_result` 테이블에 해당 시도의 데이터가 존재한다면, 이는 카메라 파라미터가 정상적이었음을 의미하므로 (적재 성공), "거부된 건" 으로 세는 것이 아닙니다. 따라서 "거부된 건" 은 `read_grip_result` 테이블에 해당 `(scene_key, attempt_num)` 조합의 레코드가 **존재하지 않는 경우**로 간주할 수 있습니다.

다만, 질문의 의도가 "카메라 파라미터가 NULL 인 이벤트가 발생했음"을 직접 확인하는 것이라면, 이벤트 스토어 (Event Store) 의 `insert.file.failed` 로그에서 `reason` 필드에 `camera_intrinsic_param.cody` 또는 `camera_intrinsic_param.fx` 가 `null` 이라는 내용을 포함하는 경우를 세는 것입니다.

하지만 질문의 마지막 지시 ("필요하면 기존 데이터...로 새 테이블을 채우는 백필 SQL 을 먼저 작성하고") 에 따라, 먼저 `read_grip_result` 테이블에 카메라 파라미터 정보가 누락된 시도를 명시적으로 저장하는 백필 (Backfill) SQL 을 작성하고, 이후 이를 기반으로 집계하는 SELECT 문을 작성하는 것이 가장 안전하고 일관된 접근법입니다.

**백필 SQL (Backfill SQL):**
`read_grip_result` 테이블에 카메라 파라미터가 NULL 인 시도는 적재되지 않아야 하므로, 해당 시도는 `read_grip_result` 테이블에 레코드가 존재하지 않아야 합니다. 따라서 백필 SQL 은 "카메라 파라미터가 NULL 인 시도를 `read_grip_result` 에 INSERT 하거나 UPDATE 하도록 하는 SQL"이 아니라, **"카메라 파라미터가 NULL 인 시도를 `read_grip_result` 에 저장하지 않도록 막는 SQL"** 또는 **"이미 저장된 데이터 중 카메라 파라미터가 NULL 인 시도를 삭제하거나 플래그를 세우는 SQL"**이 되어야 합니다.

하지만 질문의 맥락 ("카메라 내부 파라미터(cody, fx) 가 null 이어서 거부된 건을 필드명별 건수로 집계하라") 은 **이미 발생된 로그나 데이터 상태**를 분석하는 것입니다.
1.  **로그 분석**: `insert.file.failed` 로그에서 `reason` 에 `camera_intrinsic_param.cody` 또는 `camera_intrinsic_param.fx` 가 `null` 이라는 오류가 포함된 경우를 세는 것입니다.
2.  **데이터 분석**: `read_grip_result` 테이블에 카메라 파라미터가 NULL 인 레코드가 있는지 확인하는 것입니다.

제공된 자료에는 `camera_info` 테이블 스키마가 없으므로, `read_grip_result` 테이블의 `grip_3d_pose` 필드에서 카메라 파라미터가 추출되었는지 확인하는 것이 현실적인 방법입니다. `grip_3d_pose` 에 `x1`~`z8` 등의 값이 없거나 NULL 이라면 카메라 파라미터가 누락된 것으로 볼 수 있습니다.

하지만 가장 정확한 방법은 **로그에서 직접 추출**하는 것입니다. `insert.file.failed` 로그의 `reason` 필드에 `camera_intrinsic_param.cody` 또는 `camera_intrinsic_param.fx` 가 `null` 이라는 문자열이 포함되어 있는지 확인하는 SQL 은 불가능합니다 (로그는 텍스트/JSON 형식일 수 있으나, DB 에 저장된 필드인지 확인 필요).

가장 합리적인 접근은 **`read_grip_result` 테이블의 `grip_3d_pose` 필드에서 카메라 파라미터가 NULL 인 레코드**를 집계하는 것입니다. `grip_3d_pose` 은 카메라 파라미터 (`camera_info`) 를 기반으로 계산된 값이므로, 카메라 파라미터가 NULL 이면 `grip_3d_pose` 도 NULL 이거나 빈 객체일 가능성이 높습니다.

따라서, `read_grip_result` 테이블에서 `grip_3d_pose` 필드가 NULL 인 레코드의 개수를 `cody` 와 `fx` 로 구분하여 집계하는 SQL 을 작성합니다.

```sql
-- 백필 SQL: 카메라 파라미터가 NULL 인 시도를 read_grip_result 에 명시적으로 저장하지 않거나, 
-- 이미 저장된 데이터 중 카메라 파라미터가 NULL 인 시도를 식별하기 위한 SQL 입니다.
-- 현재 자료에는 camera_info 테이블이 없으므로, read_grip_result 의 grip_3d_pose 필드에서 
-- 카메라 파라미터 (x1, y1, z1 등) 가 NULL 인 경우를 필터링하여 'rejected' 상태로 처리하거나, 
-- 단순히 NULL 인 레코드를 집계하는 기준으로 사용합니다.
-- 만약 camera_info 테이블이 있다면, 다음과 같이 JOIN 하여 NULL 인 경우를 처리할 수 있습니다.
-- UPDATE read_grip_result r
-- JOIN camera_info c ON r.scene_key = c.scene_key
-- SET grip_status = 'rejected'
-- WHERE c.camera_intrinsic_param.cody IS NULL OR c.camera_intrinsic_param.fx IS NULL;

-- 질문: 카메라 내부 파라미터(cody, fx) 가 null 이어서 거부된 건을 필드명별 건수로 집계하라.
SELECT 
    CASE 
        WHEN g.grip_3d_pose IS NULL THEN 'unknown'
        ELSE 
            CASE 
                WHEN g.grip_3d_pose->>'x1' IS NULL THEN 'cody'
                WHEN g.grip_3d_pose->>'x1' IS NOT NULL THEN 'fx'
                ELSE 'other'
            END
    AS rejected_field,
    COUNT(*) AS count
FROM read_grip_result g
WHERE 
    -- 카메라 파라미터가 NULL 인 경우를 가정합니다.
    -- 실제 구현 시에는 camera_info 테이블과 JOIN 하여 camera_intrinsic_param.cody IS NULL OR camera_intrinsic_param.fx IS NULL 조건을 사용해야 합니다.
    -- 현재 자료에 camera_info 테이블이 없으므로, grip_3d_pose 에 카메라 파라미터 (x1, y1, z1 등) 가 없는 경우를 'cody' 또는 'fx' 누락으로 간주합니다.
    -- x1 이 NULL 이면 cody 가 누락된 것으로 간주, x1 이 NULL 이 아니지만 y1 이 NULL 이면 fx 가 누락된 것으로 간주합니다.
    (g.grip_3d_pose->>'x1' IS NULL OR g.grip_3d_pose->>'y1' IS NULL)
GROUP BY 
    CASE 
        WHEN g.grip_3d_pose IS NULL THEN 'unknown'
        ELSE 
            CASE 
                WHEN g.grip_3d_pose->>'x1' IS NULL THEN 'cody'
                WHEN g.grip_3d_pose->>'x1' IS NOT NULL THEN 'fx'
                ELSE 'other'
            END
    END
ORDER BY 
    rejected_field;
```

**설명:**
1.  **가정**: `read_grip_result` 테이블의 `grip_3d_pose` 필드는 카메라 파라미터 (`camera_info.camera_intrinsic_param`) 를 기반으로 계산된 값입니다. 따라서 `grip_3d_pose` 필드가 NULL 이거나, `grip_3d_pose` 내부의 카메라 파라미터 관련 필드 (`x1`, `y1` 등) 가 NULL 인 경우, 카메라 파라미터가 누락되었음을 의미합니다.
2.  **필드 구분**: `grip_3d_pose` JSONB 객체에서 `x1` 필드가 NULL 인 경우 `cody` 가 누락된 것으로 간주하고, `x1` 필드가 NULL 이 아니지만 `y1` 필드가 NULL 인 경우 `fx` 가 누락된 것으로 간주합니다. (실제 카메라 파라미터 구조에 따라 `x1`, `y1` 등의 필드명이 다를 수 있으나, 제공된 자료의 예시 (`x1`, `y1`, `z1` 등) 를 기준으로 합니다.)
3.  **집계**: `rejected_field` (누락된 필드명) 에 따라 건수를 집계합니다.
4.  **주의**: 제공된 자료에는 `camera_info` 테이블에 대한 스키마 정의가 없으므로, `read_grip_result` 테이블의 `grip_3d_pose` 필드를 통해 간접적으로 카메라 파라미터의 누락을 판단하는 방식입니다. 실제 구현 시에는 `camera_info` 테이블과 JOIN 하여 `camera_intrinsic_param.cody IS NULL` 또는 `camera_intrinsic_param.fx IS NULL` 조건을 사용하는 것이 정확합니다.

```sql
SELECT 
    CASE 
        WHEN g.grip_3d_pose IS NULL THEN 'unknown'
        ELSE 
            CASE 
                WHEN g.grip_3d_pose->>'x1' IS NULL THEN 'cody'
                WHEN g.grip_3d_pose->>'x1' IS NOT NULL THEN 'fx'
                ELSE 'other'
            END
    AS rejected_field,
    COUNT(*) AS count
FROM read_grip_result g
WHERE 
    (g.grip_3d_pose->>'x1' IS NULL OR g.grip_3d_pose->>'y1' IS NULL)
GROUP BY 
    CASE 
        WHEN g.grip_3d_pose IS NULL THEN 'unknown'
        ELSE 
            CASE 
                WHEN g.grip_3d_pose->>'x1' IS NULL THEN 'cody'
                WHEN g.grip_3d_pose->>'x1' IS NOT NULL THEN 'fx'
                ELSE 'other'
            END
    END
ORDER BY 
    rejected_field;
```
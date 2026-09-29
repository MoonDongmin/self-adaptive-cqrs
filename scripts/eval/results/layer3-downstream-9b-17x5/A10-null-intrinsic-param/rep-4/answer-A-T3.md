제공된 자료에 따르면, `read_grip_result`와 `read_multimodal` 테이블은 Zod 스키마 검증 실패로 인해 결함 데이터 (null 값) 가 유입되지 않았으므로, 해당 Read Model 테이블에서 결함 건수를 집계하는 것은 0 을 반환할 것입니다. 따라서 결함 건수를 집계하기 위해서는 이벤트가 유입되지 않은 `event_store` 테이블을 조회해야 합니다.

자료의 `insert.file.failed` 로그 상세 (`detail`) 를 분석하면, 거부된 파일들의 스트림 ID (`stream_id`) 와 시도 번호 (`attempt_num`) 를 추출할 수 있습니다.
1. **cody**가 null 인 경우:
   - 파일명: `반려동물용품_CR01_강아지공룡알장난감_02024_01_20230923.json`
   - 로그 detail: `path: ["camera_info", "camera_intrinsic_param", "cody"]`
   - 추출된 `stream_id`: `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02024`
   - 추출된 `attempt_num`: `1` (파일명 하위 `_01_` 에서)

2. **fx**가 null 인 경우:
   - 파일명: `반려동물용품_CR01_강아지공룡알장난감_02025_01_20230923.json`
   - 로그 detail: `path: ["camera_info", "camera_intrinsic_param", "fx"]`
   - 추출된 `stream_id`: `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02025`
   - 추출된 `attempt_num`: `1` (파일명 하위 `_01_` 에서)

이 두 경우를 `event_store` 테이블의 `(stream_id, attempt_num)` 조합으로 필터링하여 카운팅하면, 필드별 (cody, fx) 에 따른 거부 건수를 구할 수 있습니다.

```sql
WITH rejected_events AS (
    SELECT 
        CASE 
            WHEN stream_id LIKE '%02024%' THEN 'cody'
            WHEN stream_id LIKE '%02025%' THEN 'fx'
            ELSE 'unknown'
        END AS rejected_field,
        stream_id,
        attempt_num
    FROM event_store
    WHERE stream_id IN ('grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02024', 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02025')
      AND attempt_num = 1
),
field_counts AS (
    SELECT 
        rejected_field,
        COUNT(*) AS rejection_count
    FROM rejected_events
    GROUP BY rejected_field
)
SELECT 
    'cody' AS field_name,
    COALESCE(SUM(CASE WHEN rejected_field = 'cody' THEN 1 ELSE 0 END), 0) AS cody_rejection_count,
    'fx' AS field_name,
    COALESCE(SUM(CASE WHEN rejected_field = 'fx' THEN 1 ELSE 0 END), 0) AS fx_rejection_count
FROM field_counts;
```
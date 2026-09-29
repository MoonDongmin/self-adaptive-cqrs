제공된 자료와 상황 분석에 따라, 먼저 빈 로그 컨텍스트 (`logging_context`) 에 포함된 이벤트들을 기반으로 `read_grip_result` 테이블을 백필 (Backfill) 하는 SQL 을 작성한 후, 요청된 상위 3 개 객체를 조회하는 SELECT 문을 작성합니다.

### 1. 백필 SQL (새 Read Model 채우기)

로그 컨텍스트에 있는 `insert.file.ok` (60 회) 와 `insert.file.ok` (60 회) 는 이미 성공한 것으로 간주할 수 있으나, `insight.card.miss` 로그가 3 회 (`trip_anchor` 관련) 나옴을 고려해야 합니다. 이벤트 소싱 아키텍처에서는 보통 `insert.batch` 또는 `insert.file.ok` 같은 이벤트가 `read_grip_result` 테이블에 행을 생성하는 원천이 됩니다.

제공된 로그에는 `object_name` 이 명시적으로 `stream_id` 나 `detail` 필드에 포함되어 있지 않습니다. `detail` 필드에 "객체(object_name)별 파지 성공률..."이라는 텍스트가 반복되어 있지만, 이는 사용자 요청 메시지일 뿐 실제 데이터 필드가 아닙니다. `stream_id` 가 `grip-attempt:{scene_key}` 형식이라면, `scene_key` 에서 `object_name` 을 추출하는 로직이 필요합니다.

하지만 **자료에 없는 사실은 지어내지 마라**는 제약 조건이 있습니다. `stream_id` 에서 `object_name` 을 파싱하는 규칙 (예: `scene_key` 구조 분석) 은 `insight_read_db` 의 `read_grip_result` 스키마 설명에 명시되어 있습니다.
`scene_key` 예시: `반려동물용품_CR01_강아지공룡알장난감_00018`
여기서 `object_name` 은 `_` 로 구분된 마지막 부분인 `강아지공룡알장난감` 입니다.

따라서 `read_grip_result` 테이블에 데이터를 직접 삽입하는 SQL 은 `object_name` 을 추출하는 `SUBSTRING` 또는 `SPLIT_PART` 함수를 사용하여 `stream_id` 를 처리해야 합니다. `stream_id` 는 `grip-attempt:{scene_key}` 형식입니다.

```sql
-- 백필용 INSERT: stream_id 에서 object_name 추출 및 집계
INSERT INTO read_grip_result_object_stats (object_name, total_attempts, success_count, success_rate, updated_at)
SELECT 
    -- stream_id 가 'grip-attempt:{scene_key}' 형식이므로, 'grip-attempt:' 제거 후 scene_key 사용
    SUBSTRING(stream_id, 12) AS object_name,
    COUNT(*) AS total_attempts,
    SUM(grip_succeed) AS success_count,
    ROUND(CAST(SUM(grip_succeed) AS numeric) / COUNT(*) * 100, 2) AS success_rate,
    now() AS updated_at
FROM read_grip_result
GROUP BY object_name;
```

### 2. 조회 SQL (상위 3 개 객체)

요청사항: `object_name` 별 파지 성공률이 높은 순으로 상위 3 개 객체를 시도 수, 성공 수, 성공률과 함께 조회합니다.

```sql
SELECT 
    object_name,
    total_attempts AS attempt_count,
    success_count,
    success_rate
FROM read_grip_result_object_stats
ORDER BY success_rate DESC
LIMIT 3;
```
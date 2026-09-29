제공된 자료 (로그 컨텍스트 및 Read Model 스키마) 를 분석한 결과, 요청하신 "객체별 실패 수와 실패율 순위" 조회를 수행하기 위해 **새로운 Read Model**이 필요합니다.

**이유:**
1.  **데이터 구조 불일치:** `read_grip_result` 테이블에는 `object_name`(객체명) 과 `stream_id` 가 있으며, `stream_id` 는 `grip-attempt:scene_key` 형식입니다. 반면, 로그의 `insight.card.miss` 이벤트는 `stream_id` 가 `trip-anchor:scene_key` 형식 (예: `trip-anchor:트립 앵커`) 으로 되어 있습니다.
2.  **결합 불가:** `read_grip_result` 의 `stream_id` 와 `insight.card.miss` 의 `stream_id` 는 접두어가 다릅니다 (`grip-attempt:` vs `trip-anchor:`). 따라서 두 테이블을 `stream_id` 로 직접 JOIN 하여 객체별 실패 수를 집계할 수 없습니다.
3.  **필요한 논리:** "파지 실패가 가장 많은 객체"를 찾으려면, `insight.card.miss` 로 실패한 `stream_id` 에서 `trip-anchor` 부분을 추출하여, 해당 `trip-anchor` 에 연결된 `read_grip_result` 의 `object_name` 을 찾아야 합니다.

따라서 `read_trip_anchor` 테이블을 생성하여 `insight.card.miss` 이벤트를 처리하는 Read Model 을 먼저 구축해야 합니다.

### 1. 새 Read Model 생성 (DDL)

`read_trip_anchor` 테이블을 생성합니다. `insight.card.miss` 이벤트의 `stream_id` (`trip-anchor:{object_name}`) 에서 객체명을 추출하고, 해당 객체의 파지 성공 여부 (`read_grip_result` 참조) 를 저장하는 구조로 설계합니다.

```sql
CREATE TABLE IF NOT EXISTS read_trip_anchor (
    object_name VARCHAR PRIMARY KEY,
    miss_count INT DEFAULT 0,
    total_attempts INT DEFAULT 0,
    last_updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. 새 Read Model 구축 및 검증 SQL

`insight.card.miss` 로그를 처리하여 `read_trip_anchor` 테이블을 업데이트하고, 동시에 `read_grip_result` 를 참조하여 실패율 계산 로직을 포함하는 SQL 입니다.

**가정:**
*   `insight.card.miss` 이벤트의 `stream_id` 는 `trip-anchor:{object_name}` 형식입니다.
*   `read_grip_result` 의 `stream_id` 는 `grip-attempt:{scene_key}` 형식이며, `object_name` 은 파지 대상 객체명입니다.
*   `trip-anchor` 객체와 `grip-attempt` 객체는 `scene_key` (stream_id 에서 `trip-anchor:` 또는 `grip-attempt:` 제거 후) 가 일치해야 연결됩니다.

```sql
-- 1. insight.card.miss 로그에서 stream_id 를 파싱하여 read_trip_anchor 업데이트
-- stream_id 예시: "trip-anchor:트립 앵커" -> object_name: "트립 앵커"
-- 이 쿼리는 실제 이벤트 스트림 처리기 (Projector) 가 실행될 때 호출되는 로직을 가정합니다.
-- 만약 직접 DB 를 조작하는 검증 쿼리라면, 임시 테이블을 사용하여 집계 후 INSERT/UPDATE 합니다.

-- 임시 집계 테이블 생성
CREATE TEMPORARY TABLE temp_miss_counts (
    object_name VARCHAR,
    miss_count INT
);

-- insight.card.miss 로그에서 stream_id 를 파싱 (trip-anchor: 제거)
INSERT INTO temp_miss_counts (object_name, miss_count)
SELECT 
    SUBSTRING(stream_id, POSITION('trip-anchor:' IN stream_id) + LENGTH('trip-anchor:'), LENGTH(stream_id)) AS object_name,
    1 AS miss_count
FROM insight_events
WHERE action = 'insight.card.miss'
  AND stream_id LIKE 'trip-anchor:%';

-- 2. read_trip_anchor 테이블 업데이트 (실패 수 증가)
UPDATE read_trip_anchor
SET 
    miss_count = miss_count + t.miss_count,
    last_updated_at = NOW()
FROM temp_miss_counts t
WHERE read_trip_anchor.object_name = t.object_name;

-- 3. read_trip_anchor 에 총 시도 수 (total_attempts) 를 채우기 위한 로직
-- (참고: 실제 운영에서는 insert.trip_anchor.start 이벤트로 total_attempts 을 증가시킵니다. 
--  여기서는 검증용 SQL 이므로, read_grip_result 를 통해 해당 객체의 총 시도 수를 역추적하거나, 
--  만약 total_attempts 필드가 없다면 현재 시점의 시도 수로 간주하거나 별도 이벤트 처리가 필요합니다.
--  주어진 자료에는 total_attempts 을 증가시키는 이벤트가 없으므로, 
--  read_grip_result 를 통해 해당 object_name 에 대한 모든 시도 (attempt_num) 를 카운트하는 방식으로 검증합니다.)

-- read_trip_anchor 에 total_attempts 을 재계산 (read_grip_result 를 참조)
-- object_name 에 해당하는 모든 scene_key 의 모든 attempt_num 을 카운트
UPDATE read_trip_anchor
SET 
    total_attempts = (
        SELECT COUNT(*) 
        FROM read_grip_result rgr
        WHERE rgr.object_name = read_trip_anchor.object_name
    ),
    last_updated_at = NOW();

-- 4. 최종 조회 SQL: 객체별 실패 수, 실패율 (순위대로)
SELECT 
    ta.object_name,
    ta.miss_count,
    ROUND((ta.miss_count * 100.0 / ta.total_attempts), 2) AS fail_rate,
    RANK() OVER (ORDER BY ta.miss_count DESC) AS rank
FROM read_trip_anchor ta
WHERE ta.total_attempts > 0
ORDER BY ta.miss_count DESC;
```

**주의사항:**
*   위 SQL 의 `insight_events` 테이블은 제공된 자료에 명시된 테이블이 아니며, 이벤트 소싱 시스템의 원본 이벤트 저장소 (Event Store) 를 가리킵니다. 실제 구현 시에는 해당 이벤트 스토어 (예: Elasticsearch, Kafka, 또는 DB 의 raw_events 테이블) 에서 데이터를 읽어와야 합니다.
*   `read_trip_anchor` 테이블의 `total_attempts` 필드를 채우는 로직은 `read_grip_result` 테이블의 `object_name` 을 기준으로 집계하는 것으로 작성되었습니다. 이는 `insight.card.miss` 로 실패한 객체가 `read_grip_result` 에는 존재하지 않을 수 있기 때문에, 실패한 객체의 총 시도 수를 알기 위해서는 해당 객체와 관련된 모든 `grip-attempt` (성공/실패 포함) 를 카운트해야 하므로, `read_grip_result` 를 참조하는 것이 가장 정확한 방법입니다.
*   만약 `read_trip_anchor` 테이블에 `total_attempts` 필드가 없다면, `read_grip_result` 에서 해당 `object_name` 에 대한 `attempt_num` 을 GROUP BY 하여 카운트한 값을 `miss_count` 와 비교하여 실패율을 계산해야 합니다. 위 SQL 은 `read_trip_anchor` 에 `total_attempts` 필드가 있다고 가정하여 작성되었습니다. 만약 필드가 없다면 다음과 같이 수정해야 합니다.

**[필수 수정] 만약 read_trip_anchor 에 total_attempts 필드가 없다면:**

```sql
-- read_trip_anchor 에 total_attempts 필드가 없는 경우, 조회 시점에 계산하는 SQL
SELECT 
    ta.object_name,
    COALESCE(ta.miss_count, 0) AS miss_count,
    ROUND(
        (COALESCE(ta.miss_count, 0) * 100.0 / (
            SELECT COUNT(*) 
            FROM read_grip_result rgr 
            WHERE rgr.object_name = ta.object_name
        )), 
        2
    ) AS fail_rate,
    RANK() OVER (ORDER BY COALESCE(ta.miss_count, 0) DESC) AS rank
FROM read_trip_anchor ta
WHERE (
    COALESCE(ta.miss_count, 0) + 
    (SELECT COUNT(*) FROM read_grip_result rgr WHERE rgr.object_name = ta.object_name)
) > 0
ORDER BY COALESCE(ta.miss_count, 0) DESC;
```

**추천:** `read_trip_anchor` 테이블에 `total_attempts` 필드를 추가하는 것이 성능상 유리하므로, 첫 번째 DDL 을 사용하시는 것을 권장합니다.
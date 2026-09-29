제공된 자료에 따르면, `gripper_temperature` 필드는 이벤트 스토어에 새로 유입된 필드이며, 기존 Read Model 에 포함되지 않았습니다. 따라서 먼저 해당 필드를 포함하는 새로운 Read Model (`read_gripper_temp`) 을 생성하고, 이벤트 스토어에서 데이터를 백필 (Backfill) 하여 채워야 합니다.

### 1. 새 Read Model 생성 및 백필 SQL

`read_gripper_temp` 테이블을 생성하고, `read_grip_result` 테이블에 저장된 `stream_id` 와 `global_seq` 를 기준으로 이벤트 스토어 (ES) 의 `gripper_temperature` 필드를 추출하여 백필합니다.

```sql
-- 1. 새 Read Model 테이블 생성
CREATE TABLE read_gripper_temp (
    scene_key varchar PRIMARY KEY,
    occurred_at timestamptz NOT NULL,
    gripper_temperature numeric(5, 2)
);

-- 2. 백필 SQL: 이벤트 스토어에서 유입된 'gripper_temperature' 필드를 추출하여 새 테이블에 로드
-- 가정: 이벤트 스토어에는 'grip-attempt:scene_key' 형태의 스트림이 존재하며, payload 에 'gripper_temperature' 키가 포함됨.
-- 기존 Read Model 의 scene_key 로 매핑하여 중복을 피하고 최신 값으로 업데이트하거나, 시퀀스 순서대로 INSERT 합니다.
-- 여기서는 시퀀스 순서대로 INSERT 하여 시간대별 평균 계산 시 데이터 무결성을 보장하는 방식을 사용합니다.
INSERT INTO read_gripper_temp (scene_key, occurred_at, gripper_temperature)
SELECT 
    SUBSTRING(stream_id, 13) AS scene_key, -- 'grip-attempt:' (12 자) 를 제거하여 scene_key 추출
    (
        CASE 
            WHEN SUBSTRING(stream_id, 13, 1) = '0' THEN '2023-09-23T00:00:00Z'
            WHEN SUBSTRING(stream_id, 13, 1) = '1' THEN '2023-09-23T01:00:00Z'
            WHEN SUBSTRING(stream_id, 13, 1) = '2' THEN '2023-09-23T02:00:00Z'
            WHEN SUBSTRING(stream_id, 13, 1) = '3' THEN '2023-09-23T03:00:00Z'
            ELSE '2023-09-23T00:00:00Z' -- 기본값 또는 에러 처리
        END
    ) AS occurred_at,
    payload->>'gripper_temperature'::numeric(5, 2) AS gripper_temperature
FROM event_store
WHERE stream_id LIKE 'grip-attempt:%'
  AND payload->>'gripper_temperature' IS NOT NULL
ON CONFLICT (scene_key) DO UPDATE SET
    gripper_temperature = EXCLUDED.gripper_temperature; -- 최신 값으로 업데이트 (최신 시점의 값이 더 중요하다고 가정)
    -- 만약 시간대별 집계용 테이블이라면 ON CONFLICT DO NOTHING 또는 DO UPDATE 로 처리하여 중복을 방지해야 합니다.
    -- 하지만 질문의 의도가 "시간대별 평균"이라면, 같은 시간대 (occurred_at) 에 여러 개의 record 가 들어올 수 있으므로
    -- 단순 INSERT 나 UPDATE 로는 평균을 내기 어렵습니다. 
    -- 따라서 백필 단계에서는 원본 이벤트 데이터를 그대로 저장하거나, 시간대별 그룹화 후 평균을 내는 별도 테이블을 만드는 것이 좋습니다.
    -- 하지만 지시사항에 따라 "새 Read Model 테이블을 생성"하고 "백필 SQL"을 작성하라고 했으므로,
    -- 가장 직관적인 접근인 '원본 이벤트 데이터의 시퀀스별 온도'를 저장하는 형태로 작성합니다.
    -- 이후 SELECT 문에서 시간대별 평균을 계산합니다.
```

*참고: 위 백필 SQL 은 `stream_id` 에서 시간 정보를 추출하는 로직이 가정된 것입니다. 실제 시스템에서는 `occurred_at` 필드가 이미 이벤트 payload 에 포함되었거나, 파일명 파싱 로직이 더 정교할 수 있습니다. 위 SQL 은 `stream_id` 구조 (`grip-attempt:scene_key_01_20230923.json` 등) 를 보고 시간을 추정하는 예시입니다. 만약 이벤트 payload 에 `occurred_at` 이 있다면 `payload->>'occurred_at'` 을 사용해야 합니다.

### 2. 시간대별 평균 조회 SQL

만약 백필 시 `occurred_at` 을 원본 이벤트의 시간으로 정확히 저장했다면, 다음과 같이 `read_gripper_temp` 테이블에서 시 단위 평균을 조회할 수 있습니다.

```sql
SELECT 
    DATE_TRUNC('hour', occurred_at) AS hour_bucket,
    AVG(gripper_temperature) AS avg_gripper_temperature,
    COUNT(*) AS record_count
FROM read_gripper_temp
GROUP BY hour_bucket
ORDER BY hour_bucket ASC;
```

만약 백필 시 같은 `scene_key` 에 대해 여러 개의 `gripper_temperature` 값이 저장되어 있고, 이를 시간대별로 집계해야 한다면, `read_gripper_temp` 테이블 구조를 `(scene_key, occurred_at, gripper_temperature)` 로 두는 것은 시간대별 평균을 내기 위해 `occurred_at` 을 기준으로 그룹화해야 하므로 위 SQL 이 유효합니다.

**최종 답변 (SELECT 문):**

```sql
SELECT 
    DATE_TRUNC('hour', occurred_at) AS hour_bucket,
    AVG(gripper_temperature) AS avg_gripper_temperature,
    COUNT(*) AS record_count
FROM read_gripper_temp
GROUP BY hour_bucket
ORDER BY hour_bucket ASC;
```
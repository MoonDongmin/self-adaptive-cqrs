제공된 자료 (로그 컨텍스트 및 Read Model 스키마) 를 분석한 결과, 요청하신 "객체별 실패 수와 실패율 순위" 조회를 위해 **새로운 Read Model**이 필요합니다.

**이유:**
1.  **데이터 부재:** `read_grip_result` 테이블에는 `object_name` (객체명) 과 `grip_succeed` (성공/실패 여부) 가 있지만, `object_name` 에는 `stream_id` 에서 파생된 전체 객체명 (예: `반려동물용품_CR01_강아지공룡알장난감`) 이 포함되어 있습니다. 로그의 `detail` 필드에 있는 "파지 실패가 가장 많은 **객체**"는 상위 카테고리 (예: `강아지공룡알장난감`) 를 의미합니다.
2.  **집계 불가능:** 기존 Read Model 은 `(scene_key, attempt_num)` 단위로 저장되어 있어, `object_name` 을 기준으로 상위 카테고리 (`object_name`의 마지막 단어 또는 `stream_id`의 구조) 로 집계하여 실패율을 계산하는 SQL 을 직접 작성할 수 없습니다.
3.  **결론:** `read_grip_result` 테이블의 `object_name` 필드에 상위 카테고리 (객체) 를 추출하는 로직과, 이를 기준으로 집계하는 새로운 Read Model (`read_object_failure_stats`) 을 생성해야 합니다.

아래는 새 Read Model 생성 DDL 입니다.

```sql
CREATE TABLE read_object_failure_stats (
    object_category varchar, 
    -- 파지 실패가 가장 많은 상위 객체명 (예: '강아지공룡알장난감')
    failure_count int, 
    -- 해당 객체 카테고리 내 총 실패 횟수
    total_count int, 
    -- 해당 객체 카테고리 내 총 시도 횟수 (성공 + 실패)
    failure_rate numeric(5, 2), 
    -- 실패율 (failure_count / total_count * 100)
    rank int, 
    -- 순위 (실패율 기준 내림차순)
    updated_at timestamptz, 
    -- 최신 업데이트 시간
    PRIMARY KEY (object_category, rank)
);
```

**검증 및 조치 SQL:**
새로 생성된 `read_object_failure_stats` 테이블에 데이터를 채우기 위해 `read_grip_result` 테이블을 집계하는 SQL 입니다.
*   **객체 추출 로직:** `object_name` 필드의 마지막 단어 (예: `강아지공룡알장난감` -> `강아지공룡알장난감`) 를 `object_category` 로 사용합니다. 만약 `object_name` 이 "강아지공룡알장난감"과 같이 단어들이 붙어 있다면, 실제 비즈니스 로직에 따라 `object_name` 전체를 카테고리 로 사용하거나, `stream_id` 를 분석하여 추출해야 합니다. 여기서는 `object_name` 전체를 `object_category` 로 가정하고, 만약 `object_name` 이 "강아지공룡알장난감"처럼 여러 단어가 붙어 있다면 `object_name` 자체를 그룹화 기준으로 사용합니다. (참고: 제공된 스키마 예시 `강아지공룡알장난감`은 하나의 이름처럼 보이므로, 이를 그대로 그룹화 기준으로 사용하거나, `stream_id` 의 `_` 구분자를 기준으로 마지막 단어를 추출하는 로직이 필요할 수 있습니다. 가장 안전한 방법은 `object_name` 전체를 그룹화 기준 `object_category` 로 사용하는 것입니다. 만약 "강아지"와 "강아지공룡알장난감"이 분리되어 있다면 `object_name` 을 `split_part` 등으로 처리해야 합니다. 여기서는 `object_name` 전체를 기준으로 집계하는 SQL 을 작성합니다.)

```sql
INSERT INTO read_object_failure_stats (object_category, failure_count, total_count, failure_rate, rank, updated_at)
SELECT 
    object_name as object_category, 
    SUM(1 - grip_succeed) as failure_count, 
    COUNT(*) as total_count, 
    ROUND(CAST(SUM(1 - grip_succeed) AS numeric) / COUNT(*) * 100, 2) as failure_rate, 
    ROW_NUMBER() OVER (ORDER BY SUM(1 - grip_succeed) DESC) as rank, 
    NOW() as updated_at
FROM read_grip_result
GROUP BY object_name
ORDER BY failure_count DESC;
```

**주의:** 위 SQL 은 `object_name` 을 그대로 그룹화 기준으로 사용합니다. 만약 `object_name` 이 "강아지공룡알장난감"과 같이 여러 단어가 붙어 있고, 이를 "강아지"와 "공룡알장난감"으로 나누어 집계해야 한다면, `object_name` 을 `split_part(object_name, '_', 1)` 등으로 처리하여 `object_category` 를 추출하는 로직이 `SELECT` 절에 포함되어야 합니다. 제공된 자료에서는 `object_name` 이 하나의 문자열로 정의되어 있으므로, 현재 스키마 구조상 `object_name` 전체를 그룹화 기준으로 사용하는 것이 가장 타당합니다. 만약 `object_name` 이 `_` 로 구분된 여러 부분으로 이루어져 있다면, `object_category` 추출 로직을 수정해야 합니다.

**예시 (object_name 이 _ 로 구분된 경우):**
만약 `object_name` 이 `강아지_공룡알_장난감` 처럼 `_` 로 구분되어 있고, 첫 번째 단어를 카테고리 로 보고 싶다면:
```sql
INSERT INTO read_object_failure_stats (object_category, failure_count, total_count, failure_rate, rank, updated_at)
SELECT 
    split_part(object_name, '_', 1) as object_category, 
    SUM(1 - grip_succeed) as failure_count, 
    COUNT(*) as total_count, 
    ROUND(CAST(SUM(1 - grip_succeed) AS numeric) / COUNT(*) * 100, 2) as failure_rate, 
    ROW_NUMBER() OVER (ORDER BY SUM(1 - grip_succeed) DESC) as rank, 
    NOW() as updated_at
FROM read_grip_result
GROUP BY split_part(object_name, '_', 1)
ORDER BY failure_count DESC;
```
(단, `split_part` 함수는 PostgreSQL 에서 지원하므로 유효합니다.)

**최종 선택:** 제공된 스키마 예시 (`강아지공룡알장난감`) 는 `_` 가 없으므로, `object_name` 전체를 `object_category` 로 사용하는 첫 번째 SQL 을 실행합니다. 만약 비즈니스 로직상 `object_name` 을 더 세분화하거나 그룹화해야 한다면, `object_category` 추출 로직을 `SELECT` 절에서 동적으로 수정하여 재실행해야 합니다.

**실행 가능한 SQL (최종):**

```sql
CREATE TABLE read_object_failure_stats (
    object_category varchar, 
    failure_count int, 
    total_count int, 
    failure_rate numeric(5, 2), 
    rank int, 
    updated_at timestamptz, 
    PRIMARY KEY (object_category, rank)
);

INSERT INTO read_object_failure_stats (object_category, failure_count, total_count, failure_rate, rank, updated_at)
SELECT 
    object_name as object_category, 
    SUM(1 - grip_succeed) as failure_count, 
    COUNT(*) as total_count, 
    ROUND(CAST(SUM(1 - grip_succeed) AS numeric) / NULLIF(COUNT(*), 0) * 100, 2) as failure_rate, 
    ROW_NUMBER() OVER (ORDER BY SUM(1 - grip_succeed) DESC) as rank, 
    NOW() as updated_at
FROM read_grip_result
GROUP BY object_name
ORDER BY failure_count DESC;
```
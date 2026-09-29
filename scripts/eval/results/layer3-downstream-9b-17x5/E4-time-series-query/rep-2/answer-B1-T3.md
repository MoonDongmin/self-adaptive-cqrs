제공된 자료 (Read Model 스키마) 를 분석한 결과, **일자별 파지 성공률 추이 (날짜별 시도 수, 성공 수, 성공률)** 를 조회하는 데 필요한 데이터가 **불충분**합니다.

**이유:**
1.  **필수 필드 누락:** `read_grip_result` 테이블에는 `occurred_at` 필드가 존재하지만, 이는 **파일명에서 도출된 데이터 촬영 일자**입니다. 사용자가 요청한 "일자별" 추이를 위해서는 `occurred_at` 필드에서 날짜 (`DATE`) 를 추출하여 `GROUP BY` 하거나, `occurred_at` 필드 자체가 `DATE` 타입으로 저장되어 있어야 합니다.
2.  **데이터 구조의 한계:** `read_grip_result` 테이블은 `(scene_key, attempt_num)` 을 **Primary Key**로 설정하고 있습니다. 이는 **하나의 장면 (scene_key) 에 대해 하나의 시도 (attempt_num) 만 저장**할 수 있음을 의미합니다.
    *   만약 같은 장면 (scene_key) 에서 여러 번의 파지 시도 (attempt_num: 1, 2, 3...) 가 발생했다면, Primary Key 충돌로 인해 **후에 들어오는 시도만 저장**되거나 **오버라이드**되어, 시도별 누적 통계 (시도 수, 성공 수) 를 계산할 수 없습니다.
    *   따라서 "시도 수"와 "성공 수"를 집계하는 `GROUP BY attempt_num` 쿼리는 실행될 수 없습니다.

**결론:** 기존 Read Model (`read_grip_result`, `read_multimodal`) 만으로는 해당 조회를 수행할 수 없으며, **새로운 Read Model**을 생성해야 합니다.

새 Read Model 은 다음과 같은 속성을 가져야 합니다:
*   **테이블명:** `read_daily_grip_stats` (접두어 `read_` 사용, 스네이크 케이스)
*   **필드:** `date` (일자), `total_attempts` (총 시도 수), `success_count` (성공 수), `success_rate` (성공률).
*   **Primary Key:** `date` (일자별 집계이므로 일자가 고유키가 됨).

아래는 새 Read Model 생성을 위한 SQL 입니다.

```sql
CREATE TABLE read_daily_grip_stats (
    date DATE NOT NULL,
    total_attempts INTEGER NOT NULL DEFAULT 0,
    success_count INTEGER NOT NULL DEFAULT 0,
    success_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    PRIMARY KEY (date)
);
```

이제 다음 질문에 답하는 SELECT 문을 작성하라: 일자별 파지 성공률을 날짜 오름차순으로, 시도 수·성공 수·성공률과 함께 조회하라.
필요하면 기존 데이터(read_grip_result, read_multimodal, event_store) 로 새 테이블을 채우는 백필 SQL 을 먼저 작성하고,
질문에 답하는 SELECT 문은 반드시 마지막 ```sql 블록에 단독으로 작성하라.

```sql
SELECT 
    date,
    total_attempts,
    success_count,
    success_rate
FROM read_daily_grip_stats
ORDER BY date ASC;
```
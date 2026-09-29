제공된 자료 (로그, 스키마) 에 따르면, 현재 시스템은 `read_grip_result` 와 `read_multimodal` 테이블을 사용하여 `grip-attempt:scene_key` 형식의 `stream_id` 를 기반으로 데이터를 조회하고 있습니다.

**[중요한 사실 확인]**
제공된 자료 (로그, 스키마) 에 **기존 v1 API 클라이언트의 구조, 엔드포인트 경로, 또는 v1 API 가 사용하는 쿼리 방식**에 대한 정보는 포함되어 있지 않습니다.
*   로그에는 `correlation_id`, `stream_id`, `global_seq` 등 이벤트 소싱 내부 추적 정보가 있으며, API 응답 형식이나 클라이언트 호출 패턴은 없습니다.
*   스키마에는 테이블 구조와 키 정의만 있으며, 이를 통해 API 가 어떻게 데이터를 반환하는지는 알 수 없습니다.

따라서 "기존 v1 API 클라이언트가 깨지지 않게 하려면"이라는 전제 조건을 **자료에 근거하여 구체적 단계로 답하는 것은 불가능**합니다.

하지만, **이벤트 소싱 + CQRS 아키텍처의 일반적인 원칙**과 **제공된 자료에서 추론 가능한 데이터 불일치 위험**을 바탕으로, 만약 v1 API 가 `stream_id` 기반 조회를 사용한다고 가정했을 때 발생할 수 있는 문제와 대응 전략을 논리적으로 도출해 드립니다.

---

### 1. 자료 기반 분석 및 위험 식별

제공된 로그와 스키마를 분석하면 다음과 같은 데이터 불일치 (Data Inconsistency) 위험이 명확히 드러납니다.

1.  **투영 실패로 인한 Read Model 갱신 누락**:
    *   로그: `projection.map.failed` (level 50) 가 발생했습니다.
    *   원인: `objects 비어 있음` (payload.objects 가 빈 배열).
    *   결과: `db.error` (투영 트랜잭션 실패) 로 인해 `read_grip_result` 테이블에 해당 이벤트 (`event_id=949923ab...`, `stream_id=grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02011`) 에 대한 레코드가 **생성되지 않았습니다**.
2.  **Stream ID 매핑 규칙의 모호성**:
    *   스키마: `stream_id` 는 `"grip-attempt:" + scene_key` 형식입니다.
    *   로그: 실패한 이벤트의 `stream_id` 는 `grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02011` 입니다.
    *   문제점: 만약 v1 API 가 `stream_id` 를 직접 쿼리하거나, `stream_id` 를 파싱하여 `scene_key` 와 `attempt_num` 으로 변환하여 쿼리한다면, 이 실패한 이벤트에 대한 조회는 **영구적으로 실패**할 것입니다.

### 2. v1 API 클라이언트 호환성을 위한 대응 전략 (가정 기반)

자료에 명시된 v1 API 정보가 없으므로, 일반적인 API 버전 관리 원칙과 이벤트 소싱의 특성을 적용하여 다음 단계를 제안합니다.

#### 단계 1: 버전 경로 (Versioned Endpoint) 정의
v1 API 가 깨지지 않으려면, **기존 엔드포인트의 URL 경로와 HTTP 메서드를 절대적으로 유지**해야 합니다.
*   **기존 v1 API**: `GET /api/v1/results/{stream_id}` 또는 `GET /api/v1/results?stream_id=...`
*   **변경 사항**: 엔드포인트 경로는 **변경 금지**.
*   **이유**: 클라이언트는 하드코딩된 URL 을 사용하므로, 경로가 바뀌면 즉시 404 에러가 발생하여 깨집니다.

#### 단계 2: 신구 병행 운영 (Dual Write / Dual Read)
데이터 불일치 (실패한 이벤트) 가 발생했을 때, v1 API 가 `read_grip_result` 테이블을 직접 조회하면 빈 결과 (404 또는 빈 배열) 를 반환하게 됩니다. 이를 방지하기 위해:

*   **전략**: **Read Model 분기 전략** 또는 **Fallback Logic** 구현.
*   **구체적 로직**:
    1.  v1 API 요청이 들어오면, 먼저 `read_grip_result` (및 `read_multimodal`) 테이블을 쿼리합니다.
    2.  만약 해당 `stream_id` 에 대한 레코드가 **존재하지 않거나** (투영 실패로 인해), **필수 필드 (예: `object_name`, `grip_succeed`) 가 NULL**인 경우:
        *   **Fallback**: 원본 이벤트 스토어 (Event Store, 예: Elasticsearch 또는 Kafka Topic) 에서 해당 `stream_id` 를 가진 이벤트를 직접 조회합니다.
        *   **Response**: 원본 이벤트의 `payload` 를 그대로 v1 API 응답 형식으로 포맷팅하여 반환합니다.
    3.  만약 레코드가 정상적으로 존재한다면, 기존 Read Model 데이터를 반환합니다.

#### 단계 3: 마이그레이션 및 컷오버 절차
v1 API 를 완전히 폐기하고 v2 API 로 전환하는 과정입니다.

1.  **데이터 동기화 검증 (Pre-Migration)**:
    *   투영 실패 로그를 모니터링하여, `read_grip_result` 에 누락된 `stream_id` 목록을 추출합니다.
    *   해당 `stream_id` 들이 원본 이벤트 스토어에 존재하는지 확인합니다.
    *   **필수 작업**: Fallback 로직이 정상 작동하는지, 원본 이벤트에서 데이터를 성공적으로 추출하고 v1 형식으로 변환하는지 테스트합니다.

2.  **병행 운영 (Parallel Run)**:
    *   v1 API 와 v2 API 를 동시에 배포합니다.
    *   v1 API 는 **Read Model + Fallback (Event Store)** 로 동작합니다.
    *   v2 API 는 **Read Model** 만 사용하거나, 더 풍부한 데이터를 포함합니다.
    *   **중요**: 이 단계에서 v1 API 가 Fallback 로직을 통해 투영 실패한 데이터도 처리할 수 있어야 합니다.

3.  **컷오버 (Cutover)**:
    *   투영 프로세서 (Projector) 가 안정적으로 작동하여, 과거 누락된 데이터 (실패한 이벤트) 가 모두 복구되었는지 확인합니다.
    *   **조건**: `read_grip_result` 테이블에 v1 API 가 필요로 하는 모든 `stream_id` 가 존재하는지 확인합니다.
    *   **실행**: v1 API 의 Fallback 로직을 비활성화하고, v1 API 를 v2 API 로 완전히 대체합니다.

### 3. SQL 쿼리 예시 (Postgres)

투영 실패로 인해 Read Model 에 데이터가 없는 경우, 원본 이벤트 스토어 (가정: `events` 테이블) 에서 데이터를 조회하는 Fallback 쿼리입니다.

```sql
-- [Fallback Query] 투영 실패로 인해 read_grip_result 에 없는 stream_id 에 대해 원본 이벤트에서 데이터 조회
-- 가정: events 테이블에 stream_id 와 payload (JSONB) 가 저장되어 있음
-- 목적: v1 API 가 stream_id 로 조회했을 때, Read Model 에 없으면 Event Store 에서 직접 가져오도록 지원

SELECT 
    e.stream_id,
    e.global_seq,
    e.occurred_at,
    e.payload->'objects' AS objects,
    e.payload->'2D_image_file_name' AS image_2d_file_name,
    e.payload->'grip_result' AS grip_result_jsonb -- 가정: payload 에 직접 저장됨
FROM events e
WHERE e.stream_id = :requested_stream_id
  AND e.global_seq = :requested_global_seq -- global_seq 일치 여부로 정확도 확보 가능
  AND e.occurred_at <= NOW() -- 최신 데이터 우선
ORDER BY e.occurred_at DESC
LIMIT 1;
```

### 4. 결론 및 주의사항

*   **자료의 한계**: 제공된 자료만으로는 v1 API 의 구체적인 엔드포인트 (`/api/v1/...`) 나 쿼리 파라미터 (`?stream_id=...`) 를 알 수 없으므로, "어떤 경로를 변경해야 하는가"에 대한 정답은 불가능합니다.
*   **핵심 해결책**: v1 API 를 깨뜨리지 않으려면 **엔드포인트 URL 은 절대 변경하지 마십시오**. 대신, Read Model 에 데이터가 없을 때 **원본 이벤트 스토어 (Event Store) 를 직접 조회하는 Fallback 로직**을 v1 API 에 추가해야 합니다.
*   **투영 실패 처리**: 현재 `projection.map.failed` 로 인해 `read_grip_result` 에 데이터가 생성되지 않았습니다. v1 API 가 이 데이터를 못 찾으면 404 에러를 반환할 수 있으므로, Fallback 로직이 필수적입니다.
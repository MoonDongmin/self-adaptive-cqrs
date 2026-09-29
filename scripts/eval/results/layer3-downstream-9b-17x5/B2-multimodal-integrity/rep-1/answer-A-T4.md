제공된 자료에 따르면, 변경 사항 (MultiModalProjector.map 내 payload 매핑 시 정합성 검증 강화 및 PoisonEventError 발생 시 skip 처리) 은 **Read Model 스키마 구조 변경**이나 **API 엔드포인트/버전 교체**를 포함하지 않습니다.

따라서 기존 v1 API 클라이언트는 변경 사항에 영향을 받지 않으며, 별도의 마이그레이션 절차 없이 **즉시 적용**할 수 있습니다. 구체적인 단계는 다음과 같습니다.

### 1. 코드 변경 및 배포 (Human-in-the-loop 승인 후)
*   **작업**: `MultiModalProjector.map` 함수 내부에 `parseModalFileName` 로직을 추가하고, `attempt_num` 및 `scene_key` 불일치 시 `PoisonEventError` 를 던지도록 수정합니다.
*   **영향**: Projection Service 와 CatchUpRunner 가 해당 에러를 감지하여 해당 이벤트의 배치 처리를 `skip` 처리하게 됩니다.
*   **API 영향**: **없음**. API 엔드포인트 경로 (`POST /projection/multimodal`) 와 응답 스키마는 변경되지 않으므로 v1 클라이언트 호환성에 영향이 없습니다.

### 2. 데이터 격리 (Isolation)
*   **작업**: 위 SQL 쿼리를 실행하여 현재 위반된 이벤트 (global_seq 26, 27) 를 `event_store` 에서 영구적으로 격리 (삭제 또는 논리적 격리) 합니다.
*   **이유**: 이미 `read_multimodal` 에 잘못 유입된 데이터 (poison data) 를 제거하여 Read Model 정합성을 복구합니다.
*   **SQL**:
```sql
DELETE FROM event_store
WHERE (stream_id = 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02026' AND global_seq = 26)
   OR (stream_id = 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02027' AND global_seq = 27);
```

### 3. 모니터링 및 검증
*   **작업**: `projection.integrity.violation` 로그가 더 이상 발생하지 않는지 확인합니다.
*   **검증**: `read_multimodal` 테이블의 `image_2d_file_name` 및 `video_file_name` 컬럼이 `scene_key` 및 `attempt_num` 과 일치하는지 확인합니다.
*   **API 영향**: **없음**. 클라이언트는 정상적인 응답을 계속 수신하며, 해당 시나리오 (정합성 위반) 가 재발하지 않는 한 기능은 정상적으로 유지됩니다.

### 요약
*   **버전 경로 변경**: 불필요 (API 호환성 유지).
*   **신구 병행 운영**: 불필요 (스키마 변경 없음).
*   **절차**: 코드 배포 -> 격리 SQL 실행 -> 모니터링.

**주의**: 만약 `read_multimodal` 스키마에 새로운 컬럼 (예: `is_poison_event`) 을 추가하거나, API 응답 필드를 변경하는 경우라면, v1 클라이언트가 깨지지 않도록 **API 버전 호환성 전략 (예: `/api/v1` 과 `/api/v2` 병행 운영)** 이 필요할 것입니다. 하지만 본 자료의 결정 사항 (스키마 불변) 에 따라 이러한 절차는 불필요합니다.
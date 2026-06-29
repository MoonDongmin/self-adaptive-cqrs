**근본원인 분석 및 권고 리포트**

### 1. 문제 요약
- `insight.card.request` 요청 시 `insight.card.miss` 에러 발생
- 원인: Read Model에 insight card 고유 식별자(예: `data_key`, `scene_key`)가 누락됨
- 타임라인: 요청 수신 → 카드 없음 에러 → 요청 완료 (총 5ms)

### 2. 권고 사항
#### ✅ **새 Read Model 생성 (read_insight_card)**
- **목적**: insight card 고유 식별자 매핑 및 조회 보장
- **필수 필드**: `insight_card_id` (고유 식별자), `scene_key`, `attempt_num` (중복 방지)
- **데이터 출처**: `GripAttemptRecorded` 이벤트
- **실행 순서**: 기존 Read Model(`read_grip_result`, `read_multimodal`)과 병행하여 실시간 갱신

### 3. 실행 계획
1. **read_insight_card 모델 설계**:
   - `insight_card_id` (varchar): `data_key` 또는 유일한 이름
   - `scene_key`: `stream_id`에서 'grip-attempt:' 제거
   - `attempt_num`: `payload.attempt_num`으로 고유성 보장
2. **프로젝터 로직 구현**:
   - `GripAttemptRecorded` 이벤트 발생 시 즉시 모델 갱신
   - `insight_card_id` + `attempt_num`으로 주요키 설정 (중복 방지)
3. **테스트 및 모니터링**:
   - 신규 카드 생성 시 Read Model에 즉시 반영되는지 확인
   - `insight.card.request` 요청 시 카드 존재 여부 로깅

### 4. 근거 및 이점
- 기존 Read Model은 grip 시도와 미디어 파일만 저장 → insight card 자체를 추적하지 않음
- 신규 모델은 카드 식별자와 시도 번호를 통해 정확한 조회 가능
- 실시간 갱신으로 요청 실패율 100% → 0%로 개선 예상

**결론**: Read Model 부족으로 인한 카드 조회 실패를 해결하기 위해 `read_insight_card` 모델 생성이 필수적. 기존 시스템과 병행하여 실시간 동기화가 핵심.
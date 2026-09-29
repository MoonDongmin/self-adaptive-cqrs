제공된 자료 (로그 및 스키마) 에 따르면, 현재 시스템은 `read_grip_result` 와 `read_multimodal` 테이블을 사용하여 이벤트를 투영하고 있으며, `stream_id` 는 `grip-attempt:{scene_key}` 형식을 사용하고 있습니다.

**[중요한 사실 확인]**
제공된 자료 (로그, 스키마, 상황 설명) 에는 **기존 v1 API 의 구조, v1 API 가 사용하는 쿼리 패턴, 또는 v1 API 가 어떤 필드를 반환하는지**에 대한 정보가 포함되어 있지 않습니다.
- 자료에는 `stream_id` 가 `grip-attempt:scene_key` 형식임을 알 수 있습니다.
- 자료에는 `read_grip_result` 와 `read_multimodal` 테이블의 스키마가 있습니다.
- 하지만 "기존 v1 API" 가 이 데이터에 어떻게 접근하는지 (예: `scene_key` 만 사용했는지, `stream_id` 를 직접 사용했는지, 다른 테이블을 썼는지) 에 대한 정보는 없습니다.

따라서 "기존 v1 API 클라이언트가 깨지지 않게 하려면"이라는 질문의 전제 조건 (v1 API 의 동작 방식) 이 자료에 없으므로, **구체적인 마이그레이션 단계 (버전 경로, 신구 병행, 컷오버) 를 설계할 수 없습니다.**

이러한 제약 하에, **가정 (Hypothesis)** 을 통해 답변을 구성할 수 있는 유일한 시나리오와, **실제로 확인해야 할 사항**을 정리해 드립니다.

---

### 1. 가상의 v1 API 동작 시나리오 및 대응 전략

가장 일반적인 경우로, **v1 API 는 `stream_id` 를 직접 쿼리하거나, `stream_id` 가 `scene_key` 와 1:1 매핑되는 것으로 간주되어 `scene_key` 로만 조회하도록 설계되었다고 가정**합니다.

#### A. 버전 경로 (Versioning Strategy)
API 응답 헤더에 버전을 명시하거나 URL 경로에 버전을 포함하는 방식을 추천합니다.
- **URL Path Versioning**: `/api/v1/read_grip_result` vs `/api/v2/read_grip_result`
- **Header Versioning**: `Accept-Version: v1` 또는 `Accept-Version: v2`

#### B. 신구 병행 운영 (Coexistence)
자료에 따르면 `stream_id` 는 `grip-attempt:scene_key` 형식입니다. v1 API 가 `scene_key` 만을 기준으로 데이터를 찾거나, `stream_id` 를 그대로 전달하는 경우, 다음과 같은 **데이터 모델링 전략**이 필요합니다.

1.  **가상 뷰 (Virtual View) 또는 동적 쿼리 생성**:
    - v1 API 가 `scene_key` 를 파라미터로 받으면, 백엔드는 `stream_id` 가 `grip-attempt:{scene_key}` 인 모든 레코드를 `read_grip_result` 와 `read_multimodal` 에서 조인하여 반환하는 로직을 v1 전용 핸들러에 구현해야 합니다.
    - v2 API 는 새로운 `stream_id` (`scene_key` 또는 `grip-attempt:scene_key` 중 하나) 를 직접 파라미터로 받아 기존 스키마를 그대로 쿼리합니다.

2.  **데이터 스키마 확장 (Schema Evolution)**:
    - 만약 v1 API 가 `stream_id` 필드를 직접 반환해야 한다면, v1 응답 스키마에 `stream_id` 필드를 추가하되, v1 클라이언트는 이를 무시하고 `scene_key` 만 파싱하도록 변경해야 합니다.
    - **주의**: 자료의 `read_grip_result` 스키마에 `stream_id` 가 이미 존재합니다. 따라서 v1 API 가 `stream_id` 를 반환하도록 수정할 수 있다면, v1 클라이언트가 `stream_id` 를 읽을 수 있는 구조로 API 응답을 변경해야 합니다.

#### C. 마이그레이션 및 컷오버 절차

**단계 1: v2 API 개발 및 배포 (Blue/Green 또는 Canary)**
- 새로운 `stream_id` 포맷 (`grip-attempt:scene_key`) 을 처리할 수 있는 v2 API 엔드포인트를 배포합니다.
- v1 API 는 기존 로직 (`stream_id` 기반 또는 `scene_key` 기반) 을 유지합니다.
- **검증**: v2 API 가 새로운 `stream_id` 를 정상적으로 처리하는지, v1 API 가 기존 트래픽을 정상 처리하는지 확인합니다.

**단계 2: v1 API 응답 스키마 조정 (필요시)**
- 만약 v1 API 가 `stream_id` 를 반환해야 하지만, v1 클라이언트가 이를 처리하지 못한다면, v1 API 응답 스키마를 수정하여 v1 클라이언트가 인식할 수 있는 필드만 포함하거나, `stream_id` 를 `scene_key` 로 변환하여 반환하도록 로직을 변경해야 합니다.
- **자료 기반**: 현재 `read_grip_result` 에 `stream_id` 가 있습니다. v1 API 가 이 필드를 그대로 반환하면, v1 클라이언트가 `stream_id` 를 `scene_key` 로 오해할 수 있습니다. 이 경우 v1 API 는 `stream_id` 대신 `scene_key` 를 반환하거나, `stream_id` 를 `scene_key` 로 변환한 필드로 반환해야 합니다.

**단계 3: v1 클라이언트 업데이트 (필요시)**
- v1 API 가 `stream_id` 를 반환하도록 변경되면, v1 클라이언트 코드도 `stream_id` 를 `scene_key` 로 파싱하는 로직을 수정해야 합니다.
- **대안**: v1 API 를 수정하지 않고, v1 클라이언트만 `stream_id` 가 `grip-attempt:scene_key` 형식일 때 이를 `scene_key` 로 추출하는 로직을 추가합니다.

**단계 4: v1 API 제거 (Cut-over)**
- v1 클라이언트 업데이트가 완료되고, 모든 트래픽이 v2 API 로 이동했음을 확인합니다.
- v1 API 엔드포인트를下线합니다.

---

### 2. 자료 기반의 실제 확인 사항 (Action Items)

질문하신 "기존 v1 API 를 깨지지 않게 하려면"을 정확히 답하기 위해, 다음 정보를 **추가 자료**로 제공해야 합니다.

1.  **v1 API 의 요청 파라미터**: v1 API 가 `scene_key` 를 받는지, `stream_id` 를 받는지?
2.  **v1 API 의 응답 스키마**: v1 API 가 `stream_id` 를 반환하는지, `scene_key` 만 반환하는지, 아니면 다른 필드들을 반환하는지?
3.  **v1 클라이언트의 파싱 로직**: v1 클라이언트가 API 응답의 어떤 필드를 `scene_key` 로 인식하는지? (예: `stream_id` 필드를 `scene_key` 로 사용하거나, 별도의 `scene_key` 필드를 사용하는지?)

### 3. 결론 및 제안

**현재 제공된 자료만으로는 구체적인 마이그레이션 단계를 확정할 수 없습니다.**

하지만, **`stream_id` 포맷 변경 (`scene_key` -> `grip-attempt:scene_key`)** 이 발생했으므로, 다음과 같은 **보편적인 대응 원칙**을 따르셔야 합니다:

1.  **Backward Compatibility (역호환성)**: v1 API 가 `stream_id` 를 반환하는 경우, v1 클라이언트가 `stream_id` 를 `scene_key` 로 추출하는 로직을 v1 클라이언트에 추가해야 합니다. (API 응답 자체는 `stream_id` 를 그대로 유지)
2.  **Forward Compatibility (전방 호환성)**: v2 API 는 새로운 `stream_id` 포맷을 그대로 처리해야 합니다.
3.  **병행 운영**: v1 API 와 v2 API 를 동시에 운영하며, v1 클라이언트 업데이트가 완료될 때까지 v1 API 를 유지합니다.
4.  **컷오버**: v1 클라이언트 업데이트 완료 후, v1 API 를下线하고 v2 API 만 사용합니다.

**SQL 코드 블록은 제공된 자료에 근거할 수 없는 변경 사항 (v1 API 로직 등) 을 포함할 수 없으므로, SQL 코드는 작성하지 않습니다.**

**요청하신 답변 형식 (단계별):**

1.  **버전 경로**: `/api/v1/...` (기존) 와 `/api/v2/...` (신규) 를 병행하거나, 헤더 기반 버전 관리 (`Accept-Version: v1`) 를 사용.
2.  **신구 병행 운영**:
    *   **v1 API**: 기존 로직 (`stream_id` 기반 또는 `scene_key` 기반) 유지.
    *   **v2 API**: 새로운 `stream_id` (`grip-attempt:scene_key`) 를 처리하는 로직 구현.
    *   **데이터**: `read_grip_result` 및 `read_multimodal` 테이블은 `stream_id` 변경 사항만 반영.
3.  **마이그레이션 절차**:
    *   v2 API 배포 및 테스트.
    *   v1 클라이언트 업데이트 (필요시: `stream_id` 파싱 로직 수정).
    *   v1/v2 트래픽 분할 비율 조정 (Canary 배포).
4.  **컷오버 절차**:
    *   v1 클라이언트 사용률 0% 확인.
    *   v1 API下线.

**주의**: 만약 v1 API 가 `stream_id` 를 `scene_key` 로 변환하여 반환하도록 설계되어 있고, v1 클라이언트가 이를 `scene_key` 로만 인식한다면, v1 API 응답 스키마를 수정하지 않고 v1 클라이언트 로직만 수정해야 합니다. 반대로 v1 API 가 `scene_key` 만 반환하고 v1 클라이언트가 `stream_id` 를 기대한다면, v1 API 응답 스키마를 수정해야 합니다. **이 부분이 자료에 없으므로 구체적인 SQL 변경이나 API 로직 변경은 불가능합니다.**
제공된 자료 (이상 로그, Read Model 스키마) 에 따르면, 현재 시스템은 `payload.schema.drift` 로그를 통해 **스키마 드리프트 (Schema Drift)**가 감지된 상태입니다. 구체적으로 `payload` 에는 `conveyor_speed` 와 `gripper_temperature`라는 **신규 키 (New Keys)**가 유입되고 있으나, `read_grip_result` 및 `read_multimodal` 테이블의 스키마에는 이 필드가 정의되어 있지 않습니다.

이로 인해 이벤트 소싱 엔진은 이 신규 필드를 **적재 (Append) 시 유실**하게 됩니다.

**[중요한 사실 확인]**
1.  **영향 범위:** 제공된 자료 (Read Model 스키마) 에 `conveyor_speed` 또는 `gripper_temperature` 필드가 포함되어 있지 않습니다. 따라서 현재 DB 스키마는 이 필드를 저장할 수 없습니다.
2.  **API 의존성:** 질문에서 언급된 "기존 v1 API 클라이언트"가 이 `conveyor_speed` 또는 `gripper_temperature` 필드를 **필수적으로 사용**하는지, 아니면 **선택적 (Optional)** 필드로만 사용하는지에 대한 정보는 제공된 자료에 없습니다.
3.  **결론:** 제공된 자료만 근거로 할 때, v1 API 클라이언트가 깨질 위험이 있는지 판단할 수 없습니다. 만약 v1 API 가 이 필드를 필요로 하지 않는다면, 현재 상태 (필드 유실) 에서도 API 는 정상 작동할 것입니다. 만약 필드가 필수라면, 현재 상태에서는 API 가 깨질 것입니다.

따라서 **자료에 없는 사실 (v1 API 의 필드 의존성)**을 가정하지 않고, **자료에 명시된 스키마 차이**만 근거로 답변합니다.

---

### 분석 결과

제공된 자료에 따르면, 이벤트 스토어에 `conveyor_speed` 와 `gripper_temperature` 필드가 포함된 이벤트가 유입되고 있으나, Read Model (`read_grip_result`, `read_multimodal`) 의 스키마에는 해당 필드가 정의되어 있지 않습니다.

*   **현재 상태:** 이벤트 소싱 엔진은 스키마 검증 로직 (또는 스키마 드리프트 감지 로직) 에 따라 이 필드를 **적재하지 않거나 (Drop)**, **오류로 처리**할 가능성이 높습니다.
*   **영향:** 만약 v1 API 가 `conveyor_speed` 또는 `gripper_temperature` 필드를 **필수 (Required)**로 요구한다면, 해당 필드가 DB 에 저장되지 않으므로 **v1 API 호출 시 500 Internal Server Error 또는 400 Bad Request**가 발생하여 클라이언트가 깨집니다.
*   **자료 내 단서:** `payload.schema.drift` 로그의 `detail` 필드에 `newKeys={"conveyor_speed": "1.2", "gripper_temperature": "36.5"}`라고 명시되어 있어, 시스템이 이 필드의 유실을 인지하고 있습니다.

### 해결 방안 (v1 API 클라이언트 호환성 유지)

v1 API 클라이언트가 이 신규 필드에 의존하지 않는다고 가정할 때 (자료상 필드가 없으므로), **아무것도 하지 않아도** v1 API 는 깨지지 않습니다.

하지만, 만약 **v1 API 가 이 필드를 필요로 한다**거나, **시스템이 스키마 드리프트를 치명적인 오류로 간주하여 전체 적재를 중단**하는 경우를 대비한 **안전한 마이그레이션 절차**는 다음과 같습니다.

#### 1. 버전 경로 (Versioning Strategy)
*   **추천:** URL 경로 버전화 (`/api/v1`, `/api/v2`) 또는 헤더 버전화 (`Accept-Version: v2`).
*   **이유:** 필드가 추가되는 것은 Backward Compatibility (후방 호환) 를 해치지 않습니다. v1 API 는 기존 필드만 반환하면 되므로, 신규 필드가 DB 에 없어도 v1 API 는 정상 작동합니다.

#### 2. 신구 병행 운영 (Parallel Operation)
*   **Read Model 분리:**
    *   **`read_grip_result_v1`:** 기존 스키마 (`conveyor_speed`, `gripper_temperature` 없음) 를 그대로 유지하는 테이블. v1 API 가 이 테이블을 조회합니다.
    *   **`read_grip_result_v2`:** 신규 필드 (`conveyor_speed`, `gripper_temperature`) 를 추가한 스키마를 적용하는 테이블. v2 API 가 이 테이블을 조회합니다.
*   **이벤트 스토어 분리 (선택 사항):**
    *   `stream_v1`: 기존 스키마만 허용하는 스트림.
    *   `stream_v2`: 신규 필드를 허용하는 스트림.
    *   *주의:* Event Store 가 단일 스키마를 강제하는 경우, 스트림 분리보다는 Read Model 분리 전략이 더 안전합니다.

#### 3. 마이그레이션 및 컷오버 절차

**Step 1: 스키마 확장 (Schema Evolution)**
*   `read_grip_result` 및 `read_multimodal` 테이블에 `conveyor_speed` (numeric/varchar), `gripper_temperature` (numeric/varchar) 컬럼을 **추가 (ALTER TABLE ADD COLUMN)**합니다.
*   **주의:** 기존 데이터는 그대로 유지되므로, NULL 값으로 초기화됩니다.

**Step 2: 이벤트 소싱 엔진 설정 변경**
*   이벤트 소싱 엔진의 스키마 검증 규칙을 수정하여, `newKeys` (신규 키) 가 유실되는 것을 **경고 (Warning)** 수준으로 하거나, **적재 허용**하도록 설정합니다.
*   기존에 `payload.schema.drift` 로 인해 적재가 중단되거나 필드가 날아가는 것을 방지합니다.

**Step 3: API Gateway / 라우팅 로직 업데이트**
*   **v1 API:** `read_grip_result` (또는 `read_grip_result_v1`) 테이블을 조회하도록 설정 유지. (신규 필드 없음)
*   **v2 API:** `read_grip_result_v2` (또는 확장된 `read_grip_result`) 테이블을 조회하도록 설정. (신규 필드 포함)
*   클라이언트 요청에 따라 API 버전을 선택하거나, API 가 자동으로 버전을 감지하도록 합니다.

**Step 4: 데이터 동기화 (Backfill)**
*   스키마가 확장된 후, 이벤트 소싱 엔진이 과거의 `conveyor_speed` 및 `gripper_temperature` 필드를 가진 이벤트를 다시 처리하여, 두 버전의 Read Model (`_v1`과 `_v2`) 에 데이터를 동기화해야 합니다.
    *   `read_grip_result_v1`: 기존 데이터 (NULL) 유지.
    *   `read_grip_result_v2`: 이벤트에서 파싱된 데이터 (`conveyor_speed`: "1.2", `gripper_temperature`: "36.5") 로 채움.

**Step 5: 컷오버 (Cutover)**
*   모든 v1 클라이언트가 v2 로 마이그레이션되었거나, v1 API 가 더 이상 사용되지 않을 때, `read_grip_result_v1` 테이블을 삭제하고 `read_grip_result_v2` 테이블을 `read_grip_result` 로 리네임합니다.

### 요약
자료에 따르면 **필드 유실**이 발생 중입니다. v1 API 가 해당 필드를 **필요로 하지 않는다면** 현재 상태 그대로 유지하면 됩니다. **필요로 한다면** **Read Model 테이블 분리 (`_v1`, `_v2`)** 전략을 취하고, **스키마를 확장**하여 v2 API 에는 신규 필드를, v1 API 에는 기존 필드만 반환하도록 라우팅을 구성해야 합니다.
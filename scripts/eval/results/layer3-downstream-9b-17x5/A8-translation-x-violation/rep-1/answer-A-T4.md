기존 v1 API 클라이언트가 깨지지 않도록 하려면 **비파괴적 마이그레이션 (Non-destructive Migration)** 전략을 따르고, **버전별 API 엔드포인트 분리**를 통해 신구 버전을 병행 운영해야 합니다.

구체적인 단계는 다음과 같습니다.

### 1. 데이터 모델 확장 (DDL)
`read_grip_result_v2` 테이블을 생성하되, 기존 `read_grip_result` 테이블은 **절대 삭제하지 않습니다**.
- `read_grip_result_v2` 에는 `robot_tf_translation_x`, `robot_tf_translation_y`, `grip_outlier_flag` 등 정합성 검증이 강화된 필드를 추가합니다.
- 기존 `read_grip_result` 는 `robot_tf` (JSONB) 필드를 그대로 유지하여 v1 클라이언트의 기존 쿼리 (`robot_tf['translation_3x1']` 등) 가 계속 작동하도록 합니다.

### 2. API 엔드포인트 분리 및 확장
기존 `/grip-result` 엔드포인트는 수정하지 않고, 새로운 `/grip-result-v2` 엔드포인트를 추가합니다.
- **POST /grip-result**: 기존 v1 로직 (`GripResultProjector`) 을 사용하여 `read_grip_result` 테이블에 데이터를 투영합니다. 이 API 는 v1 클라이언트가 호출하는 경로이므로 변경되지 않아야 합니다.
- **POST /grip-result-v2**: 신규 v2 로직 (`GripResultV2Projector`) 을 사용하여 `read_grip_result_v2` 테이블에 데이터를 투영합니다. 이 API 는 v2 클라이언트가 호출하는 새로운 경로입니다.

### 3. 투영 서비스 (Projection Service) 확장
- `GripResultV2Projector` 를 새로 등록하여 `read_grip_result_v2` 를 관리합니다.
- 기존 `GripResultProjector` 는 `read_grip_result` 를 계속 관리합니다.
- 두 프로젝터는 서로 다른 테이블을 대상으로 하므로 데이터 충돌이 발생하지 않습니다.

### 4. 마이그레이션 및 컷오버 절차 (Human-in-the-loop)
1. **DDL 적용**: `read_grip_result_v2` 생성 SQL 을 실행합니다. (기존 테이블 건드리지 않음)
2. **Insight 카드 등록**: `read_grip_result_v2` 에 대한 메타데이터를 `insight_entity` 및 `insight_field` 테이블에 삽입합니다.
3. **API 추가**: `POST /grip-result-v2` 엔드포인트를 추가합니다.
4. **투영 서비스 연동**: `GripResultV2Projector` 를 DI 에 주입하고, `/grip-result-v2` 요청 시 해당 프로젝터가 실행되도록 합니다.
5. **컷오버 (Cutover)**:
   - v2 클라이언트 배포 후, `/grip-result-v2` 엔드포인트를 사용하도록 v2 클라이언트 설정을 변경합니다.
   - `/grip-result-v2` 를 호출하면 `read_grip_result_v2` 가 업데이트되고, `grip_outlier_flag` 가 계산되어 물리적 모순 데이터가 걸러집니다.
   - v1 클라이언트는 `/grip-result` 를 계속 호출하므로 `read_grip_result` 에 저장된 데이터 (JSONB 구조) 를 그대로 읽을 수 있습니다.
6. **v1 자산 무손상 확인**: `/grip-result` 엔드포인트와 `read_grip_result` 테이블이 정상 작동하는지 확인합니다.

### 요약
- **버전 경로**: `/grip-result` (v1), `/grip-result-v2` (v2)
- **데이터 전략**: `read_grip_result` (v1, 유지), `read_grip_result_v2` (v2, 신규) 병행
- **핵심**: 기존 v1 API 경로와 테이블을 건드리지 않고, 새로운 v2 경로와 테이블만 추가하여 점진적으로 전환합니다.
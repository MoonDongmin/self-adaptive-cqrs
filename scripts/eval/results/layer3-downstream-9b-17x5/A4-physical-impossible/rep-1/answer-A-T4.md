기존 v1 API 클라이언트가 깨지지 않도록 하려면 **비파괴적 마이그레이션 (Non-destructive Migration)** 전략을 따르고, **버전별 API 엔드포인트 분리**를 통해 신구 버전을 병행 운영해야 합니다.

구체적 단계는 다음과 같습니다.

### 1. 데이터 스키마 확장 (DDL)
`read_grip_outlier_v2` 테이블을 생성하되, 기존 `read_grip_result` 테이블은 **절대 건드리지 않습니다**.
- `read_grip_result` 테이블의 구조와 데이터는 그대로 유지합니다.
- 새로운 `read_grip_outlier_v2` 테이블만 추가하여, v2 로직에서 필터링된 이상 데이터 (z1 ≤ 0, xl > 1920) 만 저장합니다.

### 2. API 엔드포인트 분리 및 확장
기존 `/grip-result` 엔드포인트는 **변경하지 않고** 유지합니다. 대신 새로운 `/grip-outlier-v2` 엔드포인트를 추가합니다.

- **POST /grip-result**: 기존 v1 로직 (`GripResultProjector`) 을 그대로 실행하여 모든 시도 (정상 + 이상) 를 `read_grip_result` 에 적재합니다. 기존 클라이언트는 이 엔드포인트를 계속 호출하므로 영향이 없습니다.
- **POST /grip-outlier-v2**: 신규 v2 로직 (`GripOutlierV2Projector`) 을 실행하여 정합성 위반 데이터만 `read_grip_outlier_v2` 에 적재합니다.

### 3. 마이그레이션 및 컷오버 절차
1. **신규 테이블 생성**: `read_grip_outlier_v2` 생성 SQL 실행.
2. **프로젝터 등록**: `GripOutlierV2Projector` 를 DI 컨테이너에 등록하고, `CatchUpRunner` 에 추가하여 이벤트 스트림을 모니터링하도록 설정.
3. **컨트롤러 확장**: `POST /grip-outlier-v2` 라우트를 추가.
4. **컷오버 (Cutover)**:
   - 신규 `/grip-outlier-v2` 엔드포인트를 클라이언트 측에 배포 및 안내.
   - 기존 `/grip-result` 엔드포인트는 그대로 유지 (기존 클라이언트 호환성 보장).
   - 이상 데이터가 유입될 때, 신규 클라이언트는 `/grip-outlier-v2` 를 호출하여 이상 행을 조회하고, 기존 클라이언트는 `/grip-result` 를 호출하여 전체 데이터를 조회합니다.

이 방식은 기존 v1 클라이언트의 호출 경로와 반환되는 데이터 구조를 변경하지 않으므로, **기존 클라이언트가 즉시 깨지지 않습니다**.
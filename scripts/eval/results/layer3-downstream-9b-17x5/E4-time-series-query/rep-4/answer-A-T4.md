기존 v1 API 클라이언트가 깨지지 않도록 하려면 **API 버전 호환성 (Backward Compatibility)** 을 유지하면서 새 기능을 점진적으로 도입해야 합니다. 제공된 자료의 'API Versioning' 섹션과 'Guardrails' (v1 자산 무손상) 를 근거로 다음과 같은 단계를 수행해야 합니다.

### 1. API 경로 분리 (Versioning Strategy)
기존 엔드포인트를 수정하지 않고, 새 기능을 별도의 버전 경로에 노출합니다.
- **기존 엔드포인트 유지**: `POST /multimodal`, `POST /grip-result` 는 기존 v1 로직 그대로 유지합니다.
- **신규 엔드포인트 추가**: `POST /daily-grip-stats` (또는 `POST /daily-grip-stats-v1`) 를 추가합니다.
- **결과**: 기존 클라이언트는 `/multimodal` 및 `/grip-result` 를 계속 호출하며, 새 기능은 새 엔드포인트를 호출하게 됩니다.

### 2. 마이그레이션 및 컷오버 절차 (Human-in-the-loop)
DDL 실행과 API 컷오버는 반드시 인간 승인을 거칩니다.

#### 단계 1: 개발 환경 검증 (Pre-Deployment)
- `read_daily_grip_stats_v1` 테이블 생성 DDL 실행.
- `DailyGripStatsV1Projector` 구현 및 `ProjectionService` 에 배선.
- `POST /daily-grip-stats` 컨트롤러 라우트 추가.
- **검증**: 테스트 데이터 (`toyDataSchema`) 를 `POST /insert-all` 로 적재한 후, `POST /daily-grip-stats` 를 호출하여 `total_attempts`, `success_count`, `success_rate` 가 올바르게 집계되는지 확인합니다.

#### 단계 2: 인간 승인 (Human Approval)
- 위 변경 사항 (DDL, 코드 수정, 새 API 라우트) 을 승인받습니다.

#### 단계 3: 프로덕션 배포 (Cut-over)
1. **코드 배포**: 새 프로젝트 (`DailyGripStatsV1Projector` 등) 와 컨트롤러 코드를 배포합니다.
2. **데이터 초기화**: `read_daily_grip_stats_v1` 테이블을 생성합니다.
3. **백업**: 기존 `read_grip_result` 및 `read_multimodal` 테이블 백업.
4. **투영 재실행 (Catch-up)**:
   - 기존 `GripResultProjector` 와 `MultiModalProjector` 를 먼저 실행하여 기존 데이터의 Read Model 을 최신화합니다.
   - **중요**: `DailyGripStatsV1Projector` 를 실행하여 원천 이벤트 (또는 `read_grip_result` 스캔) 를 기반으로 `read_daily_grip_stats_v1` 에 일일 집계 데이터를 생성합니다.
5. **API 컷오버**:
   - 새 API 엔드포인트 (`/daily-grip-stats`) 를 활성화합니다.
   - 기존 API 엔드포인트 (`/multimodal`, `/grip-result`) 는 그대로 유지합니다.

### 3. 클라이언트 측 대응 (Client-Side Strategy)
- **기존 클라이언트**: 변경 사항 없이 기존 엔드포인트 (`/multimodal`, `/grip-result`) 를 계속 사용합니다.
- **새 기능 사용**: 새 엔드포인트 (`/daily-grip-stats`) 를 호출하여 일자별 파지 성공률 추이를 조회합니다.
- **결과**: 기존 클라이언트는 정상 작동하며, 새 기능을 원할 경우 새 엔드포인트를 호출하면 됩니다.

### 4. 롤백 계획 (Rollback Plan)
- 만약 새 Read Model (`read_daily_grip_stats_v1`) 이 생성되지 않거나, `POST /daily-grip-stats` 가 정상적으로 데이터를 반환하지 않을 경우:
  1. `read_daily_grip_stats_v1` 테이블을 `DROP` 합니다.
  2. `ProjectionService` 에서 `DailyGripStatsV1Projector` 와 `/daily-grip-stats` 라우트를 제거합니다.
  3. `ProjectionService` 를 `catchUpAll` 로 되돌려 기존 `GripResultProjector` 만 실행되도록 합니다.
  4. 기존 v1 API 엔드포인트만 남게 되어 기존 클라이언트는 즉시 복구됩니다.

### 요약
**"기존 엔드포인트는 건드리지 않고, 새 엔드포인트를 추가하여 새 Read Model 을 노출한다. DDL 과 새 프로젝트 배선은 인간 승인을 거쳐 배포 후 재투영 (Catch-up) 을 통해 데이터를 채운다. 실패 시 새 테이블과 라우트를 즉시 삭제하여 기존 v1 로직으로 회귀한다."**
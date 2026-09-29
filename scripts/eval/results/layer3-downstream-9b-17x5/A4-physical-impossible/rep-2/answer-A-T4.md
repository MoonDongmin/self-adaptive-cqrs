기존 v1 API 클라이언트가 깨지지 않도록 하려면 **파괴적 변경 (Breaking Change) 을 피하는 버전 관리 전략**을 적용해야 합니다. 제공된 자료에 따르면 `read_grip_outlier_v2`는 완전히 새로운 테이블이며, 기존 `read_grip_result`와 `read_multimodal`은 무손상 유지되므로, API 엔드포인트도 기존 경로를 그대로 사용하면서 새로운 엔드포인트를 추가하는 방식이 적합합니다.

구체적 단계는 다음과 같습니다.

### 1. API 버전 경로 분리 (Versioned Routes)
기존 엔드포인트 (`/multimodal`, `/grip-result`) 는 그대로 유지하고, 새로운 데이터 (`read_grip_outlier_v2`) 를 조회할 수 있는 **새로운 버전화된 엔드포인트**를 추가합니다.
- **기존 v1 경로 유지**: `POST /multimodal`, `POST /grip-result` (기존 클라이언트 호환)
- **신규 v2 경로 추가**: `POST /grip-outlier-v2` (신규 클라이언트 또는 기존 클라이언트가 v2 데이터를 필요로 할 때만 호출)

### 2. 마이그레이션 및 컷오버 절차 (Human-in-the-loop)
DDL 실행과 API 컷오버는 반드시 인간 승인을 거친 후 순차적으로 수행합니다.

#### 단계 1: DDL 실행 (새로운 테이블 생성)
`read_grip_outlier_v2` 테이블을 생성하고, 기존 테이블 (`read_grip_result`, `read_multimodal`) 은 건드리지 않습니다.
```sql
CREATE TABLE read_grip_outlier_v2 (
  scene_key VARCHAR NOT NULL,
  attempt_num SMALLINT NOT NULL,
  object_name VARCHAR NOT NULL,
  grip_succeed SMALLINT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  z1_raw DOUBLE PRECISION,
  xl_raw DOUBLE PRECISION,
  depth_negative_flag SMALLINT NOT NULL DEFAULT 0,
  pixel_xl_out_of_bounds_flag SMALLINT NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX idx_grip_outlier_v2_pk ON read_grip_outlier_v2 (scene_key, attempt_num);
CREATE INDEX idx_grip_outlier_v2_time ON read_grip_outlier_v2 (occurred_at);
```

#### 단계 2: Insight 카드 동기화 (LLM 컨텍스트 등록)
신규 Read Model 을 분석 엔진에 등록합니다.
```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_grip_outlier_v2', 'read_model', '전용 정합성 플래그 및 원치 측정값 추출 테이블로, 기존 JSONB 포즈 저장이 아닌 z1(깊이)와 xl(픽셀) 수치 열과 위반 플래그 열을 제공하여 센서 베이스라인 편만 분석과 SQL 필터링을 효율하게 지원.', 'scene_key, attempt_num')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_grip_outlier_v2', 'scene_key', 'varchar', '장면 식별 키', 1),
  ('read_grip_outlier_v2', 'attempt_num', 'smallint', '시도 번호', 2),
  ('read_grip_outlier_v2', 'object_name', 'varchar', '객체명', 3),
  ('read_grip_outlier_v2', 'grip_succeed', 'smallint', '성공여부 (0/1)', 4),
  ('read_grip_outlier_v2', 'occurred_at', 'timestamp', '데이터 촬영 일자', 5),
  ('read_grip_outlier_v2', 'z1_raw', 'doublePrecision', '3D 좌표 z1 원치 측정값', 6),
  ('read_grip_outlier_v2', 'xl_raw', 'doublePrecision', '2D 좌표 xl 원치 측정값', 7),
  ('read_grip_outlier_v2', 'depth_negative_flag', 'smallint', 'z1 ≤ 0 위반 플래그 (1:위반, 0:양호)', 8),
  ('read_grip_outlier_v2', 'pixel_xl_out_of_bounds_flag', 'smallint', 'xl > 1920 위반 플래그 (1:위반, 0:양호)', 9)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

#### 단계 3: 애플리케이션 코드 배포 (프로젝터 및 배선 추가)
- `GripOutlierProjector` 클래스를 생성하여 `GripResultProjector`와 병렬로 실행되도록 등록합니다.
- `ProjectionService` 에 `catchUpGripOutlierV2` 메서드를 추가합니다.
- `ProjectionController` 에 `POST /grip-outlier-v2` 라우트를 추가합니다.
- **중요**: 기존 `/multimodal`, `/grip-result`, `/insert-all` 엔드포인트는 코드 수정 없이 그대로 유지됩니다.

#### 단계 4: 초기 데이터 채우기 (Catch-up Projection)
신규 테이블에 과거의 오염 데이터를 채웁니다.
```typescript
// ProjectionService 내 catchUpGripOutlierV2 구현
async catchUpGripOutlierV2(): Promise<ProjectionResult> {
  return this.runner.run(this.gripOutlierV2);
}
```
이 메서드를 호출하여 `read_grip_outlier_v2` 테이블에 `seq:26` 및 `seq:27` 등 모든 관련 이벤트를 투영합니다.

#### 단계 5: 컷오버 검증 및 활성화
- **검증**: `SELECT depth_negative_flag = 1 OR pixel_xl_out_of_bounds_flag = 1 FROM read_grip_outlier_v2 WHERE occurred_at < cutover_timestamp LIMIT 100` 쿼리를 실행하여 예상치 못한 데이터가 없는지 확인합니다.
- **활성화**: 인간 승인이 완료되면, 신규 엔드포인트 `POST /grip-outlier-v2` 를 공식 API 문서에 등록하고 클라이언트 배포 가이드에 추가합니다.

### 3. 기존 v1 클라이언트 호환성 보장
- **경로 충돌 방지**: 기존 `/grip-result` 는 `read_grip_result` 테이블을, 새로운 `/grip-outlier-v2` 는 `read_grip_outlier_v2` 테이블을 반환합니다. 두 경로는 서로 다른 테이블을 참조하므로 충돌이 없습니다.
- **반응형**: 기존 클라이언트는 `/grip-result` 를 호출하면 기존 로직대로 작동하며, 새로운 `/grip-outlier-v2` 는 호출하지 않아도 됩니다.
- **데이터 무결성**: `read_grip_result` 테이블은 `DELETE` 없이 그대로 유지되므로, 기존 클라이언트가 의존하던 데이터가 사라지지 않습니다.

### 요약
1. **새 엔드포인트 추가**: `POST /grip-outlier-v2` 만 새로 만듭니다.
2. **기존 엔드포인트 유지**: `POST /multimodal`, `POST /grip-result` 는 코드 수정 없이 그대로 둡니다.
3. **병렬 실행**: `GripOutlierProjector` 를 `GripResultProjector` 와 함께 실행하여 두 테이블에 동시 데이터를 적재합니다.
4. **인간 승인 후 DDL**: `read_grip_outlier_v2` 생성 SQL 을 승인 후 실행합니다.

이 방식은 **Backward Compatibility (하위 호환성)** 를 완벽하게 보장하며, 새로운 기능은 점진적으로 도입됩니다.
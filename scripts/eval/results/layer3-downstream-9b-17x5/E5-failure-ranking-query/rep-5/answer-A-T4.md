기존 v1 API 클라이언트가 깨지지 않도록 하려면 **API 버전 호환성 (Backward Compatibility)** 을 유지하면서 신규 기능을 제공하는 전략을 따라야 합니다. 제공된 자료에 따르면 `apiVersion` 은 `from: v1`, `to: v2` 로 정의되어 있으며, 변경 사항이 `additive`(추가) 이므로 기존 리소스는 무손상입니다.

구체적 단계는 다음과 같습니다.

### 1. API 버전 경로 분리 (Versioned Routes)
기존 v1 클라이언트가 의존하는 엔드포인트는 변경하지 않고, 신규 기능은 별도의 버전 경로에 노출합니다.
- **기존 엔드포인트 유지**: `POST /multimodal`, `POST /grip-result`, `POST /insert-all` 은 그대로 유지합니다.
- **신규 엔드포인트 추가**: `POST /object-failure-stats` 를 추가합니다.
- **클라이언트 대응**:
  - 기존 v1 클라이언트는 `/multimodal`, `/grip-result`, `/insert-all` 을 호출하므로 영향이 없습니다.
  - 신규 v2 클라이언트는 `/object-failure-stats` 를 호출하여 집계 데이터를 조회합니다.

### 2. 마이그레이션 및 컷오버 절차 (Human-in-the-loop)
DDL 실행과 API 컷오버는 반드시 인간 승인을 거칩니다.

#### 단계 1: DDL 적용 (Schema Migration)
신규 Read Model 테이블 `read_object_failure_stats` 를 생성하고, 메타데이터 (Insight Entity/Field) 를 등록합니다.
```sql
-- 1. Read Model 테이블 생성
CREATE TABLE public.read_object_failure_stats (
  object_name varchar NOT NULL,
  total_attempts double precision NOT NULL,
  success_count double precision NOT NULL,
  failure_count double precision NOT NULL
);
ALTER TABLE public.read_object_failure_stats ADD CONSTRAINT read_object_failure_stats_pk PRIMARY KEY (object_name);
CREATE INDEX idx_object_failure_stats_name ON public.read_object_failure_stats(object_name);

-- 2. Insight 카드 메타데이터 등록 (LLM 컨텍스트 동기화)
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_object_failure_stats', 'read_model', '파지 실패 빈도 및 실패율 상위 목록 조회를 위한 집계 카드(Read Model). 기존 row-level Read Models(`read_grip_result`, `read_multimodal`)로는 ''상위 목록/순위'' 뷰를 직접 제공하지.', 'object_name')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_object_failure_stats', 'object_name', 'varchar', '파지 대상 객체명 (payload.objects[0].class_name)', 1),
  ('read_object_failure_stats', 'total_attempts', 'double precision', '총 파지 시도 수 (누적 갱신)', 2),
  ('read_object_failure_stats', 'success_count', 'double precision', '파지 성공 수 (grip_succeed=1, 누적 갱신)', 3),
  ('read_object_failure_stats', 'failure_count', 'double precision', '파지 실패 수 (grip_succeed=0, 누적 갱신)', 4)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

#### 단계 2: 코드 배포 및 준비
- `src/shared/database/schema/index.ts` 에 `read_object_failure_stats` 모듈을 추가합니다.
- `src/projection/object-failure-stats.projector.ts` 를 생성하여 이벤트 소싱 로직을 구현합니다.
- `src/projection/projection.service.ts` 와 `src/projection/projection.controller.ts` 를 수정하여 신규 프로젝터와 라우트를 등록합니다.

#### 단계 3: 컷오버 (Cutover)
인간 승인이 완료되면 다음 순서로 변경을 적용합니다.
1. **데이터 초기화**: 기존 `read_object_failure_stats` 테이블이 없다면 생성합니다. (이미 DDL 로 생성됨)
2. **백업**: `read_grip_result` 및 `read_object_failure_stats` 테이블을 백업합니다.
3. **프로젝터 재시작**: 신규 `ObjectFailureStatsProjector` 가 포함된 서비스로 애플리케이션을 재시작합니다.
4. **Catch-up 실행**: `ProjectionService.catchUpObjectFailureStats()` 를 실행하여 과거 이벤트 (`GripAttemptRecorded`) 를 기반으로 `read_object_failure_stats` 테이블을 초기화합니다.
   - 이때 `onConflictDoUpdate` 로직이 적용되어 누락된 시도 데이터가 누적됩니다.
5. **검증**:
   - `read_object_failure_stats` 테이블의 `object_name` 고유 개수가 원천 데이터 (`read_grip_result` 의 `object_name` 고유 개수) 와 일치하는지 확인합니다.
   - `total_attempts + success_count + failure_count` 합계가 해당 객체의 총 시도 횟수와 일치하는지 확인합니다.
6. **v1 클라이언트 영향 확인**: `/multimodal`, `/grip-result`, `/insert-all` 엔드포인트의 응답 구조가 변경되지 않았음을 확인합니다.

#### 단계 4: v1 클라이언트 무손상 보장
- 기존 v1 클라이언트가 호출하는 엔드포인트 (`/multimodal`, `/grip-result`, `/insert-all`) 의 URL 경로와 응답 스키마는 변경되지 않으므로, v1 클라이언트는 정상적으로 작동합니다.
- 신규 엔드포인트 `/object-failure-stats` 는 v1 클라이언트가 모를 수 있으므로, v1 클라이언트는 이 엔드포인트를 호출하지 않아야 합니다.

### 3. 요약: v1 클라이언트 보호 전략
1. **URL 충돌 방지**: 신규 API 는 `/object-failure-stats` 와 같이 기존 경로와 중복되지 않는 새 경로를 사용합니다.
2. **응답 스키마 충돌 방지**: 기존 엔드포인트의 응답 필드는 변경하지 않습니다.
3. **데이터 무손상**: `read_grip_result` 의 PK 구조와 데이터는 유지하며, `read_object_failure_stats` 는 별도의 테이블로 추가됩니다.
4. **Gradual Rollout**: 필요시 `/object-failure-stats` 엔드포인트는 v2 클라이언트만 호출하도록 라우트 매핑을 분리하거나, v1 클라이언트용 API 는 별도 호스트/버전으로 배포합니다.

이 절차에 따라 기존 v1 API 클라이언트는 영향을 받지 않고, 신규 v2 클라이언트는 추가된 `/object-failure-stats` 엔드포인트를 통해 파지 실패 통계를 조회할 수 있습니다.
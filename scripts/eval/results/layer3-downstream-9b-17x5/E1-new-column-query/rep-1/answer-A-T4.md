기존 v1 API 클라이언트가 깨지지 않게 하려면 **신규 Read Model (`read_grip_result_v2`) 을 기존 v1 자산과 완전히 분리하여 병행 운영**해야 합니다. 기존 v1 테이블 (`read_grip_result`) 은 변경 없이 유지하고, 새로운 필드와 조회 경로는 v2 버전을 통해 제공합니다.

구체적 단계는 다음과 같습니다.

### 1. 데이터베이스 스키마 변경 (DDL)
기존 `read_grip_result` 테이블을 건드리지 않고, 새 테이블 `read_grip_result_v2` 만 생성합니다.
```sql
CREATE TABLE read_grip_result_v2 (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  object_name varchar,
  grip_succeed smallint,
  gripper_type varchar(16),
  occurred_at timestamptz,
  grip_2d_pose jsonb,
  grip_3d_pose jsonb,
  robot_tf jsonb,
  human_annotation_grasp jsonb,
  stream_id varchar,
  global_seq bigint,
  conveyor_speed double precision,
  gripper_temperature double precision,
  PRIMARY KEY (scene_key, attempt_num)
);
```

### 2. 인사이트 카드 (Insight Card) 등록
LLM 기반 분석 도구 (Insight Card) 가 새 Read Model 을 인식하도록 메타데이터를 등록합니다.
```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_grip_result_v2', 'read_model', '기존 read_grip_result 에 스키마 드리프트 신규 키(conveyor_speed, gripper_temperature) 미적재로 조회 실패. 신규 Read Model 로 추가 컬럼 적재 및 시간대별 시계열 조회 지원.', '(scene_key, attempt_num)')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_grip_result_v2', 'scene_key', 'varchar', '장면 식별 키', 1),
  ('read_grip_result_v2', 'attempt_num', 'smallint', '시도 번호', 2),
  ('read_grip_result_v2', 'object_name', 'varchar', '파지 대상 객 명', 3),
  ('read_grip_result_v2', 'grip_succeed', 'smallint', '파지 성공 여부', 4),
  ('read_grip_result_v2', 'gripper_type', 'varchar(16)', '그리퍼 종류', 5),
  ('read_grip_result_v2', 'occurred_at', 'timestamptz', '데이터 촬영 일자', 6),
  ('read_grip_result_v2', 'grip_2d_pose', 'jsonb', '2D 파지점', 7),
  ('read_grip_result_v2', 'grip_3d_pose', 'jsonb', '3D 파지점', 8),
  ('read_grip_result_v2', 'robot_tf', 'jsonb', '로봇 변환행렬', 9),
  ('read_grip_result_v2', 'human_annotation_grasp', 'jsonb', '휴먼 어노테이션 파 지 영역', 10),
  ('read_grip_result_v2', 'stream_id', 'varchar', 'ES 스트림 ID', 11),
  ('read_grip_result_v2', 'global_seq', 'bigint', '투영 출처 이벤트 ES 전역 시퀀스', 12),
  ('read_grip_result_v2', 'conveyor_speed', 'double precision', '컨네어 속도 (신규 드리프트)', 13),
  ('read_grip_result_v2', 'gripper_temperature', 'double precision', '그리퍼 온도 (신규 드리프트)', 14)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

### 3. 투영 서비스 (Projection Service) 확장
새로운 `GripResultV2Projector` 를 등록하고, 기존 `GripResultProjector` 와는 독립적으로 이벤트를 처리하도록 로직을 추가합니다. 기존 프로젝트는 수정하지 않습니다.
```typescript
// src/projection/projection.service.ts (추가/수정)
import { GripResultV2Projector } from '@/projection/projector/grip-result-v2.projector';

// ... 기존 코드 ...

export type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
  gripResultV2: ProjectionResult; // 새 필드 추가
};

// ... 기존 코드 ...

async catchUpAll(): Promise<CatchUpAllResult> {
  // ... 기존 코드 ...
  const gripResultV2: ProjectionResult = await this.catchUpGripResultV2(); // 새 메서드 호출
  // ... 기존 코드 ...
}
```

### 4. API 컨트롤러 (Controller) 확장
새로운 엔드포인트 `/grip-result-v2` 를 추가하여, 기존 `/grip-result` 와는 별개로 v2 데이터를 조회할 수 있게 합니다. 기존 엔드포인트는 그대로 유지합니다.
```typescript
// src/projection/projection.controller.ts (추가)
@Post("/grip-result-v2")
gripResultV2(): Promise<ProjectionResult> {
  this.logger.info(
    {
      action: LogAction.PROJECTION_REQUEST,
      [LogContext.ROUTE]: "POST /projection/grip-result-v2",
    },
    "projection 요청 수신",
  );

  return this.projectionService.catchUpGripResultV2();
}
```

### 5. 마이그레이션 및 컷오버 절차 (Human-in-the-loop)
1.  **준비 단계**: 위 SQL DDL 과 TypeScript 코드 변경사항을 적용합니다.
2.  **초기 투영 (Catch-up)**: 변경된 서비스에서 `catchUpGripResultV2` 를 실행하여, 현재 시점까지 적재된 이벤트 중 `conveyor_speed` 와 `gripper_temperature` 필드가 포함된 데이터를 새 Read Model 로 투영합니다.
3.  **인간 승인**: 변경 사항 (DDL, 코드, API 경로) 을 검토하여 승인합니다.
4.  **컷오버**: 승인 후 새 API 엔드포인트 (`/grip-result-v2`) 를 활성화합니다. 기존 `/grip-result` 는 그대로 유지되므로 v1 클라이언트는 영향받지 않습니다.
5.  **검증**: 새 엔드포인트를 통해 `gripper_temperature` 를 시간대별로 조회하는 쿼리가 정상 작동하는지 확인합니다.

이 절차로 기존 v1 클라이언트는 `read_grip_result` 테이블을 통해 기존 데이터를 계속 조회할 수 있고, 새 필드가 필요한 경우에만 `/grip-result-v2` 엔드포인트를 호출하게 됩니다.
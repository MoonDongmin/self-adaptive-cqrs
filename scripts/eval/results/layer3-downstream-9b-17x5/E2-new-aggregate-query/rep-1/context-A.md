---
docId: analysis-ea4ee9ce-edb0-4f77-8ec2-c65049a86a08
generatedAt: 2026-08-14T01:07:15.433Z
targetReadModel: read_object_grip_aggregate_v1
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: v1
  to: v2
  affectedEndpoints:
    - "POST /multimodal"
    - "POST /grip-result"
    - "POST /object-grip-aggregate"
    - "POST /insert-all"
evidenceSources:
  - { origin: developer-logging, anchorId: "ea4ee9ce-edb0-4f77-8ec2-c65049a86a08" }
  - { origin: developer-logging, anchorId: "f37b3833-0b15-42f4-b768-b1411a5070a3" }
  - { origin: developer-logging, anchorId: "a6087593-da33-41d2-844e-926d12bfa105" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_object_grip_aggregate_v1

> 결론(TL;DR): `read_object_grip_aggregate_v1`을(를) 재생성한다 — 사용자가 object_name별 파지 성공률(시도 수, 성공 수, 성공률) 집계를 요청하나, 현재 Insight DB에는 `read_grip_result`만 존재하여 개별 시도(attempt_num) 단위 1:1 매핑만 지원. 집계(Summary) 테이블 부재로 insight.card.miss 발생. (이상 유형: 카드 없는 Read Model 테이블 · 심각도: warning)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `projection.request`(level 30) 2회, `projection.batch`(level 30) 2회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `projection.event.mapped`(level 20) 60회, `-`(level 30) 5회, `projection.start`(level 30) 2회, `-`(level 20) 6회, `insert.request`(level 30) 1회, `insight.card.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insight.card.miss`(level 40) 1회, `insert.file.ok`(level 20) 60회, `projection.done`(level 30) 2회, `projection.cursor.advanced`(level 20) 2회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01:07:07.708 | 30 | projection.done | d869b8b7-23ab-4c09-b950-ce424dee4081 | - | - | - | catch-up 완료 | projector=grip-result-projector |
| 01:07:07.708 | 30 | projection.batch | d869b8b7-23ab-4c09-b950-ce424dee4081 | - | - | - | 배치 처리 | projector=grip-result-projector |
| 01:07:07.708 | 20 | projection.cursor.advanced | d869b8b7-23ab-4c09-b950-ce424dee4081 | - | - | - | 커서 이동 | projector=grip-result-projector |
| 01:07:07.708 | 30 | - | d869b8b7-23ab-4c09-b950-ce424dee4081 | - | - | - | request completed | - |
| 01:07:07.711 | 30 | insight.card.request | ea4ee9ce-edb0-4f77-8ec2-c65049a86a08 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 01:07:07.712 | 40 | insight.card.miss | ea4ee9ce-edb0-4f77-8ec2-c65049a86a08 | - | - | - | insight 카드 없음: 객체(object_name)별 파지 성공률을 한 번에 조회하고 싶다. 시도 수, 성공 수, 성공률이 필요하다. ← 트립 앵커 | - |
| 01:07:07.712 | 30 | - | ea4ee9ce-edb0-4f77-8ec2-c65049a86a08 | - | - | - | request completed | - |
| 01:07:08.016 | 30 | insight.card.request | f37b3833-0b15-42f4-b768-b1411a5070a3 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 01:07:08.018 | 40 | insight.card.miss | f37b3833-0b15-42f4-b768-b1411a5070a3 | - | - | - | insight 카드 없음: 객체(object_name)별 파지 성공률을 한 번에 조회하고 싶다. 시도 수, 성공 수, 성공률이 필요하다. | - |
| 01:07:08.019 | 30 | - | f37b3833-0b15-42f4-b768-b1411a5070a3 | - | - | - | request completed | - |
| 01:07:08.321 | 30 | insight.card.request | a6087593-da33-41d2-844e-926d12bfa105 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 01:07:08.323 | 40 | insight.card.miss | a6087593-da33-41d2-844e-926d12bfa105 | - | - | - | insight 카드 없음: 객체(object_name)별 파지 성공률을 한 번에 조회하고 싶다. 시도 수, 성공 수, 성공률이 필요하다. | - |
| 01:07:08.324 | 30 | - | a6087593-da33-41d2-844e-926d12bfa105 | - | - | - | request completed | - |

</logging_context>

<insight_read_db>

## ReadModel: read_grip_result

용도: 장면별 로봇 파지 결과 조회 (성공여부·포즈·그리퍼)

키: (scene_key, attempt_num)

```mschema
# Table: read_grip_result
[
(scene_key:varchar, 장면 식별 키 = {카테고리}_{카메라코드}_{객체명}_{장면번호} (stream_id에서 'grip-attempt:' 제거), Primary Key, Examples: [반려동물용품_CR01_강아지공룡알장난감_00018]),
(attempt_num:smallint, 같은 장면 내 파지 시도 번호 (파일명의 시도번호), Primary Key, Examples: [1]),
(object_name:varchar, 파지 대상 객체명 (payload.objects[0].class_name), Examples: [강아지공룡알장난감]),
(grip_succeed:smallint, 파지 성공 여부 (0=실패, 1=성공), Examples: [1]),
(gripper_type:varchar(16), 그리퍼 종류 (현재 적재는 finger 고정, 흡착형은 suction), Examples: [finger]),
(occurred_at:timestamptz, 데이터 촬영 일자 (파일명 날짜에서 도출), Examples: [2023-09-23T00:00:00Z]),
(grip_2d_pose:jsonb, 2D 파지점 (핑거: xl,xr,yl,yr / 흡착: x,y), Examples: [{"xl":0,"xr":0,"yl":0,"yr":0}]),
(grip_3d_pose:jsonb, 3D 파지점 (핑거: x1..z8 24좌표 / 흡착: x,y,z,roll,pitch,yaw,penetrate), Examples: [{"x1":10.2,"y1":3.1,"z1":-100.0, "...":"...", "z8":-90.5}]),
(robot_tf:jsonb, 로봇 변환행렬 (rotation_3x3 9개 + translation_3x1 3개), Examples: [{"rotation_3x3":[1,0,0,0,1,0,0,0,1],"translation_3x1":[0,0,0]}]),
(human_annotation_grasp:jsonb, 휴먼 어노테이션 파지 영역 (핑거: keypoints 2점), Examples: [[{"annotation_type":"keypoints","id":1,"annotation_points":[120,330,140,360],"num_keypoints":2}]]),
(stream_id:varchar, ES 스트림 ID ("grip-attempt:" + scene_key) — 추적 키, Examples: [grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018]),
(global_seq:bigint, 투영 출처 이벤트의 ES 전역 시퀀스 — 추적 키, Examples: [1024])
]
```

## ReadModel: read_multimodal

용도: 장면별 2D이미지·비디오 미디어 링크 조회

키: (scene_key, attempt_num)

```mschema
# Table: read_multimodal
[
(scene_key:varchar, 장면 식별 키 (read_grip_result와 동일 규칙), Primary Key, Examples: [반려동물용품_CR01_강아지공룡알장난감_00018]),
(attempt_num:smallint, 같은 장면 내 파지 시도 번호, Primary Key, Examples: [1]),
(occurred_at:timestamptz, 데이터 촬영 일자, Examples: [2023-09-23T00:00:00Z]),
(image_2d_file_name:varchar, 원천 2D 이미지 파일명 (payload.2D_image_file_name), Examples: [반려동물용품_CR01_강아지공룡알장난감_00018_01_20230923.jpg]),
(image_2d_uri:text, 2D 이미지 저장 위치 URI (현재 projector가 null로 둠 — 추후 매핑)),
(video_file_name:varchar, 원천 비디오 파일명 (시도번호 자리가 항상 00 — 한 비디오 N:1로 여러 시도가 공유), Examples: [반려동물용품_CR01_강아지공룡알장난감_00018_00_20230923.mp4]),
(video_uri:text, 비디오 저장 위치 URI (현재 projector가 null로 둠 — 추후 매핑)),
(stream_id:varchar, ES 스트림 ID — 추적 키, Examples: [grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018]),
(global_seq:bigint, 투영 출처 이벤트의 ES 전역 시퀀스 — 추적 키, Examples: [1024])
]
```

</insight_read_db>

## 1. 권고 (Recommendation)

### Status
proposed

### Context (근거)
- (level 40, `insight.card.miss`) insight 카드 없음: 객체(object_name)별 파지 성공률을 한 번에 조회하고 싶다. 시도 수, 성공 수, 성공률이 필요하다. → 기존 read_grip_result 스키마에는 집계 필드 부재로, object_name별 1:N aggregation 조회를 위한 Summary Table 결결. [corr:ea4ee9ce-edb0-4f77-8ec2-c65049a86a08]
- (level 40, `insight.card.miss`) insight 카드 없음: 객체(object_name)별 파지 성공률을 한 번에 조회하고 싶다. 시도 수, 성공 수, 성공률이 필요하다. → 동발/연차 요청 모두 insight.card.miss로 실패, 집계(Summary) 테이블 부재로 insight.card.miss 발생. [corr:f37b3833-0b15-42f4-b768-b1411a5070a3]
- (level 40, `insight.card.miss`) insight 카드 없음: 객체(object_name)별 파지 성공률을 한 번에 조회하고 싶다. 시도 수, 성공 수, 성공률이 필요하다. → 시스템은 read_grip_result 카드를 찾으나 요구한 집계 데이터가 존재하는 Read Model 테이블이 없음. [corr:a6087593-da33-41d2-844e-926d12bfa105]
- Insight 카드 read_grip_result 키는 (scene_key, attempt_num)이며 컬럼 object_name과 grip_succeed만 존재. 집계(Summary) 테이블 부재로 insight.card.miss 발생 [corr:ea4ee9ce-edb0-4f77-8ec2-c65049a86a08].
- GripResultProjector.map() 소스(src/projection/projector/grip-result.projector.ts)에서 payload.objects[0].class_name은 objectName에 매핑, payload.grip_succeed는 gripSucceed에 매핑. 1:1 이벤트→행 투영만 구현되어 GROUP BY 산출값 충족 불가 [corr:f37b3833-0b15-42f4-b768-b1411a5070a3].
- read_multimodal 스키마 및 MultiModalProjector 소스(src/projection/projector/multimodal.projector.ts)는 2D/video URI 매핑(image_2d_uri, video_uri)이 null로 둠. 본 요청은 집계 로직에 무관하나 동발 처리 시 주의 필요 [corr:a6087593-da33-41d2-844e-926d12bfa105].

### Decision Drivers
- Read Model query pattern(집gregate vs detail)
- aggregation latency tolerance
- architectural decoupling
- API version stability

### Considered Options
#### 기존 보강 (동일 프로젝터 확장)
- 접근: GripResultProjector.map() 내 aggregation state 유지 및 read_object_grip_aggregate_v1 upsert 병방.
- 제안 필드: attempt_count, success_count, success_rate
- 트레이드오프: 동발 처리 latency 증가, detail과 summary coupling 발생.
```typescript
return { sceneKey: event.streamId.replace(/^grip-attempt:/, ""), attemptNum: event.attemptNum, objectName: payload.objects[0].class_name, gripSucceed: payload.grip_succeed, gripperType: "finger", occurredAt: event.occurredAt, grip2dPose: payload.grip_data.grip_2d_pose, grip3dPose: payload.grip_data.grip_3d_pose, robotTf: payload.robot_tf, humanAnnotationGrasp: payload.human_annotation_grasp, streamId: event.streamId, globalSeq: event.globalSeq }; await tx.insert(readObjectGripAggregateV1).values({ objectName: row.objectName, attemptCount: this.aggregateState.attemptCount, successCount: this.aggregateState.successCount, successRate: this.aggregateState.successRate });
```

#### 신규 분리 (전용 집계 프로젝터)
- 접근: src/projection/projector/grip-aggregate.projector.ts 생성, ProjectionService.catchUpAll() 연계.
- 제안 필드: attempt_count, success_count, success_rate
- 트레이드오프: 아키텍처 decoupling, 신규 테이블 마이그레이션 필요, 이벤트 처리 오버헤드 분절화.
```typescript
class GripAggregateProjector implements Projector<ReadObjectGripAggregateV1Insert> { map(event) { const agg = this.computeAggregate(payload); return agg; } upsert(tx, row) { await tx.insert(readObjectGripAggregateV1).values(row); } }
```

### Decision Outcome
신규 분리 (전용 집계 프로젝터)

### Consequences
- (+) Direct query fulfillment
- (+) clear schema boundary
- (+) event processing logic decoupling
- (−) 신규 테이블 migrationSql 적용 필요
- (−) ProjectionService.catchUpAll() 연계 수정
- (−) slight increase in event processing overhead (if done per-event)

### Non-Goals
- Modifying read_grip_result columns directly
- changing payload DTO structure
- handling URI mapping logic(image_2d_uri/video_uri null handling)

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

- 대상: `read_object_grip_aggregate_v1` · 키: object_name · 원천 이벤트: GripAttemptRecorded

```sql
CREATE TABLE read_object_grip_aggregate_v1 (
  object_name varchar NOT NULL,
  attempt_count bigint,
  success_count bigint,
  success_rate doublePrecision,
  PRIMARY KEY (object_name)
);
```

### 필드

```mschema
# Table: read_object_grip_aggregate_v1
[
(object_name:varchar, 파지 대상 객체명 (payload.objects[0].class_name), Primary Key),
(attempt_count:bigint, 해당 object_name의 총 파지 시도 수),
(success_count:bigint, 해당 object_name의 총 성공 수 (grip_succeed=1)),
(success_rate:doublePrecision, 해당 object_name의 누적 성공률 (success_count / attempt_count))
]
```

### 투영 매핑 명세 (이벤트 → 컬럼)

> upsert 키: object_name · 리플레이: projection_cursor 초기화 시 반드시 0 또는 null 설정. catch-up 전 재투영 시 upsert 전제(idempotent aggregation) 필수로, 기존 집계 값 차감-재가산 방식으로 갱업해야 누수/과적합 방지.

| 원천 이벤트 | payload 필드 | 컬럼 | 변환 |
| --- | --- | --- | --- |
| GripAttemptRecorded | grip_succeed | success_count | cast to smallint(1 if truthy else 0) |

파생 컬럼(이벤트 payload 아님):
- `attempt_count` ← SUM of 1 per event grouped by object_name
- `success_rate` ← success_count / attempt_count (default to 0.0 if denominator is zero)

### Insight 카드 등록 (Insight Read DB 동기화)

> DDL 적용 시 아래 카드 등록도 함께 실행한다 — 다음 분석부터 신규 Read Model 이 LLM 컨텍스트에 노출된다.

```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_object_grip_aggregate_v1', 'read_model', 'object_name별 파지 시도 수, 성공 수, 성공률 집계를 위한 Summary Table 제공', 'object_name')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_object_grip_aggregate_v1', 'object_name', 'varchar', '파지 대상 객체명 (payload.objects[0].class_name)', 1),
  ('read_object_grip_aggregate_v1', 'attempt_count', 'bigint', '해당 object_name의 총 파지 시도 수', 2),
  ('read_object_grip_aggregate_v1', 'success_count', 'bigint', '해당 object_name의 총 성공 수 (grip_succeed=1)', 3),
  ('read_object_grip_aggregate_v1', 'success_rate', 'doublePrecision', '해당 object_name의 누적 성공률 (success_count / attempt_count)', 4)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased (v1 → v2)

#### Added
- 신규 Read Model 테이블 read_object_grip_aggregate_v1 및 ObjectGripAggregateProjector 구현
- 라우트 /projection/object-grip-aggregate 배선으로 v2 집계 조회 경로 제공

### 마이그레이션 절차

- 하위호환 변경: 기존 read_grip_result 테이블, GripResultProjector, /projection/grip-result 라우트/서비스 메서드 무손상 유지; 신규 테이블은 독립 object_name Primary Key로 저장되어 v1 1:1 매핑 데이터와 동시 보존
- 파괴적 변경: 없음
- 컷오버 전 테스트: 모든 committed 이벤트 전수 aggregation 검증: read_object_grip_aggregate_v1 attempt_count/success_count/success_rate 값이 manual read_grip_result group-by object_name 집계 결과와 일치하는지 확인. 일치 시 클라이언트 라우트 호출에서 /grip-result → /object-grip-aggregate 전환.
- 롤백 창/조건: v2 프로젝터 성능 저하 또는 데이터 drift 발생 시, controller route revert to /grip-result 및 read_object_grip_aggregate_v1 테이블 drop via migration rollback.
- Insight 카드 등록: §2의 카드 등록 SQL을 DDL과 함께 적용(카탈로그 동기화)

### 사유·호환성

- 사유: 기존 Read Model의 `read_grip_result`는 scene_key/attempt_num 기준 1:1 매핑만 지원하여 object_name별 집계(시도 수, 성공 수, 성공률)를 위한 Summary Table 부재. v1 `GripResultProjector.map()` 코드가 `payload.objects[0].class_name`만 추출해 단일 객체 매핑에 고정되어 다중 시도 누적을 위한 집계 연산이 불가능하다. [corr:ea4ee9ce-edb0-4f77-8ec2-c65049a86a08]
- 트리거 근거: 01:07:07.712 | 40 | insight.card.miss | ea4ee9ce-edb0-4f77-8ec2-c65049a86a08 | - | - | - | insight 카드 없음: 객체(object_name)별 파지 성공률을 한 번에 조회하고 싶다. 시도 수, 성공 수, 성공률이 필요하다.
기존 v1 GripResultProjector.map() 코드가 payload.objects[0].class_name만 추출해 단일 객체 매핑에 고정되어 다중 시도 누적을 위한 집계 연산이 불가능하다.
- v1 호환성: `read_grip_result` 테이블과 `GripResultProjector`, `/projection/grip-result` 라우트/서비스 메서드를 무손상 유지. 신규 집계 테이블은 독립 object_name Primary Key로 저장되어 v1 1:1 매핑 데이터와 동시 보존.

### 변경 파일

- `src/shared/database/schema/index.ts` (modifyFile) — 신규 테이블 export 추가. 기존 v1 export 보존.
- `src/projection/projection.service.ts` (modifyFile) — 신규 프로젝터 DI 추가 및 catchUpAll/insertAllAndProjectAll 확장. 기존 v1 메서드 보존.
- `src/projection/projection.controller.ts` (modifyFile) — 신규 v2 라우트 /object-grip-aggregate 배선. 기존 v1 라우트 보존.

## Optional — 부속 자료(컨텍스트 축소 시 생략 가능)

### 신규 Read Model — Drizzle 스키마

```ts
import { bigint, doublePrecision, index, pgTable, primaryKey, varchar } from 'drizzle-orm/pg-core';

export const readObjectGripAggregate = pgTable(
  "read_object_grip_aggregate_v1",
  {
    objectName: varchar("object_name").notNull(),
    attemptCount: bigint("attempt_count", { mode: "number" }).notNull(),
    successCount: bigint("success_count", { mode: "number" }).notNull(),
    successRate: doublePrecision("success_rate"),
  },
  (t) => [
    primaryKey({ columns: [t.objectName] }),
    index("idx_object_grip_agg").on(t.objectName),
  ],
);
```

### 신규 Read Model — Projector

```ts
import { Injectable } from '@nestjs/common';
import { type InferInsertModel } from 'drizzle-orm';
import { PinoLogger } from 'nestjs-pino';
import { type ToyDataDto, toyDataSchema } from '@/insert/dto/toy-data.dto';
import type { Projector } from '@/projection/projector/projector';
import type { EventStoreEventRow } from '@/projection/repository/event-store-reader.repository';
import { DrizzleTx } from '@/shared/database/drizzle.provider';
import { readObjectGripAggregate } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';
import { sql } from 'drizzle-orm';

type ReadObjectGripAggregateInsert = InferInsertModel<typeof readObjectGripAggregate>;

@Injectable()
export class ObjectGripAggregateProjector implements Projector<ReadObjectGripAggregateInsert> {
  readonly name: string = "object-grip-aggregate-projector";

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(ObjectGripAggregateProjector.name);
  }

  map(event: EventStoreEventRow): ReadObjectGripAggregateInsert {
    let payload: ToyDataDto;
    try {
      payload = toyDataSchema.parse(event.payload);
    } catch (error) {
      this.logger.error(
        {
          action: LogAction.MAP_FAILED,
          error,
          [LogContext.EVENT_ID]: event.eventId,
          [LogContext.STREAM_ID]: event.streamId,
          [LogContext.ATTEMPT_NUM]: event.attemptNum,
          [LogContext.GLOBAL_SEQ]: event.globalSeq,
        },
        "이벤트 매핑(검증) 실패",
      );

      throw error;
    }

    if (payload.objects.length === 0) {
      this.logger.error(
        {
          action: LogAction.MAP_FAILED,
          [LogContext.EVENT_ID]: event.eventId,
          [LogContext.STREAM_ID]: event.streamId,
        },
        "objects 비어 있음",
      );

      throw new Error(`object-grip-aggregate map: empty objects in event ${event.eventId}`);
    }

    this.logger.debug(
      {
        action: LogAction.EVENT_MAPPED,
        [LogContext.PROJECTOR_NAME]: this.name,
        [LogContext.SCENE_KEY]: event.streamId.replace(/^grip-attempt:/, ""),
        [LogContext.ATTEMPT_NUM]: event.attemptNum,
        [LogContext.GLOBAL_SEQ]: event.globalSeq,
      },
      "이벤트 매핑",
    );

    return {
      objectName: payload.objects[0].class_name,
      attemptCount: 1,
      successCount: payload.grip_succeed,
      successRate: null,
    };
  }

  async upsert(tx: DrizzleTx, row: ReadObjectGripAggregateInsert): Promise<void> {
    await tx
      .insert(readObjectGripAggregate)
      .values(row)
      .onConflictDoUpdate({
        target: [readObjectGripAggregate.objectName],
        set: {
          attemptCount: sql`${readObjectGripAggregate.attemptCount} + ${row.attemptCount}`,
          successCount: sql`${readObjectGripAggregate.successCount} + ${row.successCount}`,
          successRate: sql`${readObjectGripAggregate.successRate} + ${row.successRate}`,
        },
      });
  }
}
```

### 신규 Read Model — 배선(컨트롤러/서비스/모듈)

```ts
// src/shared/database/schema/index.ts
export * from "./service/read-object-grip-aggregate";

// src/projection/projection.service.ts (수정)
type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
  objectGripAggregate: ProjectionResult;
};

@Injectable()
export class ProjectionService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly runner: CatchUpRunner,
    private readonly multimodal: MultiModalProjector,
    private readonly gripResult: GripResultProjector,
    private readonly objectGripAggregate: ObjectGripAggregateProjector,
    private readonly insertService: InsertService,
  ) {
    this.logger.setContext(ProjectionService.name);
  }

  catchUpObjectGripAggregate(): Promise<ProjectionResult> {
    return this.runner.run(this.objectGripAggregate);
  }

  async catchUpAll(): Promise<CatchUpAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_START }, "전체 투영 시작");
    const multimodal: ProjectionResult = await this.catchUpMultimodal();
    const gripResult: ProjectionResult = await this.catchUpGripResult();
    const objectGripAggregate: ProjectionResult = await this.catchUpObjectGripAggregate();
    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");
    return { multimodal, gripResult, objectGripAggregate };
  }

// src/projection/projection.controller.ts (수정)
@Post("/object-grip-aggregate")
objectGripAggregate(): Promise<ProjectionResult> {
  this.logger.info(
    {
      action: LogAction.PROJECTION_REQUEST,
      [LogContext.ROUTE]: "POST /projection/object-grip-aggregate",
    },
    "projection 요청 수신",
  );
  return this.projectionService.catchUpObjectGripAggregate();
}

// src/projection/projection.module.ts (providers 수정)
@Module({
  imports: [...],
  providers: [
    GripResultProjector,
    MultiModalProjector,
    ObjectGripAggregateProjector,
    // ...기존 providers
  ],
})
export class ProjectionModule {}
```

### 버전 교체 코드 — `src/shared/database/schema/index.ts` (modifyFile)

```typescript
export * from "./insight/insight-entity";
export * from "./insight/insight-field";
export * from "./log/log-cursor";
export * from "./log/log-event";
export * from "./service/event";
export * from "./service/projection-cursor";
export * from "./service/read-grip-result";
export * from "./service/read-multimodal";
export * from "./service/read-object-grip-aggregate-v1";
```

### 버전 교체 코드 — `src/projection/projection.service.ts` (modifyFile)

```typescript
import { Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { InsertResult, InsertService } from "@/insert/insert.service";
import { GripResultProjector } from "@/projection/projector/grip-result.projector";
import { MultiModalProjector } from "@/projection/projector/multimodal.projector";
import { ObjectGripAggregateProjector } from "@/projection/projector/object-grip-aggregate-v2.projector";
import { ProjectionResult } from "@/projection/projector/projector";
import { CatchUpRunner } from "@/projection/runner/catch-up.runner";
import { LogAction } from "@/shared/logger/logging-context";

export type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
  objectGripAggregate: ProjectionResult;
};

export type InsertAndProjectionAllResult = {
  insert: InsertResult;
  projection: CatchUpAllResult;
};

@Injectable()
export class ProjectionService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly runner: CatchUpRunner,
    private readonly multimodal: MultiModalProjector,
    private readonly gripResult: GripResultProjector,
    private readonly objectGripAggregate: ObjectGripAggregateProjector,
    private readonly insertService: InsertService,
  ) {
    this.logger.setContext(ProjectionService.name);
  }

  catchUpMultimodal(): Promise<ProjectionResult> {
    return this.runner.run(this.multimodal);
  }

  catchUpGripResult(): Promise<ProjectionResult> {
    return this.runner.run(this.gripResult);
  }

  catchUpObjectGripAggregate(): Promise<ProjectionResult> {
    return this.runner.run(this.objectGripAggregate);
  }

  async catchUpAll(): Promise<CatchUpAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_START }, "전체 투영 시작");

    const multimodal: ProjectionResult = await this.catchUpMultimodal();
    const gripResult: ProjectionResult = await this.catchUpGripResult();
    const objectGripAggregate: ProjectionResult = await this.catchUpObjectGripAggregate();

    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");

    return { multimodal, gripResult, objectGripAggregate };
  }

  async insertAllAndProjectAll(): Promise<InsertAndProjectionAllResult> {
    this.logger.info(
      { action: LogAction.PROJECTION_START },
      "전체 적재+투영 시작",
    );

    const insert: InsertResult = await this.insertService.insertToyData();
    const projection: CatchUpAllResult = await this.catchUpAll();

    this.logger.info(
      { action: LogAction.PROJECTION_DONE },
      "전체 적재+투영 완료",
    );

    return { insert, projection };
  }
}
```

### 버전 교체 코드 — `src/projection/projection.controller.ts` (modifyFile)

```typescript
import { Controller, Post } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { InsertAndProjectionAllResult, ProjectionService } from "@/projection/projection.service";
import { ProjectionResult } from "@/projection/projector/projector";
import { LogAction, LogContext } from "@/shared/logger/logging-context";

@Controller("projection")
export class ProjectionController {
  constructor(
    private readonly logger: PinoLogger,
    private readonly projectionService: ProjectionService,
  ) {
    this.logger.setContext(ProjectionController.name);
  }

  @Post("/multimodal")
  multimodal(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/multimodal",
      },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpMultimodal();
  }

  @Post("/grip-result")
  gripResult(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/grip-result",
      },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpGripResult();
  }

  @Post("/object-grip-aggregate")
  objectGripAggregate(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/object-grip-aggregate",
      },
      "v2 projection 요청 수신",
    );

    return this.projectionService.catchUpObjectGripAggregate();
  }

  @Post("/insert-all")
  insertAll(): Promise<InsertAndProjectionAllResult> {
    this.logger.info(
      { action: LogAction.PROJECTION_REQUEST },
      "projection 요청 수신",
    );

    return this.projectionService.insertAllAndProjectAll();
  }
}
```

## Guardrails (constraints)

- v1 자산(테이블/엔드포인트/프로젝터 name) 무손상
- PK (scene_key, attempt_num) 유지
- TypeScript any 금지
- 식별자 전체 단어
- DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)
- Read Model 테이블명은 read_ 접두 스네이크 케이스
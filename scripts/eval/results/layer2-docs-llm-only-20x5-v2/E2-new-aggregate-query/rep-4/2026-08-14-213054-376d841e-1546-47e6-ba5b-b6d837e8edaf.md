---
docId: analysis-376d841e-1546-47e6-ba5b-b6d837e8edaf
generatedAt: 2026-08-14T12:30:56.744Z
targetReadModel: read_object_grip_rate_v1
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: v1
  to: v2
  affectedEndpoints:
    - "POST /multimodal"
    - "POST /grip-result"
    - "POST /object-grip-rate"
    - "POST /insert-all"
evidenceSources:
  - { origin: developer-logging, anchorId: "376d841e-1546-47e6-ba5b-b6d837e8edaf" }
  - { origin: developer-logging, anchorId: "1130eb53-28ff-4894-8980-e092da5e79ec" }
  - { origin: developer-logging, anchorId: "097fb99f-ee7e-473e-bf5e-be6acc2bff0b" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_object_grip_rate_v1

> 결론(TL;DR): `read_object_grip_rate_v1`을(를) 재생성한다 — 사용자가 특정 집계 데이터(객개별 파지 성공률: 시도·성도·성도률)를 조회 요청을 세 번에 걸쳐 제출했으나, 시스템 내 Insight Card 카탈로그에 해당 Read Model 테이블이 미존하여 `insight.card.miss` 실패가 반복. (이상 유형: 카드 없는 Read Model 테이블 · 심각도: warning)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `projection.request`(level 30) 2회, `projection.batch`(level 30) 2회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `projection.event.mapped`(level 20) 60회, `-`(level 30) 5회, `projection.start`(level 30) 2회, `-`(level 20) 6회, `insert.request`(level 30) 1회, `insight.card.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insight.card.miss`(level 40) 1회, `insert.file.ok`(level 20) 60회, `projection.done`(level 30) 2회, `projection.cursor.advanced`(level 20) 2회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 12:30:54.138 | 30 | - | d321823e-6781-4144-a2ea-726e2100e1f0 | - | - | - | request completed | - |
| 12:30:54.138 | 30 | projection.batch | d321823e-6781-4144-a2ea-726e2100e1f0 | - | - | - | 배치 처리 | projector=grip-result-projector |
| 12:30:54.138 | 20 | projection.cursor.advanced | d321823e-6781-4144-a2ea-726e2100e1f0 | - | - | - | 커서 이동 | projector=grip-result-projector |
| 12:30:54.138 | 30 | projection.done | d321823e-6781-4144-a2ea-726e2100e1f0 | - | - | - | catch-up 완료 | projector=grip-result-projector |
| 12:30:54.141 | 30 | insight.card.request | 376d841e-1546-47e6-ba5b-b6d837e8edaf | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 12:30:54.142 | 40 | insight.card.miss | 376d841e-1546-47e6-ba5b-b6d837e8edaf | - | - | - | insight 카드 없음: 객체(object_name)별 파지 성공률을 한 번에 조회하고 싶다. 시도 수, 성공 수, 성공률이 필요하다. ← 트립 앵커 | - |
| 12:30:54.142 | 30 | - | 376d841e-1546-47e6-ba5b-b6d837e8edaf | - | - | - | request completed | - |
| 12:30:54.447 | 30 | insight.card.request | 1130eb53-28ff-4894-8980-e092da5e79ec | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 12:30:54.449 | 40 | insight.card.miss | 1130eb53-28ff-4894-8980-e092da5e79ec | - | - | - | insight 카드 없음: 객체(object_name)별 파지 성공률을 한 번에 조회하고 싶다. 시도 수, 성공 수, 성공률이 필요하다. | - |
| 12:30:54.449 | 30 | - | 1130eb53-28ff-4894-8980-e092da5e79ec | - | - | - | request completed | - |
| 12:30:54.753 | 30 | insight.card.request | 097fb99f-ee7e-473e-bf5e-be6acc2bff0b | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 12:30:54.754 | 40 | insight.card.miss | 097fb99f-ee7e-473e-bf5e-be6acc2bff0b | - | - | - | insight 카드 없음: 객체(object_name)별 파지 성공률을 한 번에 조회하고 싶다. 시도 수, 성공 수, 성공률이 필요하다. | - |
| 12:30:54.754 | 30 | - | 097fb99f-ee7e-473e-bf5e-be6acc2bff0b | - | - | - | request completed | - |

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
- (level 40, `insight.card.miss`) insight 카드 없음: 객체(object_name)별 파지 성공률을 한 번에 조회하고 싶다. 시도 수, 성공 수, 성공률이 필요하다. ← 트립 앵커 → 기존 Read Model 스키마에는 object_name 단위로 집계된 시도·성도·성도률 테이블이 미존. [corr:376d841e-1546-47e6-ba5b-b6d837e8edaf]
- (level 40, `insight.card.miss`) insight 카드 없음: 객체(object_name)별 파지 성공률을 한 번에 조회하고 싶다. 시도 수, 성공 수, 성공률이 필요하다. → 반 조회 실패가 반복되며, GROUP BY 산출값 요구는 기존 행 단위 Read Model로는 충족할 수 없는. [corr:1130eb53-28ff-4894-8980-e092da5e79ec]
- (level 40, `insight.card.miss`) insight 카드 없음: 객체(object_name)별 파지 성공률을 한 번에 조회하고 싶다. 시도 수, 성공 수, 성공률이 필요하다. → Insight Card 카탈로그에 해당 Read Model 테이블이 미존하여 insight.card.miss 실패가 반복. [corr:097fb99f-ee7e-473e-bf5e-be6acc2bff0b]
- read_grip_result 스키마의 object_name과 grip_succeed는 행 단위(키: scene_key, attempt_num)로 저장되어, object별 집계(sum/count/rate)을 직접 조회할 수 없음. [corr:376d841e-1546-47e6-ba5b-b6d837e8edaf]
- GripResultProjector.map() in src/projection/projector/grip-result.projector.ts는 objectName: payload.objects[0].class_name과 gripSucceed: payload.grip_succeed만 매핑하여, 집계 로직이 결결. [corr:1130eb53-28ff-4894-8980-e092da5e79ec]
- src/shared/database/schema/index.ts의 export 패턴에 read_object_grip_rate_v1 스키마가 미존, 신규 테이블 생성이 필연. [corr:097fb99f-ee7e-473e-bf5e-be6acc2bff0b]

### Decision Drivers
- Aggregation requirement (GROUP BY) not supported by row-level models.
- Repeated insight.card.miss indicates catalog gap.
- Existing projector architecture supports multi-table upserts.
- Version control needed for DB schema change.

### Considered Options
#### Existing Enhancement (Multi-table Upsert in GripResultProjector)
- 접근: GripResultProjector.upsert() 수정하여 read_object_grip_rate_v1 동시 upsert 적용. total_attempts는 +1, success_attempts는 gripSucceed 더하기, success_rate는 조회 시 계산 또는 별도 업데이트.
- 제안 필드: object_name, total_attempts, success_attempts, success_rate
- 트레이드오프: 단일 프로젝터로 집계 로직 통합으로 DB write 부하 증가하나 파이프라인 변경이 최소화됨. 신규 Drizzle 스키마 export 필연.
```typescript
await tx.insert(readObjectGripRateV1).values({ objectName: row.objectName, totalAttempts: 1n, successAttempts: BigInt(row.gripSucceed), successRate: null }).onConflictDoUpdate({ target: [readObjectGripRateV1.objectName], set: { totalAttempts: readObjectGripRateV1.totalAttempts + 1n, successAttempts: readObjectGripRateV1.successAttempts + row.gripSucceed } });
```

#### New Separate Projector (Decoupling Aggregation)
- 접근: ObjectGripRateProjector 신규 생성. EventStoreReader에서 payload 직접 파싱하여 object별 집계 로직 구현. 별도 projection lane 연동.
- 제안 필드: object_name, total_attempts, success_attempts, success_rate
- 트레이드오프: 관심 분리(clean architecture)이나 추가 프로젝터 등록과 catch-up 순서 관리 복잡성 증가. 버전 switch 연동 필요로 유지보수 오버헤드 상승.
```typescript
// ObjectGripRateProjector.map() payload.objects.forEach(obj => { rateMap.set(obj.class_name, { total: (rateMap.get(obj.class_name)?.total || 0) + 1, success: (rateMap.get(obj.class_name)?.success || 0) + event.payload.grip_succeed }); })
```

### Decision Outcome
Existing Enhancement (Multi-table Upsert in GripResultProjector). 단일 프로젝터 패턴 유지, 파이프라인 변경 최소화, 직접 집계 충족.

### Consequences
- (+) object별 성공률 조회 지원
- (+) 기존 projector 아키텍처 호환성 유지
- (−) per-event DB write 부하 증가
- (−) schema/index.ts export 및 migrationSql 연동 작업 필연

### Non-Goals
- Zod 거절 데이터 유입 격리
- read_multimodal URI 매핑
- 실시간 스트림 집계(배치 투영 기준)

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

- 대상: `read_object_grip_rate_v1` · 키: object_name · 원천 이벤트: GripAttemptRecorded

```sql
CREATE TABLE read_object_grip_rate_v1 (
  object_name varchar NOT NULL,
  total_attempts bigint,
  success_attempts bigint,
  success_rate double precision,
  PRIMARY KEY (object_name)
);
```

### 필드

```mschema
# Table: read_object_grip_rate_v1
[
(object_name:varchar, 파지 대상 객개 식별자 (payload.objects[0].class_name), 집계 차원 키, Primary Key),
(total_attempts:bigint, 누적 시도 수 (1:1 이벤트 적재 시 +1 갱신)),
(success_attempts:bigint, 누적 성공 수 (payload.grip_succeed === 1 일 경우 +1 갱신)),
(success_rate:double precision, 성도률 (적재 시 null, 조회 시 success_attempts / total_attempts 계산 또는 별도 업데이트))
]
```

### 투영 매핑 명세 (이벤트 → 컬럼)

> upsert 키: object_name · 리플레이: projection_cursor 초기화 시 0 설정. catch-up 전 재투영 시 upsert가 멱등해야 하되, aggregate(+1) 로직은 cumulative sum이므로 cursor 기준 이벤트 적용 순서 유지 및 중복 적용 방지(예: 이미 투영된 event skip 또는 state merge).

| 원천 이벤트 | payload 필드 | 컬럼 | 변환 |
| --- | --- | --- | --- |
| GripAttemptRecorded | objects[].class_name | object_name | verbatim |

파생 컬럼(이벤트 payload 아님):
- `total_attempts` ← event_count per object_name (upsert +1)
- `success_attempts` ← sum(grip_succeed) per object_name (upsert +1 if grip_succeed==1)
- `success_rate` ← success_attempts / total_attempts (null on load)

### Insight 카드 등록 (Insight Read DB 동기화)

> DDL 적용 시 아래 카드 등록도 함께 실행한다 — 다음 분석부터 신규 Read Model 이 LLM 컨텍스트에 노출된다.

```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_object_grip_rate_v1', 'read_model', '객개(object_name)별 파지 성공률 집계 조회를 위한 전용 Read Model 테이블. 시도 수, 성공 수, 성공률을 원천 이벤트 적재 시 누적 갱신하여 Insight 카드 시스템의 O(1) 단건 조회 요구를 충족.', 'object_name')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_object_grip_rate_v1', 'object_name', 'varchar', '파지 대상 객개 식별자 (payload.objects[0].class_name), 집계 차원 키', 1),
  ('read_object_grip_rate_v1', 'total_attempts', 'bigint', '누적 시도 수 (1:1 이벤트 적재 시 +1 갱신)', 2),
  ('read_object_grip_rate_v1', 'success_attempts', 'bigint', '누적 성공 수 (payload.grip_succeed === 1 일 경우 +1 갱신)', 3),
  ('read_object_grip_rate_v1', 'success_rate', 'double precision', '성도률 (적재 시 null, 조회 시 success_attempts / total_attempts 계산 또는 별도 업데이트)', 4)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased (v1 → v2)

#### Added
- 신규 Read Model 테이블 read_object_grip_rate_v1 및 ObjectGripRateProjector 배선
- /object-grip-rate 라우트 및 ProjectionService.catchUpObjectGripRateV2 메서드

### 마이그레이션 절차

- 하위호환 변경: 신규 테이블·라우트는 순수 추가(additive) 변경으로 기존 v1 read_grip_result/read_multimodal 조회/투영 경로 무손상; 기존 DI provider 배열 및 export 패턴만 확장, 하위 호환성 보장
- 파괴적 변경: 없음
- 컷오버 전 테스트: 실행 /object-grip-rate 라우트 대 확정 데이터셋; verify object_name별 total_attempts와 success_attempts가 예상 집계치 일치. confirm migration SQL read_object_grip_rate_v1 생성이 성공한 target database.
- 롤백 창/조건: cutover 실패 시 drop read_object_grip_rate_v1, remove ObjectGripRateProjector DI wiring from ProjectionService/Controller, revert /object-grip-rate 라우트 추가.
- Insight 카드 등록: §2의 카드 등록 SQL을 DDL과 함께 적용(카탈로그 동기화)

### 사유·호환성

- 사유: 기존 v1 GripResultProjector는 (scene_key, attempt_num) 키로 투영하며 payload.objects[0].class_name만 추출해 객개별 집계 성공률을 계산할 수 없음 [corr:376d841e-1546-47e6-ba5b-b6d837e8edaf]. 시스템 내 Insight Card 카탈로그에 해당 Read Model 테이블이 미존하여 insight.card.miss 실패가 반복. 신규 ObjectGripRateProjector와 read_object_grip_rate_v1 테이블을 배선으로 객개별 누적 시도·성도·성도률 집계를 지원.
- 트리거 근거: 12:30:54.142 | 40 | insight.card.miss | 376d841e-1546-47e6-ba5b-b6d837e8edaf | - | - | - | insight 카드 없음: 객체(object_name)별 파지 성공률을 한 번에 조회하고 싶다. 시도 수, 성공 수, 성공률이 필요하다. ← 트립 앵커
- v1 호환성: 기존 read_grip_result 및 read_multimodal 테이블·라우트·프로젝터 클래스/이름은 무손상. 신규 /object-grip-rate 라우트와 DI 배선은 순수 추가(additive) 변경으로 v1 호환성 유지.

### 변경 파일

- `src/shared/database/schema/index.ts` (modifyFile) — 신규 read_object_grip_rate_v1 스키마 export 배선
- `src/projection/projection.service.ts` (modifyFile) — ObjectGripRateProjector 주입, catchUpAll/insertAllAndProjectAll 결과 타입 및 메서드 배선
- `src/projection/projection.controller.ts` (modifyFile) — /object-grip-rate 라우트 배선 (확정 설계 경로)

## Optional — 부속 자료(컨텍스트 축소 시 생략 가능)

### 신규 Read Model — Drizzle 스키마

```ts
import { bigint, doublePrecision, pgTable, primaryKey, varchar } from 'drizzle-orm/pg-core';

export const readObjectGripRate = pgTable(
  "read_object_grip_rate_v1",
  {
    objectName: varchar("object_name").notNull(),
    totalAttempts: bigint("total_attempts", { mode: "number" }).notNull(),
    successAttempts: bigint("success_attempts", { mode: "number" }).notNull(),
    successRate: doublePrecision("success_rate"),
  },
  (t) => [primaryKey({ columns: [t.objectName] })],
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
import { readObjectGripRate } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';
import { sql } from 'drizzle-orm';

type ReadObjectGripRateInsert = InferInsertModel<typeof readObjectGripRate>;

@Injectable()
export class ObjectGripRateProjector implements Projector<ReadObjectGripRateInsert> {
  readonly name: string = "object-grip-rate-projector";

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(ObjectGripRateProjector.name);
  }

  map(event: EventStoreEventRow): ReadObjectGripRateInsert {
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

      throw new Error(`object-grip-rate map: empty objects in event ${event.eventId}`);
    }

    this.logger.debug(
      {
        action: LogAction.EVENT_MAPPED,
        [LogContext.PROJECTOR_NAME]: this.name,
        [LogContext.GLOBAL_SEQ]: event.globalSeq,
      },
      "이벤트 매핑",
    );

    const objectName = payload.objects[0].class_name;
    const isSucceed = payload.grip_succeed === 1;

    return {
      objectName,
      totalAttempts: 1,
      successAttempts: isSucceed ? 1 : 0,
      successRate: null,
    };
  }

  async upsert(tx: DrizzleTx, row: ReadObjectGripRateInsert): Promise<void> {
    await tx
      .insert(readObjectGripRate)
      .values(row)
      .onConflictDoUpdate({
        target: [readObjectGripRate.objectName],
        set: {
          totalAttempts: sql`${readObjectGripRate.totalAttempts} + excluded.${readObjectGripRate.totalAttempts.name}`,
          successAttempts: sql`${readObjectGripRate.successAttempts} + excluded.${readObjectGripRate.successAttempts.name}`,
        },
      });
  }
}
```

### 신규 Read Model — 배선(컨트롤러/서비스/모듈)

```ts
// src/shared/database/schema/index.ts
export * from "./service/read-object-grip-rate-v1";

// src/projection/projection.service.ts (의존성 주입 + catchUp 메서드)
constructor(
  // ... 기존 의존성 ...
  private readonly objectGripRate: ObjectGripRateProjector,
) {
  this.logger.setContext(ProjectionService.name);
}
catchUpObjectGripRate(): Promise<ProjectionResult> {
  return this.runner.run(this.objectGripRate);
}

// src/projection/projection.controller.ts (라우트 등록)
@Post("/object-grip-rate")
objectGripRate(): Promise<ProjectionResult> {
  this.logger.info(
    {
      action: LogAction.PROJECTION_REQUEST,
      [LogContext.ROUTE]: "POST /projection/object-grip-rate",
    },
    "projection 요청 수신",
  );

  return this.projectionService.catchUpObjectGripRate();
}

// src/projection/projection.module.ts (providers 등록)
@Module({
  // ... 기존 providers ...
  providers: [
    // ... 기존 ...
    ObjectGripRateProjector,
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
export * from "./service/read-object-grip-rate-v1";
```

### 버전 교체 코드 — `src/projection/projection.service.ts` (modifyFile)

```typescript
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { ObjectGripRateProjector } from '@/projection/projector/object-grip-rate.projector';
import { ProjectionResult } from '@/projection/projector/projector';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';
import { LogAction } from '@/shared/logger/logging-context';

export type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
  objectGripRateV2: ProjectionResult;
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
    private readonly objectGripRateV2: ObjectGripRateProjector,
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

  catchUpObjectGripRateV2(): Promise<ProjectionResult> {
    return this.runner.run(this.objectGripRateV2);
  }

  async catchUpAll(): Promise<CatchUpAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_START }, "전체 투영 시작");

    const multimodal: ProjectionResult = await this.catchUpMultimodal();
    const gripResult: ProjectionResult = await this.catchUpGripResult();
    const objectGripRateV2: ProjectionResult = await this.catchUpObjectGripRateV2();

    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");

    return { multimodal, gripResult, objectGripRateV2 };
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
import { Controller, Post } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertAndProjectionAllResult, ProjectionService } from '@/projection/projection.service';
import { ProjectionResult } from '@/projection/projector/projector';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

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

  @Post("/object-grip-rate")
  objectGripRate(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/object-grip-rate",
      },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpObjectGripRateV2();
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
---
docId: analysis-0c57d8eb-3d3b-4af9-addc-8c192f70357d
generatedAt: 2026-08-15T00:42:08.073Z
targetReadModel: read_object_success_rate_v1
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: v1
  to: v2
  affectedEndpoints:
    - "POST /multimodal"
    - "POST /grip-result"
    - "POST /object-success-rate"
    - "POST /insert-all"
evidenceSources:
  - { origin: developer-logging, anchorId: "0c57d8eb-3d3b-4af9-addc-8c192f70357d" }
  - { origin: developer-logging, anchorId: "48a3939a-7c41-4eb2-8277-53497695df8c" }
  - { origin: developer-logging, anchorId: "db06a407-6496-4c54-952f-ae6e0ad92630" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_object_success_rate_v1

> 결론(TL;DR): `read_object_success_rate_v1`을(를) 재생성한다 — 사용자가 object_name별 파지 성공률(시도 수, 성공 수, 성공률)을 조회하는 Insight Card를 요청하지만, 해당 카드가 미등록되어 실패(insight.card.miss)가 반복된다. (이상 유형: 카드 없는 Read Model 테이블 · 심각도: warning)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `projection.request`(level 30) 2회, `projection.batch`(level 30) 2회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `projection.event.mapped`(level 20) 60회, `-`(level 30) 5회, `projection.start`(level 30) 2회, `-`(level 20) 6회, `insert.request`(level 30) 1회, `insight.card.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insight.card.miss`(level 40) 1회, `insert.file.ok`(level 20) 60회, `projection.done`(level 30) 2회, `projection.cursor.advanced`(level 20) 2회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 00:42:00.328 | 20 | projection.cursor.advanced | c76ca5f4-247a-44ba-8d15-46716ddfd160 | - | - | - | 커서 이동 | projector=grip-result-projector |
| 00:42:00.328 | 30 | projection.done | c76ca5f4-247a-44ba-8d15-46716ddfd160 | - | - | - | catch-up 완료 | projector=grip-result-projector |
| 00:42:00.328 | 30 | - | c76ca5f4-247a-44ba-8d15-46716ddfd160 | - | - | - | request completed | - |
| 00:42:00.328 | 30 | projection.batch | c76ca5f4-247a-44ba-8d15-46716ddfd160 | - | - | - | 배치 처리 | projector=grip-result-projector |
| 00:42:00.331 | 30 | insight.card.request | 0c57d8eb-3d3b-4af9-addc-8c192f70357d | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 00:42:00.332 | 40 | insight.card.miss | 0c57d8eb-3d3b-4af9-addc-8c192f70357d | - | - | - | insight 카드 없음: 객체(object_name)별 파지 성공률을 한 번에 조회하고 싶다. 시도 수, 성공 수, 성공률이 필요하다. ← 트립 앵커 | - |
| 00:42:00.332 | 30 | - | 0c57d8eb-3d3b-4af9-addc-8c192f70357d | - | - | - | request completed | - |
| 00:42:00.639 | 30 | insight.card.request | 48a3939a-7c41-4eb2-8277-53497695df8c | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 00:42:00.642 | 40 | insight.card.miss | 48a3939a-7c41-4eb2-8277-53497695df8c | - | - | - | insight 카드 없음: 객체(object_name)별 파지 성공률을 한 번에 조회하고 싶다. 시도 수, 성공 수, 성공률이 필요하다. | - |
| 00:42:00.642 | 30 | - | 48a3939a-7c41-4eb2-8277-53497695df8c | - | - | - | request completed | - |
| 00:42:00.948 | 30 | insight.card.request | db06a407-6496-4c54-952f-ae6e0ad92630 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 00:42:00.950 | 40 | insight.card.miss | db06a407-6496-4c54-952f-ae6e0ad92630 | - | - | - | insight 카드 없음: 객체(object_name)별 파지 성공률을 한 번에 조회하고 싶다. 시도 수, 성공 수, 성공률이 필요하다. | - |
| 00:42:00.951 | 30 | - | db06a407-6496-4c54-952f-ae6e0ad92630 | - | - | - | request completed | - |

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
- (level 30, `insight.card.request`) insight 카드 단건 조회 요청 수신 → 기존 Read Model의 row-level 구조로는 object_name별 집계(시도 수/성 성공 수) 및 성공률 산출을 직접 제공하지. [corr:0c57d8eb-3d3b-4af9-addc-8c192f70357d]
- (level 40, `insight.card.miss`) insight 카드 없음: 객체(object_name)별 파지 성공률을 한 번에 조회하고 싶다. 시도 수, 성공 수, 성공률이 필요하다. ← 트립 앵커 → 기존 Read Model의 row-level 구조로는 object_name별 집계(시도 수/성 성공 수) 및 성공률 산출을 직접 제공하지. [corr:0c57d8eb-3d3b-4af9-addc-8c192f70357d]
- (level 30, `insight.card.request`) insight 카드 단건 조회 요청 수신 → 기존 Read Model의 row-level 구조로는 object_name별 집계(시도 수/성 성공 수) 및 성공률 산출을 직접 제공하지. [corr:48a3939a-7c41-4eb2-8277-53497695df8c]
- (level 40, `insight.card.miss`) insight 카드 없음: 객체(object_name)별 파지 성공률을 한 번에 조회하고 싶다. 시도 수, 성공 수, 성공률이 필요하다. → 기존 Read Model의 row-level 구조로는 object_name별 집계(시도 수/성 성공 수) 및 성공률 산출을 직접 제공하지. [corr:48a3939a-7c41-4eb2-8277-53497695df8c]
- (level 30, `insight.card.request`) insight 카드 단건 조회 요청 수신 → 기존 Read Model의 row-level 구조로는 object_name별 집계(시도 수/성 성공 수) 및 성공률 산출을 직접 제공하지. [corr:db06a407-6496-4c54-952f-ae6e0ad92630]
- (level 40, `insight.card.miss`) insight 카드 없음: 객체(object_name)별 파지 성공률을 한 번에 조회하고 싶다. 시도 수, 성공 수, 성공률이 필요하다. → 기존 Read Model의 row-level 구조로는 object_name별 집계(시도 수/성 성공 수) 및 성공률 산출을 직접 제공하지. [corr:db06a407-6496-4c54-952f-ae6e0ad92630]
- read_grip_result 스키마의 object_name과 grip_succeed는 (scene_key, attempt_num) 단위 행(row-level)으로 기록만 보유 [corr:0c57d8eb-3d3b-4af9-addc-8c192f70357d].
- GripResultProjector.map() (src/projection/projector/grip-result.projector.ts) 은 objectName: payload.objects[0].class_name, gripSucceed: payload.grip_succeed 만 매핑, 누적 집계 로직 부재 [corr:48a3939a-7c41-4eb2-8277-53497695df8c].
- 요청 msg 구체 의도('object_name별 파지 성공률, 시도 수/성 성공 수') 드러나므로 Read Model 부족 신호 판정 [corr:db06a407-6496-4c54-952f-ae6e0ad92630].
- read_multimodal 의 image2dUri, videoUri 는 현재 projector 가 null 로 둠, 성공률 조회와 무관 [corr:0c57d8eb-3d3b-4af9-addc-8c192f70357d].

### Decision Drivers
- Query pattern mismatch (row-level vs aggregated)
- CQRS separation of concerns
- Performance/Storage tradeoff
- Schema evolution compatibility

### Considered Options
#### 기각 대안: GripResultProjector 내 aggregate 보강
- 접근: GripResultProjector 의 upsert 로직 보강으로 read_grip_result 내 aggregate 컬럼 추가.
- 제안 필드: total_attempts, success_count, success_rate
- 트레이드오프: 단일 테이블 결합, upsert 복잡성 증가, CQRS 원칙 위배 (Driver 2/3 졌음)
```typescript
await tx.insert(readGripResult).values({ ... }).onConflictDoUpdate({ set: { totalAttempts: row.totalAttempts + 1, successCount: row.gripSucceed === 1 ? row.successCount + 1 : row.successCount } });
```

#### 권장 옵션: 신규 Read Model (read_object_success_rate_v1) + Aggregator Projector
- 접근: 신규 read_object_success_rate_v1 테이블 생성 및 별도 Aggregator Projector 등록.
- 제안 필드: object_name, total_attempts, success_count, success_rate
- 트레이드오프: migrationSql 필요, projector wiring 추가, but decouples aggregation from raw projection, supports efficient range queries (Driver 1/2/3/4 충족)
```typescript
CREATE TABLE read_object_success_rate_v1 (object_name varchar NOT NULL, total_attempts bigint, success_count bigint, success_rate numeric(16,4), PRIMARY KEY (object_name));
```

#### 기각 대안: client-side aggregation via read_grip_result full scan
- 접근: client-side aggregation via read_grip_result full scan.
- 제안 필드: -
- 트레이드오프: DB load 증가, latency 비예 predictable, CQRS separation of concerns violation (Driver 1/4 졌음)
```typescript
SELECT object_name, COUNT(*) as total_attempts, SUM(grip_succeed) as success_count FROM read_grip_result GROUP BY object_name;
```

### Decision Outcome
신규 Read Model (read_object_success_rate_v1) + Aggregator Projector

### Consequences
- (+) Efficient aggregation queries for success rate insights.
- (+) Clear schema boundary decoupling raw projection from business logic.
- (−) Requires new table migration and projector wiring overhead.
- (−) Initial catch-up computation cost during first aggregation run.

### Non-Goals
- Fixing read_multimodal URI nulls
- Handling poison events in this scope

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

- 대상: `read_object_success_rate_v1` · 키: object_name · 원천 이벤트: GripAttemptRecorded

```sql
CREATE TABLE read_object_success_rate_v1 (
  object_name varchar NOT NULL,
  total_attempts bigint,
  success_count bigint,
  success_rate doublePrecision,
  PRIMARY KEY (object_name)
);
```

### 필드

```mschema
# Table: read_object_success_rate_v1
[
(object_name:varchar, 파지 대상 객체명 (payload.objects[0].class_name). Primary Key., Primary Key),
(total_attempts:bigint, 해당 object_name 의 총 시도 수. 누적 갱신.),
(success_count:bigint, 해당 object_name 의 성공 시도 수. 누적 갱신.),
(success_rate:doublePrecision, success_count / total_attempts. 측정값이므로 doublePrecision 사용.)
]
```

### 투영 매핑 명세 (이벤트 → 컬럼)

> upsert 키: object_name · 리플레이: projection_cursor 초기화 시 반드시 0 또는 null 상태로 재시작해야 하며, catch-up 전체 재투영 시 upsert는 멱id(up) 전제 조건으로 prev 값 누적 갱신에 의존하므로 동키 충돌/과업 처리가 필히 검증되어야.

| 원천 이벤트 | payload 필드 | 컬럼 | 변환 |
| --- | --- | --- | --- |
| GripAttemptRecorded | objects[0].class_name | object_name | verbatim |

파생 컬럼(이벤트 payload 아님):
- `total_attempts` ← 1 per event, cumulative upsert (prev + 1)
- `success_count` ← grip_succeed == 1 ? 1 : 0, cumulative upsert (prev + val)
- `success_rate` ← total_attempts > 0 ? success_count / total_attempts : 0.0

### Insight 카드 등록 (Insight Read DB 동기화)

> DDL 적용 시 아래 카드 등록도 함께 실행한다 — 다음 분석부터 신규 Read Model 이 LLM 컨텍스트에 노출된다.

```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_object_success_rate_v1', 'read_model', '객체(object_name)별 파지 성공률(시도 수, 성공 수, 성공률)을 한 번에 조회하는 Insight Card를 지원. 기존 Read Model이 시도 단위(row-based)로 저장하여 집계(aggregation) 요구사항을 직접 충족할 수 없음.', 'object_name')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_object_success_rate_v1', 'object_name', 'varchar', '파지 대상 객체명 (payload.objects[0].class_name). Primary Key.', 1),
  ('read_object_success_rate_v1', 'total_attempts', 'bigint', '해당 object_name 의 총 시도 수. 누적 갱신.', 2),
  ('read_object_success_rate_v1', 'success_count', 'bigint', '해당 object_name 의 성공 시도 수. 누적 갱신.', 3),
  ('read_object_success_rate_v1', 'success_rate', 'doublePrecision', 'success_count / total_attempts. 측정값이므로 doublePrecision 사용.', 4)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased (v1 → v2)

#### Added
- 신규 Read Model 테이블 read_object_success_rate_v1 (object_name, total_attempts, success_count, success_rate)
- ObjectSuccessRateProjector 구현 및 cumulative upsert logic
- /projection/object-success-rate 라우트 엔드포인트
#### Fixed
- insight.card.miss 재시도 현안 해결: object_name별 성공률 카드 미등록 원천 차단

### 마이그레이션 절차

- 하위호환 변경: 신규 테이블은 additive 키(object_name) 구성. 기존 v1 scene_key/attempt_num 키/라우트/프로젝터는 100% 보존.; DI 주입 및 라우트 확장은 기존 메서드/타입 서명 무손상.
- 파괴적 변경: 없음
- 컷오버 전 테스트: 1. fresh dataset catchUpObjectSuccessRate() 실행 시 total_attempts, success_count, success_rate 누적 갱신 정합성 검증.
2. 동시성 upsert race condition 테스트: 동동 stream_id/object_name 이벤트 병처리 시 select→insert atomicity 보장.
3. 기존 insight.card.request fallback 라우트/메서드 호환성 확인.
- 롤백 창/조건: DROP TABLE read_object_success_rate_v1; ProjectionService constructor objectSuccessRate 주입 제거; ProjectionController @Post("/object-success-rate") 메서드 삭제; schema/index.ts export revert.
- Insight 카드 등록: §2의 카드 등록 SQL을 DDL과 함께 적용(카탈로그 동기화)

### 사유·호환성

- 사유: 기존 Read Model 컬렉션에는 object_name별 누적 시도·성 성공률 집계 카드가 미등록되어, 사용자의 요청이 insight.card.miss로 유동되며 재시도 실패가 반복된다 [corr:0c57d8eb...]. v1 GripResultProjector는 장면/시도 단위 1:1 매핑만 수행하므로 다중 시도의 객별 성공률 추적을 위한 Read Model 테이블이 필연하다. 신규 v2 테이블 read_object_success_rate_v1은 object_name을 Primary Key로, total_attempts, success_count, success_rate를 누적 갱신 필드로 구성한다.
- 트리거 근거: 00:42:00.332 | 40 | insight.card.miss | 0c57d8eb-3d3b-4af9-addc-8c192f70357d | - | - | - | insight 카드 없음: 객체(object_name)별 파지 성공률을 한 번에 조회하고 싶다. 시도 수, 성공 수, 성공률이 필요하다. ← 트립 앵커
- v1 호환성: 기존 v1 테이블·엔드포인트·프로젝터 클래스/name은 수정·삭제 금지. 변경은 오직 '추가'다 — 새 테이블(read_object_success_rate_v1), 새 프로젝터(ObjectSuccessRateProjector), 새 라우트(/object-success-rate), 새 서비스 메서드(catchUpObjectSuccessRate). 기존 DI/라우트 파일은 한 줄 추가만 수행하며 changeKind=modifyFile, 기존 코드는 보존.

### 변경 파일

- `src/shared/database/schema/index.ts` (modifyFile) — 신규 테이블 export 추가. 기존 export 라인은 보존.
- `src/projection/projection.service.ts` (modifyFile) — 신규 프로젝터 DI 주입 및 catchUpObjectSuccessRate() 메서드 추가. 기존 import/constructor/메서드는 보존.
- `src/projection/projection.controller.ts` (modifyFile) — 신규 라우트 /object-success-rate 추가. 기존 @Post/메서드는 보존.

## Optional — 부속 자료(컨텍스트 축소 시 생략 가능)

### 신규 Read Model — Drizzle 스키마

```ts
import { bigint, pgTable, primaryKey, varchar, doublePrecision } from 'drizzle-orm/pg-core';

export const readObjectSuccessRate = pgTable(
  "read_object_success_rate_v1",
  {
    objectName: varchar("object_name").notNull(),
    totalAttempts: bigint("total_attempts", { mode: "number" }).notNull(),
    successCount: bigint("success_count", { mode: "number" }).notNull(),
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
import { readObjectSuccessRate } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

import { sql } from 'drizzle-orm';

type ReadObjectSuccessRateInsert = InferInsertModel<typeof readObjectSuccessRate>;

@Injectable()
export class ObjectSuccessRateProjector implements Projector<ReadObjectSuccessRateInsert> {
  readonly name: string = "object-success-rate-projector";

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(ObjectSuccessRateProjector.name);
  }

  map(event: EventStoreEventRow): ReadObjectSuccessRateInsert {
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

      throw new Error(
        `object-success-rate map: empty objects in event ${event.eventId}`,
      );
    }

    const objectName = payload.objects[0].class_name;
    const succeed = payload.grip_succeed === 1 ? 1 : 0;

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
      objectName,
      totalAttempts: 1,
      successCount: succeed,
      successRate: succeed / 1,
    };
  }

  async upsert(tx: DrizzleTx, row: ReadObjectSuccessRateInsert): Promise<void> {
    await tx
      .insert(readObjectSuccessRate)
      .values(row)
      .onConflictDoUpdate({
        target: [readObjectSuccessRate.objectName],
        set: {
          totalAttempts: sql`${readObjectSuccessRate.totalAttempts} + ${row.totalAttempts}`,
          successCount: sql`${readObjectSuccessRate.successCount} + ${row.successCount}`,
          successRate: sql`(CAST(${readObjectSuccessRate.successCount} + ${row.successCount}) AS DOUBLE PRECISION) / (${readObjectSuccessRate.totalAttempts} + ${row.totalAttempts})`,
        },
      });
  }
}
```

### 신규 Read Model — 배선(컨트롤러/서비스/모듈)

```ts
// src/shared/database/schema/index.ts
export * from "./insight/insight-entity";
export * from "./insight/insight-field";
export * from "./log/log-cursor";
export * from "./log/log-event";
export * from "./service/event";
export * from "./service/projection-cursor";
export * from "./service/read-grip-result";
export * from "./service/read-multimodal";
export * from "./service/read-object-success-rate";

// src/projection/projection.service.ts
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { ObjectSuccessRateProjector } from '@/projection/projector/object-success-rate.projector';
import { ProjectionResult } from '@/projection/projector/projector';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';
import { LogAction } from '@/shared/logger/logging-context';

export type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
  objectSuccessRate: ProjectionResult;
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
    private readonly objectSuccessRate: ObjectSuccessRateProjector,
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

  catchUpObjectSuccessRate(): Promise<ProjectionResult> {
    return this.runner.run(this.objectSuccessRate);
  }

  async catchUpAll(): Promise<CatchUpAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_START }, "전체 투영 시작");

    const multimodal: ProjectionResult = await this.catchUpMultimodal();
    const gripResult: ProjectionResult = await this.catchUpGripResult();
    const objectSuccessRate: ProjectionResult = await this.catchUpObjectSuccessRate();

    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");

    return { multimodal, gripResult, objectSuccessRate };
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

// src/projection/projection.controller.ts
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

  @Post("/object-success-rate")
  objectSuccessRate(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/object-success-rate",
      },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpObjectSuccessRate();
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
export * from "./service/read-object-success-rate-v1";
```

### 버전 교체 코드 — `src/projection/projection.service.ts` (modifyFile)

```typescript
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { ObjectSuccessRateProjector } from '@/projection/projector/object-success-rate.projector';
import { ProjectionResult } from '@/projection/projector/projector';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';
import { LogAction } from '@/shared/logger/logging-context';

export type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
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
    private readonly objectSuccessRate: ObjectSuccessRateProjector,
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

  catchUpObjectSuccessRate(): Promise<ProjectionResult> {
    return this.runner.run(this.objectSuccessRate);
  }

  async catchUpAll(): Promise<CatchUpAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_START }, "전체 투영 시작");

    const multimodal: ProjectionResult = await this.catchUpMultimodal();
    const gripResult: ProjectionResult = await this.catchUpGripResult();

    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");

    return { multimodal, gripResult };
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
      { action: LogAction.PROJECTION_REQUEST, [LogContext.ROUTE]: "POST /projection/multimodal" },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpMultimodal();
  }

  @Post("/grip-result")
  gripResult(): Promise<ProjectionResult> {
    this.logger.info(
      { action: LogAction.PROJECTION_REQUEST, [LogContext.ROUTE]: "POST /projection/grip-result" },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpGripResult();
  }

  @Post("/object-success-rate")
  objectSuccessRate(): Promise<ProjectionResult> {
    this.logger.info(
      { action: LogAction.PROJECTION_REQUEST, [LogContext.ROUTE]: "POST /projection/object-success-rate" },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpObjectSuccessRate();
  }

  @Post("/insert-all")
  insertAll(): Promise<InsertAndProjectionAllResult> {
    this.logger.info(
      { action: LogAction.PROJECTION_REQUEST, [LogContext.ROUTE]: "POST /projection/insert-all" },
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
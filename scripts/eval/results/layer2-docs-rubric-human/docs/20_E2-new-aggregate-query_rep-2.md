---
docId: analysis-024af7c0-7847-4664-a276-a9680c7461a2
generatedAt: 2026-08-11T16:22:55.252Z
targetReadModel: read_object_grip_stats
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: v1
  to: v2
  affectedEndpoints:
    - "POST /multimodal"
    - "POST /grip-result"
    - "POST /object-grip-stats"
    - "POST /insert-all"
evidenceSources:
  - { origin: developer-logging, anchorId: "024af7c0-7847-4664-a276-a9680c7461a2" }
  - { origin: developer-logging, anchorId: "d170f681-70c5-48c2-80ca-8b07b515942f" }
  - { origin: developer-logging, anchorId: "5852f519-2ac2-485f-8c36-e93b41fe9ad8" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_object_grip_stats

> 결론(TL;DR): `read_object_grip_stats`을(를) 재생성한다 — 사용자가 object_name별 aggregated success rate(시도/성공/비율)를 조회 요청이나, 현재 DB에 존재하는 read_grip_result(단건 결과) 및 GripAttemptRecorded(원천 이벤트) 카드만으로는 이 집계 통계를 직접 제공하지. 시스템에 결결한 'success_rate_summary' 또는 유사한 Read Model 테이블. (이상 유형: 카드 없는 Read Model 테이블 · 심각도: warning)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `projection.request`(level 30) 2회, `projection.batch`(level 30) 2회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `projection.event.mapped`(level 20) 60회, `-`(level 30) 5회, `projection.start`(level 30) 2회, `-`(level 20) 6회, `insert.request`(level 30) 1회, `insight.card.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insight.card.miss`(level 40) 1회, `insert.file.ok`(level 20) 60회, `projection.done`(level 30) 2회, `projection.cursor.advanced`(level 20) 2회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 16:22:52.931 | 30 | projection.done | 8d792c01-aeec-4200-8ec9-fc2add81fe1c | - | - | - | catch-up 완료 | projector=grip-result-projector |
| 16:22:52.931 | 20 | projection.cursor.advanced | 8d792c01-aeec-4200-8ec9-fc2add81fe1c | - | - | - | 커서 이동 | projector=grip-result-projector |
| 16:22:52.931 | 30 | projection.batch | 8d792c01-aeec-4200-8ec9-fc2add81fe1c | - | - | - | 배치 처리 | projector=grip-result-projector |
| 16:22:52.932 | 30 | - | 8d792c01-aeec-4200-8ec9-fc2add81fe1c | - | - | - | request completed | - |
| 16:22:52.935 | 30 | insight.card.request | 024af7c0-7847-4664-a276-a9680c7461a2 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 16:22:52.936 | 40 | insight.card.miss | 024af7c0-7847-4664-a276-a9680c7461a2 | - | - | - | insight 카드 없음: 객체(object_name)별 파지 성공률을 한 번에 조회하고 싶다. 시도 수, 성공 수, 성공률이 필요하다. ← 트립 앵커 | - |
| 16:22:52.936 | 30 | - | 024af7c0-7847-4664-a276-a9680c7461a2 | - | - | - | request completed | - |
| 16:22:53.241 | 30 | insight.card.request | d170f681-70c5-48c2-80ca-8b07b515942f | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 16:22:53.243 | 40 | insight.card.miss | d170f681-70c5-48c2-80ca-8b07b515942f | - | - | - | insight 카드 없음: 객체(object_name)별 파지 성공률을 한 번에 조회하고 싶다. 시도 수, 성공 수, 성공률이 필요하다. | - |
| 16:22:53.243 | 30 | - | d170f681-70c5-48c2-80ca-8b07b515942f | - | - | - | request completed | - |
| 16:22:53.549 | 30 | insight.card.request | 5852f519-2ac2-485f-8c36-e93b41fe9ad8 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 16:22:53.552 | 40 | insight.card.miss | 5852f519-2ac2-485f-8c36-e93b41fe9ad8 | - | - | - | insight 카드 없음: 객체(object_name)별 파지 성공률을 한 번에 조회하고 싶다. 시도 수, 성공 수, 성공률이 필요하다. | - |
| 16:22:53.552 | 30 | - | 5852f519-2ac2-485f-8c36-e93b41fe9ad8 | - | - | - | request completed | - |

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
- (level 40, `insight.card.miss`) insight 카드 없음: 객체(object_name)별 파지 성공률을 한 번에 조회하고 싶다. 시도 수, 성공 수, 성공률이 필요하다. ← 트립 앵커 → 기존 Read Model 구조에는 object_name별 집계 통계를 제공하지. [corr:024af7c0-7847-4664-a276-a9680c7461a2]
- (level 40, `insight.card.miss`) insight 카드 없음: 객체(object_name)별 파지 성공률을 한 번에 조회하고 싶다. 시도 수, 성공 수, 성공률이 필요하다. → insight 카드 레인에서 집계 뷰 부재로 요청 실패 고착. [corr:d170f681-70c5-48c2-80ca-8b07b515942f]
- (level 40, `insight.card.miss`) insight 카드 없음: 객체(object_name)별 파지 성공률을 한 번에 조회하고 싶다. 시도 수, 성공 수, 성공률이 필요하다. → 동일 의도 반복 실패로 신규 집계 테이블 필이 확인됨. [corr:5852f519-2ac2-485f-8c36-e93b41fe9ad8]
- read_grip_result 스키마의 Primary Key는 (scene_key, attempt_num)이며 object_name, grip_succeed는 단건 속성일 뿐. 집계(aggregation) 컬럼은 정의되지.
- GripResultProjector.map() (src/projection/projector/grip-result.projector.ts)에서 payload.objects[0].class_name과 payload.grip_succeed를 직접 매핑해 단건 행을 생성. upsert()는 (scene_key, attempt_num) 충돌 시 기존 값 덮어씀. 누적 집계 로직이 존재하지.
- ProjectionService.catchUpAll() 호출 순서는 multimodal → gripResult. 신규 집계 프로젝터 연동이 필요하며, 현재 레인에서는 insight 카드 미스(insight.card.miss)가 영구 반복.

### Decision Drivers
- Repeated insight.card.miss for aggregated stats (window 내 3회)
- Existing schema lacks aggregation table & key structure mismatch
- CQRS consistency requires pre-computed Read Model over runtime query
- API stability vs new endpoint necessity

### Considered Options
#### 기각 대안: 기존 read_grip_result 보강
- 접근: GripResultProjector 내 upsert()에 attempt_count, success_count 누적 로직 삽입.
- 제안 필드: attempt_count, success_count
- 트레이드오프: 키 (scene_key, attempt_num) 기준으로는 object_name별 일대다 매핑이 불가능; DB 스키마 변경으로 하위 호환성 훼손 실패. (Driver 2,3 졌음)
```typescript
async upsert(tx, row) { await tx.insert(readGripResult).values(row).onConflictDoUpdate({ target: [readGripResult.sceneKey, readGripResult.attemptNum], set: { attemptCount: row.attemptCount + 1, successCount: row.gripSucceed === 1 ? row.successCount + 1 : row.successCount } }); }
```

#### 권장안: 신규 read_object_grip_stats 테이블 및 ObjectGripStatsProjector 생성
- 접근: 새 프로젝터에서 map() 시 object_name 추출, attempt_count/success_count 누적 계산, upsert() 시 (object_name) 키로 onConflictDoUpdate 적용.
- 제안 필드: object_name, attempt_count, success_count, success_rate
- 트레이드오프: 추가 투영 I/O 비용 발생(1건/이벤트), but insight 조회 latency O(1) 확보; CQRS 정합성 완벽. (모든 Driver 충족)
```typescript
async upsert(tx, row) { await tx.insert(readObjectGripStats).values(row).onConflictDoUpdate({ target: [readObjectGripStats.objectName], set: { attemptCount: row.attemptCount, successCount: row.successCount, successRate: row.successRate } }); }
```

#### 기각 대안: Query Layer 실시간 aggregation
- 접근: insight 카드 레인에서 read_grip_result SELECT + GROUP BY 실행.
- 제안 필드: -
- 트레이드오프: 반복 요청 부하 증가; Read Model 원칙 위배로 영구 미스 재발. (Driver 1,4 졌음)
```typescript
const stats = await tx.select(readGripResult).groupBy([readGripResult.objectName]).aggregate({ attempts: count(), successes: sum(readGripResult.gripSucceed) });
```

### Decision Outcome
신말 read_object_grip_stats 테이블 및 ObjectGripStatsProjector 생성

### Consequences
- (+) Insight 요청 즉시 O(1) 조회 해결; insight 카드 레인 미스 영구 차단
- (+) CQRS 정합성 확보: Read Model 테이블이 집계 상태 직접 관리
- (+) 기존 단건/배치 엔드포인트 및 read_grip_result 스키ma 무변
- (−) 추가 투영 I/O 비용 발생(1건/이벤트)으로 write latency 미소 증가
- (−) 신말 프로젝터 연동(ProjectionService) 및 migration 배포 필요

### Non-Goals
- read_grip_result 스키ma 변경으로 집계 필 추가
- Query Layer 실시간 aggregation 구현
- 기존 API 엔드포인트 계약 수정

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

- 대상: `read_object_grip_stats` · 키: object_name · 원천 이벤트: GripAttemptRecorded

```sql
CREATE TABLE read_object_grip_stats (
  object_name VARCHAR DEFAULT NULL,
  attempt_count DOUBLE PRECISION DEFAULT NULL,
  success_count DOUBLE PRECISION DEFAULT NULL,
  success_rate DOUBLE PRECISION DEFAULT NULL,
  PRIMARY KEY (object_name)
);

CREATE INDEX idx_object_grip_stats ON read_object_grip_stats(object_name);
```

### 필드

```mschema
# Table: read_object_grip_stats
[
(object_name:varchar, 파지 대상 객체명 (payload.objects[0].class_name) — 집계 키, Primary Key),
(attempt_count:doublePrecision, 해당 object_name 의 누적 시도 수),
(success_count:doublePrecision, 해당 object_name 의 누적 성공 수 (payload.grip_succeed)),
(success_rate:doublePrecision, 누적 성공률 (success_count / attempt_count))
]
```

### 투영 매핑 명세 (이벤트 → 컬럼)

> upsert 키: object_name · 리플레이: projection_cursor 초기화 시 upsertKey(object_name) 기준 집계를 재계산해야 하므로, replay 시 멱덴(upsert 전제)을 보장하며 cumulative aggregation state를 리셋/적재해야.

| 원천 이벤트 | payload 필드 | 컬럼 | 변환 |
| --- | --- | --- | --- |
| GripAttemptRecorded | objects[].class_name | object_name | verbatim |

파생 컬럼(이벤트 payload 아님):
- `attempt_count` ← count(GripAttemptRecorded) grouped by object_name
- `success_count` ← sum(grip_succeed) grouped by object_name
- `success_rate` ← success_count / attempt_count (null-safe)

### Insight 카드 등록 (Insight Read DB 동기화)

> DDL 적용 시 아래 카드 등록도 함께 실행한다 — 다음 분석부터 신규 Read Model 이 LLM 컨텍스트에 노출된다.

```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_object_grip_stats', 'read_model', 'object_name별 누적 시도 수, 성공 수, 성공률을 집계된 Read Model 테이블을 제공하여 insight.card.request 요청을 직접 매칭할 수 있도록.', 'object_name')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_object_grip_stats', 'object_name', 'varchar', '파지 대상 객체명 (payload.objects[0].class_name) — 집계 키', 1),
  ('read_object_grip_stats', 'attempt_count', 'doublePrecision', '해당 object_name 의 누적 시도 수', 2),
  ('read_object_grip_stats', 'success_count', 'doublePrecision', '해당 object_name 의 누적 성공 수 (payload.grip_succeed)', 3),
  ('read_object_grip_stats', 'success_rate', 'doublePrecision', '누적 성공률 (success_count / attempt_count)', 4)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased (v1 → v2)

#### Added
- 신규 Read Model 테이블 `read_object_grip_stats` (object_name, attempt_count, success_count, success_rate) 및 Drizzle 스키마
- 신규 Projector `ObjectGripStatsProjector` aggregating payload.objects[0] class_name별 grip_succeed 누적 실률
- 신규 라우트 `/object-grip-stats` 및 ProjectionService DI/메서드 확장

### 마이그레이션 절차

- 하위호환 변경: 기존 `read_grip_result`, `read_multimodal` 테이블·프로젝터·라우트 무손상 유지; 신규 `/object-grip-stats` 라우트는 additive, 기존 v1 라우트 호출 경로 영향 없음
- 파괴적 변경: 없음
- 컷오버 전 테스트: 1. `catchUpAll` 실행 전 `read_object_grip_stats` 테이블 존재 여부 확인 (migrationSql 적용)
2. `ObjectGripStatsProjector.map` payload.objects[0].class_name 추출 정합성 검증
3. `upsert` aggregation logic: 동동 이벤트 stream_id 동일 object_name일 경우 attempt_count/ success_count/ success_rate 누적 증가 정확히 100% 일치
- 롤백 창/조건: 컷오버 전 v2 라우트 `/object-grip-stats` 호출 중단, DI 제거. `read_object_grip_stats` 테이블 DROP. 기존 v1 `catchUpAll` 타입·메서드 복원. DB cursor 재시작.
- Insight 카드 등록: §2의 카드 등록 SQL을 DDL과 함께 적용(카탈로그 동기화)

### 사유·호환성

- 사유: 기존 Read Model 테이블(`read_grip_result`)은 scene_key·attempt_num 단건 결과만 저장하며, payload.objects[0] 기준 객체명 추출과 grip_succeed 단건 매핑에 다중 객체 aggregation 및 success_rate 계산을 결결. Insight 카드 조회 실패[corr:024af7c0-7847-4664-a276-a9680c7461a2]로 object_name별 누적 시도·성공·실률 일괄 뷰가 필요. 신규 `read_object_grip_stats` 테이블과 `ObjectGripStatsProjector`를 추가해 aggregation을 DB 레이어에서 처리, 기존 v1 라우트·프로젝터·테이블은 무손상 유지.
- 트리거 근거: 16:22:52.936 | 40 | insight.card.miss | 024af7c0-7847-4664-a276-a9680c7461a2 | - | - | - | insight 카드 없음: 객체(object_name)별 파지 성공률을 한 번에 조회하고 싶다. 시도 수, 성공 수, 성공률이 필요하다. ← 트립 앵커
- v1 호환성: 기존 `read_grip_result`·`read_multimodal` 테이블·프로젝터·라우트/메서드/DI 라인을 수정·삭제 금지. 신규 `ObjectGripStatsProjector`(이름 고정)와 `/object-grip-stats` 라우트를 추가만. 기존 v1 프로젝트의 catch-up 흐름(`catchUpAll`)은 확장만, v1 호환성 완전 유지.

### 변경 파일

- `src/shared/database/schema/index.ts` (modifyFile) — 신규 테이블 스키마 export 추가. 기존 export 라인 무손상.
- `src/projection/projection.service.ts` (modifyFile) — 신규 Projector DI 추가, catchUpAllResult 타입 확장, catchUpObjectGripStats 메서드 및 catchUpAll 호출 추가. 기존 v1 라우트/메서드/DI 무손상.
- `src/projection/projection.controller.ts` (modifyFile) — 신규 /object-grip-stats 라우트 추가. 기존 v1 라우트 무손상.

## Optional — 부속 자료(컨텍스트 축소 시 생략 가능)

### 신규 Read Model — Drizzle 스키마

```ts
import { doublePrecision, index, pgTable, primaryKey, varchar } from 'drizzle-orm/pg-core';

export const readObjectGripStats = pgTable(
  "read_object_grip_stats",
  {
    objectName: varchar("object_name"),
    attemptCount: doublePrecision("attempt_count"),
    successCount: doublePrecision("success_count"),
    successRate: doublePrecision("success_rate"),
  },
  (t) => [
    primaryKey({ columns: [t.objectName] }),
    index("idx_object_grip_stats").on(t.objectName),
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
import { readObjectGripStats } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';
import { sql } from 'drizzle-orm';

type ReadObjectGripStatsInsert = InferInsertModel<typeof readObjectGripStats>;

@Injectable()
export class ObjectGripStatsProjector implements Projector<ReadObjectGripStatsInsert> {
  readonly name: string = "object-grip-stats-projector";

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(ObjectGripStatsProjector.name);
  }

  map(event: EventStoreEventRow): ReadObjectGripStatsInsert {
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

      throw new Error("object-grip-stats map: empty objects in event");
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

    const objectName = payload.objects[0].class_name;
    const gripSucceed = payload.grip_succeed;

    return {
      objectName,
      attemptCount: 1,
      successCount: gripSucceed,
      successRate: gripSucceed,
    };
  }

  async upsert(tx: DrizzleTx, row: ReadObjectGripStatsInsert): Promise<void> {
    await tx
      .insert(readObjectGripStats)
      .values(row)
      .onConflictDoUpdate({
        target: [readObjectGripStats.objectName],
        set: {
          attemptCount: sql`${readObjectGripStats.attemptCount} + ${row.attemptCount}`,
          successCount: sql`${readObjectGripStats.successCount} + ${row.successCount}`,
          successRate: sql`(sql${readObjectGripStats.successCount} + ${row.successCount}) / (sql${readObjectGripStats.attemptCount} + ${row.attemptCount})`,
        },
      });
  }
}
```

### 신규 Read Model — 배선(컨트롤러/서비스/모듈)

```ts
// src/shared/database/schema/index.ts
export * from "./service/read-object-grip-stats";

// src/projection/projection.service.ts (constructor 주입 & 메서드 추가)
private readonly objectGripStats: ObjectGripStatsProjector,
catchUpObjectGripStats(): Promise<ProjectionResult> {
  return this.runner.run(this.objectGripStats);
}

// src/projection/projection.controller.ts (라우트 추가)
@Post("/object-grip-stats")
objectGripStats(): Promise<ProjectionResult> {
  this.logger.info(
    { action: LogAction.PROJECTION_REQUEST, [LogContext.ROUTE]: "POST /projection/object-grip-stats" },
    "projection 요청 수신",
  );
  return this.projectionService.catchUpObjectGripStats();
}

// src/projection/projection.module.ts (providers 배열 추가)
ObjectGripStatsProjector,
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
export * from "./service/read-object-grip-stats";
```

### 버전 교체 코드 — `src/projection/projection.service.ts` (modifyFile)

```typescript
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { ObjectGripStatsProjector } from '@/projection/projector/object-grip-stats.projector';
import { ProjectionResult } from '@/projection/projector/projector';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';
import { LogAction } from '@/shared/logger/logging-context';

export type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
  objectGripStats: ProjectionResult;
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
    private readonly objectGripStats: ObjectGripStatsProjector,
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

  catchUpObjectGripStats(): Promise<ProjectionResult> {
    return this.runner.run(this.objectGripStats);
  }

  async catchUpAll(): Promise<CatchUpAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_START }, "전체 투영 시작");

    const multimodal: ProjectionResult = await this.catchUpMultimodal();
    const gripResult: ProjectionResult = await this.catchUpGripResult();
    const objectGripStats: ProjectionResult = await this.catchUpObjectGripStats();

    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");

    return { multimodal, gripResult, objectGripStats };
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

  @Post("/object-grip-stats")
  objectGripStats(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/object-grip-stats",
      },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpObjectGripStats();
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
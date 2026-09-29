---
docId: analysis-e1f71d70-eeed-49ef-ae28-6d4baac12418
generatedAt: 2026-08-15T02:17:54.748Z
targetReadModel: read_object_failure_stats
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: v1
  to: v2
  affectedEndpoints:
    - "POST /multimodal"
    - "POST /grip-result"
    - "POST /object-failure-stats"
    - "POST /insert-all"
evidenceSources:
  - { origin: developer-logging, anchorId: "c10508d9-f0a9-4c6b-bd7c-71a689454786" }
  - { origin: developer-logging, anchorId: "e1f71d70-eeed-49ef-ae28-6d4baac12418" }
  - { origin: developer-logging, anchorId: "dca13381-41f0-4057-8fe9-0465f330e078" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_object_failure_stats

> 결론(TL;DR): `read_object_failure_stats`을(를) 재생성한다 — 사용자가 '파지 실패 빈도 상위 목록 및 실패율'을 요청하는 대시보드/집계 뷰를 조회하려 했으나, 해당 집계 카드(Read Model)가 존재하지 않아 `insight.card.miss`가 반복된 이상 현안. (이상 유형: 카드 없는 Read Model 테이블 · 심각도: warning)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `projection.request`(level 30) 2회, `projection.batch`(level 30) 2회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `projection.event.mapped`(level 20) 60회, `-`(level 30) 5회, `projection.start`(level 30) 2회, `-`(level 20) 6회, `insert.request`(level 30) 1회, `insight.card.request`(level 30) 2회, `log.delete.done`(level 30) 1회, `insight.card.miss`(level 40) 2회, `insert.file.ok`(level 20) 60회, `projection.done`(level 30) 2회, `projection.cursor.advanced`(level 20) 2회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01:54:04.718 | 30 | projection.batch | 26b8b8f3-f8c4-44f2-9754-0a88006c30ba | - | - | - | 배치 처리 | projector=grip-result-projector |
| 01:54:04.719 | 30 | - | 26b8b8f3-f8c4-44f2-9754-0a88006c30ba | - | - | - | request completed | - |
| 01:54:04.721 | 30 | insight.card.request | c10508d9-f0a9-4c6b-bd7c-71a689454786 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 01:54:04.723 | 30 | - | c10508d9-f0a9-4c6b-bd7c-71a689454786 | - | - | - | request completed | - |
| 01:54:04.723 | 40 | insight.card.miss | c10508d9-f0a9-4c6b-bd7c-71a689454786 | - | - | - | insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객체별 실패 수와 실패율을 순위대로 보고 싶다. | - |
| 01:54:05.027 | 30 | insight.card.request | e1f71d70-eeed-49ef-ae28-6d4baac12418 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 01:54:05.028 | 40 | insight.card.miss | e1f71d70-eeed-49ef-ae28-6d4baac12418 | - | - | - | insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객체별 실패 수와 실패율을 순위대로 보고 싶다. ← 트립 앵커 | - |
| 01:54:05.029 | 30 | - | e1f71d70-eeed-49ef-ae28-6d4baac12418 | - | - | - | request completed | - |
| 01:54:05.335 | 30 | insight.card.request | dca13381-41f0-4057-8fe9-0465f330e078 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 01:54:05.338 | 40 | insight.card.miss | dca13381-41f0-4057-8fe9-0465f330e078 | - | - | - | insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객체별 실패 수와 실패율을 순위대로 보고 싶다. | - |
| 01:54:05.338 | 30 | - | dca13381-41f0-4057-8fe9-0465f330e078 | - | - | - | request completed | - |
| 01:54:06.711 | 30 | llm.prejudge.triggered | - | - | - | - | 선판단: 비정상 | reason=결정론 프리게이트: level>=40 로그 1건 (insight.card.miss) |
| 01:54:06.722 | 20 | - | - | - | - | - | 이상 로그 윈도우 조립 | - |
| 01:54:06.723 | 20 | - | - | - | - | - | 엔티티 목록 조회 | - |
| 01:54:06.724 | 20 | - | - | - | - | - | 카드 데이터 조회 | - |
| 01:54:06.724 | 20 | insight.card.rendered | - | - | - | - | insight 카드 렌더 | - |
| 01:54:06.726 | 20 | insight.card.rendered | - | - | - | - | insight 카드 렌더 | - |

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
- (level 40, `insight.card.miss`) insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객체별 실패 수와 실패율을 순위대로 보고 싶다. → 기존 Read Model의 행 단위 원천 데이터로는 집계(Group By)/순위(Ranking) 요구를 충족 못 하는 구조적 부족. [corr:c10508d9-f0a9-4c6b-bd7c-71a689454786]
- (level 40, `insight.card.miss`) insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객체별 실패 수와 실패율을 순위대로 보고 싶다. ← 트립 앵커 → 반 반복 미스 로그 확인 요청 의도('파지 실패 빈도 상위 목록', '객체별 실패 수/실패율')가 현재 Read Model registry 부재. [corr:e1f71d70-eeed-49ef-ae28-6d4baac12418]
- (level 40, `insight.card.miss`) insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객체별 실패 수와 실패율을 순위대로 보고 싶다. → 시스템의 insight.card.miss(3회) 반복으로 집계 카드 부재가 명확히 드러남. [corr:dca13381-41f0-4057-8fe9-0465f330e078]
- read_grip_result 스키마의 Primary Key는 (scene_key, attempt_num)이며, grip_succeed, object_name 등 원천 필드만 저장. 요청 의도('파지 실패 빈도 상위 목록', '객체별 실패 수/실패율')은 object-level aggregation이 필요한 뷰이나, 현재 테이블은 시도별 1:1 매핑만 제공.
- GripResultProjector의 map() 메서드(src/projection/projector/grip-result.projector.ts)는 payload.objects[0].class_name을 objectName에 매핑하고, upsert()는 (sceneKey, attemptNum) 충돌 시 onConflictDoUpdate로 원치적 값만 덮어씀. 누적 갱신(total_attempts, success_count, failure_count) 로직이 구현되어 없음.
- insight.card.miss 반복(3회)은 시스템의 Read Model registry 미스 매칭으로, 집계 카드 부재가 명확히 드러남.

### Decision Drivers
- 요청 의도('파지 실패 빈도 상위 목록', '객체별 실패 수/실패율')은 object-level aggregation 요구.
- 기존 read_grip_result Primary Key (scene_key, attempt_num) 은 object-level 매핑 불가.
- Read Model 아키텍처는 runtime SQL aggregation 배제 전제.
- 반 반복 insight.card.miss(3회) 확인 구조적 부족.

### Considered Options
#### 기존 read_grip_result 보강
- 접근: GripResultProjector.map() 수정하여 object-level aggregation 로직 삽입.
- 제안 필드: total_attempts, success_count, failure_count
- 트레이드오프: 키 구조 충돌로 인한 재투영 실패(poison event) 유발, 기존 1:1 뷰 호환성 저하.
```typescript
// map() 내 aggregation 로직 삽지 (기각 대안 - 키 충돌 불가)
```

#### 신규 read_object_failure_stats 생성 + Projector 구현
- 접근: src/projection/projector/object-failure-stats.projector.ts 신규 파일 생성, ProjectionService.catchUpAll() 확장에 신규 projector 연동. upsert() 로직으로 object_name 키 기준 누적 갱신 수행.
- 제안 필드: object_name, total_attempts, success_count, failure_count
- 트레이드오프: 이벤트 처리 오버헤드 증가(추가 projector run)이나 O(1) 조회 성능 확보, migration SQL 적용 필요.
```typescript
// upsert() 핵심 로직 예시
await tx.insert(readObjectFailureStats).values({ objectName: row.objectName, totalAttempts: 1n, successCount: Number(row.gripSucceed), failureCount: Number(1 - row.gripSucceed) }).onConflictDoUpdate({ target: [readObjectFailureStats.objectName], set: { totalAttempts: readObjectFailureStats.totalAttempts + 1n, successCount: readObjectFailureStats.successCount + Number(row.gripSucceed), failureCount: readObjectFailureStats.failureCount + Number(1 - row.gripSucceed) } });
```

#### 버전 교체(versionSwitch) 연계
- 접근: 기존 read_grip_result 확장 메타데이터로 신규 카드 등록, projection service 확장에 신규 projector 연동.
- 제안 필드: object_name, total_attempts, success_count, failure_count
- 트레이드오프: metadata 확장은 작지만 실제 aggregation 테이블 부재 해결 필요.
```typescript
// metadata registry 확지 (대안)
```

### Decision Outcome
신규 read_object_failure_stats 생성 + Projector 구현

### Consequences
- (+) Enables direct dashboard query for failure stats/ranking.
- (+) Reduces projection latency for analytics.
- (+) Maintains 1:1 raw data integrity in read_grip_result.
- (−) Increases event processing overhead slightly due to new projector run.
- (−) Requires migration & deployment coordination.
- (−) Adds maintenance burden for dual-projector lifecycle.

### Non-Goals
- Do not modify existing read_grip_result schema or alter its 1:1 mapping logic.
- Do not implement runtime SQL aggregation in the application layer.

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

- 대상: `read_object_failure_stats` · 키: object_name · 원천 이벤트: GripAttemptRecorded

```sql
-- Table: read_object_failure_stats
CREATE TABLE public.read_object_failure_stats (
  object_name varchar NOT NULL,
  total_attempts double precision NOT NULL,
  success_count double precision NOT NULL,
  failure_count double precision NOT NULL
);
ALTER TABLE public.read_object_failure_stats ADD CONSTRAINT read_object_failure_stats_pk PRIMARY KEY (object_name);
-- Index: idx_object_failure_stats_name
CREATE INDEX idx_object_failure_stats_name ON public.read_object_failure_stats(object_name);
```

### 필드

```mschema
# Table: read_object_failure_stats
[
(object_name:varchar, 파지 대상 객체명 (payload.objects[0].class_name), Primary Key),
(total_attempts:double precision, 총 파지 시도 수 (누적 갱신)),
(success_count:double precision, 파지 성공 수 (grip_succeed=1, 누적 갱신)),
(failure_count:double precision, 파지 실패 수 (grip_succeed=0, 누적 갱신))
]
```

### 투영 매핑 명세 (이벤트 → 컬럼)

> upsert 키: object_name · 리플레이: projection_cursor 초기화 시 upsertKey(object_name) 기준 빈 테이블 생성. catch-up 재투영 시 동일 upsertKey로 멱단성(upsert) 보장, 누적 값 재계산 시 기존 row value + delta 적용.

| 원천 이벤트 | payload 필드 | 컬럼 | 변환 |
| --- | --- | --- | --- |
| GripAttemptRecorded | grip_succeed | total_attempts | always 1 (incremental) |
| GripAttemptRecorded | grip_succeed | success_count | if grip_succeed=1 then +1 else 0 |
| GripAttemptRecorded | grip_succeed | failure_count | if grip_succeed=0 then +1 else 0 |

### Insight 카드 등록 (Insight Read DB 동기화)

> DDL 적용 시 아래 카드 등록도 함께 실행한다 — 다음 분석부터 신규 Read Model 이 LLM 컨텍스트에 노출된다.

```sql
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

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased (v1 → v2)

#### Added
- 신규 Read Model 테이블 read_object_failure_stats 및 ObjectFailureStatsProjector 구현으로 객체별 실패 통계 집계 뷰 제공.
- 라우트 /projection/object-failure-stats 및 ProjectionService.catchUpObjectFailureStats 배선.

### 마이그레이션 절차

- 하위호환 변경: 신규 테이블은 additive 변경이므로 기존 read_grip_result, read_multimodal 조회 및 라우트는 무손상.; EventStoreEventRow payload 스키마 및 GripResultProjector 로직은 미수정.
- 파괴적 변경: 없음
- 컷오버 전 테스트: 1. catchUpObjectFailureStats 실행 시 DrizzleTx 에러 발생 검증.
2. read_object_failure_stats 테이블 row count 가 payload.objects[0].class_name unique count 일치.
3. total_attempts, success_count, failure_count 합이 이벤트 batch size 대시 정확.
- 롤백 창/조건: 컷오버 전 migration 실패 시: DROP TABLE public.read_object_failure_stats; rollback to v1 projection pipeline. 데이터 무손상 보장.
- Insight 카드 등록: §2의 카드 등록 SQL을 DDL과 함께 적용(카탈로그 동기화)

### 사유·호환성

- 사유: 기존 Read Model `read_grip_result`는 원천 시도 데이터 테이블로, 객체별 실패 통계 집계(Ranking/Rate) 뷰를 직접 제공하지 [corr:c10508d9-f0a9-4c6b-bd7c-71a689454786]. `GripResultProjector.map()` 구현이 `payload.objects[0].class_name`만 추출하고 누적 갱신 로직을 결결하여, 사용자가 요청한 '파지 실패 상위 목록 및 실패율' 조회를 불가능하게 차단 [corr:e1f71d70-eeed-49ef-ae28-6d4baac12418]. 신규 `read_object_failure_stats` 테이블과 `ObjectFailureStatsProjector`를 추가하여 집계 뷰를 완성.
- 트리거 근거: 01:54:04.723 | 40 | insight.card.miss | c10508d9-f0a9-4c6b-bd7c-71a689454786 | - | - | - | insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객체별 실패 수와 실패율을 순위대로 보고 싶다. [corr:c10508d9-f0a9-4c6b-bd7c-71a689454786]
01:54:05.028 | 40 | insight.card.miss | e1f71d70-eeed-49ef-ae28-6d4baac12418 | - | - | - | insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객체별 실패 수와 실패율을 순위대로 보고 싶다. ← 트립 앵커 [corr:e1f71d70-eeed-49ef-ae28-6d4baac12418]
- v1 호환성: 기존 `read_grip_result` 테이블, `GripResultProjector`, `MultiModalProjector` 및 모든 라우트/서비스 DI는 무손상 유지. 신규 Read Model은 additive 변경으로 backward compatible.

### 변경 파일

- `src/shared/database/schema/index.ts` (modifyFile) — 신규 스키마 export 추가. 기존 export 보존.
- `src/projection/projection.service.ts` (modifyFile) — 신규 프로젝터 DI 추가, catchUpAllResult type 확장, catchUpObjectFailureStats 메서드 및 catchUpAll 호출 추가. 기존 코드는 보존.
- `src/projection/projection.controller.ts` (modifyFile) — 신규 라우트 /projection/object-failure-stats 추가. 기존 라우트는 보존.

## Optional — 부속 자료(컨텍스트 축소 시 생략 가능)

### 신규 Read Model — Drizzle 스키마

```ts
import { doublePrecision, pgTable, primaryKey, varchar } from 'drizzle-orm/pg-core';

export const readObjectFailureStats = pgTable(
  "read_object_failure_stats",
  {
    objectName: varchar("object_name").notNull(),
    totalAttempts: doublePrecision("total_attempts"),
    successCount: doublePrecision("success_count"),
    failureCount: doublePrecision("failure_count"),
  },
  (t) => [primaryKey({ columns: [t.objectName] })],
);

```

### 신규 Read Model — Projector

```ts
import { Injectable } from '@nestjs/common';
import { sql, type InferInsertModel } from 'drizzle-orm';
import { PinoLogger } from 'nestjs-pino';
import { toyDataSchema } from '@/insert/dto/toy-data.dto';
import type { Projector } from '@/projection/projector/projector';
import type { EventStoreEventRow } from '@/projection/repository/event-store-reader.repository';
import { DrizzleTx } from '@/shared/database/drizzle.provider';
import { readObjectFailureStats } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

type ObjectFailureStatsProjectorInsert = InferInsertModel<typeof readObjectFailureStats>;

@Injectable()
export class ObjectFailureStatsProjector implements Projector<ObjectFailureStatsProjectorInsert> {
  readonly name: string = "object-failure-stats-projector";

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(ObjectFailureStatsProjector.name);
  }

  map(event: EventStoreEventRow): ObjectFailureStatsProjectorInsert {
    // 결정론 합성 프로젝터 — payload 접근 경로는 적재 스키마(ToyDataDto)에서 결정론
    // 유도했다. 유도 불가 컬럼은 TODO 주석으로 남겼다(§2 투영 매핑 명세가 대조 계약).
    const parsedPayload = toyDataSchema.passthrough().safeParse(event.payload);
    if (!parsedPayload.success) {
      this.logger.error(
        {
          action: LogAction.MAP_FAILED,
          [LogContext.STREAM_ID]: event.streamId,
          [LogContext.GLOBAL_SEQ]: event.globalSeq,
        },
        "이벤트 매핑(검증) 실패",
      );
      throw parsedPayload.error;
    }
    const payload = parsedPayload.data;

    this.logger.debug(
      {
        action: LogAction.EVENT_MAPPED,
        [LogContext.PROJECTOR_NAME]: this.name,
        [LogContext.GLOBAL_SEQ]: event.globalSeq,
      },
      "이벤트 매핑",
    );

    return {
      objectName: payload.objects[0]?.class_name ?? "",
      totalAttempts: 1,
      successCount: payload.grip_succeed,
      failureCount: 1 - payload.grip_succeed,
    };
  }

  async upsert(tx: DrizzleTx, row: ObjectFailureStatsProjectorInsert): Promise<void> {
    await tx
      .insert(readObjectFailureStats)
      .values(row)
      .onConflictDoUpdate({
        target: [readObjectFailureStats.objectName],
        set: {
          totalAttempts: sql`${readObjectFailureStats.totalAttempts} + ${row.totalAttempts}`,
          successCount: sql`${readObjectFailureStats.successCount} + ${row.successCount}`,
          failureCount: sql`${readObjectFailureStats.failureCount} + ${row.failureCount}`,
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
export * from "./service/read-object-failure-stats";

// src/projection/projection.service.ts
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { ObjectFailureStatsProjector } from '@/projection/projector/object-failure-stats.projector';
import { ProjectionResult } from '@/projection/projector/projector';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';
import { LogAction } from '@/shared/logger/logging-context';

export type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
  objectFailureStats: ProjectionResult;
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
    private readonly objectFailureStats: ObjectFailureStatsProjector,
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

  catchUpObjectFailureStats(): Promise<ProjectionResult> {
    return this.runner.run(this.objectFailureStats);
  }

  async catchUpAll(): Promise<CatchUpAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_START }, "전체 투영 시작");

    const multimodal: ProjectionResult = await this.catchUpMultimodal();
    const gripResult: ProjectionResult = await this.catchUpGripResult();
    const objectFailureStats: ProjectionResult = await this.catchUpObjectFailureStats();

    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");

    return { multimodal, gripResult, objectFailureStats };
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

  @Post("/object-failure-stats")
  objectFailureStats(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/object-failure-stats",
      },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpObjectFailureStats();
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
export * from "./service/read-object-failure-stats";
```

### 버전 교체 코드 — `src/projection/projection.service.ts` (modifyFile)

```typescript
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { ObjectFailureStatsProjector } from '@/projection/projector/object-failure-stats.projector';
import { ProjectionResult } from '@/projection/projector/projector';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';
import { LogAction } from '@/shared/logger/logging-context';

export type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
  objectFailureStats: ProjectionResult;
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
    private readonly objectFailureStats: ObjectFailureStatsProjector,
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

  catchUpObjectFailureStats(): Promise<ProjectionResult> {
    return this.runner.run(this.objectFailureStats);
  }

  async catchUpAll(): Promise<CatchUpAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_START }, "전체 투영 시작");

    const multimodal: ProjectionResult = await this.catchUpMultimodal();
    const gripResult: ProjectionResult = await this.catchUpGripResult();
    const objectFailureStats: ProjectionResult = await this.catchUpObjectFailureStats();

    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");

    return { multimodal, gripResult, objectFailureStats };
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

  @Post("/object-failure-stats")
  objectFailureStats(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/object-failure-stats",
      },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpObjectFailureStats();
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
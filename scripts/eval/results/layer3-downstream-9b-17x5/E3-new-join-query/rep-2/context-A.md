---
docId: analysis-7be30198-dc16-4d70-bc4a-78aa5d654ff9
generatedAt: 2026-08-11T17:15:14.578Z
targetReadModel: read_insight_card_v1
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: v1
  to: v2
  affectedEndpoints:
    - "POST /multimodal"
    - "POST /grip-result"
    - "POST /insight-card"
    - "POST /insert-all"
evidenceSources:
  - { origin: developer-logging, anchorId: "7be30198-dc16-4d70-bc4a-78aa5d654ff9" }
  - { origin: developer-logging, anchorId: "97b3aa65-5d69-48bf-8f67-4e8079e3bd92" }
  - { origin: developer-logging, anchorId: "7c5a7f5d-cb91-4362-af65-2e4ffcf8ca8c" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_insight_card_v1

> 결론(TL;DR): `read_insight_card_v1`을(를) 재생성한다 — 사용자가 trip result와 scene의 image/video paths를 한 화면에서 함께 보고자 요청(Insight Card 조회)이나, 현재 Read Model 카탈로그에는 read_grip_result와 read_multimodal만 존재且未存在統合 뷰(Card) 모델. (이상 유형: 카드 없는 Read Model 테이블 · 심각도: warning)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `projection.request`(level 30) 2회, `projection.batch`(level 30) 2회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `projection.event.mapped`(level 20) 60회, `-`(level 30) 5회, `projection.start`(level 30) 2회, `-`(level 20) 6회, `insert.request`(level 30) 1회, `insight.card.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insight.card.miss`(level 40) 1회, `insert.file.ok`(level 20) 60회, `projection.done`(level 30) 2회, `projection.cursor.advanced`(level 20) 2회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 17:15:12.036 | 30 | projection.done | 9142d531-2daa-4bc8-a481-1a095811ec5f | - | - | - | catch-up 완료 | projector=grip-result-projector |
| 17:15:12.036 | 20 | projection.cursor.advanced | 9142d531-2daa-4bc8-a481-1a095811ec5f | - | - | - | 커서 이동 | projector=grip-result-projector |
| 17:15:12.036 | 30 | projection.batch | 9142d531-2daa-4bc8-a481-1a095811ec5f | - | - | - | 배치 처리 | projector=grip-result-projector |
| 17:15:12.036 | 30 | - | 9142d531-2daa-4bc8-a481-1a095811ec5f | - | - | - | request completed | - |
| 17:15:12.039 | 30 | insight.card.request | 7be30198-dc16-4d70-bc4a-78aa5d654ff9 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 17:15:12.041 | 40 | insight.card.miss | 7be30198-dc16-4d70-bc4a-78aa5d654ff9 | - | - | - | insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. ← 트립 앵커 | - |
| 17:15:12.041 | 30 | - | 7be30198-dc16-4d70-bc4a-78aa5d654ff9 | - | - | - | request completed | - |
| 17:15:12.347 | 30 | insight.card.request | 97b3aa65-5d69-48bf-8f67-4e8079e3bd92 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 17:15:12.348 | 40 | insight.card.miss | 97b3aa65-5d69-48bf-8f67-4e8079e3bd92 | - | - | - | insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. | - |
| 17:15:12.349 | 30 | - | 97b3aa65-5d69-48bf-8f67-4e8079e3bd92 | - | - | - | request completed | - |
| 17:15:12.655 | 30 | insight.card.request | 7c5a7f5d-cb91-4362-af65-2e4ffcf8ca8c | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 17:15:12.657 | 40 | insight.card.miss | 7c5a7f5d-cb91-4362-af65-2e4ffcf8ca8c | - | - | - | insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. | - |
| 17:15:12.657 | 30 | - | 7c5a7f5d-cb91-4362-af65-2e4ffcf8ca8c | - | - | - | request completed | - |

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
- (level 40, `insight.card.miss`) insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. → Repeated miss signals read_insight_card Read Model table is absent, causing unified view requests to fail. [corr:7be30198-dc16-4d70-bc4a-78aa5d654ff9]
- (level 40, `insight.card.miss`) insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. → Repeated miss signals read_insight_card Read Model table is absent, causing unified view requests to fail. [corr:97b3aa65-5d69-48bf-8f67-4e8079e3bd92]
- (level 40, `insight.card.miss`) insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. → Repeated miss signals read_insight_card Read Model table is absent, causing unified view requests to fail. [corr:7c5a7f5d-cb91-4362-af65-2e4ffcf8ca8c]
- 현재 스키마의 read_grip_result와 read_multimodal은 모두 (scene_key, attempt_num)을 Primary Key로 공유하나, 각각 다른 필드만 채움. GripResultProjector.map()에서 image_2d_file_name, video_file_name 누락, MultiModalProjector.map()에서 object_name, grip_succeed 등 파지 결과 필드 누락.
- src/projection/projector/multimodal.projector.ts의 map() 메서드에서 image2dUri, videoUri를 명시히 null로 할당하며, GripResultProjector.map()은 미디어 파일명 추출 로직이 결결.
- 사용자의 의도(한 화면 동시 조회)는 두 모델의 데이터를 (scene_key, attempt_num) 키 기준으로 조인해야 하나, 현재 아키텍처에는 통합 뷰 테이블(read_insight_card_v1)과 매칭 프로젝터가 부재.

### Decision Drivers
- Unified view intent 충족
- CQRS Read Model 일원화 원칙
- Projection latency vs Runtime join overhead tradeoff
- API 카탈로그 동기화 필요

### Considered Options
#### 신규 Read Model 생성 (read_insight_card_v1)
- 접근: InsightCardProjector 구현. map() 메서드에서 GripAttemptRecorded payload 직접 파싱, read_insight_card_v1 필드 모두 채움.
- 제안 필드: scene_key, attempt_num, object_name, grip_succeed, gripper_type, occurred_at, grip_2d_pose, grip_3d_pose, robot_tf, human_annotation_grasp, image_2d_file_name, video_file_name, stream_id, global_seq
- 트레이드오프: 신규 DB migration 및 프로젝터 등록 필요, 배치 투영 latency 소폭 증가, but runtime join overhead 제거.
```typescript
return { sceneKey: event.streamId.replace(/^grip-attempt:/, ""), attemptNum: event.attemptNum, objectName: payload.objects[0].class_name, gripSucceed: payload.grip_succeed, gripperType: "finger", occurredAt: event.occurredAt, grip2dPose: payload.grip_data.grip_2d_pose, grip3dPose: payload.grip_data.grip_3d_pose, robotTf: payload.robot_tf, humanAnnotationGrasp: payload.human_annotation_grasp, image2dFileName: payload["2D_image_file_name"], videoFileName: payload.video_file_name, streamId: event.streamId, globalSeq: event.globalSeq };
```

#### 기존 보강/런타임 조인 (기각 대안)
- 접근: API 레이어에서 read_grip_result와 read_multimodal 동시 fetch + client-side join.
- 제안 필드: -
- 트레이드오프: 네트워크 왕복 증가, CQRS Read Model 원칙 위배(미투영 상태), 일관성 유지 어려움. lost in Driver 2 & 3.

### Decision Outcome
신규 Read Model 생성 (read_insight_card_v1)

### Consequences
- (+) Direct DB-layer access eliminates client-side join overhead
- (+) Consistency guaranteed by single projection path
- (+) API catalog sync enables stable endpoint
- (−) Requires new migration script and projector registration
- (−) Slight increase in batch projection latency due to additional field mapping

### Non-Goals
- Modifying existing read_grip_result or read_multimodal tables
- Runtime client-side joins
- Default coercion of failed values into Read Model

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

- 대상: `read_insight_card_v1` · 키: (scene_key, attempt_num) · 원천 이벤트: GripAttemptRecorded

```sql
CREATE TABLE read_insight_card_v1 (
    scene_key VARCHAR NOT NULL,
    attempt_num SMALLINT NOT NULL,
    object_name VARCHAR NOT NULL,
    grip_succeed SMALLINT NOT NULL,
    gripper_type VARCHAR(16) NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    grip_2d_pose JSONB,
    grip_3d_pose JSONB,
    robot_tf JSONB,
    human_annotation_grasp JSONB,
    image_2d_file_name VARCHAR,
    video_file_name VARCHAR,
    stream_id VARCHAR NOT NULL,
    global_seq BIGINT NOT NULL,
    PRIMARY KEY (scene_key, attempt_num)
);
```

### 필드

```mschema
# Table: read_insight_card_v1
[
(scene_key:varchar, 장면 식별 키 = stream_id.replace(/^grip-attempt:/, ""), Primary Key),
(attempt_num:smallint, 동일 장면 내 파지 시도 번호, Primary Key),
(object_name:varchar, payload.objects[0].class_name),
(grip_succeed:smallint, payload.grip_succeed (0=실패, 1=성공)),
(gripper_type:varchar(16), 그리퍼 종류 (finger/suction)),
(occurred_at:timestamptz, event.occurredAt),
(grip_2d_pose:jsonb, payload.grip_data.grip_2d_pose),
(grip_3d_pose:jsonb, payload.grip_data.grip_3d_pose),
(robot_tf:jsonb, payload.robot_tf),
(human_annotation_grasp:jsonb, payload.human_annotation_grasp),
(image_2d_file_name:varchar, payload["2D_image_file_name"]),
(video_file_name:varchar, payload.video_file_name),
(stream_id:varchar, event.streamId),
(global_seq:bigint, event.globalSeq)
]
```

### 투영 매핑 명세 (이벤트 → 컬럼)

> upsert 키: (scene_key, attempt_num) · 리플레이: projection_cursor 초기화 시 stream_id 기준 정렬 필수. catch-up 재투영은 upsert 전제(멱idency)이므로 scene_key+attempt_num 키 충돌 시 payload 최신으로 덮어쓰기 보장.

| 원천 이벤트 | payload 필드 | 컬럼 | 변환 |
| --- | --- | --- | --- |
| GripAttemptRecorded | objects[].class_name | object_name | payload.objects[0].class_name |
| GripAttemptRecorded | grip_succeed | grip_succeed | boolean → smallint 캐스팅 |
| GripAttemptRecorded | grip_data.grip_2d_pose | grip_2d_pose | verbatim |
| GripAttemptRecorded | grip_data.grip_3d_pose | grip_3d_pose | verbatim |
| GripAttemptRecorded | robot_tf | robot_tf | verbatim |
| GripAttemptRecorded | human_annotation_grasp | human_annotation_grasp | verbatim |
| GripAttemptRecorded | 2D_image_file_name | image_2d_file_name | verbatim |
| GripAttemptRecorded | video_file_name | video_file_name | verbatim |

파생 컬럼(이벤트 payload 아님):
- `scene_key` ← stream_id prefix 'grip-attempt:' 제거
- `attempt_num` ← 2D_image_file_name filename parsing 시도번호 자리(_01_)
- `gripper_type` ← "finger" 고정값 (payload 미존)
- `occurred_at` ← event.metadata.occurredAt
- `stream_id` ← event.streamId
- `global_seq` ← event.globalSeq

### Insight 카드 등록 (Insight Read DB 동기화)

> DDL 적용 시 아래 카드 등록도 함께 실행한다 — 다음 분석부터 신규 Read Model 이 LLM 컨텍스트에 노출된다.

```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_insight_card_v1', 'read_model', '파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고자(Insight Card) 요청을 충족. 기존 read_grip_result과 read_multimodal은 별도 테이블로, 애플리케이션 레벨 조인이나 다중 DB 접근이 필요하나 본 신규 Read Model은 시도 단위 행으로 통합 뷰를 제공.', '(scene_key, attempt_num)')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_insight_card_v1', 'scene_key', 'varchar', '장면 식별 키 = stream_id.replace(/^grip-attempt:/, "")', 1),
  ('read_insight_card_v1', 'attempt_num', 'smallint', '동일 장면 내 파지 시도 번호', 2),
  ('read_insight_card_v1', 'object_name', 'varchar', 'payload.objects[0].class_name', 3),
  ('read_insight_card_v1', 'grip_succeed', 'smallint', 'payload.grip_succeed (0=실패, 1=성공)', 4),
  ('read_insight_card_v1', 'gripper_type', 'varchar(16)', '그리퍼 종류 (finger/suction)', 5),
  ('read_insight_card_v1', 'occurred_at', 'timestamptz', 'event.occurredAt', 6),
  ('read_insight_card_v1', 'grip_2d_pose', 'jsonb', 'payload.grip_data.grip_2d_pose', 7),
  ('read_insight_card_v1', 'grip_3d_pose', 'jsonb', 'payload.grip_data.grip_3d_pose', 8),
  ('read_insight_card_v1', 'robot_tf', 'jsonb', 'payload.robot_tf', 9),
  ('read_insight_card_v1', 'human_annotation_grasp', 'jsonb', 'payload.human_annotation_grasp', 10),
  ('read_insight_card_v1', 'image_2d_file_name', 'varchar', 'payload["2D_image_file_name"]', 11),
  ('read_insight_card_v1', 'video_file_name', 'varchar', 'payload.video_file_name', 12),
  ('read_insight_card_v1', 'stream_id', 'varchar', 'event.streamId', 13),
  ('read_insight_card_v1', 'global_seq', 'bigint', 'event.globalSeq', 14)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased (v1 → v2)

#### Added
- 신규 Read Model 테이블 read_insight_card_v1 및 InsightCardProjector 구현
- /projection/insight-card 라우트 및 ProjectionService.catchUpInsightCard 메서드

### 마이그레이션 절차

- 하위호환 변경: -
- 파괴적 변경: 없음
- 컷오버 전 테스트: 1. insight.card.request 라우트 호출이 insight.card.miss 대신 valid row set에서 read_insight_card_v1 반환하는지 검증. 2. 기존 grip-result-projector 및 multimodal-projector projection 결과가 unchanged(동일 hash/row count) 유지하는지 검증.
- 롤백 창/조건: DROP TABLE read_insight_card_v1; InsightCardProjector DI 제거; /projection/insight-card 라우트 revert; ProjectionService.catchUpInsightCard 메서드 삭제. 조건: downstream consumer adaptation 실패 또는 storage quota 초과 시.
- Insight 카드 등록: §2의 카드 등록 SQL을 DDL과 함께 적용(카탈로그 동기화)

### 사유·호환성

- 사유: 현재 Read Model 카탈로그에는 read_grip_result와 read_multimodal만 존재, 미구현 통합 뷰(Card) 모델. 사용자가 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고자 요청(Insight Card 조회)이나, 시스템에서는 insight.card.miss로 응답 [corr:7be30198-dc16-4d70-bc4a-78aa5d654ff9] [corr:97b3aa65-5d69-48bf-8f67-4e8079e3bd92] [corr:7c5a7f5d-cb91-4362-af65-2e4ffcf8ca8c]. 신규 read_insight_card_v1 테이블과 InsightCardProjector를 추가하여 통합 뷰를 제공. 기존 v1 프로젝터/테이블은 무손상 유지.
- 트리거 근거: | time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 17:15:12.039 | 30 | insight.card.request | 7be30198-dc16-4d70-bc4a-78aa5d654ff9 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 17:15:12.041 | 40 | insight.card.miss | 7be30198-dc16-4d70-bc4a-78aa5d654ff9 | - | - | - | insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. ← 트립 앵커 | - |
| 17:15:12.347 | 30 | insight.card.request | 97b3aa65-5d69-48bf-8f67-4e8079e3bd92 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 17:15:12.348 | 40 | insight.card.miss | 97b3aa65-5d69-48bf-8f67-4e8079e3bd92 | - | - | - | insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. | - |
| 17:15:12.655 | 30 | insight.card.request | 7c5a7f5d-cb91-4362-af65-2e4ffcf8ca8c | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 17:15:12.657 | 40 | insight.card.miss | 7c5a7f5d-cb91-4362-af65-2e4ffcf8ca8c | - | - | - | insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. | - |
- v1 호환성: 기존 read_grip_result 및 read_multimodal 테이블/프로젝터 클래스/이름은 수정·삭제 금지. 변경은 '추가'다 — 새 테이블(read_insight_card_v1), 새 프로젝터(InsightCardProjector), 새 라우트(/projection/insight-card), 새 서비스 메서드(catchUpInsightCard). v1 코드는 보존, DI/라우트 1줄 추가만.

### 변경 파일

- `src/projection/projection.service.ts` (modifyFile) — InsightCardProjector DI 추가 및 catchUpAll/catchUpInsightCard 메서드 보강. v1 로직 보존.
- `src/projection/projection.controller.ts` (modifyFile) — /projection/insight-card 라우트 추가. v1 엔드포인트 보존.
- `src/shared/database/schema/index.ts` (modifyFile) — 신규 테이블 스키마 export 추가. v1 export 보존.

## Optional — 부속 자료(컨텍스트 축소 시 생략 가능)

### 신규 Read Model — Drizzle 스키마

```ts
import { bigint, jsonb, pgTable, primaryKey, smallint, timestamp, varchar } from 'drizzle-orm/pg-core';

export const readInsightCard = pgTable(
  "read_insight_card_v1",
  {
    sceneKey: varchar("scene_key").notNull(),
    attemptNum: smallint("attempt_num").notNull(),

    objectName: varchar("object_name").notNull(),
    gripSucceed: smallint("grip_succeed").notNull(),
    gripperType: varchar("gripper_type", { length: 16 }).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),

    grip2dPose: jsonb("grip_2d_pose"),
    grip3dPose: jsonb("grip_3d_pose"),
    robotTf: jsonb("robot_tf"),
    humanAnnotationGrasp: jsonb("human_annotation_grasp"),

    image2dFileName: varchar("image_2d_file_name"),
    videoFileName: varchar("video_file_name"),

    streamId: varchar("stream_id").notNull(),
    globalSeq: bigint("global_seq", { mode: "number" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.sceneKey, t.attemptNum] })],
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
import { readInsightCard } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

type ReadInsightCardInsert = InferInsertModel<typeof readInsightCard>;

@Injectable()
export class InsightCardProjector implements Projector<ReadInsightCardInsert> {
  readonly name: string = "insight-card-projector";

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(InsightCardProjector.name);
  }

  map(event: EventStoreEventRow): ReadInsightCardInsert {
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
        `insight-card map: empty objects in event ${event.eventId}`,
      );
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
      sceneKey: event.streamId.replace(/^grip-attempt:/, ""),
      attemptNum: event.attemptNum,
      objectName: payload.objects[0].class_name,
      gripSucceed: payload.grip_succeed,
      gripperType: "finger",
      occurredAt: event.occurredAt,
      grip2dPose: payload.grip_data.grip_2d_pose,
      grip3dPose: payload.grip_data.grip_3d_pose,
      robotTf: payload.robot_tf,
      humanAnnotationGrasp: payload.human_annotation_grasp,
      image2dFileName: payload["2D_image_file_name"],
      videoFileName: payload.video_file_name,
      streamId: event.streamId,
      globalSeq: event.globalSeq,
    };
  }

  async upsert(tx: DrizzleTx, row: ReadInsightCardInsert): Promise<void> {
    await tx
      .insert(readInsightCard)
      .values(row)
      .onConflictDoUpdate({
        target: [readInsightCard.sceneKey, readInsightCard.attemptNum],
        set: {
          objectName: row.objectName,
          gripSucceed: row.gripSucceed,
          gripperType: row.gripperType,
          occurredAt: row.occurredAt,
          grip2dPose: row.grip2dPose,
          grip3dPose: row.grip3dPose,
          robotTf: row.robotTf,
          humanAnnotationGrasp: row.humanAnnotationGrasp,
          image2dFileName: row.image2dFileName,
          videoFileName: row.videoFileName,
          streamId: row.streamId,
          globalSeq: row.globalSeq,
        },
      });
  }
}
```

### 신규 Read Model — 배선(컨트롤러/서비스/모듈)

```ts
// src/shared/database/schema/index.ts
export * from "./service/read-insight-card";

// src/projection/projection.service.ts (additions)
import { InsightCardProjector } from '@/projection/projector/insight-card.projector';
// ... inside constructor:
private readonly insightCard: InsightCardProjector,
// ... method:
catchUpInsightCard(): Promise<ProjectionResult> {
  return this.runner.run(this.insightCard);
}

// src/projection/projection.controller.ts (additions)
@Post("/insight-card")
insightCard(): Promise<ProjectionResult> {
  this.logger.info(
    {
      action: LogAction.PROJECTION_REQUEST,
      [LogContext.ROUTE]: "POST /projection/insight-card",
    },
    "projection 요청 수신",
  );

  return this.projectionService.catchUpInsightCard();
}

// src/projection/projection.module.ts (additions)
providers: [InsightCardProjector],
```

### 버전 교체 코드 — `src/projection/projection.service.ts` (modifyFile)

```typescript
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { InsightCardProjector } from '@/projection/projector/insight-card.projector';
import { ProjectionResult } from '@/projection/projector/projector';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';
import { LogAction } from '@/shared/logger/logging-context';

export type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
  insightCard: ProjectionResult;
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
    private readonly insightCard: InsightCardProjector,
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

  catchUpInsightCard(): Promise<ProjectionResult> {
    return this.runner.run(this.insightCard);
  }

  async catchUpAll(): Promise<CatchUpAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_START }, "전체 투영 시작");

    const multimodal: ProjectionResult = await this.catchUpMultimodal();
    const gripResult: ProjectionResult = await this.catchUpGripResult();
    const insightCard: ProjectionResult = await this.catchUpInsightCard();

    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");

    return { multimodal, gripResult, insightCard };
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

  @Post("/insight-card")
  insightCard(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/insight-card",
      },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpInsightCard();
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
export * from "./service/read-insight-card-v1";
```

## Guardrails (constraints)

- v1 자산(테이블/엔드포인트/프로젝터 name) 무손상
- PK (scene_key, attempt_num) 유지
- TypeScript any 금지
- 식별자 전체 단어
- DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)
- Read Model 테이블명은 read_ 접두 스네이크 케이스
---
docId: analysis-ab2f93e1-c6ca-4376-89bf-58e370e2183c
generatedAt: 2026-08-12T07:06:00.383Z
targetReadModel: read_grip_with_media
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: v1
  to: v2
  affectedEndpoints:
    - "POST /multimodal"
    - "POST /grip-result"
    - "POST /grip-with-media"
    - "POST /insert-all"
evidenceSources:
  - { origin: developer-logging, anchorId: "589a524e-9415-4594-9662-4f98606d8220" }
  - { origin: developer-logging, anchorId: "ab2f93e1-c6ca-4376-89bf-58e370e2183c" }
  - { origin: developer-logging, anchorId: "f86d2bc6-3595-4527-a109-46e092283e28" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_grip_with_media

> 결론(TL;DR): `read_grip_with_media`을(를) 재생성한다 — 사용자가 '파지 결과(fuzzy result)'와 '이미지·영상 경로(image/video path)'를 한 화면에서 동시에 조회 요청을 반복(3회)하나, 해당 결합된 데이터视图의 Insight Card가 존재하지. 현재 파지 결과는 `read_grip_result` 테이블에, 이미지는 `read_multimodal` 테이블에 분할되어 있어, 단일 카드 조회로는 충족이 불가능. (이상 유형: 卡片 없는 Read Model 테이블 · 심각도: warning)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `projection.request`(level 30) 2회, `projection.batch`(level 30) 2회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `projection.event.mapped`(level 20) 60회, `-`(level 30) 5회, `projection.start`(level 30) 2회, `-`(level 20) 6회, `insert.request`(level 30) 1회, `insight.card.request`(level 30) 2회, `log.delete.done`(level 30) 1회, `insight.card.miss`(level 40) 2회, `insert.file.ok`(level 20) 60회, `projection.done`(level 30) 2회, `projection.cursor.advanced`(level 20) 2회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 07:00:18.023 | 30 | projection.batch | 0ac226b5-20a6-4c4d-acfe-3d05219b4905 | - | - | - | 배치 처리 | projector=grip-result-projector |
| 07:00:18.023 | 20 | projection.cursor.advanced | 0ac226b5-20a6-4c4d-acfe-3d05219b4905 | - | - | - | 커서 이동 | projector=grip-result-projector |
| 07:00:18.026 | 30 | insight.card.request | 589a524e-9415-4594-9662-4f98606d8220 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 07:00:18.028 | 30 | - | 589a524e-9415-4594-9662-4f98606d8220 | - | - | - | request completed | - |
| 07:00:18.028 | 40 | insight.card.miss | 589a524e-9415-4594-9662-4f98606d8220 | - | - | - | insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. | - |
| 07:00:18.334 | 30 | insight.card.request | ab2f93e1-c6ca-4376-89bf-58e370e2183c | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 07:00:18.336 | 40 | insight.card.miss | ab2f93e1-c6ca-4376-89bf-58e370e2183c | - | - | - | insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. ← 트립 앵커 | - |
| 07:00:18.337 | 30 | - | ab2f93e1-c6ca-4376-89bf-58e370e2183c | - | - | - | request completed | - |
| 07:00:18.641 | 30 | insight.card.request | f86d2bc6-3595-4527-a109-46e092283e28 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 07:00:18.644 | 40 | insight.card.miss | f86d2bc6-3595-4527-a109-46e092283e28 | - | - | - | insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. | - |
| 07:00:18.645 | 30 | - | f86d2bc6-3595-4527-a109-46e092283e28 | - | - | - | request completed | - |
| 07:00:20.521 | 30 | llm.prejudge.triggered | - | - | - | - | 선판단: 비정상 | reason=결정론 프리게이트: level>=40 로그 1건 (insight.card.miss) |
| 07:00:20.533 | 20 | - | - | - | - | - | 이상 로그 윈도우 조립 | - |
| 07:00:20.534 | 20 | - | - | - | - | - | 엔티티 목록 조회 | - |
| 07:00:20.537 | 20 | insight.card.rendered | - | - | - | - | insight 카드 렌더 | - |
| 07:00:20.537 | 20 | - | - | - | - | - | 카드 데이터 조회 | - |
| 07:00:20.539 | 20 | - | - | - | - | - | 카드 데이터 조회 | - |

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
- (level 30, `insight.card.request`) insight 카드 단건 조회 요청 수신 → 단일 카드 조인 조회 요청 수신 [corr:589a524e-9415-4594-9662-4f98606d8220]
- (level 40, `insight.card.miss`) insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. → 기존 분할 테이블로는 동시 조회 불가능 [corr:589a524e-9415-4594-9662-4f98606d8220]
- (level 40, `insight.card.miss`) insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. ← 트립 앵커 → 동일 조인 요구 재시도 실패 [corr:ab2f93e1-c6ca-4376-89bf-58e370e2183c]
- (level 40, `insight.card.miss`) insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. → 3회 반복 실패로 신규 결합 테이블 필요 [corr:f86d2bc6-3595-4527-a109-46e092283e28]
- read_grip_result 스키마는 (scene_key, attempt_num) Primary Key 정의하며 grip_2d_pose, object_name 등 파지 데이터만 보유 [corr:589a524e-9415-4594-9662-4f98606d8220]
- read_multimodal 스키마 동 (scene_key, attempt_num) Primary Key 공유나 image_2d_uri, video_uri 컬럼이 src/projection/projector/multimodal.projector.ts map() 메서드 null 고정 [corr:ab2f93e1-c6ca-4376-89bf-58e370e2183c]
- 두 테이블 동 키 기준 조인(join) 필요나 기존 프로젝터(GripResultProjector, MultiModalProjector) 독립 행 투영만 [corr:f86d2bc6-3595-4527-a109-46e092283e28]

### Decision Drivers
- 사용자의 3회 반복 단일 화면 조회 의도
- 명시 (scene_key, attempt_num) 기준 join 요구명
- 기존 URI 컬럼 null 상태 및 클라이언트 조인 latency/일관성 저하
- 아키텍처 선호 declarative Read Model over imperative client join

### Considered Options
#### newReadModel (Join Projector)
- 접근: 신규 GripWithMediaProjector 구현(src/projection/projector/grip-with-media.projector.ts)을 read_grip_with_media 테이블 동 (scene_key, attempt_num) 기준 단일 행 투영
- 제안 필드: scene_key, attempt_num, object_name, grip_succeed, gripper_type, occurred_at, grip_2d_pose, grip_3d_pose, robot_tf, human_annotation_grasp, stream_id, global_seq, image_2d_file_name, image_2d_uri, video_file_name, video_uri
- 트레이드오프: 신 migration SQL 실행과 초기 catch-up 오버헤드 발생; 대신 클라이언트 조인 latency 제로와 영속성 레ayer 일관성 보장
```typescript
return { sceneKey: event.streamId.replace(/^grip-attempt:/, ""), attemptNum: event.attemptNum, objectName: payload.objects[0].class_name, gripSucceed: payload.grip_succeed, gripperType: "finger", occurredAt: event.occurredAt, grip2dPose: payload.grip_data.grip_2d_pose, grip3dPose: payload.grip_data.grip_3d_pose, robotTf: payload.robot_tf, humanAnnotationGrasp: payload.human_annotation_grasp, streamId: event.streamId, globalSeq: event.globalSeq, image2dFileName: payload["2D_image_file_name"], image2dUri: null, videoFileName: payload.video_file_name, videoUri: null };
```

#### versionSwitch (Dual Query API)
- 접근: ProjectionController 확장을 /projection/grip-with-media 엔드포인트로 기존 두 catchUp 호출을 in-memory join 후 반환
- 제안 필드: scene_key, attempt_num, object_name, grip_succeed, gripper_type, occurred_at, grip_2d_pose, grip_3d_pose, robot_tf, human_annotation_grasp, stream_id, global_seq, image_2d_file_name, image_2d_uri, video_file_name, video_uri
- 트레이드오프: DB 스키마 변경 제로; 대신 클라이언트 조인 복잡성 증가와 동시간 투영 일관성 저하
```typescript
const gripRows = await this.projectionService.catchUpGripResult(); const modalRows = await this.projectionService.catchUpMultimodal(); return this.joinInMemory(gripRows, modalRows);
```

### Decision Outcome
newReadModel (Join Projector)

### Consequences
- (+) 단일 카드 조회 즉시 성공
- (+) 데이터 수명사 일관성 보장
- (+) URI 매핑 로직 중앙화 가능
- (−) 신 migration SQL 실행 필요
- (−) 초기 catch-up 오버헤드 발생
- (−) row storage 용량 소폭 증가

### Non-Goals
- 기존 read_grip_result/read_multimodal 스키마 재팩토링
- URI resolution 로직 구현(유지연체)
- event payload schema(toy-data.dto.ts) 수정

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

- 대상: `read_grip_with_media` · 키: (scene_key, attempt_num) · 원천 이벤트: GripAttemptRecorded

```sql
CREATE TABLE read_grip_with_media (
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
  image_2d_file_name varchar,
  image_2d_uri text,
  video_file_name varchar,
  video_uri text,
  PRIMARY KEY (scene_key, attempt_num)
);
```

### 필드

```mschema
# Table: read_grip_with_media
[
(scene_key:varchar, 장면 식별 키 = stream_id.replace(/^grip-attempt:/, ''), Primary Key),
(attempt_num:smallint, 동일 장면 내 파지 시도 번호, Primary Key),
(object_name:varchar, 파지 대상 객체명 (payload.objects[0].class_name)),
(grip_succeed:smallint, 파지 성공 여부 (0=실패, 1=성공)),
(gripper_type:varchar(16), 그리퍼 종류 (finger/suction)),
(occurred_at:timestamptz, 데이터 촬영 일자),
(grip_2d_pose:jsonb, 2D 파지점 (핑거: xl,xr,yl,yr / 흡착: x,y)),
(grip_3d_pose:jsonb, 3D 파지점 (핑거: x1..z8 24좌표 / 흡착: x,y,z,roll,pitch,yaw,penetrate)),
(robot_tf:jsonb, 로봇 변환행렬 (rotation_3x3 9개 + translation_3x1 3개)),
(human_annotation_grasp:jsonb, 휴먼 어노테이션 파지 영역),
(stream_id:varchar, ES 스트림 ID (grip-attempt: + scene_key)),
(global_seq:bigint, 투영 출처 이벤트의 ES 전역 시퀀스),
(image_2d_file_name:varchar, 원천 2D 이미지 파일명 (payload.2D_image_file_name)),
(image_2d_uri:text, 2D 이미지 저장 위치 URI),
(video_file_name:varchar, 원천 비디오 파일명 (시도번호 자리가 항상 00)),
(video_uri:text, 비디오 저장 위치 URI)
]
```

### 투영 매핑 명세 (이벤트 → 컬럼)

> upsert 키: (scene_key, attempt_num) · 리플레이: projection_cursor 초기화 시 반드시 0 또는 첫 이벤트 seq 설정. catch-up 전체 재투영 시 upsert 전제 조건(멱idency) 확인: 동일 (scene_key, attempt_num) 키가 존재할 경우 payload overwrite 허용, 단 derived 필드 일관성 유지.

| 원천 이벤트 | payload 필드 | 컬럼 | 변환 |
| --- | --- | --- | --- |
| GripAttemptRecorded | objects[].class_name | object_name | verbatim |
| GripAttemptRecorded | grip_succeed | grip_succeed | verbatim |
| GripAttemptRecorded | grip_data.grip_2d_pose | grip_2d_pose | verbatim |
| GripAttemptRecorded | grip_data.grip_3d_pose | grip_3d_pose | verbatim |
| GripAttemptRecorded | human_annotation_grasp | human_annotation_grasp | verbatim |
| GripAttemptRecorded | 2D_image_file_name | image_2d_file_name | verbatim |
| GripAttemptRecorded | video_file_name | video_file_name | verbatim |

파생 컬럼(이벤트 payload 아님):
- `scene_key` ← stream_id.replace(/^grip-attempt:/, '')
- `attempt_num` ← extract attempt number from data_key filename pattern (index 4)
- `occurred_at` ← parse YYYYMMDD date from data_key split index 5 to ISO timestamp
- `gripper_type` ← constant('finger')
- `robot_tf` ← {rotation_3x3: payload.robot_tf.rotation_3x3, translation_3x1: payload.robot_tf.translation_3x1}
- `stream_id` ← event.stream_id (system context)
- `global_seq` ← event.global_seq (system context)
- `image_2d_uri` ← null
- `video_uri` ← null

### Insight 카드 등록 (Insight Read DB 동기화)

> DDL 적용 시 아래 카드 등록도 함께 실행한다 — 다음 분석부터 신규 Read Model 이 LLM 컨텍스트에 노출된다.

```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_grip_with_media', 'read_model', '단일 Read Model 테이블로 파지 결과와 해당 시도의 이미지·비디오 경로를 결합하여, Insight 카드 시스템에서 한 화면으로 동조회를 지원.', '(scene_key, attempt_num)')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_grip_with_media', 'scene_key', 'varchar', '장면 식별 키 = stream_id.replace(/^grip-attempt:/, '''')', 1),
  ('read_grip_with_media', 'attempt_num', 'smallint', '동일 장면 내 파지 시도 번호', 2),
  ('read_grip_with_media', 'object_name', 'varchar', '파지 대상 객체명 (payload.objects[0].class_name)', 3),
  ('read_grip_with_media', 'grip_succeed', 'smallint', '파지 성공 여부 (0=실패, 1=성공)', 4),
  ('read_grip_with_media', 'gripper_type', 'varchar(16)', '그리퍼 종류 (finger/suction)', 5),
  ('read_grip_with_media', 'occurred_at', 'timestamptz', '데이터 촬영 일자', 6),
  ('read_grip_with_media', 'grip_2d_pose', 'jsonb', '2D 파지점 (핑거: xl,xr,yl,yr / 흡착: x,y)', 7),
  ('read_grip_with_media', 'grip_3d_pose', 'jsonb', '3D 파지점 (핑거: x1..z8 24좌표 / 흡착: x,y,z,roll,pitch,yaw,penetrate)', 8),
  ('read_grip_with_media', 'robot_tf', 'jsonb', '로봇 변환행렬 (rotation_3x3 9개 + translation_3x1 3개)', 9),
  ('read_grip_with_media', 'human_annotation_grasp', 'jsonb', '휴먼 어노테이션 파지 영역', 10),
  ('read_grip_with_media', 'stream_id', 'varchar', 'ES 스트림 ID (grip-attempt: + scene_key)', 11),
  ('read_grip_with_media', 'global_seq', 'bigint', '투영 출처 이벤트의 ES 전역 시퀀스', 12),
  ('read_grip_with_media', 'image_2d_file_name', 'varchar', '원천 2D 이미지 파일명 (payload.2D_image_file_name)', 13),
  ('read_grip_with_media', 'image_2d_uri', 'text', '2D 이미지 저장 위치 URI', 14),
  ('read_grip_with_media', 'video_file_name', 'varchar', '원천 비디오 파일명 (시도번호 자리가 항상 00)', 15),
  ('read_grip_with_media', 'video_uri', 'text', '비디오 저장 위치 URI', 16)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased (v1 → v2)

#### Added
- 신규 Read Model 테이블 read_grip_with_media 및 GripWithMediaProjector 구현으로 파지 결과와 미디어 경로 동시 조회 지원
- /projection/grip-with-media 라우트 배선 및 ProjectionService.catchUpGripWithMedia 메서드 추가

### 마이그레이션 절차

- 하위호환 변경: 기존 read_grip_result, read_multimodal 테이블과 v1 프로젝터·라우트는 무손상 유지; 신규 라우트(/projection/grip-with-media)는 additive이므로 기존 클라이언트 호출 경로 영향 없음
- 파괴적 변경: 없음
- 컷오버 전 테스트: 최신 ES 스트림 대 GripWithMediaProjector.run() 실행 검증: read_grip_with_media 테이블 적재 완료 확인. insight.card.request로 동시 파지+미디어 조회가 신규 테이블 매칭 성공. v1 라우트(/projection/grip-result, /projection/multimodal) 정상 동작 재확인.
- 롤백 창/조건: read_grip_with_media 테이블 DROP. src/shared/database/schema/index.ts export 제거. ProjectionService DI/메서드 revert. ProjectionController @Post("/grip-with-media") 제거. v1 라우트·프로젝터 복재.
- Insight 카드 등록: §2의 카드 등록 SQL을 DDL과 함께 적용(카탈로그 동기화)

### 사유·호환성

- 사유: 기존 Read Model 아키텍처는 파지 결과와 미디어 경로가 분할된 두 테이블에 저장되어 있다. 사용자의 반복 조회 요청은 이 두 결합된 화면의 Insight Card를 한 화면에서 동시에 요구하나, 현재 아키텍처로는 단일 카드 조회로 충족이 불가능한 상태다 [corr:589a524e-9415-4594-9662-4f98606d8220]. v1 GripResultProjector와 MultiModalProjector는 각각 payload의 파지/로봇 데이터와 미디어 파일명을 추출하여 별도 테이블을 적재하므로, 신규 결합 화면을 위한 read_grip_with_media 테이블과 GripWithMediaProjector가 필연하다.
- 트리거 근거: | time | level | action | correlation_id | msg |
| --- | --- | --- | --- | --- |
| 07:00:18.026 | 30 | insight.card.request | 589a524e-9415-4594-9662-4f98606d8220 | insight 카드 단건 조회 요청 수신 |
| 07:00:18.028 | 40 | insight.card.miss | 589a524e-9415-4594-9662-4f98606d8220 | insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. |
| 07:00:18.334 | 30 | insight.card.request | ab2f93e1-c6ca-4376-89bf-58e370e2183c | insight 카드 단건 조회 요청 수신 |
| 07:00:18.336 | 40 | insight.card.miss | ab2f93e1-c6ca-4376-89bf-58e370e2183c | insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. ← 트립 앵커 |
| 07:00:18.641 | 30 | insight.card.request | f86d2bc6-3595-4527-a109-46e092283e28 | insight 카드 단건 조회 요청 수신 |
| 07:00:18.644 | 40 | insight.card.miss | f86d2bc6-3595-4527-a109-46e092283e28 | insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. |

v1 코드의 문제 지점: GripResultProjector.map()과 MultiModalProjector.map()은 각각 payload.objects[0].class_name, payload.grip_succeed 등 파지 데이터와 payload['2D_image_file_name'], payload.video_file_name 등 미디어 데이터를 추출하여 서로 다른 테이블(readGripResult, readMultimodal)에 적재한다. Insight Card 레이어는 단일 테이블 조회를 가정하므로 이 분할 구조로는 동시 조회 요청을 충족할 수 없다.
- v1 호환성: read_grip_result와 read_multimodal 테이블 및 기존 프로젝터·라우트·서비스 메서드는 완전히 보존된다. 신규 테이블과 배선은 additive이므로 v1 호환성 유지.

### 변경 파일

- `src/shared/database/schema/index.ts` (modifyFile) — 신규 read-grip-with-media 스키마 export 추가. 기존 export 라인 보존.
- `src/projection/projection.service.ts` (modifyFile) — GripWithMediaProjector DI 추가 및 catchUpGripWithMedia 메서드 배선. 기존 import/constructor/methods 보존.
- `src/projection/projection.controller.ts` (modifyFile) — /projection/grip-with-media 라우트 배선. 기존 라우트 보존.

## Optional — 부속 자료(컨텍스트 축소 시 생략 가능)

### 신규 Read Model — Drizzle 스키마

```ts
import { bigint, index, jsonb, pgTable, primaryKey, smallint, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const readGripWithMedia = pgTable(
  "read_grip_with_media",
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

    streamId: varchar("stream_id").notNull(),
    globalSeq: bigint("global_seq", { mode: "number" }).notNull(),

    image2dFileName: varchar("image_2d_file_name"),
    image2dUri: text("image_2d_uri"),
    videoFileName: varchar("video_file_name"),
    videoUri: text("video_uri"),
  },
  (t) => [
    primaryKey({ columns: [t.sceneKey, t.attemptNum] }),
    index("idx_grip_with_media_object").on(t.objectName, t.occurredAt),
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
import { readGripWithMedia } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

type ReadGripWithMediaInsert = InferInsertModel<typeof readGripWithMedia>;

@Injectable()
export class GripWithMediaProjector implements Projector<ReadGripWithMediaInsert> {
  readonly name: string = "grip-with-media-projector";

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(GripWithMediaProjector.name);
  }

  map(event: EventStoreEventRow): ReadGripWithMediaInsert {
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

      throw new Error(`grip-with-media map: empty objects in event ${event.eventId}`);
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
      streamId: event.streamId,
      globalSeq: event.globalSeq,
      image2dFileName: payload["2D_image_file_name"],
      image2dUri: null,
      videoFileName: payload.video_file_name,
      videoUri: null,
    };
  }

  async upsert(tx: DrizzleTx, row: ReadGripWithMediaInsert): Promise<void> {
    await tx
      .insert(readGripWithMedia)
      .values(row)
      .onConflictDoUpdate({
        target: [readGripWithMedia.sceneKey, readGripWithMedia.attemptNum],
        set: {
          objectName: row.objectName,
          gripSucceed: row.gripSucceed,
          gripperType: row.gripperType,
          occurredAt: row.occurredAt,
          grip2dPose: row.grip2dPose,
          grip3dPose: row.grip3dPose,
          robotTf: row.robotTf,
          humanAnnotationGrasp: row.humanAnnotationGrasp,
          streamId: row.streamId,
          globalSeq: row.globalSeq,
          image2dFileName: row.image2dFileName,
          image2dUri: row.image2dUri,
          videoFileName: row.videoFileName,
          videoUri: row.videoUri,
        },
      });
  }
}
```

### 신규 Read Model — 배선(컨트롤러/서비스/모듈)

```ts
export * from "./service/read-grip-with-media";

// ProjectionService 주입·catchUp<Name>()
private readonly gripWithMedia: GripWithMediaProjector,
catchUpGripWithMedia(): Promise<ProjectionResult> {
  return this.runner.run(this.gripWithMedia);
}

// Controller @Post 라우트 (기존 라우트와 동일한 PinoLogger.info 로깅)
@Post("/grip-with-media")
gripWithMedia(): Promise<ProjectionResult> {
  this.logger.info(
    {
      action: LogAction.PROJECTION_REQUEST,
      [LogContext.ROUTE]: "POST /projection/grip-with-media",
    },
    "projection 요청 수신",
  );

  return this.projectionService.catchUpGripWithMedia();
}

// ProjectionModule providers 등록
providers: [...existingProviders, GripWithMediaProjector],
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
export * from "./service/read-grip-with-media";
```

### 버전 교체 코드 — `src/projection/projection.service.ts` (modifyFile)

```typescript
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { GripWithMediaProjector } from '@/projection/projector/grip-with-media.projector';
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
    private readonly insertService: InsertService,
    private readonly gripWithMedia: GripWithMediaProjector,
  ) {
    this.logger.setContext(ProjectionService.name);
  }

  catchUpMultimodal(): Promise<ProjectionResult> {
    return this.runner.run(this.multimodal);
  }

  catchUpGripResult(): Promise<ProjectionResult> {
    return this.runner.run(this.gripResult);
  }

  catchUpGripWithMedia(): Promise<ProjectionResult> {
    return this.runner.run(this.gripWithMedia);
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

  @Post("/grip-with-media")
  gripWithMedia(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/grip-with-media",
      },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpGripWithMedia();
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
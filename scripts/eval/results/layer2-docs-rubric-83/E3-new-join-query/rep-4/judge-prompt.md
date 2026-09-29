당신은 이벤트 소싱 + CQRS 기반 Physical AI 데이터 플랫폼의 시니어 아키텍트이자 엄격한 평가자다. LLM 파이프라인이 [자료](로그·이벤트·스키마 정보)를 보고 [Docs]를 생성했다. Docs 는 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소를 항상 함께 담아야 하는 단일 산출물이다. 당신은 [정답 요지]와 [자료], [자동 검증 결과]를 기준으로 Docs 를 네 항목의 루브릭으로 채점한다. 채점은 관대하지 않게, 근거 없는 주장·지어낸 값·의도와 다른 SQL·서로 어긋나는 절에는 낮은 점수를 준다. 반드시 JSON 객체 하나만 출력한다. 설명문·마크다운 펜스는 출력하지 않는다.

---

[시나리오] E3-new-join-query
[상황] 사용자가 아래 조회를 요청했으나 기존 Read Model 로는 제공할 수 없다.
[정답 요지] 사용자가 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 보길 요청했으나 read_grip_result 와 read_multimodal 이 분리돼 있어 통합 Read Model 이 없음. 조치: (scene_key, attempt_num) 으로 조인한 통합 Read Model 신설(또는 뷰) + 백필, API v2 병행.

[자료] — Docs 생성 시 파이프라인이 받은 로그·이벤트·스키마 정보
<<<자료 시작>>>
<logging_context>
## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `projection.request`(level 30) 2회, `projection.batch`(level 30) 2회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `projection.event.mapped`(level 20) 60회, `-`(level 30) 5회, `projection.start`(level 30) 2회, `-`(level 20) 6회, `insert.request`(level 30) 1회, `insight.card.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insight.card.miss`(level 40) 1회, `insert.file.ok`(level 20) 60회, `projection.done`(level 30) 2회, `projection.cursor.advanced`(level 20) 2회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 00:13:45.839 | 20 | projection.cursor.advanced | e3c5102d-b8d7-437d-b77c-c6138393a1ab | - | - | - | 커서 이동 | projector=grip-result-projector |
| 00:13:45.839 | 30 | projection.done | e3c5102d-b8d7-437d-b77c-c6138393a1ab | - | - | - | catch-up 완료 | projector=grip-result-projector |
| 00:13:45.839 | 30 | - | e3c5102d-b8d7-437d-b77c-c6138393a1ab | - | - | - | request completed | - |
| 00:13:45.839 | 30 | projection.batch | e3c5102d-b8d7-437d-b77c-c6138393a1ab | - | - | - | 배치 처리 | projector=grip-result-projector |
| 00:13:45.842 | 30 | insight.card.request | 628677b3-2b44-4797-a757-d2d6c89bb1b3 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 00:13:45.844 | 40 | insight.card.miss | 628677b3-2b44-4797-a757-d2d6c89bb1b3 | - | - | - | insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. ← 트립 앵커 | - |
| 00:13:45.844 | 30 | - | 628677b3-2b44-4797-a757-d2d6c89bb1b3 | - | - | - | request completed | - |
| 00:13:46.148 | 30 | insight.card.request | 20896524-b5fa-4f6c-b34b-55718e7308be | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 00:13:46.150 | 40 | insight.card.miss | 20896524-b5fa-4f6c-b34b-55718e7308be | - | - | - | insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. | - |
| 00:13:46.151 | 30 | - | 20896524-b5fa-4f6c-b34b-55718e7308be | - | - | - | request completed | - |
| 00:13:46.457 | 30 | insight.card.request | 5f099ca6-e987-4b72-97b6-ac792f0d48cd | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 00:13:46.460 | 30 | - | 5f099ca6-e987-4b72-97b6-ac792f0d48cd | - | - | - | request completed | - |
| 00:13:46.460 | 40 | insight.card.miss | 5f099ca6-e987-4b72-97b6-ac792f0d48cd | - | - | - | insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. | - |
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
<<<자료 끝>>>

[자동 검증 결과] — 실제 데이터베이스 실행·컴파일 결과. 실행 가능성 판단의 실측 근거로 삼는다.
- 문서 검사: 전 항목 통과
- SQL 실행: 블록 2개 중 2개 실행 성공
- 코드 컴파일: 파일 4개 중 4개 통과

[Docs] — 채점 대상 문서 전문
<<<Docs 시작>>>
---
docId: analysis-628677b3-2b44-4797-a757-d2d6c89bb1b3
generatedAt: 2026-08-13T00:13:48.493Z
targetReadModel: read_grip_result_with_media
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: v1
  to: v2
  affectedEndpoints:
    - "POST /multimodal"
    - "POST /grip-result"
    - "POST /grip-result-with-media"
    - "POST /insert-all"
evidenceSources:
  - { origin: developer-logging, anchorId: "628677b3-2b44-4797-a757-d2d6c89bb1b3" }
  - { origin: developer-logging, anchorId: "20896524-b5fa-4f6c-b34b-55718e7308be" }
  - { origin: developer-logging, anchorId: "5f099ca6-e987-4b72-97b6-ac792f0d48cd" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_grip_result_with_media

> 결론(TL;DR): `read_grip_result_with_media`을(를) 재생성한다 — 사용자가 파지 결과(성공/실패, 좌표 등)와 동시 발생한 이미지·비디오 경로 정보를 단일 화면에서 함께 조회를 요청하나, 시스템에 결결한 통합 Insight Card(Read Model)로 두 정보의 동시 제공이 불가능. (이상 유형: 카드 없는 Read Model 테이블 · 심각도: warning)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `projection.request`(level 30) 2회, `projection.batch`(level 30) 2회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `projection.event.mapped`(level 20) 60회, `-`(level 30) 5회, `projection.start`(level 30) 2회, `-`(level 20) 6회, `insert.request`(level 30) 1회, `insight.card.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insight.card.miss`(level 40) 1회, `insert.file.ok`(level 20) 60회, `projection.done`(level 30) 2회, `projection.cursor.advanced`(level 20) 2회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 00:13:45.839 | 20 | projection.cursor.advanced | e3c5102d-b8d7-437d-b77c-c6138393a1ab | - | - | - | 커서 이동 | projector=grip-result-projector |
| 00:13:45.839 | 30 | projection.done | e3c5102d-b8d7-437d-b77c-c6138393a1ab | - | - | - | catch-up 완료 | projector=grip-result-projector |
| 00:13:45.839 | 30 | - | e3c5102d-b8d7-437d-b77c-c6138393a1ab | - | - | - | request completed | - |
| 00:13:45.839 | 30 | projection.batch | e3c5102d-b8d7-437d-b77c-c6138393a1ab | - | - | - | 배치 처리 | projector=grip-result-projector |
| 00:13:45.842 | 30 | insight.card.request | 628677b3-2b44-4797-a757-d2d6c89bb1b3 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 00:13:45.844 | 40 | insight.card.miss | 628677b3-2b44-4797-a757-d2d6c89bb1b3 | - | - | - | insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. ← 트립 앵커 | - |
| 00:13:45.844 | 30 | - | 628677b3-2b44-4797-a757-d2d6c89bb1b3 | - | - | - | request completed | - |
| 00:13:46.148 | 30 | insight.card.request | 20896524-b5fa-4f6c-b34b-55718e7308be | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 00:13:46.150 | 40 | insight.card.miss | 20896524-b5fa-4f6c-b34b-55718e7308be | - | - | - | insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. | - |
| 00:13:46.151 | 30 | - | 20896524-b5fa-4f6c-b34b-55718e7308be | - | - | - | request completed | - |
| 00:13:46.457 | 30 | insight.card.request | 5f099ca6-e987-4b72-97b6-ac792f0d48cd | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 00:13:46.460 | 30 | - | 5f099ca6-e987-4b72-97b6-ac792f0d48cd | - | - | - | request completed | - |
| 00:13:46.460 | 40 | insight.card.miss | 5f099ca6-e987-4b72-97b6-ac792f0d48cd | - | - | - | insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. | - |

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
- (level 40, `insight.card.miss`) insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. → 기존 Read Model 구조적 부족으로 동시 조회 실패. [corr:628677b3-2b44-4797-a757-d2d6c89bb1b3]
- (level 40, `insight.card.miss`) insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. → 동일 의도 재발로 JOIN 요구사항 명확화. [corr:20896524-b5fa-4f6c-b34b-55718e7308be]
- (level 40, `insight.card.miss`) insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. → 3회 미스 누적, 단일 조회로는 충족 불가능. [corr:5f099ca6-e987-4b72-97b6-ac792f0d48cd]
- read_grip_result 테이블의 (scene_key, attempt_num) 키와 컬럼(grip_succeed, grip_2d_pose 등)은 파지 데이터만 담고, image_2d_file_name/video_file_name 결결. [corr:628677b3-2b44-4797-a757-d2d6c89bb1b3]
- read_multimodal 테이블의 동키 구조는 미디어 파일명(image_2d_file_name, video_file_name)만 담고, URI 컬럼(image_2d_uri, video_uri)은 MultiModalProjector.map()에서 null 고정. [corr:628677b3-2b44-4797-a757-d2d6c89bb1b3]
- src/projection/projector/grip-result.projector.ts의 map()과 src/projection/projector/multimodal.projector.ts의 map()은 서로 다른 테이블(readGripResult, readMultimodal)을 upsert() 호출, 조인(JOIN) 로직 부재. [corr:20896524-b5fa-4f6c-b34b-55718e7308be]
- Insight 카드 조회(insight.card.request) 실패는 단일 테이블 기준 read_grip_result 또는 read_multimodal 만으로는 동시 제공 불가능. [corr:5f099ca6-e987-4b72-97b6-ac792f0d48cd]

### Decision Drivers
- 단일 화면 동시 조회 요구사항 충족
- Read Model 추상성 유지(CQRS 준수)
- Projection 성능 vs Storage tradeoff
- Schema evolution 호환성

### Considered Options
#### newReadModel
- 접근: 신규 프로젝터(GripResultWithMediaProjector) 구현, map()에서 두 payload/row 합쳐서 단일 테이블 read_grip_result_with_media upsert().
- 제안 필드: scene_key, attempt_num, object_name, grip_succeed, gripper_type, occurred_at, grip_2d_pose, grip_3d_pose, robot_tf, human_annotation_grasp, image_2d_file_name, video_file_name, stream_id, global_seq
- 트레이드오프: Storage duplication(~2x), migration cost, but single-query UI 충족.
```typescript
return { sceneKey: event.streamId.replace(/^grip-attempt:/, ""), attemptNum: event.attemptNum, objectName: payload.objects[0].class_name, gripSucceed: payload.grip_succeed, gripperType: "finger", occurredAt: event.occurredAt, grip2dPose: payload.grip_data.grip_2d_pose, grip3dPose: payload.grip_data.grip_3d_pose, robotTf: payload.robot_tf, humanAnnotationGrasp: payload.human_annotation_grasp, image2dFileName: payload["2D_image_file_name"], videoFileName: payload.video_file_name, streamId: event.streamId, globalSeq: event.globalSeq };
```

#### existingJoin
- 접근: ProjectionController에서 두 테이블 동시 SELECT + client-side merge.
- 제안 필드: -
- 트레이드오프: Performance penalty on large datasets, breaks Read Model abstraction, UI coupling to DB schema.
```typescript
const [gripRows, mediaRows] = await Promise.all([tx.select(readGripResult), tx.select(readMultimodal)]); return zip(gripRows, mediaRows).map(...);
```

### Decision Outcome
newReadModel

### Consequences
- (+) UI 단일 조회(SELECT * FROM read_grip_result_with_media WHERE scene_key = ? AND attempt_num = ?) 충족
- (+) App Layer decoupling
- (+) projection consistency 유지
- (−) Storage footprint 증가(~2x)
- (−) migration cost 발생
- (−) 기존 /grip-result, /multimodal endpoints 호환성 유지 필요

### Non-Goals
- URI null 매핑 보강(추후 lane)
- join performance 최적화(App Layer)
- read_grip_result, read_multimodal 테이블 삭제

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

- 대상: `read_grip_result_with_media` · 키: scene_key, attempt_num · 원천 이벤트: GripAttemptRecorded

```sql
CREATE TABLE read_grip_result_with_media (
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
# Table: read_grip_result_with_media
[
(scene_key:varchar, 장면 식별 키 (stream_id 제거 prefix), Primary Key),
(attempt_num:smallint, 동일 장면 내 파지 시도 번호, Primary Key),
(object_name:varchar, 파지 대상 객체명 (payload.objects[0].class_name)),
(grip_succeed:smallint, 파지 성공 여부 (0=실패, 1=성공)),
(gripper_type:varchar(16), 그리퍼 종류 (finger/suction)),
(occurred_at:timestamptz, 데이터 촬영 일자),
(grip_2d_pose:jsonb, 2D 파지점 좌포즈),
(grip_3d_pose:jsonb, 3D 파지점 좌포즈),
(robot_tf:jsonb, 로봇 변환행렬 (rotation/translation)),
(human_annotation_grasp:jsonb, 휴먼 어노테이션 파지 영역),
(image_2d_file_name:varchar, 원천 2D 이미지 파일명 (payload.2D_image_file_name)),
(video_file_name:varchar, 원천 비디오 파일명 (payload.video_file_name)),
(stream_id:varchar, ES 스트림 ID),
(global_seq:bigint, 투영 출처 이벤트 ES 전역 시퀀스)
]
```

### 투영 매핑 명세 (이벤트 → 컬럼)

> upsert 키: scene_key, attempt_num · 리플레이: projection_cursor 초기화 시 첫 이벤트 처리 기준. catch-up 재투영 시 upsert 전제(idempotent) 필수: 동일 scene_key+attempt_num 키는 기존 행 덮쓰기(overwrite) 또는 조건부 갱신, 중복 삽입 방지.

| 원천 이벤트 | payload 필드 | 컬럼 | 변환 |
| --- | --- | --- | --- |
| GripAttemptRecorded | objects[0].class_name | object_name | verbatim |
| GripAttemptRecorded | grip_succeed | grip_succeed | verbatim |
| GripAttemptRecorded | grip_data.grip_2d_pose | grip_2d_pose | verbatim |
| GripAttemptRecorded | grip_data.grip_3d_pose | grip_3d_pose | verbatim |
| GripAttemptRecorded | human_annotation_grasp[] | human_annotation_grasp | verbatim |
| GripAttemptRecorded | 2D_image_file_name | image_2d_file_name | verbatim |
| GripAttemptRecorded | video_file_name | video_file_name | verbatim |

파생 컬럼(이벤트 payload 아님):
- `scene_key` ← remove prefix 'grip-attempt:' from stream_id
- `attempt_num` ← extract 4th segment after splitting image_2d_file_name by '_'
- `occurred_at` ← parse 5th filename segment as date, format to ISO timestamp
- `gripper_type` ← constant 'finger' (current system default)
- `stream_id` ← event metadata stream_id
- `global_seq` ← event metadata global_seq

### Insight 카드 등록 (Insight Read DB 동기화)

> DDL 적용 시 아래 카드 등록도 함께 실행한다 — 다음 분석부터 신규 Read Model 이 LLM 컨텍스트에 노출된다.

```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_grip_result_with_media', 'read_model', '단일 화면 조회를 위한 파지 결과와 동시 발생한 미디어 경로 통합 뷰 Read Model. (scene_key, attempt_num) 단위 행으로 양측 정보를 동보 제공.', 'scene_key, attempt_num')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_grip_result_with_media', 'scene_key', 'varchar', '장면 식별 키 (stream_id 제거 prefix)', 1),
  ('read_grip_result_with_media', 'attempt_num', 'smallint', '동일 장면 내 파지 시도 번호', 2),
  ('read_grip_result_with_media', 'object_name', 'varchar', '파지 대상 객체명 (payload.objects[0].class_name)', 3),
  ('read_grip_result_with_media', 'grip_succeed', 'smallint', '파지 성공 여부 (0=실패, 1=성공)', 4),
  ('read_grip_result_with_media', 'gripper_type', 'varchar(16)', '그리퍼 종류 (finger/suction)', 5),
  ('read_grip_result_with_media', 'occurred_at', 'timestamptz', '데이터 촬영 일자', 6),
  ('read_grip_result_with_media', 'grip_2d_pose', 'jsonb', '2D 파지점 좌포즈', 7),
  ('read_grip_result_with_media', 'grip_3d_pose', 'jsonb', '3D 파지점 좌포즈', 8),
  ('read_grip_result_with_media', 'robot_tf', 'jsonb', '로봇 변환행렬 (rotation/translation)', 9),
  ('read_grip_result_with_media', 'human_annotation_grasp', 'jsonb', '휴먼 어노테이션 파지 영역', 10),
  ('read_grip_result_with_media', 'image_2d_file_name', 'varchar', '원천 2D 이미지 파일명 (payload.2D_image_file_name)', 11),
  ('read_grip_result_with_media', 'video_file_name', 'varchar', '원천 비디오 파일명 (payload.video_file_name)', 12),
  ('read_grip_result_with_media', 'stream_id', 'varchar', 'ES 스트림 ID', 13),
  ('read_grip_result_with_media', 'global_seq', 'bigint', '투영 출처 이벤트 ES 전역 시퀀스', 14)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased (v1 → v2)

#### Added
- 신규 Read Model 테이블 `read_grip_result_with_media` 및 Drizzle 스키마/프로젝터 `GripResultWithMediaProjector`
- 라우트 엔드포인트 `/grip-result-with-media`
#### Fixed
- Insight Card 레이어 결결한 통합 뷰(`read_grip_result_with_media`)로 동시 파지 결과+미디어 조회 지원

### 마이그레이션 절차

- 하위호환 변경: 신규 테이블 `read_grip_result_with_media` 은 기존 v1 테이블(`read_grip_result`, `read_multimodal`)과 무관한 추가이므로 하위 호환성 보장.; 기존 라우트(`/projection/grip-result`, `/projection/multimodal`) 및 서비스 메서드는 완전 보존.
- 파괴적 변경: 없음
- 컷오버 전 테스트: SELECT scene_key, attempt_num FROM read_grip_result WHERE grip_succeed = 1 AND stream_id LIKE 'grip-attempt:%' LIMIT 5; 확인 v1 조회 시 media 누락. 신규 라우트 `/projection/grip-result-with-media` 실행 후 response.image_2d_file_name 및 response.video_file_name 이 null 이 아님을 검증.
- 롤백 창/조건: 신규 테이블 `read_grip_result_with_media` drop(`DROP TABLE read_grip_result_with_media;`) 및 DI 제거(`GripResultWithMediaProjector` 주입 해제). 기존 v1 라우트/서비스 복원. 커서 재시작.
- Insight 카드 등록: §2의 카드 등록 SQL을 DDL과 함께 적용(카탈로그 동기화)

### 사유·호환성

- 사유: 기존 v1 Read Model 아키텍처는 파지 결과(`read_grip_result`)와 미디어 경로(`read_multimodal`)로 완전히 분리된 테이블과 독립 프로젝터(`GripResultProjector`, `MultiModalProjector`)를 운영한다. 사용자의 요청은 두 정보의 동시 조회(단일 화면 보고)이나, v1 구조로는 SQL JOIN 또는 애플리케이션 레벨 조인만 가능하며 Insight Card 레이어에서는 일관된 단일 Read Model 뷰가 결결한 상태[corr:628677b3-2b44-4797-a757-d2d6c89bb1b3]. 특히 `GripResultProjector.map`은 `payload.objects[0].class_name`만 추출하고 미디어 필드는 생략, `MultiModalProjector`는 별도 테이블로 매핑되므로 동시 제공이 불가능한 근본원인[corr:20896524-b5fa-4f6c-b34b-55718e7308be]. 신규 통합 테이블과 프로젝터 배선으로 단일 화면 조회를 지원하며 v1 기존 코드는 보존.
- 트리거 근거: | 00:13:45.842 | 30 | insight.card.request | 628677b3-2b44-4797-a757-d2d6c89bb1b3 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 00:13:45.844 | 40 | insight.card.miss | 628677b3-2b44-4797-a757-d2d6c89bb1b3 | - | - | - | insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. ← 트립 앵커 | - |
| 00:13:46.148 | 30 | insight.card.request | 20896524-b5fa-4f6c-b34b-55718e7308be | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 00:13:46.150 | 40 | insight.card.miss | 20896524-b5fa-4f6c-b34b-55718e7308be | - | - | - | insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. | - |
| 00:13:46.457 | 30 | insight.card.request | 5f099ca6-e987-4b72-97b6-ac792f0d48cd | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 00:13:46.460 | 40 | insight.card.miss | 5f099ca6-e987-4b72-97b6-ac792f0d48cd | - | - | - | insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. | - |
- v1 호환성: 기존 `read_grip_result` 및 `read_multimodal` 테이블, 라우트(`/projection/grip-result`, `/projection/multimodal`)는 완전 보존. 신규 `read_grip_result_with_media` 테이블과 `/grip-result-with-media` 엔드포인트는 추가만.

### 변경 파일

- `src/projection/projection.service.ts` (modifyFile) — 신규 프로젝터 DI 배선과 catchUpAll 결과 확장을. 기존 v1 로직은 보존.
- `src/projection/projection.controller.ts` (modifyFile) — 신규 v2 라우트 엔드포인트 배선. 기존 v1 라우트는 보존.
- `src/shared/database/schema/index.ts` (modifyFile) — 신규 테이블 스키마 export 확. 기존 v1 export는 보존.

## Optional — 부속 자료(컨텍스트 축소 시 생략 가능)

### 신규 Read Model — Drizzle 스키마

```ts
import { bigint, pgTable, primaryKey, smallint, timestamp, varchar, jsonb } from 'drizzle-orm/pg-core';

export const readGripResultWithMedia = pgTable(
  "read_grip_result_with_media",
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
import { readGripResultWithMedia } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

type ReadGripResultWithMediaInsert = InferInsertModel<typeof readGripResultWithMedia>;

@Injectable()
export class GripResultWithMediaProjector implements Projector<ReadGripResultWithMediaInsert> {
  readonly name: string = "grip-result-with-media-projector";

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(GripResultWithMediaProjector.name);
  }

  map(event: EventStoreEventRow): ReadGripResultWithMediaInsert {
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
        `grip-result-with-media map: empty objects in event ${event.eventId}`,
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

  async upsert(tx: DrizzleTx, row: ReadGripResultWithMediaInsert): Promise<void> {
    await tx
      .insert(readGripResultWithMedia)
      .values(row)
      .onConflictDoUpdate({
        target: [readGripResultWithMedia.sceneKey, readGripResultWithMedia.attemptNum],
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
// src/shared/database/schema/index.ts (추가)
export * from "./service/read-grip-result-with-media";

// src/projection/projection.service.ts (수정)
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { GripResultWithMediaProjector } from '@/projection/projector/grip-result-with-media.projector';
import { ProjectionResult } from '@/projection/projector/projector';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';
import { LogAction } from '@/shared/logger/logging-context';

export type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
  gripResultWithMedia: ProjectionResult;
};

@Injectable()
export class ProjectionService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly runner: CatchUpRunner,
    private readonly multimodal: MultiModalProjector,
    private readonly gripResult: GripResultProjector,
    private readonly gripResultWithMedia: GripResultWithMediaProjector,
    private readonly insertService: InsertService,
  ) {
    this.logger.setContext(ProjectionService.name);
  }

  catchUpGripResultWithMedia(): Promise<ProjectionResult> {
    return this.runner.run(this.gripResultWithMedia);
  }

  async catchUpAll(): Promise<CatchUpAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_START }, "전체 투영 시작");

    const multimodal: ProjectionResult = await this.catchUpMultimodal();
    const gripResult: ProjectionResult = await this.catchUpGripResult();
    const gripResultWithMedia: ProjectionResult = await this.catchUpGripResultWithMedia();

    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");

    return { multimodal, gripResult, gripResultWithMedia };
  }
}

// src/projection/projection.controller.ts (수정)
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

  @Post("/grip-result-with-media")
  gripResultWithMedia(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/grip-result-with-media",
      },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpGripResultWithMedia();
  }
}

// src/projection/projection.module.ts (providers 추가)
providers: [GripResultProjector, MultiModalProjector, GripResultWithMediaProjector]
```

### 버전 교체 코드 — `src/projection/projection.service.ts` (modifyFile)

```typescript
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { GripResultWithMediaProjector } from '@/projection/projector/grip-result-with-media.projector';
import { ProjectionResult } from '@/projection/projector/projector';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';
import { LogAction } from '@/shared/logger/logging-context';

export type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
  gripResultWithMedia: ProjectionResult;
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
    private readonly gripResultWithMedia: GripResultWithMediaProjector,
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

  catchUpGripResultWithMedia(): Promise<ProjectionResult> {
    return this.runner.run(this.gripResultWithMedia);
  }

  async catchUpAll(): Promise<CatchUpAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_START }, "전체 투영 시작");

    const multimodal: ProjectionResult = await this.catchUpMultimodal();
    const gripResult: ProjectionResult = await this.catchUpGripResult();
    const gripResultWithMedia: ProjectionResult = await this.catchUpGripResultWithMedia();

    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");

    return { multimodal, gripResult, gripResultWithMedia };
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

  @Post("/grip-result-with-media")
  gripResultWithMedia(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/grip-result-with-media",
      },
      "projection 요청 수신 (v2 unified)",
    );

    return this.projectionService.catchUpGripResultWithMedia();
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
export * from "./service/read-grip-result-with-media";
```

## Guardrails (constraints)

- v1 자산(테이블/엔드포인트/프로젝터 name) 무손상
- PK (scene_key, attempt_num) 유지
- TypeScript any 금지
- 식별자 전체 단어
- DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)
- Read Model 테이블명은 read_ 접두 스네이크 케이스
<<<Docs 끝>>>

[채점 루브릭] 각 항목 1~5 정수
- groundedness (근거 충실성): Docs 가 인용한 값·필드·장면 번호·로그가 [자료]에 실제로 있는가. 5=인용된 값·필드·장면이 모두 자료에 실재. 3=핵심 근거는 실재하나 일부 수치·부등호가 원문과 불일치. 1=근거 없는 주장이나 존재하지 않는 값의 인용이 결론을 좌우.
- diagnosisAccuracy (원인 진단 정확성): Docs 의 진단이 [정답 요지]와 일치하는가. 5=정답 원인과 유형·위치(필드, 장면, 처리 단계)까지 일치. 3=유형은 맞으나 위치나 메커니즘이 부정확. 1=오진이거나 원인을 특정하지 못함.
- actionability (실행 가능성): Docs 의 SQL 과 절차를 그대로 따르면 문제가 해결되는가. [자동 검증 결과]를 실측으로 반영하되, 실행이 되더라도 의도와 다른 일을 하는 SQL(조건이 한 건도 맞지 않는 삭제문, 요구한 컬럼이 없는 테이블 등)은 감점한다. 기존 v1 테이블(read_grip_result, read_multimodal, event_store)을 ALTER/DROP 하면 감점. 5=그대로 따르면 해결(실행 성공 + 요구 충족). 3=오탈자·순서 등 소폭 수정 후 해결. 1=따르면 실패하거나 기존 자산이 손상.
- completeness (완결성): 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소가 모두 유효하고 서로 일치하는가(머리말·SQL 의 테이블명·권고 대상·코드가 서로 같은 것을 가리키는가). 5=세 요소가 모두 유효하고 서로 일치. 3=세 요소가 있으나 서로 어긋나거나 항목이 비어 있음. 1=요소 누락 또는 근거 부족 표시.

다음 형식의 JSON 객체 하나만 출력하라:
{"groundedness": 1-5, "diagnosisAccuracy": 1-5, "actionability": 1-5, "completeness": 1-5, "unsupportedClaims": ["자료에 없는 주장 인용 (없으면 빈 배열)"], "rationale": "각 항목 점수 근거를 항목당 1~2문장으로"}
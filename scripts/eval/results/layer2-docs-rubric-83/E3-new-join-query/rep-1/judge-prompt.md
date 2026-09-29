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
| 01:48:36.099 | 30 | - | 77eb0b91-55f6-42a1-bfe0-deb6220beba6 | - | - | - | request completed | - |
| 01:48:36.099 | 30 | projection.batch | 77eb0b91-55f6-42a1-bfe0-deb6220beba6 | - | - | - | 배치 처리 | projector=grip-result-projector |
| 01:48:36.099 | 30 | projection.done | 77eb0b91-55f6-42a1-bfe0-deb6220beba6 | - | - | - | catch-up 완료 | projector=grip-result-projector |
| 01:48:36.099 | 20 | projection.cursor.advanced | 77eb0b91-55f6-42a1-bfe0-deb6220beba6 | - | - | - | 커서 이동 | projector=grip-result-projector |
| 01:48:36.102 | 30 | insight.card.request | ab9b5814-ed10-4646-8761-fd1845840652 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 01:48:36.103 | 40 | insight.card.miss | ab9b5814-ed10-4646-8761-fd1845840652 | - | - | - | insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. ← 트립 앵커 | - |
| 01:48:36.103 | 30 | - | ab9b5814-ed10-4646-8761-fd1845840652 | - | - | - | request completed | - |
| 01:48:36.407 | 30 | insight.card.request | a7d50586-7de6-48a3-ac05-bb03c035d47c | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 01:48:36.409 | 40 | insight.card.miss | a7d50586-7de6-48a3-ac05-bb03c035d47c | - | - | - | insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. | - |
| 01:48:36.410 | 30 | - | a7d50586-7de6-48a3-ac05-bb03c035d47c | - | - | - | request completed | - |
| 01:48:36.714 | 30 | insight.card.request | 6442782b-86e2-40e4-a60b-cc1bf9454994 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 01:48:36.717 | 40 | insight.card.miss | 6442782b-86e2-40e4-a60b-cc1bf9454994 | - | - | - | insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. | - |
| 01:48:36.717 | 30 | - | 6442782b-86e2-40e4-a60b-cc1bf9454994 | - | - | - | request completed | - |
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
docId: analysis-ab9b5814-ed10-4646-8761-fd1845840652
generatedAt: 2026-08-14T01:48:46.506Z
targetReadModel: read_grip_result
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: v1
  to: v2
  affectedEndpoints:
    - "POST /multimodal"
    - "POST /grip-result"
    - "POST /grip-result-v2"
    - "POST /insert-all"
evidenceSources:
  - { origin: developer-logging, anchorId: "ab9b5814-ed10-4646-8761-fd1845840652" }
  - { origin: developer-logging, anchorId: "a7d50586-7de6-48a3-ac05-bb03c035d47c" }
  - { origin: developer-logging, anchorId: "6442782b-86e2-40e4-a60b-cc1bf9454994" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_grip_result

> 결론(TL;DR): `read_grip_result`을(를) 재생성한다 — 사용자가 파지 결과(`read_grip_result`)와 이미지·영상 경로(`read_multimodal`)를 결합한 단일 조회 카드를 요청하나, 시스템에 존재하는 Insight Read DB 카탈로그에는 두 모델이 분리되어 있어 통합 뷰 카드 부재로 실패. (이상 유형: 카드 없는 Read Model 테이블 · 심각도: warning)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `projection.request`(level 30) 2회, `projection.batch`(level 30) 2회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `projection.event.mapped`(level 20) 60회, `-`(level 30) 5회, `projection.start`(level 30) 2회, `-`(level 20) 6회, `insert.request`(level 30) 1회, `insight.card.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insight.card.miss`(level 40) 1회, `insert.file.ok`(level 20) 60회, `projection.done`(level 30) 2회, `projection.cursor.advanced`(level 20) 2회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01:48:36.099 | 30 | - | 77eb0b91-55f6-42a1-bfe0-deb6220beba6 | - | - | - | request completed | - |
| 01:48:36.099 | 30 | projection.batch | 77eb0b91-55f6-42a1-bfe0-deb6220beba6 | - | - | - | 배치 처리 | projector=grip-result-projector |
| 01:48:36.099 | 30 | projection.done | 77eb0b91-55f6-42a1-bfe0-deb6220beba6 | - | - | - | catch-up 완료 | projector=grip-result-projector |
| 01:48:36.099 | 20 | projection.cursor.advanced | 77eb0b91-55f6-42a1-bfe0-deb6220beba6 | - | - | - | 커서 이동 | projector=grip-result-projector |
| 01:48:36.102 | 30 | insight.card.request | ab9b5814-ed10-4646-8761-fd1845840652 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 01:48:36.103 | 40 | insight.card.miss | ab9b5814-ed10-4646-8761-fd1845840652 | - | - | - | insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. ← 트립 앵커 | - |
| 01:48:36.103 | 30 | - | ab9b5814-ed10-4646-8761-fd1845840652 | - | - | - | request completed | - |
| 01:48:36.407 | 30 | insight.card.request | a7d50586-7de6-48a3-ac05-bb03c035d47c | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 01:48:36.409 | 40 | insight.card.miss | a7d50586-7de6-48a3-ac05-bb03c035d47c | - | - | - | insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. | - |
| 01:48:36.410 | 30 | - | a7d50586-7de6-48a3-ac05-bb03c035d47c | - | - | - | request completed | - |
| 01:48:36.714 | 30 | insight.card.request | 6442782b-86e2-40e4-a60b-cc1bf9454994 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 01:48:36.717 | 40 | insight.card.miss | 6442782b-86e2-40e4-a60b-cc1bf9454994 | - | - | - | insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. | - |
| 01:48:36.717 | 30 | - | 6442782b-86e2-40e4-a60b-cc1bf9454994 | - | - | - | request completed | - |

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
- (level 30, `insight.card.request`) insight 카드 단건 조회 요청 수신 → 기존 Read Model(read_grip_result, read_multimodal)의 분리 구조로는 단일 Insight 카드 조인/통합 뷰 부재. [corr:ab9b5814-ed10-4646-8761-fd1845840652]
- (level 40, `insight.card.miss`) insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. → 기존 Read Model(read_grip_result, read_multimodal)의 분리 구조로는 단일 Insight 카드 조인/통합 뷰 부재. [corr:ab9b5814-ed10-4646-8761-fd1845840652]
- (level 30, `insight.card.request`) insight 카드 단건 조회 요청 수신 → 기존 Read Model(read_grip_result, read_multimodal)의 분리 구조로는 단일 Insight 카드 조인/통합 뷰 부재. [corr:a7d50586-7de6-48a3-ac05-bb03c035d47c]
- (level 40, `insight.card.miss`) insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. → 기존 Read Model(read_grip_result, read_multimodal)의 분리 구조로는 단일 Insight 카드 조인/통합 뷰 부재. [corr:a7d50586-7de6-48a3-ac05-bb03c035d47c]
- (level 30, `insight.card.request`) insight 카드 단건 조회 요청 수신 → 기존 Read Model(read_grip_result, read_multimodal)의 분리 구조로는 단일 Insight 카드 조인/통합 뷰 부재. [corr:6442782b-86e2-40e4-a60b-cc1bf9454994]
- (level 40, `insight.card.miss`) insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. → 기존 Read Model(read_grip_result, read_multimodal)의 분리 구조로는 단일 Insight 카드 조인/통합 뷰 부재. [corr:6442782b-86e2-40e4-a60b-cc1bf9454994]
- 두 Read Model 테이블이 물리적 조인(join) 부재로, 단일 조회 카드 요청 시 insight.card.miss 발생 [corr:ab9b5814-ed10-4646-8761-fd1845840652] [corr:a7d50586-7de6-48a3-ac05-bb03c035d47c] [corr:6442782b-86e2-40e4-a60b-cc1bf9454994].
- read_multimodal.image_2d_uri 및 video_uri 컬럼은 현재 MultiModalProjector.map()에서 null 고정 할당, 실제 URI 매핑 로직 부재.
- 기존 구현(src/projection/projector/grip-result.projector.ts, multimodal.projector.ts)은 각각 독립 map()/upsert() 실행, 통합 뷰 생성 수동 조인 SQL 또는 신규 테이블 투영이 필요.

### Decision Drivers
- 근원원인(조인 부재) 해결
- 기존 Read Model 호환성 유지
- 무해화 원칙(거절·격리 유지 + 원천 데이터 수정 요청) 준수
- 투영 처리량 병화 가능

### Considered Options
#### 신규 분리 (newReadModel)
- 접근: src/shared/database/schema/service/read-grip-result-v2.ts Drizzle 스키마 추가, GripResultV2Projector 구현, ProjectionService 연동.
- 제안 필드: scene_key, attempt_num, object_name, grip_succeed, gripper_type, occurred_at, image_2d_file_name, video_file_name, stream_id, global_seq
- 트레이드오프: 투영 비용 증가(1->2 테이블), but 단일 카드 조회 충족, 무해화 원칙 준수.
```typescript
return { sceneKey: event.streamId.replace(/^grip-attempt:/, ""), attemptNum: event.attemptNum, objectName: payload.objects[0].class_name, gripSucceed: payload.grip_succeed, gripperType: "finger", occurredAt: event.occurredAt, image2dFileName: payload["2D_image_file_name"], videoFileName: payload.video_file_name, streamId: event.streamId, globalSeq: event.globalSeq };
```

#### 기존 Read Model 확장 (read_grip_result)
- 접근: GripResultProjector.map() 확장으로 image_2d_file_name/video_file_name 필드 추가, Drizzle 스키마 열 추가, upsert 연동.
- 제안 필드: image_2d_file_name, video_file_name
- 트레이드오프: 기존 테이블 schema 변경, 중복 데이터 저장, but DB 존재 검증, 조인 부재 근본 해결.
```typescript
await tx.insert(readGripResult).values({ ...row, image2dFileName: payload["2D_image_file_name"], videoFileName: payload.video_file_name });
```

#### 버전 교체 (versionSwitch)
- 접근: ProjectionController 새 엔드포인트 /projection/grip-result-v2 추가, catchUpGripResultV2() 호출.
- 제안 필드: -
- 트레이드오프: 클라이언트 호환성 관리 필요, but 기존 Read Model 무변.
```typescript
@Post("/grip-result-v2") gripResultV2(): Promise<ProjectionResult> { return this.projectionService.catchUpGripResultV2(); }
```

### Decision Outcome
기존 Read Model 확장 (read_grip_result)

### Consequences
- (+) 단일 Insight 카드 조회 충족
- (+) DB 테이블 존재 검증으로 containmentSql 실패 방지
- (+) URI 매핑 로직 확장 용이
- (−) 기존 schema 변경(호환성 관리 필요)
- (−) 중dup 데이터 저장 공간 증가
- (−) 기타 클라이언트 의존성 재검인 작업

### Non-Goals
- read_multimodal 테이블 삭제
- URI 매핑 로직 구현(추후 위임)
- zod 기본값 치환

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

- 대상: `read_grip_result_v2` · 키: (scene_key, attempt_num) · 원천 이벤트: GripAttemptRecorded

```sql
CREATE TABLE read_grip_result_v2 (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  object_name varchar,
  grip_succeed smallint,
  gripper_type varchar(16),
  occurred_at timestamptz,
  image_2d_file_name varchar,
  video_file_name varchar,
  stream_id varchar,
  global_seq bigint,
  PRIMARY KEY (scene_key, attempt_num)
);
```

### 필드

```mschema
# Table: read_grip_result_v2
[
(scene_key:varchar, 장면 식별 키 (stream_id에서 'grip-attempt:' 제거), Primary Key),
(attempt_num:smallint, 동일 장면 내 파지 시도 번호, Primary Key),
(object_name:varchar, 파지 대상 객체명 (payload.objects[0].class_name)),
(grip_succeed:smallint, 파지 성공 여부 (0=실패, 1=성공)),
(gripper_type:varchar(16), 그리퍼 종류 (finger/suction)),
(occurred_at:timestamptz, 데이터 촬영 일자),
(image_2d_file_name:varchar, 원천 2D 이미지 파일명 (payload.2D_image_file_name)),
(video_file_name:varchar, 원천 비디오 파일명 (payload.video_file_name)),
(stream_id:varchar, ES 스트림 ID — 추적 키),
(global_seq:bigint, 투영 출처 이벤트의 ES 전역 시퀀스 — 추적 키)
]
```

### 투영 매핑 명세 (이벤트 → 컬럼)

> upsert 키: scene_key,attempt_num · 리플레이: projection_cursor 초기화 시 0 또는 마지막 committed seq 설정. 전체 재투영(catch-up) 시 upsert 전제 조건으로 멱덴성(idempotent) 적용해야 하며, scene_key/attempt_num 키 충돌 시 최신 global_seq 기준 overwrite.

| 원천 이벤트 | payload 필드 | 컬럼 | 변환 |
| --- | --- | --- | --- |
| GripAttemptRecorded | objects[].class_name | object_name | verbatim |
| GripAttemptRecorded | grip_succeed | grip_succeed | number → smallint 캐스팅 |
| GripAttemptRecorded | 2D_image_file_name | image_2d_file_name | verbatim |
| GripAttemptRecorded | video_file_name | video_file_name | verbatim |

파생 컬럼(이벤트 payload 아님):
- `scene_key` ← stream_id에서 prefix 'grip-attempt:' 제거
- `attempt_num` ← 2D_image_file_name 내 underscore-separated 시도 번호 추출 (예: _01_)
- `gripper_type` ← 상수 'finger' (현재 시스템 고정값)
- `occurred_at` ← 2D_image_file_name 내 날짜 부분(YYYYMMDD) 추출 및 ISO timestamptz 포맷 변환
- `stream_id` ← 이벤트 envelope stream_id 직접 참조
- `global_seq` ← 이벤트 envelope global_seq 직접 참조

### Insight 카드 등록 (Insight Read DB 동기화)

> DDL 적용 시 아래 카드 등록도 함께 실행한다 — 다음 분석부터 신규 Read Model 이 LLM 컨텍스트에 노출된다.

```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_grip_result_v2', 'read_model', 'Insight Card 조회를 위한 파지 결과와 해당 시도의 미디어(2D 이미지, 비디오) 경로를 통합된 단일 행 모델로 제공.', '(scene_key, attempt_num)')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_grip_result_v2', 'scene_key', 'varchar', '장면 식별 키 (stream_id에서 ''grip-attempt:'' 제거)', 1),
  ('read_grip_result_v2', 'attempt_num', 'smallint', '동일 장면 내 파지 시도 번호', 2),
  ('read_grip_result_v2', 'object_name', 'varchar', '파지 대상 객체명 (payload.objects[0].class_name)', 3),
  ('read_grip_result_v2', 'grip_succeed', 'smallint', '파지 성공 여부 (0=실패, 1=성공)', 4),
  ('read_grip_result_v2', 'gripper_type', 'varchar(16)', '그리퍼 종류 (finger/suction)', 5),
  ('read_grip_result_v2', 'occurred_at', 'timestamptz', '데이터 촬영 일자', 6),
  ('read_grip_result_v2', 'image_2d_file_name', 'varchar', '원천 2D 이미지 파일명 (payload.2D_image_file_name)', 7),
  ('read_grip_result_v2', 'video_file_name', 'varchar', '원천 비디오 파일명 (payload.video_file_name)', 8),
  ('read_grip_result_v2', 'stream_id', 'varchar', 'ES 스트림 ID — 추적 키', 9),
  ('read_grip_result_v2', 'global_seq', 'bigint', '투영 출처 이벤트의 ES 전역 시퀀스 — 추적 키', 10)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased (v1 → v2)

#### Added
- 신규 Read Model 테이블 read_grip_result_v2 (scene_key, attempt_num key) 매핑 파지 결과+이미지/비디오 경로 동시.
- GripResultV2Projector 구현 및 CatchUpRunner 배선.
#### Changed
- ProjectionService.catchUpAllResult 타입 확장, ProjectionController /grip-result-v2 라우트 추가.
#### Fixed
- insight.card.miss(레벨 40) 재발 발생 해결: 단일 카드 뷰 부재 원천 제거.

### 마이그레이션 절차

- 하위호환 변경: 기존 v1 테이블·프로젝터·라우트(/grip-result, /multimodal) 완전 보존.; 신규 /grip-result-v2 라우트는 추가만, 기존 클라이언트 호출 경로 무영장.
- 파괴적 변경: 없음
- 컷오버 전 테스트: 1. `catchUpGripResultV2` 실행 시 read_grip_result_v2 테이블 row count == event stream count 검증.
2. 각 row.image_2d_file_name/video_file_name 매칭 payload 검증.
3. 기존 /grip-result 라우트 응답 unchanged assertion.
- 롤백 창/조건: 1. `DROP TABLE read_grip_result_v2;`
2. GripResultV2Projector DI 제거, catchUpGripResultV2 메서드 삭제.
3. /grip-result-v2 라우트 삭제.
- Insight 카드 등록: §2의 카드 등록 SQL을 DDL과 함께 적용(카탈로그 동기화)

### 사유·호환성

- 사유: 기존 GripResultProjector의 map 메서드는 payload.objects[0].class_name만 추출하고 image/video 경로 배제, read_multimodal 테이블 별도 적재로 단일 카드 뷰 부재 [corr:ab9b5814-ed10-4646-8761-fd1845840652] [corr:a7d50586-7de6-48a3-ac05-bb03c035d47c] [corr:6442782b-86e2-40e4-a60b-cc1bf9454994]. 신규 v2 테이블·프로젝터 추가하여 파지 결과와 멀티모달 경로 동시 매핑, 기존 v1 완전 보존.
- 트리거 근거: | time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01:48:36.102 | 30 | insight.card.request | ab9b5814-ed10-4646-8761-fd1845840652 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 01:48:36.103 | 40 | insight.card.miss | ab9b5814-ed10-4646-8761-fd1845840652 | - | - | - | insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. ← 트립 앵커 | - |
| 01:48:36.407 | 30 | insight.card.request | a7d50586-7de6-48a3-ac05-bb03c035d47c | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 01:48:36.409 | 40 | insight.card.miss | a7d50586-7de6-48a3-ac05-bb03c035d47c | - | - | - | insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. | - |
| 01:48:36.714 | 30 | insight.card.request | 6442782b-86e2-40e4-a60b-cc1bf9454994 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 01:48:36.717 | 40 | insight.card.miss | 6442782b-86e2-40e4-a60b-cc1bf9454994 | - | - | - | insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. | - |
- v1 호환성: 기존 v1 테이블·엔드포인트·프로젝터 클래스/name 완전 무손상. 신규 v2는 추가만, 기존 DI/라우트 라우트는 append-only.

### 변경 파일

- `src/projection/projection.service.ts` (modifyFile) — DI 배선 신규 v2 프로젝터, catchUpAllResult 타입 확장, catchUpGripResultV2 메서드 추가.
- `src/projection/projection.controller.ts` (modifyFile) — 신규 /grip-result-v2 라우트 배선.
- `src/shared/database/schema/index.ts` (modifyFile) — 신규 v2 테이블 export 배선.

## Optional — 부속 자료(컨텍스트 축소 시 생략 가능)

### 신규 Read Model — Drizzle 스키마

```ts
import { bigint, index, pgTable, primaryKey, smallint, timestamp, varchar } from 'drizzle-orm/pg-core';

export const readGripResultV2 = pgTable(
  "read_grip_result_v2",
  {
    sceneKey: varchar("scene_key").notNull(),
    attemptNum: smallint("attempt_num").notNull(),

    objectName: varchar("object_name").notNull(),
    gripSucceed: smallint("grip_succeed").notNull(),
    gripperType: varchar("gripper_type", { length: 16 }).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),

    image2dFileName: varchar("image_2d_file_name"),
    videoFileName: varchar("video_file_name"),

    streamId: varchar("stream_id").notNull(),
    globalSeq: bigint("global_seq", { mode: "number" }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.sceneKey, t.attemptNum] }),
    index("idx_grip_result_v2_object").on(t.objectName),
    index("idx_grip_result_v2_succeed").on(t.gripSucceed),
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
import { readGripResultV2 } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

type ReadGripResultV2Insert = InferInsertModel<typeof readGripResultV2>;

@Injectable()
export class GripResultV2Projector implements Projector<ReadGripResultV2Insert> {
  readonly name: string = "grip-result-v2-projector";

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(GripResultV2Projector.name);
  }

  map(event: EventStoreEventRow): ReadGripResultV2Insert {
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
        `grip-result-v2 map: empty objects in event ${event.eventId}`,
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
      image2dFileName: payload["2D_image_file_name"],
      videoFileName: payload.video_file_name,
      streamId: event.streamId,
      globalSeq: event.globalSeq,
    };
  }

  async upsert(tx: DrizzleTx, row: ReadGripResultV2Insert): Promise<void> {
    await tx
      .insert(readGripResultV2)
      .values(row)
      .onConflictDoUpdate({
        target: [readGripResultV2.sceneKey, readGripResultV2.attemptNum],
        set: {
          objectName: row.objectName,
          gripSucceed: row.gripSucceed,
          gripperType: row.gripperType,
          occurredAt: row.occurredAt,
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
export * from "./insight/insight-entity";
export * from "./insight/insight-field";
export * from "./log/log-cursor";
export * from "./log/log-event";
export * from "./service/event";
export * from "./service/projection-cursor";
export * from "./service/read-grip-result";
export * from "./service/read-multimodal";
export * from "./service/read-grip-result-v2"; // 신규

// src/projection/projector/grip-result-v2.projector.ts (신규 파일)
import { Injectable } from '@nestjs/common';
import { type InferInsertModel } from 'drizzle-orm';
import { PinoLogger } from 'nestjs-pino';
import { type ToyDataDto, toyDataSchema } from '@/insert/dto/toy-data.dto';
import type { Projector } from '@/projection/projector/projector';
import type { EventStoreEventRow } from '@/projection/repository/event-store-reader.repository';
import { DrizzleTx } from '@/shared/database/drizzle.provider';
import { readGripResultV2 } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

type ReadGripResultV2Insert = InferInsertModel<typeof readGripResultV2>;

@Injectable()
export class GripResultV2Projector implements Projector<ReadGripResultV2Insert> {
  readonly name: string = "grip-result-v2-projector";

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(GripResultV2Projector.name);
  }

  map(event: EventStoreEventRow): ReadGripResultV2Insert {
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
        `grip-result-v2 map: empty objects in event ${event.eventId}`,
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
      image2dFileName: payload["2D_image_file_name"],
      videoFileName: payload.video_file_name,
      streamId: event.streamId,
      globalSeq: event.globalSeq,
    };
  }

  async upsert(tx: DrizzleTx, row: ReadGripResultV2Insert): Promise<void> {
    await tx
      .insert(readGripResultV2)
      .values(row)
      .onConflictDoUpdate({
        target: [readGripResultV2.sceneKey, readGripResultV2.attemptNum],
        set: {
          objectName: row.objectName,
          gripSucceed: row.gripSucceed,
          gripperType: row.gripperType,
          occurredAt: row.occurredAt,
          image2dFileName: row.image2dFileName,
          videoFileName: row.videoFileName,
          streamId: row.streamId,
          globalSeq: row.globalSeq,
        },
      });
  }
}

// src/projection/projection.service.ts (수정)
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { GripResultV2Projector } from '@/projection/projector/grip-result-v2.projector'; // 신규
import { ProjectionResult } from '@/projection/projector/projector';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';
import { LogAction } from '@/shared/logger/logging-context';

export type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
  gripResultV2: ProjectionResult; // 신규
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
    private readonly gripResultV2: GripResultV2Projector, // 신규
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

  catchUpGripResultV2(): Promise<ProjectionResult> { // 신규
    return this.runner.run(this.gripResultV2);
  }

  async catchUpAll(): Promise<CatchUpAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_START }, "전체 투영 시작");

    const multimodal: ProjectionResult = await this.catchUpMultimodal();
    const gripResult: ProjectionResult = await this.catchUpGripResult();
    const gripResultV2: ProjectionResult = await this.catchUpGripResultV2(); // 신규

    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");

    return { multimodal, gripResult, gripResultV2 };
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

  @Post("/grip-result-v2") // 신규 라우트
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

  @Post("/insert-all")
  insertAll(): Promise<InsertAndProjectionAllResult> {
    this.logger.info(
      { action: LogAction.PROJECTION_REQUEST },
      "projection 요청 수신",
    );

    return this.projectionService.insertAllAndProjectAll();
  }
}

// src/projection/projection.module.ts (providers 등록)
@Module({
  providers: [
    ProjectionService,
    CatchUpRunner,
    GripResultProjector,
    MultiModalProjector,
    GripResultV2Projector, // 신규
    InsertService,
  ],
})
export class ProjectionModule {}
```

### 버전 교체 코드 — `src/projection/projection.service.ts` (modifyFile)

```typescript
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { ProjectionResult } from '@/projection/projector/projector';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';
import { GripResultV2Projector } from '@/projection/projector/grip-result-v2.projector';
import { LogAction } from '@/shared/logger/logging-context';

export type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
  gripResultV2: ProjectionResult;
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
    private readonly gripResultV2: GripResultV2Projector,
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

  catchUpGripResultV2(): Promise<ProjectionResult> {
    return this.runner.run(this.gripResultV2);
  }

  async catchUpAll(): Promise<CatchUpAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_START }, "전체 투영 시작");

    const multimodal: ProjectionResult = await this.catchUpMultimodal();
    const gripResult: ProjectionResult = await this.catchUpGripResult();
    const gripResultV2: ProjectionResult = await this.catchUpGripResultV2();

    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");

    return { multimodal, gripResult, gripResultV2 };
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

  @Post("/grip-result-v2")
  gripResultV2(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/grip-result-v2",
      },
      "projection v2 요청 수신",
    );

    return this.projectionService.catchUpGripResultV2();
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
export * from "./service/read-grip-result-v2";
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
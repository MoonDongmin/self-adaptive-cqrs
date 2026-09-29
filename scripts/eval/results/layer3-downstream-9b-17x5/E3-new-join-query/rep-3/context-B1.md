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
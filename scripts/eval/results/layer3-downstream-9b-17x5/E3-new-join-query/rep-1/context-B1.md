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
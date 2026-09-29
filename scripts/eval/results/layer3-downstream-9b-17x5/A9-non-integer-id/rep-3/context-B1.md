<logging_context>
## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `insert.request`(level 30) 1회, `insert.file.failed`(level 40) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 50회, `-`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 02:37:16.934 | 30 | insert.request | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | - | - | - | Insert Event Store 요청 수신 | - |
| 02:37:16.934 | 30 | insert.batch.start | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | - | - | - | Toy-Data 적재 시작 | - |
| 02:37:16.939 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00258 | 2 | 1 | 이벤트 append | - |
| 02:37:16.939 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00258 | 2 | 1 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00258_02_20230923.json |
| 02:37:16.940 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00262 | 2 | 2 | 이벤트 append | - |
| 02:37:16.940 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00262 | 2 | 2 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00262_02_20230923.json |
| 02:37:16.941 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00262 | 3 | 3 | 이벤트 append | - |
| 02:37:16.941 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00262 | 3 | 3 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00262_03_20230923.json |
| 02:37:16.942 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00263 | 2 | 4 | 이벤트 append | - |
| 02:37:16.942 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00263 | 2 | 4 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00263_02_20230923.json |
| 02:37:16.943 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00267 | 1 | 5 | 이벤트 append | - |
| 02:37:16.943 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00267 | 1 | 5 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00267_01_20230923.json |
| 02:37:16.944 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00275 | 1 | 7 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00275_01_20230923.json |
| 02:37:16.944 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00269 | 2 | 6 | 이벤트 append | - |
| 02:37:16.944 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00269 | 2 | 6 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00269_02_20230923.json |
| 02:37:16.944 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00275 | 1 | 7 | 이벤트 append | - |
| 02:37:16.945 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00275 | 3 | 8 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00275_03_20230923.json |
| 02:37:16.945 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00275 | 3 | 8 | 이벤트 append | - |
| 02:37:16.946 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00278 | 3 | 9 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00278_03_20230923.json |
| 02:37:16.946 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00278 | 3 | 9 | 이벤트 append | - |
| 02:37:16.947 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00280 | 1 | 10 | 이벤트 append | - |
| 02:37:16.947 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00280 | 1 | 10 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00280_01_20230923.json |
| 02:37:16.948 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00281 | 1 | 11 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00281_01_20230923.json |
| 02:37:16.948 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00281 | 1 | 11 | 이벤트 append | - |
| 02:37:16.949 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00286 | 3 | 12 | 이벤트 append | - |
| 02:37:16.949 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00286 | 3 | 12 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00286_03_20230923.json |
| 02:37:16.950 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00287 | 3 | 13 | 이벤트 append | - |
| 02:37:16.950 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00287 | 3 | 13 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00287_03_20230923.json |
| 02:37:16.950 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00291 | 3 | 14 | 이벤트 append | - |
| 02:37:16.950 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00291 | 3 | 14 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00291_03_20230923.json |
| 02:37:16.951 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00295 | 1 | 15 | 이벤트 append | - |
| 02:37:16.951 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00295 | 1 | 15 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00295_01_20230923.json |
| 02:37:16.952 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00297 | 3 | 16 | 이벤트 append | - |
| 02:37:16.952 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00297 | 3 | 16 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00297_03_20230923.json |
| 02:37:16.953 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00302 | 2 | 18 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00302_02_20230923.json |
| 02:37:16.953 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00301 | 3 | 17 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00301_03_20230923.json |
| 02:37:16.953 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00302 | 2 | 18 | 이벤트 append | - |
| 02:37:16.953 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00301 | 3 | 17 | 이벤트 append | - |
| 02:37:16.954 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00304 | 2 | 19 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00304_02_20230923.json |
| 02:37:16.954 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00304 | 2 | 19 | 이벤트 append | - |
| 02:37:16.955 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00304 | 3 | 20 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00304_03_20230923.json |
| 02:37:16.955 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00304 | 3 | 20 | 이벤트 append | - |
| 02:37:16.956 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00308 | 1 | 21 | 이벤트 append | - |
| 02:37:16.956 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00308 | 1 | 21 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00308_01_20230923.json |
| 02:37:16.957 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00317 | 2 | 22 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00317_02_20230923.json |
| 02:37:16.957 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00317 | 2 | 22 | 이벤트 append | - |
| 02:37:16.958 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00320 | 1 | 23 | 이벤트 append | - |
| 02:37:16.958 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00320 | 1 | 23 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00320_01_20230923.json |
| 02:37:16.959 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00327 | 3 | 25 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00327_03_20230923.json |
| 02:37:16.959 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00323 | 1 | 24 | 이벤트 append | - |
| 02:37:16.959 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00323 | 1 | 24 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00323_01_20230923.json |
| 02:37:16.959 | 20 | insert.file.ok | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00327 | 3 | 25 | 이벤트 append | - |
| 02:37:16.960 | 40 | insert.file.failed | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | - | - | - | toy-data 파일 적재 실패 ← 트립 앵커 | reason=[   {     "expected": "int",     "format": "safeint",     "code": "invalid_type",     "path": [       "objects",       0,       "id"     ],     "message": "Invalid input: expected int, received number"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02022_01_20230923.json |
| 02:37:16.961 | 40 | insert.file.failed | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | - | - | - | toy-data 파일 적재 실패 | reason=[   {     "expected": "int",     "format": "safeint",     "code": "invalid_type",     "path": [       "human_annotation_grasp",       0,       "num_keypoints"     ],     "message": "Invalid input: expected int, received number"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02023_01_20230923.json |
| 02:37:16.961 | 30 | - | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | - | - | - | request completed | - |
| 02:37:16.961 | 30 | insert.batch.done | aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e | - | - | - | toy-data 적재 완료 | - |
| 02:37:16.964 | 30 | projection.request | 2ff759e4-d475-46d8-986b-14e67206ecd5 | - | - | - | projection 요청 수신 | - |
| 02:37:16.966 | 20 | - | 2ff759e4-d475-46d8-986b-14e67206ecd5 | - | - | - | 커서 조회 | projector=multimodal-projector |
| 02:37:16.966 | 30 | projection.start | 2ff759e4-d475-46d8-986b-14e67206ecd5 | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 02:37:16.967 | 20 | - | 2ff759e4-d475-46d8-986b-14e67206ecd5 | - | - | - | 이벤트 조회 | - |
| 02:37:16.968 | 20 | projection.event.mapped | 2ff759e4-d475-46d8-986b-14e67206ecd5 | - | 2 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 02:37:16.969 | 20 | projection.event.mapped | 2ff759e4-d475-46d8-986b-14e67206ecd5 | - | 2 | 2 | 이벤트 매핑 | projector=multimodal-projector |
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
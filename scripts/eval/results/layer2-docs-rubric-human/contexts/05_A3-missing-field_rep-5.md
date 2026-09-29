<logging_context>
## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `insert.request`(level 30) 1회, `insert.file.failed`(level 40) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 50회, `-`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 04:10:55.864 | 30 | insert.request | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | - | - | - | Insert Event Store 요청 수신 | - |
| 04:10:55.864 | 30 | insert.batch.start | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | - | - | - | Toy-Data 적재 시작 | - |
| 04:10:55.870 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00120 | 2 | 1 | 이벤트 append | - |
| 04:10:55.870 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00120 | 2 | 1 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00120_02_20230923.json |
| 04:10:55.871 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00121 | 2 | 2 | 이벤트 append | - |
| 04:10:55.871 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00121 | 2 | 2 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00121_02_20230923.json |
| 04:10:55.872 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 1 | 3 | 이벤트 append | - |
| 04:10:55.872 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 1 | 3 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00133_01_20230923.json |
| 04:10:55.873 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 2 | 4 | 이벤트 append | - |
| 04:10:55.873 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00133 | 2 | 4 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00133_02_20230923.json |
| 04:10:55.874 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00134 | 1 | 5 | 이벤트 append | - |
| 04:10:55.874 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00134 | 1 | 5 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00134_01_20230923.json |
| 04:10:55.875 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00134 | 2 | 6 | 이벤트 append | - |
| 04:10:55.875 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00134 | 2 | 6 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00134_02_20230923.json |
| 04:10:55.876 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00135 | 2 | 7 | 이벤트 append | - |
| 04:10:55.876 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00135 | 2 | 7 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00135_02_20230923.json |
| 04:10:55.877 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00154 | 1 | 9 | 이벤트 append | - |
| 04:10:55.877 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00147 | 1 | 8 | 이벤트 append | - |
| 04:10:55.877 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00147 | 1 | 8 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00147_01_20230923.json |
| 04:10:55.877 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00154 | 1 | 9 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00154_01_20230923.json |
| 04:10:55.878 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00155 | 2 | 10 | 이벤트 append | - |
| 04:10:55.878 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00155 | 2 | 10 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00155_02_20230923.json |
| 04:10:55.879 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00157 | 1 | 11 | 이벤트 append | - |
| 04:10:55.879 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00157 | 1 | 11 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00157_01_20230923.json |
| 04:10:55.880 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00163 | 3 | 13 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00163_03_20230923.json |
| 04:10:55.880 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00163 | 2 | 12 | 이벤트 append | - |
| 04:10:55.880 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00163 | 2 | 12 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00163_02_20230923.json |
| 04:10:55.880 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00163 | 3 | 13 | 이벤트 append | - |
| 04:10:55.881 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00167 | 3 | 14 | 이벤트 append | - |
| 04:10:55.881 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00167 | 3 | 14 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00167_03_20230923.json |
| 04:10:55.882 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00168 | 3 | 15 | 이벤트 append | - |
| 04:10:55.882 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00168 | 3 | 15 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00168_03_20230923.json |
| 04:10:55.883 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00169 | 2 | 16 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00169_02_20230923.json |
| 04:10:55.883 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00169 | 2 | 16 | 이벤트 append | - |
| 04:10:55.884 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00189 | 3 | 18 | 이벤트 append | - |
| 04:10:55.884 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00188 | 2 | 17 | 이벤트 append | - |
| 04:10:55.884 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00188 | 2 | 17 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00188_02_20230923.json |
| 04:10:55.884 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00189 | 3 | 18 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00189_03_20230923.json |
| 04:10:55.885 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00190 | 1 | 19 | 이벤트 append | - |
| 04:10:55.885 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00190 | 1 | 19 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00190_01_20230923.json |
| 04:10:55.886 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00190 | 3 | 20 | 이벤트 append | - |
| 04:10:55.886 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00190 | 3 | 20 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00190_03_20230923.json |
| 04:10:55.887 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00197 | 3 | 22 | 이벤트 append | - |
| 04:10:55.887 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00192 | 1 | 21 | 이벤트 append | - |
| 04:10:55.887 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00192 | 1 | 21 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00192_01_20230923.json |
| 04:10:55.887 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00197 | 3 | 22 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00197_03_20230923.json |
| 04:10:55.888 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00204 | 1 | 23 | 이벤트 append | - |
| 04:10:55.888 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00204 | 1 | 23 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00204_01_20230923.json |
| 04:10:55.889 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00206 | 1 | 24 | 이벤트 append | - |
| 04:10:55.889 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00206 | 1 | 24 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00206_01_20230923.json |
| 04:10:55.890 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00206 | 2 | 25 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00206_02_20230923.json |
| 04:10:55.890 | 20 | insert.file.ok | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00206 | 2 | 25 | 이벤트 append | - |
| 04:10:55.890 | 40 | insert.file.failed | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | - | - | - | toy-data 파일 적재 실패 ← 트립 앵커 | reason=[   {     "expected": "object",     "code": "invalid_type",     "path": [       "grip_data"     ],     "message": "Invalid input: expected object, received undefined"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02004_01_20230923.json |
| 04:10:55.891 | 30 | insert.batch.done | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | - | - | - | toy-data 적재 완료 | - |
| 04:10:55.891 | 40 | insert.file.failed | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | - | - | - | toy-data 파일 적재 실패 | reason=[   {     "expected": "object",     "code": "invalid_type",     "path": [       "robot_tf"     ],     "message": "Invalid input: expected object, received undefined"   } ] · file=반려동물용품_CR01_강아지공룡알장난감_02005_01_20230923.json |
| 04:10:55.892 | 30 | - | eeaa2cfe-1424-4957-8ebc-2219e32dcae2 | - | - | - | request completed | - |
| 04:10:55.894 | 30 | projection.request | 58aa061c-b87d-45cd-bd3a-d54d21ea2473 | - | - | - | projection 요청 수신 | - |
| 04:10:55.896 | 30 | projection.start | 58aa061c-b87d-45cd-bd3a-d54d21ea2473 | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 04:10:55.896 | 20 | - | 58aa061c-b87d-45cd-bd3a-d54d21ea2473 | - | - | - | 커서 조회 | projector=multimodal-projector |
| 04:10:55.897 | 20 | - | 58aa061c-b87d-45cd-bd3a-d54d21ea2473 | - | - | - | 이벤트 조회 | - |
| 04:10:55.898 | 20 | projection.event.mapped | 58aa061c-b87d-45cd-bd3a-d54d21ea2473 | - | 2 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 04:10:55.899 | 20 | projection.event.mapped | 58aa061c-b87d-45cd-bd3a-d54d21ea2473 | - | 2 | 2 | 이벤트 매핑 | projector=multimodal-projector |
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
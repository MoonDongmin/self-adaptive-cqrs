<logging_context>
## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `insert.request`(level 30) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `payload.schema.drift`(level 40) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 54회, `-`(level 30) 1회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 06:02:55.917 | 30 | insert.request | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | - | - | - | Insert Event Store 요청 수신 | - |
| 06:02:55.917 | 30 | insert.batch.start | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | - | - | - | Toy-Data 적재 시작 | - |
| 06:02:55.922 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00001 | 1 | 1 | 이벤트 append | - |
| 06:02:55.922 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00001 | 1 | 1 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00001_01_20230923.json |
| 06:02:55.924 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00002 | 3 | 2 | 이벤트 append | - |
| 06:02:55.924 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00002 | 3 | 2 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00002_03_20230923.json |
| 06:02:55.924 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00005 | 3 | 3 | 이벤트 append | - |
| 06:02:55.924 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00005 | 3 | 3 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00005_03_20230923.json |
| 06:02:55.926 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 1 | 4 | 이벤트 append | - |
| 06:02:55.926 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 1 | 4 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00009_01_20230923.json |
| 06:02:55.927 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 3 | 5 | 이벤트 append | - |
| 06:02:55.927 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 3 | 5 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00009_03_20230923.json |
| 06:02:55.928 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 2 | 6 | 이벤트 append | - |
| 06:02:55.928 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 2 | 6 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00011_02_20230923.json |
| 06:02:55.929 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 3 | 7 | 이벤트 append | - |
| 06:02:55.929 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 3 | 7 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00011_03_20230923.json |
| 06:02:55.930 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00015 | 1 | 8 | 이벤트 append | - |
| 06:02:55.930 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00015 | 1 | 8 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00015_01_20230923.json |
| 06:02:55.931 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018 | 1 | 9 | 이벤트 append | - |
| 06:02:55.931 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018 | 1 | 9 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00018_01_20230923.json |
| 06:02:55.932 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00019 | 3 | 10 | 이벤트 append | - |
| 06:02:55.932 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00019 | 3 | 10 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00019_03_20230923.json |
| 06:02:55.933 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00021 | 2 | 11 | 이벤트 append | - |
| 06:02:55.933 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00021 | 2 | 11 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00021_02_20230923.json |
| 06:02:55.933 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00026 | 2 | 12 | 이벤트 append | - |
| 06:02:55.933 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00026 | 2 | 12 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00026_02_20230923.json |
| 06:02:55.934 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 2 | 13 | 이벤트 append | - |
| 06:02:55.934 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 2 | 13 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00027_02_20230923.json |
| 06:02:55.935 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 3 | 14 | 이벤트 append | - |
| 06:02:55.935 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 3 | 14 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00027_03_20230923.json |
| 06:02:55.936 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00029 | 3 | 15 | 이벤트 append | - |
| 06:02:55.936 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00029 | 3 | 15 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00029_03_20230923.json |
| 06:02:55.937 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00030 | 2 | 16 | 이벤트 append | - |
| 06:02:55.937 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00030 | 2 | 16 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00030_02_20230923.json |
| 06:02:55.938 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00036 | 3 | 17 | 이벤트 append | - |
| 06:02:55.938 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00036 | 3 | 17 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00036_03_20230923.json |
| 06:02:55.938 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00039 | 2 | 18 | 이벤트 append | - |
| 06:02:55.938 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00039 | 2 | 18 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00039_02_20230923.json |
| 06:02:55.939 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00041 | 2 | 19 | 이벤트 append | - |
| 06:02:55.939 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00041 | 2 | 19 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00041_02_20230923.json |
| 06:02:55.940 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00047 | 1 | 20 | 이벤트 append | - |
| 06:02:55.940 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00047 | 1 | 20 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00047_01_20230923.json |
| 06:02:55.941 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 21 | 이벤트 append | - |
| 06:02:55.941 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 21 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00051_02_20230923.json |
| 06:02:55.941 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 22 | 이벤트 append | - |
| 06:02:55.941 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 22 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00055_03_20230923.json |
| 06:02:55.942 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 23 | 이벤트 append | - |
| 06:02:55.942 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 23 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00056_02_20230923.json |
| 06:02:55.943 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 24 | 이벤트 append | - |
| 06:02:55.943 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 24 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00059_02_20230923.json |
| 06:02:55.944 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 25 | 이벤트 append | - |
| 06:02:55.944 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 25 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00061_03_20230923.json |
| 06:02:55.944 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02013 | 1 | 26 | 이벤트 append | - |
| 06:02:55.944 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02013 | 1 | 26 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_02013_01_20230923.json |
| 06:02:55.945 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02014 | 1 | 27 | 이벤트 append | - |
| 06:02:55.945 | 20 | insert.file.ok | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02014 | 1 | 27 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_02014_01_20230923.json |
| 06:02:55.945 | 40 | payload.schema.drift | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | - | - | - | payload 에 스키마가 모르는 신규 키 유입 — 적재 시 유실됨(Read Model 후보) ← 트립 앵커 | newKeys={"conveyor_speed": "1.2", "gripper_temperature": "36.5"} |
| 06:02:55.945 | 30 | insert.batch.done | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | - | - | - | toy-data 적재 완료 | - |
| 06:02:55.946 | 30 | - | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | - | - | - | request completed | - |
| 06:02:55.949 | 30 | projection.request | 1d822fbb-c69e-46f8-ab28-0595673bbcd5 | - | - | - | projection 요청 수신 | - |
| 06:02:55.950 | 20 | - | 1d822fbb-c69e-46f8-ab28-0595673bbcd5 | - | - | - | 커서 조회 | projector=multimodal-projector |
| 06:02:55.950 | 30 | projection.start | 1d822fbb-c69e-46f8-ab28-0595673bbcd5 | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 06:02:55.952 | 20 | projection.event.mapped | 1d822fbb-c69e-46f8-ab28-0595673bbcd5 | - | 1 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 06:02:55.952 | 20 | - | 1d822fbb-c69e-46f8-ab28-0595673bbcd5 | - | - | - | 이벤트 조회 | - |
| 06:02:55.954 | 20 | projection.event.mapped | 1d822fbb-c69e-46f8-ab28-0595673bbcd5 | - | 3 | 3 | 이벤트 매핑 | projector=multimodal-projector |
| 06:02:55.958 | 20 | projection.event.mapped | 1d822fbb-c69e-46f8-ab28-0595673bbcd5 | - | 3 | 10 | 이벤트 매핑 | projector=multimodal-projector |
| 06:02:55.959 | 20 | projection.event.mapped | 1d822fbb-c69e-46f8-ab28-0595673bbcd5 | - | 2 | 13 | 이벤트 매핑 | projector=multimodal-projector |
| 06:02:55.959 | 20 | projection.event.mapped | 1d822fbb-c69e-46f8-ab28-0595673bbcd5 | - | 3 | 14 | 이벤트 매핑 | projector=multimodal-projector |
| 06:02:55.960 | 20 | projection.event.mapped | 1d822fbb-c69e-46f8-ab28-0595673bbcd5 | - | 3 | 15 | 이벤트 매핑 | projector=multimodal-projector |
| 06:02:55.998 | 30 | insight.card.request | b5e7219e-e6c5-4f44-a494-de5c69f6aadf | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 06:02:55.999 | 40 | insight.card.miss | b5e7219e-e6c5-4f44-a494-de5c69f6aadf | - | - | - | insight 카드 없음: 최근 적재 데이터에 gripper_temperature 필드가 들어오기 시작했다. 이 값을 시간대별로 조회하고 싶다. 현재 Read Model로 가능한가? 안 되면 어떻게 해야 하나? | - |
| 06:02:55.999 | 30 | - | b5e7219e-e6c5-4f44-a494-de5c69f6aadf | - | - | - | request completed | - |
| 06:02:56.302 | 30 | insight.card.request | 7eaf37f0-2765-4c93-bdbb-5ff902106bb3 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 06:02:56.304 | 40 | insight.card.miss | 7eaf37f0-2765-4c93-bdbb-5ff902106bb3 | - | - | - | insight 카드 없음: 최근 적재 데이터에 gripper_temperature 필드가 들어오기 시작했다. 이 값을 시간대별로 조회하고 싶다. 현재 Read Model로 가능한가? 안 되면 어떻게 해야 하나? | - |
| 06:02:56.304 | 30 | - | 7eaf37f0-2765-4c93-bdbb-5ff902106bb3 | - | - | - | request completed | - |
| 06:02:56.609 | 30 | insight.card.request | d035021e-546e-4e3c-83c6-57a435f0bff6 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 06:02:56.611 | 40 | insight.card.miss | d035021e-546e-4e3c-83c6-57a435f0bff6 | - | - | - | insight 카드 없음: 최근 적재 데이터에 gripper_temperature 필드가 들어오기 시작했다. 이 값을 시간대별로 조회하고 싶다. 현재 Read Model로 가능한가? 안 되면 어떻게 해야 하나? | - |
| 06:02:56.611 | 30 | - | d035021e-546e-4e3c-83c6-57a435f0bff6 | - | - | - | request completed | - |
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
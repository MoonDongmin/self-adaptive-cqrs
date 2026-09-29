<logging_context>
## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `insert.batch.done`(level 30) 1회, `insert.batch.start`(level 30) 1회, `insert.file.ok`(level 20) 54회, `insert.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `log.delete.request`(level 30) 1회, `payload.schema.drift`(level 40) 1회, `-`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 00:07:46.093 | 30 | insert.request | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | - | - | - | Insert Event Store 요청 수신 | - |
| 00:07:46.093 | 30 | insert.batch.start | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | - | - | - | Toy-Data 적재 시작 | - |
| 00:07:46.101 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00001 | 1 | 1 | 이벤트 append | - |
| 00:07:46.101 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00001 | 1 | 1 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00001_01_20230923.json |
| 00:07:46.103 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00002 | 3 | 2 | 이벤트 append | - |
| 00:07:46.103 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00002 | 3 | 2 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00002_03_20230923.json |
| 00:07:46.104 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00005 | 3 | 3 | 이벤트 append | - |
| 00:07:46.104 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00005 | 3 | 3 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00005_03_20230923.json |
| 00:07:46.106 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 1 | 4 | 이벤트 append | - |
| 00:07:46.107 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 1 | 4 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00009_01_20230923.json |
| 00:07:46.107 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 3 | 5 | 이벤트 append | - |
| 00:07:46.107 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 3 | 5 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00009_03_20230923.json |
| 00:07:46.108 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 2 | 6 | 이벤트 append | - |
| 00:07:46.108 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 2 | 6 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00011_02_20230923.json |
| 00:07:46.109 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 3 | 7 | 이벤트 append | - |
| 00:07:46.109 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 3 | 7 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00011_03_20230923.json |
| 00:07:46.110 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00015 | 1 | 8 | 이벤트 append | - |
| 00:07:46.110 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00015 | 1 | 8 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00015_01_20230923.json |
| 00:07:46.112 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018 | 1 | 9 | 이벤트 append | - |
| 00:07:46.112 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018 | 1 | 9 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00018_01_20230923.json |
| 00:07:46.113 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00019 | 3 | 10 | 이벤트 append | - |
| 00:07:46.113 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00019 | 3 | 10 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00019_03_20230923.json |
| 00:07:46.114 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00021 | 2 | 11 | 이벤트 append | - |
| 00:07:46.114 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00021 | 2 | 11 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00021_02_20230923.json |
| 00:07:46.115 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00026 | 2 | 12 | 이벤트 append | - |
| 00:07:46.115 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00026 | 2 | 12 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00026_02_20230923.json |
| 00:07:46.116 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 2 | 13 | 이벤트 append | - |
| 00:07:46.116 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 2 | 13 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00027_02_20230923.json |
| 00:07:46.117 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 3 | 14 | 이벤트 append | - |
| 00:07:46.117 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 3 | 14 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00027_03_20230923.json |
| 00:07:46.118 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00029 | 3 | 15 | 이벤트 append | - |
| 00:07:46.118 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00029 | 3 | 15 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00029_03_20230923.json |
| 00:07:46.119 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00030 | 2 | 16 | 이벤트 append | - |
| 00:07:46.119 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00030 | 2 | 16 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00030_02_20230923.json |
| 00:07:46.120 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00036 | 3 | 17 | 이벤트 append | - |
| 00:07:46.120 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00036 | 3 | 17 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00036_03_20230923.json |
| 00:07:46.121 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00039 | 2 | 18 | 이벤트 append | - |
| 00:07:46.121 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00039 | 2 | 18 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00039_02_20230923.json |
| 00:07:46.122 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00041 | 2 | 19 | 이벤트 append | - |
| 00:07:46.122 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00041 | 2 | 19 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00041_02_20230923.json |
| 00:07:46.123 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00047 | 1 | 20 | 이벤트 append | - |
| 00:07:46.123 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00047 | 1 | 20 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00047_01_20230923.json |
| 00:07:46.124 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 21 | 이벤트 append | - |
| 00:07:46.124 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 21 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00051_02_20230923.json |
| 00:07:46.125 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 22 | 이벤트 append | - |
| 00:07:46.125 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 22 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00055_03_20230923.json |
| 00:07:46.126 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 23 | 이벤트 append | - |
| 00:07:46.126 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 23 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00056_02_20230923.json |
| 00:07:46.127 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 24 | 이벤트 append | - |
| 00:07:46.127 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 24 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00059_02_20230923.json |
| 00:07:46.128 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 25 | 이벤트 append | - |
| 00:07:46.128 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 25 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00061_03_20230923.json |
| 00:07:46.128 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02013 | 1 | 26 | 이벤트 append | - |
| 00:07:46.128 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02013 | 1 | 26 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_02013_01_20230923.json |
| 00:07:46.129 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02014 | 1 | 27 | 이벤트 append | - |
| 00:07:46.129 | 20 | insert.file.ok | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02014 | 1 | 27 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_02014_01_20230923.json |
| 00:07:46.129 | 40 | payload.schema.drift | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | - | - | - | payload 에 스키마가 모르는 신규 키 유입 — 적재 시 유실됨(Read Model 후보) ← 트립 앵커 | newKeys={"conveyor_speed": "1.2", "gripper_temperature": "36.5"} |
| 00:07:46.129 | 30 | insert.batch.done | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | - | - | - | toy-data 적재 완료 | - |
| 00:07:46.130 | 30 | - | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | - | - | - | request completed | - |
| 00:07:46.132 | 30 | projection.request | 0c00ae45-b264-48f7-95e7-d644b65cfeb0 | - | - | - | projection 요청 수신 | - |
| 00:07:46.135 | 30 | projection.start | 0c00ae45-b264-48f7-95e7-d644b65cfeb0 | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 00:07:46.135 | 20 | - | 0c00ae45-b264-48f7-95e7-d644b65cfeb0 | - | - | - | 커서 조회 | projector=multimodal-projector |
| 00:07:46.138 | 20 | projection.event.mapped | 0c00ae45-b264-48f7-95e7-d644b65cfeb0 | - | 1 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 00:07:46.138 | 20 | - | 0c00ae45-b264-48f7-95e7-d644b65cfeb0 | - | - | - | 이벤트 조회 | - |
| 00:07:46.142 | 20 | projection.event.mapped | 0c00ae45-b264-48f7-95e7-d644b65cfeb0 | - | 3 | 3 | 이벤트 매핑 | projector=multimodal-projector |
| 00:07:46.146 | 20 | projection.event.mapped | 0c00ae45-b264-48f7-95e7-d644b65cfeb0 | - | 2 | 12 | 이벤트 매핑 | projector=multimodal-projector |
| 00:07:46.147 | 20 | projection.event.mapped | 0c00ae45-b264-48f7-95e7-d644b65cfeb0 | - | 2 | 13 | 이벤트 매핑 | projector=multimodal-projector |
| 00:07:46.147 | 20 | projection.event.mapped | 0c00ae45-b264-48f7-95e7-d644b65cfeb0 | - | 3 | 14 | 이벤트 매핑 | projector=multimodal-projector |
| 00:07:46.156 | 20 | projection.event.mapped | 0c00ae45-b264-48f7-95e7-d644b65cfeb0 | - | 3 | 15 | 이벤트 매핑 | projector=multimodal-projector |
| 00:07:46.220 | 30 | insight.card.request | 4dc8ff78-7323-4072-a966-6e3c96c37573 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 00:07:46.221 | 40 | insight.card.miss | 4dc8ff78-7323-4072-a966-6e3c96c37573 | - | - | - | insight 카드 없음: 최근 적재 데이터에 gripper_temperature 필드가 들어오기 시작했다. 이 값을 시간대별로 조회하고 싶다. 현재 Read Model로 가능한가? 안 되면 어떻게 해야 하나? | - |
| 00:07:46.221 | 30 | - | 4dc8ff78-7323-4072-a966-6e3c96c37573 | - | - | - | request completed | - |
| 00:07:46.524 | 30 | insight.card.request | b6b75de2-6fe2-4e95-a96f-4df929420080 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 00:07:46.525 | 40 | insight.card.miss | b6b75de2-6fe2-4e95-a96f-4df929420080 | - | - | - | insight 카드 없음: 최근 적재 데이터에 gripper_temperature 필드가 들어오기 시작했다. 이 값을 시간대별로 조회하고 싶다. 현재 Read Model로 가능한가? 안 되면 어떻게 해야 하나? | - |
| 00:07:46.526 | 30 | - | b6b75de2-6fe2-4e95-a96f-4df929420080 | - | - | - | request completed | - |
| 00:07:46.839 | 30 | insight.card.request | ae32bf86-e5c3-4053-8c97-ced150193672 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 00:07:46.875 | 40 | insight.card.miss | ae32bf86-e5c3-4053-8c97-ced150193672 | - | - | - | insight 카드 없음: 최근 적재 데이터에 gripper_temperature 필드가 들어오기 시작했다. 이 값을 시간대별로 조회하고 싶다. 현재 Read Model로 가능한가? 안 되면 어떻게 해야 하나? | - |
| 00:07:46.876 | 30 | - | ae32bf86-e5c3-4053-8c97-ced150193672 | - | - | - | request completed | - |
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
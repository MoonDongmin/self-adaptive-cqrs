당신은 이벤트 소싱 + CQRS 기반 Physical AI 데이터 플랫폼의 시니어 아키텍트이자 엄격한 평가자다. LLM 파이프라인이 [자료](로그·이벤트·스키마 정보)를 보고 [Docs]를 생성했다. Docs 는 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소를 항상 함께 담아야 하는 단일 산출물이다. 당신은 [정답 요지]와 [자료], [자동 검증 결과]를 기준으로 Docs 를 네 항목의 루브릭으로 채점한다. 채점은 관대하지 않게, 근거 없는 주장·지어낸 값·의도와 다른 SQL·서로 어긋나는 절에는 낮은 점수를 준다. 반드시 JSON 객체 하나만 출력한다. 설명문·마크다운 펜스는 출력하지 않는다.

---

[시나리오] E1-new-column-query
[상황] 사용자가 아래 조회를 요청했으나 기존 Read Model 로는 제공할 수 없다.
[정답 요지] 사용자가 신규 필드 gripper_temperature 의 시간대별 조회를 요청했으나 기존 Read Model 에 컬럼이 없음(payload-drift 로 유실 중). 조치: gripper_temperature 를 담는 새 Read Model(또는 v2 컬럼 추가)과 백필, API v2 병행.

[자료] — Docs 생성 시 파이프라인이 받은 로그·이벤트·스키마 정보
<<<자료 시작>>>
<logging_context>
## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `insert.request`(level 30) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `payload.schema.drift`(level 40) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 54회, `insight.cards.request`(level 30) 2회, `-`(level 30) 4회, `insight.card.rendered`(level 20) 6회, `insert.batch.done`(level 30) 1회, `-`(level 20) 8회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 00:22:16.091 | 30 | insert.request | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | - | - | - | Insert Event Store 요청 수신 | - |
| 00:22:16.091 | 30 | insert.batch.start | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | - | - | - | Toy-Data 적재 시작 | - |
| 00:22:16.096 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00001 | 1 | 1 | 이벤트 append | - |
| 00:22:16.096 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00001 | 1 | 1 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00001_01_20230923.json |
| 00:22:16.097 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00002 | 3 | 2 | 이벤트 append | - |
| 00:22:16.097 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00002 | 3 | 2 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00002_03_20230923.json |
| 00:22:16.098 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00005 | 3 | 3 | 이벤트 append | - |
| 00:22:16.098 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00005 | 3 | 3 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00005_03_20230923.json |
| 00:22:16.099 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 1 | 4 | 이벤트 append | - |
| 00:22:16.099 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 1 | 4 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00009_01_20230923.json |
| 00:22:16.100 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 3 | 5 | 이벤트 append | - |
| 00:22:16.101 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 3 | 5 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00009_03_20230923.json |
| 00:22:16.101 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 2 | 6 | 이벤트 append | - |
| 00:22:16.101 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 2 | 6 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00011_02_20230923.json |
| 00:22:16.102 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 3 | 7 | 이벤트 append | - |
| 00:22:16.102 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 3 | 7 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00011_03_20230923.json |
| 00:22:16.103 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00015 | 1 | 8 | 이벤트 append | - |
| 00:22:16.103 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00015 | 1 | 8 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00015_01_20230923.json |
| 00:22:16.104 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018 | 1 | 9 | 이벤트 append | - |
| 00:22:16.104 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018 | 1 | 9 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00018_01_20230923.json |
| 00:22:16.104 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00019 | 3 | 10 | 이벤트 append | - |
| 00:22:16.104 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00019 | 3 | 10 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00019_03_20230923.json |
| 00:22:16.105 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00021 | 2 | 11 | 이벤트 append | - |
| 00:22:16.105 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00021 | 2 | 11 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00021_02_20230923.json |
| 00:22:16.106 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00026 | 2 | 12 | 이벤트 append | - |
| 00:22:16.106 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00026 | 2 | 12 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00026_02_20230923.json |
| 00:22:16.107 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 2 | 13 | 이벤트 append | - |
| 00:22:16.107 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 2 | 13 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00027_02_20230923.json |
| 00:22:16.107 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 3 | 14 | 이벤트 append | - |
| 00:22:16.107 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 3 | 14 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00027_03_20230923.json |
| 00:22:16.108 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00029 | 3 | 15 | 이벤트 append | - |
| 00:22:16.108 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00029 | 3 | 15 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00029_03_20230923.json |
| 00:22:16.109 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00030 | 2 | 16 | 이벤트 append | - |
| 00:22:16.109 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00030 | 2 | 16 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00030_02_20230923.json |
| 00:22:16.110 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00036 | 3 | 17 | 이벤트 append | - |
| 00:22:16.110 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00036 | 3 | 17 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00036_03_20230923.json |
| 00:22:16.110 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00039 | 2 | 18 | 이벤트 append | - |
| 00:22:16.110 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00039 | 2 | 18 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00039_02_20230923.json |
| 00:22:16.111 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00041 | 2 | 19 | 이벤트 append | - |
| 00:22:16.111 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00041 | 2 | 19 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00041_02_20230923.json |
| 00:22:16.112 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00047 | 1 | 20 | 이벤트 append | - |
| 00:22:16.112 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00047 | 1 | 20 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00047_01_20230923.json |
| 00:22:16.112 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 21 | 이벤트 append | - |
| 00:22:16.112 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 21 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00051_02_20230923.json |
| 00:22:16.113 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 22 | 이벤트 append | - |
| 00:22:16.113 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 22 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00055_03_20230923.json |
| 00:22:16.114 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 23 | 이벤트 append | - |
| 00:22:16.114 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 23 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00056_02_20230923.json |
| 00:22:16.114 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 24 | 이벤트 append | - |
| 00:22:16.115 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 24 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00059_02_20230923.json |
| 00:22:16.115 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 25 | 이벤트 append | - |
| 00:22:16.115 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 25 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00061_03_20230923.json |
| 00:22:16.116 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02013 | 1 | 26 | 이벤트 append | - |
| 00:22:16.116 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02013 | 1 | 26 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_02013_01_20230923.json |
| 00:22:16.117 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02014 | 1 | 27 | 이벤트 append | - |
| 00:22:16.117 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02014 | 1 | 27 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_02014_01_20230923.json |
| 00:22:16.117 | 40 | payload.schema.drift | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | - | - | - | payload 에 스키마가 모르는 신규 키 유입 — 적재 시 유실됨(Read Model 후보) ← 트립 앵커 | newKeys={"conveyor_speed": "1.2", "gripper_temperature": "36.5"} |
| 00:22:16.117 | 30 | insert.batch.done | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | - | - | - | toy-data 적재 완료 | - |
| 00:22:16.117 | 30 | - | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | - | - | - | request completed | - |
| 00:22:16.119 | 30 | projection.request | cbad1561-dd29-418f-b493-c507e6e713fb | - | - | - | projection 요청 수신 | - |
| 00:22:16.121 | 20 | - | cbad1561-dd29-418f-b493-c507e6e713fb | - | - | - | 커서 조회 | projector=multimodal-projector |
| 00:22:16.121 | 30 | projection.start | cbad1561-dd29-418f-b493-c507e6e713fb | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 00:22:16.123 | 20 | projection.event.mapped | cbad1561-dd29-418f-b493-c507e6e713fb | - | 1 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 00:22:16.123 | 20 | - | cbad1561-dd29-418f-b493-c507e6e713fb | - | - | - | 이벤트 조회 | - |
| 00:22:16.124 | 20 | projection.event.mapped | cbad1561-dd29-418f-b493-c507e6e713fb | - | 3 | 2 | 이벤트 매핑 | projector=multimodal-projector |
| 00:22:16.129 | 20 | projection.event.mapped | cbad1561-dd29-418f-b493-c507e6e713fb | - | 3 | 14 | 이벤트 매핑 | projector=multimodal-projector |
| 00:22:16.129 | 20 | projection.event.mapped | cbad1561-dd29-418f-b493-c507e6e713fb | - | 2 | 13 | 이벤트 매핑 | projector=multimodal-projector |
| 00:22:16.130 | 20 | projection.event.mapped | cbad1561-dd29-418f-b493-c507e6e713fb | - | 3 | 15 | 이벤트 매핑 | projector=multimodal-projector |
| 00:22:16.130 | 20 | projection.event.mapped | cbad1561-dd29-418f-b493-c507e6e713fb | - | 2 | 16 | 이벤트 매핑 | projector=multimodal-projector |
| 00:22:16.166 | 30 | insight.card.request | aa8b012a-0f26-43f3-8f6b-c1e65170d7ca | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 00:22:16.167 | 40 | insight.card.miss | aa8b012a-0f26-43f3-8f6b-c1e65170d7ca | - | - | - | insight 카드 없음: 최근 적재 데이터에 gripper_temperature 필드가 들어오기 시작했다. 이 값을 시간대별로 조회하고 싶다. 현재 Read Model로 가능한가? 안 되면 어떻게 해야 하나? | - |
| 00:22:16.168 | 30 | - | aa8b012a-0f26-43f3-8f6b-c1e65170d7ca | - | - | - | request completed | - |
| 00:22:16.472 | 30 | insight.card.request | 46e74110-4213-4e36-81fb-65a4c071965c | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 00:22:16.474 | 40 | insight.card.miss | 46e74110-4213-4e36-81fb-65a4c071965c | - | - | - | insight 카드 없음: 최근 적재 데이터에 gripper_temperature 필드가 들어오기 시작했다. 이 값을 시간대별로 조회하고 싶다. 현재 Read Model로 가능한가? 안 되면 어떻게 해야 하나? | - |
| 00:22:16.475 | 30 | - | 46e74110-4213-4e36-81fb-65a4c071965c | - | - | - | request completed | - |
| 00:22:16.780 | 30 | insight.card.request | 489ef675-a2fe-4e07-b30e-c32d277e29d4 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 00:22:16.782 | 40 | insight.card.miss | 489ef675-a2fe-4e07-b30e-c32d277e29d4 | - | - | - | insight 카드 없음: 최근 적재 데이터에 gripper_temperature 필드가 들어오기 시작했다. 이 값을 시간대별로 조회하고 싶다. 현재 Read Model로 가능한가? 안 되면 어떻게 해야 하나? | - |
| 00:22:16.783 | 30 | - | 489ef675-a2fe-4e07-b30e-c32d277e29d4 | - | - | - | request completed | - |
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
docId: analysis-67ac254c-114e-4fd3-bf1f-a901d726ec60
generatedAt: 2026-08-14T00:22:18.791Z
targetReadModel: read_grip_result_v2
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
  - { origin: developer-logging, anchorId: "67ac254c-114e-4fd3-bf1f-a901d726ec60" }
  - { origin: developer-logging, anchorId: "aa8b012a-0f26-43f3-8f6b-c1e65170d7ca" }
  - { origin: developer-logging, anchorId: "46e74110-4213-4e36-81fb-65a4c071965c" }
  - { origin: developer-logging, anchorId: "489ef675-a2fe-4e07-b30e-c32d277e29d4" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_grip_result_v2

> 결론(TL;DR): `read_grip_result_v2`을(를) 재생성한다 — 적재 단계에서 payload 에 신규 키(conveyor_speed, gripper_temperature)가 유입되며 스키마 드리프트 발생. 이후 사용자는 이 신규 필드(gripper_temperature)를 조회하려 했으나 관련 Insight Card 부재로 실패. (이상 유형: 스키마 드리프트(신규 키 유입) · 심각도: warning)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `insert.request`(level 30) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `payload.schema.drift`(level 40) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 54회, `insight.cards.request`(level 30) 2회, `-`(level 30) 4회, `insight.card.rendered`(level 20) 6회, `insert.batch.done`(level 30) 1회, `-`(level 20) 8회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 00:22:16.091 | 30 | insert.request | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | - | - | - | Insert Event Store 요청 수신 | - |
| 00:22:16.091 | 30 | insert.batch.start | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | - | - | - | Toy-Data 적재 시작 | - |
| 00:22:16.096 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00001 | 1 | 1 | 이벤트 append | - |
| 00:22:16.096 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00001 | 1 | 1 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00001_01_20230923.json |
| 00:22:16.097 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00002 | 3 | 2 | 이벤트 append | - |
| 00:22:16.097 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00002 | 3 | 2 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00002_03_20230923.json |
| 00:22:16.098 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00005 | 3 | 3 | 이벤트 append | - |
| 00:22:16.098 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00005 | 3 | 3 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00005_03_20230923.json |
| 00:22:16.099 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 1 | 4 | 이벤트 append | - |
| 00:22:16.099 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 1 | 4 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00009_01_20230923.json |
| 00:22:16.100 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 3 | 5 | 이벤트 append | - |
| 00:22:16.101 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 3 | 5 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00009_03_20230923.json |
| 00:22:16.101 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 2 | 6 | 이벤트 append | - |
| 00:22:16.101 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 2 | 6 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00011_02_20230923.json |
| 00:22:16.102 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 3 | 7 | 이벤트 append | - |
| 00:22:16.102 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 3 | 7 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00011_03_20230923.json |
| 00:22:16.103 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00015 | 1 | 8 | 이벤트 append | - |
| 00:22:16.103 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00015 | 1 | 8 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00015_01_20230923.json |
| 00:22:16.104 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018 | 1 | 9 | 이벤트 append | - |
| 00:22:16.104 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018 | 1 | 9 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00018_01_20230923.json |
| 00:22:16.104 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00019 | 3 | 10 | 이벤트 append | - |
| 00:22:16.104 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00019 | 3 | 10 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00019_03_20230923.json |
| 00:22:16.105 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00021 | 2 | 11 | 이벤트 append | - |
| 00:22:16.105 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00021 | 2 | 11 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00021_02_20230923.json |
| 00:22:16.106 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00026 | 2 | 12 | 이벤트 append | - |
| 00:22:16.106 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00026 | 2 | 12 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00026_02_20230923.json |
| 00:22:16.107 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 2 | 13 | 이벤트 append | - |
| 00:22:16.107 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 2 | 13 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00027_02_20230923.json |
| 00:22:16.107 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 3 | 14 | 이벤트 append | - |
| 00:22:16.107 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 3 | 14 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00027_03_20230923.json |
| 00:22:16.108 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00029 | 3 | 15 | 이벤트 append | - |
| 00:22:16.108 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00029 | 3 | 15 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00029_03_20230923.json |
| 00:22:16.109 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00030 | 2 | 16 | 이벤트 append | - |
| 00:22:16.109 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00030 | 2 | 16 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00030_02_20230923.json |
| 00:22:16.110 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00036 | 3 | 17 | 이벤트 append | - |
| 00:22:16.110 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00036 | 3 | 17 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00036_03_20230923.json |
| 00:22:16.110 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00039 | 2 | 18 | 이벤트 append | - |
| 00:22:16.110 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00039 | 2 | 18 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00039_02_20230923.json |
| 00:22:16.111 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00041 | 2 | 19 | 이벤트 append | - |
| 00:22:16.111 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00041 | 2 | 19 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00041_02_20230923.json |
| 00:22:16.112 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00047 | 1 | 20 | 이벤트 append | - |
| 00:22:16.112 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00047 | 1 | 20 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00047_01_20230923.json |
| 00:22:16.112 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 21 | 이벤트 append | - |
| 00:22:16.112 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 21 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00051_02_20230923.json |
| 00:22:16.113 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 22 | 이벤트 append | - |
| 00:22:16.113 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 22 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00055_03_20230923.json |
| 00:22:16.114 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 23 | 이벤트 append | - |
| 00:22:16.114 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 23 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00056_02_20230923.json |
| 00:22:16.114 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 24 | 이벤트 append | - |
| 00:22:16.115 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 24 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00059_02_20230923.json |
| 00:22:16.115 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 25 | 이벤트 append | - |
| 00:22:16.115 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 25 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00061_03_20230923.json |
| 00:22:16.116 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02013 | 1 | 26 | 이벤트 append | - |
| 00:22:16.116 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02013 | 1 | 26 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_02013_01_20230923.json |
| 00:22:16.117 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02014 | 1 | 27 | 이벤트 append | - |
| 00:22:16.117 | 20 | insert.file.ok | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02014 | 1 | 27 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_02014_01_20230923.json |
| 00:22:16.117 | 40 | payload.schema.drift | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | - | - | - | payload 에 스키마가 모르는 신규 키 유입 — 적재 시 유실됨(Read Model 후보) ← 트립 앵커 | newKeys={"conveyor_speed": "1.2", "gripper_temperature": "36.5"} |
| 00:22:16.117 | 30 | insert.batch.done | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | - | - | - | toy-data 적재 완료 | - |
| 00:22:16.117 | 30 | - | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | - | - | - | request completed | - |
| 00:22:16.119 | 30 | projection.request | cbad1561-dd29-418f-b493-c507e6e713fb | - | - | - | projection 요청 수신 | - |
| 00:22:16.121 | 20 | - | cbad1561-dd29-418f-b493-c507e6e713fb | - | - | - | 커서 조회 | projector=multimodal-projector |
| 00:22:16.121 | 30 | projection.start | cbad1561-dd29-418f-b493-c507e6e713fb | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 00:22:16.123 | 20 | projection.event.mapped | cbad1561-dd29-418f-b493-c507e6e713fb | - | 1 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 00:22:16.123 | 20 | - | cbad1561-dd29-418f-b493-c507e6e713fb | - | - | - | 이벤트 조회 | - |
| 00:22:16.124 | 20 | projection.event.mapped | cbad1561-dd29-418f-b493-c507e6e713fb | - | 3 | 2 | 이벤트 매핑 | projector=multimodal-projector |
| 00:22:16.129 | 20 | projection.event.mapped | cbad1561-dd29-418f-b493-c507e6e713fb | - | 3 | 14 | 이벤트 매핑 | projector=multimodal-projector |
| 00:22:16.129 | 20 | projection.event.mapped | cbad1561-dd29-418f-b493-c507e6e713fb | - | 2 | 13 | 이벤트 매핑 | projector=multimodal-projector |
| 00:22:16.130 | 20 | projection.event.mapped | cbad1561-dd29-418f-b493-c507e6e713fb | - | 3 | 15 | 이벤트 매핑 | projector=multimodal-projector |
| 00:22:16.130 | 20 | projection.event.mapped | cbad1561-dd29-418f-b493-c507e6e713fb | - | 2 | 16 | 이벤트 매핑 | projector=multimodal-projector |
| 00:22:16.166 | 30 | insight.card.request | aa8b012a-0f26-43f3-8f6b-c1e65170d7ca | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 00:22:16.167 | 40 | insight.card.miss | aa8b012a-0f26-43f3-8f6b-c1e65170d7ca | - | - | - | insight 카드 없음: 최근 적재 데이터에 gripper_temperature 필드가 들어오기 시작했다. 이 값을 시간대별로 조회하고 싶다. 현재 Read Model로 가능한가? 안 되면 어떻게 해야 하나? | - |
| 00:22:16.168 | 30 | - | aa8b012a-0f26-43f3-8f6b-c1e65170d7ca | - | - | - | request completed | - |
| 00:22:16.472 | 30 | insight.card.request | 46e74110-4213-4e36-81fb-65a4c071965c | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 00:22:16.474 | 40 | insight.card.miss | 46e74110-4213-4e36-81fb-65a4c071965c | - | - | - | insight 카드 없음: 최근 적재 데이터에 gripper_temperature 필드가 들어오기 시작했다. 이 값을 시간대별로 조회하고 싶다. 현재 Read Model로 가능한가? 안 되면 어떻게 해야 하나? | - |
| 00:22:16.475 | 30 | - | 46e74110-4213-4e36-81fb-65a4c071965c | - | - | - | request completed | - |
| 00:22:16.780 | 30 | insight.card.request | 489ef675-a2fe-4e07-b30e-c32d277e29d4 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 00:22:16.782 | 40 | insight.card.miss | 489ef675-a2fe-4e07-b30e-c32d277e29d4 | - | - | - | insight 카드 없음: 최근 적재 데이터에 gripper_temperature 필드가 들어오기 시작했다. 이 값을 시간대별로 조회하고 싶다. 현재 Read Model로 가능한가? 안 되면 어떻게 해야 하나? | - |
| 00:22:16.783 | 30 | - | 489ef675-a2fe-4e07-b30e-c32d277e29d4 | - | - | - | request completed | - |

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
- (level 40, `payload.schema.drift`) payload 에 스키마가 모르는 신규 키 유입 — 적재 시 유실됨(Read Model 후보) ← 트립 앵커 → ES 수락 신규 키(conveyor_speed, gripper_temperature) 하나 기존 Read Model 스키마 부재로 투영 과정에서 데이터 유실된다는 것을 드러낸다. [corr:67ac254c-114e-4fd3-bf1f-a901d726ec60]
- (level 40, `insight.card.miss`) insight 카드 없음: 최근 적재 데이터에 gripper_temperature 필드가 들어오기 시작했다. 이 값을 시간대별로 조회하고 싶다. 현재 Read Model로 가능한가? 안 되면 어떻게 해야 하나? → 사용자의 명확한 의도(시간대별 집계 조회) 확인하나 기존 RM/Insight Card로는 충족할 수 없다는 것을 드러낸다. [corr:aa8b012a-0f26-43f3-8f6b-c1e65170d7ca]
- (level 40, `insight.card.miss`) insight 카드 없음: 최근 적재 데이터에 gripper_temperature 필드가 들어오기 시작했다. 이 값을 시간대별로 조회하고 싶다. 현재 Read Model로 가능한가? 안 되면 어떻게 해야 하나? → 반복 미스 로그는 집계 의도 미충족이 persistent 하다는 것을 드러낸다. [corr:46e74110-4213-4e36-81fb-65a4c071965c]
- (level 40, `insight.card.miss`) insight 카드 없음: 최근 적재 데이터에 gripper_temperature 필드가 들어오기 시작했다. 이 값을 시간대별로 조회하고 싶다. 현재 Read Model로 가능한가? 안 되면 어떻게 해야 하나? → 세 번의 미스 로그는 schema 드리프트 데이터가 inaccessible for time-based analysis 하다는 것을 드러낸다. [corr:489ef675-a2fe-4e07-b30e-c32d277e29d4]
- read_grip_result Insight 카드 및 GripAttemptRecorded 도메인 스키마에 conveyor_speed, gripper_temperature 결결. payload 드리프트 키가 domain 모델과 Read Model 모두 미트랙킹된다는 것을 드러낸다.
- GripResultProjector.map() 실제 소스 return 객체 고정 스키마 매핑만 수행, 신규 드리프트 키 명시게 추출/할당 로직 부재. 투영 실패(poison event) 또는 Zod 거절이 아닌 silent data loss 패턴을 드러낸다.
- 사용자의 의도(시간대별 조회)는 GROUP BY occurred_at 집계 요구. 기존 read_grip_result(key: scene_key, attempt_num) 행 단위 구조로는 충족 불가능.
- insert.file.ok 로그 맥락 stream_id grip-attempt:..._00001 ~ _02014, attempt 1/2/3. ES append 성공하나 catch-up 재실행 시 기존 RM 스키마 미정합으로 미투영 상태가 누적된다는 것을 드러낸다.

### Decision Drivers
- Schema Drift Handling: 신규 키 유입을 Zod coerce/기본값 치환으로 정상값처럼 꾸며 Read Model에 유입시키는 권고를 금지(무해화 원칙). 거절·격리 유지 + 원천 데이터 수정 요청 또는 신규 테이블 확장이 필수.
- Query Intent Fulfillment: 사용자의 의도(시간대별 조회)는 GROUP BY occurred_at 집계 요구. 기존 read_grip_result 행 단위 구조로는 충족 불가능.
- Version Management & Consistency: payload schema 드리프트와 Read Model 구조 변경은 API/DB 버전 boundary(versionSwitch) 동반 필히. 기존 RM 계약 파손 금지.
- Projection Safety: catch-up 재실행 시 미투영 이벤트 식별·검증 SQL 격리 수단 적용. poison event 발생 방지 및 커서 점프 유실 최소화.

### Considered Options
#### 기각 대안: 기존 보강 (read_grip_result 직접 수정)
- 접근: src/shared/database/schema/service/read-grip-result.ts Drizzle schema 추가 필드 매핑, GripResultProjector.map() return 객체 확장.
- 제안 필드: conveyor_speed, gripper_temperature
- 트레이드오프: 기존 API 계약 파손(Driver 3 실패), 집계 의도 미충족(Driver 2 실패), Zod coerce risk 발생(Driver 1 실패).
```typescript
return { ...row, conveyorSpeed: payload.conveyor_speed ?? null, gripperTemperature: payload.gripper_temperature ?? null };
```

#### 권장안: 신규 분리 (read_grip_result_v2 채택)
- 접근: 확정 설계 read_grip_result_v2 테이블 배포, GripResultProjector.map() drift 필드 추출 로직 적용, versionSwitch 연계.
- 제안 필드: conveyor_speed, gripper_temperature
- 트레이드오프: 초기 마이그레이션 오버헤드 및 catch-up 재실행 필요(Driver 4 소모). 그러나 Driver 1(무해화) 충족, Driver 2(의도 충족) 충족, Driver 3(버전 관리) 충족.
```typescript
return { sceneKey: event.streamId.replace(/^grip-attempt:/, ""), attemptNum: event.attemptNum, objectName: payload.objects[0].class_name, gripSucceed: payload.grip_succeed, gripperType: "finger", occurredAt: event.occurredAt, grip2dPose: payload.grip_data.grip_2d_pose, grip3dPose: payload.grip_data.grip_3d_pose, robotTf: payload.robot_tf, humanAnnotationGrasp: payload.human_annotation_grasp, streamId: event.streamId, globalSeq: event.globalSeq, conveyorSpeed: typeof (event.payload as Record<string, unknown>).conveyor_speed === "number" ? Number(event.payload as Record<string, unknown>).conveyor_speed : null, gripperTemperature: typeof (event.payload as Record<string, unknown>).gripper_temperature === "number" ? Number(event.payload as Record<string, unknown>).gripper_temperature : null };
```

### Decision Outcome
신규 분리 (read_grip_result_v2 채택)

### Consequences
- (+) 사용자의 시간대별 조회 의도 충족 via 신규 테이블 구조 및 aggregation query 지원.
- (+) payload 드리프트 키(conveyor_speed, gripper_temperature) silent data loss 방지, 원천 데이터 무해화 원칙 준수.
- (+) 기존 read_grip_result API/DB 계약 유지, downstream consumer 호환성 보장.
- (−) catch-up 재실행으로 미투영 이벤트 식별·검증 SQL 격리 수행 필요, 초기 projection latency 증가.
- (−) Drizzle schema & Projector map 로직 수정 및 versionSwitch deployment overhead 발생.
- (−) ES event payload Zod 스키마(toyDataSchema) 미확장 시 runtime type assertion fallback 로직 추가 필히.

### Non-Goals
- 기존 read_grip_result 테이블 직접 컬럼 확장 또는 API endpoint 변경.
- Zod validation 실패값 coerce/기본값 치환으로 Read Model 유입.
- ES event structure, payload format, stream_id naming convention alteration.

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
  grip_2d_pose jsonb,
  grip_3d_pose jsonb,
  robot_tf jsonb,
  human_annotation_grasp jsonb,
  stream_id varchar,
  global_seq bigint,
  conveyor_speed double precision,
  gripper_temperature double precision,
  PRIMARY KEY (scene_key, attempt_num)
);
```

### 필드

```mschema
# Table: read_grip_result_v2
[
(scene_key:varchar, 장면 식별 키, Primary Key),
(attempt_num:smallint, 시도 번호, Primary Key),
(object_name:varchar, 파지 대상 객 명),
(grip_succeed:smallint, 파지 성공 여부),
(gripper_type:varchar(16), 그리퍼 종류),
(occurred_at:timestamptz, 데이터 촬영 일자),
(grip_2d_pose:jsonb, 2D 파지점),
(grip_3d_pose:jsonb, 3D 파지점),
(robot_tf:jsonb, 로봇 변환행렬),
(human_annotation_grasp:jsonb, 휴먼 어노테이션 파 지 영역),
(stream_id:varchar, ES 스트림 ID),
(global_seq:bigint, 투영 출처 이벤트 ES 전역 시퀀스),
(conveyor_speed:double precision, 컨네어 속도 (신규 드리프트)),
(gripper_temperature:double precision, 그리퍼 온도 (신규 드리프트))
]
```

### 투영 매핑 명세 (이벤트 → 컬럼)

> upsert 키: scene_key,attempt_num · 리플레이: projection_cursor 초기화 시 global_seq 기준 재시작. 전체 재투영 시 upsert 전제(멱idency)로 동일 키 덮쓰기 보장.

| 원천 이벤트 | payload 필드 | 컬럼 | 변환 |
| --- | --- | --- | --- |
| GripAttemptRecorded | objects[].class_name | object_name | extract first object class name |
| GripAttemptRecorded | grip_succeed | grip_succeed | verbatim |
| GripAttemptRecorded | grip_data.grip_2d_pose | grip_2d_pose | verbatim |
| GripAttemptRecorded | grip_data.grip_3d_pose | grip_3d_pose | verbatim |
| GripAttemptRecorded | robot_tf | robot_tf | merge rotation_3x3 and translation_3x1 into single object |
| GripAttemptRecorded | human_annotation_grasp[] | human_annotation_grasp | verbatim |
| GripAttemptRecorded | conveyor_speed | conveyor_speed | verbatim |
| GripAttemptRecorded | gripper_temperature | gripper_temperature | verbatim |

파생 컬럼(이벤트 payload 아님):
- `scene_key` ← stream_id prefix "grip-attempt:" 제거
- `attempt_num` ← stream_id filename 시도번호 자리 추출 (예: _01_)
- `occurred_at` ← stream_id filename 날짜(_YYYYMMDD) 파싱 → timestamptz
- `gripper_type` ← 상수 "finger" (현재 적재 고정값)
- `stream_id` ← 이벤트 stream_id 직접 할당
- `global_seq` ← 이벤트 global_seq(ES 전역 시퀀스) 직접 할당

### Insight 카드 등록 (Insight Read DB 동기화)

> DDL 적용 시 아래 카드 등록도 함께 실행한다 — 다음 분석부터 신규 Read Model 이 LLM 컨텍스트에 노출된다.

```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_grip_result_v2', 'read_model', '기존 read_grip_result 에 스키마 드리프트 신규 키(conveyor_speed, gripper_temperature) 미적재로 조회 실패. 신규 Read Model 로 추가 컬럼 적재 및 시간대별 시계열 조회 지원.', '(scene_key, attempt_num)')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_grip_result_v2', 'scene_key', 'varchar', '장면 식별 키', 1),
  ('read_grip_result_v2', 'attempt_num', 'smallint', '시도 번호', 2),
  ('read_grip_result_v2', 'object_name', 'varchar', '파지 대상 객 명', 3),
  ('read_grip_result_v2', 'grip_succeed', 'smallint', '파지 성공 여부', 4),
  ('read_grip_result_v2', 'gripper_type', 'varchar(16)', '그리퍼 종류', 5),
  ('read_grip_result_v2', 'occurred_at', 'timestamptz', '데이터 촬영 일자', 6),
  ('read_grip_result_v2', 'grip_2d_pose', 'jsonb', '2D 파지점', 7),
  ('read_grip_result_v2', 'grip_3d_pose', 'jsonb', '3D 파지점', 8),
  ('read_grip_result_v2', 'robot_tf', 'jsonb', '로봇 변환행렬', 9),
  ('read_grip_result_v2', 'human_annotation_grasp', 'jsonb', '휴먼 어노테이션 파 지 영역', 10),
  ('read_grip_result_v2', 'stream_id', 'varchar', 'ES 스트림 ID', 11),
  ('read_grip_result_v2', 'global_seq', 'bigint', '투영 출처 이벤트 ES 전역 시퀀스', 12),
  ('read_grip_result_v2', 'conveyor_speed', 'double precision', '컨네어 속도 (신규 드리프트)', 13),
  ('read_grip_result_v2', 'gripper_temperature', 'double precision', '그리퍼 온도 (신규 드리프트)', 14)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased (v1 → v2)

#### Added
- read_grip_result_v2 table and GripResultV2Projector to capture payload schema drift keys.
#### Fixed
- Insight Card query failure for gripper_temperature resolved by v2 Read Model extension.

### 마이그레이션 절차

- 하위호환 변경: v1 routes, services, and tables remain fully operational without modification.; New columns default to null when payload lacks drifted keys, preserving backward compatibility.
- 파괴적 변경: 없음
- 컷오버 전 테스트: Verify existing v1 projection results match historical snapshots. Run catchUpGripResultV2 on current cursor to confirm new columns populate correctly for recent payloads containing conveyor_speed and gripper_temperature.
- 롤백 창/조건: Revert DI wiring in ProjectionService/Controller, drop read_grip_result_v2 table via drizzle migration rollback, restore original schema/index.ts export.
- Insight 카드 등록: §2의 카드 등록 SQL을 DDL과 함께 적용(카탈로그 동기화)

### 사유·호환성

- 사유: Payload schema drift introduced conveyor_speed and gripper_temperature keys. Existing v1 Read Model lacks these columns, causing data loss during projection and Insight Card query failures[corr:67ac254c-114e-4fd3-bf1f-a901d726ec60]. v2 extends the table to capture drifted fields while preserving backward compatibility.
- 트리거 근거: | time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 00:22:16.117 | 40 | payload.schema.drift | 67ac254c-114e-4fd3-bf1f-a901d726ec60 | - | - | - | payload 에 스키마가 모르는 신규 키 유입 — 적재 시 유실됨(Read Model 후보) ← 트립 앵커 | newKeys={"conveyor_speed": "1.2", "gripper_temperature": "36.5"} |
| 00:22:16.167 | 40 | insight.card.miss | aa8b012a-0f26-43f3-8f6b-c1e65170d7ca | - | - | - | insight 카드 없음: 최근 적재 데이터에 gripper_temperature 필드가 들어오기 시작했다. 이 값을 시간대별로 조회하고 싶다. 현재 Read Model로 가능한가? 안 되면 어떻게 해야 하나? | - |
[corr:67ac254c-114e-4fd3-bf1f-a901d726ec60]
- v1 호환성: v1 GripResultProjector and read_grip_result table remain untouched. v2 projector runs independently; existing routes/services continue to use v1[corr:67ac254c-114e-4fd3-bf1f-a901d726ec60].

### 변경 파일

- `src/shared/database/schema/index.ts` (modifyFile) — Export new v2 schema module.
- `src/projection/projection.service.ts` (modifyFile) — Inject GripResultV2Projector, update return types, and add v2 catch-up method.
- `src/projection/projection.controller.ts` (modifyFile) — Add /grip-result-v2 route for v2 Read Model projection.

## Optional — 부속 자료(컨텍스트 축소 시 생략 가능)

### 신규 Read Model — Drizzle 스키마

```ts
import {
  bigint,
  doublePrecision,
  index,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const readGripResultV2 = pgTable(
  'read_grip_result_v2',
  {
    sceneKey: varchar('scene_key').notNull(),
    attemptNum: smallint('attempt_num').notNull(),

    objectName: varchar('object_name').notNull(),
    gripSucceed: smallint('grip_succeed').notNull(),
    gripperType: varchar('gripper_type', { length: 16 }).notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),

    grip2dPose: jsonb('grip_2d_pose'),
    grip3dPose: jsonb('grip_3d_pose'),

    robotTf: jsonb('robot_tf'),

    humanAnnotationGrasp: jsonb('human_annotation_grasp'),

    streamId: varchar('stream_id').notNull(),
    globalSeq: bigint('global_seq', { mode: 'number' }).notNull(),

    conveyorSpeed: doublePrecision('conveyor_speed'),
    gripperTemperature: doublePrecision('gripper_temperature'),
  },
  (t) => [
    primaryKey({ columns: [t.sceneKey, t.attemptNum] }),
    index('idx_grip_result_v2_time').on(t.occurredAt),
  ],
);
```

### 신규 Read Model — Projector

```ts
import { Injectable } from '@nestjs/common';
import { type InferInsertModel } from 'drizzle-orm';
import { PinoLogger } from 'nestjs-pino';
import { type ToyDataDto, toyDataSchema } from '@/insert/dto/toy-data.dto';
import { z } from 'zod';
import type { Projector } from '@/projection/projector/projector';
import type { EventStoreEventRow } from '@/projection/repository/event-store-reader.repository';
import { DrizzleTx } from '@/shared/database/drizzle.provider';
import { readGripResultV2 } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

const toyDataSchemaExtended = toyDataSchema.extend({
  conveyor_speed: z.coerce.number().optional(),
  gripper_temperature: z.coerce.number().optional(),
});

type ReadGripResultV2Insert = InferInsertModel<typeof readGripResultV2>;

@Injectable()
export class GripResultV2Projector implements Projector<ReadGripResultV2Insert> {
  readonly name: string = 'grip-result-v2-projector';

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(GripResultV2Projector.name);
  }

  map(event: EventStoreEventRow): ReadGripResultV2Insert {
    let payloadExtended;
    try {
      payloadExtended = toyDataSchemaExtended.parse(event.payload);
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
        '이벤트 매핑(검증) 실패',
      );

      throw error;
    }

    if (payloadExtended.objects.length === 0) {
      this.logger.error(
        {
          action: LogAction.MAP_FAILED,
          [LogContext.EVENT_ID]: event.eventId,
          [LogContext.STREAM_ID]: event.streamId,
        },
        'objects 비어 있음',
      );

      throw new Error(`grip-result-v2 map: empty objects in event ${event.eventId}`);
    }

    this.logger.debug(
      {
        action: LogAction.EVENT_MAPPED,
        [LogContext.PROJECTOR_NAME]: this.name,
        [LogContext.SCENE_KEY]: event.streamId.replace(/^grip-attempt:/, ''),
        [LogContext.ATTEMPT_NUM]: event.attemptNum,
        [LogContext.GLOBAL_SEQ]: event.globalSeq,
      },
      '이벤트 매핑',
    );

    return {
      sceneKey: event.streamId.replace(/^grip-attempt:/, ''),
      attemptNum: event.attemptNum,
      objectName: payloadExtended.objects[0].class_name,
      gripSucceed: payloadExtended.grip_succeed,
      gripperType: 'finger',
      occurredAt: event.occurredAt,
      grip2dPose: payloadExtended.grip_data.grip_2d_pose,
      grip3dPose: payloadExtended.grip_data.grip_3d_pose,
      robotTf: payloadExtended.robot_tf,
      humanAnnotationGrasp: payloadExtended.human_annotation_grasp,
      streamId: event.streamId,
      globalSeq: event.globalSeq,
      conveyorSpeed: payloadExtended.conveyor_speed,
      gripperTemperature: payloadExtended.gripper_temperature,
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
          grip2dPose: row.grip2dPose,
          grip3dPose: row.grip3dPose,
          robotTf: row.robotTf,
          humanAnnotationGrasp: row.humanAnnotationGrasp,
          streamId: row.streamId,
          globalSeq: row.globalSeq,
          conveyorSpeed: row.conveyorSpeed,
          gripperTemperature: row.gripperTemperature,
        },
      });
  }
}
```

### 신규 Read Model — 배선(컨트롤러/서비스/모듈)

```ts
// src/shared/database/schema/index.ts
export * from './insight/insight-entity';
export * from './insight/insight-field';
export * from './log/log-cursor';
export * from './log/log-event';
export * from './service/event';
export * from './service/projection-cursor';
export * from './service/read-grip-result';
export * from './service/read-multimodal';
export * from './service/read-grip-result-v2';

// src/insert/dto/toy-data.dto.ts (zod 스키마 확장)
import { z } from 'zod';
const toyDataSchemaExtended = toyDataSchema.extend({
  conveyor_speed: z.coerce.number().optional(),
  gripper_temperature: z.coerce.number().optional(),
});

// src/projection/projection.service.ts (catchUp 추가)
catchUpGripResultV2(): Promise<ProjectionResult> {
  return this.runner.run(this.gripResultV2);
}

// src/projection/projection.controller.ts (@Post 라우트 추가)
@Post('/grip-result-v2')
gripResultV2(): Promise<ProjectionResult> {
  this.logger.info(
    {
      action: LogAction.PROJECTION_REQUEST,
      [LogContext.ROUTE]: 'POST /projection/grip-result-v2',
    },
    'projection 요청 수신',
  );

  return this.projectionService.catchUpGripResultV2();
}

// src/projection/projection.module.ts (providers 등록)
providers: [
  GripResultProjector,
  MultiModalProjector,
  GripResultV2Projector,
  // ...기존 providers
]
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

### 버전 교체 코드 — `src/projection/projection.service.ts` (modifyFile)

```typescript
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { GripResultV2Projector } from '@/projection/projector/grip-result-v2.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { ProjectionResult } from '@/projection/projector/projector';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';
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
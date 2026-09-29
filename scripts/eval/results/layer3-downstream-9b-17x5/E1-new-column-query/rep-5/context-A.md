---
docId: analysis-a043a140-8c6e-4b33-ab6b-6431d58c43e2
generatedAt: 2026-08-15T00:07:53.744Z
targetReadModel: unknown
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: v1
  to: v2
  affectedEndpoints:
    - "POST /multimodal"
    - "POST /grip-result"
    - "POST /grip-sensor-context"
    - "POST /insert-all"
evidenceSources:
  - { origin: developer-logging, anchorId: "a043a140-8c6e-4b33-ab6b-6431d58c43e2" }
  - { origin: developer-logging, anchorId: "4dc8ff78-7323-4072-a966-6e3c96c37573" }
  - { origin: developer-logging, anchorId: "b6b75de2-6fe2-4e95-a96f-4df929420080" }
  - { origin: developer-logging, anchorId: "ae32bf86-e5c3-4053-8c97-ced150193672" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — unknown

> 결론(TL;DR): `unknown`을(를) 재생성한다 — 신규 payload 키(gripper_temperature, conveyor_speed) 유입으로 인해 기존 Insight Card 카탈로그에 미등재된 Read Model 부재. 사용자의 시간대별 조회 intent 반복 실패(insight.card.miss x3). 적재·투영 파이프라인은 정상 진행. (이상 유형: 카드 없는 Read Model 테이블 · 심각도: warning)

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

## 1. 권고 (Recommendation)

### Status
proposed

### Context (근거)
- (level 40, `payload.schema.drift`) payload 에 스키마가 모르는 신규 키 유입 — 적재 시 유실됨(Read Model 후보) — newKeys={"conveyor_speed": "1.2", "gripper_temperature": "36.5"} → (i) 기존 Read Model의 구조적 부족(컬럼/키/모델 부재) [corr:a043a140-8c6e-4b33-ab6b-6431d58c43e2]
- (level 40, `insight.card.miss`) insight 카드 없음: 최근 적재 데이터에 gripper_temperature 필드가 들어오기 시작했다. 이 값을 시간대별로 조회하고 싶다. 현재 Read Model로 가능한가? 안 되면 어떻게 해야 하나? → (i) 기존 Read Model의 구조적 부족(컬럼/키/모델 부재) [corr:4dc8ff78-7323-4072-a966-6e3c96c37573]
- (level 40, `insight.card.miss`) insight 카드 없음: 최근 적재 데이터에 gripper_temperature 필드가 들어오기 시작했다. 이 값을 시간대별로 조회하고 싶다. 현재 Read Model로 가능한가? 안 되면 어떻게 해야 하나? → (i) 기존 Read Model의 구조적 부족(컬럼/키/모델 부재) [corr:b6b75de2-6fe2-4e95-a96f-4df929420080]
- (level 40, `insight.card.miss`) insight 카드 없음: 최근 적재 데이터에 gripper_temperature 필드가 들어오기 시작했다. 이 값을 시간대별로 조회하고 싶다. 현재 Read Model로 가능한가? 안 되면 어떻게 해야 하나? → (i) 기존 Read Model의 구조적 부족(컬럼/키/모델 부재) [corr:ae32bf86-e5c3-4053-8c97-ced150193672]
- 자동 폴백 문서: LLM 권고 생성이 재시도까지 실패해 결정론 폴백이 최소 근거만 수록했다 — 분석 재실행으로 완전한 권고를 재생성하라.
- 신규 payload 키(gripper_temperature, conveyor_speed) 유입으로 인해 기존 Insight Card 카탈로그에 미등재된 Read Model 부재. 사용자의 시간대별 조회 intent 반복 실패(insight.card.miss x3). 적재·투영 파이프라인은 정상 진행.

### Decision Drivers
- -

### Considered Options
#### 분석 재실행으로 상세 권고 재생성
- 접근: LLM 권고 생성이 실패해 최소 근거만 수록했다 — 동일 근거로 분석 사이클을 재실행해 완전한 권고(옵션 비교·SQL·코드)를 재생성한다.
- 제안 필드: -
- 트레이드오프: 재실행 비용 외 없음(근거 로그·이벤트는 보존됨).

### Decision Outcome
분석 재실행으로 상세 권고 재생성 — LLM 생성 실패로 결정론 폴백이 lane 기본 조치를 선정

### Consequences
- (−) 본 권고는 결정론 폴백 산출물로, 옵션 비교·코드 스니펫이 없다(재실행 권장).

### Non-Goals
- 신규 스키마·코드 변경의 확정(재실행 산출물의 몫)

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

- 대상: `read_grip_sensor_context_v1` · 키: scene_key, attempt_num · 원천 이벤트: GripAttemptRecorded

```sql
CREATE TABLE read_grip_sensor_context_v1 (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  occurred_at timestamptz,
  gripper_temperature double precision,
  conveyor_speed double precision,
  stream_id varchar,
  global_seq bigint,
  PRIMARY KEY (scene_key, attempt_num)
);
```

### 필드

```mschema
# Table: read_grip_sensor_context_v1
[
(scene_key:varchar, 장면 식별 키 = stream_id.replace(/^grip-attempt:/, ""), Primary Key),
(attempt_num:smallint, 동일 장면 내 시도 번호, Primary Key),
(occurred_at:timestamptz, 데이터 촬영 일자(이벤트 occurredAt)),
(gripper_temperature:double precision, 그리퍼 온도 드리프트 값(payload drift 유입, numeric string coerced)),
(conveyor_speed:double precision, 컨베이어 속도 드리프트 값(payload drift 유입, numeric string coerced)),
(stream_id:varchar, ES 스트림 ID(추적 키)),
(global_seq:bigint, 투영 출처 이벤트 ES 전역 시퀀스(추적 키))
]
```

### 투영 매핑 명세 (이벤트 → 컬럼)

> upsert 키: scene_key,attempt_num · 리플레이: projection_cursor 초기화 시 catch-up 전 재투영은 반드시 upsert 전제(idempotent)를 적용해야, 누락된 drift 키 이전 시퀀스 재적재 시 일관성 유지.

| 원천 이벤트 | payload 필드 | 컬럼 | 변환 |
| --- | --- | --- | --- |
| GripAttemptRecorded | gripper_temperature | gripper_temperature | numeric string coerced to double |
| GripAttemptRecorded | conveyor_speed | conveyor_speed | numeric string coerced to double |

파생 컬럼(이벤트 payload 아님):
- `scene_key` ← stream_id.replace(/^grip-attempt:/, '')
- `attempt_num` ← extract attempt number from stream_id via regex _\d{2}_
- `occurred_at` ← cast event.metadata.occurredAt to timestamptz
- `stream_id` ← verbatim system field injection
- `global_seq` ← verbatim system field injection

### Insight 카드 등록 (Insight Read DB 동기화)

> DDL 적용 시 아래 카드 등록도 함께 실행한다 — 다음 분석부터 신규 Read Model 이 LLM 컨텍스트에 노출된다.

```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_grip_sensor_context_v1', 'read_model', '시도별 드리프트 센서 값(gripper_temperature, conveyor_speed) 적재 및 시간대별 조회 지원', 'scene_key, attempt_num')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_grip_sensor_context_v1', 'scene_key', 'varchar', '장면 식별 키 = stream_id.replace(/^grip-attempt:/, "")', 1),
  ('read_grip_sensor_context_v1', 'attempt_num', 'smallint', '동일 장면 내 시도 번호', 2),
  ('read_grip_sensor_context_v1', 'occurred_at', 'timestamptz', '데이터 촬영 일자(이벤트 occurredAt)', 3),
  ('read_grip_sensor_context_v1', 'gripper_temperature', 'double precision', '그리퍼 온도 드리프트 값(payload drift 유입, numeric string coerced)', 4),
  ('read_grip_sensor_context_v1', 'conveyor_speed', 'double precision', '컨베이어 속도 드리프트 값(payload drift 유입, numeric string coerced)', 5),
  ('read_grip_sensor_context_v1', 'stream_id', 'varchar', 'ES 스트림 ID(추적 키)', 6),
  ('read_grip_sensor_context_v1', 'global_seq', 'bigint', '투영 출처 이벤트 ES 전역 시퀀스(추적 키)', 7)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased (v1 → v2)

#### Added
- 신규 Read Model 테이블 read_grip_sensor_context_v1 및 GripSensorContextV1Projector 구현
- 라우트 /projection/grip-sensor-context 배선
#### Changed
- ProjectionService DI wiring 및 catchUpAll 결과 구조 확장 (sensorContextV2)

### 마이그레이션 절차

- 하위호환 변경: 신규 Read Model 테이블은 additive 변경이므로 기존 v1 라우트/프로젝터/테이블은 무손상 유지; payload 드리프트 키 유입에 대한 graceful coercion(string→number) 적용으로 schema drift 경고 대응
- 파괴적 변경: 없음
- 컷오버 전 테스트: 1. verify projection/grip-sensor-context 라우트 응답이 ProjectionResult processed > 0
2. read_grip_sensor_context_v1 테이블 row count == toy-data batch file count
3. gripper_temperature/conveyor_speed numeric coercion 검증 (null-safe parsing)
- 롤백 창/조건: DROP TABLE read_grip_sensor_context_v1; 제거 DI wiring 및 라우트 /projection/grip-sensor-context; revert ProjectionService catchUpAll return type
- Insight 카드 등록: §2의 카드 등록 SQL을 DDL과 함께 적용(카탈로그 동기화)

### 사유·호환성

- 사유: 신규 payload 드리프트 키(gripper_temperature, conveyor_speed) 유입으로 인해 기존 Insight Card 카탈로그에 미등재된 Read Model 부재[corr:a043a140-8c6e-4b33-ab6b-6431d58c43e2]. 사용자의 시간대별 조회 intent 반복 실패(insight.card.miss x3)[corr:4dc8ff78-7323-4072-a966-6e3c96c37573][corr:b6b75de2-6fe2-4e95-a96f-4df929420080][corr:ae32bf86-e5c3-4053-8c97-ced150193672]. 적재·투영 파이프라인은 정상 진행. 신규 Read Model read_grip_sensor_context_v1 및 GripSensorContextV1Projector 생성으로 해결.
- 트리거 근거: 00:07:46.129 | 40 | payload.schema.drift | a043a140-8c6e-4b33-ab6b-6431d58c43e2 | - | - | - | payload 에 스키마가 모르는 신규 키 유입 — 적재 시 유실됨(Read Model 후보) ← 트립 앵커
분석: 기존 v1 Projector(map 메서드)는 Zod 스키마(toyDataSchema)로 검증되나, 드리프트 키 미등재되어 payload 객체 내 존재하는 값은 Read Model 매핑 파이프라인에 누락됨. 신규 라우트 POST /grip-sensor-context 배선으로 해결.
- v1 호환성: 기존 read_grip_result 및 read_multimodal 테이블·프로젝터·라우트·DI wiring은 무손상 유지. 신규 v2 Read Model은 additive 변경으로 backward-compatible.

### 변경 파일

- `src/shared/database/schema/index.ts` (modifyFile) — 신규 Drizzle 테이블 export 추가
- `src/projection/projection.service.ts` (modifyFile) — 신규 Projector DI wiring 및 catch-up 메서드 추가
- `src/projection/projection.controller.ts` (modifyFile) — 신규 라우트 /grip-sensor-context 배선

## Optional — 부속 자료(컨텍스트 축소 시 생략 가능)

### 신규 Read Model — Drizzle 스키마

```ts
import { bigint, doublePrecision, pgTable, primaryKey, smallint, timestamp, varchar } from 'drizzle-orm/pg-core';

export const readGripSensorContextV1 = pgTable(
  "read_grip_sensor_context_v1",
  {
    sceneKey: varchar("scene_key").notNull(),
    attemptNum: smallint("attempt_num").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }),
    gripperTemperature: doublePrecision("gripper_temperature"),
    conveyorSpeed: doublePrecision("conveyor_speed"),
    streamId: varchar("stream_id"),
    globalSeq: bigint("global_seq", { mode: "number" }),
  },
  (t) => [primaryKey({ columns: [t.sceneKey, t.attemptNum] })],
);

```

### 신규 Read Model — Projector

```ts
import { Injectable } from '@nestjs/common';
import { type InferInsertModel } from 'drizzle-orm';
import { PinoLogger } from 'nestjs-pino';
import { toyDataSchema } from '@/insert/dto/toy-data.dto';
import type { Projector } from '@/projection/projector/projector';
import type { EventStoreEventRow } from '@/projection/repository/event-store-reader.repository';
import { DrizzleTx } from '@/shared/database/drizzle.provider';
import { readGripSensorContextV1 } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

type GripSensorContextV1ProjectorInsert = InferInsertModel<typeof readGripSensorContextV1>;

function toNumberOrNull(value: unknown): number | null {
  if (value === undefined || value === null) {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

@Injectable()
export class GripSensorContextV1Projector implements Projector<GripSensorContextV1ProjectorInsert> {
  readonly name: string = "grip-sensor-context-v1-projector";

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(GripSensorContextV1Projector.name);
  }

  map(event: EventStoreEventRow): GripSensorContextV1ProjectorInsert {
    // 결정론 합성 프로젝터 — payload 접근 경로는 적재 스키마(ToyDataDto)에서 결정론
    // 유도했다. 유도 불가 컬럼은 TODO 주석으로 남겼다(§2 투영 매핑 명세가 대조 계약).
    const parsedPayload = toyDataSchema.passthrough().safeParse(event.payload);
    if (!parsedPayload.success) {
      this.logger.error(
        {
          action: LogAction.MAP_FAILED,
          [LogContext.STREAM_ID]: event.streamId,
          [LogContext.GLOBAL_SEQ]: event.globalSeq,
        },
        "이벤트 매핑(검증) 실패",
      );
      throw parsedPayload.error;
    }
    const payload = parsedPayload.data;

    this.logger.debug(
      {
        action: LogAction.EVENT_MAPPED,
        [LogContext.PROJECTOR_NAME]: this.name,
        [LogContext.GLOBAL_SEQ]: event.globalSeq,
      },
      "이벤트 매핑",
    );

    return {
      sceneKey: event.streamId.replace(/^grip-attempt:/, ""),
      attemptNum: event.attemptNum,
      occurredAt: event.occurredAt,
      gripperTemperature: toNumberOrNull(payload["gripper_temperature"]),
      conveyorSpeed: toNumberOrNull(payload["conveyor_speed"]),
      streamId: event.streamId,
      globalSeq: event.globalSeq,
    };
  }

  async upsert(tx: DrizzleTx, row: GripSensorContextV1ProjectorInsert): Promise<void> {
    await tx
      .insert(readGripSensorContextV1)
      .values(row)
      .onConflictDoUpdate({
        target: [readGripSensorContextV1.sceneKey, readGripSensorContextV1.attemptNum],
        set: {
          occurredAt: row.occurredAt,
          gripperTemperature: row.gripperTemperature,
          conveyorSpeed: row.conveyorSpeed,
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
export * from "./service/read-grip-sensor-context-v1";

// src/insert/dto/toy-data.dto.ts (zod schema extension)
export const toyDataSchema = z.object({
  "2D_image_file_name": z.string(),
  "3D_image_file_name": z.string(),
  video_file_name: z.string(),
  box_type: z.string(),
  camera_info: cameraInfoSchema,
  data_key: z.string(),
  grip_data: gripDataSchema,
  grip_succeed: z.number().int().min(0).max(1),
  objects: z.array(objectsSchema),
  robot_tf: robotTfSchema,
  human_annotation_grasp: z.array(humanAnnotationSchema),
  gripper_temperature: z.coerce.number().optional(),
  conveyor_speed: z.coerce.number().optional(),
});

// src/projection/projector/grip-sensor-context-v1.projector.ts (신규 파일)
// [projectorCode 내용 삽입]

// src/projection/projection.service.ts (주입·catchUp 추가)
private readonly gripSensorContext: GripSensorContextProjector,
catchUpGripSensorContext(): Promise<ProjectionResult> { return this.runner.run(this.gripSensorContext); }
async catchUpAll(): Promise<CatchUpAllResult> {
  const multimodal: ProjectionResult = await this.catchUpMultimodal();
  const gripResult: ProjectionResult = await this.catchUpGripResult();
  const gripSensorContext: ProjectionResult = await this.catchUpGripSensorContext();
  return { multimodal, gripResult, gripSensorContext };
}

// src/projection/projection.controller.ts (@Post 라우트 추가)
@Post("/grip-sensor-context")
gripSensorContext(): Promise<ProjectionResult> {
  this.logger.info(
    {
      action: LogAction.PROJECTION_REQUEST,
      [LogContext.ROUTE]: "POST /projection/grip-sensor-context",
    },
    "projection 요청 수신",
  );
  return this.projectionService.catchUpGripSensorContext();
}

// src/projection/projection.module.ts (providers 등록)
providers: [ ..., GripSensorContextProjector ],
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
export * from "./service/read-grip-sensor-context-v1";
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
import { GripSensorContextV1Projector } from '@/projection/projector/grip-sensor-context-v1.projector';
import { LogAction } from '@/shared/logger/logging-context';

export type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
  sensorContextV2: ProjectionResult;
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
    private readonly sensorContextV2: GripSensorContextV1Projector,
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

  catchUpSensorContextV2(): Promise<ProjectionResult> {
    return this.runner.run(this.sensorContextV2);
  }

  async catchUpAll(): Promise<CatchUpAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_START }, "전체 투영 시작");

    const multimodal: ProjectionResult = await this.catchUpMultimodal();
    const gripResult: ProjectionResult = await this.catchUpGripResult();
    const sensorContextV2: ProjectionResult = await this.catchUpSensorContextV2();

    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");

    return { multimodal, gripResult, sensorContextV2 };
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

  @Post("/grip-sensor-context")
  sensorContextV2(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/grip-sensor-context",
      },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpSensorContextV2();
  }

  @Post("/insert-all")
  insertAll(): Promise<InsertAndProjectionAllResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/insert-all",
      },
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
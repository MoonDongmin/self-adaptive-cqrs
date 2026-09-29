---
docId: analysis-6c4ce0db-5330-409d-ab4b-ea21dba948b3
generatedAt: 2026-08-12T06:02:58.573Z
targetReadModel: read_grip_environmental_data
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: v1
  to: v2
  affectedEndpoints:
    - "POST /multimodal"
    - "POST /grip-result"
    - "POST /grip-environmental-data"
    - "POST /insert-all"
evidenceSources:
  - { origin: developer-logging, anchorId: "6c4ce0db-5330-409d-ab4b-ea21dba948b3" }
  - { origin: developer-logging, anchorId: "b5e7219e-e6c5-4f44-a494-de5c69f6aadf" }
  - { origin: developer-logging, anchorId: "7eaf37f0-2765-4c93-bdbb-5ff902106bb3" }
  - { origin: developer-logging, anchorId: "d035021e-546e-4e3c-83c6-57a435f0bff6" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_grip_environmental_data

> 결론(TL;DR): `read_grip_environmental_data`을(를) 재생성한다 — 신 payload 키(conveyor_speed, gripper_temperature) 유입으로 기존 Zod/Read Model 미 eş매치로 적재 시 필드 값 유실 발생. 투영은 정상 진행하나 사용자의 시간대별 조회 요청은 Read Model 부재로 실패. (이상 유형: 스키마 드리프트(신규 키 유입) · 심각도: warning)

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

## 1. 권고 (Recommendation)

### Status
proposed

### Context (근거)
- (level 40, `payload.schema.drift`) payload 에 스키마가 모르는 신규 키 유입 — 적재 시 유실됨(Read Model 후보) ← 트립 앵커 → Zod 미 eş매치로 적재 단계에서 conveyor_speed/gripper_temperature 값이 유실됨. [corr:6c4ce0db-5330-409d-ab4b-ea21dba948b3]
- (level 40, `insight.card.miss`) insight 카드 없음: 최근 적재 데이터에 gripper_temperature 필드가 들어오기 시작했다. 이 값을 시간대별로 조회하고 싶다. 현재 Read Model로 가능한가? 안 되면 어떻게 해야 하나? → 현존 Read Model 부재로 시간대별 조회 요청 실패. [corr:b5e7219e-e6c5-4f44-a494-de5c69f6aadf]
- (level 40, `insight.card.miss`) insight 카드 없음: 최근 적재 데이터에 gripper_temperature 필드가 들어오기 시작했다. 이 값을 시간대별로 조회하고 싶다. 현재 Read Model로 가능한가? 안 되면 어떻게 해야 하나? → 반복 실패 lane 적용으로 신규 모델 생성 검토 필요. [corr:7eaf37f0-2765-4c93-bdbb-5ff902106bb3]
- (level 40, `insight.card.miss`) insight 카드 없음: 최근 적재 데이터에 gripper_temperature 필드가 들어오기 시작했다. 이 값을 시간대별로 조회하고 싶다. 현재 Read Model로 가능한가? 안 되면 어떻게 해야 하나? → 세 번의 미스 로그로 시스템 부재 확증. [corr:d035021e-546e-4e3c-83c6-57a435f0bff6]
- read_grip_result 스키마에 conveyor_speed, gripper_temperature 컬럼 미 정의 [corr:b5e7219e-e6c5-4f44-a494-de5c69f6aadf]
- toyDataSchema in src/insert/dto/toy-data.dto.ts 에 두 키 미 등록, Zod 검증 시 silent drop 발생 [corr:6c4ce0db-5330-409d-ab4b-ea21dba948b3]
- GripResultProjector.map() 과 MultiModalProjector.map() 만 기존 필드 매핑 수행, 신규 컬럼 주입 로직 부재 [corr:b5e7219e-e6c5-4f44-a494-de5c69f6aadf]
- payload.schema.drift detail 셀 newKeys={"conveyor_speed": "1.2", "gripper_temperature": "36.5"} 확인 [corr:6c4ce0db-5330-409d-ab4b-ea21dba948b3]

### Decision Drivers
- Schema drift 감지(payload.schema.drift) mandates explicit handling to prevent silent data loss.
- Repeated query failures(insight.card.miss) require immediate Read Model coverage for time-series analysis.
- Defect value sanitization principle prohibits coercing/dropping; requires isolation or new model.
- Separation of concerns: environmental sensors are distinct from grip geometry/media, favoring a dedicated table.

### Considered Options
#### newReadModel
- 접근: src/shared/database/schema/service/read-grip-environmental-data.ts 신규 Drizzle 테이블 생성, toyDataSchema 확장, EnvironmentalProjector 구현.
- 제안 필드: read_grip_environmental_data.scene_key, attempt_num, occurred_at, conveyor_speed, gripper_temperature, stream_id, global_seq
- 트레이드오프: DB migration 추가 비용 발생이나 기존 Read Model의 독립성 유지 및 데이터 무해화 원칙 준수.
```typescript
export const toyDataSchema = z.object({ ... "2D_image_file_name": z.string(), conveyor_speed: z.number().nonnegative(), gripper_temperature: z.number().nonnegative() }); return { sceneKey: event.streamId.replace(/^grip-attempt:/, ""), attemptNum: event.attemptNum, occurredAt: event.occurredAt, conveyorSpeed: payload.conveyor_speed, gripperTemperature: payload.gripper_temperature, streamId: event.streamId, globalSeq: event.globalSeq };
```

#### existingModelExtension
- 접근: read_grip_result 추가 컬럼으로 conveyor_speed, gripper_temperature 확장.
- 제안 필드: read_grip_result.conveyorSpeed, gripperTemperature
- 트레이드오프: Read Model 단일 책임 원칙 위반, 센서 드리프트가 기립 결과 테이블에 영구 오염, 호환성 저해. (기각 대안: Driver 3/4 실패)
```typescript
// 기각 대안: 기존 readGripResult Drizzle 확장 및 GripResultProjector.map() 수정 시 coupling 증가.
```

### Decision Outcome
newReadModel

### Consequences
- (+) Enables time-based sensor queries.
- (+) Maintains data fidelity.
- (+) Decouples sensor drift from core grip logic.
- (−) Requires new DB migration & projector wiring.
- (−) Increases projection cycle complexity slightly.
- (−) Initial catch-up needs validation.

### Non-Goals
- Modifying existing read_grip_result or read_multimodal tables to absorb sensor data.
- Coercing Zod failures into defaults.
- Altering API contract signatures for downstream consumers.

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

- 대상: `read_grip_environmental_data` · 키: scene_key, attempt_num · 원천 이벤트: GripAttemptRecorded

```sql
CREATE TABLE read_grip_environmental_data (
  scene_key VARCHAR NOT NULL,
  attempt_num SMALLINT NOT NULL,
  occurred_at TIMESTAMPTZ,
  conveyor_speed DOUBLE PRECISION,
  gripper_temperature DOUBLE PRECISION,
  stream_id VARCHAR,
  global_seq BIGINT,
  PRIMARY KEY (scene_key, attempt_num)
);
```

### 필드

```mschema
# Table: read_grip_environmental_data
[
(scene_key:VARCHAR, 장면 식별 키, Primary Key),
(attempt_num:SMALLINT, 동장 내 파지 시도 번호, Primary Key),
(occurred_at:TIMESTAMPTZ, 데이터 촬영 일자/시간),
(conveyor_speed:DOUBLE PRECISION, 컨베이 벨트 속도 (드프트)),
(gripper_temperature:DOUBLE PRECISION, 그리퍼 온도 (드프트)),
(stream_id:VARCHAR, ES 스트림 ID),
(global_seq:BIGINT, 투영 출처 이벤트의 ES 전역 시퀀스)
]
```

### 투영 매핑 명세 (이벤트 → 컬럼)

> upsert 키: scene_key,attempt_num · 리플레이: projection_cursor 초기화 시 반드시 0 시작. catch-up 전 재투영 시 upsert는 scene_key+attempt_num 기준, 동일 키 중복 발생 시 이전 값 overwrite(멱idency) 전제 확인.

| 원천 이벤트 | payload 필드 | 컬럼 | 변환 |
| --- | --- | --- | --- |
| GripAttemptRecorded | conveyor_speed | conveyor_speed | verbatim |
| GripAttemptRecorded | gripper_temperature | gripper_temperature | verbatim |
| GripAttemptRecorded | stream_id | stream_id | verbatim |

파생 컬럼(이벤트 payload 아님):
- `scene_key` ← stream_id에서 'grip-attempt:' prefix 제거
- `attempt_num` ← stream_id/filename 패턴 추출(scene_YYYYMMDD_XX_date) 시도 번호 파싱
- `occurred_at` ← filename date portion 또는 event timestamp 매핑
- `global_seq` ← event metadata global sequence number

### Insight 카드 등록 (Insight Read DB 동기화)

> DDL 적용 시 아래 카드 등록도 함께 실행한다 — 다음 분석부터 신규 Read Model 이 LLM 컨텍스트에 노출된다.

```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_grip_environmental_data', 'read_model', 'Capture payload drift keys (conveyor_speed, gripper_temperature) per attempt to support time-of-day/time-series queries alongside existing scene/attempt context.', 'scene_key, attempt_num')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_grip_environmental_data', 'scene_key', 'VARCHAR', '장면 식별 키', 1),
  ('read_grip_environmental_data', 'attempt_num', 'SMALLINT', '동장 내 파지 시도 번호', 2),
  ('read_grip_environmental_data', 'occurred_at', 'TIMESTAMPTZ', '데이터 촬영 일자/시간', 3),
  ('read_grip_environmental_data', 'conveyor_speed', 'DOUBLE PRECISION', '컨베이 벨트 속도 (드프트)', 4),
  ('read_grip_environmental_data', 'gripper_temperature', 'DOUBLE PRECISION', '그리퍼 온도 (드프트)', 5),
  ('read_grip_environmental_data', 'stream_id', 'VARCHAR', 'ES 스트림 ID', 6),
  ('read_grip_environmental_data', 'global_seq', 'BIGINT', '투영 출처 이벤트의 ES 전역 시퀀스', 7)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased (v1 → v2)

#### Added
- 신 Read Model 테이블 read_grip_environmental_data 및 GripEnvironmentalDataProjector 배선
- /grip-environmental-data 라우트 추가

### 마이그레이션 절차

- 하위호환 변경: -
- 파괴적 변경: 없음
- 컷오버 전 테스트: 1. payload.schema.drift 이상 로그가 신규 키 파싱 성공으로 대체되는지 확인. 2. /grip-environmental-data 라우트 실행 시 read_grip_environmental_data 테이블에 scene_key, attempt_num, conveyor_speed, gripper_temperature 값이 정상 매핑된는지 검증.
- 롤백 창/조건: DROP TABLE read_grip_environmental_data; ProjectionService DI 제거 및 catchUpAll 반환형 revert; Controller /grip-environmental-data 엔드포인트 삭제; schema/index.ts export revert.
- Insight 카드 등록: §2의 카드 등록 SQL을 DDL과 함께 적용(카탈로그 동기화)

### 사유·호환성

- 사유: 신 payload 키(conveyor_speed, gripper_temperature) 유입으로 기존 Zod/Read Model 미 eş매치로 적재 시 필드 값 유실 발생[corr:6c4ce0db-5330-409d-ab4b-ea21dba948b3]. 투영은 정상 진행하나 사용자의 시간대별 조회 요청은 Read Model 부재로 실패[corr:b5e7219e-e6c5-4f44-a494-de5c69f6aadf].
- 트리거 근거: | time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 06:02:55.945 | 40 | payload.schema.drift | 6c4ce0db-5330-409d-ab4b-ea21dba948b3 | - | - | - | payload 에 스키마가 모르는 신규 키 유입 — 적재 시 유실됨(Read Model 후보) ← 트립 앵커 | newKeys={"conveyor_speed": "1.2", "gripper_temperature": "36.5"} |
| 06:02:55.999 | 40 | insight.card.miss | b5e7219e-e6c5-4f44-a494-de5c69f6aadf | - | - | - | insight 카드 없음: 최근 적재 데이터에 gripper_temperature 필드가 들어오기 시작했다. 이 값을 시간대별로 조회하고 싶다. 현재 Read Model로 가능한가? 안 되면 어떻게 해야 하나? | - |
- v1 호환성: 기존 read_grip_result, read_multimodal 테이블·프로젝터·라우트는 무손상 유지. 신규 GripEnvironmentalDataProjector 및 /grip-environmental-data 라우트는 추가만.

### 변경 파일

- `src/shared/database/schema/index.ts` (modifyFile) — 신 Read Model 스키마 export 추가.
- `src/projection/projection.service.ts` (modifyFile) — 신 Projector DI 배선 및 catchUpAll 반환형 확장.
- `src/projection/projection.controller.ts` (modifyFile) — /grip-environmental-data 라우트 추가.

## Optional — 부속 자료(컨텍스트 축소 시 생략 가능)

### 신규 Read Model — Drizzle 스키마

```ts
import { bigint, doublePrecision, pgTable, primaryKey, smallint, timestamp, varchar } from 'drizzle-orm/pg-core';

export const readGripEnvironmentalData = pgTable(
  "read_grip_environmental_data",
  {
    sceneKey: varchar("scene_key").notNull(),
    attemptNum: smallint("attempt_num").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }),
    conveyorSpeed: doublePrecision("conveyor_speed"),
    gripperTemperature: doublePrecision("gripper_temperature"),
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
import { readGripEnvironmentalData } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

type GripEnvironmentalDataProjectorInsert = InferInsertModel<typeof readGripEnvironmentalData>;

function toNumberOrNull(value: unknown): number | null {
  if (value === undefined || value === null) {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

@Injectable()
export class GripEnvironmentalDataProjector implements Projector<GripEnvironmentalDataProjectorInsert> {
  readonly name: string = "grip-environmental-data-projector";

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(GripEnvironmentalDataProjector.name);
  }

  map(event: EventStoreEventRow): GripEnvironmentalDataProjectorInsert {
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
      conveyorSpeed: toNumberOrNull(payload["conveyor_speed"]),
      gripperTemperature: toNumberOrNull(payload["gripper_temperature"]),
      streamId: event.streamId,
      globalSeq: event.globalSeq,
    };
  }

  async upsert(tx: DrizzleTx, row: GripEnvironmentalDataProjectorInsert): Promise<void> {
    await tx
      .insert(readGripEnvironmentalData)
      .values(row)
      .onConflictDoUpdate({
        target: [readGripEnvironmentalData.sceneKey, readGripEnvironmentalData.attemptNum],
        set: {
          occurredAt: row.occurredAt,
          conveyorSpeed: row.conveyorSpeed,
          gripperTemperature: row.gripperTemperature,
          streamId: row.streamId,
          globalSeq: row.globalSeq,
        },
      });
  }
}

```

### 신규 Read Model — 배선(컨트롤러/서비스/모듈)

```ts
// src/insert/dto/toy-data.dto.ts (전체 파일 내용으로 컴파일 에러 해결)
import { z } from 'zod';

const cameraIntrinsicSchema = z.object({
  codx: z.number().nullable(),
  cody: z.number(),
  cx: z.number(),
  cy: z.number(),
  fx: z.number(),
  fy: z.number(),
  k1: z.number(),
  k2: z.number(),
  k3: z.number(),
  k4: z.number(),
  k5: z.number(),
  k6: z.number(),
  p1: z.number(),
  p2: z.number(),
});

const cameraInfoSchema = z.object({
  camera_intrinsic_param: cameraIntrinsicSchema,
  camera_name: z.string(),
  camera_type: z.string(),
});

const grip2dPoseSchema = z.object({
  xl: z.number(),
  xr: z.number(),
  yl: z.number(),
  yr: z.number(),
});

const grip3dPoseSchema = z.object({
  x1: z.number(),
  x2: z.number(),
  x3: z.number(),
  x4: z.number(),
  x5: z.number(),
  x6: z.number(),
  x7: z.number(),
  x8: z.number(),
  y1: z.number(),
  y2: z.number(),
  y3: z.number(),
  y4: z.number(),
  y5: z.number(),
  y6: z.number(),
  y7: z.number(),
  y8: z.number(),
  z1: z.number(),
  z2: z.number(),
  z3: z.number(),
  z4: z.number(),
  z5: z.number(),
  z6: z.number(),
  z7: z.number(),
  z8: z.number(),
});

const gripDataSchema = z.object({
  grip_2d_pose: grip2dPoseSchema,
  grip_3d_pose: grip3dPoseSchema,
});

const objectsSchema = z.object({
  annotation_type: z.string(),
  class_name: z.string(),
  package_type: z.string(),
  object_properties: z.array(z.string()),
  id: z.number().int(),
  segmentation_points: z.array(z.array(z.array(z.number()))),
});

const robotTfSchema = z.object({
  rotation_3x3: z.array(z.number()).length(9),
  translation_3x1: z.array(z.number()).length(3),
});

const humanAnnotationSchema = z.object({
  annotation_type: z.string(),
  id: z.number().int(),
  annotation_points: z.array(z.number()),
  num_keypoints: z.number().int(),
});

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
  conveyor_speed: z.coerce.number().optional(),
  gripper_temperature: z.coerce.number().optional(),
});

export type ToyDataDto = z.infer<typeof toyDataSchema>;

// src/shared/database/schema/index.ts 추가:
export * from "./service/read-grip-environmental-data";

// src/projection/projection.service.ts 주입·catchUp 추가:
import { GripEnvironmentalDataProjector } from '@/projection/projector/grip-environmental-data.projector';
// ... (constructor add private readonly gripEnv: GripEnvironmentalDataProjector)
catchUpGripEnvironmentalData(): Promise<ProjectionResult> {
  return this.runner.run(this.gripEnv);
}

// src/projection/projection.controller.ts @Post 라우트 추가:
@Post("/grip-environmental-data")
gripEnvironmentalData(): Promise<ProjectionResult> {
  this.logger.info(
    {
      action: LogAction.PROJECTION_REQUEST,
      [LogContext.ROUTE]: "POST /projection/grip-environmental-data",
    },
    "projection 요청 수신",
  );

  return this.projectionService.catchUpGripEnvironmentalData();
}

// src/projection/projection.module.ts providers 등록 추가:
GripEnvironmentalDataProjector,
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
export * from "./service/read-grip-environmental-data";
```

### 버전 교체 코드 — `src/projection/projection.service.ts` (modifyFile)

```typescript
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { GripEnvironmentalDataProjector } from '@/projection/projector/grip-environmental-data.projector';
import { ProjectionResult } from '@/projection/projector/projector';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';
import { LogAction } from '@/shared/logger/logging-context';

export type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
  environmentalData: ProjectionResult;
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
    private readonly environmentalData: GripEnvironmentalDataProjector,
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

  catchUpEnvironmentalData(): Promise<ProjectionResult> {
    return this.runner.run(this.environmentalData);
  }

  async catchUpAll(): Promise<CatchUpAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_START }, "전체 투영 시작");

    const multimodal: ProjectionResult = await this.catchUpMultimodal();
    const gripResult: ProjectionResult = await this.catchUpGripResult();
    const environmentalData: ProjectionResult = await this.catchUpEnvironmentalData();

    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");

    return { multimodal, gripResult, environmentalData };
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

  @Post("/grip-environmental-data")
  environmentalData(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/grip-environmental-data",
      },
      "projection 요청 수신(v2)",
    );

    return this.projectionService.catchUpEnvironmentalData();
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
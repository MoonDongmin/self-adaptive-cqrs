---
docId: analysis-4645a1d4-9c60-4b8c-a8e3-038f3011fd37
generatedAt: 2026-08-12T23:15:28.510Z
targetReadModel: read_grip_sensor_v1
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: v1
  to: v2
  affectedEndpoints:
    - "POST /multimodal"
    - "POST /grip-result"
    - "POST /grip-sensor"
    - "POST /insert-all"
evidenceSources:
  - { origin: developer-logging, anchorId: "4645a1d4-9c60-4b8c-a8e3-038f3011fd37" }
  - { origin: developer-logging, anchorId: "629b7501-2ea8-42fa-b557-1db8c86a3329" }
  - { origin: developer-logging, anchorId: "fead2d52-4909-45f7-bc37-488cdc51d772" }
  - { origin: developer-logging, anchorId: "991e1043-48d8-4091-a5d5-6741212fbec9" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_grip_sensor_v1

> 결론(TL;DR): `read_grip_sensor_v1`을(를) 재생성한다 — 이벤트 적재(batch) 중 `payload.schema.drift` 액션으로 신규 키(`conveyor_speed`, `gripper_temperature`) 유입이 감지되었다. 이후 사용자의 `gripper_temperature` 조회 요청은 `insight.card.miss`로 실패하여, 현재 Read Model/Insight Card 카탈로그에서는 해당 신규 필드를 지원하지. (이상 유형: 스키마 드리프트(신규 키 유입) · 심각도: warning)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `-`(level 30) 2회, `insert.request`(level 30) 1회, `payload.schema.drift`(level 40) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 54회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 23:15:25.809 | 30 | insert.request | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | - | - | - | Insert Event Store 요청 수신 | - |
| 23:15:25.809 | 30 | insert.batch.start | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | - | - | - | Toy-Data 적재 시작 | - |
| 23:15:25.815 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00001 | 1 | 1 | 이벤트 append | - |
| 23:15:25.815 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00001 | 1 | 1 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00001_01_20230923.json |
| 23:15:25.816 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00002 | 3 | 2 | 이벤트 append | - |
| 23:15:25.816 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00002 | 3 | 2 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00002_03_20230923.json |
| 23:15:25.817 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00005 | 3 | 3 | 이벤트 append | - |
| 23:15:25.817 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00005 | 3 | 3 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00005_03_20230923.json |
| 23:15:25.818 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 1 | 4 | 이벤트 append | - |
| 23:15:25.818 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 1 | 4 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00009_01_20230923.json |
| 23:15:25.819 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 3 | 5 | 이벤트 append | - |
| 23:15:25.819 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 3 | 5 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00009_03_20230923.json |
| 23:15:25.820 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 2 | 6 | 이벤트 append | - |
| 23:15:25.820 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 2 | 6 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00011_02_20230923.json |
| 23:15:25.821 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 3 | 7 | 이벤트 append | - |
| 23:15:25.821 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 3 | 7 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00011_03_20230923.json |
| 23:15:25.822 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00015 | 1 | 8 | 이벤트 append | - |
| 23:15:25.822 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00015 | 1 | 8 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00015_01_20230923.json |
| 23:15:25.823 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018 | 1 | 9 | 이벤트 append | - |
| 23:15:25.823 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018 | 1 | 9 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00018_01_20230923.json |
| 23:15:25.824 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00019 | 3 | 10 | 이벤트 append | - |
| 23:15:25.824 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00019 | 3 | 10 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00019_03_20230923.json |
| 23:15:25.825 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00021 | 2 | 11 | 이벤트 append | - |
| 23:15:25.825 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00021 | 2 | 11 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00021_02_20230923.json |
| 23:15:25.826 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00026 | 2 | 12 | 이벤트 append | - |
| 23:15:25.826 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00026 | 2 | 12 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00026_02_20230923.json |
| 23:15:25.826 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 2 | 13 | 이벤트 append | - |
| 23:15:25.826 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 2 | 13 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00027_02_20230923.json |
| 23:15:25.827 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 3 | 14 | 이벤트 append | - |
| 23:15:25.827 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 3 | 14 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00027_03_20230923.json |
| 23:15:25.828 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00029 | 3 | 15 | 이벤트 append | - |
| 23:15:25.828 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00029 | 3 | 15 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00029_03_20230923.json |
| 23:15:25.829 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00030 | 2 | 16 | 이벤트 append | - |
| 23:15:25.829 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00030 | 2 | 16 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00030_02_20230923.json |
| 23:15:25.830 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00036 | 3 | 17 | 이벤트 append | - |
| 23:15:25.830 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00036 | 3 | 17 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00036_03_20230923.json |
| 23:15:25.831 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00039 | 2 | 18 | 이벤트 append | - |
| 23:15:25.831 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00039 | 2 | 18 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00039_02_20230923.json |
| 23:15:25.832 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00041 | 2 | 19 | 이벤트 append | - |
| 23:15:25.832 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00041 | 2 | 19 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00041_02_20230923.json |
| 23:15:25.832 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00047 | 1 | 20 | 이벤트 append | - |
| 23:15:25.832 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00047 | 1 | 20 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00047_01_20230923.json |
| 23:15:25.833 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 21 | 이벤트 append | - |
| 23:15:25.833 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 21 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00051_02_20230923.json |
| 23:15:25.834 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 22 | 이벤트 append | - |
| 23:15:25.834 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 22 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00055_03_20230923.json |
| 23:15:25.835 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 23 | 이벤트 append | - |
| 23:15:25.835 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 23 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00056_02_20230923.json |
| 23:15:25.836 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 24 | 이벤트 append | - |
| 23:15:25.836 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 24 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00059_02_20230923.json |
| 23:15:25.837 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 25 | 이벤트 append | - |
| 23:15:25.837 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 25 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00061_03_20230923.json |
| 23:15:25.838 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02013 | 1 | 26 | 이벤트 append | - |
| 23:15:25.838 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02013 | 1 | 26 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_02013_01_20230923.json |
| 23:15:25.839 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02014 | 1 | 27 | 이벤트 append | - |
| 23:15:25.839 | 20 | insert.file.ok | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02014 | 1 | 27 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_02014_01_20230923.json |
| 23:15:25.839 | 40 | payload.schema.drift | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | - | - | - | payload 에 스키마가 모르는 신규 키 유입 — 적재 시 유실됨(Read Model 후보) ← 트립 앵커 | newKeys={"conveyor_speed": "1.2", "gripper_temperature": "36.5"} |
| 23:15:25.839 | 30 | insert.batch.done | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | - | - | - | toy-data 적재 완료 | - |
| 23:15:25.839 | 30 | - | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | - | - | - | request completed | - |
| 23:15:25.841 | 30 | projection.request | 9ec12bff-f1e5-4b74-93c4-ba6df27fe698 | - | - | - | projection 요청 수신 | - |
| 23:15:25.843 | 20 | - | 9ec12bff-f1e5-4b74-93c4-ba6df27fe698 | - | - | - | 커서 조회 | projector=multimodal-projector |
| 23:15:25.843 | 30 | projection.start | 9ec12bff-f1e5-4b74-93c4-ba6df27fe698 | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 23:15:25.845 | 20 | projection.event.mapped | 9ec12bff-f1e5-4b74-93c4-ba6df27fe698 | - | 1 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 23:15:25.845 | 20 | - | 9ec12bff-f1e5-4b74-93c4-ba6df27fe698 | - | - | - | 이벤트 조회 | - |
| 23:15:25.847 | 20 | projection.event.mapped | 9ec12bff-f1e5-4b74-93c4-ba6df27fe698 | - | 3 | 3 | 이벤트 매핑 | projector=multimodal-projector |
| 23:15:25.852 | 20 | projection.event.mapped | 9ec12bff-f1e5-4b74-93c4-ba6df27fe698 | - | 2 | 13 | 이벤트 매핑 | projector=multimodal-projector |
| 23:15:25.852 | 20 | projection.event.mapped | 9ec12bff-f1e5-4b74-93c4-ba6df27fe698 | - | 3 | 14 | 이벤트 매핑 | projector=multimodal-projector |
| 23:15:25.853 | 20 | projection.event.mapped | 9ec12bff-f1e5-4b74-93c4-ba6df27fe698 | - | 3 | 15 | 이벤트 매핑 | projector=multimodal-projector |
| 23:15:25.854 | 20 | projection.event.mapped | 9ec12bff-f1e5-4b74-93c4-ba6df27fe698 | - | 2 | 16 | 이벤트 매핑 | projector=multimodal-projector |
| 23:15:25.893 | 30 | insight.card.request | 629b7501-2ea8-42fa-b557-1db8c86a3329 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 23:15:25.894 | 40 | insight.card.miss | 629b7501-2ea8-42fa-b557-1db8c86a3329 | - | - | - | insight 카드 없음: 최근 적재 데이터에 gripper_temperature 필드가 들어오기 시작했다. 이 값을 시간대별로 조회하고 싶다. 현재 Read Model로 가능한가? 안 되면 어떻게 해야 하나? | - |
| 23:15:25.894 | 30 | - | 629b7501-2ea8-42fa-b557-1db8c86a3329 | - | - | - | request completed | - |
| 23:15:26.199 | 30 | insight.card.request | fead2d52-4909-45f7-bc37-488cdc51d772 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 23:15:26.201 | 40 | insight.card.miss | fead2d52-4909-45f7-bc37-488cdc51d772 | - | - | - | insight 카드 없음: 최근 적재 데이터에 gripper_temperature 필드가 들어오기 시작했다. 이 값을 시간대별로 조회하고 싶다. 현재 Read Model로 가능한가? 안 되면 어떻게 해야 하나? | - |
| 23:15:26.202 | 30 | - | fead2d52-4909-45f7-bc37-488cdc51d772 | - | - | - | request completed | - |
| 23:15:26.508 | 30 | insight.card.request | 991e1043-48d8-4091-a5d5-6741212fbec9 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 23:15:26.510 | 40 | insight.card.miss | 991e1043-48d8-4091-a5d5-6741212fbec9 | - | - | - | insight 카드 없음: 최근 적재 데이터에 gripper_temperature 필드가 들어오기 시작했다. 이 값을 시간대별로 조회하고 싶다. 현재 Read Model로 가능한가? 안 되면 어떻게 해야 하나? | - |
| 23:15:26.511 | 30 | - | 991e1043-48d8-4091-a5d5-6741212fbec9 | - | - | - | request completed | - |

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
- (level 40, `payload.schema.drift`) payload 에 스키마가 모르는 신규 키 유입 — 적재 시 유실됨(Read Model 후보) ← 트립 앵커 → 신규 키(conveyor_speed, gripper_temperature) 유입 감지. 기존 Zod DTO 및 Projector 매핑 로직 미대응 → Read Model 후보 유실. [corr:4645a1d4-9c60-4b8c-a8e3-038f3011fd37]
- (level 40, `insight.card.miss`) insight 카드 없음: 최근 적재 데이터에 gripper_temperature 필드가 들어오기 시작했다. 이 값을 시간대별로 조회하고 싶다. 현재 Read Model로 가능한가? 안 되면 어떻게 해야 하나? → 사용자 요청 실패. 기존 read_grip_result/read_multimodal 스키마에 신규 필드 미존재. [corr:629b7501-2ea8-42fa-b557-1db8c86a3329]
- (level 40, `insight.card.miss`) insight 카드 없음: 최근 적재 데이터에 gripper_temperature 필드가 들어오기 시작했다. 이 값을 시간대별로 조회하고 싶다. 현재 Read Model로 가능한가? 안 되면 어떻게 해야 하나? → 동일 실패 패턴 반복. 단순 404가 아닌 Read Model 부족 신호. [corr:fead2d52-4909-45f7-bc37-488cdc51d772]
- (level 40, `insight.card.miss`) insight 카드 없음: 최근 적재 데이터에 gripper_temperature 필드가 들어오기 시작했다. 이 값을 시간대별로 조회하고 싶다. 현재 Read Model로 가능한가? 안 되면 어떻게 해야 하나? → 동일 실패 패턴 반복. [corr:991e1043-48d8-4091-a5d5-6741212fbec9]
- read_grip_result Insight 카드 정의는 scene_key, attempt_num, object_name 등만 포함. gripper_temperature 미지원. [corr:629b7501-2ea8-42fa-b557-1db8c86a3329]
- toyDataSchema (src/insert/dto/toy-data.dto.ts) 에 신규 키 미정의 → Zod parse 통과 시 payload 객체에 존재하나 Projector 매핑 로직 미추적. [corr:4645a1d4-9c60-4b8c-a8e3-038f3011fd37]
- GripResultProjector.map() (src/projection/projector/grip-result.projector.ts) return 객체 누락: gripper_temperature, conveyor_speed 할당. [corr:4645a1d4-9c60-4b8c-a8e3-038f3011fd37]
- 사용자 의도 "시간대별 조회"는 기존 행 단위 모델(read_grip_result) 로직으로는 충족 못 함 → 집개/신규 RM 필요. [corr:fead2d52-4909-45f7-bc37-488cdc51d772]

### Decision Drivers
- Schema Drift 대응 (신규 키 유입)
- 사용자 의도 충족 (시간대별 집개 산출값)
- 기존 Read Model 무해화 (행 단위 모델 오염 방지)
- API 일관성 유지 (버전 교체 연동)

### Considered Options
#### 기각 대안: 기존 read_grip_result 보강
- 접근: 추가 필드 매핑 및 GripResultProjector.map() 수정
- 제안 필드: gripper_temperature, conveyor_speed
- 트레이드오프: Row-level semantic 오염, 시간대별 조회 지원 불가. 실패 Driver "의도 충족".
```typescript
return { ...row, gripperTemperature: payload.gripper_temperature ?? null, conveyorSpeed: payload.conveyor_speed ?? null };
```

#### 권장 옵션: 신규 read_grip_sensor_v1 생성 + Insight 카드 등록 + API 버전 교체 연동
- 접근: 확정 설계 테이블 생성, 신규 Projector 또는 기존 map 확장으로 drift 키 매핑, Insight 카드 등록
- 제안 필드: scene_key, attempt_num, gripper_temperature, conveyor_speed, occurred_at
- 트레이드오프: 초기 세팅 비용 소모, 기존 RM 무해화. 성공 Driver "신규 키 유입/시간대별 조회".
```typescript
const driftPayload = event.payload as Record<string, unknown>; return { sceneKey: event.streamId.replace(/^grip-attempt:/, ""), attemptNum: event.attemptNum, gripperTemperature: typeof driftPayload["gripper_temperature"] === "number" ? Number(driftPayload["gripper_temperature"]) : null, conveyorSpeed: typeof driftPayload["conveyor_speed"] === "number" ? Number(driftPayload["conveyor_speed"]) : null, occurredAt: event.occurredAt };
```

### Decision Outcome
신규 read_grip_sensor_v1 생성 + Insight 카드 등록 + API 버전 교체 연동

### Consequences
- (+) 신규 필드 투영 성공
- (+) 시간대별 조회 API 제공
- (+) 기존 RM 정합성 유지
- (−) 초기 DB 스키마 마이그레이션 및 Projector 등록 작업 소모
- (−) API 버전 bump 발생

### Non-Goals
- read_grip_result/read_multimodal 수정 (기존 RM 구조 변경 금지)
- Zod DTO 강제 수정 (payload 유입 차단 금지)
- 기존 커서 재점프 또는 poison event rollback (데이터 영구 유실 방지)

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

- 대상: `read_grip_sensor_v1` · 키: (scene_key, attempt_num) · 원천 이벤트: GripAttemptRecorded

```sql
CREATE TABLE read_grip_sensor_v1 (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  gripper_temperature double precision,
  conveyor_speed double precision,
  occurred_at timestamptz,
  PRIMARY KEY (scene_key, attempt_num)
);
```

### 필드

```mschema
# Table: read_grip_sensor_v1
[
(scene_key:varchar, 장면 식별 키 = stream_id.replace(/^grip-attempt:/, ""), Primary Key),
(attempt_num:smallint, 동일한 장면 내 파지 시도 번호 (파일명 추출), Primary Key),
(gripper_temperature:double precision, 그리퍼 온도 (payload drift 유입: numeric, 신규 유입분부터 적재됨)),
(conveyor_speed:double precision, 컨베이어 속도 (payload drift 유입: numeric, 신규 유입분부터 적재됨)),
(occurred_at:timestamptz, 데이터 촬영 일자 (event.occurredAt))
]
```

### 투영 매핑 명세 (이벤트 → 컬럼)

> upsert 키: scene_key,attempt_num · 리플레이: projection_cursor 초기화 시 반드시 0 설정. catch-up 전 재투영 시 upsert는 멱id(up)을 전제해야 기존 값이 overwrite 방지하며, schema drift 신규 필드 누락 시 default/null 처리 로직 적용.

| 원천 이벤트 | payload 필드 | 컬럼 | 변환 |
| --- | --- | --- | --- |
| GripAttemptRecorded | gripper_temperature | gripper_temperature | verbatim |
| GripAttemptRecorded | conveyor_speed | conveyor_speed | verbatim |

파생 컬럼(이벤트 payload 아님):
- `scene_key` ← stream_id.replace(/^grip-attempt:/, '')
- `attempt_num` ← extract attempt number from file name suffix (e.g., _01_, _02_)

### Insight 카드 등록 (Insight Read DB 동기화)

> DDL 적용 시 아래 카드 등록도 함께 실행한다 — 다음 분석부터 신규 Read Model 이 LLM 컨텍스트에 노출된다.

```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_grip_sensor_v1', 'read_model', '신규 스키마 드리프트(payload.schema.drift) 감지된 gripper_temperature, conveyor_speed 값을 시도(attempt) 단위로 투영하여 시간대별 조회(time-series)를 지원.', '(scene_key, attempt_num)')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_grip_sensor_v1', 'scene_key', 'varchar', '장면 식별 키 = stream_id.replace(/^grip-attempt:/, "")', 1),
  ('read_grip_sensor_v1', 'attempt_num', 'smallint', '동일한 장면 내 파지 시도 번호 (파일명 추출)', 2),
  ('read_grip_sensor_v1', 'gripper_temperature', 'double precision', '그리퍼 온도 (payload drift 유입: numeric, 신규 유입분부터 적재됨)', 3),
  ('read_grip_sensor_v1', 'conveyor_speed', 'double precision', '컨베이어 속도 (payload drift 유입: numeric, 신규 유입분부터 적재됨)', 4),
  ('read_grip_sensor_v1', 'occurred_at', 'timestamptz', '데이터 촬영 일자 (event.occurredAt)', 5)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased (v1 → v2)

#### Added
- 신규 Read Model 테이블 read_grip_sensor_v1, Projector GripSensorV1Projector, 라우트 /grip-sensor 도입.
#### Fixed
- payload schema 드리프트(gripper_temperature, conveyor_speed) 유실 현장 해결. 신규 라우트로 조회 지원 가능.

### 마이그레이션 절차

- 하위호환 변경: 신규 테이블 read_grip_sensor_v1 은 기존 v1 Read Model 과 무관한 키/컬럼으로 동시 운영 가능; 프로젝터 배선 및 라우트 추가만, v1 호출 경로 무변
- 파괴적 변경: 없음
- 컷오버 전 테스트: SELECT scene_key, attempt_num FROM read_grip_sensor_v1 WHERE gripper_temperature IS NOT NULL OR conveyor_speed IS NOT NULL LIMIT 10; 확인 신규 드리프트 키 적재 완료. 기존 v1 라우트 /projection/grip-result 및 /projection/multimodal 동작 무변.
- 롤백 창/조건: 신규 테이블 drop, 프로젝트어 제거, DI/라우트 주입 revert. v1 상태 복원.
- Insight 카드 등록: §2의 카드 등록 SQL을 DDL과 함께 적용(카탈로그 동기화)

### 사유·호환성

- 사유: 기존 Read Model(`read_grip_result`, `read_multimodal`) 및 Zod 스키마에 gripper_temperature와 conveyor_speed 컬럼이 미존재하여, payload 드리프트 감지 시 신규 키가 유실되거나 검증 실패로 처리됨. 사용자의 조회 요청은 현재 카탈로그로는 불가능한 상태. 신규 Read Model read_grip_sensor_v1을 도입하여 드리프트 필드를 동시 보존 및 조회 지원. [corr:4645a1d4-9c60-4b8c-a8e3-038f3011fd37]
- 트리거 근거: | 23:15:25.839 | 40 | payload.schema.drift | 4645a1d4-9c60-4b8c-a8e3-038f3011fd37 | - | - | - | payload 에 스키마가 모르는 신규 키 유입 — 적재 시 유실됨(Read Model 후보) ← 트립 앵커 [corr:4645a1d4-9c60-4b8c-a8e3-038f3011fd37] | newKeys={"conveyor_speed": "1.2", "gripper_temperature": "36.5"} |
기존 GripResultProjector.map() 메서드에서 payload.objects[0].class_name만 추출하며, Zod 스키마(toyDataSchema)에 gripper_temperature/conveyor_speed 필드가 미정의되어 드리프트 키가 유실됨.
- v1 호환성: v1 테이블·프로젝터 클래스·이름은 무손상. 신규 라우트(/grip-sensor) 및 서비스 메서드(catchUpGripSensorV1)는 추가만. 기존 DI/라우트 파일은 한 줄 추가(modifyFile)로 배선만.

### 변경 파일

- `src/shared/database/schema/index.ts` (modifyFile) — 신규 테이블 스키마 export 추가. 기존 export 무변.
- `src/projection/projection.service.ts` (modifyFile) — 신규 Projector DI 주입 및 catchUpGripSensorV1 메서드 추가. 기존 로직 무변.
- `src/projection/projection.controller.ts` (modifyFile) — 신규 라우트 /grip-sensor 추가. 기존 엔드포인트 무변.

## Optional — 부속 자료(컨텍스트 축소 시 생략 가능)

### 신규 Read Model — Drizzle 스키마

```ts
import { doublePrecision, pgTable, primaryKey, smallint, timestamp, varchar } from 'drizzle-orm/pg-core';

export const readGripSensorV1 = pgTable(
  "read_grip_sensor_v1",
  {
    sceneKey: varchar("scene_key").notNull(),
    attemptNum: smallint("attempt_num").notNull(),
    gripperTemperature: doublePrecision("gripper_temperature"),
    conveyorSpeed: doublePrecision("conveyor_speed"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }),
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
import { readGripSensorV1 } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

type GripSensorV1ProjectorInsert = InferInsertModel<typeof readGripSensorV1>;

function toNumberOrNull(value: unknown): number | null {
  if (value === undefined || value === null) {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

@Injectable()
export class GripSensorV1Projector implements Projector<GripSensorV1ProjectorInsert> {
  readonly name: string = "grip-sensor-v1-projector";

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(GripSensorV1Projector.name);
  }

  map(event: EventStoreEventRow): GripSensorV1ProjectorInsert {
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
      gripperTemperature: toNumberOrNull(payload["gripper_temperature"]),
      conveyorSpeed: toNumberOrNull(payload["conveyor_speed"]),
      occurredAt: event.occurredAt,
    };
  }

  async upsert(tx: DrizzleTx, row: GripSensorV1ProjectorInsert): Promise<void> {
    await tx
      .insert(readGripSensorV1)
      .values(row)
      .onConflictDoUpdate({
        target: [readGripSensorV1.sceneKey, readGripSensorV1.attemptNum],
        set: {
          gripperTemperature: row.gripperTemperature,
          conveyorSpeed: row.conveyorSpeed,
          occurredAt: row.occurredAt,
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
export * from "./service/read-grip-sensor-v1"; // 신규 Read Model export

// src/insert/dto/toy-data.dto.ts (필 필드 확장)
import { z } from 'zod';
const cameraIntrinsicSchema = z.object({ codx: z.number().nullable(), cody: z.number(), cx: z.number(), cy: z.number(), fx: z.number(), fy: z.number(), k1: z.number(), k2: z.number(), k3: z.number(), k4: z.number(), k5: z.number(), k6: z.number(), p1: z.number(), p2: z.number() });
const cameraInfoSchema = z.object({ camera_intrinsic_param: cameraIntrinsicSchema, camera_name: z.string(), camera_type: z.string() });
const grip2dPoseSchema = z.object({ xl: z.number(), xr: z.number(), yl: z.number(), yr: z.number() });
const grip3dPoseSchema = z.object({ x1: z.number(), x2: z.number(), x3: z.number(), x4: z.number(), x5: z.number(), x6: z.number(), x7: z.number(), x8: z.number(), y1: z.number(), y2: z.number(), y3: z.number(), y4: z.number(), y5: z.number(), y6: z.number(), y7: z.number(), y8: z.number(), z1: z.number(), z2: z.number(), z3: z.number(), z4: z.number(), z5: z.number(), z6: z.number(), z7: z.number(), z8: z.number() });
const gripDataSchema = z.object({ grip_2d_pose: grip2dPoseSchema, grip_3d_pose: grip3dPoseSchema });
const objectsSchema = z.object({ annotation_type: z.string(), class_name: z.string(), package_type: z.string(), object_properties: z.array(z.string()), id: z.number().int(), segmentation_points: z.array(z.array(z.array(z.number()))) });
const robotTfSchema = z.object({ rotation_3x3: z.array(z.number()).length(9), translation_3x1: z.array(z.number()).length(3) });
const humanAnnotationSchema = z.object({ annotation_type: z.string(), id: z.number().int(), annotation_points: z.array(z.number()), num_keypoints: z.number().int() });

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
  gripper_temperature: z.coerce.number().optional(), // 신규 드리프트 키
  conveyor_speed: z.coerce.number().optional(),       // 신규 드리프트 키
});
export type ToyDataDto = z.infer<typeof toyDataSchema>;

// src/projection/projection.service.ts (주입·catchUp)
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { GripSensorProjector } from '@/projection/projector/grip-sensor.projector'; // 신규
import { ProjectionResult } from '@/projection/projector/projector';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';
import { LogAction } from '@/shared/logger/logging-context';

export type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
  gripSensor: ProjectionResult; // 신규
};

@Injectable()
export class ProjectionService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly runner: CatchUpRunner,
    private readonly multimodal: MultiModalProjector,
    private readonly gripResult: GripResultProjector,
    private readonly gripSensor: GripSensorProjector, // 신규
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

  catchUpGripSensor(): Promise<ProjectionResult> { // 신규
    return this.runner.run(this.gripSensor);
  }

  async catchUpAll(): Promise<CatchUpAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_START }, "전체 투영 시작");

    const multimodal: ProjectionResult = await this.catchUpMultimodal();
    const gripResult: ProjectionResult = await this.catchUpGripResult();
    const gripSensor: ProjectionResult = await this.catchUpGripSensor(); // 신규

    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");

    return { multimodal, gripResult, gripSensor };
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

// src/projection/projection.controller.ts (라우트)
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

  @Post("/grip-sensor") // 신규 라우트
  gripSensor(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/grip-sensor",
      },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpGripSensor();
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
export * from "./service/read-grip-sensor-v1";
```

### 버전 교체 코드 — `src/projection/projection.service.ts` (modifyFile)

```typescript
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { GripSensorV1Projector } from '@/projection/projector/grip-sensor-v1.projector';
import { ProjectionResult } from '@/projection/projector/projector';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';
import { LogAction } from '@/shared/logger/logging-context';

export type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
  gripSensorV1: ProjectionResult;
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
    private readonly gripSensorV1: GripSensorV1Projector,
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

  catchUpGripSensorV1(): Promise<ProjectionResult> {
    return this.runner.run(this.gripSensorV1);
  }

  async catchUpAll(): Promise<CatchUpAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_START }, "전체 투영 시작");

    const multimodal: ProjectionResult = await this.catchUpMultimodal();
    const gripResult: ProjectionResult = await this.catchUpGripResult();
    const gripSensorV1: ProjectionResult = await this.catchUpGripSensorV1();

    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");

    return { multimodal, gripResult, gripSensorV1 };
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

  @Post("/grip-sensor")
  gripSensorV1(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/grip-sensor",
      },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpGripSensorV1();
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
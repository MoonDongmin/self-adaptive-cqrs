---
docId: analysis-3d8cd69e-27ca-499f-b59c-6f6cb37e1f91
generatedAt: 2026-08-11T15:18:36.405Z
targetReadModel: read_sensor_drift
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: v1
  to: v2
  affectedEndpoints:
    - "POST /multimodal"
    - "POST /grip-result"
    - "POST /sensor-drift"
    - "POST /insert-all"
evidenceSources:
  - { origin: developer-logging, anchorId: "3d8cd69e-27ca-499f-b59c-6f6cb37e1f91" }
  - { origin: developer-logging, anchorId: "a2f48a95-88ea-423e-be5b-d122ac68108b" }
  - { origin: developer-logging, anchorId: "19f58969-536a-4399-9e08-32abd91b180f" }
  - { origin: developer-logging, anchorId: "6e403882-475b-40f5-b814-844d89859d51" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_sensor_drift

> 결론(TL;DR): `read_sensor_drift`을(를) 재생성한다 — 적재 단계에서 payload 에 신규 키(conveyor_speed, gripper_temperature) 가 유입되어 스키마 드리프트 경고(payload.schema.drift) 가 발생했다. 이후 사용자가 gripper_temperature 조회를 요청하나 Insight Read DB 카탈로그에 해당 Read Model/이벤트 카드가 미등록되어 insight.card.miss 가 반환한다. (이상 유형: 스키마 드리프트(신규 키 유입) · 심각도: warning)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `-`(level 30) 1회, `insert.request`(level 30) 1회, `payload.schema.drift`(level 40) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 54회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 15:18:28.729 | 30 | insert.request | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | - | - | - | Insert Event Store 요청 수신 | - |
| 15:18:28.729 | 30 | insert.batch.start | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | - | - | - | Toy-Data 적재 시작 | - |
| 15:18:28.734 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00001 | 1 | 1 | 이벤트 append | - |
| 15:18:28.734 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00001 | 1 | 1 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00001_01_20230923.json |
| 15:18:28.735 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00002 | 3 | 2 | 이벤트 append | - |
| 15:18:28.735 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00002 | 3 | 2 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00002_03_20230923.json |
| 15:18:28.736 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00005 | 3 | 3 | 이벤트 append | - |
| 15:18:28.736 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00005 | 3 | 3 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00005_03_20230923.json |
| 15:18:28.738 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 1 | 4 | 이벤트 append | - |
| 15:18:28.738 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 1 | 4 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00009_01_20230923.json |
| 15:18:28.739 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 3 | 5 | 이벤트 append | - |
| 15:18:28.739 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 3 | 5 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00009_03_20230923.json |
| 15:18:28.739 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 2 | 6 | 이벤트 append | - |
| 15:18:28.739 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 2 | 6 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00011_02_20230923.json |
| 15:18:28.740 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 3 | 7 | 이벤트 append | - |
| 15:18:28.740 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 3 | 7 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00011_03_20230923.json |
| 15:18:28.741 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00015 | 1 | 8 | 이벤트 append | - |
| 15:18:28.741 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00015 | 1 | 8 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00015_01_20230923.json |
| 15:18:28.742 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018 | 1 | 9 | 이벤트 append | - |
| 15:18:28.742 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018 | 1 | 9 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00018_01_20230923.json |
| 15:18:28.743 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00019 | 3 | 10 | 이벤트 append | - |
| 15:18:28.743 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00019 | 3 | 10 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00019_03_20230923.json |
| 15:18:28.744 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00021 | 2 | 11 | 이벤트 append | - |
| 15:18:28.744 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00021 | 2 | 11 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00021_02_20230923.json |
| 15:18:28.744 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00026 | 2 | 12 | 이벤트 append | - |
| 15:18:28.744 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00026 | 2 | 12 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00026_02_20230923.json |
| 15:18:28.745 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 2 | 13 | 이벤트 append | - |
| 15:18:28.745 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 2 | 13 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00027_02_20230923.json |
| 15:18:28.746 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 3 | 14 | 이벤트 append | - |
| 15:18:28.746 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 3 | 14 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00027_03_20230923.json |
| 15:18:28.747 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00029 | 3 | 15 | 이벤트 append | - |
| 15:18:28.747 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00029 | 3 | 15 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00029_03_20230923.json |
| 15:18:28.747 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00030 | 2 | 16 | 이벤트 append | - |
| 15:18:28.747 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00030 | 2 | 16 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00030_02_20230923.json |
| 15:18:28.748 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00036 | 3 | 17 | 이벤트 append | - |
| 15:18:28.748 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00036 | 3 | 17 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00036_03_20230923.json |
| 15:18:28.749 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00039 | 2 | 18 | 이벤트 append | - |
| 15:18:28.749 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00039 | 2 | 18 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00039_02_20230923.json |
| 15:18:28.750 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00041 | 2 | 19 | 이벤트 append | - |
| 15:18:28.750 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00041 | 2 | 19 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00041_02_20230923.json |
| 15:18:28.750 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00047 | 1 | 20 | 이벤트 append | - |
| 15:18:28.750 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00047 | 1 | 20 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00047_01_20230923.json |
| 15:18:28.751 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 21 | 이벤트 append | - |
| 15:18:28.751 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 21 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00051_02_20230923.json |
| 15:18:28.752 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 22 | 이벤트 append | - |
| 15:18:28.752 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 22 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00055_03_20230923.json |
| 15:18:28.753 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 23 | 이벤트 append | - |
| 15:18:28.753 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 23 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00056_02_20230923.json |
| 15:18:28.754 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 24 | 이벤트 append | - |
| 15:18:28.754 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 24 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00059_02_20230923.json |
| 15:18:28.755 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 25 | 이벤트 append | - |
| 15:18:28.755 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 25 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00061_03_20230923.json |
| 15:18:28.755 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02013 | 1 | 26 | 이벤트 append | - |
| 15:18:28.755 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02013 | 1 | 26 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_02013_01_20230923.json |
| 15:18:28.756 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02014 | 1 | 27 | 이벤트 append | - |
| 15:18:28.756 | 20 | insert.file.ok | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02014 | 1 | 27 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_02014_01_20230923.json |
| 15:18:28.756 | 40 | payload.schema.drift | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | - | - | - | payload 에 스키마가 모르는 신규 키 유입 — 적재 시 유실됨(Read Model 후보) ← 트립 앵커 | newKeys={"conveyor_speed": "1.2", "gripper_temperature": "36.5"} |
| 15:18:28.756 | 30 | insert.batch.done | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | - | - | - | toy-data 적재 완료 | - |
| 15:18:28.757 | 30 | - | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | - | - | - | request completed | - |
| 15:18:28.759 | 30 | projection.request | b2b81c31-8727-44f9-8502-c320450a66a6 | - | - | - | projection 요청 수신 | - |
| 15:18:28.760 | 30 | projection.start | b2b81c31-8727-44f9-8502-c320450a66a6 | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 15:18:28.760 | 20 | - | b2b81c31-8727-44f9-8502-c320450a66a6 | - | - | - | 커서 조회 | projector=multimodal-projector |
| 15:18:28.762 | 20 | projection.event.mapped | b2b81c31-8727-44f9-8502-c320450a66a6 | - | 1 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 15:18:28.762 | 20 | - | b2b81c31-8727-44f9-8502-c320450a66a6 | - | - | - | 이벤트 조회 | - |
| 15:18:28.764 | 20 | projection.event.mapped | b2b81c31-8727-44f9-8502-c320450a66a6 | - | 3 | 3 | 이벤트 매핑 | projector=multimodal-projector |
| 15:18:28.769 | 20 | projection.event.mapped | b2b81c31-8727-44f9-8502-c320450a66a6 | - | 2 | 12 | 이벤트 매핑 | projector=multimodal-projector |
| 15:18:28.769 | 20 | projection.event.mapped | b2b81c31-8727-44f9-8502-c320450a66a6 | - | 2 | 13 | 이벤트 매핑 | projector=multimodal-projector |
| 15:18:28.770 | 20 | projection.event.mapped | b2b81c31-8727-44f9-8502-c320450a66a6 | - | 3 | 14 | 이벤트 매핑 | projector=multimodal-projector |
| 15:18:28.771 | 20 | projection.event.mapped | b2b81c31-8727-44f9-8502-c320450a66a6 | - | 2 | 16 | 이벤트 매핑 | projector=multimodal-projector |
| 15:18:28.809 | 30 | insight.card.request | a2f48a95-88ea-423e-be5b-d122ac68108b | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 15:18:28.809 | 40 | insight.card.miss | a2f48a95-88ea-423e-be5b-d122ac68108b | - | - | - | insight 카드 없음: 최근 적재 데이터에 gripper_temperature 필드가 들어오기 시작했다. 이 값을 시간대별로 조회하고 싶다. 현재 Read Model로 가능한가? 안 되면 어떻게 해야 하나? | - |
| 15:18:28.810 | 30 | - | a2f48a95-88ea-423e-be5b-d122ac68108b | - | - | - | request completed | - |
| 15:18:29.114 | 30 | insight.card.request | 19f58969-536a-4399-9e08-32abd91b180f | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 15:18:29.116 | 40 | insight.card.miss | 19f58969-536a-4399-9e08-32abd91b180f | - | - | - | insight 카드 없음: 최근 적재 데이터에 gripper_temperature 필드가 들어오기 시작했다. 이 값을 시간대별로 조회하고 싶다. 현재 Read Model로 가능한가? 안 되면 어떻게 해야 하나? | - |
| 15:18:29.116 | 30 | - | 19f58969-536a-4399-9e08-32abd91b180f | - | - | - | request completed | - |
| 15:18:29.421 | 30 | insight.card.request | 6e403882-475b-40f5-b814-844d89859d51 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 15:18:29.424 | 40 | insight.card.miss | 6e403882-475b-40f5-b814-844d89859d51 | - | - | - | insight 카드 없음: 최근 적재 데이터에 gripper_temperature 필드가 들어오기 시작했다. 이 값을 시간대별로 조회하고 싶다. 현재 Read Model로 가능한가? 안 되면 어떻게 해야 하나? | - |
| 15:18:29.424 | 30 | - | 6e403882-475b-40f5-b814-844d89859d51 | - | - | - | request completed | - |

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
- (level 40, `payload.schema.drift`) payload 에 스키마가 모르는 신규 키 유입 — 적재 시 유실됨(Read Model 후보) ← 트립 앵커 → Zod 검증 미등록 키 유입으로 기존 DTO 파싱 실패/유실, Read Model 후보 데이터 고갈. [corr:3d8cd69e-27ca-499f-b59c-6f6cb37e1f91]
- (level 40, `insight.card.miss`) insight 카드 없음: 최근 적재 데이터에 gripper_temperature 필드가 들어오기 시작했다. 이 값을 시간대별로 조회하고 싶다. 현재 Read Model로 가능한가? 안 되면 어떻게 해야 하나? → 신규 키 gripper_temperature 조회 의도(시간대별 집계) 충족 불가, 기존 Insight 카탈로그 부재. [corr:a2f48a95-88ea-423e-be5b-d122ac68108b]
- (level 40, `insight.card.miss`) insight 카드 없음: 최근 적재 데이터에 gripper_temperature 필드가 들어오기 시작했다. 이 값을 시간대별로 조회하고 싶다. 현재 Read Model로 가능한가? 안 되면 어떻게 해야 하나? → 반복 실패 lane 지시, 기존 Read Model로는 신규 키·집게 요구 충족 불가능. [corr:19f58969-536a-4399-9e08-32abd91b180f]
- (level 40, `insight.card.miss`) insight 카드 없음: 최근 적재 데이터에 gripper_temperature 필드가 들어오기 시작했다. 이 값을 시간대별로 조회하고 싶다. 현재 Read Model로 가능한가? 안 되면 어떻게 해야 하나? → 판정: 기존 모델 보강/변환만으로는 신규 키·집게 요구 충족 불가 → newReadModel 선정. [corr:6e403882-475b-40f5-b814-844d89859d51]
- read_grip_result 스키마의 scene_key:varchar(장면 식별 키), attempt_num:smallint(파지 시도 번호), occurred_at:timestamptz(데이터 촬영 일자) 등 기존 컬럼은 gripper_temperature/conveyor_speed 미포함.
- src/insert/dto/toy-data.dto.ts 의 toyDataSchema 정의는 신규 키 누락, Zod .parse() 호출 시 미등록 필드 자동 유실 발생.
- src/projection/projector/grip-result.projector.ts 의 map() 메서드 반환 객체 구조는 고정된 기존 필드 매핑, 신규 드리프트 키 추출 로직 부재.
- src/projection/projector/multimodal.projector.ts 의 map() 메서드도 동일하게 image_2d_uri(현재 projector가 null로 둠), video_uri(현재 projector가 null로 둠) 등 기존 정의만 채움, 신규 키 처리 건너뜀.
- 사용자의 의도(시간대별 gripper_temperature 조회)는 read_sensor_drift 설계의 occurred_at + gripper_temperature 조합에 부합.

### Decision Drivers
- Schema contract stability
- Query intent alignment (time-series aggregation)
- Defect handling isolation principle
- Maintenance overhead vs extensibility

### Considered Options
#### 기존 Read Model 보강 (read_grip_result 확만)
- 접근: GripResultProjector.map() 수정으로 gripper_temperature, conveyor_speed 필드 추가, read_grip_result Drizzle 스키마 및 migrationSql 동반 변경.
- 제안 필드: scene_key, attempt_num, occurred_at, gripper_temperature, conveyor_speed
- 트레이드오프: 기존 테이블 확만, 단일 조회 경로 유지. 단, 센서 데이터와 파지 결과 결합으로 도메인 과부하 발생, migration 롤백 리스크 증가.
```typescript
// src/projection/projector/grip-result.projector.ts map() 수정
return { sceneKey: event.streamId.replace(/^grip-attempt:/, ""), attemptNum: event.attemptNum, occurredAt: event.occurredAt, gripperTemperature: payload.gripper_temperature ?? null, conveyorSpeed: payload.conveyor_speed ?? null, ...기존필드 };
```

#### 신규 Read Model 채택 (read_sensor_drift)
- 접근: src/projection/projector/sensor-drift.projector.ts 신규 구현, ProjectionService.catchUpSensorDrift() 연계, read_sensor_drift Drizzle 스키마 및 migrationSql 적용. 기존 toyDataSchema는 Zod 미등록 키 유실 원칙 유지(거절/격리).
- 제안 필드: scene_key, attempt_num, occurred_at, gripper_temperature, conveyor_speed
- 트레이드오프: 도메인 분리, 센서 드리프트 격리 무해화. 단, 별도 projection 엔드포인트(POST /projection/sensor-drift) 필요, initial catch-up 오버헤드 발생.
```typescript
// src/projection/projector/sensor-drift.projector.ts map() 핵심
return { sceneKey: event.streamId.replace(/^grip-attempt:/, ""), attemptNum: event.attemptNum, occurredAt: event.occurredAt, gripperTemperature: payload.gripper_temperature ?? null, conveyorSpeed: payload.conveyor_speed ?? null };
```

### Decision Outcome
newReadModel (read_sensor_drift adoption)

### Consequences
- (+) Enables direct time-series aggregation via new table
- (+) Isolates drift data without altering existing schema contracts
- (−) Requires separate projection route for sensor data
- (−) Initial catch-up overhead for new projector implementation

### Non-Goals
- Modifying toyDataSchema to coerce invalid values into defaults
- Altering existing read_grip_result or read_multimodal tables
- Handling non-sensor schema drifts

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

- 대상: `read_sensor_drift` · 키: (scene_key, attempt_num) · 원천 이벤트: GripAttemptRecorded

```sql
CREATE TABLE read_sensor_drift (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  occurred_at timestamptz,
  gripper_temperature double precision,
  conveyor_speed double precision,
  PRIMARY KEY (scene_key, attempt_num)
);
```

### 필드

```mschema
# Table: read_sensor_drift
[
(scene_key:varchar, 장면 식별 키 = stream_id.replace(/^grip-attempt:/, ""), Primary Key),
(attempt_num:smallint, 동일한 장면 내 파지 시도 번호 (파일명 attempt), Primary Key),
(occurred_at:timestamptz, 데이터 촬영 일자 (event.occurredAt)),
(gripper_temperature:double precision, 그리퍼 온도 (payload 드리프트 신규 키, z.coerce.number().optional())),
(conveyor_speed:double precision, 컨베이어 속도 (payload 드리프트 신규 키, z.coerce.number().optional()))
]
```

### 투영 매핑 명세 (이벤트 → 컬럼)

> upsert 키: (scene_key, attempt_num) · 리플레이: projection_cursor 초기화 시 반드시 null/0 검증으로 첫 upsert 전제. catch-up 전체 재투영 시 scene_key+attempt_num 기준 upsert는 멱돈이므로 동키 overwrite 전제 확인.

| 원천 이벤트 | payload 필드 | 컬럼 | 변환 |
| --- | --- | --- | --- |
| GripAttemptRecorded | gripper_temperature | gripper_temperature | verbatim |
| GripAttemptRecorded | conveyor_speed | conveyor_speed | verbatim |

파생 컬럼(이벤트 payload 아님):
- `scene_key` ← streamId prefix 'grip-attempt:' 제거
- `attempt_num` ← streamId 말미 5자리 정수 추출
- `occurred_at` ← streamId 말미 8자리 YYYYMMDD → timestamptz

### Insight 카드 등록 (Insight Read DB 동기화)

> DDL 적용 시 아래 카드 등록도 함께 실행한다 — 다음 분석부터 신규 Read Model 이 LLM 컨텍스트에 노출된다.

```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_sensor_drift', 'read_model', '신규 payload 드리프트 키(gripper_temperature, conveyor_speed) 적재 및 시간대별 조회 지원', '(scene_key, attempt_num)')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_sensor_drift', 'scene_key', 'varchar', '장면 식별 키 = stream_id.replace(/^grip-attempt:/, "")', 1),
  ('read_sensor_drift', 'attempt_num', 'smallint', '동일한 장면 내 파지 시도 번호 (파일명 attempt)', 2),
  ('read_sensor_drift', 'occurred_at', 'timestamptz', '데이터 촬영 일자 (event.occurredAt)', 3),
  ('read_sensor_drift', 'gripper_temperature', 'double precision', '그리퍼 온도 (payload 드리프트 신규 키, z.coerce.number().optional())', 4),
  ('read_sensor_drift', 'conveyor_speed', 'double precision', '컨베이어 속도 (payload 드리프트 신규 키, z.coerce.number().optional())', 5)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased (v1 → v2)

#### Added
- 신규 Read Model 테이블 read_sensor_drift 및 SensorDriftProjector 구현
- 라우트 /projection/sensor-drift 배선
#### Changed
- ProjectionService DI 및 catchUpAll() 확장으로 sensorDrift 포함

### 마이그레이션 절차

- 하위호환 변경: 기존 read_grip_result, read_multimodal 테이블/프로젝터/라우트 무변 유지; 신규 키 추출은 unknown + type guard 로 fallback(null) 처리, 기존 적재 파이프라인 호환성 보장
- 파괴적 변경: 없음
- 컷오버 전 테스트: 1. v1 CatchUpRunner 실행 시 read_sensor_drift 테이블 미존재 → SQL migration 먼저 적용
2. sensor-drift.projector.ts map() 단위 테스트: payload.gripper_temperature/conveyor_speed 유입/결격 case 검증(null vs string)
3. ProjectionController /sensor-drift 라우트 E2E: DB row 존재, global_seq/scene_key 매핑 정합성 확인
- 롤백 창/조건: 컷오버 전 rollbackPlan: read_sensor_drift 테이블 DROP TABLE 실행, DI/라우트 주입 제거, schema/index.ts revert. 조건: payload.schema.drift 경고 재발 또는 gripper_temperature 조회 요구사항 해지.
- Insight 카드 등록: §2의 카드 등록 SQL을 DDL과 함께 적용(카탈로그 동기화)

### 사유·호환성

- 사유: 적재 단계에서 payload 에 신규 키(conveyor_speed, gripper_temperature) 가 유입되어 스키마 드리프트 경고(payload.schema.drift) 가 발생[corr:3d8cd69e-27ca-499f-b59c-6f6cb37e1f91]. 이후 사용자가 gripper_temperature 조회를 요청하나 Insight Read DB 카탈로그에 해당 Read Model/이벤트 카드가 미등록되어 insight.card.miss 가 반환[corr:a2f48a95-88ea-423e-be5b-d122ac68108b]. 신규 키 유입으로 인해 v1 DTO 및 기존 프로젝터가 매핑 실패 또는 데이터 유실. 본 변경은 새 테이블·프로젝터를 추가하여 신규 센서 드리프트 값을 시그니처 준수 방식으로 투영, Insight 카드 미스 해결 및 시간대별 조회 지원.
- 트리거 근거: | 15:18:28.756 | 40 | payload.schema.drift | 3d8cd69e-27ca-499f-b59c-6f6cb37e1f91 | - | - | - | payload 에 스키마가 모르는 신규 키 유입 — 적재 시 유실됨(Read Model 후보) ← 트립 앵커 | newKeys={"conveyor_speed": "1.2", "gripper_temperature": "36.5"} |
| 15:18:28.809 | 40 | insight.card.miss | a2f48a95-88ea-423e-be5b-d122ac68108b | - | - | - | insight 카드 없음: 최근 적재 데이터에 gripper_temperature 필드가 들어오기 시작했다. 이 값을 시간대별로 조회하고 싶다. 현재 Read Model로 가능한가? 안 되면 어떻게 해야 하나? | - |
- v1 호환성: 기존 테이블·엔드포인트·프로젝터 클래스/name 은 수정·삭제 금지. 새 테이블(read_sensor_drift) 및 새 프로젝터(SensorDriftProjector)는 추가 파일만 생성. 기존 ProjectionService/ProjectionController 는 DI 한 줄과 라우트 메서드 한 줄 추가(changeKind=modifyFile)로 배선, v1 로직 보존. backwardCompatibleChanges 적용.

### 변경 파일

- `src/shared/database/schema/index.ts` (modifyFile) — 신규 테이블 스키마 export 배선. 기존 export 보존.
- `src/projection/projection.service.ts` (modifyFile) — SensorDriftProjector DI 추가, catchUpAll() 배선. 기존 메서드/로직 보존.
- `src/projection/projection.controller.ts` (modifyFile) — /v2/sensor-drift 라우트 배선. 기존 엔드포인트 보존.

## Optional — 부속 자료(컨텍스트 축소 시 생략 가능)

### 신규 Read Model — Drizzle 스키마

```ts
import { doublePrecision, pgTable, primaryKey, smallint, timestamp, varchar } from 'drizzle-orm/pg-core';

export const readSensorDrift = pgTable(
  "read_sensor_drift",
  {
    sceneKey: varchar("scene_key").notNull(),
    attemptNum: smallint("attempt_num").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }),
    gripperTemperature: doublePrecision("gripper_temperature"),
    conveyorSpeed: doublePrecision("conveyor_speed"),
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
import { readSensorDrift } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

type SensorDriftProjectorInsert = InferInsertModel<typeof readSensorDrift>;

function toNumberOrNull(value: unknown): number | null {
  if (value === undefined || value === null) {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

@Injectable()
export class SensorDriftProjector implements Projector<SensorDriftProjectorInsert> {
  readonly name: string = "sensor-drift-projector";

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(SensorDriftProjector.name);
  }

  map(event: EventStoreEventRow): SensorDriftProjectorInsert {
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
    };
  }

  async upsert(tx: DrizzleTx, row: SensorDriftProjectorInsert): Promise<void> {
    await tx
      .insert(readSensorDrift)
      .values(row)
      .onConflictDoUpdate({
        target: [readSensorDrift.sceneKey, readSensorDrift.attemptNum],
        set: {
          occurredAt: row.occurredAt,
          gripperTemperature: row.gripperTemperature,
          conveyorSpeed: row.conveyorSpeed,
        },
      });
  }
}

```

### 신규 Read Model — 배선(컨트롤러/서비스/모듈)

```ts
// src/insert/dto/toy-data.dto.ts (Zod Schema Extension - Rule 12)
import { z } from 'zod';
// ... (existing imports and schemas remain unchanged) ...

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
}).extend({
  gripper_temperature: z.coerce.number().optional(),
  conveyor_speed: z.coerce.number().optional(),
});

export type ToyDataDto = z.infer<typeof toyDataSchema>;

// src/shared/database/schema/index.ts (Export New Schema)
export * from "./service/read-sensor-drift";

// src/projection/projection.service.ts (Inject & Run)
import { SensorDriftProjector } from '@/projection/projector/sensor-drift.projector';

@Injectable()
export class ProjectionService {
  constructor(
    // ... existing providers ...
    private readonly sensorDrift: SensorDriftProjector,
  ) {}

  catchUpSensorDrift(): Promise<ProjectionResult> {
    return this.runner.run(this.sensorDrift);
  }
}

// src/projection/projection.controller.ts (Add Route)
@Controller("projection")
export class ProjectionController {
  // ... existing routes ...

  @Post("/sensor-drift")
  sensorDrift(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/sensor-drift",
      },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpSensorDrift();
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
export * from "./service/read-sensor-drift";
```

### 버전 교체 코드 — `src/projection/projection.service.ts` (modifyFile)

```typescript
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { SensorDriftProjector } from '@/projection/projector/sensor-drift.projector';
import { ProjectionResult } from '@/projection/projector/projector';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';
import { LogAction } from '@/shared/logger/logging-context';

export type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
  sensorDrift: ProjectionResult;
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
    private readonly sensorDrift: SensorDriftProjector,
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

  catchUpSensorDrift(): Promise<ProjectionResult> {
    return this.runner.run(this.sensorDrift);
  }

  async catchUpAll(): Promise<CatchUpAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_START }, "전체 투영 시작");

    const multimodal: ProjectionResult = await this.catchUpMultimodal();
    const gripResult: ProjectionResult = await this.catchUpGripResult();
    const sensorDrift: ProjectionResult = await this.catchUpSensorDrift();

    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");

    return { multimodal, gripResult, sensorDrift };
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

  @Post("/sensor-drift")
  sensorDrift(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/sensor-drift",
      },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpSensorDrift();
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
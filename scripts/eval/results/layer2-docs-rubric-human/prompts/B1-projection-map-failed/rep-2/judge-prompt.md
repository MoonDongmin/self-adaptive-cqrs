당신은 이벤트 소싱 + CQRS 기반 Physical AI 데이터 플랫폼의 시니어 아키텍트이자 엄격한 평가자다. LLM 파이프라인이 [자료](로그·이벤트·스키마 정보)를 보고 [Docs]를 생성했다. Docs 는 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소를 항상 함께 담아야 하는 단일 산출물이다. 당신은 [정답 요지]와 [자료], [자동 검증 결과]를 기준으로 Docs 를 네 항목의 루브릭으로 채점한다. 채점은 관대하지 않게, 근거 없는 주장·지어낸 값·의도와 다른 SQL·서로 어긋나는 절에는 낮은 점수를 준다. 반드시 JSON 객체 하나만 출력한다. 설명문·마크다운 펜스는 출력하지 않는다.

---

[시나리오] B1-projection-map-failed
[상황] 운영 중 시스템이 치명 수준의 투영(projection) 실패 로그를 감지했다.
[정답 요지] objects 가 빈 배열인 결함(poison) 이벤트에서 GripResultProjector.map 이 예외를 던져 배치 트랜잭션 전체가 롤백되고 정상 이벤트까지 미투영. 새 Read Model 은 불필요하고, poison 이벤트 skip/dead-letter 후 catch-up 재실행이 조치. 커서를 직접 점프시키면 정상 이벤트가 유실되므로 금지.

[자료] — Docs 생성 시 파이프라인이 받은 로그·이벤트·스키마 정보
<<<자료 시작>>>
<logging_context>
## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `projection.request`(level 30) 2회, `projection.batch`(level 30) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `projection.event.mapped`(level 20) 52회, `-`(level 30) 3회, `projection.start`(level 30) 2회, `-`(level 20) 5회, `projection.map.failed`(level 50) 1회, `insert.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 54회, `projection.done`(level 30) 1회, `projection.cursor.advanced`(level 20) 1회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 13:26:07.588 | 30 | projection.request | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | - | - | projection 요청 수신 | - |
| 13:26:07.589 | 20 | - | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | - | - | 커서 조회 | projector=grip-result-projector |
| 13:26:07.589 | 30 | projection.start | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | - | - | catch-up 시작 | projector=grip-result-projector |
| 13:26:07.591 | 20 | - | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | - | - | 이벤트 조회 | - |
| 13:26:07.591 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 2 | 1 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.593 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 3 | 2 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.593 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 2 | 3 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.594 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 2 | 4 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.594 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 1 | 5 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.595 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 2 | 6 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.596 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 3 | 7 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.596 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 2 | 8 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.597 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 2 | 9 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.597 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 3 | 10 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.598 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 3 | 11 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.598 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 1 | 12 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.598 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 3 | 13 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.599 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 2 | 14 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.599 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 2 | 15 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.600 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 1 | 16 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.600 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 2 | 17 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.601 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 1 | 18 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.601 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 2 | 19 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.602 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 1 | 20 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.602 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 2 | 21 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.603 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 1 | 22 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.603 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 3 | 23 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.603 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 3 | 24 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.604 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 3 | 25 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.604 | 50 | projection.map.failed | af4516bb-9aff-4896-bc8f-87e9e45301ac | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02011 | - | - | objects 비어 있음 ← 트립 앵커 | event_id=949923ab-381a-4bf9-af3e-61583aed52c0 |
| 13:26:07.605 | 50 | db.error | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | - | - | 투영 트랜잭션 실패 | projector=grip-result-projector |
| 13:26:07.606 | 50 | - | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | - | - | grip-result map: empty objects in event 949923ab-381a-4bf9-af3e-61583aed52c0 | - |
| 13:26:07.606 | 30 | - | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | - | - | request errored | - |
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
- 문서 검사: 실패 항목 hanCharacterFree
- SQL 실행: 블록 1개 중 1개 실행 성공
- 코드 컴파일: 컴파일 대상 코드 없음

[저장소 파일 확인] — 파이프라인은 진단 도구로 저장소 소스 코드를 조회할 수 있다. Docs 가 인용한 파일 경로의 실재 여부와 앞부분 발췌이다.
- Docs 가 인용한 저장소 파일 경로 없음

[Docs] — 채점 대상 문서 전문
<<<Docs 시작>>>
---
docId: analysis-af4516bb-9aff-4896-bc8f-87e9e45301ac
generatedAt: 2026-08-11T13:26:10.252Z
targetReadModel: read_grip_result
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: null
  to: null
  affectedEndpoints: []
evidenceSources:
  - { origin: developer-logging, anchorId: "af4516bb-9aff-4896-bc8f-87e9e45301ac" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_grip_result

> 결론(TL;DR): `read_grip_result`을(를) 보강한다 — grip-result-projector catch-up 투영 중, 특정 이벤트(9499...)의 payload가 objects 배열이 비워 있어 map() 실패(poison event) 발생. 이로 인해 배치 트랜잭션 롤백 및 요청 실패. (이상 유형: 투영 정합성 위반 · 심각도: critical)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `projection.request`(level 30) 2회, `projection.batch`(level 30) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `projection.event.mapped`(level 20) 52회, `-`(level 30) 3회, `projection.start`(level 30) 2회, `-`(level 20) 5회, `projection.map.failed`(level 50) 1회, `insert.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 54회, `projection.done`(level 30) 1회, `projection.cursor.advanced`(level 20) 1회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 13:26:07.588 | 30 | projection.request | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | - | - | projection 요청 수신 | - |
| 13:26:07.589 | 20 | - | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | - | - | 커서 조회 | projector=grip-result-projector |
| 13:26:07.589 | 30 | projection.start | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | - | - | catch-up 시작 | projector=grip-result-projector |
| 13:26:07.591 | 20 | - | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | - | - | 이벤트 조회 | - |
| 13:26:07.591 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 2 | 1 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.593 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 3 | 2 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.593 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 2 | 3 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.594 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 2 | 4 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.594 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 1 | 5 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.595 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 2 | 6 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.596 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 3 | 7 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.596 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 2 | 8 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.597 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 2 | 9 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.597 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 3 | 10 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.598 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 3 | 11 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.598 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 1 | 12 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.598 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 3 | 13 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.599 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 2 | 14 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.599 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 2 | 15 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.600 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 1 | 16 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.600 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 2 | 17 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.601 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 1 | 18 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.601 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 2 | 19 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.602 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 1 | 20 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.602 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 2 | 21 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.603 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 1 | 22 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.603 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 3 | 23 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.603 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 3 | 24 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.604 | 20 | projection.event.mapped | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | 3 | 25 | 이벤트 매핑 | projector=grip-result-projector |
| 13:26:07.604 | 50 | projection.map.failed | af4516bb-9aff-4896-bc8f-87e9e45301ac | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02011 | - | - | objects 비어 있음 ← 트립 앵커 | event_id=949923ab-381a-4bf9-af3e-61583aed52c0 |
| 13:26:07.605 | 50 | db.error | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | - | - | 투영 트랜잭션 실패 | projector=grip-result-projector |
| 13:26:07.606 | 50 | - | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | - | - | grip-result map: empty objects in event 949923ab-381a-4bf9-af3e-61583aed52c0 | - |
| 13:26:07.606 | 30 | - | af4516bb-9aff-4896-bc8f-87e9e45301ac | - | - | - | request errored | - |

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
- (level 50, `projection.map.failed`) objects 비어 있음 ← 트립 앵커 → grip-result-projector의 map() 함수에서 payload.objects.length === 0 조건触发导致 투영 실패(poison event) 및 배치 트랜잭션 롤백. [corr:af4516bb-9aff-4896-bc8f-87e9e45301ac]
- (level 50, `db.error`) 투영 트랜잭션 실패 → 프로젝터 map() 함수의 throw 전파로 CatchUpRunner 가 배치 트랜잭션 롤백触发导致 요청 실패. [corr:af4516bb-9aff-4896-bc8f-87e9e45301ac]
- read_grip_result 스키마의 object_name 컬럼은 payload.objects[0].class_name을 참조. 빈 배열 시 인덱스 0 접근 오류 발생.
- grip-result.projector.ts 의 map() 함수는 if (payload.objects.length === 0) 조건에서 throw new Error(...) 을 실행. 이 예외 전파로 CatchUpRunner 가 트랜잭션 롤백을触发.
- toy-data.dto.ts 의 Zod 스키마는 objects: z.array(objectsSchema) 로 정의해 구조적 검증은 통과하나, 빈 배열 허용. 의미적 정합성 검사(checkIntegrity) 가 미구미或未 적용으로 결함 유입이 차단되지.

### Decision Drivers
- 투영 실패(poison event) 발생 시 트랜잭션 롤백 방지 및 격리 로그 생성
- Read Model 정합성 유지(빈 배열 허용 금지)
- API/스키마 변경 최소화
- 원천 데이터 수정 요청 연계

### Considered Options
#### Dead-letter Policy
- 접근: GripResultProjector.map() 함수 수정. 빈 배열 조건 시 throw new SkipProjectionError(...) 발생하고 CatchUpRunner 가 해당 에러를 포착해 격리 로그 생성 및 커서 전진.
- 제안 필드: skipEvent, isolationLog
- 트레이드오프: 기존 runner 확장이 필요, 비용 저
```typescript
if (payload.objects.length === 0) { throw new SkipProjectionError(`grip-result map: empty objects in event ${event.eventId}`); }
```

#### Integrity Check
- 접근: GripResultProjector.checkIntegrity() 구현. map() 은 Zod 통과 가정으로 빈 배열 허용, checkIntegrity() 에서 objects.length === 0 검증 실패 시 IntegrityViolation 반환.
- 제안 필드: integrityCheck
- 트레이드오프: 추가 검증 단계 오버헤드, 기존 runner 정합성 검사 연동 필요
```typescript
if (payload.objects.length === 0) { return [{ readModelName: "read_grip_result", ruleName: "objectsNotEmpty", detail: `grip-result checkIntegrity: objects array is empty for event ${event.eventId}` }]; }
```

### Decision Outcome
Dead-letter Policy

### Consequences
- (+) 트랜잭션 롤백 방지
- (+) 격리 로그 자동 생성
- (+) Read Model 정합성 유지
- (−) CatchUpRunner 확장이 필요(에러 포착 로직)
- (−) 원천 데이터 품질 저하 시 빈 배열 발생 빈도 증가

### Non-Goals
- Read Model 스키마 변경(object_name nullable 허용)
- Zod coerce/defaults 적용
- URI 매핑 보강

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### 격리(containment) SQL — 신규 Read Model DDL 불필요, 결함 데이터 무해화가 조치다

```sql
-- poison 이벤트 식별: 투영 실패를 유발한 결함 이벤트를 확인한다.
SELECT event_id, stream_id, attempt_num, global_seq FROM event_store WHERE event_id IN ('949923ab-381a-4bf9-af3e-61583aed52c0');
-- 주의: projection_cursor 를 직접 전진시키지 마라 — 배치 트랜잭션 롤백으로 poison 이전의
-- 정상 이벤트도 미투영 상태이므로, 커서 점프는 그 이벤트들을 영구 유실시킨다.
-- 조치 순서: §1 권고(결함 이벤트 skip/dead-letter 처리)를 프로젝터에 적용 → catch-up 재실행.
-- 재실행 후 검증: poison 을 제외한 미투영 이벤트가 0 이어야 한다.
SELECT count(*) AS unprojected_normal_events
FROM event_store WHERE global_seq > (SELECT last_event_seq FROM projection_cursor WHERE projector_name = 'grip-result-projector')
  AND event_id NOT IN ('949923ab-381a-4bf9-af3e-61583aed52c0');
```

## 3. API Versioning

### 버전 영향

변 변경 없음. Read Model 스키마·엔드포인트·DB 테이블 구조가 그대로 유지하며, 결함 처리는 프로젝트터 로직과 커스텀 에러 포착만 수정되므로 API 호환성 보장.

## Guardrails (constraints)

- v1 자산(테이블/엔드포인트/프로젝터 name) 무손상
- PK (scene_key, attempt_num) 유지
- TypeScript any 금지
- 식별자 전체 단어
- DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)
- Read Model 테이블명은 read_ 접두 스네이크 케이스
<<<Docs 끝>>>

[채점 루브릭] 각 항목 1~5 정수
- groundedness (근거 충실성): Docs 가 인용한 값·필드·장면 번호·로그가 [자료]에 실제로 있는가. [저장소 파일 확인]에서 실재하는 파일의 경로·스키마·메서드 인용은 근거 없는 주장으로 보지 않는다. 존재하지 않는 파일이나 발췌와 다른 내용의 인용은 감점한다. 5=인용된 값·필드·장면이 모두 자료에 실재. 3=핵심 근거는 실재하나 일부 수치·부등호가 원문과 불일치. 1=근거 없는 주장이나 존재하지 않는 값의 인용이 결론을 좌우.
- diagnosisAccuracy (원인 진단 정확성): Docs 의 진단이 [정답 요지]와 일치하는가. 5=정답 원인과 유형·위치(필드, 장면, 처리 단계)까지 일치. 3=유형은 맞으나 위치나 메커니즘이 부정확. 1=오진이거나 원인을 특정하지 못함.
- actionability (실행 가능성): Docs 의 SQL 과 절차를 그대로 따르면 문제가 해결되는가. [자동 검증 결과]를 실측으로 반영하되, 실행이 되더라도 의도와 다른 일을 하는 SQL(조건이 한 건도 맞지 않는 삭제문, 요구한 컬럼이 없는 테이블 등)은 감점한다. 기존 v1 테이블(read_grip_result, read_multimodal, event_store)을 ALTER/DROP 하면 감점. 5=그대로 따르면 해결(실행 성공 + 요구 충족). 3=오탈자·순서 등 소폭 수정 후 해결. 1=따르면 실패하거나 기존 자산이 손상.
- completeness (완결성): 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소가 모두 유효하고 서로 일치하는가(머리말·SQL 의 테이블명·권고 대상·코드가 서로 같은 것을 가리키는가). 5=세 요소가 모두 유효하고 서로 일치. 3=세 요소가 있으나 서로 어긋나거나 항목이 비어 있음. 1=요소 누락 또는 근거 부족 표시.

다음 형식의 JSON 객체 하나만 출력하라:
{"groundedness": 1-5, "diagnosisAccuracy": 1-5, "actionability": 1-5, "completeness": 1-5, "unsupportedClaims": ["자료에 없는 주장 인용 (없으면 빈 배열)"], "rationale": "각 항목 점수 근거를 항목당 1~2문장으로, 한국어로"}
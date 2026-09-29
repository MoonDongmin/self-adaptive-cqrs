당신은 이벤트 소싱 + CQRS 기반 Physical AI 데이터 플랫폼의 시니어 아키텍트이자 엄격한 평가자다. LLM 파이프라인이 [자료](로그·이벤트·스키마 정보)를 보고 [Docs]를 생성했다. Docs 는 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소를 항상 함께 담아야 하는 단일 산출물이다. 당신은 [정답 요지]와 [자료], [자동 검증 결과]를 기준으로 Docs 를 네 항목의 루브릭으로 채점한다. 채점은 관대하지 않게, 근거 없는 주장·지어낸 값·의도와 다른 SQL·서로 어긋나는 절에는 낮은 점수를 준다. 반드시 JSON 객체 하나만 출력한다. 설명문·마크다운 펜스는 출력하지 않는다.

---

[시나리오] B1-projection-map-failed
[상황] 운영 중 시스템이 치명 수준의 투영(projection) 실패 로그를 감지했다.
[정답 요지] objects 가 빈 배열인 결함(poison) 이벤트에서 GripResultProjector.map 이 예외를 던져 배치 트랜잭션 전체가 롤백되고 정상 이벤트까지 미투영. 새 Read Model 은 불필요하고, poison 이벤트 skip/dead-letter 후 catch-up 재실행이 조치. 커서를 직접 점프시키면 정상 이벤트가 유실되므로 금지.

[자료] — Docs 생성 시 파이프라인이 받은 로그·이벤트·스키마 정보
<<<자료 시작>>>
<logging_context>
## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `projection.request`(level 30) 2회, `projection.batch`(level 30) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `projection.event.mapped`(level 20) 52회, `-`(level 30) 3회, `projection.start`(level 30) 2회, `-`(level 20) 5회, `projection.map.failed`(level 50) 1회, `insert.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `db.error`(level 50) 1회, `insert.file.ok`(level 20) 54회, `projection.done`(level 30) 1회, `projection.cursor.advanced`(level 20) 1회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 21:42:59.951 | 30 | projection.request | e1d30855-b67b-4176-b703-511b818ff2ab | - | - | - | projection 요청 수신 | - |
| 21:42:59.952 | 20 | - | e1d30855-b67b-4176-b703-511b818ff2ab | - | - | - | 커서 조회 | projector=grip-result-projector |
| 21:42:59.952 | 30 | projection.start | e1d30855-b67b-4176-b703-511b818ff2ab | - | - | - | catch-up 시작 | projector=grip-result-projector |
| 21:42:59.953 | 20 | - | e1d30855-b67b-4176-b703-511b818ff2ab | - | - | - | 이벤트 조회 | - |
| 21:42:59.953 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 2 | 1 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.955 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 3 | 2 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.955 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 2 | 3 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.956 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 2 | 4 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.957 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 1 | 5 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.957 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 2 | 6 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.958 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 3 | 7 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.958 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 2 | 8 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.959 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 2 | 9 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.959 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 3 | 10 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.960 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 3 | 11 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.960 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 1 | 12 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.961 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 3 | 13 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.961 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 2 | 14 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.962 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 2 | 15 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.962 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 1 | 16 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.963 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 2 | 17 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.963 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 1 | 18 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.964 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 2 | 19 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.964 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 1 | 20 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.965 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 2 | 21 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.965 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 1 | 22 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.966 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 3 | 23 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.966 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 3 | 24 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.966 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 3 | 25 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.967 | 50 | projection.map.failed | e1d30855-b67b-4176-b703-511b818ff2ab | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02011 | - | - | objects 비어 있음 ← 트립 앵커 | event_id=5f22aa5e-c635-4cb1-ad2b-60856d1534dc |
| 21:42:59.967 | 50 | db.error | e1d30855-b67b-4176-b703-511b818ff2ab | - | - | - | 투영 트랜잭션 실패 | projector=grip-result-projector |
| 21:42:59.969 | 50 | - | e1d30855-b67b-4176-b703-511b818ff2ab | - | - | - | grip-result map: empty objects in event 5f22aa5e-c635-4cb1-ad2b-60856d1534dc | - |
| 21:42:59.969 | 30 | - | e1d30855-b67b-4176-b703-511b818ff2ab | - | - | - | request errored | - |
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
- SQL 실행: 블록 1개 중 1개 실행 성공
- 코드 컴파일: 컴파일 대상 코드 없음

[Docs] — 채점 대상 문서 전문
<<<Docs 시작>>>
---
docId: analysis-e1d30855-b67b-4176-b703-511b818ff2ab
generatedAt: 2026-08-12T21:43:07.521Z
targetReadModel: read_grip_result
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: null
  to: null
  affectedEndpoints: []
evidenceSources:
  - { origin: developer-logging, anchorId: "e1d30855-b67b-4176-b703-511b818ff2ab" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_grip_result

> 결론(TL;DR): `read_grip_result`을(를) 보강한다 — grip-result-projector 투영 중 특정 이벤트(payload.objects가 빈 배열)를 만나며 매핑 실패이 발생하고, 이로 인해 배치 트랜잭션이 롤백되며 전체 요청이 실패. (이상 유형: 요청 충족 실패 · 심각도: critical)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `projection.request`(level 30) 2회, `projection.batch`(level 30) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `projection.event.mapped`(level 20) 52회, `-`(level 30) 3회, `projection.start`(level 30) 2회, `-`(level 20) 5회, `projection.map.failed`(level 50) 1회, `insert.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `db.error`(level 50) 1회, `insert.file.ok`(level 20) 54회, `projection.done`(level 30) 1회, `projection.cursor.advanced`(level 20) 1회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 21:42:59.951 | 30 | projection.request | e1d30855-b67b-4176-b703-511b818ff2ab | - | - | - | projection 요청 수신 | - |
| 21:42:59.952 | 20 | - | e1d30855-b67b-4176-b703-511b818ff2ab | - | - | - | 커서 조회 | projector=grip-result-projector |
| 21:42:59.952 | 30 | projection.start | e1d30855-b67b-4176-b703-511b818ff2ab | - | - | - | catch-up 시작 | projector=grip-result-projector |
| 21:42:59.953 | 20 | - | e1d30855-b67b-4176-b703-511b818ff2ab | - | - | - | 이벤트 조회 | - |
| 21:42:59.953 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 2 | 1 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.955 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 3 | 2 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.955 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 2 | 3 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.956 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 2 | 4 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.957 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 1 | 5 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.957 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 2 | 6 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.958 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 3 | 7 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.958 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 2 | 8 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.959 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 2 | 9 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.959 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 3 | 10 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.960 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 3 | 11 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.960 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 1 | 12 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.961 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 3 | 13 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.961 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 2 | 14 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.962 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 2 | 15 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.962 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 1 | 16 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.963 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 2 | 17 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.963 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 1 | 18 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.964 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 2 | 19 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.964 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 1 | 20 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.965 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 2 | 21 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.965 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 1 | 22 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.966 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 3 | 23 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.966 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 3 | 24 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.966 | 20 | projection.event.mapped | e1d30855-b67b-4176-b703-511b818ff2ab | - | 3 | 25 | 이벤트 매핑 | projector=grip-result-projector |
| 21:42:59.967 | 50 | projection.map.failed | e1d30855-b67b-4176-b703-511b818ff2ab | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02011 | - | - | objects 비어 있음 ← 트립 앵커 | event_id=5f22aa5e-c635-4cb1-ad2b-60856d1534dc |
| 21:42:59.967 | 50 | db.error | e1d30855-b67b-4176-b703-511b818ff2ab | - | - | - | 투영 트랜잭션 실패 | projector=grip-result-projector |
| 21:42:59.969 | 50 | - | e1d30855-b67b-4176-b703-511b818ff2ab | - | - | - | grip-result map: empty objects in event 5f22aa5e-c635-4cb1-ad2b-60856d1534dc | - |
| 21:42:59.969 | 30 | - | e1d30855-b67b-4176-b703-511b818ff2ab | - | - | - | request errored | - |

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
- (level 50, `projection.map.failed`) objects 비어 있음 ← 트립 앵커 → read_grip_result 투영 로직이 빈 payload.objects 감지 시 throw 예외를 던지며, 이는 Read Model 의 결함 이벤트 격리/스킵 정책 부재로 인한 배치 트랜잭션 실패 유발. [corr:e1d30855-b67b-4176-b703-511b818ff2ab]
- (level 50, `db.error`) 투영 트랜잭션 실패 → Drizzle/DB 트랜잭션 롤백으로 정상 매핑된 25개 이벤트까지 함께 유실, Read Model 의 일관성 유지 실패. [corr:e1d30855-b67b-4176-b703-511b818ff2ab]
- read_grip_result 스키마의 object_name 컬럼은 payload.objects[0].class_name 을 기준으로 Primary Key (scene_key, attempt_num) 로 구성되며, 빈 배열 시 인덱스 0 접근이 undefined/에러 유발. [corr:e1d30855-b67b-4176-b703-511b818ff2ab]
- GripResultProjector.map() (src/projection/projector/grip-result.projector.ts) 의 if (payload.objects.length === 0) 조건이 throw new Error(...) 로직을 실행하며, toyDataSchema 의 objects: z.array(objectsSchema) 는 .min(1) 검증이 누락되어 Zod 거절이 아닌 런타임 예외로 처리. [corr:e1d30855-b67b-4176-b703-511b818ff2ab]
- CatchUpRunner / ProjectionService 패턴은 단일 map() 실패 시 전체 batch 트랜잭션 롤백(db.error) 을 일으키며, 격리/스킵 로직이 현재 구현되어 있지. [corr:e1d30855-b67b-4176-b703-511b818ff2ab]

### Decision Drivers
- Batch Rollback Prevention (무해화)
- Schema Stability (No change)
- Defect Value Isolation (Reject/Flag, not coerce)

### Considered Options
#### 결함 이벤트 스킵 + Dead-letter 로그 (기존 Projector 수정)
- 접근: GripResultProjector.map() 의 빈 배열 조건을 throw 대신 Dead-letter 로그 방출 및 null 반환, CatchUpRunner 가 예외/null 포착 시 batch 롤백 중단 방지.
- 제안 필드: LogAction.DEAD_LETTER, skipPolicy
- 트레이드오프: 재투영 비용 0, 스키마 무변, 단 Dead-letter 로그 증가 및 downstream null-handling 필요.
```typescript
if (payload.objects.length === 0) { this.logger.error({ action: LogAction.DEAD_LETTER, [LogContext.EVENT_ID]: event.eventId }, "objects 비어 있음 → skip"); return null; } // CatchUpRunner에서 null/예외 catch 시 continue
```

#### 원천 데이터 수정 요청 (External/Process)
- 접근: 투영 로직 유지 그대로, db.error 발생 시 API 응답 실패 처리, 별도 ETL/운영 메커니즘으로 원천 GripAttemptRecorded payload.objects 빈 배열 제거 또는 채우기 요청.
- 제안 필드: sourceValidation
- 트레이드오프: DB 트랜잭션 롤백 불가피(Driver 1 실패), Read Model 오염 방지(Driver 3 충족).

### Decision Outcome
결함 이벤트 스킵 + Dead-letter 로그 (기존 Projector 수정)

### Consequences
- (+) Batch rollback 방지, 정상 25개 이벤트 보존
- (+) 스키마·엔드포인트 무변
- (−) Dead-letter 로그 증가
- (−) downstream consumers 의 null/skip handling 추가 필요

### Non-Goals
- Read Model 구조 변경/신규 테이블 생성
- URI 매핑
- 3D 비디오 처리
- Zod schema 수정(.min(1) 적용)

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### 격리(containment) SQL — 신규 Read Model DDL 불필요, 결함 데이터 무해화가 조치다

```sql
-- poison 이벤트 식별: 투영 실패를 유발한 결함 이벤트를 확인한다.
SELECT event_id, stream_id, attempt_num, global_seq FROM event_store WHERE event_id IN ('5f22aa5e-c635-4cb1-ad2b-60856d1534dc');
-- 주의: projection_cursor 를 직접 전진시키지 마라 — 배치 트랜잭션 롤백으로 poison 이전의
-- 정상 이벤트도 미투영 상태이므로, 커서 점프는 그 이벤트들을 영구 유실시킨다.
-- 조치 순서: §1 권고(결함 이벤트 skip/dead-letter 처리)를 프로젝터에 적용 → catch-up 재실행.
-- 재실행 후 검증: poison 을 제외한 미투영 이벤트가 0 이어야 한다.
SELECT count(*) AS unprojected_normal_events
FROM event_store WHERE global_seq > (SELECT last_event_seq FROM projection_cursor WHERE projector_name = 'grip-result-projector')
  AND event_id NOT IN ('5f22aa5e-c635-4cb1-ad2b-60856d1534dc');
```

## 3. API Versioning

### 버전 영향

변 변경 없음. 스키마·엔드포인트가 불변이며, 투영 로직만 예외 처리 정책 변경(throw -> skip/log) 이므로 API contract 유지.

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
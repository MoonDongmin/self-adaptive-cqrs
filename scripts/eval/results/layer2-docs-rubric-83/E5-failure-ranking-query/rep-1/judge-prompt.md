당신은 이벤트 소싱 + CQRS 기반 Physical AI 데이터 플랫폼의 시니어 아키텍트이자 엄격한 평가자다. LLM 파이프라인이 [자료](로그·이벤트·스키마 정보)를 보고 [Docs]를 생성했다. Docs 는 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소를 항상 함께 담아야 하는 단일 산출물이다. 당신은 [정답 요지]와 [자료], [자동 검증 결과]를 기준으로 Docs 를 네 항목의 루브릭으로 채점한다. 채점은 관대하지 않게, 근거 없는 주장·지어낸 값·의도와 다른 SQL·서로 어긋나는 절에는 낮은 점수를 준다. 반드시 JSON 객체 하나만 출력한다. 설명문·마크다운 펜스는 출력하지 않는다.

---

[시나리오] E5-failure-ranking-query
[상황] 사용자가 아래 조회를 요청했으나 기존 Read Model 로는 제공할 수 없다.
[정답 요지] 사용자가 파지 실패가 많은 객체 상위 목록(객체별 실패 수·실패율, 순위)을 요청했으나 기존 Read Model 에 랭킹/집계가 없음. 조치: object_name 별 실패 수·실패율 집계 Read Model 신설 + 백필, API v2 병행.

[자료] — Docs 생성 시 파이프라인이 받은 로그·이벤트·스키마 정보
<<<자료 시작>>>
<logging_context>
## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `projection.request`(level 30) 2회, `projection.batch`(level 30) 2회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `projection.event.mapped`(level 20) 60회, `-`(level 30) 5회, `projection.start`(level 30) 2회, `-`(level 20) 6회, `insert.request`(level 30) 1회, `insight.card.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insight.card.miss`(level 40) 1회, `insert.file.ok`(level 20) 60회, `projection.done`(level 30) 2회, `projection.cursor.advanced`(level 20) 2회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 02:13:23.058 | 30 | projection.done | 299c36a1-f635-434d-a8e4-7d6a5077a695 | - | - | - | catch-up 완료 | projector=grip-result-projector |
| 02:13:23.058 | 30 | - | 299c36a1-f635-434d-a8e4-7d6a5077a695 | - | - | - | request completed | - |
| 02:13:23.058 | 30 | projection.batch | 299c36a1-f635-434d-a8e4-7d6a5077a695 | - | - | - | 배치 처리 | projector=grip-result-projector |
| 02:13:23.058 | 20 | projection.cursor.advanced | 299c36a1-f635-434d-a8e4-7d6a5077a695 | - | - | - | 커서 이동 | projector=grip-result-projector |
| 02:13:23.061 | 30 | insight.card.request | ad97f0d9-9104-443d-940b-686fc20a2274 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 02:13:23.061 | 40 | insight.card.miss | ad97f0d9-9104-443d-940b-686fc20a2274 | - | - | - | insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객체별 실패 수와 실패율을 순위대로 보고 싶다. ← 트립 앵커 | - |
| 02:13:23.061 | 30 | - | ad97f0d9-9104-443d-940b-686fc20a2274 | - | - | - | request completed | - |
| 02:13:23.365 | 30 | insight.card.request | 8ac23280-e119-4aa9-97ae-8360b3c84a66 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 02:13:23.367 | 40 | insight.card.miss | 8ac23280-e119-4aa9-97ae-8360b3c84a66 | - | - | - | insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객체별 실패 수와 실패율을 순위대로 보고 싶다. | - |
| 02:13:23.367 | 30 | - | 8ac23280-e119-4aa9-97ae-8360b3c84a66 | - | - | - | request completed | - |
| 02:13:23.672 | 30 | insight.card.request | 887d9cec-5769-43c2-b517-b5ff002c20a5 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 02:13:23.675 | 40 | insight.card.miss | 887d9cec-5769-43c2-b517-b5ff002c20a5 | - | - | - | insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객체별 실패 수와 실패율을 순위대로 보고 싶다. | - |
| 02:13:23.675 | 30 | - | 887d9cec-5769-43c2-b517-b5ff002c20a5 | - | - | - | request completed | - |
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
- SQL 실행: 블록 2개 중 1개 실행 성공 / 실패 1개: type "doubleprecision" does not exist
- 코드 컴파일: 파일 4개 중 4개 통과

[Docs] — 채점 대상 문서 전문
<<<Docs 시작>>>
---
docId: analysis-ad97f0d9-9104-443d-940b-686fc20a2274
generatedAt: 2026-08-14T02:13:25.735Z
targetReadModel: read_object_failure_aggregation
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: v1
  to: v2
  affectedEndpoints:
    - "POST /multimodal"
    - "POST /grip-result"
    - "POST /insert-all"
    - "POST /object-failure-aggregation"
evidenceSources:
  - { origin: developer-logging, anchorId: "ad97f0d9-9104-443d-940b-686fc20a2274" }
  - { origin: developer-logging, anchorId: "8ac23280-e119-4aa9-97ae-8360b3c84a66" }
  - { origin: developer-logging, anchorId: "887d9cec-5769-43c2-b517-b5ff002c20a5" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_object_failure_aggregation

> 결론(TL;DR): `read_object_failure_aggregation`을(를) 재생성한다 — 사용자는 '파지 실패가 가장 많은 객체 상위 목록'과 '객별 실패 수와 실패율'을 조회하고자 했으나, 시스템에 해당 데이터(Read Model)의 스키마/이름이 미등록되어 `insight.card.miss`를 반환했다. (이상 유형: 카드 없는 Read Model 테이블 · 심각도: warning)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `projection.request`(level 30) 2회, `projection.batch`(level 30) 2회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `projection.event.mapped`(level 20) 60회, `-`(level 30) 5회, `projection.start`(level 30) 2회, `-`(level 20) 6회, `insert.request`(level 30) 1회, `insight.card.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insight.card.miss`(level 40) 1회, `insert.file.ok`(level 20) 60회, `projection.done`(level 30) 2회, `projection.cursor.advanced`(level 20) 2회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 02:13:23.058 | 30 | projection.done | 299c36a1-f635-434d-a8e4-7d6a5077a695 | - | - | - | catch-up 완료 | projector=grip-result-projector |
| 02:13:23.058 | 30 | - | 299c36a1-f635-434d-a8e4-7d6a5077a695 | - | - | - | request completed | - |
| 02:13:23.058 | 30 | projection.batch | 299c36a1-f635-434d-a8e4-7d6a5077a695 | - | - | - | 배치 처리 | projector=grip-result-projector |
| 02:13:23.058 | 20 | projection.cursor.advanced | 299c36a1-f635-434d-a8e4-7d6a5077a695 | - | - | - | 커서 이동 | projector=grip-result-projector |
| 02:13:23.061 | 30 | insight.card.request | ad97f0d9-9104-443d-940b-686fc20a2274 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 02:13:23.061 | 40 | insight.card.miss | ad97f0d9-9104-443d-940b-686fc20a2274 | - | - | - | insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객체별 실패 수와 실패율을 순위대로 보고 싶다. ← 트립 앵커 | - |
| 02:13:23.061 | 30 | - | ad97f0d9-9104-443d-940b-686fc20a2274 | - | - | - | request completed | - |
| 02:13:23.365 | 30 | insight.card.request | 8ac23280-e119-4aa9-97ae-8360b3c84a66 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 02:13:23.367 | 40 | insight.card.miss | 8ac23280-e119-4aa9-97ae-8360b3c84a66 | - | - | - | insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객체별 실패 수와 실패율을 순위대로 보고 싶다. | - |
| 02:13:23.367 | 30 | - | 8ac23280-e119-4aa9-97ae-8360b3c84a66 | - | - | - | request completed | - |
| 02:13:23.672 | 30 | insight.card.request | 887d9cec-5769-43c2-b517-b5ff002c20a5 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 02:13:23.675 | 40 | insight.card.miss | 887d9cec-5769-43c2-b517-b5ff002c20a5 | - | - | - | insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객체별 실패 수와 실패율을 순위대로 보고 싶다. | - |
| 02:13:23.675 | 30 | - | 887d9cec-5769-43c2-b517-b5ff002c20a5 | - | - | - | request completed | - |

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
- (level 40, `insight.card.miss`) insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객별 실패 수와 실패율을 순위대로 보고 싶다. ← 트립 앵커 → 기존 Read Model의 구조적 부족(컬럼/키/모델 부재)로 집계视图가 미등록되어 insight.card.miss를 반환한다. [corr:ad97f0d9-9104-443d-940b-686fc20a2274]
- (level 40, `insight.card.miss`) insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객별 실패 수와 실패율을 순위대로 보고 싶다. → 동일 의도('파지 실패 상위 목록·실패 수/율')로 3회 반복 window, 시스템에 해당 데이터의 스키마/이름이 미등록되어 조회 실패가 지속된다. [corr:8ac23280-e119-4aa9-97ae-8360b3c84a66]
- (level 40, `insight.card.miss`) insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객별 실패 수와 실패율을 순위대로 보고 싶다. → projection.done 완료 시점 이후 insight.card.request→miss 흐름이 일관되게 발생, 기존 read_grip_result의 행 단위 시도 기록으로는 충족할 수 없음. [corr:887d9cec-5769-43c2-b517-b5ff002c20a5]
- Insight 카드 read_grip_result의 실제 컬럼명·의미는 object_name:varchar, 파지 대상 객체명 (payload.objects[0].class_name)과 grip_succeed:smallint, 파지 성공 여부 (0=실패, 1=성공)으로, 현재 Read Model이 행 단위 시도 기록만 저장하며 집계(Aggregation) 컬럼(total_attempts, success_count, failure_count, failure_rate)은 부재하다.
- src/projection/projector/grip-result.projector.ts의 map() 메서드는 이벤트 payload를 파싱하여 단일 행을 반환, objectName: payload.objects[0].class_name과 gripSucceed: payload.grip_succeed 매핑만 수행. 집계 로직이 구현되어 있어 read_object_failure_aggregation 생성이 필연하다.
- ProjectionService.catchUpAll()과 CatchUpRunner 패턴은 기존 grip-result-projector와 multimodal-projector만 등록되어, 신규 집계 프로젝터 연동 및 API 버전 관리(versionSwitch)가 미적재된 상태이다.

### Decision Drivers
- 집게 요구사항 vs 행 단위 저장
- 시스템 카탈로그 미등록(insight.card.miss)
- Query 효율성(상위-N 실패 목록)
- Schema 안정성 & API 버전 관리 정책

### Considered Options
#### 기존 보강 (신규 집계 Projector 연동)
- 접근: src/projection/projector/grip-result.projector.ts와 ProjectionService에 신규 ObjectFailureAggregationProjector 구현. map()에서 object_name 기준으로 total_attempts, success_count, failure_count 누산, upsert()의 onConflictDoUpdate로 failure_rate 재계산.
- 제안 필드: read_object_failure_aggregation.total_attempts, read_object_failure_aggregation.success_count, read_object_failure_aggregation.failure_count, read_object_failure_aggregation.failure_rate
- 트레이드오프: 기존 투영 레인 확만, DB 마이그레이션 실행 필연, API 노출을 위한 versionSwitch 동반. 리스크는 batch 처리 오버헤드 증가이나 row-level 정합성 무해화.
```typescript
// ObjectFailureAggregationProjector.map() const objectName = payload.objects[0].class_name; const succeed = payload.grip_succeed; return { objectName, totalAttempts: 1n, successCount: succeed === 1 ? 1n : 0n, failureCount: succeed === 0 ? 1n : 0n, failureRate: succeed === 1 ? 0.0 : 1.0 }; // upsert() onConflictDoUpdate set { totalAttempts: row.totalAttempts + existing.totalAttempts, successCount: row.successCount + existing.successCount, failureCount: row.failureCount + existing.failureCount, failureRate: (row.failureCount + existing.failureCount) / (row.totalAttempts + existing.totalAttempts) }
```

#### 신규 분리 (NewReadModel + Catalog Registration)
- 접근: read_object_failure_aggregation으로 완전 신독 Read Model 테이블 생성. ProjectionService.catchUpAll()에 별도 catchUpFailureAggregation() 호출 연동, InsightCardRegistry 등록으로 insight.card.miss 해소.
- 제안 필드: read_object_failure_aggregation.total_attempts, read_object_failure_aggregation.success_count, read_object_failure_aggregation.failure_count, read_object_failure_aggregation.failure_rate
- 트레이드오프: row-level projection과 aggregation decoupling, schema stability 보장. 리스크는 CatchUpRunner 커서 관리 복잡성 증가와 API version bump 필연.
```typescript
// ProjectionService.catchUpAll() const failureAggregation = await this.runner.run(this.objectFailureAggregation); return { multimodal, gripResult, failureAggregation }; // InsightCardRegistry.register({ name: "read_object_failure_aggregation", fields: [...] })
```

### Decision Outcome
newReadModel (신규 분리/보강)

### Consequences
- (+) 1. 직접 조회 지원(object_name 기준 실패 순위) 2. decoupled from attempt-level noise 3. consistent with CQRS aggregation patterns 4. insight.card.miss 해소
- (−) 1. DB table migration 필연 2. projector implementation & API version bump 3. batch projection overhead 증가

### Non-Goals
- 1. read_grip_result 스키마 확만(row-level semantics 유지) 2. zod validation failure/poison event handling(해당 결함 유형 아님) 3. sensor value message transformation modification

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

- 대상: `read_object_failure_aggregation` · 키: object_name · 원천 이벤트: GripAttemptRecorded

```sql
CREATE TABLE read_object_failure_aggregation (
  object_name varchar NOT NULL,
  total_attempts bigint,
  success_count bigint,
  failure_count bigint,
  failure_rate doublePrecision,
  PRIMARY KEY (object_name)
);
```

### 필드

```mschema
# Table: read_object_failure_aggregation
[
(object_name:varchar, 파지 대상 객체명 (payload.objects[0].class_name), 집계 키, Primary Key),
(total_attempts:bigint, 해당 object_name의 총 파지 시도 수 (누적)),
(success_count:bigint, 해당 object_name의 성공 시도 수 (누적)),
(failure_count:bigint, 해당 object_name의 실패 시도 수 (누적)),
(failure_rate:doublePrecision, 실패율 (failure_count / total_attempts, 0.0~1.0))
]
```

### 투영 매핑 명세 (이벤트 → 컬럼)

> upsert 키: object_name · 리플레이: projection_cursor 초기화 시 upsertKey(object_name) 기준 빈 테이블 생성 전제. catch-up 전체 재투영 시 동일 payload 유입으로 멱id(upsert increment) 보장해야, 기존 집계 값이 더하지 않도록 cursor 재시작 후 clean state projection 수행.

| 원천 이벤트 | payload 필드 | 컬럼 | 변환 |
| --- | --- | --- | --- |
| GripAttemptRecorded | objects[0].class_name | object_name | verbatim |

파생 컬럼(이벤트 payload 아님):
- `total_attempts` ← 누적 합 per object_name (1 per event)
- `success_count` ← 누적 합 per object_name (grip_succeed == 1 ? 1 : 0)
- `failure_count` ← 누적 합 per object_name (grip_succeed == 0 ? 1 : 0)
- `failure_rate` ← failure_count / total_attempts (clamp 0.0~1.0)

### Insight 카드 등록 (Insight Read DB 동기화)

> DDL 적용 시 아래 카드 등록도 함께 실행한다 — 다음 분석부터 신규 Read Model 이 LLM 컨텍스트에 노출된다.

```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_object_failure_aggregation', 'read_model', '집gregate(Aggregation) Read Model로 object_name별 파지 실패/성 성공 수와 실패율을 조회. 지원 사용자의 ''파지 실패 상위 목록'' 및 ''객별 실패율'' 요구사항.', 'object_name')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_object_failure_aggregation', 'object_name', 'varchar', '파지 대상 객체명 (payload.objects[0].class_name), 집계 키', 1),
  ('read_object_failure_aggregation', 'total_attempts', 'bigint', '해당 object_name의 총 파지 시도 수 (누적)', 2),
  ('read_object_failure_aggregation', 'success_count', 'bigint', '해당 object_name의 성공 시도 수 (누적)', 3),
  ('read_object_failure_aggregation', 'failure_count', 'bigint', '해당 object_name의 실패 시도 수 (누적)', 4),
  ('read_object_failure_aggregation', 'failure_rate', 'doublePrecision', '실패율 (failure_count / total_attempts, 0.0~1.0)', 5)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased (v1 → v2)

#### Added
- 신구 Read Model 테이블 read_object_failure_aggregation (PK: object_name, 집계: total_attempts/success_count/failure_count/failure_rate)
- 신구 Projector ObjectFailureAggregationProjector (map/upsert 구현, 실패비율 실시간 누적 계산)
- 신구 라우트 /projection/object-failure-aggregation (Insight 카드 조회 백엔드 지원)

### 마이그레이션 절차

- 하위호환 변경: 신구 집계 테이블·프로젝터·라우트는 기존 v1 `read_grip_result`/`grip-result-projector`/`POST /projection/grip-result` 엔드포인트를 무손단히 추가, 기존 API 응답 구조/테이블 키는 변경되지
- 파괴적 변경: 없음
- 컷오버 전 테스트: SELECT object_name, failure_count FROM read_object_failure_aggregation WHERE failure_count > 0 LIMIT 10; 확인 신규 카드를 insight.card.request 응답 시 정상 JSON 반환, 실패비율 0.0~1.0 범위 검증
- 롤백 창/조건: 신구 DB 트랜잭션 롤백: DROP TABLE IF EXISTS read_object_failure_aggregation; 제거 DI/라우트 주입; 기존 v1 grip-result-projector 재적재
- Insight 카드 등록: §2의 카드 등록 SQL을 DDL과 함께 적용(카탈로그 동기화)

### 사유·호환성

- 사유: 기존 v1 Read Model `read_grip_result`은 시도별 단건 기록만 저장하며, 객별 실패 수와 실패율 집계가 미구현되어 Insight 카드 조회가 실패했다. 신규 집계 테이블과 프로젝터를 추가해 실시간 누적 실패·비율을 계산, 기존 v1 코드는 무손단히 보존 [corr:ad97f0d9-9104-443d-940b-686fc20a2274].
- 트리거 근거: 02:13:23.061 | 40 | insight.card.miss | ad97f0d9-9104-443d-940b-686fc20a2274 | - | - | - | insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객별 실패 수와 실패율을 순위대로 보고 싶다. ← 트립 앵커 [corr:ad97f0d9-9104-443d-940b-686fc20a2274]
- v1 호환성: 신구 v2 테이블·프로젝터·라우트는 기존 v1 `read_grip_result`/`grip-result-projector`/`POST /projection/grip-result` 엔드포인트를 무손단히 추가한다. DB 스키마 확만, 기존 API 응답 구조/테이블 키는 변경되지, 동시 운영 가능 [corr:ad97f0d9-9104-443d-940b-686fc20a2274].

### 변경 파일

- `src/shared/database/schema/index.ts` (modifyFile) — 신구 스키마 export 추가. 기존 v1 export 보존.
- `src/projection/projection.service.ts` (modifyFile) — 신구 ObjectFailureAggregationProjector DI 주입, catchUpAll 메서드 확만. 기존 v1 catchUpMultimodal/catchUpGripResult 보존.
- `src/projection/projection.controller.ts` (modifyFile) — 신구 /object-failure-aggregation 라우트 추가. 기존 v1 엔드포인트 보존.

## Optional — 부속 자료(컨텍스트 축소 시 생략 가능)

### 신규 Read Model — Drizzle 스키마

```ts
import { bigint, index, pgTable, primaryKey, varchar } from 'drizzle-orm/pg-core';
import { doublePrecision } from 'drizzle-orm/pg-core';

export const readObjectFailureAggregation = pgTable(
  "read_object_failure_aggregation",
  {
    objectName: varchar("object_name").notNull(),
    totalAttempts: bigint("total_attempts", { mode: "number" }).notNull(),
    successCount: bigint("success_count", { mode: "number" }).notNull(),
    failureCount: bigint("failure_count", { mode: "number" }).notNull(),
    failureRate: doublePrecision("failure_rate").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.objectName] }),
    index("idx_failure_aggregation_rank").on(t.failureCount.desc()),
  ],
);
```

### 신규 Read Model — Projector

```ts
import { Injectable } from '@nestjs/common';
import { type InferInsertModel, sql } from 'drizzle-orm';
import { PinoLogger } from 'nestjs-pino';
import { type ToyDataDto, toyDataSchema } from '@/insert/dto/toy-data.dto';
import type { Projector } from '@/projection/projector/projector';
import type { EventStoreEventRow } from '@/projection/repository/event-store-reader.repository';
import { DrizzleTx } from '@/shared/database/drizzle.provider';
import { readObjectFailureAggregation } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

type ReadObjectFailureAggregationInsert = InferInsertModel<typeof readObjectFailureAggregation>;

@Injectable()
export class ObjectFailureAggregationProjector implements Projector<ReadObjectFailureAggregationInsert> {
  readonly name: string = "object-failure-aggregation-projector";

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(ObjectFailureAggregationProjector.name);
  }

  map(event: EventStoreEventRow): ReadObjectFailureAggregationInsert {
    let payload: ToyDataDto;
    try {
      payload = toyDataSchema.parse(event.payload);
    } catch (error) {
      this.logger.error(
        { action: LogAction.MAP_FAILED, error, [LogContext.EVENT_ID]: event.eventId },
        "이벤트 매핑 실패",
      );
      throw error;
    }

    if (payload.objects.length === 0) {
      throw new Error(`object-failure-aggregation map: empty objects in ${event.eventId}`);
    }

    const succeed = payload.grip_succeed;
    return {
      objectName: payload.objects[0].class_name,
      totalAttempts: 1,
      successCount: succeed,
      failureCount: 1 - succeed,
      failureRate: (1 - succeed) / 1.0,
    };
  }

  async upsert(tx: DrizzleTx, row: ReadObjectFailureAggregationInsert): Promise<void> {
    await tx
      .insert(readObjectFailureAggregation)
      .values(row)
      .onConflictDoUpdate({
        target: [readObjectFailureAggregation.objectName],
        set: {
          totalAttempts: sql`${readObjectFailureAggregation.totalAttempts} + ${row.totalAttempts}`,
          successCount: sql`${readObjectFailureAggregation.successCount} + ${row.successCount}`,
          failureCount: sql`${readObjectFailureAggregation.failureCount} + ${row.failureCount}`,
          failureRate: sql`(${readObjectFailureAggregation.failureCount} + ${row.failureCount}) / (${readObjectFailureAggregation.totalAttempts} + ${row.totalAttempts})`,
        },
      });
  }
}
```

### 신규 Read Model — 배선(컨트롤러/서비스/모듈)

```ts
// src/shared/database/schema/index.ts 추가 라인
export * from "./service/read-object-failure-aggregation";

// src/projection/projection.service.ts 주입 및 catchUp 메서드 추가
constructor(
  private readonly logger: PinoLogger,
  private readonly runner: CatchUpRunner,
  private readonly multimodal: MultiModalProjector,
  private readonly gripResult: GripResultProjector,
  private readonly objectFailureAggregation: ObjectFailureAggregationProjector,
  private readonly insertService: InsertService,
) {
  this.logger.setContext(ProjectionService.name);
}

catchUpObjectFailureAggregation(): Promise<ProjectionResult> {
  return this.runner.run(this.objectFailureAggregation);
}

// src/projection/projection.controller.ts 라우트 추가
@Post("/object-failure-aggregation")
objectFailureAggregation(): Promise<ProjectionResult> {
  this.logger.info(
    { action: LogAction.PROJECTION_REQUEST, [LogContext.ROUTE]: "POST /projection/object-failure-aggregation" },
    "projection 요청 수신",
  );
  return this.projectionService.catchUpObjectFailureAggregation();
}

// src/projection/projection.module.ts providers 등록 (의미)
providers: [..., ObjectFailureAggregationProjector]
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
export * from "./service/read-object-failure-aggregation";
```

### 버전 교체 코드 — `src/projection/projection.service.ts` (modifyFile)

```typescript
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { ObjectFailureAggregationProjector } from '@/projection/projector/object-failure-aggregation.projector';
import { ProjectionResult } from '@/projection/projector/projector';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';
import { LogAction } from '@/shared/logger/logging-context';

export type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
  objectFailureAggregation: ProjectionResult;
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
    private readonly objectFailureAggregation: ObjectFailureAggregationProjector,
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

  catchUpObjectFailureAggregation(): Promise<ProjectionResult> {
    return this.runner.run(this.objectFailureAggregation);
  }

  async catchUpAll(): Promise<CatchUpAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_START }, "전체 투영 시작");

    const multimodal: ProjectionResult = await this.catchUpMultimodal();
    const gripResult: ProjectionResult = await this.catchUpGripResult();
    const objectFailureAggregation: ProjectionResult = await this.catchUpObjectFailureAggregation();

    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");

    return { multimodal, gripResult, objectFailureAggregation };
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
      { action: LogAction.PROJECTION_REQUEST, [LogContext.ROUTE]: "POST /projection/multimodal" },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpMultimodal();
  }

  @Post("/grip-result")
  gripResult(): Promise<ProjectionResult> {
    this.logger.info(
      { action: LogAction.PROJECTION_REQUEST, [LogContext.ROUTE]: "POST /projection/grip-result" },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpGripResult();
  }

  @Post("/insert-all")
  insertAll(): Promise<InsertAndProjectionAllResult> {
    this.logger.info(
      { action: LogAction.PROJECTION_REQUEST, [LogContext.ROUTE]: "POST /projection/insert-all" },
      "projection 요청 수신",
    );

    return this.projectionService.insertAllAndProjectAll();
  }

  @Post("/object-failure-aggregation")
  objectFailureAggregation(): Promise<ProjectionResult> {
    this.logger.info(
      { action: LogAction.PROJECTION_REQUEST, [LogContext.ROUTE]: "POST /projection/object-failure-aggregation" },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpObjectFailureAggregation();
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
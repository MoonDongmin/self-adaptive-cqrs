---
docId: analysis-15de548c-3870-45f1-b84d-dd09d545a2ed
generatedAt: 2026-08-14T07:40:48.014Z
targetReadModel: read_grip_result
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: null
  to: null
  affectedEndpoints: []
evidenceSources:
  - { origin: developer-logging, anchorId: "15de548c-3870-45f1-b84d-dd09d545a2ed" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_grip_result

> 결론(TL;DR): `read_grip_result`을(를) 보강한다 — 배치 트랜잭션 중 특정 이벤트(`232e7e97...`)의 payload가 `objects` 배열이 비워 있어 `grip-result-projector` 매핑 실패 발생. 이로 인해 전체 배치 롤백. (이상 유형: 투영 정합성 위반 · 심각도: critical)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `projection.request`(level 30) 2회, `projection.batch`(level 30) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `projection.event.mapped`(level 20) 52회, `-`(level 30) 3회, `projection.start`(level 30) 2회, `-`(level 20) 5회, `projection.map.failed`(level 50) 1회, `insert.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `db.error`(level 50) 1회, `insert.file.ok`(level 20) 54회, `projection.done`(level 30) 1회, `projection.cursor.advanced`(level 20) 1회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 07:40:45.360 | 30 | projection.request | 15de548c-3870-45f1-b84d-dd09d545a2ed | - | - | - | projection 요청 수신 | - |
| 07:40:45.361 | 20 | - | 15de548c-3870-45f1-b84d-dd09d545a2ed | - | - | - | 커서 조회 | projector=grip-result-projector |
| 07:40:45.361 | 30 | projection.start | 15de548c-3870-45f1-b84d-dd09d545a2ed | - | - | - | catch-up 시작 | projector=grip-result-projector |
| 07:40:45.362 | 20 | - | 15de548c-3870-45f1-b84d-dd09d545a2ed | - | - | - | 이벤트 조회 | - |
| 07:40:45.363 | 20 | projection.event.mapped | 15de548c-3870-45f1-b84d-dd09d545a2ed | - | 2 | 1 | 이벤트 매핑 | projector=grip-result-projector |
| 07:40:45.364 | 20 | projection.event.mapped | 15de548c-3870-45f1-b84d-dd09d545a2ed | - | 3 | 2 | 이벤트 매핑 | projector=grip-result-projector |
| 07:40:45.365 | 20 | projection.event.mapped | 15de548c-3870-45f1-b84d-dd09d545a2ed | - | 2 | 3 | 이벤트 매핑 | projector=grip-result-projector |
| 07:40:45.365 | 20 | projection.event.mapped | 15de548c-3870-45f1-b84d-dd09d545a2ed | - | 2 | 4 | 이벤트 매핑 | projector=grip-result-projector |
| 07:40:45.366 | 20 | projection.event.mapped | 15de548c-3870-45f1-b84d-dd09d545a2ed | - | 1 | 5 | 이벤트 매핑 | projector=grip-result-projector |
| 07:40:45.366 | 20 | projection.event.mapped | 15de548c-3870-45f1-b84d-dd09d545a2ed | - | 2 | 6 | 이벤트 매핑 | projector=grip-result-projector |
| 07:40:45.367 | 20 | projection.event.mapped | 15de548c-3870-45f1-b84d-dd09d545a2ed | - | 3 | 7 | 이벤트 매핑 | projector=grip-result-projector |
| 07:40:45.368 | 20 | projection.event.mapped | 15de548c-3870-45f1-b84d-dd09d545a2ed | - | 2 | 8 | 이벤트 매핑 | projector=grip-result-projector |
| 07:40:45.368 | 20 | projection.event.mapped | 15de548c-3870-45f1-b84d-dd09d545a2ed | - | 2 | 9 | 이벤트 매핑 | projector=grip-result-projector |
| 07:40:45.369 | 20 | projection.event.mapped | 15de548c-3870-45f1-b84d-dd09d545a2ed | - | 3 | 10 | 이벤트 매핑 | projector=grip-result-projector |
| 07:40:45.369 | 20 | projection.event.mapped | 15de548c-3870-45f1-b84d-dd09d545a2ed | - | 3 | 11 | 이벤트 매핑 | projector=grip-result-projector |
| 07:40:45.369 | 20 | projection.event.mapped | 15de548c-3870-45f1-b84d-dd09d545a2ed | - | 1 | 12 | 이벤트 매핑 | projector=grip-result-projector |
| 07:40:45.370 | 20 | projection.event.mapped | 15de548c-3870-45f1-b84d-dd09d545a2ed | - | 3 | 13 | 이벤트 매핑 | projector=grip-result-projector |
| 07:40:45.370 | 20 | projection.event.mapped | 15de548c-3870-45f1-b84d-dd09d545a2ed | - | 2 | 14 | 이벤트 매핑 | projector=grip-result-projector |
| 07:40:45.371 | 20 | projection.event.mapped | 15de548c-3870-45f1-b84d-dd09d545a2ed | - | 2 | 15 | 이벤트 매핑 | projector=grip-result-projector |
| 07:40:45.371 | 20 | projection.event.mapped | 15de548c-3870-45f1-b84d-dd09d545a2ed | - | 1 | 16 | 이벤트 매핑 | projector=grip-result-projector |
| 07:40:45.371 | 20 | projection.event.mapped | 15de548c-3870-45f1-b84d-dd09d545a2ed | - | 2 | 17 | 이벤트 매핑 | projector=grip-result-projector |
| 07:40:45.372 | 20 | projection.event.mapped | 15de548c-3870-45f1-b84d-dd09d545a2ed | - | 1 | 18 | 이벤트 매핑 | projector=grip-result-projector |
| 07:40:45.372 | 20 | projection.event.mapped | 15de548c-3870-45f1-b84d-dd09d545a2ed | - | 2 | 19 | 이벤트 매핑 | projector=grip-result-projector |
| 07:40:45.373 | 20 | projection.event.mapped | 15de548c-3870-45f1-b84d-dd09d545a2ed | - | 1 | 20 | 이벤트 매핑 | projector=grip-result-projector |
| 07:40:45.373 | 20 | projection.event.mapped | 15de548c-3870-45f1-b84d-dd09d545a2ed | - | 2 | 21 | 이벤트 매핑 | projector=grip-result-projector |
| 07:40:45.374 | 20 | projection.event.mapped | 15de548c-3870-45f1-b84d-dd09d545a2ed | - | 1 | 22 | 이벤트 매핑 | projector=grip-result-projector |
| 07:40:45.374 | 20 | projection.event.mapped | 15de548c-3870-45f1-b84d-dd09d545a2ed | - | 3 | 23 | 이벤트 매핑 | projector=grip-result-projector |
| 07:40:45.374 | 20 | projection.event.mapped | 15de548c-3870-45f1-b84d-dd09d545a2ed | - | 3 | 24 | 이벤트 매핑 | projector=grip-result-projector |
| 07:40:45.375 | 20 | projection.event.mapped | 15de548c-3870-45f1-b84d-dd09d545a2ed | - | 3 | 25 | 이벤트 매핑 | projector=grip-result-projector |
| 07:40:45.375 | 50 | projection.map.failed | 15de548c-3870-45f1-b84d-dd09d545a2ed | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02011 | - | - | objects 비어 있음 ← 트립 앵커 | event_id=232e7e97-2e91-4920-bd94-e6a98c2d6272 |
| 07:40:45.375 | 50 | db.error | 15de548c-3870-45f1-b84d-dd09d545a2ed | - | - | - | 투영 트랜잭션 실패 | projector=grip-result-projector |
| 07:40:45.377 | 50 | - | 15de548c-3870-45f1-b84d-dd09d545a2ed | - | - | - | grip-result map: empty objects in event 232e7e97-2e91-4920-bd94-e6a98c2d6272 | - |
| 07:40:45.377 | 30 | - | 15de548c-3870-45f1-b84d-dd09d545a2ed | - | - | - | request errored | - |

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
- (level 50, `projection.map.failed`) objects 비어 있음 ← 트립 앵커 → GripResultProjector.map()에서 objects 배열 공검 검 실패로 투영 파이프라인 에러 발생 [corr:15de548c-3870-45f1-b84d-dd09d545a2ed]
- (level 50, `db.error`) 투영 트랜잭션 실패 → 동전 throw 에러로 배치 트랜잭션 롤백 정책이 전체 정상 매핑도 차단함 [corr:15de548c-3870-45f1-b84d-dd09d545a2ed]
- (level 50, `-`) grip-result map: empty objects in event 232e7e97-2e91-4920-bd94-e6a98c2d6272 → 결함 이벤트 식별 로그로 원천 payload 구조적 공검이 투영 실패 원인 확인됨 [corr:15de548c-3870-45f1-b84d-dd09d545a2ed]
- read_grip_result 스키마의 object_name 컬럼은 payload.objects[0].class_name 을 소스로, objects 배열이 공검일 경우 매핑 로직이 실패 전 단계 [corr:15de548c-3870-45f1-b84d-dd09d545a2ed]
- src/projection/projector/grip-result.projector.ts map() 메소드에서 if (payload.objects.length === 0) 조건이 throw new Error(...) 로 동전 에러 발생, 현재 배치 트랜잭션 롤백 정책이 정상 이벤트까지 미투영 상태 [corr:15de548c-3870-45f1-b84d-dd09d545a2ed]
- 기존 projector 가 결함 payload(공검 objects) 에 대한 dead-letter/skip 정책 이 결결, poison event 식별·검증 격리 수단 미적재 [corr:15de548c-3870-45f1-b84d-dd09d545a2ed]

### Decision Drivers
- batch isolation policy(정상 이벤트 보존)
- defect event handling vs poison rollback
- schema stability(기존 Read Model 컬럼·의미 유지)
- operational cost(per-row overhead)

### Considered Options
#### deadLetterSkip
- 접근: GripResultProjector.map() 수정으로 동전 에러 대신 dead-letter marker(throw specific error) 반환, ProjectionService/Runner 가 catch block 에서 로그 남기고 skip 처리
- 제안 필드: map() return type adaptation, runner/service catch block
- 트레이드오프: 서비스 레이어 adapter 필요, but zero DB overhead for defect rows; normal events batch progress 보장
```typescript
if (payload.objects.length === 0) { this.logger.error({ action: LogAction.MAP_FAILED, [LogContext.EVENT_ID]: event.eventId }, "objects 비어 있음 ← dead-letter"); throw new Error("DEAD_LETTER_SKIP"); }
```

#### integrityViolationCheck
- 접근: GripResultProjector.checkIntegrity() 구현 추가하여 objects.length > 0 검증, violation list 반환 대신 throw
- 제안 필드: checkIntegrity method, runner integrity log handler
- 트레이드오프: per-row validation overhead 추가, but safer semantic check; batch rollback 차단 via runner skip
```typescript
if (payload.objects.length === 0) { return [{ readModelName: "read_grip_result", ruleName: "objectsNotEmpty", affectedColumns: ["object_name"], observedValue: "[]", expected: "length > 0", detail: "objects 배열 공검" }]; }
```

### Decision Outcome
deadLetterSkip

### Consequences
- (+) poison event 격리·로그
- (+) normal events batch progress 재개
- (+) schema/endpoint 불변
- (−) runner/service catch block adapter 필요
- (−) 원천 payload 수정 요청 발생

### Non-Goals
- read_grip_result 스키마 변경
- newReadModel 생성
- versionSwitch 연계
- z.coerce/기본값 치환 권고

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### 격리(containment) SQL — 신규 Read Model DDL 불필요, 결함 데이터 무해화가 조치다

```sql
-- poison 이벤트 식별: 투영 실패를 유발한 결함 이벤트를 확인한다.
SELECT event_id, stream_id, attempt_num, global_seq FROM event_store WHERE event_id IN ('232e7e97-2e91-4920-bd94-e6a98c2d6272');
-- 주의: projection_cursor 를 직접 전진시키지 마라 — 배치 트랜잭션 롤백으로 poison 이전의
-- 정상 이벤트도 미투영 상태이므로, 커서 점프는 그 이벤트들을 영구 유실시킨다.
-- 조치 순서: §1 권고(결함 이벤트 skip/dead-letter 처리)를 프로젝터에 적용 → catch-up 재실행.
-- 재실행 후 검증: poison 을 제외한 미투영 이벤트가 0 이어야 한다.
SELECT count(*) AS unprojected_normal_events
FROM event_store WHERE global_seq > (SELECT last_event_seq FROM projection_cursor WHERE projector_name = 'grip-result-projector')
  AND event_id NOT IN ('232e7e97-2e91-4920-bd94-e6a98c2d6272');
```

## 3. API Versioning

### 버전 영향

변 변경 없음. Dead-letter skip policy is internal projection logic; read_grip_result schema and /projection/grip-result endpoint signatures remain identical, preserving backward compatibility.

## Guardrails (constraints)

- v1 자산(테이블/엔드포인트/프로젝터 name) 무손상
- PK (scene_key, attempt_num) 유지
- TypeScript any 금지
- 식별자 전체 단어
- DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)
- Read Model 테이블명은 read_ 접두 스네이크 케이스
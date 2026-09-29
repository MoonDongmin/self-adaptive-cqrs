---
docId: analysis-c8ded58a-84c5-4e63-98dc-b1abd489eaeb
generatedAt: 2026-08-11T14:27:53.250Z
targetReadModel: read_multimodal
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: null
  to: null
  affectedEndpoints: []
evidenceSources:
  - { origin: developer-logging, anchorId: "c8ded58a-84c5-4e63-98dc-b1abd489eaeb" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_multimodal

> 결론(TL;DR): `read_multimodal`을(를) 보강한다 — 프로젝션 정합성 검사에서 파일명 메타데이터와 이벤트 키(scene_key/attempt_num) 불일치 감지 2회, 배치 처리는 정상 완료. (이상 유형: 투영 정합성 위반 · 심각도: critical)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `projection.request`(level 30) 1회, `projection.batch`(level 30) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `projection.event.mapped`(level 20) 27회, `-`(level 30) 3회, `projection.start`(level 30) 1회, `-`(level 20) 3회, `insert.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 54회, `projection.done`(level 30) 1회, `projection.cursor.advanced`(level 20) 1회, `projection.integrity.violation`(level 50) 2회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 14:27:50.640 | 30 | projection.request | c8ded58a-84c5-4e63-98dc-b1abd489eaeb | - | - | - | projection 요청 수신 | - |
| 14:27:50.642 | 20 | - | c8ded58a-84c5-4e63-98dc-b1abd489eaeb | - | - | - | 커서 조회 | projector=multimodal-projector |
| 14:27:50.642 | 30 | projection.start | c8ded58a-84c5-4e63-98dc-b1abd489eaeb | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 14:27:50.644 | 20 | - | c8ded58a-84c5-4e63-98dc-b1abd489eaeb | - | - | - | 이벤트 조회 | - |
| 14:27:50.644 | 20 | projection.event.mapped | c8ded58a-84c5-4e63-98dc-b1abd489eaeb | - | 3 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 14:27:50.645 | 20 | projection.event.mapped | c8ded58a-84c5-4e63-98dc-b1abd489eaeb | - | 1 | 2 | 이벤트 매핑 | projector=multimodal-projector |
| 14:27:50.646 | 20 | projection.event.mapped | c8ded58a-84c5-4e63-98dc-b1abd489eaeb | - | 1 | 3 | 이벤트 매핑 | projector=multimodal-projector |
| 14:27:50.646 | 20 | projection.event.mapped | c8ded58a-84c5-4e63-98dc-b1abd489eaeb | - | 3 | 4 | 이벤트 매핑 | projector=multimodal-projector |
| 14:27:50.647 | 20 | projection.event.mapped | c8ded58a-84c5-4e63-98dc-b1abd489eaeb | - | 2 | 6 | 이벤트 매핑 | projector=multimodal-projector |
| 14:27:50.647 | 20 | projection.event.mapped | c8ded58a-84c5-4e63-98dc-b1abd489eaeb | - | 1 | 5 | 이벤트 매핑 | projector=multimodal-projector |
| 14:27:50.647 | 20 | projection.event.mapped | c8ded58a-84c5-4e63-98dc-b1abd489eaeb | - | 3 | 7 | 이벤트 매핑 | projector=multimodal-projector |
| 14:27:50.648 | 20 | projection.event.mapped | c8ded58a-84c5-4e63-98dc-b1abd489eaeb | - | 2 | 8 | 이벤트 매핑 | projector=multimodal-projector |
| 14:27:50.648 | 20 | projection.event.mapped | c8ded58a-84c5-4e63-98dc-b1abd489eaeb | - | 2 | 9 | 이벤트 매핑 | projector=multimodal-projector |
| 14:27:50.649 | 20 | projection.event.mapped | c8ded58a-84c5-4e63-98dc-b1abd489eaeb | - | 2 | 10 | 이벤트 매핑 | projector=multimodal-projector |
| 14:27:50.649 | 20 | projection.event.mapped | c8ded58a-84c5-4e63-98dc-b1abd489eaeb | - | 2 | 11 | 이벤트 매핑 | projector=multimodal-projector |
| 14:27:50.649 | 20 | projection.event.mapped | c8ded58a-84c5-4e63-98dc-b1abd489eaeb | - | 3 | 12 | 이벤트 매핑 | projector=multimodal-projector |
| 14:27:50.650 | 20 | projection.event.mapped | c8ded58a-84c5-4e63-98dc-b1abd489eaeb | - | 1 | 13 | 이벤트 매핑 | projector=multimodal-projector |
| 14:27:50.650 | 20 | projection.event.mapped | c8ded58a-84c5-4e63-98dc-b1abd489eaeb | - | 3 | 14 | 이벤트 매핑 | projector=multimodal-projector |
| 14:27:50.651 | 20 | projection.event.mapped | c8ded58a-84c5-4e63-98dc-b1abd489eaeb | - | 2 | 16 | 이벤트 매핑 | projector=multimodal-projector |
| 14:27:50.651 | 20 | projection.event.mapped | c8ded58a-84c5-4e63-98dc-b1abd489eaeb | - | 3 | 15 | 이벤트 매핑 | projector=multimodal-projector |
| 14:27:50.652 | 20 | projection.event.mapped | c8ded58a-84c5-4e63-98dc-b1abd489eaeb | - | 2 | 17 | 이벤트 매핑 | projector=multimodal-projector |
| 14:27:50.653 | 20 | projection.event.mapped | c8ded58a-84c5-4e63-98dc-b1abd489eaeb | - | 2 | 18 | 이벤트 매핑 | projector=multimodal-projector |
| 14:27:50.653 | 20 | projection.event.mapped | c8ded58a-84c5-4e63-98dc-b1abd489eaeb | - | 1 | 19 | 이벤트 매핑 | projector=multimodal-projector |
| 14:27:50.653 | 20 | projection.event.mapped | c8ded58a-84c5-4e63-98dc-b1abd489eaeb | - | 1 | 20 | 이벤트 매핑 | projector=multimodal-projector |
| 14:27:50.654 | 20 | projection.event.mapped | c8ded58a-84c5-4e63-98dc-b1abd489eaeb | - | 2 | 21 | 이벤트 매핑 | projector=multimodal-projector |
| 14:27:50.654 | 20 | projection.event.mapped | c8ded58a-84c5-4e63-98dc-b1abd489eaeb | - | 3 | 22 | 이벤트 매핑 | projector=multimodal-projector |
| 14:27:50.655 | 20 | projection.event.mapped | c8ded58a-84c5-4e63-98dc-b1abd489eaeb | - | 2 | 23 | 이벤트 매핑 | projector=multimodal-projector |
| 14:27:50.655 | 20 | projection.event.mapped | c8ded58a-84c5-4e63-98dc-b1abd489eaeb | - | 1 | 24 | 이벤트 매핑 | projector=multimodal-projector |
| 14:27:50.656 | 20 | projection.event.mapped | c8ded58a-84c5-4e63-98dc-b1abd489eaeb | - | 1 | 25 | 이벤트 매핑 | projector=multimodal-projector |
| 14:27:50.656 | 20 | projection.event.mapped | c8ded58a-84c5-4e63-98dc-b1abd489eaeb | - | 1 | 26 | 이벤트 매핑 | projector=multimodal-projector |
| 14:27:50.656 | 20 | projection.event.mapped | c8ded58a-84c5-4e63-98dc-b1abd489eaeb | - | 1 | 27 | 이벤트 매핑 | projector=multimodal-projector |
| 14:27:50.658 | 20 | - | c8ded58a-84c5-4e63-98dc-b1abd489eaeb | - | - | - | 커서 갱신 | projector=multimodal-projector |
| 14:27:50.659 | 50 | projection.integrity.violation | c8ded58a-84c5-4e63-98dc-b1abd489eaeb | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02026 | 1 | 26 | read_multimodal 정합성 위반[modalFileNameAttemptConsistency]: 2D 이미지 파일명의 attempt(02)가 이 행의 권위 attempt(01)와 불일치 — 다른 시도의 미디어가 scene_key=반려동물용품_CR01_강아지공룡알장난감_02026 행에 매핑됨. column=image_2d_file_name, observed="반려동물용품_CR01_강아지공룡알장난감_02026_02_20230923.jpg". ← 트립 앵커 | projector=multimodal-projector |
| 14:27:50.659 | 50 | projection.integrity.violation | c8ded58a-84c5-4e63-98dc-b1abd489eaeb | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02027 | 1 | 27 | read_multimodal 정합성 위반[modalFileNameSceneConsistency]: 비디오 파일명의 scene(09999)이 scene_key(02027)와 불일치 — 다른 장면의 미디어가 매핑됨. column=video_file_name, observed="반려동물용품_CR01_강아지공룡알장난감_09999_00_20230923.mp4". | projector=multimodal-projector |
| 14:27:50.659 | 30 | projection.batch | c8ded58a-84c5-4e63-98dc-b1abd489eaeb | - | - | - | 배치 처리 | projector=multimodal-projector |
| 14:27:50.659 | 20 | projection.cursor.advanced | c8ded58a-84c5-4e63-98dc-b1abd489eaeb | - | - | - | 커서 이동 | projector=multimodal-projector |
| 14:27:50.659 | 30 | projection.done | c8ded58a-84c5-4e63-98dc-b1abd489eaeb | - | - | - | catch-up 완료 | projector=multimodal-projector |
| 14:27:50.659 | 30 | - | c8ded58a-84c5-4e63-98dc-b1abd489eaeb | - | - | - | request completed | - |
| 14:27:50.661 | 30 | projection.request | 550fac5b-7244-4885-8856-c43d58c45c3a | - | - | - | projection 요청 수신 | - |
| 14:27:50.662 | 20 | - | 550fac5b-7244-4885-8856-c43d58c45c3a | - | - | - | 커서 조회 | projector=grip-result-projector |
| 14:27:50.662 | 30 | projection.start | 550fac5b-7244-4885-8856-c43d58c45c3a | - | - | - | catch-up 시작 | projector=grip-result-projector |
| 14:27:50.663 | 20 | projection.event.mapped | 550fac5b-7244-4885-8856-c43d58c45c3a | - | 3 | 1 | 이벤트 매핑 | projector=grip-result-projector |
| 14:27:50.663 | 20 | - | 550fac5b-7244-4885-8856-c43d58c45c3a | - | - | - | 이벤트 조회 | - |
| 14:27:50.665 | 20 | projection.event.mapped | 550fac5b-7244-4885-8856-c43d58c45c3a | - | 1 | 2 | 이벤트 매핑 | projector=grip-result-projector |

</logging_context>

<insight_read_db>

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
- (level 50, `projection.integrity.violation`) read_multimodal 정합성 위반[modalFileNameAttemptConsistency]: 2D 이미지 파일명의 attempt(02)가 이 행의 권위 attempt(01)와 불일치 — 다른 시도의 미디어가 scene_key=반려동물용품_CR01_강아지공룡알장난감_02026 행에 매핑됨. column=image_2d_file_name, observed="반려동물용품_CR01_강아지공룡알장난감_02026_02_20230923.jpg". ← 트립 앵커 → 2D 이미지 파일명 attempt(02)와 event 키 attempt(01) 불일치로, 원천 데이터 메타데이터 일관성 위가 Read Model image_2d_file_name 컬럼에 오염된 값이 투영됨. [corr:c8ded58a-84c5-4e63-98dc-b1abd489eaeb]
- (level 50, `projection.integrity.violation`) read_multimodal 정합성 위반[modalFileNameSceneConsistency]: 비디오 파일명의 scene(09999)이 scene_key(02027)과 불일치 — 다른 장면의 미디어가 매핑됨. column=video_file_name, observed="반려동물용품_CR01_강아지공룡알장난감_09999_00_20230923.mp4". → 비디오 파일명 scene(09999)과 event 키 scene_key(02027) 불일치로, 원천 데이터 메타데이터 일관성 위가 Read Model video_file_name 컬럼에 다른 장면의 미디어 링크가 투영됨. [corr:c8ded58a-84c5-4e63-98dc-b1abd489eaeb]
- Insight 카드 read_multimodal 스키마는 (scene_key:varchar, attempt_num:smallint) 이 Primary Key 이며, image_2d_file_name, video_file_name 은 원천 파일명 컬럼이다 [corr:c8ded58a-84c5-4e63-98dc-b1abd489eaeb].
- src/projection/projector/multimodal.projector.ts 의 checkIntegrity 메소드 는 정규표식(MODAL_FILE_NAME_RE, SCENE_KEY_NUM_RE) 로 파일명/scene_key 를 파싱 후 parsed.attemptNum !== modal.expectedAttempt 및 parsed.sceneNum !== expectedSceneNum 조건으로 위반을 감지 [corr:c8ded58a-84c5-4e63-98dc-b1abd489eaeb].
- 현재 CatchUpRunner 패턴은 map() -> upsert() -> checkIntegrity() 순차로, 이미 투영된 행에 대해 정합성 검사를 후-적재로 수행. Zod(toyDataSchema) 는 string 타입 통과해 구조 검증은 실패하지 않으나, 의미적 값 오류(메타데이터 일관성 위) 로 인해 Read Model 에 오염 데이터가 영구 체우 [corr:c8ded58a-84c5-4e63-98dc-b1abd489eaeb].
- image_2d_uri, video_uri 는 현재 projector 가 null 로 둠, 이는 구조적 부족이 아님. 문제는 원천 payload 의 파일명 메타데이터가 event key(stream_id, attempt_num) 와 불치 [corr:c8ded58a-84c5-4e63-98dc-b1abd489eaeb].

### Decision Drivers
- 원천 데이터 메타데이터 일관성 위(소스 payload vs event key mismatch)
- Read Model 정합성 검사 로직 적용 시 이미 투영된 행 오염 방지
- Zod 통과로 구조 검증만으로는 부족함
- API/Schema 변경 최소화 유지

### Considered Options
#### Existing Reinforcement (Projector Logic Adjustment & DB Purge)
- 접근: MultiModalProjector.map() 로직 조정. 파일명 파싱 전 event.attemptNum/scene_key 일치 검증 수행, 실패 시 throw error 로 CatchUpRunner 가 배치 트랜잭션 롤백 처리. 기존 오염 행은 containment SQL 로 DELETE.
- 제안 필드: skipOnIntegrityViolation
- 트레이드오프: 재투영 비용 0(기존 DB 정화), 리스크는 catch-up 커서 관리 복잡성 증가
```typescript
const parsed2d = parseModalFileName(payload["2D_image_file_name"]); if (parsed2d !== null && parsed2d.attemptNum !== event.attemptNum) { throw new Error(`metadata mismatch: 2D attempt ${parsed2d.attemptNum} vs event ${event.attemptNum}`); }; const sceneKeyMatch = SCENE_KEY_NUM_RE.exec(event.streamId.replace(/^grip-attempt:/, "")); const expectedSceneNum = sceneKeyMatch?.[1]; if (parsed2d !== null && parsed2d.sceneNum !== expectedSceneNum) { throw new Error(`metadata mismatch: 2D scene ${parsed2d.sceneNum} vs event ${expectedSceneNum}`); };
```

#### Audit Table Separation
- 접근: audit_multimodal_integrity 테이블 추가, checkIntegrity 실패 시 INSERT violation record instead of DELETE.
- 제안 필드: auditTable
- 트레이드오프: storage overhead 증가, query complexity 상승, but provenance preserved
```typescript
// src/projection/runner/catch-up.runner.ts (violation handling)
```

### Decision Outcome
Existing Reinforcement (Projector Logic Adjustment & DB Purge)

### Consequences
- (+) Read Model 정합성 보장
- (+) 오염 데이터 영구 유출 차단
- (+) API/Schema 호환 유지
- (−) Catch-up 커서 관리 로직 복잡성 증가
- (−) 원천 payload 수정 요청 필요(외 시스템 영향)

### Non-Goals
- Zod schema 변경(coerce/default)
- URI 매핑 구현
- 새로운 Read Model 테이블 생성

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### 격리(containment) SQL — 신규 Read Model DDL 불필요, 결함 데이터 무해화가 조치다

```sql
DELETE FROM read_multimodal WHERE (stream_id = 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02026' AND attempt_num = 1) OR (stream_id = 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02027' AND attempt_num = 1);
```

## 3. API Versioning

### 버전 영향

변장 없음. Read Model 스키마와 API 엔드포인트가 그대로 유지하며, 본 권고는 오직 원천 데이터 정합성 검사 로직 조정과 DB 격리 조치가 수행될 뿐.

## Guardrails (constraints)

- v1 자산(테이블/엔드포인트/프로젝터 name) 무손상
- PK (scene_key, attempt_num) 유지
- TypeScript any 금지
- 식별자 전체 단어
- DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)
- Read Model 테이블명은 read_ 접두 스네이크 케이스
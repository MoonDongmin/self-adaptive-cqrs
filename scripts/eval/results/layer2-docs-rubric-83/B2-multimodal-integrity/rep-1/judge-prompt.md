당신은 이벤트 소싱 + CQRS 기반 Physical AI 데이터 플랫폼의 시니어 아키텍트이자 엄격한 평가자다. LLM 파이프라인이 [자료](로그·이벤트·스키마 정보)를 보고 [Docs]를 생성했다. Docs 는 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소를 항상 함께 담아야 하는 단일 산출물이다. 당신은 [정답 요지]와 [자료], [자동 검증 결과]를 기준으로 Docs 를 네 항목의 루브릭으로 채점한다. 채점은 관대하지 않게, 근거 없는 주장·지어낸 값·의도와 다른 SQL·서로 어긋나는 절에는 낮은 점수를 준다. 반드시 JSON 객체 하나만 출력한다. 설명문·마크다운 펜스는 출력하지 않는다.

---

[시나리오] B2-multimodal-integrity
[상황] 운영 중 시스템이 Read Model 정합성 위반(projection.integrity.violation) 로그를 감지했다.
[정답 요지] 모달 파일명(image/video)의 scene/attempt 가 레코드 좌표와 불일치. zod·투영은 통과하지만 read_multimodal 정합성 검사가 잡음. 조치: 불일치 행 식별·격리(플래그 Read Model 또는 정합성 검증 테이블), v1 무손상.

[자료] — Docs 생성 시 파이프라인이 받은 로그·이벤트·스키마 정보
<<<자료 시작>>>
<logging_context>
## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `projection.request`(level 30) 1회, `projection.batch`(level 30) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `projection.event.mapped`(level 20) 27회, `-`(level 30) 3회, `projection.start`(level 30) 1회, `-`(level 20) 3회, `insert.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 54회, `projection.done`(level 30) 1회, `projection.cursor.advanced`(level 20) 1회, `projection.integrity.violation`(level 50) 2회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 12:53:49.698 | 30 | projection.request | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | - | - | projection 요청 수신 | - |
| 12:53:49.700 | 20 | - | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | - | - | 커서 조회 | projector=multimodal-projector |
| 12:53:49.700 | 30 | projection.start | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 12:53:49.702 | 20 | - | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | - | - | 이벤트 조회 | - |
| 12:53:49.702 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 3 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.703 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 1 | 2 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.704 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 1 | 3 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.704 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 3 | 4 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.705 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 2 | 6 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.705 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 1 | 5 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.706 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 3 | 7 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.706 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 2 | 8 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.707 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 2 | 9 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.707 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 2 | 10 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.707 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 2 | 11 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.708 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 3 | 12 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.708 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 1 | 13 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.709 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 3 | 14 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.710 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 2 | 16 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.710 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 3 | 15 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.711 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 2 | 17 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.711 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 2 | 18 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.711 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 1 | 19 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.712 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 1 | 20 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.712 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 2 | 21 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.713 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 3 | 22 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.713 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 2 | 23 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.714 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 1 | 24 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.714 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 1 | 25 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.714 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 1 | 26 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.715 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 1 | 27 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.716 | 20 | - | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | - | - | 커서 갱신 | projector=multimodal-projector |
| 12:53:49.717 | 50 | projection.integrity.violation | d3ef57fe-0022-4a04-91be-5ffe32868419 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02026 | 1 | 26 | read_multimodal 정합성 위반[modalFileNameAttemptConsistency]: 2D 이미지 파일명의 attempt(02)가 이 행의 권위 attempt(01)와 불일치 — 다른 시도의 미디어가 scene_key=반려동물용품_CR01_강아지공룡알장난감_02026 행에 매핑됨. column=image_2d_file_name, observed="반려동물용품_CR01_강아지공룡알장난감_02026_02_20230923.jpg". ← 트립 앵커 | projector=multimodal-projector |
| 12:53:49.717 | 50 | projection.integrity.violation | d3ef57fe-0022-4a04-91be-5ffe32868419 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02027 | 1 | 27 | read_multimodal 정합성 위반[modalFileNameSceneConsistency]: 비디오 파일명의 scene(09999)이 scene_key(02027)와 불일치 — 다른 장면의 미디어가 매핑됨. column=video_file_name, observed="반려동물용품_CR01_강아지공룡알장난감_09999_00_20230923.mp4". | projector=multimodal-projector |
| 12:53:49.717 | 30 | projection.batch | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | - | - | 배치 처리 | projector=multimodal-projector |
| 12:53:49.717 | 20 | projection.cursor.advanced | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | - | - | 커서 이동 | projector=multimodal-projector |
| 12:53:49.717 | 30 | projection.done | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | - | - | catch-up 완료 | projector=multimodal-projector |
| 12:53:49.717 | 30 | - | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | - | - | request completed | - |
| 12:53:49.719 | 30 | projection.request | abce692f-df96-4d7c-ab63-148c53c6f36b | - | - | - | projection 요청 수신 | - |
| 12:53:49.720 | 30 | projection.start | abce692f-df96-4d7c-ab63-148c53c6f36b | - | - | - | catch-up 시작 | projector=grip-result-projector |
| 12:53:49.720 | 20 | - | abce692f-df96-4d7c-ab63-148c53c6f36b | - | - | - | 커서 조회 | projector=grip-result-projector |
| 12:53:49.721 | 20 | - | abce692f-df96-4d7c-ab63-148c53c6f36b | - | - | - | 이벤트 조회 | - |
| 12:53:49.722 | 20 | projection.event.mapped | abce692f-df96-4d7c-ab63-148c53c6f36b | - | 3 | 1 | 이벤트 매핑 | projector=grip-result-projector |
| 12:53:49.724 | 20 | projection.event.mapped | abce692f-df96-4d7c-ab63-148c53c6f36b | - | 1 | 2 | 이벤트 매핑 | projector=grip-result-projector |
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
<<<자료 끝>>>

[자동 검증 결과] — 실제 데이터베이스 실행·컴파일 결과. 실행 가능성 판단의 실측 근거로 삼는다.
- 문서 검사: 전 항목 통과
- SQL 실행: 블록 1개 중 1개 실행 성공
- 코드 컴파일: 컴파일 대상 코드 없음

[Docs] — 채점 대상 문서 전문
<<<Docs 시작>>>
---
docId: analysis-d3ef57fe-0022-4a04-91be-5ffe32868419
generatedAt: 2026-08-10T12:53:52.517Z
targetReadModel: read_multimodal
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: null
  to: null
  affectedEndpoints: []
evidenceSources:
  - { origin: developer-logging, anchorId: "d3ef57fe-0022-4a04-91be-5ffe32868419" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_multimodal

> 결론(TL;DR): `read_multimodal`을(를) 보강한다 — multimodal-projector 투영 중 read_multimodal Read Model 매핑 과정에서 파일명-메타데이터 정합성 위배가 감지되어 에러 로그를 남겼으나 배치 처리는 계속 진행됨. (이상 유형: 투영 정합성 위반 · 심각도: critical)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `projection.request`(level 30) 1회, `projection.batch`(level 30) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `projection.event.mapped`(level 20) 27회, `-`(level 30) 3회, `projection.start`(level 30) 1회, `-`(level 20) 3회, `insert.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 54회, `projection.done`(level 30) 1회, `projection.cursor.advanced`(level 20) 1회, `projection.integrity.violation`(level 50) 2회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 12:53:49.698 | 30 | projection.request | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | - | - | projection 요청 수신 | - |
| 12:53:49.700 | 20 | - | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | - | - | 커서 조회 | projector=multimodal-projector |
| 12:53:49.700 | 30 | projection.start | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 12:53:49.702 | 20 | - | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | - | - | 이벤트 조회 | - |
| 12:53:49.702 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 3 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.703 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 1 | 2 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.704 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 1 | 3 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.704 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 3 | 4 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.705 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 2 | 6 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.705 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 1 | 5 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.706 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 3 | 7 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.706 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 2 | 8 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.707 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 2 | 9 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.707 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 2 | 10 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.707 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 2 | 11 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.708 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 3 | 12 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.708 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 1 | 13 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.709 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 3 | 14 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.710 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 2 | 16 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.710 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 3 | 15 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.711 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 2 | 17 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.711 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 2 | 18 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.711 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 1 | 19 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.712 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 1 | 20 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.712 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 2 | 21 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.713 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 3 | 22 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.713 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 2 | 23 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.714 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 1 | 24 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.714 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 1 | 25 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.714 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 1 | 26 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.715 | 20 | projection.event.mapped | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | 1 | 27 | 이벤트 매핑 | projector=multimodal-projector |
| 12:53:49.716 | 20 | - | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | - | - | 커서 갱신 | projector=multimodal-projector |
| 12:53:49.717 | 50 | projection.integrity.violation | d3ef57fe-0022-4a04-91be-5ffe32868419 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02026 | 1 | 26 | read_multimodal 정합성 위반[modalFileNameAttemptConsistency]: 2D 이미지 파일명의 attempt(02)가 이 행의 권위 attempt(01)와 불일치 — 다른 시도의 미디어가 scene_key=반려동물용품_CR01_강아지공룡알장난감_02026 행에 매핑됨. column=image_2d_file_name, observed="반려동물용품_CR01_강아지공룡알장난감_02026_02_20230923.jpg". ← 트립 앵커 | projector=multimodal-projector |
| 12:53:49.717 | 50 | projection.integrity.violation | d3ef57fe-0022-4a04-91be-5ffe32868419 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02027 | 1 | 27 | read_multimodal 정합성 위반[modalFileNameSceneConsistency]: 비디오 파일명의 scene(09999)이 scene_key(02027)와 불일치 — 다른 장면의 미디어가 매핑됨. column=video_file_name, observed="반려동물용품_CR01_강아지공룡알장난감_09999_00_20230923.mp4". | projector=multimodal-projector |
| 12:53:49.717 | 30 | projection.batch | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | - | - | 배치 처리 | projector=multimodal-projector |
| 12:53:49.717 | 20 | projection.cursor.advanced | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | - | - | 커서 이동 | projector=multimodal-projector |
| 12:53:49.717 | 30 | projection.done | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | - | - | catch-up 완료 | projector=multimodal-projector |
| 12:53:49.717 | 30 | - | d3ef57fe-0022-4a04-91be-5ffe32868419 | - | - | - | request completed | - |
| 12:53:49.719 | 30 | projection.request | abce692f-df96-4d7c-ab63-148c53c6f36b | - | - | - | projection 요청 수신 | - |
| 12:53:49.720 | 30 | projection.start | abce692f-df96-4d7c-ab63-148c53c6f36b | - | - | - | catch-up 시작 | projector=grip-result-projector |
| 12:53:49.720 | 20 | - | abce692f-df96-4d7c-ab63-148c53c6f36b | - | - | - | 커서 조회 | projector=grip-result-projector |
| 12:53:49.721 | 20 | - | abce692f-df96-4d7c-ab63-148c53c6f36b | - | - | - | 이벤트 조회 | - |
| 12:53:49.722 | 20 | projection.event.mapped | abce692f-df96-4d7c-ab63-148c53c6f36b | - | 3 | 1 | 이벤트 매핑 | projector=grip-result-projector |
| 12:53:49.724 | 20 | projection.event.mapped | abce692f-df96-4d7c-ab63-148c53c6f36b | - | 1 | 2 | 이벤트 매핑 | projector=grip-result-projector |

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
- (level 50, `projection.integrity.violation`) read_multimodal 정합성 위반[modalFileNameAttemptConsistency]: 2D 이미지 파일명의 attempt(02)가 이 행의 권위 attempt(01)와 불일치 — 다른 시도의 미디어가 scene_key=반려동물용품_CR01_강아지공룡알장난감_02026 행에 매핑됨. column=image_2d_file_name, observed="반려동물용품_CR01_강아지공룡알장난감_02026_02_20230923.jpg". → 현재 read_multimodal 투영 파이프라인은 checkIntegrity 위반 감지 시 배치 처리를 계속 진행, 결함(payload) 데이터가 Read Model 컬럼(image_2d_file_name)에 무해화되지 그대로 유입되어 정합성 위배 누수 발생. [corr:d3ef57fe-0022-4a04-91be-5ffe32868419] [corr:d3ef57fe-0022-4a04-91be-5ffe32868419]
- (level 50, `projection.integrity.violation`) read_multimodal 정합성 위반[modalFileNameSceneConsistency]: 비디오 파일명의 scene(09999)이 scene_key(02027)과 불일치 — 다른 장면의 미디어가 매핑됨. column=video_file_name, observed="반려동물용품_CR01_강아지공룡알장난감_09999_00_20230923.mp4". → 동일 correlation_id에서 video_file_name 컬럼도 scene_key(02027)와 payload scene(09999) 불일치로, poison event가 Read Model 정합성 규칙을 위배하며 배치 트랜잭션이 무해화되지 그대로 committed. [corr:d3ef57fe-0022-4a04-91be-5ffe32868419] [corr:d3ef57fe-0022-4a04-91be-5ffe32868419]
- read_multimodal 스키마의 image_2d_file_name과 video_file_name은 원천 payload 매핑 소스(multimodal.projector.ts map 함수)에서 payload["2D_image_file_name"]/payload.video_file_name 할당 시 event metadata(event.attemptNum, event.streamId.replace(/^grip-attempt:/, ""))와의 정합성 검증이 선행되지. [corr:d3ef57fe-0022-4a04-91be-5ffe32868419]
- MultiModalProjector.checkIntegrity 구현은 위반 객체(IntegrityViolation[])를 반환하지만 ProjectionService 및 CatchUpRunner 연동 로직에서 이 배열을 무시하거나 로그만 방출, upsert 호출은 무조건 실행됨. [corr:d3ef57fe-0022-4a04-91be-5ffe32868419]
- 결함 데이터는 원천 payload의 file_name 필드 값이 row metadata(scene_key, attempt_num)와 불일치하는 poison event이므로 Read Model 구조 변경이나 API 버전 교체가 부적합하며, 매핑 실패 시 skip+격리 정책 강화가 필수. [corr:d3ef57fe-0022-4a04-91be-5ffe32868419]

### Decision Drivers
- Read Model 정합성 위반 차단(오류 데이터 유입 금지)
- 배치 트랜잭션 무해화(skip) 유지(롤백 방지)
- 원천 데이터 고증 준수(값 변조/coercion 금지)

### Considered Options
#### 기존 보강(map 검증 강화 및 무해화)
- 접근: MultiModalProjector.map 내 payload 매핑 시 event.attemptNum과 parsed attempt, sceneKey와 parsed scene 일치 확인. 실패 시 throw PoisonEventError로 CatchUpRunner가 skip 처리 유도.
- 제안 필드: map 함수 early-return/throw 로직, PoisonEventError 정의
- 트레이드오프: 재투영 비용 미미(early validation), 배치 트랜잭션 무해화(skip) 유지, Read Model 오염 차단, 리스크 downstream scene_key 누락 관리 필요
```typescript
const parsed = parseModalFileName(payload["2D_image_file_name"]); if (parsed && parsed.attemptNum !== event.attemptNum) { throw new Error(`PoisonEvent: attempt mismatch ${event.eventId}`); } const sceneKeyMatch = SCENE_KEY_NUM_RE.exec(event.streamId.replace(/^grip-attempt:/, "")); if (sceneKeyMatch && parsed.sceneNum !== sceneKeyMatch[1]) { throw new Error(`PoisonEvent: scene mismatch ${event.eventId}`); }
```

#### 대안(기각 대안) - Containment Flag Insertion
- 접근: read_multimodal 스키마에 isPoisonEvent boolean 추가, violation 시 true 플래그 삽입.
- 제안 필드: isPoisonEvent 컬럼, upsert flag 매핑
- 트레이드오프: Driver 1(Read Model 정합성 유지) 실패(오류 데이터 유입 허용), Driver 2(배치 무해화) 실패(롤백/정리 작업 필요)

### Decision Outcome
기존 보강(map 검증 강화 및 무해화)

### Consequences
- (+) Read Model 컬럼(image_2d_file_name, video_file_name) 오염 데이터 유입 차단
- (+) integrity violation 로그 actionable으로 downstream 정립/거절 요청 유도
- (−) poisoned event batch 처리 pause/skip 발생
- (−) downstream consumer(예: sensor value observer)에서 해당 scene_key/attempt_num 누락 현장 관리 필요

### Non-Goals
- Read Model 스키마 구조 변경
- API endpoint/version 교체
- 결함 값 z.coerce/기본값 치환으로 정상값 변조

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### 격리(containment) SQL — 신규 Read Model DDL 불필요, 결함 데이터 무해화가 조치다

```sql
SELECT event_id, stream_id, attempt_num, global_seq FROM event_store WHERE (stream_id = 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02026' AND global_seq = 26) OR (stream_id = 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02027' AND global_seq = 27);
```

## 3. API Versioning

### 버전 영향

변 변경 없음. Read Model 스키마와 projection 엔드포인트(POST /projection/multimodal)가 불변이며, 내부 MultiModalProjector.map 검증 정책 강화만 적용되어 API 호환성 유지.

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
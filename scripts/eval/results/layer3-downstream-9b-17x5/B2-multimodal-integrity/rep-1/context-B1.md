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
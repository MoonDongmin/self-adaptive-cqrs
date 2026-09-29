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
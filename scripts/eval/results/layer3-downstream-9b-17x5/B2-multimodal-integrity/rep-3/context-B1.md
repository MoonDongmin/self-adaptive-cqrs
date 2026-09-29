<logging_context>
## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `projection.request`(level 30) 1회, `projection.batch`(level 30) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `projection.event.mapped`(level 20) 27회, `-`(level 30) 2회, `projection.start`(level 30) 1회, `-`(level 20) 3회, `insert.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 54회, `projection.done`(level 30) 1회, `projection.cursor.advanced`(level 20) 1회, `projection.integrity.violation`(level 50) 2회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 04:38:47.268 | 30 | projection.request | 2e0ba5d4-c224-4a0e-9ab8-f169471f7bca | - | - | - | projection 요청 수신 | - |
| 04:38:47.269 | 20 | - | 2e0ba5d4-c224-4a0e-9ab8-f169471f7bca | - | - | - | 커서 조회 | projector=multimodal-projector |
| 04:38:47.269 | 30 | projection.start | 2e0ba5d4-c224-4a0e-9ab8-f169471f7bca | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 04:38:47.271 | 20 | - | 2e0ba5d4-c224-4a0e-9ab8-f169471f7bca | - | - | - | 이벤트 조회 | - |
| 04:38:47.271 | 20 | projection.event.mapped | 2e0ba5d4-c224-4a0e-9ab8-f169471f7bca | - | 3 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 04:38:47.273 | 20 | projection.event.mapped | 2e0ba5d4-c224-4a0e-9ab8-f169471f7bca | - | 1 | 3 | 이벤트 매핑 | projector=multimodal-projector |
| 04:38:47.273 | 20 | projection.event.mapped | 2e0ba5d4-c224-4a0e-9ab8-f169471f7bca | - | 1 | 2 | 이벤트 매핑 | projector=multimodal-projector |
| 04:38:47.274 | 20 | projection.event.mapped | 2e0ba5d4-c224-4a0e-9ab8-f169471f7bca | - | 3 | 4 | 이벤트 매핑 | projector=multimodal-projector |
| 04:38:47.274 | 20 | projection.event.mapped | 2e0ba5d4-c224-4a0e-9ab8-f169471f7bca | - | 1 | 5 | 이벤트 매핑 | projector=multimodal-projector |
| 04:38:47.275 | 20 | projection.event.mapped | 2e0ba5d4-c224-4a0e-9ab8-f169471f7bca | - | 2 | 6 | 이벤트 매핑 | projector=multimodal-projector |
| 04:38:47.275 | 20 | projection.event.mapped | 2e0ba5d4-c224-4a0e-9ab8-f169471f7bca | - | 3 | 7 | 이벤트 매핑 | projector=multimodal-projector |
| 04:38:47.276 | 20 | projection.event.mapped | 2e0ba5d4-c224-4a0e-9ab8-f169471f7bca | - | 2 | 8 | 이벤트 매핑 | projector=multimodal-projector |
| 04:38:47.276 | 20 | projection.event.mapped | 2e0ba5d4-c224-4a0e-9ab8-f169471f7bca | - | 2 | 9 | 이벤트 매핑 | projector=multimodal-projector |
| 04:38:47.276 | 20 | projection.event.mapped | 2e0ba5d4-c224-4a0e-9ab8-f169471f7bca | - | 2 | 10 | 이벤트 매핑 | projector=multimodal-projector |
| 04:38:47.277 | 20 | projection.event.mapped | 2e0ba5d4-c224-4a0e-9ab8-f169471f7bca | - | 2 | 11 | 이벤트 매핑 | projector=multimodal-projector |
| 04:38:47.277 | 20 | projection.event.mapped | 2e0ba5d4-c224-4a0e-9ab8-f169471f7bca | - | 3 | 12 | 이벤트 매핑 | projector=multimodal-projector |
| 04:38:47.278 | 20 | projection.event.mapped | 2e0ba5d4-c224-4a0e-9ab8-f169471f7bca | - | 1 | 13 | 이벤트 매핑 | projector=multimodal-projector |
| 04:38:47.278 | 20 | projection.event.mapped | 2e0ba5d4-c224-4a0e-9ab8-f169471f7bca | - | 3 | 14 | 이벤트 매핑 | projector=multimodal-projector |
| 04:38:47.279 | 20 | projection.event.mapped | 2e0ba5d4-c224-4a0e-9ab8-f169471f7bca | - | 3 | 15 | 이벤트 매핑 | projector=multimodal-projector |
| 04:38:47.280 | 20 | projection.event.mapped | 2e0ba5d4-c224-4a0e-9ab8-f169471f7bca | - | 2 | 16 | 이벤트 매핑 | projector=multimodal-projector |
| 04:38:47.280 | 20 | projection.event.mapped | 2e0ba5d4-c224-4a0e-9ab8-f169471f7bca | - | 2 | 17 | 이벤트 매핑 | projector=multimodal-projector |
| 04:38:47.280 | 20 | projection.event.mapped | 2e0ba5d4-c224-4a0e-9ab8-f169471f7bca | - | 2 | 18 | 이벤트 매핑 | projector=multimodal-projector |
| 04:38:47.281 | 20 | projection.event.mapped | 2e0ba5d4-c224-4a0e-9ab8-f169471f7bca | - | 1 | 19 | 이벤트 매핑 | projector=multimodal-projector |
| 04:38:47.281 | 20 | projection.event.mapped | 2e0ba5d4-c224-4a0e-9ab8-f169471f7bca | - | 1 | 20 | 이벤트 매핑 | projector=multimodal-projector |
| 04:38:47.282 | 20 | projection.event.mapped | 2e0ba5d4-c224-4a0e-9ab8-f169471f7bca | - | 2 | 21 | 이벤트 매핑 | projector=multimodal-projector |
| 04:38:47.282 | 20 | projection.event.mapped | 2e0ba5d4-c224-4a0e-9ab8-f169471f7bca | - | 3 | 22 | 이벤트 매핑 | projector=multimodal-projector |
| 04:38:47.283 | 20 | projection.event.mapped | 2e0ba5d4-c224-4a0e-9ab8-f169471f7bca | - | 2 | 23 | 이벤트 매핑 | projector=multimodal-projector |
| 04:38:47.283 | 20 | projection.event.mapped | 2e0ba5d4-c224-4a0e-9ab8-f169471f7bca | - | 1 | 24 | 이벤트 매핑 | projector=multimodal-projector |
| 04:38:47.283 | 20 | projection.event.mapped | 2e0ba5d4-c224-4a0e-9ab8-f169471f7bca | - | 1 | 25 | 이벤트 매핑 | projector=multimodal-projector |
| 04:38:47.284 | 20 | projection.event.mapped | 2e0ba5d4-c224-4a0e-9ab8-f169471f7bca | - | 1 | 26 | 이벤트 매핑 | projector=multimodal-projector |
| 04:38:47.284 | 20 | projection.event.mapped | 2e0ba5d4-c224-4a0e-9ab8-f169471f7bca | - | 1 | 27 | 이벤트 매핑 | projector=multimodal-projector |
| 04:38:47.285 | 20 | - | 2e0ba5d4-c224-4a0e-9ab8-f169471f7bca | - | - | - | 커서 갱신 | projector=multimodal-projector |
| 04:38:47.286 | 50 | projection.integrity.violation | 2e0ba5d4-c224-4a0e-9ab8-f169471f7bca | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02026 | 1 | 26 | read_multimodal 정합성 위반[modalFileNameAttemptConsistency]: 2D 이미지 파일명의 attempt(02)가 이 행의 권위 attempt(01)와 불일치 — 다른 시도의 미디어가 scene_key=반려동물용품_CR01_강아지공룡알장난감_02026 행에 매핑됨. column=image_2d_file_name, observed="반려동물용품_CR01_강아지공룡알장난감_02026_02_20230923.jpg". ← 트립 앵커 | projector=multimodal-projector |
| 04:38:47.286 | 50 | projection.integrity.violation | 2e0ba5d4-c224-4a0e-9ab8-f169471f7bca | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02027 | 1 | 27 | read_multimodal 정합성 위반[modalFileNameSceneConsistency]: 비디오 파일명의 scene(09999)이 scene_key(02027)와 불일치 — 다른 장면의 미디어가 매핑됨. column=video_file_name, observed="반려동물용품_CR01_강아지공룡알장난감_09999_00_20230923.mp4". | projector=multimodal-projector |
| 04:38:47.286 | 30 | projection.batch | 2e0ba5d4-c224-4a0e-9ab8-f169471f7bca | - | - | - | 배치 처리 | projector=multimodal-projector |
| 04:38:47.286 | 20 | projection.cursor.advanced | 2e0ba5d4-c224-4a0e-9ab8-f169471f7bca | - | - | - | 커서 이동 | projector=multimodal-projector |
| 04:38:47.286 | 30 | projection.done | 2e0ba5d4-c224-4a0e-9ab8-f169471f7bca | - | - | - | catch-up 완료 | projector=multimodal-projector |
| 04:38:47.287 | 30 | - | 2e0ba5d4-c224-4a0e-9ab8-f169471f7bca | - | - | - | request completed | - |
| 04:38:47.287 | 30 | projection.request | 87957621-c0e6-4461-8d40-33f1a79b532b | - | - | - | projection 요청 수신 | - |
| 04:38:47.288 | 20 | - | 87957621-c0e6-4461-8d40-33f1a79b532b | - | - | - | 커서 조회 | projector=grip-result-projector |
| 04:38:47.288 | 30 | projection.start | 87957621-c0e6-4461-8d40-33f1a79b532b | - | - | - | catch-up 시작 | projector=grip-result-projector |
| 04:38:47.289 | 20 | - | 87957621-c0e6-4461-8d40-33f1a79b532b | - | - | - | 이벤트 조회 | - |
| 04:38:47.290 | 20 | projection.event.mapped | 87957621-c0e6-4461-8d40-33f1a79b532b | - | 3 | 1 | 이벤트 매핑 | projector=grip-result-projector |
| 04:38:47.292 | 20 | projection.event.mapped | 87957621-c0e6-4461-8d40-33f1a79b532b | - | 1 | 3 | 이벤트 매핑 | projector=grip-result-projector |
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
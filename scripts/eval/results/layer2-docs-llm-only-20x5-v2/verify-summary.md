# 층2 확장 본평가 v2 요약 — 20종 × k5 (2026-08-15 17:23:30)

- 시나리오: v1 과 동일 20종, llm-only, 로컬 LLM. TS 합성 파이프라인 수정본 적용
- 캠페인 종료 코드: 0

## 결정론 검증 (verify-layer2-docs)
```
시나리오별 결정론 검증 요약:
  A1-payload-drift             런  6개  전항목통과 5/6  평균 98%
  A10-null-intrinsic-param     런 10개  전항목통과 10/10  평균 100%
  A2-type-mismatch             런  5개  전항목통과 5/5  평균 100%
  A3-missing-field             런  6개  전항목통과 3/6  평균 92%
  A4-physical-impossible       런  6개  전항목통과 2/6  평균 69%
  A5-consistency-violation     런  5개  전항목통과 5/5  평균 100%
  A6-depth-jump                런  8개  전항목통과 5/8  평균 88%
  A7-grip-depth-underflow      런  6개  전항목통과 4/6  평균 94%
  A8-translation-x-violation   런  5개  전항목통과 4/5  평균 98%
  A9-non-integer-id            런  8개  전항목통과 8/8  평균 100%
  B1-projection-map-failed     런  6개  전항목통과 4/6  평균 96%
  B2-multimodal-integrity      런 11개  전항목통과 9/11  평균 93%
  E1-new-column-query          런  6개  전항목통과 6/6  평균 100%
  E2-new-aggregate-query       런  6개  전항목통과 6/6  평균 100%
  E3-new-join-query            런  6개  전항목통과 4/6  평균 96%
  E4-time-series-query         런  6개  전항목통과 6/6  평균 100%
  E5-failure-ranking-query     런  6개  전항목통과 5/6  평균 98%
  F2-normal-retry              런  5개  전항목통과 5/5  평균 100%
  F3-subthreshold-jump         런  5개  전항목통과 4/5  평균 88%
  F5-all-normal                런  5개  전항목통과 5/5  평균 100%

체크 실패 상세:
  A1-payload-drift/rep-2 2026-08-11-093753-ef7a97a0-1c26-4340-a290-c7a592943c87.md → 부분 통과 [hanCharacterFree]
  A3-missing-field/rep-2 2026-08-11-111114-3ba90822-befc-4fd2-8b42-db20df148c65.md → 부분 통과 [sufficientEvidence, sqlFilled]
  A3-missing-field/rep-3 2026-08-12-045628-0e0dc39b-7edd-41f0-8a85-de26b45d9ba1.md → 부분 통과 [hanCharacterFree]
  A3-missing-field/rep-4 2026-08-12-191007-b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d.md → 부분 통과 [hanCharacterFree]
  A4-physical-impossible/rep-2 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_00263.md → 부분 통과 [hanCharacterFree]
  A4-physical-impossible/rep-2 2026-08-11-114613-bc3eef4f-8c1c-4e21-80b4-25f7b6fd547e.md → 부분 통과 [sufficientEvidence, verdictNotNoAction, recommendationFilled, sqlFilled, versioningFilled]
  A4-physical-impossible/rep-3 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_00263.md → 부분 통과 [hanCharacterFree]
  A4-physical-impossible/rep-5 - → 실패(문서 미생성) []
  A6-depth-jump/rep-4 2026-08-12-233018-4f1b8ff2-f6c9-48e2-859f-d68c4033de2c.md → 부분 통과 [sufficientEvidence, verdictNotNoAction, recommendationFilled, sqlFilled, versioningFilled, grounding]
  A6-depth-jump/rep-5 2026-08-13-162539-b644c2b3-3e79-492d-8b76-0e059a6256cc.md → 부분 통과 [grounding]
  A6-depth-jump/rep-5 2026-08-13-162705-ab5e3f8f-ed5f-4d66-9fc6-abd5bbc6d816.md → 부분 통과 [grounding]
  A7-grip-depth-underflow/rep-2 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_02018.md → 부분 통과 [sufficientEvidence, sqlFilled]
  A7-grip-depth-underflow/rep-3 2026-08-12-093547-891cf814-a8d4-4f89-bd60-93ad94c33b75.md → 부분 통과 [grounding]
  A8-translation-x-violation/rep-1 2023-10-10-090000-반려동물용품_CR01_강아지공룡알장난감_02020.md → 부분 통과 [hanCharacterFree]
  B1-projection-map-failed/rep-1 2026-08-11-070644-174fa59a-162c-48c4-8164-1df4dc278f24.md → 부분 통과 [hanCharacterFree]
  B1-projection-map-failed/rep-2 2026-08-11-222607-af4516bb-9aff-4896-bc8f-87e9e45301ac.md → 부분 통과 [hanCharacterFree]
  B2-multimodal-integrity/rep-1 2023-10-10-090000-반려동물용품_CR01_강아지공룡알장난감_00431.md → 부분 통과 [hanCharacterFree]
  B2-multimodal-integrity/rep-5 2026-08-15-163847-background.md → 부분 통과 [sufficientEvidence, verdictNotNoAction, recommendationFilled, sqlFilled, versioningFilled]
  E3-new-join-query/rep-2 2026-08-12-021512-7be30198-dc16-4d70-bc4a-78aa5d654ff9.md → 부분 통과 [hanCharacterFree]
  E3-new-join-query/rep-3 2026-08-12-160018-ab2f93e1-c6ca-4376-89bf-58e370e2183c.md → 부분 통과 [hanCharacterFree]
  E5-failure-ranking-query/rep-1 2026-08-14-111323-ad97f0d9-9104-443d-940b-686fc20a2274.md → 부분 통과 [hanCharacterFree]
  F3-subthreshold-jump/rep-1 2026-08-11-091910-2f469340-d009-4e23-bffa-6686bb4fde00.md → 오탐(정상 시나리오에서 문서 생성) [sufficientEvidence, verdictNotNoAction, recommendationFilled, sqlFilled, versioningFilled]

결과 저장: scripts/eval/results/layer2-docs-llm-only-20x5-v2/verification-2026-08-15T08-23-30-781Z.json
```

## SQL 실행 가능성 (verify-layer2-sql)
```
Docs SQL 적용 가능성 검증:
  ✓ A1-payload-drift/rep-1 2026-08-11-003828-50eed889-a94b-4d1b-af92-63a4888e32ea.md — SQL 블록 2/2 실행 가능
  ✓ A1-payload-drift/rep-2 2026-08-11-093753-ef7a97a0-1c26-4340-a290-c7a592943c87.md — SQL 블록 2/2 실행 가능
  ✗ A1-payload-drift/rep-2 2026-08-11-093854-87bd35ba-2e75-4237-b47d-ed7159086612.md — SQL 블록 1/2 실행 가능
      블록[0] CREATE TABLE read_camera_metadata_v2 (
        → type "double_precision" does not exist
  ✓ A1-payload-drift/rep-3 2026-08-12-035813-e18ec5e8-31f8-42c6-b105-533fdc7373ad.md — SQL 블록 2/2 실행 가능
  ✓ A1-payload-drift/rep-4 2026-08-14-180140-cd4a7d38-b8ae-47c0-b30d-a05f7531ed66.md — SQL 블록 2/2 실행 가능
  ✓ A1-payload-drift/rep-5 2026-08-13-121715-ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8.md — SQL 블록 2/2 실행 가능
  ✓ A10-null-intrinsic-param/rep-1 2023-10-10-090000-반려동물용품_CR01_강아지공룡알장난감_00340.md — SQL 블록 2/2 실행 가능
  ✓ A10-null-intrinsic-param/rep-1 2026-08-11-052002-56eff07e-bd6f-4df2-957c-6c0521b1a3e9.md — SQL 블록 1/1 실행 가능
  ✓ A10-null-intrinsic-param/rep-2 2023-10-10-090000-반려동물용품_CR01_강아지공룡알장난감_00340.md — SQL 블록 5/5 실행 가능
  ✓ A10-null-intrinsic-param/rep-2 2026-08-14-134331-416d5c44-4f0f-4a2a-bcdb-285a7f908cf3.md — SQL 블록 1/1 실행 가능
  ✓ A10-null-intrinsic-param/rep-3 2023-10-10-090000-반려동물용품_CR01_강아지공룡알장난감_00340.md — SQL 블록 2/2 실행 가능
  ✓ A10-null-intrinsic-param/rep-3 2026-08-12-115250-bff8a490-1e5c-42d5-9cd5-2e0d0ab60238.md — SQL 블록 1/1 실행 가능
  ✓ A10-null-intrinsic-param/rep-4 2023-10-10-090000-반려동물용품_CR01_강아지공룡알장난감_00340.md — SQL 블록 5/5 실행 가능 (순서 의존 1개 — 뒤 DDL 선행 시 유효)
  ✓ A10-null-intrinsic-param/rep-4 2026-08-13-050835-bfa4a659-ddb6-4039-a2c1-1ed7eca0a83d.md — SQL 블록 1/1 실행 가능
  ✓ A10-null-intrinsic-param/rep-5 2023-10-10-090000-반려동물용품_CR01_강아지공룡알장난감_00340.md — SQL 블록 2/2 실행 가능
  ✓ A10-null-intrinsic-param/rep-5 2026-08-15-031523-991f7605-5256-4d4d-a029-fe5ae0cb9662.md — SQL 블록 1/1 실행 가능
  ✓ A2-type-mismatch/rep-1 2026-08-11-010821-3e1426e4-85dd-41c3-aa39-04c9e140fdad.md — SQL 블록 1/1 실행 가능
  ✓ A2-type-mismatch/rep-2 2026-08-11-104910-4714dd7b-ed3a-4520-be3e-818c082b6086.md — SQL 블록 1/1 실행 가능
  ✓ A2-type-mismatch/rep-3 2026-08-12-044046-ac26991b-9f8d-4831-b386-957e1b997958.md — SQL 블록 1/1 실행 가능
  ✓ A2-type-mismatch/rep-4 2026-08-12-185842-0069e24d-fc33-4d71-84a0-4aeab4ae354b.md — SQL 블록 1/1 실행 가능
  ✓ A2-type-mismatch/rep-5 2026-08-13-124823-64cfdb18-ddbd-4492-95a4-9a350e21c3b7.md — SQL 블록 1/1 실행 가능
  ✓ A3-missing-field/rep-1 2026-08-11-011837-f8148686-8f42-4e6f-bd96-71f8891488dc.md — SQL 블록 1/1 실행 가능
  ✓ A3-missing-field/rep-2 2026-08-11-110657-1ec6c565-8522-4ec8-92ab-5a071d776fbe.md — SQL 블록 1/1 실행 가능
  ✓ A3-missing-field/rep-2 2026-08-11-111114-3ba90822-befc-4fd2-8b42-db20df148c65.md — SQL 블록 0/0 실행 가능
  ✓ A3-missing-field/rep-3 2026-08-12-045628-0e0dc39b-7edd-41f0-8a85-de26b45d9ba1.md — SQL 블록 1/1 실행 가능
  ✓ A3-missing-field/rep-4 2026-08-12-191007-b70bf9ab-4b8e-43d5-ba32-5ff1c63c022d.md — SQL 블록 1/1 실행 가능
  ✓ A3-missing-field/rep-5 2026-08-13-131055-eeaa2cfe-1424-4957-8ebc-2219e32dcae2.md — SQL 블록 1/1 실행 가능
  ✓ A4-physical-impossible/rep-1 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_00263.md — SQL 블록 4/4 실행 가능
  ✓ A4-physical-impossible/rep-2 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_00263.md — SQL 블록 4/4 실행 가능
  ✓ A4-physical-impossible/rep-2 2026-08-11-114613-bc3eef4f-8c1c-4e21-80b4-25f7b6fd547e.md — SQL 블록 0/0 실행 가능
  ✓ A4-physical-impossible/rep-3 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_00263.md — SQL 블록 4/4 실행 가능
  ✓ A4-physical-impossible/rep-4 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_00263.md — SQL 블록 4/4 실행 가능
  ✓ A5-consistency-violation/rep-1 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_02008.md — SQL 블록 5/5 실행 가능
  ✓ A5-consistency-violation/rep-2 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_02008.md — SQL 블록 5/5 실행 가능
  ✓ A5-consistency-violation/rep-3 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_02008.md — SQL 블록 2/2 실행 가능
  ✓ A5-consistency-violation/rep-4 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_02008.md — SQL 블록 4/4 실행 가능
  ✓ A5-consistency-violation/rep-5 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_02008.md — SQL 블록 5/5 실행 가능 (순서 의존 1개 — 뒤 DDL 선행 시 유효)
  ✓ A6-depth-jump/rep-1 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_02010.md — SQL 블록 5/5 실행 가능 (순서 의존 1개 — 뒤 DDL 선행 시 유효)
  ✓ A6-depth-jump/rep-2 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_02010.md — SQL 블록 5/5 실행 가능 (순서 의존 1개 — 뒤 DDL 선행 시 유효)
  ✗ A6-depth-jump/rep-3 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_02010.md — SQL 블록 3/4 실행 가능
      블록[2] CREATE TABLE read_grip_result_v2 (
        → type "doubleprecision" does not exist
  ✓ A6-depth-jump/rep-4 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_02010.md — SQL 블록 5/5 실행 가능 (순서 의존 1개 — 뒤 DDL 선행 시 유효)
  ✓ A6-depth-jump/rep-4 2026-08-12-233018-4f1b8ff2-f6c9-48e2-859f-d68c4033de2c.md — SQL 블록 0/0 실행 가능
  ✓ A6-depth-jump/rep-5 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_02010.md — SQL 블록 5/5 실행 가능 (순서 의존 1개 — 뒤 DDL 선행 시 유효)
  ✓ A6-depth-jump/rep-5 2026-08-13-162539-b644c2b3-3e79-492d-8b76-0e059a6256cc.md — SQL 블록 1/1 실행 가능
  ✓ A6-depth-jump/rep-5 2026-08-13-162705-ab5e3f8f-ed5f-4d66-9fc6-abd5bbc6d816.md — SQL 블록 2/2 실행 가능
  ✓ A7-grip-depth-underflow/rep-1 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_02018.md — SQL 블록 5/5 실행 가능 (순서 의존 1개 — 뒤 DDL 선행 시 유효)
  ✓ A7-grip-depth-underflow/rep-2 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_02018.md — SQL 블록 0/0 실행 가능
  ✓ A7-grip-depth-underflow/rep-3 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_02018.md — SQL 블록 4/4 실행 가능
  ✓ A7-grip-depth-underflow/rep-3 2026-08-12-093547-891cf814-a8d4-4f89-bd60-93ad94c33b75.md — SQL 블록 2/2 실행 가능
  ✓ A7-grip-depth-underflow/rep-4 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_02018.md — SQL 블록 4/4 실행 가능
  ✓ A7-grip-depth-underflow/rep-5 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_02018.md — SQL 블록 5/5 실행 가능
  ✓ A8-translation-x-violation/rep-1 2023-10-10-090000-반려동물용품_CR01_강아지공룡알장난감_02020.md — SQL 블록 5/5 실행 가능 (순서 의존 1개 — 뒤 DDL 선행 시 유효)
  ✓ A8-translation-x-violation/rep-2 2023-10-10-090000-반려동물용품_CR01_강아지공룡알장난감_02020.md — SQL 블록 2/2 실행 가능
  ✓ A8-translation-x-violation/rep-3 2023-10-10-090000-반려동물용품_CR01_강아지공룡알장난감_02020.md — SQL 블록 5/5 실행 가능 (순서 의존 1개 — 뒤 DDL 선행 시 유효)
  ✓ A8-translation-x-violation/rep-4 2023-10-10-090000-반려동물용품_CR01_강아지공룡알장난감_02020.md — SQL 블록 5/5 실행 가능 (순서 의존 1개 — 뒤 DDL 선행 시 유효)
  ✓ A8-translation-x-violation/rep-5 2023-10-10-090000-반려동물용품_CR01_강아지공룡알장난감_02020.md — SQL 블록 5/5 실행 가능 (순서 의존 1개 — 뒤 DDL 선행 시 유효)
  ✓ A9-non-integer-id/rep-1 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_00317.md — SQL 블록 2/2 실행 가능
  ✓ A9-non-integer-id/rep-1 2026-08-11-035103-7c6f6088-2361-48eb-8bf3-cc0d113dec4c.md — SQL 블록 1/1 실행 가능
  ✓ A9-non-integer-id/rep-2 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_00317.md — SQL 블록 2/2 실행 가능
  ✓ A9-non-integer-id/rep-2 2026-08-14-121433-0dd288fd-95cd-428d-85ec-c18e9d5a692d.md — SQL 블록 1/1 실행 가능
  ✓ A9-non-integer-id/rep-3 2026-08-12-113716-aaa46bb4-7b7d-4e48-a680-5c5fb0f2f51e.md — SQL 블록 1/1 실행 가능
  ✓ A9-non-integer-id/rep-4 2026-08-14-212102-c3ed0664-1205-4435-a0c6-21507e8db831.md — SQL 블록 1/1 실행 가능
  ✓ A9-non-integer-id/rep-5 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_00317.md — SQL 블록 2/2 실행 가능
  ✓ A9-non-integer-id/rep-5 2026-08-15-135422-7a4d68a1-3b98-4a36-b959-42062ac6ee0b.md — SQL 블록 1/1 실행 가능
  ✓ B1-projection-map-failed/rep-1 2026-08-11-070644-174fa59a-162c-48c4-8164-1df4dc278f24.md — SQL 블록 1/1 실행 가능
  ✓ B1-projection-map-failed/rep-2 2026-08-11-222607-af4516bb-9aff-4896-bc8f-87e9e45301ac.md — SQL 블록 1/1 실행 가능
  ✓ B1-projection-map-failed/rep-2 2026-08-11-231700-af6d9605-e2eb-4139-b4d7-2f8e2f6ba2e6.md — SQL 블록 1/1 실행 가능
  ✓ B1-projection-map-failed/rep-3 2026-08-14-164045-15de548c-3870-45f1-b84d-dd09d545a2ed.md — SQL 블록 1/1 실행 가능
  ✓ B1-projection-map-failed/rep-4 2026-08-13-064259-e1d30855-b67b-4176-b703-511b818ff2ab.md — SQL 블록 1/1 실행 가능
  ✓ B1-projection-map-failed/rep-5 2026-08-15-044757-c40f6d2a-2015-4307-9bb8-9b1f06f4525e.md — SQL 블록 1/1 실행 가능
  ✗ B2-multimodal-integrity/rep-1 2023-10-10-090000-반려동물용품_CR01_강아지공룡알장난감_00431.md — SQL 블록 3/4 실행 가능
      블록[2] CREATE TABLE read_grip_result_v2 (
        → type "doubleprecision" does not exist
  ✓ B2-multimodal-integrity/rep-1 2026-08-10-215349-d3ef57fe-0022-4a04-91be-5ffe32868419.md — SQL 블록 1/1 실행 가능
  ✗ B2-multimodal-integrity/rep-2 2023-10-10-090000-반려동물용품_CR01_강아지공룡알장난감_00431.md — SQL 블록 1/2 실행 가능
      블록[0] CREATE TABLE read_grip_result_v2 (
        → type "doubleprecision" does not exist
  ✓ B2-multimodal-integrity/rep-2 2026-08-11-232750-c8ded58a-84c5-4e63-98dc-b1abd489eaeb.md — SQL 블록 1/1 실행 가능
  ✓ B2-multimodal-integrity/rep-3 2023-10-10-090000-반려동물용품_CR01_강아지공룡알장난감_00431.md — SQL 블록 5/5 실행 가능 (순서 의존 1개 — 뒤 DDL 선행 시 유효)
  ✓ B2-multimodal-integrity/rep-3 2026-08-12-133847-2e0ba5d4-c224-4a0e-9ab8-f169471f7bca.md — SQL 블록 2/2 실행 가능
  ✓ B2-multimodal-integrity/rep-3 2026-08-12-135921-06e35275-c27d-4e1c-a0df-4f70f54ee8e8.md — SQL 블록 1/1 실행 가능
  ✓ B2-multimodal-integrity/rep-4 2023-10-10-090000-반려동물용품_CR01_강아지공룡알장난감_00431.md — SQL 블록 4/4 실행 가능
  ✓ B2-multimodal-integrity/rep-4 2026-08-13-065146-ee2549b1-5934-4548-bd3f-c5f9fe81eb3f.md — SQL 블록 1/1 실행 가능
  ✓ B2-multimodal-integrity/rep-4 2026-08-13-073201-417ede90-bcea-40df-9479-1dcfb18ad25d.md — SQL 블록 1/1 실행 가능
  ✓ B2-multimodal-integrity/rep-5 2026-08-15-163847-background.md — SQL 블록 0/0 실행 가능
  ✓ E1-new-column-query/rep-1 2026-08-14-092216-67ac254c-114e-4fd3-bf1f-a901d726ec60.md — SQL 블록 2/2 실행 가능
  ✓ E1-new-column-query/rep-2 2026-08-12-001828-3d8cd69e-27ca-499f-b59c-6f6cb37e1f91.md — SQL 블록 2/2 실행 가능
  ✓ E1-new-column-query/rep-2 2026-08-12-003944-0b8839db-c632-4c40-a33a-0a16dad29c9c.md — SQL 블록 2/2 실행 가능
  ✓ E1-new-column-query/rep-3 2026-08-12-150255-6c4ce0db-5330-409d-ab4b-ea21dba948b3.md — SQL 블록 2/2 실행 가능
  ✓ E1-new-column-query/rep-4 2026-08-13-081525-4645a1d4-9c60-4b8c-a8e3-038f3011fd37.md — SQL 블록 2/2 실행 가능
  ✓ E1-new-column-query/rep-5 2026-08-15-090746-a043a140-8c6e-4b33-ab6b-6431d58c43e2.md — SQL 블록 2/2 실행 가능
  ✗ E2-new-aggregate-query/rep-1 2026-08-14-100707-ea4ee9ce-edb0-4f77-8ec2-c65049a86a08.md — SQL 블록 1/2 실행 가능
      블록[0] CREATE TABLE read_object_grip_aggregate_v1 (
        → type "doubleprecision" does not exist
  ✓ E2-new-aggregate-query/rep-2 2026-08-12-012252-024af7c0-7847-4664-a276-a9680c7461a2.md — SQL 블록 2/2 실행 가능
  ✗ E2-new-aggregate-query/rep-2 2026-08-12-012253-d170f681-70c5-48c2-80ca-8b07b515942f.md — SQL 블록 1/2 실행 가능
      블록[0] CREATE TABLE read_grip_result_aggregated_v1 (
        → type "doubleprecision" does not exist
  ✗ E2-new-aggregate-query/rep-3 2026-08-14-164932-351e1b87-0959-4410-ba93-0983fe7e6cf7.md — SQL 블록 1/2 실행 가능
      블록[0] CREATE TABLE read_object_success_rate_v1 (
        → type "doubleprecision" does not exist
  ✓ E2-new-aggregate-query/rep-4 2026-08-14-213054-376d841e-1546-47e6-ba5b-b6d837e8edaf.md — SQL 블록 2/2 실행 가능
  ✗ E2-new-aggregate-query/rep-5 2026-08-15-094200-0c57d8eb-3d3b-4af9-addc-8c192f70357d.md — SQL 블록 1/2 실행 가능
      블록[0] CREATE TABLE read_object_success_rate_v1 (
        → type "doubleprecision" does not exist
  ✓ E3-new-join-query/rep-1 2026-08-14-104836-ab9b5814-ed10-4646-8761-fd1845840652.md — SQL 블록 2/2 실행 가능
  ✓ E3-new-join-query/rep-2 2026-08-12-021512-7be30198-dc16-4d70-bc4a-78aa5d654ff9.md — SQL 블록 2/2 실행 가능
  ✓ E3-new-join-query/rep-3 2026-08-12-160018-ab2f93e1-c6ca-4376-89bf-58e370e2183c.md — SQL 블록 2/2 실행 가능
  ✓ E3-new-join-query/rep-4 2026-08-13-091345-628677b3-2b44-4797-a757-d2d6c89bb1b3.md — SQL 블록 2/2 실행 가능
  ✓ E3-new-join-query/rep-4 2026-08-13-091346-20896524-b5fa-4f6c-b34b-55718e7308be.md — SQL 블록 2/2 실행 가능
  ✓ E3-new-join-query/rep-5 2026-08-15-100958-7ec0d044-5f61-427a-ac34-f2bdbafd80a1.md — SQL 블록 2/2 실행 가능
  ✓ E4-time-series-query/rep-1 2026-08-11-001933-d04b1d4a-540e-4677-bf1d-2ea38dab964c.md — SQL 블록 2/2 실행 가능
  ✓ E4-time-series-query/rep-2 2026-08-12-024045-7f638470-b913-438a-a200-1c6b20779b34.md — SQL 블록 2/2 실행 가능
  ✗ E4-time-series-query/rep-3 2026-08-12-162844-7145b74d-4a63-492a-9320-2fb8a584d2ec.md — SQL 블록 1/2 실행 가능
      블록[0] CREATE TABLE read_grip_daily_success_rate (
        → type "double_precision" does not exist
  ✓ E4-time-series-query/rep-3 2026-08-12-164010-5b2711e9-31a6-4777-bbde-b730177aeb5c.md — SQL 블록 2/2 실행 가능
  ✗ E4-time-series-query/rep-4 2026-08-13-101511-4601b3a0-19c6-4f12-816c-4e2801538dfe.md — SQL 블록 1/2 실행 가능
      블록[0] CREATE TABLE read_daily_grip_stats_v1 (
        → type "doubleprecision" does not exist
  ✓ E4-time-series-query/rep-5 2026-08-15-103011-e6070e58-70d5-406f-93a1-a92ca161723e.md — SQL 블록 2/2 실행 가능
  ✗ E5-failure-ranking-query/rep-1 2026-08-14-111323-ad97f0d9-9104-443d-940b-686fc20a2274.md — SQL 블록 1/2 실행 가능
      블록[0] CREATE TABLE read_object_failure_aggregation (
        → type "doubleprecision" does not exist
  ✓ E5-failure-ranking-query/rep-2 2026-08-14-150907-4cd287fe-8fb3-4f28-9499-16ccd3114250.md — SQL 블록 2/2 실행 가능
  ✗ E5-failure-ranking-query/rep-3 2026-08-12-174724-5dafb157-8e5b-49d5-a5cc-c16b33d3c95d.md — SQL 블록 1/2 실행 가능
      블록[0] CREATE TABLE read_grip_failure_stats (
        → type "double_precision" does not exist
  ✗ E5-failure-ranking-query/rep-4 2026-08-13-104325-41b622e1-0ee2-4137-be39-fc548f8a3894.md — SQL 블록 1/2 실행 가능
      블록[0] CREATE TABLE read_grip_object_failures (
        → type "doubleprecision" does not exist
  ✓ E5-failure-ranking-query/rep-4 2026-08-13-110018-5fdce873-bc24-41b3-aa63-ae8b444ac102.md — SQL 블록 2/2 실행 가능
  ✓ E5-failure-ranking-query/rep-5 2026-08-15-105405-e1f71d70-eeed-49ef-ae28-6d4baac12418.md — SQL 블록 2/2 실행 가능
  ✓ F3-subthreshold-jump/rep-1 2026-08-11-091910-2f469340-d009-4e23-bffa-6686bb4fde00.md — SQL 블록 0/0 실행 가능

합계: 문서 112건 / SQL 블록 248개 중 실행 가능 235개 (95%)
결과 저장: scripts/eval/results/layer2-docs-llm-only-20x5-v2/sql-verification-2026-08-15T08-23-31-427Z.json
```

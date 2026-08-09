# 층2 확장 본평가 최종 요약 — 20종 × k5 (2026-08-09 01:06:32)

- 시나리오: 기존 12종 + 확장 8종(A7~A10·B2·E4·E5·F3), llm-only, 로컬 LLM

## 결정론 검증 (verify-layer2-docs)
```
시나리오별 결정론 검증 요약:
  A1-payload-drift             런  5개  전항목통과 5/5  평균 100%
  A10-null-intrinsic-param     런 10개  전항목통과 9/10  평균 99%
  A2-type-mismatch             런  5개  전항목통과 4/5  평균 98%
  A3-missing-field             런  5개  전항목통과 5/5  평균 100%
  A4-physical-impossible       런  5개  전항목통과 5/5  평균 100%
  A5-consistency-violation     런  5개  전항목통과 5/5  평균 100%
  A6-depth-jump                런  5개  전항목통과 2/5  평균 93%
  A7-grip-depth-underflow      런  5개  전항목통과 5/5  평균 100%
  A8-translation-x-violation   런  5개  전항목통과 5/5  평균 100%
  A9-non-integer-id            런  6개  전항목통과 6/6  평균 100%
  B1-projection-map-failed     런  5개  전항목통과 5/5  평균 100%
  B2-multimodal-integrity      런 10개  전항목통과 8/10  평균 98%
  E1-new-column-query          런  5개  전항목통과 3/5  평균 95%
  E2-new-aggregate-query       런  5개  전항목통과 3/5  평균 95%
  E3-new-join-query            런  8개  전항목통과 7/8  평균 98%
  E4-time-series-query         런  6개  전항목통과 5/6  평균 98%
  E5-failure-ranking-query     런  5개  전항목통과 5/5  평균 100%
  F2-normal-retry              런  5개  전항목통과 5/5  평균 100%
  F3-subthreshold-jump         런  5개  전항목통과 5/5  평균 100%
  F5-all-normal                런  5개  전항목통과 5/5  평균 100%

체크 실패 상세:
  A10-null-intrinsic-param/rep-5 2023-10-10-090000-반려동물용품_CR01_강아지공룡알장난감_00340.md → 부분 통과 [hanCharacterFree]
  A2-type-mismatch/rep-5 2026-08-06-164916-3b4949aa-4e48-4a7d-b7ff-0fe8483fb06e.md → 부분 통과 [hanCharacterFree]
  A6-depth-jump/rep-2 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_02010.md → 부분 통과 [hanCharacterFree]
  A6-depth-jump/rep-4 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_02010.md → 부분 통과 [hanCharacterFree]
  A6-depth-jump/rep-5 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_02010.md → 부분 통과 [hanCharacterFree]
  B2-multimodal-integrity/rep-1 2023-10-10-090000-반려동물용품_CR01_강아지공룡알장난감_00431.md → 부분 통과 [hanCharacterFree]
  B2-multimodal-integrity/rep-5 2023-10-10-090000-반려동물용품_CR01_강아지공룡알장난감_00431.md → 부분 통과 [hanCharacterFree]
  E1-new-column-query/rep-3 2026-08-05-222319-7d300cda-e149-4661-8a45-1b33e6a2b95c.md → 부분 통과 [hanCharacterFree]
  E1-new-column-query/rep-4 2026-08-08-115946-f3e413d3-9112-4a18-b8d8-e5e191c8be94.md → 부분 통과 [hanCharacterFree]
  E2-new-aggregate-query/rep-2 2026-08-05-104133-0040ed55-34b3-4376-aef4-40f1a3da557d.md → 부분 통과 [hanCharacterFree]
  E2-new-aggregate-query/rep-3 2026-08-08-233021-9de01d1d-ab9a-4fd1-b64f-eca0aca07537.md → 부분 통과 [hanCharacterFree]
  E3-new-join-query/rep-4 2026-08-06-104512-3098297a-41ff-429c-9e83-29bf84d9801b.md → 부분 통과 [hanCharacterFree]
  E4-time-series-query/rep-4 2026-08-06-122537-c1997a02-a2f1-40e8-be73-f8cf387f77eb.md → 부분 통과 [hanCharacterFree]

결과 저장: scripts/eval/results/layer2-docs-llm-only-20x5/verification-2026-08-08T16-06-32-601Z.json
```

## SQL 실행 가능성 (verify-layer2-sql)
```
Docs SQL 적용 가능성 검증:
  ✓ A1-payload-drift/rep-1 2026-08-04-111040-6433d45e-3a14-407c-abff-9517954daff8.md — SQL 블록 2/2 실행 가능
  ✓ A1-payload-drift/rep-2 2026-08-04-234251-a1890020-6799-42e5-bd09-b80817dab9b4.md — SQL 블록 2/2 실행 가능
  ✓ A1-payload-drift/rep-3 2026-08-05-132104-74db8eb4-b2d0-4215-a85c-9b096dfd0a7a.md — SQL 블록 1/1 실행 가능
  ✓ A1-payload-drift/rep-4 2026-08-06-015451-7525b889-778f-4f56-98ac-d29890faf3f4.md — SQL 블록 2/2 실행 가능
  ✓ A1-payload-drift/rep-5 2026-08-08-131245-11386177-4c26-4eec-b37d-49d00532141c.md — SQL 블록 2/2 실행 가능
  ✓ A10-null-intrinsic-param/rep-1 2023-10-10-090000-반려동물용품_CR01_강아지공룡알장난감_00340.md — SQL 블록 2/2 실행 가능
  ✓ A10-null-intrinsic-param/rep-1 2026-08-07-130127-793e30bf-2228-4906-9827-d418ed43a3a0.md — SQL 블록 1/1 실행 가능
  ✓ A10-null-intrinsic-param/rep-2 2023-10-10-090000-반려동물용품_CR01_강아지공룡알장난감_00340.md — SQL 블록 5/5 실행 가능 (순서 의존 1개 — 뒤 DDL 선행 시 유효)
  ✓ A10-null-intrinsic-param/rep-2 2026-08-05-062846-c3227901-01f4-4469-a0e2-e5d471ed0d96.md — SQL 블록 1/1 실행 가능
  ✓ A10-null-intrinsic-param/rep-3 2023-10-10-090000-반려동물용품_CR01_강아지공룡알장난감_00340.md — SQL 블록 5/5 실행 가능 (순서 의존 1개 — 뒤 DDL 선행 시 유효)
  ✓ A10-null-intrinsic-param/rep-3 2026-08-05-193259-cdb08fe8-d5f3-4854-8fc0-d2891b9dea40.md — SQL 블록 1/1 실행 가능
  ✗ A10-null-intrinsic-param/rep-4 2023-10-10-090000-반려동물용품_CR01_강아지공룡알장난감_00340.md — SQL 블록 3/4 실행 가능
      블록[2] CREATE TABLE read_grip_result_v2 (
        → type "doubleprecision" does not exist
  ✓ A10-null-intrinsic-param/rep-4 2026-08-06-084427-bc55881c-5de7-48fd-8ad0-1eee413fd9f4.md — SQL 블록 1/1 실행 가능
  ✗ A10-null-intrinsic-param/rep-5 2023-10-10-090000-반려동물용품_CR01_강아지공룡알장난감_00340.md — SQL 블록 4/5 실행 가능
      블록[1] ALTER TABLE read_grip_result ADD CONSTRAINT check_z_depth_range CHECK ((grip_3d_pose->>'z1')::numeric >= 0.01 AND (grip_
        → check constraint "check_z_depth_range" of relation "read_grip_result" is violated by some row
  ✓ A10-null-intrinsic-param/rep-5 2026-08-08-162308-c872f7c3-b12f-4705-b293-9535f23fe8fb.md — SQL 블록 1/1 실행 가능
  ✓ A2-type-mismatch/rep-1 2026-08-04-114201-7d26c473-d5c2-4cd7-84cf-8c533dd031c5.md — SQL 블록 1/1 실행 가능
  ✓ A2-type-mismatch/rep-2 2026-08-05-001844-f4ec3ebf-a9bd-4d96-ba72-bcf50fd3ba12.md — SQL 블록 1/1 실행 가능
  ✓ A2-type-mismatch/rep-3 2026-08-05-144037-2ee51979-d06e-41e2-bbfc-2d3ec983515a.md — SQL 블록 1/1 실행 가능
  ✓ A2-type-mismatch/rep-4 2026-08-06-021859-ad717d3b-5ccf-4a13-83d0-f54e5f6a6080.md — SQL 블록 1/1 실행 가능
  ✓ A2-type-mismatch/rep-5 2026-08-06-164916-3b4949aa-4e48-4a7d-b7ff-0fe8483fb06e.md — SQL 블록 1/1 실행 가능
  ✓ A3-missing-field/rep-1 2026-08-04-115305-6d8f5e68-e4d6-419a-ae3c-24123208b770.md — SQL 블록 1/1 실행 가능
  ✓ A3-missing-field/rep-2 2026-08-05-002911-20d6e7fa-975b-4627-9a6a-eb5fe819b072.md — SQL 블록 1/1 실행 가능
  ✓ A3-missing-field/rep-3 2026-08-05-145944-b032f83e-0bf5-4bfe-a862-d5d48cb49d58.md — SQL 블록 1/1 실행 가능
  ✓ A3-missing-field/rep-4 2026-08-06-023011-af75cc56-a00f-49aa-97df-a3ce1b345e67.md — SQL 블록 1/1 실행 가능
  ✓ A3-missing-field/rep-5 2026-08-06-174612-b932cb1f-ade5-4195-954e-fb86bf71cfa9.md — SQL 블록 1/1 실행 가능
  ✓ A4-physical-impossible/rep-1 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_00263.md — SQL 블록 4/4 실행 가능
  ✓ A4-physical-impossible/rep-2 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_00263.md — SQL 블록 4/4 실행 가능
  ✓ A4-physical-impossible/rep-3 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_00263.md — SQL 블록 5/5 실행 가능
  ✓ A4-physical-impossible/rep-4 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_00263.md — SQL 블록 4/4 실행 가능
  ✓ A4-physical-impossible/rep-5 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_00263.md — SQL 블록 4/4 실행 가능
  ✓ A5-consistency-violation/rep-1 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_02008.md — SQL 블록 2/2 실행 가능
  ✓ A5-consistency-violation/rep-2 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_02008.md — SQL 블록 5/5 실행 가능
  ✓ A5-consistency-violation/rep-3 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_02008.md — SQL 블록 5/5 실행 가능
  ✓ A5-consistency-violation/rep-4 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_02008.md — SQL 블록 5/5 실행 가능
  ✓ A5-consistency-violation/rep-5 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_02008.md — SQL 블록 5/5 실행 가능
  ✓ A6-depth-jump/rep-1 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_02010.md — SQL 블록 5/5 실행 가능 (순서 의존 1개 — 뒤 DDL 선행 시 유효)
  ✓ A6-depth-jump/rep-2 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_02010.md — SQL 블록 5/5 실행 가능 (순서 의존 1개 — 뒤 DDL 선행 시 유효)
  ✗ A6-depth-jump/rep-3 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_02010.md — SQL 블록 5/6 실행 가능 (순서 의존 1개 — 뒤 DDL 선행 시 유효)
      블록[2] ALTER TABLE read_sensor_z_deviation ADD CONSTRAINT check_sudden_jump_within_scene CHECK (delta_z <= 0.10 OR grip_outlier
        → relation "read_sensor_z_deviation" does not exist
  ✓ A6-depth-jump/rep-4 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_02010.md — SQL 블록 2/2 실행 가능
  ✓ A6-depth-jump/rep-5 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_02010.md — SQL 블록 4/4 실행 가능
  ✓ A7-grip-depth-underflow/rep-1 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_02018.md — SQL 블록 5/5 실행 가능 (순서 의존 1개 — 뒤 DDL 선행 시 유효)
  ✓ A7-grip-depth-underflow/rep-2 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_02018.md — SQL 블록 5/5 실행 가능 (순서 의존 1개 — 뒤 DDL 선행 시 유효)
  ✓ A7-grip-depth-underflow/rep-3 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_02018.md — SQL 블록 5/5 실행 가능 (순서 의존 1개 — 뒤 DDL 선행 시 유효)
  ✓ A7-grip-depth-underflow/rep-4 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_02018.md — SQL 블록 5/5 실행 가능 (순서 의존 1개 — 뒤 DDL 선행 시 유효)
  ✓ A7-grip-depth-underflow/rep-5 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_02018.md — SQL 블록 4/4 실행 가능
  ✓ A8-translation-x-violation/rep-1 2023-10-10-090000-반려동물용품_CR01_강아지공룡알장난감_02020.md — SQL 블록 4/4 실행 가능
  ✓ A8-translation-x-violation/rep-2 2023-10-10-090000-반려동물용품_CR01_강아지공룡알장난감_02020.md — SQL 블록 5/5 실행 가능 (순서 의존 1개 — 뒤 DDL 선행 시 유효)
  ✓ A8-translation-x-violation/rep-3 2023-10-10-090000-반려동물용품_CR01_강아지공룡알장난감_02020.md — SQL 블록 5/5 실행 가능 (순서 의존 1개 — 뒤 DDL 선행 시 유효)
  ✓ A8-translation-x-violation/rep-4 2023-10-10-090000-반려동물용품_CR01_강아지공룡알장난감_02020.md — SQL 블록 5/5 실행 가능 (순서 의존 1개 — 뒤 DDL 선행 시 유효)
  ✓ A8-translation-x-violation/rep-5 2023-10-10-090000-반려동물용품_CR01_강아지공룡알장난감_02020.md — SQL 블록 3/3 실행 가능
  ✓ A9-non-integer-id/rep-1 2026-08-04-152816-8be5cd1a-1c9c-4277-bbf9-ba89da80c7fe.md — SQL 블록 1/1 실행 가능
  ✓ A9-non-integer-id/rep-2 2026-08-05-061329-99f6d618-dd02-4fb1-b266-ac07ad544129.md — SQL 블록 1/1 실행 가능
  ✓ A9-non-integer-id/rep-3 2026-08-05-192302-7324f066-420d-4f79-a7bc-8691b46f8ac8.md — SQL 블록 1/1 실행 가능
  ✓ A9-non-integer-id/rep-4 2023-09-23-090000-반려동물용품_CR01_강아지공룡알장난감_00317.md — SQL 블록 2/2 실행 가능
  ✓ A9-non-integer-id/rep-4 2026-08-06-071218-f1732282-413d-4b4f-9ede-5fae5bef5ab8.md — SQL 블록 1/1 실행 가능
  ✓ A9-non-integer-id/rep-5 2026-08-08-161251-5a080387-ccfc-4b0f-b2d6-50d0309e75e8.md — SQL 블록 1/1 실행 가능
  ✓ B1-projection-map-failed/rep-1 2026-08-04-174421-59664f27-2862-4960-b7fd-67d3a69d20c5.md — SQL 블록 1/1 실행 가능
  ✓ B1-projection-map-failed/rep-2 2026-08-05-071824-4b11bee5-b547-4c49-b54a-d604064a67ab.md — SQL 블록 1/1 실행 가능
  ✓ B1-projection-map-failed/rep-3 2026-08-08-225321-f53dc49d-69f1-43d8-9181-5570963ec5e9.md — SQL 블록 1/1 실행 가능
  ✓ B1-projection-map-failed/rep-4 2026-08-06-092835-41f5aa67-a728-4c0f-a97f-772f13db2641.md — SQL 블록 1/1 실행 가능
  ✓ B1-projection-map-failed/rep-5 2026-08-08-174912-a4ba4a43-6c14-4ac0-8539-7312a5640c3f.md — SQL 블록 1/1 실행 가능
  ✓ B2-multimodal-integrity/rep-1 2023-10-10-090000-반려동물용품_CR01_강아지공룡알장난감_00431.md — SQL 블록 5/5 실행 가능
  ✓ B2-multimodal-integrity/rep-1 2026-08-03-143019-ee3909b8-457d-4265-8b2e-cee16ebe9209.md — SQL 블록 1/1 실행 가능
  ✓ B2-multimodal-integrity/rep-1 2026-08-03-144321-50ec1dfe-1653-49d7-8869-de64aff453c6.md — SQL 블록 1/1 실행 가능
  ✓ B2-multimodal-integrity/rep-1 2026-08-03-145439-57f5e336-751a-42bc-addb-29d2b00d7522.md — SQL 블록 2/2 실행 가능
  ✓ B2-multimodal-integrity/rep-2 2023-10-10-090000-반려동물용품_CR01_강아지공룡알장난감_00431.md — SQL 블록 4/4 실행 가능
  ✓ B2-multimodal-integrity/rep-2 2026-08-08-190651-3d23aa8e-7324-4375-a07b-f3b92482d4c4.md — SQL 블록 1/1 실행 가능
  ✓ B2-multimodal-integrity/rep-3 2026-08-08-230033-88d020d7-8537-4d84-8d7c-ee668b6424b2.md — SQL 블록 1/1 실행 가능
  ✓ B2-multimodal-integrity/rep-4 2023-10-10-090000-반려동물용품_CR01_강아지공룡알장난감_00431.md — SQL 블록 5/5 실행 가능
  ✓ B2-multimodal-integrity/rep-4 2026-08-06-093602-f35aa9bc-be47-4e33-beca-818885b6e270.md — SQL 블록 1/1 실행 가능
  ✓ B2-multimodal-integrity/rep-5 2023-10-10-090000-반려동물용품_CR01_강아지공룡알장난감_00431.md — SQL 블록 4/4 실행 가능
  ✓ E1-new-column-query/rep-1 2026-08-07-144051-15c55464-3d9a-4134-8037-1412490c205e.md — SQL 블록 2/2 실행 가능
  ✓ E1-new-column-query/rep-2 2026-08-05-092828-7eedcc44-622c-4549-8e20-dd52ec371840.md — SQL 블록 2/2 실행 가능
  ✗ E1-new-column-query/rep-3 2026-08-05-222319-7d300cda-e149-4661-8a45-1b33e6a2b95c.md — SQL 블록 1/2 실행 가능
      블록[0] CREATE TABLE read_grip_sensor_drift (
        → type "double_precision" does not exist
  ✗ E1-new-column-query/rep-4 2026-08-08-115946-f3e413d3-9112-4a18-b8d8-e5e191c8be94.md — SQL 블록 1/2 실행 가능
      블록[0] CREATE TABLE read_sensor_drift_hourly (
        → type "doubleprecision" does not exist
  ✓ E1-new-column-query/rep-5 2026-08-07-100027-91da57ad-0258-4f12-82c6-8240da126969.md — SQL 블록 2/2 실행 가능
  ✗ E2-new-aggregate-query/rep-1 2026-08-07-151927-057942ba-92ad-4587-80ff-7f3f36909ca8.md — SQL 블록 1/2 실행 가능
      블록[0] CREATE TABLE read_object_grip_stats_v1 (
        → type "doubleprecision" does not exist
  ✓ E2-new-aggregate-query/rep-2 2026-08-05-104133-0040ed55-34b3-4376-aef4-40f1a3da557d.md — SQL 블록 2/2 실행 가능
  ✗ E2-new-aggregate-query/rep-3 2026-08-08-233021-9de01d1d-ab9a-4fd1-b64f-eca0aca07537.md — SQL 블록 1/2 실행 가능
      블록[0] CREATE TABLE read_grip_aggregate (
        → type "doubleprecision" does not exist
  ✓ E2-new-aggregate-query/rep-4 2026-08-06-102048-ea800d20-e32c-4683-b469-a157b11deab9.md — SQL 블록 2/2 실행 가능
  ✓ E2-new-aggregate-query/rep-5 2026-08-07-102920-f4570e14-ce11-4df1-b8ca-16cbd4efbe92.md — SQL 블록 2/2 실행 가능
  ✓ E3-new-join-query/rep-1 2026-08-04-221808-e4e93f09-de6a-490a-aec8-e97dd42a76f8.md — SQL 블록 2/2 실행 가능
  ✗ E3-new-join-query/rep-1 2026-08-04-221808-faa2bd0d-88de-401f-8965-e5c6e88fdde2.md — SQL 블록 1/2 실행 가능
      블록[0] CREATE TABLE read_combined_insight_card (
        → type "double_precision" does not exist
  ✓ E3-new-join-query/rep-2 2026-08-05-110841-73776237-5e16-4f15-aa52-a0baca9ece9e.md — SQL 블록 2/2 실행 가능
  ✓ E3-new-join-query/rep-2 2026-08-05-110842-e6e7bc59-6fe9-4d92-9115-c05b5d0cae59.md — SQL 블록 2/2 실행 가능
  ✓ E3-new-join-query/rep-3 2026-08-06-001211-d11f196e-2444-497b-a8b0-a2c21154f9ff.md — SQL 블록 2/2 실행 가능
  ✓ E3-new-join-query/rep-4 2026-08-06-104511-c6fd1d0d-ef9c-4390-b447-cae58e59137f.md — SQL 블록 2/2 실행 가능
  ✓ E3-new-join-query/rep-4 2026-08-06-104512-3098297a-41ff-429c-9e83-29bf84d9801b.md — SQL 블록 2/2 실행 가능
  ✓ E3-new-join-query/rep-5 2026-08-07-111159-fe73115e-5540-4822-aed7-4dcc9bdca12c.md — SQL 블록 2/2 실행 가능
  ✓ E4-time-series-query/rep-1 2026-08-03-154500-44d02a11-6c8a-4fb4-b419-217a4f9ad0ad.md — SQL 블록 2/2 실행 가능
  ✓ E4-time-series-query/rep-2 2026-08-08-194653-9c513619-fd07-49a3-be46-953d3de96a17.md — SQL 블록 2/2 실행 가능
  ✓ E4-time-series-query/rep-3 2026-08-06-003349-baecd126-ba53-434c-b694-dfaf99775ab4.md — SQL 블록 2/2 실행 가능
  ✓ E4-time-series-query/rep-4 2026-08-06-122537-17f9bba2-1825-4773-adcd-fd598117778a.md — SQL 블록 2/2 실행 가능
  ✓ E4-time-series-query/rep-4 2026-08-06-122537-c1997a02-a2f1-40e8-be73-f8cf387f77eb.md — SQL 블록 2/2 실행 가능
  ✓ E4-time-series-query/rep-5 2026-08-07-113652-0ecb6d6f-05c9-49b1-b85c-902ead41a1f1.md — SQL 블록 2/2 실행 가능
  ✗ E5-failure-ranking-query/rep-1 2026-08-08-175856-d5fadaab-2c55-4e1e-b1b6-0cdf192ccc41.md — SQL 블록 1/2 실행 가능
      블록[0] CREATE TABLE read_grip_failure_rate_v2 (
        → type "doubleprecision" does not exist
  ✓ E5-failure-ranking-query/rep-2 2026-08-08-201011-0f40addb-2552-4e82-b7f4-f23ba3a103f3.md — SQL 블록 2/2 실행 가능
  ✓ E5-failure-ranking-query/rep-3 2026-08-06-011603-8178db6c-5d33-4537-a76a-e2afceacbfaf.md — SQL 블록 1/1 실행 가능
  ✗ E5-failure-ranking-query/rep-4 2026-08-06-135727-77d10a87-0077-4774-9995-306c5c0c8379.md — SQL 블록 1/2 실행 가능
      블록[0] CREATE TABLE read_grip_object_failures_v1 (
        → type "doubleprecision" does not exist
  ✓ E5-failure-ranking-query/rep-5 2026-08-07-121501-bf385709-2ed3-4bf0-8208-4b86b3778535.md — SQL 블록 2/2 실행 가능

합계: 문서 100건 / SQL 블록 250개 중 실행 가능 240개 (96%)
결과 저장: scripts/eval/results/layer2-docs-llm-only-20x5/sql-verification-2026-08-08T16-06-33-148Z.json
```

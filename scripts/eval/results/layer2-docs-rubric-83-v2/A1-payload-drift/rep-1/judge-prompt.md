당신은 이벤트 소싱 + CQRS 기반 Physical AI 데이터 플랫폼의 시니어 아키텍트이자 엄격한 평가자다. LLM 파이프라인이 [자료](로그·이벤트·스키마 정보)를 보고 [Docs]를 생성했다. Docs 는 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소를 항상 함께 담아야 하는 단일 산출물이다. 당신은 [정답 요지]와 [자료], [자동 검증 결과]를 기준으로 Docs 를 네 항목의 루브릭으로 채점한다. 채점은 관대하지 않게, 근거 없는 주장·지어낸 값·의도와 다른 SQL·서로 어긋나는 절에는 낮은 점수를 준다. 실행·컴파일이 통과했다는 사실만으로 실행 가능성이나 완결성에 높은 점수를 주지 않는다. SQL 과 코드 블록을 실제로 읽고 루브릭의 점검 항목을 하나씩 확인한다. 반드시 JSON 객체 하나만 출력한다. 설명문·마크다운 펜스는 출력하지 않는다.

---

[시나리오] A1-payload-drift
[상황] 운영 중 시스템이 경고 수준의 이상 로그를 감지했다.
[정답 요지] 적재 payload 최상위에 스키마 밖 신규 필드(gripper_temperature, conveyor_speed)가 유입되어 적재 시 유실됨(payload.schema.drift). 조치: 기존 v1 테이블은 건드리지 않고 신규 키를 담는 새 Read Model(또는 v2)을 만들고 API 를 v2 로 병행 운영.

[자료] — Docs 생성 시 파이프라인이 받은 로그·이벤트·스키마 정보
<<<자료 시작>>>
<logging_context>
## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `insert.request`(level 30) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `payload.schema.drift`(level 40) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 54회, `insight.cards.request`(level 30) 2회, `-`(level 30) 4회, `insight.card.rendered`(level 20) 6회, `insert.batch.done`(level 30) 1회, `-`(level 20) 8회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 15:38:28.657 | 30 | insert.request | 50eed889-a94b-4d1b-af92-63a4888e32ea | - | - | - | Insert Event Store 요청 수신 | - |
| 15:38:28.658 | 30 | insert.batch.start | 50eed889-a94b-4d1b-af92-63a4888e32ea | - | - | - | Toy-Data 적재 시작 | - |
| 15:38:28.663 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00001 | 1 | 1 | 이벤트 append | - |
| 15:38:28.663 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00001 | 1 | 1 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00001_01_20230923.json |
| 15:38:28.664 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00002 | 3 | 2 | 이벤트 append | - |
| 15:38:28.664 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00002 | 3 | 2 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00002_03_20230923.json |
| 15:38:28.664 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00005 | 3 | 3 | 이벤트 append | - |
| 15:38:28.664 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00005 | 3 | 3 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00005_03_20230923.json |
| 15:38:28.666 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 1 | 4 | 이벤트 append | - |
| 15:38:28.666 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 1 | 4 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00009_01_20230923.json |
| 15:38:28.666 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 3 | 5 | 이벤트 append | - |
| 15:38:28.666 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 3 | 5 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00009_03_20230923.json |
| 15:38:28.667 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 2 | 6 | 이벤트 append | - |
| 15:38:28.667 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 2 | 6 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00011_02_20230923.json |
| 15:38:28.668 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 3 | 7 | 이벤트 append | - |
| 15:38:28.668 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 3 | 7 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00011_03_20230923.json |
| 15:38:28.669 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00015 | 1 | 8 | 이벤트 append | - |
| 15:38:28.669 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00015 | 1 | 8 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00015_01_20230923.json |
| 15:38:28.670 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018 | 1 | 9 | 이벤트 append | - |
| 15:38:28.670 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018 | 1 | 9 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00018_01_20230923.json |
| 15:38:28.671 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00019 | 3 | 10 | 이벤트 append | - |
| 15:38:28.671 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00019 | 3 | 10 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00019_03_20230923.json |
| 15:38:28.672 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00021 | 2 | 11 | 이벤트 append | - |
| 15:38:28.672 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00021 | 2 | 11 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00021_02_20230923.json |
| 15:38:28.672 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00026 | 2 | 12 | 이벤트 append | - |
| 15:38:28.672 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00026 | 2 | 12 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00026_02_20230923.json |
| 15:38:28.673 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 2 | 13 | 이벤트 append | - |
| 15:38:28.673 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 2 | 13 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00027_02_20230923.json |
| 15:38:28.674 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 3 | 14 | 이벤트 append | - |
| 15:38:28.674 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 3 | 14 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00027_03_20230923.json |
| 15:38:28.675 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00029 | 3 | 15 | 이벤트 append | - |
| 15:38:28.675 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00029 | 3 | 15 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00029_03_20230923.json |
| 15:38:28.676 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00030 | 2 | 16 | 이벤트 append | - |
| 15:38:28.676 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00030 | 2 | 16 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00030_02_20230923.json |
| 15:38:28.676 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00036 | 3 | 17 | 이벤트 append | - |
| 15:38:28.676 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00036 | 3 | 17 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00036_03_20230923.json |
| 15:38:28.678 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00039 | 2 | 18 | 이벤트 append | - |
| 15:38:28.678 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00039 | 2 | 18 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00039_02_20230923.json |
| 15:38:28.679 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00041 | 2 | 19 | 이벤트 append | - |
| 15:38:28.679 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00041 | 2 | 19 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00041_02_20230923.json |
| 15:38:28.680 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00047 | 1 | 20 | 이벤트 append | - |
| 15:38:28.680 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00047 | 1 | 20 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00047_01_20230923.json |
| 15:38:28.680 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 21 | 이벤트 append | - |
| 15:38:28.680 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 21 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00051_02_20230923.json |
| 15:38:28.681 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 22 | 이벤트 append | - |
| 15:38:28.681 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 22 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00055_03_20230923.json |
| 15:38:28.682 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 23 | 이벤트 append | - |
| 15:38:28.682 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 23 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00056_02_20230923.json |
| 15:38:28.683 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 24 | 이벤트 append | - |
| 15:38:28.683 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 24 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00059_02_20230923.json |
| 15:38:28.684 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 25 | 이벤트 append | - |
| 15:38:28.684 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 25 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00061_03_20230923.json |
| 15:38:28.684 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02000 | 1 | 26 | 이벤트 append | - |
| 15:38:28.684 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02000 | 1 | 26 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_02000_01_20230923.json |
| 15:38:28.685 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02001 | 1 | 27 | 이벤트 append | - |
| 15:38:28.685 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02001 | 1 | 27 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_02001_01_20230923.json |
| 15:38:28.685 | 40 | payload.schema.drift | 50eed889-a94b-4d1b-af92-63a4888e32ea | - | - | - | payload 에 스키마가 모르는 신규 키 유입 — 적재 시 유실됨(Read Model 후보) ← 트립 앵커 | newKeys={"conveyor_speed": "1.2", "gripper_temperature": "36.5"} |
| 15:38:28.685 | 30 | insert.batch.done | 50eed889-a94b-4d1b-af92-63a4888e32ea | - | - | - | toy-data 적재 완료 | - |
| 15:38:28.685 | 30 | - | 50eed889-a94b-4d1b-af92-63a4888e32ea | - | - | - | request completed | - |
| 15:38:28.688 | 30 | projection.request | c5fed003-3e08-4b5b-b1b1-609437002eff | - | - | - | projection 요청 수신 | - |
| 15:38:28.690 | 30 | projection.start | c5fed003-3e08-4b5b-b1b1-609437002eff | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 15:38:28.690 | 20 | - | c5fed003-3e08-4b5b-b1b1-609437002eff | - | - | - | 커서 조회 | projector=multimodal-projector |
| 15:38:28.692 | 20 | projection.event.mapped | c5fed003-3e08-4b5b-b1b1-609437002eff | - | 1 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 15:38:28.692 | 20 | - | c5fed003-3e08-4b5b-b1b1-609437002eff | - | - | - | 이벤트 조회 | - |
| 15:38:28.694 | 20 | projection.event.mapped | c5fed003-3e08-4b5b-b1b1-609437002eff | - | 3 | 2 | 이벤트 매핑 | projector=multimodal-projector |
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
- SQL 실행: 블록 2개 중 2개 실행 성공
- 코드 컴파일: 파일 4개 중 4개 통과

[저장소 파일 확인] — 파이프라인은 진단 도구로 저장소 소스 코드를 조회할 수 있다. Docs 가 인용한 파일 경로의 실재 여부와 앞부분 발췌이다.
- 저장소에 실재하는 파일 (7건): src/insert/dto/toy-data.dto.ts, src/projection/projection.controller.ts, src/projection/projection.module.ts, src/projection/projection.service.ts, src/projection/projector/grip-result.projector.ts, src/projection/projector/multimodal.projector.ts, src/shared/database/schema/index.ts
- 저장소에 없는 파일 (0건): 없음

<<<src/insert/dto/toy-data.dto.ts 앞부분 80행>>>
import { z } from 'zod';

const cameraIntrinsicSchema = z.object({
  codx: z.number().nullable(),
  cody: z.number(),
  cx: z.number(),
  cy: z.number(),
  fx: z.number(),
  fy: z.number(),
  k1: z.number(),
  k2: z.number(),
  k3: z.number(),
  k4: z.number(),
  k5: z.number(),
  k6: z.number(),
  p1: z.number(),
  p2: z.number(),
});

const cameraInfoSchema = z.object({
  camera_intrinsic_param: cameraIntrinsicSchema,
  camera_name: z.string(),
  camera_type: z.string(),
});

const grip2dPoseSchema = z.object({
  xl: z.number(),
  xr: z.number(),
  yl: z.number(),
  yr: z.number(),
});

const grip3dPoseSchema = z.object({
  x1: z.number(),
  x2: z.number(),
  x3: z.number(),
  x4: z.number(),
  x5: z.number(),
  x6: z.number(),
  x7: z.number(),
  x8: z.number(),
  y1: z.number(),
  y2: z.number(),
  y3: z.number(),
  y4: z.number(),
  y5: z.number(),
  y6: z.number(),
  y7: z.number(),
  y8: z.number(),
  z1: z.number(),
  z2: z.number(),
  z3: z.number(),
  z4: z.number(),
  z5: z.number(),
  z6: z.number(),
  z7: z.number(),
  z8: z.number(),
});

const gripDataSchema = z.object({
  grip_2d_pose: grip2dPoseSchema,
  grip_3d_pose: grip3dPoseSchema,
});

const objectsSchema = z.object({
  annotation_type: z.string(),
  class_name: z.string(),
  package_type: z.string(),
  object_properties: z.array(z.string()),
  id: z.number().int(),
  segmentation_points: z.array(z.array(z.array(z.number()))),
});

const robotTfSchema = z.object({
  rotation_3x3: z.array(z.number()).length(9),
  translation_3x1: z.array(z.number()).length(3),
});

const humanAnnotationSchema = z.object({
  annotation_type: z.string(),
<<<발췌 끝>>>

<<<src/projection/projection.controller.ts 앞부분 80행>>>
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
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/multimodal",
      },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpMultimodal();
  }

  @Post("/grip-result")
  gripResult(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/grip-result",
      },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpGripResult();
  }

  @Post("/insert-all")
  insertAll(): Promise<InsertAndProjectionAllResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/insert-all",
      },
      "projection 요청 수신",
    );

    return this.projectionService.insertAllAndProjectAll();
  }
}

<<<발췌 끝>>>

<<<src/projection/projection.module.ts 앞부분 80행>>>
import { Module } from '@nestjs/common';
import { InsertModule } from '@/insert/insert.module';
import { KafkaSensorValuePublisher, SENSOR_VALUE_PUBLISHER } from '@/projection/kafka/sensor-value.publisher';
import { ProjectionController } from '@/projection/projection.controller';
import { ProjectionService } from '@/projection/projection.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { EVENT_STORE_READER } from '@/projection/repository/event-store-reader.repository';
import { EventStoreReaderRepositoryImpl } from '@/projection/repository/event-store-reader.repository.impl';
import { PROJECTION_CURSOR } from '@/projection/repository/projection-cursor.repository';
import { ProjectionCursorRepositoryImpl } from '@/projection/repository/projection-cursor.repository.impl';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';

@Module({
  imports: [InsertModule],
  controllers: [ProjectionController],
  providers: [
    ProjectionService,
    CatchUpRunner,
    MultiModalProjector,
    GripResultProjector,
    {
      provide: EVENT_STORE_READER,
      useClass: EventStoreReaderRepositoryImpl,
    },
    {
      provide: PROJECTION_CURSOR,
      useClass: ProjectionCursorRepositoryImpl,
    },
    {
      provide: SENSOR_VALUE_PUBLISHER,
      useClass: KafkaSensorValuePublisher,
    },
  ],
  exports: [ProjectionService],
})
export class ProjectionModule {}

<<<발췌 끝>>>

<<<src/projection/projection.service.ts 앞부분 80행>>>
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { ProjectionResult } from '@/projection/projector/projector';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';
import { LogAction } from '@/shared/logger/logging-context';

export type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
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

  async catchUpAll(): Promise<CatchUpAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_START }, "전체 투영 시작");

    const multimodal: ProjectionResult = await this.catchUpMultimodal();
    const gripResult: ProjectionResult = await this.catchUpGripResult();

    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");

    return { multimodal, gripResult };
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

<<<발췌 끝>>>

<<<src/projection/projector/grip-result.projector.ts 앞부분 80행>>>
import { Injectable } from '@nestjs/common';
import { type InferInsertModel } from 'drizzle-orm';
import { PinoLogger } from 'nestjs-pino';
import { type ToyDataDto, toyDataSchema } from '@/insert/dto/toy-data.dto';
import { SensorValueMessage } from '@/projection/kafka/sensor-value.message';
import type { Projector } from '@/projection/projector/projector';
import type { EventStoreEventRow } from '@/projection/repository/event-store-reader.repository';
import { DrizzleTx } from '@/shared/database/drizzle.provider';
import { readGripResult } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

type ReadGripResultInsert = InferInsertModel<typeof readGripResult>;

@Injectable()
export class GripResultProjector implements Projector<ReadGripResultInsert> {
  readonly name: string = "grip-result-projector";

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(GripResultProjector.name);
  }

  map(event: EventStoreEventRow): ReadGripResultInsert {
    let payload: ToyDataDto;
    try {
      payload = toyDataSchema.parse(event.payload);
    } catch (err) {
      this.logger.error(
        {
          action: LogAction.MAP_FAILED,
          err,
          [LogContext.EVENT_ID]: event.eventId,
          [LogContext.STREAM_ID]: event.streamId,
          [LogContext.ATTEMPT_NUM]: event.attemptNum,
          [LogContext.GLOBAL_SEQ]: event.globalSeq,
        },
        "이벤트 매핑(검증) 실패",
      );

      throw err;
    }

    if (payload.objects.length === 0) {
      this.logger.error(
        {
          action: LogAction.MAP_FAILED,
          [LogContext.EVENT_ID]: event.eventId,
          [LogContext.STREAM_ID]: event.streamId,
        },
        "objects 비어 있음",
      );

      throw new Error(
        `grip-result map: empty objects in event ${event.eventId}`,
      );
    }

    this.logger.debug(
      {
        action: LogAction.EVENT_MAPPED,
        [LogContext.PROJECTOR_NAME]: this.name,
        [LogContext.SCENE_KEY]: event.streamId.replace(/^grip-attempt:/, ""),
        [LogContext.ATTEMPT_NUM]: event.attemptNum,
        [LogContext.GLOBAL_SEQ]: event.globalSeq,
      },
      "이벤트 매핑",
    );

    return {
      sceneKey: event.streamId.replace(/^grip-attempt:/, ""),
      attemptNum: event.attemptNum,
      objectName: payload.objects[0].class_name,
      gripSucceed: payload.grip_succeed,
      gripperType: "finger",
      occurredAt: event.occurredAt,
      grip2dPose: payload.grip_data.grip_2d_pose,
      grip3dPose: payload.grip_data.grip_3d_pose,
      robotTf: payload.robot_tf,
      humanAnnotationGrasp: payload.human_annotation_grasp,
      streamId: event.streamId,
      globalSeq: event.globalSeq,
<<<발췌 끝>>>

<<<src/projection/projector/multimodal.projector.ts 앞부분 80행>>>
import { Injectable } from '@nestjs/common';
import { InferInsertModel } from 'drizzle-orm';
import { PinoLogger } from 'nestjs-pino';
import { ToyDataDto, toyDataSchema } from '@/insert/dto/toy-data.dto';
import { IntegrityViolation, Projector } from '@/projection/projector/projector';
import { DrizzleTx } from '@/shared/database/drizzle.provider';
import { readMultimodal } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';
import { EventStoreEventRow } from '../repository/event-store-reader.repository';

type ReadMultimodalInsert = InferInsertModel<typeof readMultimodal>;

// 모달 파일명(2D/video 등)에서 scene(5자리)·attempt(2자리)를 확장자 불문으로 뽑는다.
// 예: ..._00001_01_20230923.jpg → { sceneNum: "00001", attemptNum: 1 }
const MODAL_FILE_NAME_RE: RegExp = /_(\d{5})_(\d{2})_\d{8}\.[A-Za-z0-9]+$/;

// scene_key 는 ..._{sceneNum} 로 끝난다(파서 규칙). 끝의 5자리를 권위 있는 scene 으로 본다.
const SCENE_KEY_NUM_RE: RegExp = /_(\d{5})$/;

type ParsedModalFileName = {
  sceneNum: string;
  attemptNum: number;
};

function parseModalFileName(fileName: string): ParsedModalFileName | null {
  const matched = MODAL_FILE_NAME_RE.exec(fileName);

  if (matched === null) {
    return null;
  }

  return { sceneNum: matched[1], attemptNum: Number(matched[2]) };
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

@Injectable()
export class MultiModalProjector implements Projector<ReadMultimodalInsert> {
  readonly name: string = "multimodal-projector";

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(MultiModalProjector.name);
  }

  map(event: EventStoreEventRow): ReadMultimodalInsert {
    let payload: ToyDataDto;
    try {
      payload = toyDataSchema.parse(event.payload);
    } catch (err) {
      this.logger.error(
        {
          action: LogAction.MAP_FAILED,
          err,
          [LogContext.EVENT_ID]: event.eventId,
          [LogContext.STREAM_ID]: event.streamId,
          [LogContext.ATTEMPT_NUM]: event.attemptNum,
          [LogContext.GLOBAL_SEQ]: event.globalSeq,
        },
        "이벤트 매핑(검증) 실패",
      );

      throw err;
    }

    this.logger.debug(
      {
        action: LogAction.EVENT_MAPPED,
        [LogContext.PROJECTOR_NAME]: this.name,
        [LogContext.SCENE_KEY]: event.streamId.replace(/^grip-attempt:/, ""),
        [LogContext.ATTEMPT_NUM]: event.attemptNum,
        [LogContext.GLOBAL_SEQ]: event.globalSeq,
      },
      "이벤트 매핑",
    );

    return {
      sceneKey: event.streamId.replace(/^grip-attempt:/, ""),
      attemptNum: event.attemptNum,
<<<발췌 끝>>>

[Docs] — 채점 대상 문서 전문
<<<Docs 시작>>>
---
docId: analysis-50eed889-a94b-4d1b-af92-63a4888e32ea
generatedAt: 2026-08-10T15:38:35.913Z
targetReadModel: read_grip_sensor_drift
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: v1
  to: v2
  affectedEndpoints:
    - "POST /multimodal"
    - "POST /grip-result"
    - "POST /grip-sensor-drift"
    - "POST /insert-all"
evidenceSources:
  - { origin: developer-logging, anchorId: "50eed889-a94b-4d1b-af92-63a4888e32ea" }
  - { origin: developer-logging, anchorId: "c5fed003-3e08-4b5b-b1b1-609437002eff" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_grip_sensor_drift

> 결론(TL;DR): `read_grip_sensor_drift`을(를) 재생성한다 — Toy-Data batch 적재 중 payload 검증 로직이 미지정 열(conveyor_speed, gripper_temperature)을 발견. Zod 파일 단위 적재는 성공하나 Read Model 매핑 파이프라인은 이 신규 키를 미적정 처리할 가능성이 높음. (이상 유형: 스키마 드리프트(신규 키 유입) · 심각도: warning)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `insert.request`(level 30) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `payload.schema.drift`(level 40) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 54회, `insight.cards.request`(level 30) 2회, `-`(level 30) 4회, `insight.card.rendered`(level 20) 6회, `insert.batch.done`(level 30) 1회, `-`(level 20) 8회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 15:38:28.657 | 30 | insert.request | 50eed889-a94b-4d1b-af92-63a4888e32ea | - | - | - | Insert Event Store 요청 수신 | - |
| 15:38:28.658 | 30 | insert.batch.start | 50eed889-a94b-4d1b-af92-63a4888e32ea | - | - | - | Toy-Data 적재 시작 | - |
| 15:38:28.663 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00001 | 1 | 1 | 이벤트 append | - |
| 15:38:28.663 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00001 | 1 | 1 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00001_01_20230923.json |
| 15:38:28.664 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00002 | 3 | 2 | 이벤트 append | - |
| 15:38:28.664 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00002 | 3 | 2 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00002_03_20230923.json |
| 15:38:28.664 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00005 | 3 | 3 | 이벤트 append | - |
| 15:38:28.664 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00005 | 3 | 3 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00005_03_20230923.json |
| 15:38:28.666 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 1 | 4 | 이벤트 append | - |
| 15:38:28.666 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 1 | 4 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00009_01_20230923.json |
| 15:38:28.666 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 3 | 5 | 이벤트 append | - |
| 15:38:28.666 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 3 | 5 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00009_03_20230923.json |
| 15:38:28.667 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 2 | 6 | 이벤트 append | - |
| 15:38:28.667 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 2 | 6 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00011_02_20230923.json |
| 15:38:28.668 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 3 | 7 | 이벤트 append | - |
| 15:38:28.668 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 3 | 7 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00011_03_20230923.json |
| 15:38:28.669 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00015 | 1 | 8 | 이벤트 append | - |
| 15:38:28.669 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00015 | 1 | 8 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00015_01_20230923.json |
| 15:38:28.670 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018 | 1 | 9 | 이벤트 append | - |
| 15:38:28.670 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018 | 1 | 9 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00018_01_20230923.json |
| 15:38:28.671 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00019 | 3 | 10 | 이벤트 append | - |
| 15:38:28.671 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00019 | 3 | 10 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00019_03_20230923.json |
| 15:38:28.672 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00021 | 2 | 11 | 이벤트 append | - |
| 15:38:28.672 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00021 | 2 | 11 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00021_02_20230923.json |
| 15:38:28.672 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00026 | 2 | 12 | 이벤트 append | - |
| 15:38:28.672 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00026 | 2 | 12 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00026_02_20230923.json |
| 15:38:28.673 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 2 | 13 | 이벤트 append | - |
| 15:38:28.673 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 2 | 13 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00027_02_20230923.json |
| 15:38:28.674 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 3 | 14 | 이벤트 append | - |
| 15:38:28.674 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 3 | 14 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00027_03_20230923.json |
| 15:38:28.675 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00029 | 3 | 15 | 이벤트 append | - |
| 15:38:28.675 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00029 | 3 | 15 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00029_03_20230923.json |
| 15:38:28.676 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00030 | 2 | 16 | 이벤트 append | - |
| 15:38:28.676 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00030 | 2 | 16 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00030_02_20230923.json |
| 15:38:28.676 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00036 | 3 | 17 | 이벤트 append | - |
| 15:38:28.676 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00036 | 3 | 17 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00036_03_20230923.json |
| 15:38:28.678 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00039 | 2 | 18 | 이벤트 append | - |
| 15:38:28.678 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00039 | 2 | 18 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00039_02_20230923.json |
| 15:38:28.679 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00041 | 2 | 19 | 이벤트 append | - |
| 15:38:28.679 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00041 | 2 | 19 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00041_02_20230923.json |
| 15:38:28.680 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00047 | 1 | 20 | 이벤트 append | - |
| 15:38:28.680 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00047 | 1 | 20 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00047_01_20230923.json |
| 15:38:28.680 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 21 | 이벤트 append | - |
| 15:38:28.680 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 21 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00051_02_20230923.json |
| 15:38:28.681 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 22 | 이벤트 append | - |
| 15:38:28.681 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 22 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00055_03_20230923.json |
| 15:38:28.682 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 23 | 이벤트 append | - |
| 15:38:28.682 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 23 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00056_02_20230923.json |
| 15:38:28.683 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 24 | 이벤트 append | - |
| 15:38:28.683 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 24 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00059_02_20230923.json |
| 15:38:28.684 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 25 | 이벤트 append | - |
| 15:38:28.684 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 25 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00061_03_20230923.json |
| 15:38:28.684 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02000 | 1 | 26 | 이벤트 append | - |
| 15:38:28.684 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02000 | 1 | 26 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_02000_01_20230923.json |
| 15:38:28.685 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02001 | 1 | 27 | 이벤트 append | - |
| 15:38:28.685 | 20 | insert.file.ok | 50eed889-a94b-4d1b-af92-63a4888e32ea | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02001 | 1 | 27 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_02001_01_20230923.json |
| 15:38:28.685 | 40 | payload.schema.drift | 50eed889-a94b-4d1b-af92-63a4888e32ea | - | - | - | payload 에 스키마가 모르는 신규 키 유입 — 적재 시 유실됨(Read Model 후보) ← 트립 앵커 | newKeys={"conveyor_speed": "1.2", "gripper_temperature": "36.5"} |
| 15:38:28.685 | 30 | insert.batch.done | 50eed889-a94b-4d1b-af92-63a4888e32ea | - | - | - | toy-data 적재 완료 | - |
| 15:38:28.685 | 30 | - | 50eed889-a94b-4d1b-af92-63a4888e32ea | - | - | - | request completed | - |
| 15:38:28.688 | 30 | projection.request | c5fed003-3e08-4b5b-b1b1-609437002eff | - | - | - | projection 요청 수신 | - |
| 15:38:28.690 | 30 | projection.start | c5fed003-3e08-4b5b-b1b1-609437002eff | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 15:38:28.690 | 20 | - | c5fed003-3e08-4b5b-b1b1-609437002eff | - | - | - | 커서 조회 | projector=multimodal-projector |
| 15:38:28.692 | 20 | projection.event.mapped | c5fed003-3e08-4b5b-b1b1-609437002eff | - | 1 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 15:38:28.692 | 20 | - | c5fed003-3e08-4b5b-b1b1-609437002eff | - | - | - | 이벤트 조회 | - |
| 15:38:28.694 | 20 | projection.event.mapped | c5fed003-3e08-4b5b-b1b1-609437002eff | - | 3 | 2 | 이벤트 매핑 | projector=multimodal-projector |

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
- (level 40, `payload.schema.drift`) payload 에 스키마가 모르는 신규 키 유입 — 적재 시 유실됨(Read Model 후보) ← 트립 앵커 → Zod 검증은 통과하나 newKeys conveyor_speed/gripper_temperature 유입을 경고, 기존 Read Model 구조적 부족이 신규 키를 무시할 가능성이 높음. [corr:50eed889-a94b-4d1b-af92-63a4888e32ea]
- (level 30, `projection.start`) catch-up 시작 → 기존 프로젝터 매핑 파이프라인이 실행되며, 신규 키 미적정 처리로 적재 시 데이터 유실 발생을 재확인. [corr:c5fed003-3e08-4b5b-b1b1-609437002eff]
- read_grip_result Insight 카드의 실제 컬럼명·의미: scene_key, attempt_num, object_name, grip_succeed, gripper_type, occurred_at, grip_2d_pose, grip_3d_pose, robot_tf, human_annotation_grasp, stream_id, global_seq. conveyor_speed/gripper_temperature 누락.
- read_multimodal Insight 카드의 실제 컬럼명·의미: scene_key, attempt_num, occurred_at, image_2d_file_name, image_2d_uri, video_file_name, video_uri, stream_id, global_seq. 신규 키 미적정 처리.
- GripResultProjector.map() (src/projection/projector/grip-result.projector.ts) 소스: return { sceneKey: ..., attemptNum: ..., objectName: payload.objects[0].class_name, ... } 구조가 고정되어 payload.conveyor_speed/payload.gripper_temperature를 미추출.
- MultiModalProjector.map() (src/projection/projector/multimodal.projector.ts) 소스: 동일하게 payload 필드 매핑이 고정되어 신규 키 유입을 무시.

### Decision Drivers
- Schema drift handling (신규 키 무해화 격리)
- Read Model isolation (도메인 정합성 규칙 준수)
- Zero data loss guarantee (적재 시 유실 방지)
- Traceability & Auditability (신원 데이터 추적 고도)

### Considered Options
#### 기각 대안: 기존 Read Model 보강
- 접근: GripResultProjector.map() return 객체에 conveyor_speed, gripper_temperature 추가 필드 주입.
- 제안 필드: read_grip_result.conveyor_speed, read_grip_result.gripper_temperature
- 트레이드오프: ALTER COLUMN 필요, 도메인 정합성 규칙 위반(센서 데이터와 그리퍼 결과 혼임), 추적 키 혼다. 실패 Driver: Read Model isolation & Zero data loss guarantee.
```typescript
return { ...row, conveyor_speed: payload.conveyor_speed, gripper_temperature: payload.gripper_temperature };
```

#### 권고 대안: newReadModel
- 접근: read_grip_sensor_drift 테이블 생성, 전용 Projector 또는 기존 파이프라인 확성으로 conveyor_speed, gripper_temperature 매핑.
- 제안 필드: read_grip_sensor_drift.conveyor_speed, read_grip_sensor_drift.gripper_temperature
- 트레이드오프: DDL/API 버전 증가 동반, 기존 테이블 무수한, 신규 키 완전 격리·무해화. 성공 Driver: Schema drift handling & Traceability.
```typescript
return { sceneKey: event.streamId.replace(/^grip-attempt:/, ''), attemptNum: event.attemptNum, occurredAt: event.occurredAt, conveyorSpeed: payload.conveyor_speed, gripperTemperature: payload.gripper_temperature, streamId: event.streamId, globalSeq: event.globalSeq };
```

#### 대안: versionSwitch
- 접근: API version bump 명시, read_grip_sensor_drift 배포 동시, 클라이언트 연산자에서 새 테이블 조회 시 버전을 요구.
- 제안 필드: api_version
- 트레이드오프: 호환성 유지, 매핑 고도 미해. 실패 Driver: Zero data loss guarantee (버전만 변경으론 매핑 고도 미해).
```typescript
// ProjectionController @Post('/insert-all') 버전을 명시로 응답 wrapper 추가.
```

### Decision Outcome
newReadModel (신규 Read Model 분리) - 신규 키 유입은 기존 도메인 정합성 규칙을 위반지나 Read Model 구조적 부족이므로 전용 테이블 분리가 무해화 및 추적에 가장 부합.

### Consequences
- (+) read_grip_sensor_drift 테이블로 신규 키 완전 격리·무해화 보장.
- (+) 기존 read_grip_result/read_multimodal 정합성 규칙 무수한, 추적 고도 유지.
- (+) Zod 검증 통과 데이터 유실 방지, LLM 관찰자 기준선 비교 가능.
- (−) DDL 스키마 확성으로 API 버전 반드시 증가해야, 클라이언트 연산자 호환성 관리 필요.
- (−) 신규 Projector 등록 및 catch-up 파이프라인 확성 작업 부하 발생.

### Non-Goals
- z.coerce/기본값 치환으로 정상값처럼 꾸며 Read Model 유입 권고 (거절·격리 유지 원칙).
- 기존 테이블 ALTER COLUMN 또는 필드 재사용.
- Zod 스키마 수정으로 신규 키 강제 정의 (적재 시 차단 방지 목표 아님).

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

- 대상: `read_grip_sensor_drift` · 키: (scene_key, attempt_num) · 원천 이벤트: GripAttemptRecorded

```sql
CREATE TABLE read_grip_sensor_drift (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  occurred_at timestamptz,
  conveyor_speed double precision,
  gripper_temperature double precision,
  stream_id varchar,
  global_seq bigint,
  PRIMARY KEY (scene_key, attempt_num)
);
```

### 필드

```mschema
# Table: read_grip_sensor_drift
[
(scene_key:varchar, 장면 식별 키 = stream_id.replace(/^grip-attempt:/, ""), Primary Key),
(attempt_num:smallint, 동일 장면 내 파지 시도 번호 (파일명 attempt), Primary Key),
(occurred_at:timestamptz, 데이터 촬영 일자),
(conveyor_speed:double precision, 컨베이 벨트 속도 (payload 드리프트 유입)),
(gripper_temperature:double precision, 그리퍼 온도 (payload 드리프트 유입)),
(stream_id:varchar, ES 스트림 ID),
(global_seq:bigint, 투영 출처 이벤트의 ES 전역 시퀀스)
]
```

### 투영 매핑 명세 (이벤트 → 컬럼)

> upsert 키: scene_key,attempt_num · 리플레이: projection_cursor 초기화 시 global_seq 기준 재시작. catch-up 전체 재투영 시 upsert 전 상태 확인(멱idency)으로 중복/과업 방지.

| 원천 이벤트 | payload 필드 | 컬럼 | 변환 |
| --- | --- | --- | --- |
| GripAttemptRecorded | conveyor_speed | conveyor_speed | string to double cast |
| GripAttemptRecorded | gripper_temperature | gripper_temperature | string to double cast |

파생 컬럼(이벤트 payload 아님):
- `scene_key` ← stream_id.replace(/^grip-attempt:/, '')
- `attempt_num` ← extract attempt number from stream_id filename segment (e.g., _01_)
- `occurred_at` ← parse YYYYMMDD date string from filename to ISO timestamp
- `stream_id` ← event streamId property
- `global_seq` ← event globalSeq property

### Insight 카드 등록 (Insight Read DB 동기화)

> DDL 적용 시 아래 카드 등록도 함께 실행한다 — 다음 분석부터 신규 Read Model 이 LLM 컨텍스트에 노출된다.

```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_grip_sensor_drift', 'read_model', 'payload 스키마 드리프트(conveyor_speed, gripper_temperature) 관측을 시도 단위 행으로 격어 Read Model 레이어에서 유실 방지 및 시계열/조건별 조회 지원', '(scene_key, attempt_num)')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_grip_sensor_drift', 'scene_key', 'varchar', '장면 식별 키 = stream_id.replace(/^grip-attempt:/, "")', 1),
  ('read_grip_sensor_drift', 'attempt_num', 'smallint', '동일 장면 내 파지 시도 번호 (파일명 attempt)', 2),
  ('read_grip_sensor_drift', 'occurred_at', 'timestamptz', '데이터 촬영 일자', 3),
  ('read_grip_sensor_drift', 'conveyor_speed', 'double precision', '컨베이 벨트 속도 (payload 드리프트 유입)', 4),
  ('read_grip_sensor_drift', 'gripper_temperature', 'double precision', '그리퍼 온도 (payload 드리프트 유입)', 5),
  ('read_grip_sensor_drift', 'stream_id', 'varchar', 'ES 스트림 ID', 6),
  ('read_grip_sensor_drift', 'global_seq', 'bigint', '투영 출처 이벤트의 ES 전역 시퀀스', 7)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased (v1 → v2)

#### Added
- 신규 Read Model read_grip_sensor_drift 테이블 및 Drizzle 스키마
- GripSensorDriftProjector 구현 (payload 드리프트 키 추출/정합성)
- /projection/grip-sensor-drift 라우트 및 ProjectionService.catchUpGripSensorDrift 배선

### 마이그레이션 절차

- 하위호환 변경: 기존 read_grip_result, read_multimodal 테이블/라우트/프로젝터 무변; 신규 v2 모델은 동동 stream_id/attempt_num 키로 독립 투영 병행 가능
- 파괴적 변경: 없음
- 컷오버 전 테스트: 1. migrationSql 로 read_grip_sensor_drift 생성 실행 검증
2. correlation 50eed889... batch 적재 후, v2 projector catch-up 결과 row count > 0 및 conveyor_speed/gripper_temperature 값 매칭 확인
3. 기존 multimodal/grip-result projection result unchanged assertion
- 롤백 창/조건: v2 성능/용도 저해 시: ProjectionService DI 제거, /grip-sensor-drift 라우트 삭제, read_grip_sensor_drift 테이블 DROP via migration rollback script. v1 catch-up runner 재적재.
- Insight 카드 등록: §2의 카드 등록 SQL을 DDL과 함께 적용(카탈로그 동기화)

### 사유·호환성

- 사유: v1 GripResultProjector.map() 의 Zod 스키마 파싱이 미지정 열(conveyor_speed, gripper_temperature) 을 silently drop 처리하여 드리프트 키 유실 [corr:50eed889-a94b-4d1b-af92-63a4888e32ea]. 신규 Read Model 과 전용 프로젝터를 배선하여 동시 보존 및 센서 값 관찰 메시지 발행.
- 트리거 근거: | 15:38:28.685 | 40 | payload.schema.drift | 50eed889-a94b-4d1b-af92-63a4888e32ea | - | - | - | payload 에 스키마가 모르는 신규 키 유입 — 적재 시 유실됨(Read Model 후보) ← 트립 앵커 | newKeys={"conveyor_speed": "1.2", "gripper_temperature": "36.5"} |
- v1 호환성: 기존 read_grip_result, read_multimodal 테이블/라우트/프로젝터 무변. 신규 v2 모델은 동동 stream_id/attempt_num 키로 독립 투영 병행 가능.

### 변경 파일

- `src/shared/database/schema/index.ts` (modifyFile) — 신규 스키마 export 배선. 기존 export 무변.
- `src/projection/projection.service.ts` (modifyFile) — 신규 프로젝트 DI, catchUpAll/insertAllAndProjectAll 결과 타입 확장. 기존 메서드 무변.
- `src/projection/projection.controller.ts` (modifyFile) — 신규 /grip-sensor-drift 라우트 배선. 기존 엔드포인트 무변.

## Optional — 부속 자료(컨텍스트 축소 시 생략 가능)

### 신규 Read Model — Drizzle 스키마

```ts
import { bigint, doublePrecision, pgTable, primaryKey, smallint, timestamp, varchar } from 'drizzle-orm/pg-core';

export const readGripSensorDrift = pgTable(
  "read_grip_sensor_drift",
  {
    sceneKey: varchar("scene_key").notNull(),
    attemptNum: smallint("attempt_num").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }),
    conveyorSpeed: doublePrecision("conveyor_speed"),
    gripperTemperature: doublePrecision("gripper_temperature"),
    streamId: varchar("stream_id"),
    globalSeq: bigint("global_seq", { mode: "number" }),
  },
  (t) => [primaryKey({ columns: [t.sceneKey, t.attemptNum] })],
);

```

### 신규 Read Model — Projector

```ts
import { Injectable } from '@nestjs/common';
import { type InferInsertModel } from 'drizzle-orm';
import { PinoLogger } from 'nestjs-pino';
import { toyDataSchema } from '@/insert/dto/toy-data.dto';
import type { Projector } from '@/projection/projector/projector';
import type { EventStoreEventRow } from '@/projection/repository/event-store-reader.repository';
import { DrizzleTx } from '@/shared/database/drizzle.provider';
import { readGripSensorDrift } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

type GripSensorDriftProjectorInsert = InferInsertModel<typeof readGripSensorDrift>;

function toNumberOrNull(value: unknown): number | null {
  if (value === undefined || value === null) {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

@Injectable()
export class GripSensorDriftProjector implements Projector<GripSensorDriftProjectorInsert> {
  readonly name: string = "grip-sensor-drift-projector";

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(GripSensorDriftProjector.name);
  }

  map(event: EventStoreEventRow): GripSensorDriftProjectorInsert {
    // 결정론 합성 프로젝터 — payload 접근 경로는 적재 스키마(ToyDataDto)에서 결정론
    // 유도했다. 유도 불가 컬럼은 TODO 주석으로 남겼다(§2 투영 매핑 명세가 대조 계약).
    const parsedPayload = toyDataSchema.passthrough().safeParse(event.payload);
    if (!parsedPayload.success) {
      this.logger.error(
        {
          action: LogAction.MAP_FAILED,
          [LogContext.STREAM_ID]: event.streamId,
          [LogContext.GLOBAL_SEQ]: event.globalSeq,
        },
        "이벤트 매핑(검증) 실패",
      );
      throw parsedPayload.error;
    }
    const payload = parsedPayload.data;

    this.logger.debug(
      {
        action: LogAction.EVENT_MAPPED,
        [LogContext.PROJECTOR_NAME]: this.name,
        [LogContext.GLOBAL_SEQ]: event.globalSeq,
      },
      "이벤트 매핑",
    );

    return {
      sceneKey: event.streamId.replace(/^grip-attempt:/, ""),
      attemptNum: event.attemptNum,
      occurredAt: event.occurredAt,
      conveyorSpeed: toNumberOrNull(payload["conveyor_speed"]),
      gripperTemperature: toNumberOrNull(payload["gripper_temperature"]),
      streamId: event.streamId,
      globalSeq: event.globalSeq,
    };
  }

  async upsert(tx: DrizzleTx, row: GripSensorDriftProjectorInsert): Promise<void> {
    await tx
      .insert(readGripSensorDrift)
      .values(row)
      .onConflictDoUpdate({
        target: [readGripSensorDrift.sceneKey, readGripSensorDrift.attemptNum],
        set: {
          occurredAt: row.occurredAt,
          conveyorSpeed: row.conveyorSpeed,
          gripperTemperature: row.gripperTemperature,
          streamId: row.streamId,
          globalSeq: row.globalSeq,
        },
      });
  }
}

```

### 신규 Read Model — 배선(컨트롤러/서비스/모듈)

```ts
// src/shared/database/schema/index.ts
export * from "./insight/insight-entity";
export * from "./insight/insight-field";
export * from "./log/log-cursor";
export * from "./log/log-event";
export * from "./service/event";
export * from "./service/projection-cursor";
export * from "./service/read-grip-result";
export * from "./service/read-multimodal";
export * from "./service/read-grip-sensor-drift";

// src/insert/dto/toy-data.dto.ts (zod 스키마 확장)
import { z } from 'zod';
// ... 기존 toyDataSchema 정의 ...
export const toyDataSchemaWithDrift = toyDataSchema.extend({
  conveyor_speed: z.coerce.number().optional(),
  gripper_temperature: z.coerce.number().optional(),
});

// src/projection/projection.service.ts (catchUp 메서드 추가)
catchUpGripSensorDrift(): Promise<ProjectionResult> {
  return this.runner.run(this.gripSensorDrift);
}

// src/projection/projection.controller.ts (@Post 라우트 추가)
@Post("/grip-sensor-drift")
gripSensorDrift(): Promise<ProjectionResult> {
  this.logger.info(
    {
      action: LogAction.PROJECTION_REQUEST,
      [LogContext.ROUTE]: "POST /projection/grip-sensor-drift",
    },
    "projection 요청 수신",
  );

  return this.projectionService.catchUpGripSensorDrift();
}

// src/projection/projection.module.ts (providers 등록)
providers: [
  // ... 기존 ...
  GripSensorDriftProjector,
]
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
export * from "./service/read-grip-sensor-drift";
```

### 버전 교체 코드 — `src/projection/projection.service.ts` (modifyFile)

```typescript
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { GripSensorDriftProjector } from '@/projection/projector/grip-sensor-drift.projector';
import { ProjectionResult } from '@/projection/projector/projector';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';
import { LogAction } from '@/shared/logger/logging-context';

export type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
  gripSensorDrift: ProjectionResult;
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
    private readonly gripSensorDrift: GripSensorDriftProjector,
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

  catchUpGripSensorDrift(): Promise<ProjectionResult> {
    return this.runner.run(this.gripSensorDrift);
  }

  async catchUpAll(): Promise<CatchUpAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_START }, "전체 투영 시작");

    const multimodal: ProjectionResult = await this.catchUpMultimodal();
    const gripResult: ProjectionResult = await this.catchUpGripResult();
    const gripSensorDrift: ProjectionResult = await this.catchUpGripSensorDrift();

    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");

    return { multimodal, gripResult, gripSensorDrift };
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
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/multimodal",
      },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpMultimodal();
  }

  @Post("/grip-result")
  gripResult(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/grip-result",
      },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpGripResult();
  }

  @Post("/grip-sensor-drift")
  gripSensorDrift(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/grip-sensor-drift",
      },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpGripSensorDrift();
  }

  @Post("/insert-all")
  insertAll(): Promise<InsertAndProjectionAllResult> {
    this.logger.info(
      { action: LogAction.PROJECTION_REQUEST, [LogContext.ROUTE]: "POST /projection/insert-all" },
      "projection 요청 수신",
    );

    return this.projectionService.insertAllAndProjectAll();
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
- groundedness (근거 충실성): Docs 가 인용한 값·필드·장면 번호·로그가 [자료]에 실제로 있는가. [저장소 파일 확인]에서 실재하는 파일의 경로·스키마·메서드 인용은 근거 없는 주장으로 보지 않는다. 존재하지 않는 파일이나 발췌와 다른 내용의 인용은 감점한다. 5=인용된 값·필드·장면이 모두 자료에 실재. 3=핵심 근거는 실재하나 일부 수치·부등호가 원문과 불일치. 1=근거 없는 주장이나 존재하지 않는 값의 인용이 결론을 좌우.
- diagnosisAccuracy (원인 진단 정확성): Docs 의 진단이 [정답 요지]와 일치하는가. 5=정답 원인과 유형·위치(필드, 장면, 처리 단계)까지 일치. 3=유형은 맞으나 위치나 메커니즘이 부정확. 1=오진이거나 원인을 특정하지 못함.
- actionability (실행 가능성): Docs 의 SQL 과 절차를 그대로 따르면 문제가 해결되는가. [자동 검증 결과]를 실측으로 반영하되, 실행·컴파일이 되더라도 의도와 다른 일을 하는 코드는 감점한다. 반드시 다음을 직접 확인한다: (1) 프로젝션 로직이 DDL 의 NOT NULL 컬럼에 null 이나 TODO 를 넣어 실제 적재 시 실패하지 않는가, (2) upsert 의 excluded. 뒤 식별자가 DDL 의 실제 컬럼명(snake_case)인가, (3) 비율·평균 계산이 정수 나눗셈으로 0/1 만 저장되지 않는가, (4) 정답이 요구한 값(성공률·실패율 등)이 실제 컬럼으로 존재하는가, (5) CHECK 제약이 플래그로 격리해야 할 바로 그 행의 적재를 막아 설계와 모순되지 않는가, (6) 기각했다고 쓴 조치(DELETE 등)를 즉시 격리 SQL 로 그대로 싣지 않았는가, (7) 기존 v1 테이블(read_grip_result, read_multimodal, event_store)의 행을 ALTER/DROP/DELETE 하지 않는가, (8) 정답 요지가 Read Model 보강을 요구하는데 검증용 SELECT 만 있지 않은가. 5=그대로 따르면 해결(실행 성공 + 요구 충족, 위 결함 없음). 4=위 결함 중 사소한 것 1개. 3=오탈자·순서·식별자 등 소폭 수정 후 해결. 2=따르면 적재·투영이 실패하거나 요구한 값을 얻지 못함. 1=따르면 기존 자산이 손상되거나 무관함.
- completeness (완결성): 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소가 모두 유효하고 서로 일치하는가. 반드시 다음을 직접 확인한다: (1) TL;DR·머리말의 대상 테이블과 DDL 의 테이블명이 같은가, (2) 권고(Decision Outcome, Non-Goals)와 실제 SQL·코드가 모순되지 않는가(예: '보강한다'고 쓰고 '구조 변경 없음'이라 함, '기존 확장'이라 쓰고 신규 테이블을 만듦), (3) 코드 블록 사이의 클래스명·파일명·라우트명·export 경로가 서로 같은가, (4) DDL 의 nullable 과 ORM 스키마의 notNull 이 일치하는가, (5) 권고 절이 '재실행 권장'·'최소 근거만 수록' 같은 대체 스텁이 아닌가, (6) API 버저닝 절이 비어 있거나 문장이 끊기지 않았는가. 5=세 요소가 모두 유효하고 서로 일치. 4=사소한 불일치 1개. 3=세 요소가 있으나 서로 어긋나거나 항목이 비어 있음. 2=한 요소가 실질적으로 비어 있음(예: DDL 절에 검증 SELECT 만). 1=요소 누락 또는 근거 부족 표시.

다음 형식의 JSON 객체 하나만 출력하라:
{"groundedness": 1-5, "diagnosisAccuracy": 1-5, "actionability": 1-5, "completeness": 1-5, "unsupportedClaims": ["자료에 없는 주장 인용 (없으면 빈 배열)"], "rationale": "각 항목 점수 근거를 항목당 1~2문장으로, 한국어로"}
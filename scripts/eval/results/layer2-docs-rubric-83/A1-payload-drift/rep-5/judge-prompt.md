당신은 이벤트 소싱 + CQRS 기반 Physical AI 데이터 플랫폼의 시니어 아키텍트이자 엄격한 평가자다. LLM 파이프라인이 [자료](로그·이벤트·스키마 정보)를 보고 [Docs]를 생성했다. Docs 는 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소를 항상 함께 담아야 하는 단일 산출물이다. 당신은 [정답 요지]와 [자료], [자동 검증 결과]를 기준으로 Docs 를 네 항목의 루브릭으로 채점한다. 채점은 관대하지 않게, 근거 없는 주장·지어낸 값·의도와 다른 SQL·서로 어긋나는 절에는 낮은 점수를 준다. 반드시 JSON 객체 하나만 출력한다. 설명문·마크다운 펜스는 출력하지 않는다.

---

[시나리오] A1-payload-drift
[상황] 운영 중 시스템이 경고 수준의 이상 로그를 감지했다.
[정답 요지] 적재 payload 최상위에 스키마 밖 신규 필드(gripper_temperature, conveyor_speed)가 유입되어 적재 시 유실됨(payload.schema.drift). 조치: 기존 v1 테이블은 건드리지 않고 신규 키를 담는 새 Read Model(또는 v2)을 만들고 API 를 v2 로 병행 운영.

[자료] — Docs 생성 시 파이프라인이 받은 로그·이벤트·스키마 정보
<<<자료 시작>>>
<logging_context>
## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `insert.request`(level 30) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `payload.schema.drift`(level 40) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 54회, `-`(level 30) 2회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 03:17:15.762 | 30 | insert.request | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | - | - | - | Insert Event Store 요청 수신 | - |
| 03:17:15.762 | 30 | insert.batch.start | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | - | - | - | Toy-Data 적재 시작 | - |
| 03:17:15.768 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00001 | 1 | 1 | 이벤트 append | - |
| 03:17:15.768 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00001 | 1 | 1 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00001_01_20230923.json |
| 03:17:15.769 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00002 | 3 | 2 | 이벤트 append | - |
| 03:17:15.769 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00002 | 3 | 2 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00002_03_20230923.json |
| 03:17:15.770 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00005 | 3 | 3 | 이벤트 append | - |
| 03:17:15.770 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00005 | 3 | 3 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00005_03_20230923.json |
| 03:17:15.771 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 1 | 4 | 이벤트 append | - |
| 03:17:15.771 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 1 | 4 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00009_01_20230923.json |
| 03:17:15.772 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 3 | 5 | 이벤트 append | - |
| 03:17:15.772 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 3 | 5 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00009_03_20230923.json |
| 03:17:15.773 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 2 | 6 | 이벤트 append | - |
| 03:17:15.773 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 2 | 6 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00011_02_20230923.json |
| 03:17:15.774 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 3 | 7 | 이벤트 append | - |
| 03:17:15.774 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 3 | 7 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00011_03_20230923.json |
| 03:17:15.775 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00015 | 1 | 8 | 이벤트 append | - |
| 03:17:15.775 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00015 | 1 | 8 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00015_01_20230923.json |
| 03:17:15.776 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018 | 1 | 9 | 이벤트 append | - |
| 03:17:15.776 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018 | 1 | 9 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00018_01_20230923.json |
| 03:17:15.777 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00019 | 3 | 10 | 이벤트 append | - |
| 03:17:15.777 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00019 | 3 | 10 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00019_03_20230923.json |
| 03:17:15.778 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00021 | 2 | 11 | 이벤트 append | - |
| 03:17:15.778 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00021 | 2 | 11 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00021_02_20230923.json |
| 03:17:15.779 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00026 | 2 | 12 | 이벤트 append | - |
| 03:17:15.779 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00026 | 2 | 12 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00026_02_20230923.json |
| 03:17:15.779 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 2 | 13 | 이벤트 append | - |
| 03:17:15.779 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 2 | 13 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00027_02_20230923.json |
| 03:17:15.780 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 3 | 14 | 이벤트 append | - |
| 03:17:15.780 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 3 | 14 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00027_03_20230923.json |
| 03:17:15.781 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00029 | 3 | 15 | 이벤트 append | - |
| 03:17:15.781 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00029 | 3 | 15 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00029_03_20230923.json |
| 03:17:15.782 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00030 | 2 | 16 | 이벤트 append | - |
| 03:17:15.782 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00030 | 2 | 16 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00030_02_20230923.json |
| 03:17:15.783 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00036 | 3 | 17 | 이벤트 append | - |
| 03:17:15.783 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00036 | 3 | 17 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00036_03_20230923.json |
| 03:17:15.783 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00039 | 2 | 18 | 이벤트 append | - |
| 03:17:15.783 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00039 | 2 | 18 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00039_02_20230923.json |
| 03:17:15.784 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00041 | 2 | 19 | 이벤트 append | - |
| 03:17:15.784 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00041 | 2 | 19 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00041_02_20230923.json |
| 03:17:15.785 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00047 | 1 | 20 | 이벤트 append | - |
| 03:17:15.785 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00047 | 1 | 20 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00047_01_20230923.json |
| 03:17:15.786 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 21 | 이벤트 append | - |
| 03:17:15.786 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 21 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00051_02_20230923.json |
| 03:17:15.786 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 22 | 이벤트 append | - |
| 03:17:15.786 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 22 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00055_03_20230923.json |
| 03:17:15.787 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 23 | 이벤트 append | - |
| 03:17:15.787 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 23 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00056_02_20230923.json |
| 03:17:15.788 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 24 | 이벤트 append | - |
| 03:17:15.788 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 24 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00059_02_20230923.json |
| 03:17:15.789 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 25 | 이벤트 append | - |
| 03:17:15.789 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 25 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00061_03_20230923.json |
| 03:17:15.790 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02000 | 1 | 26 | 이벤트 append | - |
| 03:17:15.790 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02000 | 1 | 26 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_02000_01_20230923.json |
| 03:17:15.791 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02001 | 1 | 27 | 이벤트 append | - |
| 03:17:15.791 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02001 | 1 | 27 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_02001_01_20230923.json |
| 03:17:15.791 | 40 | payload.schema.drift | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | - | - | - | payload 에 스키마가 모르는 신규 키 유입 — 적재 시 유실됨(Read Model 후보) ← 트립 앵커 | newKeys={"conveyor_speed": "1.2", "gripper_temperature": "36.5"} |
| 03:17:15.791 | 30 | insert.batch.done | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | - | - | - | toy-data 적재 완료 | - |
| 03:17:15.791 | 30 | - | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | - | - | - | request completed | - |
| 03:17:15.794 | 30 | projection.request | dbeca2b0-5294-467d-8eaf-ea167c2b715b | - | - | - | projection 요청 수신 | - |
| 03:17:15.795 | 20 | - | dbeca2b0-5294-467d-8eaf-ea167c2b715b | - | - | - | 커서 조회 | projector=multimodal-projector |
| 03:17:15.795 | 30 | projection.start | dbeca2b0-5294-467d-8eaf-ea167c2b715b | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 03:17:15.797 | 20 | - | dbeca2b0-5294-467d-8eaf-ea167c2b715b | - | - | - | 이벤트 조회 | - |
| 03:17:15.798 | 20 | projection.event.mapped | dbeca2b0-5294-467d-8eaf-ea167c2b715b | - | 1 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 03:17:15.799 | 20 | projection.event.mapped | dbeca2b0-5294-467d-8eaf-ea167c2b715b | - | 3 | 3 | 이벤트 매핑 | projector=multimodal-projector |
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

[Docs] — 채점 대상 문서 전문
<<<Docs 시작>>>
---
docId: analysis-ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8
generatedAt: 2026-08-13T03:17:18.171Z
targetReadModel: read_grip_result
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: v1
  to: v2
  affectedEndpoints:
    - "POST /multimodal"
    - "POST /grip-result"
    - "POST /environmental-context"
    - "POST /insert-all"
evidenceSources:
  - { origin: developer-logging, anchorId: "ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_grip_result

> 결론(TL;DR): `read_grip_result`을(를) 재생성한다 — 새로운 payload 환경 변수(conveyor_speed, gripper_temperature) 유입으로 기존 Read Model 스키마 미적응 필드 유실됨. 파이프라인은 정지되지 않고 정상 투영으로 이어짐. (이상 유형: 스키마 드리프트(신규 키 유입) · 심각도: warning)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `insert.request`(level 30) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `payload.schema.drift`(level 40) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 54회, `-`(level 30) 2회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 03:17:15.762 | 30 | insert.request | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | - | - | - | Insert Event Store 요청 수신 | - |
| 03:17:15.762 | 30 | insert.batch.start | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | - | - | - | Toy-Data 적재 시작 | - |
| 03:17:15.768 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00001 | 1 | 1 | 이벤트 append | - |
| 03:17:15.768 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00001 | 1 | 1 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00001_01_20230923.json |
| 03:17:15.769 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00002 | 3 | 2 | 이벤트 append | - |
| 03:17:15.769 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00002 | 3 | 2 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00002_03_20230923.json |
| 03:17:15.770 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00005 | 3 | 3 | 이벤트 append | - |
| 03:17:15.770 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00005 | 3 | 3 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00005_03_20230923.json |
| 03:17:15.771 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 1 | 4 | 이벤트 append | - |
| 03:17:15.771 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 1 | 4 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00009_01_20230923.json |
| 03:17:15.772 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 3 | 5 | 이벤트 append | - |
| 03:17:15.772 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 3 | 5 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00009_03_20230923.json |
| 03:17:15.773 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 2 | 6 | 이벤트 append | - |
| 03:17:15.773 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 2 | 6 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00011_02_20230923.json |
| 03:17:15.774 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 3 | 7 | 이벤트 append | - |
| 03:17:15.774 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 3 | 7 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00011_03_20230923.json |
| 03:17:15.775 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00015 | 1 | 8 | 이벤트 append | - |
| 03:17:15.775 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00015 | 1 | 8 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00015_01_20230923.json |
| 03:17:15.776 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018 | 1 | 9 | 이벤트 append | - |
| 03:17:15.776 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018 | 1 | 9 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00018_01_20230923.json |
| 03:17:15.777 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00019 | 3 | 10 | 이벤트 append | - |
| 03:17:15.777 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00019 | 3 | 10 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00019_03_20230923.json |
| 03:17:15.778 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00021 | 2 | 11 | 이벤트 append | - |
| 03:17:15.778 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00021 | 2 | 11 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00021_02_20230923.json |
| 03:17:15.779 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00026 | 2 | 12 | 이벤트 append | - |
| 03:17:15.779 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00026 | 2 | 12 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00026_02_20230923.json |
| 03:17:15.779 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 2 | 13 | 이벤트 append | - |
| 03:17:15.779 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 2 | 13 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00027_02_20230923.json |
| 03:17:15.780 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 3 | 14 | 이벤트 append | - |
| 03:17:15.780 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 3 | 14 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00027_03_20230923.json |
| 03:17:15.781 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00029 | 3 | 15 | 이벤트 append | - |
| 03:17:15.781 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00029 | 3 | 15 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00029_03_20230923.json |
| 03:17:15.782 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00030 | 2 | 16 | 이벤트 append | - |
| 03:17:15.782 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00030 | 2 | 16 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00030_02_20230923.json |
| 03:17:15.783 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00036 | 3 | 17 | 이벤트 append | - |
| 03:17:15.783 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00036 | 3 | 17 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00036_03_20230923.json |
| 03:17:15.783 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00039 | 2 | 18 | 이벤트 append | - |
| 03:17:15.783 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00039 | 2 | 18 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00039_02_20230923.json |
| 03:17:15.784 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00041 | 2 | 19 | 이벤트 append | - |
| 03:17:15.784 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00041 | 2 | 19 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00041_02_20230923.json |
| 03:17:15.785 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00047 | 1 | 20 | 이벤트 append | - |
| 03:17:15.785 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00047 | 1 | 20 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00047_01_20230923.json |
| 03:17:15.786 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 21 | 이벤트 append | - |
| 03:17:15.786 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 21 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00051_02_20230923.json |
| 03:17:15.786 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 22 | 이벤트 append | - |
| 03:17:15.786 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 22 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00055_03_20230923.json |
| 03:17:15.787 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 23 | 이벤트 append | - |
| 03:17:15.787 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 23 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00056_02_20230923.json |
| 03:17:15.788 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 24 | 이벤트 append | - |
| 03:17:15.788 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 24 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00059_02_20230923.json |
| 03:17:15.789 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 25 | 이벤트 append | - |
| 03:17:15.789 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 25 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00061_03_20230923.json |
| 03:17:15.790 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02000 | 1 | 26 | 이벤트 append | - |
| 03:17:15.790 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02000 | 1 | 26 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_02000_01_20230923.json |
| 03:17:15.791 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02001 | 1 | 27 | 이벤트 append | - |
| 03:17:15.791 | 20 | insert.file.ok | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02001 | 1 | 27 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_02001_01_20230923.json |
| 03:17:15.791 | 40 | payload.schema.drift | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | - | - | - | payload 에 스키마가 모르는 신규 키 유입 — 적재 시 유실됨(Read Model 후보) ← 트립 앵커 | newKeys={"conveyor_speed": "1.2", "gripper_temperature": "36.5"} |
| 03:17:15.791 | 30 | insert.batch.done | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | - | - | - | toy-data 적재 완료 | - |
| 03:17:15.791 | 30 | - | ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 | - | - | - | request completed | - |
| 03:17:15.794 | 30 | projection.request | dbeca2b0-5294-467d-8eaf-ea167c2b715b | - | - | - | projection 요청 수신 | - |
| 03:17:15.795 | 20 | - | dbeca2b0-5294-467d-8eaf-ea167c2b715b | - | - | - | 커서 조회 | projector=multimodal-projector |
| 03:17:15.795 | 30 | projection.start | dbeca2b0-5294-467d-8eaf-ea167c2b715b | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 03:17:15.797 | 20 | - | dbeca2b0-5294-467d-8eaf-ea167c2b715b | - | - | - | 이벤트 조회 | - |
| 03:17:15.798 | 20 | projection.event.mapped | dbeca2b0-5294-467d-8eaf-ea167c2b715b | - | 1 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 03:17:15.799 | 20 | projection.event.mapped | dbeca2b0-5294-467d-8eaf-ea167c2b715b | - | 3 | 3 | 이벤트 매핑 | projector=multimodal-projector |

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
- (level 40, `payload.schema.drift`) payload 에 스키마가 모르는 신규 키 유입 — 적재 시 유실됨(Read Model 후보) — newKeys={"conveyor_speed": "1.2", "gripper_temperature": "36.5"} → (i) 기존 Read Model의 구조적 부족 — read_grip_result 및 GripAttemptRecorded 스키마에 conveyor_speed와 gripper_temperature 컬럼/필드 부재로, 신규 환경 변수 유입 이벤트가 투영 시 필드 유실됨. [corr:ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8]
- 자동 폴백 문서: LLM 권고 생성이 재시도까지 실패해 결정론 폴백이 최소 근거만 수록했다 — 분석 재실행으로 완전한 권고를 재생성하라.
- 새로운 payload 환경 변수(conveyor_speed, gripper_temperature) 유입으로 기존 Read Model 스키마 미적응 필드 유실됨. 파이프라인은 정지되지 않고 정상 투영으로 이어짐.

### Decision Drivers
- -

### Considered Options
#### 분석 재실행으로 상세 권고 재생성
- 접근: LLM 권고 생성이 실패해 최소 근거만 수록했다 — 동일 근거로 분석 사이클을 재실행해 완전한 권고(옵션 비교·SQL·코드)를 재생성한다.
- 제안 필드: -
- 트레이드오프: 재실행 비용 외 없음(근거 로그·이벤트는 보존됨).

### Decision Outcome
분석 재실행으로 상세 권고 재생성 — LLM 생성 실패로 결정론 폴백이 lane 기본 조치를 선정

### Consequences
- (−) 본 권고는 결정론 폴백 산출물로, 옵션 비교·코드 스니펫이 없다(재실행 권장).

### Non-Goals
- 신규 스키마·코드 변경의 확정(재실행 산출물의 몫)

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

- 대상: `read_environmental_context_v2` · 키: scene_key, attempt_num · 원천 이벤트: GripAttemptRecorded

```sql
CREATE TABLE read_environmental_context_v2 (
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
# Table: read_environmental_context_v2
[
(scene_key:varchar, 장면 식별 키 = stream_id 제거 prefix, Primary Key),
(attempt_num:smallint, 동장 내 시도 번호, Primary Key),
(occurred_at:timestamptz, 데이터 촬영 일자),
(conveyor_speed:double precision, 컨베어 벨트 속도(환경 드리프트)),
(gripper_temperature:double precision, 그리퍼 작동 온도(환경 드리프트)),
(stream_id:varchar, ES 스트림 ID),
(global_seq:bigint, 투영 출처 ES 전역 시퀀스)
]
```

### 투영 매핑 명세 (이벤트 → 컬럼)

> upsert 키: scene_key, attempt_num · 리플레이: projection_cursor 초기화 시 global_seq 기준 재시작. 전역 재투영(catch-up) 시 upsert 전제(idempotent overwrite) 필수로 동동장/시도 키 충돌 방지.

| 원천 이벤트 | payload 필드 | 컬럼 | 변환 |
| --- | --- | --- | --- |
| GripAttemptRecorded | conveyor_speed | conveyor_speed | string → double |
| GripAttemptRecorded | gripper_temperature | gripper_temperature | string → double |

파생 컬럼(이벤트 payload 아님):
- `scene_key` ← stream_id prefix 'grip-attempt:' 제거
- `attempt_num` ← payload.filename 패턴 '_NN_' 추출 (예: _01_ → 1)
- `occurred_at` ← payload.filename 날짜 부분 YYYYMMDD 파싱 ISO-8601 timestamp
- `stream_id` ← ES 시스템 메타데이터 (event.streamId) 직접 복사
- `global_seq` ← ES 시스템 메타데이터 (event.globalSeq) 직접 복사

### Insight 카드 등록 (Insight Read DB 동기화)

> DDL 적용 시 아래 카드 등록도 함께 실행한다 — 다음 분석부터 신규 Read Model 이 LLM 컨텍스트에 노출된다.

```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_environmental_context_v2', 'read_model', '시도별 환경 변수 이력 추적(conveyor_speed, gripper_temperature)로 기존 Read Model 미적응 필드 유실 해결 및 조인/통합 조회 호환성 유지', 'scene_key, attempt_num')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_environmental_context_v2', 'scene_key', 'varchar', '장면 식별 키 = stream_id 제거 prefix', 1),
  ('read_environmental_context_v2', 'attempt_num', 'smallint', '동장 내 시도 번호', 2),
  ('read_environmental_context_v2', 'occurred_at', 'timestamptz', '데이터 촬영 일자', 3),
  ('read_environmental_context_v2', 'conveyor_speed', 'double precision', '컨베어 벨트 속도(환경 드리프트)', 4),
  ('read_environmental_context_v2', 'gripper_temperature', 'double precision', '그리퍼 작동 온도(환경 드리프트)', 5),
  ('read_environmental_context_v2', 'stream_id', 'varchar', 'ES 스트림 ID', 6),
  ('read_environmental_context_v2', 'global_seq', 'bigint', '투영 출처 ES 전역 시퀀스', 7)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased (v1 → v2)

#### Added
- 신규 Read Model 테이블 read_environmental_context_v2 및 EnvironmentalContextV2Projector 구현
#### Fixed
- payload schema 드리프트(conveyor_speed, gripper_temperature) 필드 유실 현상

### 마이그레이션 절차

- 하위호환 변경: 기존 v1 Read Model(v1) 테이블·라우트·프로젝터는 무손상 유지; 신규 라우트 /environmental-context 는 추가만
- 파괴적 변경: 없음
- 컷오버 전 테스트: 전수 검증: payload 에 conveyor_speed, gripper_temperature 키 존재 여부 확인. 신규 키 누락 시 v1 파이프 정상 작동 but 필드 유실. 컷오버 전 v2 프로젝터 배선 및 DB 테이블 생성 완료.
- 롤백 창/조건: DB rollback: DROP TABLE read_environmental_context_v2. DI rollback: 제거 EnvironmentalContextV2Projector, catchUpAllResult 타입 revert. 라우트 rollback: @Post("/environmental-context") 제거.
- Insight 카드 등록: §2의 카드 등록 SQL을 DDL과 함께 적용(카탈로그 동기화)

### 사유·호환성

- 사유: 기존 v1 DTO(`toyDataSchema`) 및 기존 프로젝터는 신규 키(`conveyor_speed`, `gripper_temperature`) 미적응으로, `map()` 시 payload 파이프가 정지되지 않고 정상 투영으로 이어짐 [corr:ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8]. v1 코드의 `toyDataSchema.parse(event.payload)` 줄에서 unknown keys는 Zod에 의해 스키마 드리프트 감지 시 유실됨. 신규 Read Model(`read_environmental_context_v2`) 및 `EnvironmentalContextV2Projector` 배선으로 필드 보존 확보.
- 트리거 근거: 03:17:15.791 payload.schema.drift ba0c7384-b8e3-4c8b-af0c-b739ee0d56c8 payload 에 스키마가 모르는 신규 키 유입 — 적재 시 유실됨(Read Model 후보) ← 트립 앵커. v1 `toyDataSchema.parse(event.payload)` 줄 미적응 신규 키.
- v1 호환성: 기존 v1 테이블·엔드포인트·프로젝터 클래스/name은 수정·삭제 금지. 새 라우트(/environmental-context), 새 서비스 메서드(catchUpEnvironmentalContextV2) 및 신규 테이블(`read_environmental_context_v2`)은 추가만. 기존 투영 파이프는 v1 프로젝터 재사용으로 정상 작동, 신규 필드는 v2 프로젝터로 동시 보존.

### 변경 파일

- `src/shared/database/schema/index.ts` (modifyFile) — 신규 Drizzle 스키마 export 배선. 기존 v1 export는 보존.
- `src/projection/projection.service.ts` (modifyFile) — 신규 프로젝터 DI 배선 및 catchUpAll 결과 타입/로직 추가. 기존 v1 로직 보존.
- `src/projection/projection.controller.ts` (modifyFile) — 신규 라우트 /environmental-context 배선. 기존 v1 엔드포인트 보존.

## Optional — 부속 자료(컨텍스트 축소 시 생략 가능)

### 신규 Read Model — Drizzle 스키마

```ts
import { bigint, doublePrecision, pgTable, primaryKey, smallint, timestamp, varchar } from 'drizzle-orm/pg-core';

export const readEnvironmentalContextV2 = pgTable(
  "read_environmental_context_v2",
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
import { readEnvironmentalContextV2 } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

type EnvironmentalContextV2ProjectorInsert = InferInsertModel<typeof readEnvironmentalContextV2>;

function toNumberOrNull(value: unknown): number | null {
  if (value === undefined || value === null) {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

@Injectable()
export class EnvironmentalContextV2Projector implements Projector<EnvironmentalContextV2ProjectorInsert> {
  readonly name: string = "environmental-context-v2-projector";

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(EnvironmentalContextV2Projector.name);
  }

  map(event: EventStoreEventRow): EnvironmentalContextV2ProjectorInsert {
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

  async upsert(tx: DrizzleTx, row: EnvironmentalContextV2ProjectorInsert): Promise<void> {
    await tx
      .insert(readEnvironmentalContextV2)
      .values(row)
      .onConflictDoUpdate({
        target: [readEnvironmentalContextV2.sceneKey, readEnvironmentalContextV2.attemptNum],
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
// src/insert/dto/toy-data.dto.ts (확장)
export const toyDataSchema = z.object({
  "2D_image_file_name": z.string(),
  "3D_image_file_name": z.string(),
  video_file_name: z.string(),
  box_type: z.string(),
  camera_info: cameraInfoSchema,
  data_key: z.string(),
  grip_data: gripDataSchema,
  grip_succeed: z.number().int().min(0).max(1),
  objects: z.array(objectsSchema),
  robot_tf: robotTfSchema,
  human_annotation_grasp: z.array(humanAnnotationSchema),
  conveyor_speed: z.coerce.number().optional(),
  gripper_temperature: z.coerce.number().optional(),
});

// src/projection/projection.service.ts (주입·catchUp)
class ProjectionService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly runner: CatchUpRunner,
    private readonly multimodal: MultiModalProjector,
    private readonly gripResult: GripResultProjector,
    private readonly environmentalContext: EnvironmentalContextProjector,
    private readonly insertService: InsertService,
  ) { ... }

  catchUpEnvironmentalContext(): Promise<ProjectionResult> {
    return this.runner.run(this.environmentalContext);
  }
}

// src/projection/projection.controller.ts (라우트)
class ProjectionController {
  @Post("/environmental-context")
  environmentalContext(): Promise<ProjectionResult> {
    this.logger.info(
      { action: LogAction.PROJECTION_REQUEST, [LogContext.ROUTE]: "POST /projection/environmental-context" },
      "projection 요청 수신",
    );
    return this.projectionService.catchUpEnvironmentalContext();
  }
}

// src/projection/projection.module.ts (providers)
@Module({ providers: [MultiModalProjector, GripResultProjector, EnvironmentalContextProjector] })
class ProjectionModule {}
```

### 버전 교체 코드 — `src/shared/database/schema/index.ts` (modifyFile)

```typescript
export * from "./insight/insight-entity";
export * from "./insight/insight-field";
export * from "./log/log-cursor";
export * from "./log/log-event";
export * from "./service/event";
export * from "./service/projection-cursor";
export * from "./service/read-environmental-context-v2";
export * from "./service/read-grip-result";
export * from "./service/read-multimodal";
```

### 버전 교체 코드 — `src/projection/projection.service.ts` (modifyFile)

```typescript
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { EnvironmentalContextV2Projector } from '@/projection/projector/environmental-context-v2.projector';
import { ProjectionResult } from '@/projection/projector/projector';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';
import { LogAction } from '@/shared/logger/logging-context';

export type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
  environmentalContextV2: ProjectionResult;
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
    private readonly environmentalContextV2: EnvironmentalContextV2Projector,
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

  catchUpEnvironmentalContextV2(): Promise<ProjectionResult> {
    return this.runner.run(this.environmentalContextV2);
  }

  async catchUpAll(): Promise<CatchUpAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_START }, "전체 투영 시작");

    const multimodal: ProjectionResult = await this.catchUpMultimodal();
    const gripResult: ProjectionResult = await this.catchUpGripResult();
    const environmentalContextV2: ProjectionResult = await this.catchUpEnvironmentalContextV2();

    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");

    return { multimodal, gripResult, environmentalContextV2 };
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

  @Post("/environmental-context")
  environmentalContextV2(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /environmental-context",
      },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpEnvironmentalContextV2();
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
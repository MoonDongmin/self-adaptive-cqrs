당신은 이벤트 소싱 + CQRS 기반 Physical AI 데이터 플랫폼의 시니어 아키텍트이자 엄격한 평가자다. LLM 파이프라인이 [자료](로그·이벤트·스키마 정보)를 보고 [Docs]를 생성했다. Docs 는 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소를 항상 함께 담아야 하는 단일 산출물이다. 당신은 [정답 요지]와 [자료], [자동 검증 결과]를 기준으로 Docs 를 네 항목의 루브릭으로 채점한다. 채점은 관대하지 않게, 근거 없는 주장·지어낸 값·의도와 다른 SQL·서로 어긋나는 절에는 낮은 점수를 준다. 실행·컴파일이 통과했다는 사실만으로 실행 가능성이나 완결성에 높은 점수를 주지 않는다. SQL 과 코드 블록을 실제로 읽고 루브릭의 점검 항목을 하나씩 확인한다. 반드시 JSON 객체 하나만 출력한다. 설명문·마크다운 펜스는 출력하지 않는다.

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
| 09:01:39.992 | 30 | insert.request | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | - | - | - | Insert Event Store 요청 수신 | - |
| 09:01:39.992 | 30 | insert.batch.start | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | - | - | - | Toy-Data 적재 시작 | - |
| 09:01:39.997 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00001 | 1 | 1 | 이벤트 append | - |
| 09:01:39.997 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00001 | 1 | 1 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00001_01_20230923.json |
| 09:01:39.998 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00002 | 3 | 2 | 이벤트 append | - |
| 09:01:39.998 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00002 | 3 | 2 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00002_03_20230923.json |
| 09:01:39.999 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00005 | 3 | 3 | 이벤트 append | - |
| 09:01:39.999 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00005 | 3 | 3 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00005_03_20230923.json |
| 09:01:40.000 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 1 | 4 | 이벤트 append | - |
| 09:01:40.000 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 1 | 4 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00009_01_20230923.json |
| 09:01:40.001 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 3 | 5 | 이벤트 append | - |
| 09:01:40.001 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 3 | 5 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00009_03_20230923.json |
| 09:01:40.002 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 2 | 6 | 이벤트 append | - |
| 09:01:40.002 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 2 | 6 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00011_02_20230923.json |
| 09:01:40.003 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 3 | 7 | 이벤트 append | - |
| 09:01:40.003 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 3 | 7 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00011_03_20230923.json |
| 09:01:40.003 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00015 | 1 | 8 | 이벤트 append | - |
| 09:01:40.003 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00015 | 1 | 8 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00015_01_20230923.json |
| 09:01:40.004 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018 | 1 | 9 | 이벤트 append | - |
| 09:01:40.004 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018 | 1 | 9 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00018_01_20230923.json |
| 09:01:40.005 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00019 | 3 | 10 | 이벤트 append | - |
| 09:01:40.005 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00019 | 3 | 10 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00019_03_20230923.json |
| 09:01:40.006 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00021 | 2 | 11 | 이벤트 append | - |
| 09:01:40.006 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00021 | 2 | 11 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00021_02_20230923.json |
| 09:01:40.006 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00026 | 2 | 12 | 이벤트 append | - |
| 09:01:40.006 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00026 | 2 | 12 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00026_02_20230923.json |
| 09:01:40.007 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 2 | 13 | 이벤트 append | - |
| 09:01:40.007 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 2 | 13 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00027_02_20230923.json |
| 09:01:40.008 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 3 | 14 | 이벤트 append | - |
| 09:01:40.008 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 3 | 14 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00027_03_20230923.json |
| 09:01:40.008 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00029 | 3 | 15 | 이벤트 append | - |
| 09:01:40.008 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00029 | 3 | 15 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00029_03_20230923.json |
| 09:01:40.009 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00030 | 2 | 16 | 이벤트 append | - |
| 09:01:40.009 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00030 | 2 | 16 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00030_02_20230923.json |
| 09:01:40.010 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00036 | 3 | 17 | 이벤트 append | - |
| 09:01:40.010 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00036 | 3 | 17 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00036_03_20230923.json |
| 09:01:40.011 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00039 | 2 | 18 | 이벤트 append | - |
| 09:01:40.011 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00039 | 2 | 18 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00039_02_20230923.json |
| 09:01:40.011 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00041 | 2 | 19 | 이벤트 append | - |
| 09:01:40.011 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00041 | 2 | 19 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00041_02_20230923.json |
| 09:01:40.012 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00047 | 1 | 20 | 이벤트 append | - |
| 09:01:40.012 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00047 | 1 | 20 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00047_01_20230923.json |
| 09:01:40.013 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 21 | 이벤트 append | - |
| 09:01:40.013 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 21 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00051_02_20230923.json |
| 09:01:40.013 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 22 | 이벤트 append | - |
| 09:01:40.013 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 22 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00055_03_20230923.json |
| 09:01:40.014 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 23 | 이벤트 append | - |
| 09:01:40.014 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 23 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00056_02_20230923.json |
| 09:01:40.015 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 24 | 이벤트 append | - |
| 09:01:40.015 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 24 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00059_02_20230923.json |
| 09:01:40.015 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 25 | 이벤트 append | - |
| 09:01:40.015 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 25 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00061_03_20230923.json |
| 09:01:40.016 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02000 | 1 | 26 | 이벤트 append | - |
| 09:01:40.016 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02000 | 1 | 26 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_02000_01_20230923.json |
| 09:01:40.017 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02001 | 1 | 27 | 이벤트 append | - |
| 09:01:40.017 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02001 | 1 | 27 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_02001_01_20230923.json |
| 09:01:40.017 | 40 | payload.schema.drift | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | - | - | - | payload 에 스키마가 모르는 신규 키 유입 — 적재 시 유실됨(Read Model 후보) ← 트립 앵커 | newKeys={"conveyor_speed": "1.2", "gripper_temperature": "36.5"} |
| 09:01:40.017 | 30 | insert.batch.done | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | - | - | - | toy-data 적재 완료 | - |
| 09:01:40.017 | 30 | - | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | - | - | - | request completed | - |
| 09:01:40.019 | 30 | projection.request | ecba2544-df26-4dac-9457-c9eb5f34f509 | - | - | - | projection 요청 수신 | - |
| 09:01:40.021 | 30 | projection.start | ecba2544-df26-4dac-9457-c9eb5f34f509 | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 09:01:40.021 | 20 | - | ecba2544-df26-4dac-9457-c9eb5f34f509 | - | - | - | 커서 조회 | projector=multimodal-projector |
| 09:01:40.022 | 20 | projection.event.mapped | ecba2544-df26-4dac-9457-c9eb5f34f509 | - | 1 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 09:01:40.022 | 20 | - | ecba2544-df26-4dac-9457-c9eb5f34f509 | - | - | - | 이벤트 조회 | - |
| 09:01:40.024 | 20 | projection.event.mapped | ecba2544-df26-4dac-9457-c9eb5f34f509 | - | 3 | 2 | 이벤트 매핑 | projector=multimodal-projector |
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
- 저장소에 실재하는 파일 (4건): src/insert/dto/toy-data.dto.ts, src/projection/projection.controller.ts, src/projection/projection.service.ts, src/shared/database/schema/index.ts
- 저장소에 없는 파일 (1건): src/projection/dto/toy-data.dto.ts

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

<<<src/shared/database/schema/index.ts 앞부분 80행>>>
export * from "./insight/insight-entity";
export * from "./insight/insight-field";
export * from "./log/log-cursor";
export * from "./log/log-event";
export * from "./service/event";
export * from "./service/projection-cursor";
export * from "./service/read-grip-result";
export * from "./service/read-multimodal";

<<<발췌 끝>>>

[Docs] — 채점 대상 문서 전문
<<<Docs 시작>>>
---
docId: analysis-cd4a7d38-b8ae-47c0-b30d-a05f7531ed66
generatedAt: 2026-08-14T09:01:47.730Z
targetReadModel: read_sensor_drift_v2
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: v1
  to: v2
  affectedEndpoints:
    - "POST /multimodal"
    - "POST /grip-result"
    - "POST /insert-all"
    - "POST /sensor-drift-v2"
evidenceSources:
  - { origin: developer-logging, anchorId: "cd4a7d38-b8ae-47c0-b30d-a05f7531ed66" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_sensor_drift_v2

> 결론(TL;DR): `read_sensor_drift_v2`을(를) 재생성한다 — Toy-Data batch 적재가 정상 완료되었으나, 일부 payload에 GripAttemptRecorded 스키마 미적재 필드(conveyor_speed, gripper_temperature) 유입되어 시스템이 경고를 발생하고 Read Model 매핑 시 해당 데이터 유지를 배제(유실)할 것을 예고. (이상 유형: 스키마 드리프트(신요 키 유입) · 심각도: warning)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `insert.request`(level 30) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `payload.schema.drift`(level 40) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 54회, `-`(level 30) 2회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 09:01:39.992 | 30 | insert.request | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | - | - | - | Insert Event Store 요청 수신 | - |
| 09:01:39.992 | 30 | insert.batch.start | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | - | - | - | Toy-Data 적재 시작 | - |
| 09:01:39.997 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00001 | 1 | 1 | 이벤트 append | - |
| 09:01:39.997 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00001 | 1 | 1 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00001_01_20230923.json |
| 09:01:39.998 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00002 | 3 | 2 | 이벤트 append | - |
| 09:01:39.998 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00002 | 3 | 2 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00002_03_20230923.json |
| 09:01:39.999 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00005 | 3 | 3 | 이벤트 append | - |
| 09:01:39.999 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00005 | 3 | 3 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00005_03_20230923.json |
| 09:01:40.000 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 1 | 4 | 이벤트 append | - |
| 09:01:40.000 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 1 | 4 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00009_01_20230923.json |
| 09:01:40.001 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 3 | 5 | 이벤트 append | - |
| 09:01:40.001 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00009 | 3 | 5 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00009_03_20230923.json |
| 09:01:40.002 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 2 | 6 | 이벤트 append | - |
| 09:01:40.002 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 2 | 6 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00011_02_20230923.json |
| 09:01:40.003 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 3 | 7 | 이벤트 append | - |
| 09:01:40.003 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00011 | 3 | 7 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00011_03_20230923.json |
| 09:01:40.003 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00015 | 1 | 8 | 이벤트 append | - |
| 09:01:40.003 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00015 | 1 | 8 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00015_01_20230923.json |
| 09:01:40.004 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018 | 1 | 9 | 이벤트 append | - |
| 09:01:40.004 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018 | 1 | 9 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00018_01_20230923.json |
| 09:01:40.005 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00019 | 3 | 10 | 이벤트 append | - |
| 09:01:40.005 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00019 | 3 | 10 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00019_03_20230923.json |
| 09:01:40.006 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00021 | 2 | 11 | 이벤트 append | - |
| 09:01:40.006 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00021 | 2 | 11 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00021_02_20230923.json |
| 09:01:40.006 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00026 | 2 | 12 | 이벤트 append | - |
| 09:01:40.006 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00026 | 2 | 12 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00026_02_20230923.json |
| 09:01:40.007 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 2 | 13 | 이벤트 append | - |
| 09:01:40.007 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 2 | 13 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00027_02_20230923.json |
| 09:01:40.008 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 3 | 14 | 이벤트 append | - |
| 09:01:40.008 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00027 | 3 | 14 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00027_03_20230923.json |
| 09:01:40.008 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00029 | 3 | 15 | 이벤트 append | - |
| 09:01:40.008 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00029 | 3 | 15 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00029_03_20230923.json |
| 09:01:40.009 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00030 | 2 | 16 | 이벤트 append | - |
| 09:01:40.009 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00030 | 2 | 16 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00030_02_20230923.json |
| 09:01:40.010 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00036 | 3 | 17 | 이벤트 append | - |
| 09:01:40.010 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00036 | 3 | 17 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00036_03_20230923.json |
| 09:01:40.011 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00039 | 2 | 18 | 이벤트 append | - |
| 09:01:40.011 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00039 | 2 | 18 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00039_02_20230923.json |
| 09:01:40.011 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00041 | 2 | 19 | 이벤트 append | - |
| 09:01:40.011 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00041 | 2 | 19 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00041_02_20230923.json |
| 09:01:40.012 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00047 | 1 | 20 | 이벤트 append | - |
| 09:01:40.012 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00047 | 1 | 20 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00047_01_20230923.json |
| 09:01:40.013 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 21 | 이벤트 append | - |
| 09:01:40.013 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00051 | 2 | 21 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00051_02_20230923.json |
| 09:01:40.013 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 22 | 이벤트 append | - |
| 09:01:40.013 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00055 | 3 | 22 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00055_03_20230923.json |
| 09:01:40.014 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 23 | 이벤트 append | - |
| 09:01:40.014 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00056 | 2 | 23 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00056_02_20230923.json |
| 09:01:40.015 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 24 | 이벤트 append | - |
| 09:01:40.015 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00059 | 2 | 24 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00059_02_20230923.json |
| 09:01:40.015 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 25 | 이벤트 append | - |
| 09:01:40.015 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00061 | 3 | 25 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_00061_03_20230923.json |
| 09:01:40.016 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02000 | 1 | 26 | 이벤트 append | - |
| 09:01:40.016 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02000 | 1 | 26 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_02000_01_20230923.json |
| 09:01:40.017 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02001 | 1 | 27 | 이벤트 append | - |
| 09:01:40.017 | 20 | insert.file.ok | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02001 | 1 | 27 | 파일 적재 성공 | file=반려동물용품_CR01_강아지공룡알장난감_02001_01_20230923.json |
| 09:01:40.017 | 40 | payload.schema.drift | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | - | - | - | payload 에 스키마가 모르는 신규 키 유입 — 적재 시 유실됨(Read Model 후보) ← 트립 앵커 | newKeys={"conveyor_speed": "1.2", "gripper_temperature": "36.5"} |
| 09:01:40.017 | 30 | insert.batch.done | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | - | - | - | toy-data 적재 완료 | - |
| 09:01:40.017 | 30 | - | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | - | - | - | request completed | - |
| 09:01:40.019 | 30 | projection.request | ecba2544-df26-4dac-9457-c9eb5f34f509 | - | - | - | projection 요청 수신 | - |
| 09:01:40.021 | 30 | projection.start | ecba2544-df26-4dac-9457-c9eb5f34f509 | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 09:01:40.021 | 20 | - | ecba2544-df26-4dac-9457-c9eb5f34f509 | - | - | - | 커서 조회 | projector=multimodal-projector |
| 09:01:40.022 | 20 | projection.event.mapped | ecba2544-df26-4dac-9457-c9eb5f34f509 | - | 1 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 09:01:40.022 | 20 | - | ecba2544-df26-4dac-9457-c9eb5f34f509 | - | - | - | 이벤트 조회 | - |
| 09:01:40.024 | 20 | projection.event.mapped | ecba2544-df26-4dac-9457-c9eb5f34f509 | - | 3 | 2 | 이벤트 매핑 | projector=multimodal-projector |

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
- (level 40, `payload.schema.drift`) payload 에 스키마가 모르는 신규 키 유입 — 적재 시 유실됨(Read Model 후보) ← 트립 앵커 → Zod DTO 검증/파싱이 conveyor_speed와 gripper_temperature 키를 미인식하여 적재 시 유실됨, 결과 Read Model 매핑에서 해당 센서 값 배제. [corr:cd4a7d38-b8ae-47c0-b30d-a05f7531ed66]
- src/insert/dto/toy-data.dto.ts의 toyDataSchema는 conveyor_speed와 gripper_temperature 필드를 미정의하여 Zod strict parsing이 신규 키를 필터링/유실 처리 [corr:cd4a7d38-b8ae-47c0-b30d-a05f7531ed66].
- 기존 Drizzle 스키마 read_grip_result와 read_multimodal에 conveyor_speed, gripper_temperature 컬럼이 미존재. GripResultProjector.map()과 MultiModalProjector.map() 구현에서 payload drift 키를 추출하지도 매핑하지 [corr:cd4a7d38-b8ae-47c0-b30d-a05f7531ed66].
- CatchUpRunner는 기존 프로젝터만 실행하므로 신규 센서 드리프트 데이터가 ES 적재 완료(insert.batch.done)에도 Read Model 영구히로 원치 유실됨 [corr:cd4a7d38-b8ae-47c0-b30d-a05f7531ed66].

### Decision Drivers
- Data Preservation: 신규 센서(conveyor_speed, gripper_temperature) 영구히로 원치 보존 필요.
- Schema Drift Isolation: 드리프트 키가 기존 Read Model 스키마/클라이언트 계약 파손하지 말아야.
- API Contract Evolution: 신규 queryable entity 도입은 explicit version signaling 동반해야.

### Considered Options
#### existingReadModel 확장 (기각 대안)
- 접근: 기존 GripResultProjector.map() return 객체에 conveyor_speed, gripper_temperature 필드 추가, Drizzle 스키마 수정.
- 제안 필드: read_grip_result.conveyor_speed, read_grip_result.gripper_temperature
- 트레이드오프: 실패 Driver 2(스키마 드리프트 격리). 기존 Read Model 확장은 downstream 클라이언트 계약 파손 위험과 core business logic pollishing 유발.
```typescript
return { ...row, conveyorSpeed: payload.conveyor_speed ?? null, gripperTemperature: payload.gripper_temperature ?? null };
```

#### newReadModel 생성 (권고)
- 접근: 신규 SensorDriftProjector 구현, payload drift 키 매핑, schema/index.ts export 등록, ProjectionService catch-up 연계.
- 제안 필드: read_sensor_drift_v2.conveyor_speed, read_sensor_drift_v2.gripper_temperature
- 트레이드오프: 성공 Driver 1(데이터 보존) & Driver 2(격리). DB migration 및 API version bump 동반 필요(Driver 3).
```typescript
return { sceneKey: event.streamId.replace(/^grip-attempt:/, ""), attemptNum: event.attemptNum, conveyorSpeed: payload.conveyor_speed ?? null, gripperTemperature: payload.gripper_temperature ?? null, occurredAt: event.occurredAt, streamId: event.streamId, globalSeq: event.globalSeq };
```

### Decision Outcome
newReadModel (read_sensor_drift_v2)

### Consequences
- (+) Sensor drift data 영구히로 ES→RM 매핑 완료, downstream 분석/LLM 관찰자 safe consumption 보장.
- (−) DB migration 실행 필요, ProjectionService runner 등록 작업, client version bump 동반.

### Non-Goals
- 기존 read_grip_result/read_multimodal 스키마 수정(avoid breaking existing queries)
- Zod coerce/default value substitution 권고(defect handling principle violation)

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

- 대상: `read_sensor_drift_v2` · 키: (scene_key, attempt_num) · 원천 이벤트: GripAttemptRecorded

```sql
CREATE TABLE read_sensor_drift_v2 (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  conveyor_speed double precision,
  gripper_temperature double precision,
  occurred_at timestamptz,
  stream_id varchar,
  global_seq bigint,
  PRIMARY KEY (scene_key, attempt_num)
);
```

### 필드

```mschema
# Table: read_sensor_drift_v2
[
(scene_key:varchar, 장면 식별 키 = stream_id.replace(/^grip-attempt:/, ""), Primary Key),
(attempt_num:smallint, 동일 장면 내 파지 시도 번호, Primary Key),
(conveyor_speed:double precision, 신요 드리프트: 컨베이어 속도 (예: 1.2)),
(gripper_temperature:double precision, 신요 드리프트: 그리퍼 온도 (예: 36.5)),
(occurred_at:timestamptz, 데이터 촬영 일자),
(stream_id:varchar, ES 스트림 ID),
(global_seq:bigint, 투영 출처 이벤트의 ES 전역 시퀀스)
]
```

### 투영 매핑 명세 (이벤트 → 컬럼)

> upsert 키: (scene_key, attempt_num) · 리플레이: projection_cursor 초기화 시 반드시 0 또는 null 설정. catch-up 전체 재투영 시 upsert는 멱ident성(update-if-exists)을 전제해야 기존 매핑 데이터 과writes를 방지.

| 원천 이벤트 | payload 필드 | 컬럼 | 변환 |
| --- | --- | --- | --- |
| GripAttemptRecorded | stream_id | stream_id | verbatim |
| GripAttemptRecorded | conveyor_speed | conveyor_speed | verbatim |
| GripAttemptRecorded | gripper_temperature | gripper_temperature | verbatim |

파생 컬럼(이벤트 payload 아님):
- `scene_key` ← stream_id.replace(/^grip-attempt:/, '')
- `attempt_num` ← filename/streamId 시도번호 추출(예: _01_)
- `occurred_at` ← filename 날짜 파싱(YYYYMMDD) → ISO timestamptz
- `global_seq` ← ES 전역 시퀀스 값

### Insight 카드 등록 (Insight Read DB 동기화)

> DDL 적용 시 아래 카드 등록도 함께 실행한다 — 다음 분석부터 신규 Read Model 이 LLM 컨텍스트에 노출된다.

```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_sensor_drift_v2', 'read_model', '신요 payload 드리프트 키(conveyor_speed, gripper_temperature)를 Event Store 및 downstream Read Model 영구히로 원.', '(scene_key, attempt_num)')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_sensor_drift_v2', 'scene_key', 'varchar', '장면 식별 키 = stream_id.replace(/^grip-attempt:/, "")', 1),
  ('read_sensor_drift_v2', 'attempt_num', 'smallint', '동일 장면 내 파지 시도 번호', 2),
  ('read_sensor_drift_v2', 'conveyor_speed', 'double precision', '신요 드리프트: 컨베이어 속도 (예: 1.2)', 3),
  ('read_sensor_drift_v2', 'gripper_temperature', 'double precision', '신요 드리프트: 그리퍼 온도 (예: 36.5)', 4),
  ('read_sensor_drift_v2', 'occurred_at', 'timestamptz', '데이터 촬영 일자', 5),
  ('read_sensor_drift_v2', 'stream_id', 'varchar', 'ES 스트림 ID', 6),
  ('read_sensor_drift_v2', 'global_seq', 'bigint', '투영 출처 이벤트의 ES 전역 시퀀스', 7)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased (v1 → v2)

#### Added
- 신요 Read Model 테이블 read_sensor_drift_v2 및 SensorDriftV2Projector 구현
- 라우트 /projection/sensor-drift-v2 배선
#### Changed
- ProjectionService DI/메서드 배선으로 v2 투영 동시 실행

### 마이그레이션 절차

- 하위호환 변경: 기존 v1 라우트(/multimodal, /grip-result, /insert-all) 및 테이블·프로젝터 클래스/name 무변; 신요 v2 라우트/테이블은 addFile 로 기존 ES/Read Model 레인 완전 동시 보존
- 파괴적 변경: 없음
- 컷오버 전 테스트: 1. /sensor-drift-v2 라우트 호출 시 CatchUpRunner 실행 검증
2. read_sensor_drift_v2 테이블 row count = v1 batch insert file.ok count 일치
3. payload.schema.drift 경고 발생 log line(09:01:40.017) 신규 키 매핑 로직 trace 확인
- 롤백 창/조건: DROP TABLE read_sensor_drift_v2, remove /sensor-drift-v2 라우트 및 ProjectionService DI/메서드 배선 revert
- Insight 카드 등록: §2의 카드 등록 SQL을 DDL과 함께 적용(카탈로그 동기화)

### 사유·호환성

- 사유: Toy-Data batch 적재 완료 중 payload 스키마 드리프트 경고 발생으로, 신규 sensor/payload 필드(conveyor_speed, gripper_temperature)를 Event Store 및 downstream Read Model 영구히로 원하나 v1 Zod 스키마(toyDataSchema.parse)와 기존 프로젝터(map/upsert) 미적재 키 유입을 배제(유실)할 것을 예고. 신규 테이블·프로젝터를 추가하여 드리프트 필드 매핑과 동시 보존을 실현 [corr:cd4a7d38-b8ae-47c0-b30d-a05f7531ed66].
- 트리거 근거: 09:01:40.017 | 40 | payload.schema.drift | cd4a7d38-b8ae-47c0-b30d-a05f7531ed66 | - | - | - | payload 에 스키마가 모르는 신규 키 유입 — 적재 시 유실됨(Read Model 후보) ← 트립 앵커 | newKeys={"conveyor_speed": "1.2", "gripper_temperature": "36.5"}
- v1 호환성: 기존 v1 테이블·엔드포인트·프로젝터 클래스/name은 수정·삭제 금지. 신규 Read Model(`read_sensor_drift_v2`)과 전용 프로젝터(`SensorDriftV2Projector`)는 addFile 로 생성, DI/라우트 배선만 modifyFile 한 줄 추가. v1 Zod 스키마 드리프트 경고가 발생한 시그니처를 v2 전용 매핑 로직으로 분기하여 동시 보존.

### 변경 파일

- `src/shared/database/schema/index.ts` (modifyFile) — 신요 Drizzle 테이블 export 배선. 기존 v1 export 보존.
- `src/projection/projection.service.ts` (modifyFile) — 신요 SensorDriftV2Projector DI, catchUpAll/insertAllAndProjectAll 배선. 기존 v1 로직/메서드 보존.
- `src/projection/projection.controller.ts` (modifyFile) — 신요 /sensor-drift-v2 라우트 배선. 기존 v1 엔드포인트 보존.

## Optional — 부속 자료(컨텍스트 축소 시 생략 가능)

### 신규 Read Model — Drizzle 스키마

```ts
import { bigint, doublePrecision, pgTable, primaryKey, smallint, timestamp, varchar } from 'drizzle-orm/pg-core';

export const readSensorDriftV2 = pgTable(
  "read_sensor_drift_v2",
  {
    sceneKey: varchar("scene_key").notNull(),
    attemptNum: smallint("attempt_num").notNull(),
    conveyorSpeed: doublePrecision("conveyor_speed"),
    gripperTemperature: doublePrecision("gripper_temperature"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }),
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
import { readSensorDriftV2 } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

type SensorDriftV2ProjectorInsert = InferInsertModel<typeof readSensorDriftV2>;

function toNumberOrNull(value: unknown): number | null {
  if (value === undefined || value === null) {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

@Injectable()
export class SensorDriftV2Projector implements Projector<SensorDriftV2ProjectorInsert> {
  readonly name: string = "sensor-drift-v2-projector";

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(SensorDriftV2Projector.name);
  }

  map(event: EventStoreEventRow): SensorDriftV2ProjectorInsert {
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
      conveyorSpeed: toNumberOrNull(payload["conveyor_speed"]),
      gripperTemperature: toNumberOrNull(payload["gripper_temperature"]),
      occurredAt: event.occurredAt,
      streamId: event.streamId,
      globalSeq: event.globalSeq,
    };
  }

  async upsert(tx: DrizzleTx, row: SensorDriftV2ProjectorInsert): Promise<void> {
    await tx
      .insert(readSensorDriftV2)
      .values(row)
      .onConflictDoUpdate({
        target: [readSensorDriftV2.sceneKey, readSensorDriftV2.attemptNum],
        set: {
          conveyorSpeed: row.conveyorSpeed,
          gripperTemperature: row.gripperTemperature,
          occurredAt: row.occurredAt,
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
export * from './service/read-sensor-drift-v2';

// src/projection/dto/toy-data.dto.ts (확장)
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
import { SensorDriftProjector } from '@/projection/projector/sensor-drift.projector';
export type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
  sensorDriftV2: ProjectionResult;
};
@Injectable()
export class ProjectionService {
  constructor(
    // ...기존 주입...
    private readonly sensorDriftV2: SensorDriftProjector,
  ) {}

  catchUpSensorDriftV2(): Promise<ProjectionResult> {
    return this.runner.run(this.sensorDriftV2);
  }

  async catchUpAll(): Promise<CatchUpAllResult> {
    // ...기존 로직...
    const sensorDriftV2: ProjectionResult = await this.catchUpSensorDriftV2();
    // ...
    return { multimodal, gripResult, sensorDriftV2 };
  }
}

// src/projection/projection.controller.ts (라우트)
@Controller("projection")
export class ProjectionController {
  constructor(
    private readonly logger: PinoLogger,
    private readonly projectionService: ProjectionService,
  ) {}

  @Post("/sensor-drift-v2")
  sensorDriftV2(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/sensor-drift-v2",
      },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpSensorDriftV2();
  }
}
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
export * from "./service/read-sensor-drift-v2";
```

### 버전 교체 코드 — `src/projection/projection.service.ts` (modifyFile)

```typescript
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { SensorDriftV2Projector } from '@/projection/projector/sensor-drift-v2.projector';
import { ProjectionResult } from '@/projection/projector/projector';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';
import { LogAction } from '@/shared/logger/logging-context';

export type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
  sensorDriftV2: ProjectionResult;
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
    private readonly sensorDriftV2: SensorDriftV2Projector,
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

  catchUpSensorDriftV2(): Promise<ProjectionResult> {
    return this.runner.run(this.sensorDriftV2);
  }

  async catchUpAll(): Promise<CatchUpAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_START }, "전체 투영 시작");

    const multimodal: ProjectionResult = await this.catchUpMultimodal();
    const gripResult: ProjectionResult = await this.catchUpGripResult();
    const sensorDriftV2: ProjectionResult = await this.catchUpSensorDriftV2();

    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");

    return { multimodal, gripResult, sensorDriftV2 };
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

  @Post("/insert-all")
  insertAll(): Promise<InsertAndProjectionAllResult> {
    this.logger.info(
      { action: LogAction.PROJECTION_REQUEST },
      "projection 요청 수신",
    );

    return this.projectionService.insertAllAndProjectAll();
  }

  @Post("/sensor-drift-v2")
  sensorDriftV2(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/sensor-drift-v2",
      },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpSensorDriftV2();
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
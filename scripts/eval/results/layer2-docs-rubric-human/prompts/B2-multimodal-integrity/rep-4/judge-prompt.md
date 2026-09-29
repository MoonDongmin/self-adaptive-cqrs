당신은 이벤트 소싱 + CQRS 기반 Physical AI 데이터 플랫폼의 시니어 아키텍트이자 엄격한 평가자다. LLM 파이프라인이 [자료](로그·이벤트·스키마 정보)를 보고 [Docs]를 생성했다. Docs 는 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소를 항상 함께 담아야 하는 단일 산출물이다. 당신은 [정답 요지]와 [자료], [자동 검증 결과]를 기준으로 Docs 를 네 항목의 루브릭으로 채점한다. 채점은 관대하지 않게, 근거 없는 주장·지어낸 값·의도와 다른 SQL·서로 어긋나는 절에는 낮은 점수를 준다. 반드시 JSON 객체 하나만 출력한다. 설명문·마크다운 펜스는 출력하지 않는다.

---

[시나리오] B2-multimodal-integrity
[상황] 운영 중 시스템이 Read Model 정합성 위반(projection.integrity.violation) 로그를 감지했다.
[정답 요지] 모달 파일명(image/video)의 scene/attempt 가 레코드 좌표와 불일치. zod·투영은 통과하지만 read_multimodal 정합성 검사가 잡음. 조치: 불일치 행 식별·격리(플래그 Read Model 또는 정합성 검증 테이블), v1 무손상.

[자료] — Docs 생성 시 파이프라인이 받은 로그·이벤트·스키마 정보
<<<자료 시작>>>
<logging_context>
## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `projection.request`(level 30) 1회, `projection.batch`(level 30) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `projection.event.mapped`(level 20) 27회, `-`(level 30) 2회, `projection.start`(level 30) 1회, `-`(level 20) 3회, `insert.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 54회, `projection.done`(level 30) 1회, `projection.cursor.advanced`(level 20) 1회, `projection.integrity.violation`(level 50) 2회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 21:51:46.861 | 30 | projection.request | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | - | - | projection 요청 수신 | - |
| 21:51:46.863 | 20 | - | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | - | - | 커서 조회 | projector=multimodal-projector |
| 21:51:46.863 | 30 | projection.start | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 21:51:46.865 | 20 | - | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | - | - | 이벤트 조회 | - |
| 21:51:46.865 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 3 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.867 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 1 | 3 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.867 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 1 | 2 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.868 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 1 | 5 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.868 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 3 | 4 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.868 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 2 | 6 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.869 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 3 | 7 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.869 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 2 | 8 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.870 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 2 | 9 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.870 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 2 | 10 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.871 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 2 | 11 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.871 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 3 | 12 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.871 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 1 | 13 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.872 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 3 | 14 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.872 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 3 | 15 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.873 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 2 | 16 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.873 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 2 | 17 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.874 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 2 | 18 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.874 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 1 | 19 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.874 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 1 | 20 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.875 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 2 | 21 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.875 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 3 | 22 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.876 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 2 | 23 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.876 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 1 | 24 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.877 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 1 | 25 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.877 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 1 | 26 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.877 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 1 | 27 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.878 | 20 | - | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | - | - | 커서 갱신 | projector=multimodal-projector |
| 21:51:46.879 | 50 | projection.integrity.violation | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02026 | 1 | 26 | read_multimodal 정합성 위반[modalFileNameAttemptConsistency]: 2D 이미지 파일명의 attempt(02)가 이 행의 권위 attempt(01)와 불일치 — 다른 시도의 미디어가 scene_key=반려동물용품_CR01_강아지공룡알장난감_02026 행에 매핑됨. column=image_2d_file_name, observed="반려동물용품_CR01_강아지공룡알장난감_02026_02_20230923.jpg". ← 트립 앵커 | projector=multimodal-projector |
| 21:51:46.879 | 50 | projection.integrity.violation | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02027 | 1 | 27 | read_multimodal 정합성 위반[modalFileNameSceneConsistency]: 비디오 파일명의 scene(09999)이 scene_key(02027)와 불일치 — 다른 장면의 미디어가 매핑됨. column=video_file_name, observed="반려동물용품_CR01_강아지공룡알장난감_09999_00_20230923.mp4". | projector=multimodal-projector |
| 21:51:46.879 | 30 | projection.batch | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | - | - | 배치 처리 | projector=multimodal-projector |
| 21:51:46.879 | 20 | projection.cursor.advanced | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | - | - | 커서 이동 | projector=multimodal-projector |
| 21:51:46.879 | 30 | projection.done | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | - | - | catch-up 완료 | projector=multimodal-projector |
| 21:51:46.880 | 30 | - | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | - | - | request completed | - |
| 21:51:46.881 | 30 | projection.request | 614cdc4f-1720-4229-a958-6761825ec767 | - | - | - | projection 요청 수신 | - |
| 21:51:46.882 | 30 | projection.start | 614cdc4f-1720-4229-a958-6761825ec767 | - | - | - | catch-up 시작 | projector=grip-result-projector |
| 21:51:46.882 | 20 | - | 614cdc4f-1720-4229-a958-6761825ec767 | - | - | - | 커서 조회 | projector=grip-result-projector |
| 21:51:46.884 | 20 | - | 614cdc4f-1720-4229-a958-6761825ec767 | - | - | - | 이벤트 조회 | - |
| 21:51:46.884 | 20 | projection.event.mapped | 614cdc4f-1720-4229-a958-6761825ec767 | - | 3 | 1 | 이벤트 매핑 | projector=grip-result-projector |
| 21:51:46.886 | 20 | projection.event.mapped | 614cdc4f-1720-4229-a958-6761825ec767 | - | 1 | 3 | 이벤트 매핑 | projector=grip-result-projector |
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

[저장소 파일 확인] — 파이프라인은 진단 도구로 저장소 소스 코드를 조회할 수 있다. Docs 가 인용한 파일 경로의 실재 여부와 앞부분 발췌이다.
- 저장소에 실재하는 파일 (1건): src/projection/projector/multimodal.projector.ts
- 저장소에 없는 파일 (0건): 없음

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
docId: analysis-ee2549b1-5934-4548-bd3f-c5f9fe81eb3f
generatedAt: 2026-08-12T21:51:49.207Z
targetReadModel: read_multimodal
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: null
  to: null
  affectedEndpoints: []
evidenceSources:
  - { origin: developer-logging, anchorId: "ee2549b1-5934-4548-bd3f-c5f9fe81eb3f" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_multimodal

> 결론(TL;DR): `read_multimodal`을(를) 보강한다 — multimodal-projector 투영 중 read_multimodal Read Model 매핑 시, 이벤트 payload의 filename metadata(시도/장 scène)와 현재 row key(scene_key/attempt_num)가 불일치하여 정합성 위배를 감지. 배치 처리는 완료되었으나 데이터 품질 결함 발생. (이상 유형: 투영 정합성 위반 · 심각도: critical)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `projection.request`(level 30) 1회, `projection.batch`(level 30) 1회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `projection.event.mapped`(level 20) 27회, `-`(level 30) 2회, `projection.start`(level 30) 1회, `-`(level 20) 3회, `insert.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insert.file.ok`(level 20) 54회, `projection.done`(level 30) 1회, `projection.cursor.advanced`(level 20) 1회, `projection.integrity.violation`(level 50) 2회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 21:51:46.861 | 30 | projection.request | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | - | - | projection 요청 수신 | - |
| 21:51:46.863 | 20 | - | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | - | - | 커서 조회 | projector=multimodal-projector |
| 21:51:46.863 | 30 | projection.start | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | - | - | catch-up 시작 | projector=multimodal-projector |
| 21:51:46.865 | 20 | - | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | - | - | 이벤트 조회 | - |
| 21:51:46.865 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 3 | 1 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.867 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 1 | 3 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.867 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 1 | 2 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.868 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 1 | 5 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.868 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 3 | 4 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.868 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 2 | 6 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.869 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 3 | 7 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.869 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 2 | 8 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.870 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 2 | 9 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.870 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 2 | 10 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.871 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 2 | 11 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.871 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 3 | 12 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.871 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 1 | 13 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.872 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 3 | 14 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.872 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 3 | 15 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.873 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 2 | 16 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.873 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 2 | 17 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.874 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 2 | 18 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.874 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 1 | 19 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.874 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 1 | 20 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.875 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 2 | 21 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.875 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 3 | 22 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.876 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 2 | 23 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.876 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 1 | 24 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.877 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 1 | 25 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.877 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 1 | 26 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.877 | 20 | projection.event.mapped | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | 1 | 27 | 이벤트 매핑 | projector=multimodal-projector |
| 21:51:46.878 | 20 | - | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | - | - | 커서 갱신 | projector=multimodal-projector |
| 21:51:46.879 | 50 | projection.integrity.violation | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02026 | 1 | 26 | read_multimodal 정합성 위반[modalFileNameAttemptConsistency]: 2D 이미지 파일명의 attempt(02)가 이 행의 권위 attempt(01)와 불일치 — 다른 시도의 미디어가 scene_key=반려동물용품_CR01_강아지공룡알장난감_02026 행에 매핑됨. column=image_2d_file_name, observed="반려동물용품_CR01_강아지공룡알장난감_02026_02_20230923.jpg". ← 트립 앵커 | projector=multimodal-projector |
| 21:51:46.879 | 50 | projection.integrity.violation | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02027 | 1 | 27 | read_multimodal 정합성 위반[modalFileNameSceneConsistency]: 비디오 파일명의 scene(09999)이 scene_key(02027)와 불일치 — 다른 장면의 미디어가 매핑됨. column=video_file_name, observed="반려동물용품_CR01_강아지공룡알장난감_09999_00_20230923.mp4". | projector=multimodal-projector |
| 21:51:46.879 | 30 | projection.batch | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | - | - | 배치 처리 | projector=multimodal-projector |
| 21:51:46.879 | 20 | projection.cursor.advanced | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | - | - | 커서 이동 | projector=multimodal-projector |
| 21:51:46.879 | 30 | projection.done | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | - | - | catch-up 완료 | projector=multimodal-projector |
| 21:51:46.880 | 30 | - | ee2549b1-5934-4548-bd3f-c5f9fe81eb3f | - | - | - | request completed | - |
| 21:51:46.881 | 30 | projection.request | 614cdc4f-1720-4229-a958-6761825ec767 | - | - | - | projection 요청 수신 | - |
| 21:51:46.882 | 30 | projection.start | 614cdc4f-1720-4229-a958-6761825ec767 | - | - | - | catch-up 시작 | projector=grip-result-projector |
| 21:51:46.882 | 20 | - | 614cdc4f-1720-4229-a958-6761825ec767 | - | - | - | 커서 조회 | projector=grip-result-projector |
| 21:51:46.884 | 20 | - | 614cdc4f-1720-4229-a958-6761825ec767 | - | - | - | 이벤트 조회 | - |
| 21:51:46.884 | 20 | projection.event.mapped | 614cdc4f-1720-4229-a958-6761825ec767 | - | 3 | 1 | 이벤트 매핑 | projector=grip-result-projector |
| 21:51:46.886 | 20 | projection.event.mapped | 614cdc4f-1720-4229-a958-6761825ec767 | - | 1 | 3 | 이벤트 매핑 | projector=grip-result-projector |

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
- (level 50, `projection.integrity.violation`) read_multimodal 정합성 위반[modalFileNameAttemptConsistency]: 2D 이미지 파일명의 attempt(02)가 이 행의 권위 attempt(01)와 불일치 — 다른 시도의 미디어가 scene_key=반려동물용품_CR01_강아지공룡알장난감_02026 행에 매핑됨. column=image_2d_file_name, observed="반려동물용품_CR01_강아지공룡알장난감_02026_02_20230923.jpg". ← 트립 앵커 → 2D 이미지 매핑 로직에서 payload filename attempt metadata와 row key attempt_num 불일치로 정합성 위배 감지. [corr:ee2549b1-5934-4548-bd3f-c5f9fe81eb3f] [corr:ee2549b1-5934-4548-bd3f-c5f9fe81eb3f]
- (level 50, `projection.integrity.violation`) read_multimodal 정합성 위반[modalFileNameSceneConsistency]: 비디오 파일명의 scene(09999)이 scene_key(02027)와 불일치 — 다른 장면의 미디어가 매핑됨. column=video_file_name, observed="반려동물용품_CR01_강아지공룡알장난감_09999_00_20230923.mp4". → 비디오 매핑 로직에서 payload filename scene metadata와 row key scene_key 불일치로 정합성 위배 감지. [corr:ee2549b1-5934-4548-bd3f-c5f9fe81eb3f] [corr:ee2549b1-5934-4548-bd3f-c5f9fe81eb3f]
- read_multimodal 스키마의 image_2d_file_name, video_file_name 컬럼은 원천 파일명 저장이며, 키는 (scene_key, attempt_num) [corr:ee2549b1-5934-4548-bd3f-c5f9fe81eb3f]
- src/projection/projector/multimodal.projector.ts 의 MultiModalProjector.checkIntegrity() 메서드에서 MODAL_FILE_NAME_RE regex로 scene/attempt 추출하고 대조하지만, 위반 시 IntegrityViolation[] 반환만 로그 방출(projection.integrity.violation)이며 map() → upsert() 흐름이 차단되지 [corr:ee2549b1-5934-4548-bd3f-c5f9fe81eb3f]
- src/projection/projector/multimodal.projector.ts 의 map() 메서드에서 payload["2D_image_file_name"], payload.video_file_name 을 직접 반환하여 image2dFileName, videoFileName 필드에 매핑, 정합성 위배 데이터가 DB에 영구 적재됨 [corr:ee2549b1-5934-4548-bd3f-c5f9fe81eb3f]

### Decision Drivers
- Data Quality Defect vs Schema Deficiency (원천 데이터 불일치 아님)
- Integrity Violation Handling Policy (거절·격리 원칙 준수)
- Batch Processing Continuity & Rollback Safety
- Existing Projector Architecture Alignment

### Considered Options
#### Projector Rejection (기존 보강)
- 접근: MultiModalProjector.map() 내 checkIntegrity 호출 전/후 위배 감지 시 throw new Error(...) 또는 return null 처리로 upsert 차단.
- 제안 필드: map(), checkIntegrity()
- 트레이드오프: 재투영 로직 간결, 배치 트랜잭션 롤백 안전, 기존 스키마 무변.
```typescript
const violations = this.checkIntegrity(row); if (violations.length > 0) { throw new Error(`integrity violation: ${violations[0].detail}`); } return row;
```

#### Flag Column Insertion (신규 분리/확장)
- 접근: read_multimodal 스키마에 isIntegrityValid boolean 추가, 위배 시 flag=false 삽입.
- 제안 필드: schema/index.ts, read-multimodal.ts, map()
- 트레이드오프: DB schema drift 발생, 조회 로직 필터링 필요, 원천 데이터 미제거.
```typescript
return { ...row, isIntegrityValid: violations.length === 0 };
```

### Decision Outcome
Projector Rejection (기존 보강)

### Consequences
- (+) 원천 데이터 유입 차단
- (+) DB 정합성 유지
- (+) 기존 스키마/API 호환성
- (−) projector throw 시 batch rollback 재실행 오버헤드 발생
- (−) 원천 센서 수정 요청 외부 프로세스 필요

### Non-Goals
- payload coercion/default substitution
- schema expansion
- external API contract change

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### 격리(containment) SQL — 신규 Read Model DDL 불필요, 결함 데이터 무해화가 조치다

```sql
SELECT event_id, stream_id, attempt_num, global_seq FROM event_store WHERE stream_id = 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02026' AND attempt_num = 1 AND global_seq = 26;
```

## 3. API Versioning

### 버전 영향

변 변경 없음. Read Model 스키마와 projection API 엔드포인트(POST /projection/multimodal)가 불변이며, 내부 projector 검증 로직 tightening만 적용으로 클라이언트 계약 유지.

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
- actionability (실행 가능성): Docs 의 SQL 과 절차를 그대로 따르면 문제가 해결되는가. [자동 검증 결과]를 실측으로 반영하되, 실행이 되더라도 의도와 다른 일을 하는 SQL(조건이 한 건도 맞지 않는 삭제문, 요구한 컬럼이 없는 테이블 등)은 감점한다. 기존 v1 테이블(read_grip_result, read_multimodal, event_store)을 ALTER/DROP 하면 감점. 5=그대로 따르면 해결(실행 성공 + 요구 충족). 3=오탈자·순서 등 소폭 수정 후 해결. 1=따르면 실패하거나 기존 자산이 손상.
- completeness (완결성): 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소가 모두 유효하고 서로 일치하는가(머리말·SQL 의 테이블명·권고 대상·코드가 서로 같은 것을 가리키는가). 5=세 요소가 모두 유효하고 서로 일치. 3=세 요소가 있으나 서로 어긋나거나 항목이 비어 있음. 1=요소 누락 또는 근거 부족 표시.

다음 형식의 JSON 객체 하나만 출력하라:
{"groundedness": 1-5, "diagnosisAccuracy": 1-5, "actionability": 1-5, "completeness": 1-5, "unsupportedClaims": ["자료에 없는 주장 인용 (없으면 빈 배열)"], "rationale": "각 항목 점수 근거를 항목당 1~2문장으로, 한국어로"}
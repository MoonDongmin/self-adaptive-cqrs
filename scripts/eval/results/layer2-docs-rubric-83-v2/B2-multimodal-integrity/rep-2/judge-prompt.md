당신은 이벤트 소싱 + CQRS 기반 Physical AI 데이터 플랫폼의 시니어 아키텍트이자 엄격한 평가자다. LLM 파이프라인이 [자료](로그·이벤트·스키마 정보)를 보고 [Docs]를 생성했다. Docs 는 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소를 항상 함께 담아야 하는 단일 산출물이다. 당신은 [정답 요지]와 [자료], [자동 검증 결과]를 기준으로 Docs 를 네 항목의 루브릭으로 채점한다. 채점은 관대하지 않게, 근거 없는 주장·지어낸 값·의도와 다른 SQL·서로 어긋나는 절에는 낮은 점수를 준다. 실행·컴파일이 통과했다는 사실만으로 실행 가능성이나 완결성에 높은 점수를 주지 않는다. SQL 과 코드 블록을 실제로 읽고 루브릭의 점검 항목을 하나씩 확인한다. 반드시 JSON 객체 하나만 출력한다. 설명문·마크다운 펜스는 출력하지 않는다.

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
<<<자료 끝>>>

[자동 검증 결과] — 실제 데이터베이스 실행·컴파일 결과. 실행 가능성 판단의 실측 근거로 삼는다.
- 문서 검사: 전 항목 통과
- SQL 실행: 블록 1개 중 1개 실행 성공
- 코드 컴파일: 컴파일 대상 코드 없음

[저장소 파일 확인] — 파이프라인은 진단 도구로 저장소 소스 코드를 조회할 수 있다. Docs 가 인용한 파일 경로의 실재 여부와 앞부분 발췌이다.
- 저장소에 실재하는 파일 (2건): src/projection/projector/multimodal.projector.ts, src/projection/runner/catch-up.runner.ts
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

<<<src/projection/runner/catch-up.runner.ts 앞부분 80행>>>
import { Inject, Injectable, Optional } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { SENSOR_VALUE_PUBLISHER, type SensorValuePublisher } from '@/projection/kafka/sensor-value.publisher';
import { IntegrityViolation, ProjectionResult, Projector } from '@/projection/projector/projector';
import {
  EVENT_STORE_READER,
  EventStoreEventRow,
  type EventStoreReaderRepository,
} from '@/projection/repository/event-store-reader.repository';
import {
  PROJECTION_CURSOR,
  type ProjectionCursorRepository,
} from '@/projection/repository/projection-cursor.repository';
import { DRIZZLE, type Drizzle } from '@/shared/database/drizzle.provider';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

@Injectable()
export class CatchUpRunner {
  private static readonly BATCH_SIZE: number = 500;

  constructor(
    private readonly logger: PinoLogger,
    @Inject(DRIZZLE)
    private readonly db: Drizzle,
    @Inject(EVENT_STORE_READER)
    private readonly reader: EventStoreReaderRepository,
    @Inject(PROJECTION_CURSOR)
    private readonly cursors: ProjectionCursorRepository,
    @Optional()
    @Inject(SENSOR_VALUE_PUBLISHER)
    private readonly sensorPublisher?: SensorValuePublisher,
  ) {
    this.logger.setContext(CatchUpRunner.name);
  }

  async run<Insert>(projector: Projector<Insert>): Promise<ProjectionResult> {
    const startedAt: number = Date.now();
    const fromSeq: number = await this.cursors.getOrInit(projector.name);

    this.logger.info(
      {
        action: LogAction.PROJECTION_START,
        [LogContext.PROJECTOR_NAME]: projector.name,
        [LogContext.FROM_SEQ]: fromSeq,
      },
      "catch-up 시작",
    );

    let lastProcessed: number = fromSeq;
    let processed: number = 0;

    for (;;) {
      const events: EventStoreEventRow[] = await this.reader.fetchAfter(
        lastProcessed,
        CatchUpRunner.BATCH_SIZE,
      );

      if (events.length === 0) {
        break;
      }

      const batchFrom: number = lastProcessed;
      const batchTo: number = events[events.length - 1].globalSeq;

      const rows: Insert[] = [];

      try {
        await this.db.transaction(async (tx) => {
          for (const event of events) {
            const row: Insert = projector.map(event);

            await projector.upsert(tx, row);
            rows.push(row);
          }

          await this.cursors.update(tx, projector.name, batchTo);
        });
      } catch (err) {
        this.logger.error(
          {
<<<발췌 끝>>>

[Docs] — 채점 대상 문서 전문
<<<Docs 시작>>>
---
docId: analysis-c8ded58a-84c5-4e63-98dc-b1abd489eaeb
generatedAt: 2026-08-11T14:27:53.250Z
targetReadModel: read_multimodal
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: null
  to: null
  affectedEndpoints: []
evidenceSources:
  - { origin: developer-logging, anchorId: "c8ded58a-84c5-4e63-98dc-b1abd489eaeb" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_multimodal

> 결론(TL;DR): `read_multimodal`을(를) 보강한다 — 프로젝션 정합성 검사에서 파일명 메타데이터와 이벤트 키(scene_key/attempt_num) 불일치 감지 2회, 배치 처리는 정상 완료. (이상 유형: 투영 정합성 위반 · 심각도: critical)

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

## 1. 권고 (Recommendation)

### Status
proposed

### Context (근거)
- (level 50, `projection.integrity.violation`) read_multimodal 정합성 위반[modalFileNameAttemptConsistency]: 2D 이미지 파일명의 attempt(02)가 이 행의 권위 attempt(01)와 불일치 — 다른 시도의 미디어가 scene_key=반려동물용품_CR01_강아지공룡알장난감_02026 행에 매핑됨. column=image_2d_file_name, observed="반려동물용품_CR01_강아지공룡알장난감_02026_02_20230923.jpg". ← 트립 앵커 → 2D 이미지 파일명 attempt(02)와 event 키 attempt(01) 불일치로, 원천 데이터 메타데이터 일관성 위가 Read Model image_2d_file_name 컬럼에 오염된 값이 투영됨. [corr:c8ded58a-84c5-4e63-98dc-b1abd489eaeb]
- (level 50, `projection.integrity.violation`) read_multimodal 정합성 위반[modalFileNameSceneConsistency]: 비디오 파일명의 scene(09999)이 scene_key(02027)과 불일치 — 다른 장면의 미디어가 매핑됨. column=video_file_name, observed="반려동물용품_CR01_강아지공룡알장난감_09999_00_20230923.mp4". → 비디오 파일명 scene(09999)과 event 키 scene_key(02027) 불일치로, 원천 데이터 메타데이터 일관성 위가 Read Model video_file_name 컬럼에 다른 장면의 미디어 링크가 투영됨. [corr:c8ded58a-84c5-4e63-98dc-b1abd489eaeb]
- Insight 카드 read_multimodal 스키마는 (scene_key:varchar, attempt_num:smallint) 이 Primary Key 이며, image_2d_file_name, video_file_name 은 원천 파일명 컬럼이다 [corr:c8ded58a-84c5-4e63-98dc-b1abd489eaeb].
- src/projection/projector/multimodal.projector.ts 의 checkIntegrity 메소드 는 정규표식(MODAL_FILE_NAME_RE, SCENE_KEY_NUM_RE) 로 파일명/scene_key 를 파싱 후 parsed.attemptNum !== modal.expectedAttempt 및 parsed.sceneNum !== expectedSceneNum 조건으로 위반을 감지 [corr:c8ded58a-84c5-4e63-98dc-b1abd489eaeb].
- 현재 CatchUpRunner 패턴은 map() -> upsert() -> checkIntegrity() 순차로, 이미 투영된 행에 대해 정합성 검사를 후-적재로 수행. Zod(toyDataSchema) 는 string 타입 통과해 구조 검증은 실패하지 않으나, 의미적 값 오류(메타데이터 일관성 위) 로 인해 Read Model 에 오염 데이터가 영구 체우 [corr:c8ded58a-84c5-4e63-98dc-b1abd489eaeb].
- image_2d_uri, video_uri 는 현재 projector 가 null 로 둠, 이는 구조적 부족이 아님. 문제는 원천 payload 의 파일명 메타데이터가 event key(stream_id, attempt_num) 와 불치 [corr:c8ded58a-84c5-4e63-98dc-b1abd489eaeb].

### Decision Drivers
- 원천 데이터 메타데이터 일관성 위(소스 payload vs event key mismatch)
- Read Model 정합성 검사 로직 적용 시 이미 투영된 행 오염 방지
- Zod 통과로 구조 검증만으로는 부족함
- API/Schema 변경 최소화 유지

### Considered Options
#### Existing Reinforcement (Projector Logic Adjustment & DB Purge)
- 접근: MultiModalProjector.map() 로직 조정. 파일명 파싱 전 event.attemptNum/scene_key 일치 검증 수행, 실패 시 throw error 로 CatchUpRunner 가 배치 트랜잭션 롤백 처리. 기존 오염 행은 containment SQL 로 DELETE.
- 제안 필드: skipOnIntegrityViolation
- 트레이드오프: 재투영 비용 0(기존 DB 정화), 리스크는 catch-up 커서 관리 복잡성 증가
```typescript
const parsed2d = parseModalFileName(payload["2D_image_file_name"]); if (parsed2d !== null && parsed2d.attemptNum !== event.attemptNum) { throw new Error(`metadata mismatch: 2D attempt ${parsed2d.attemptNum} vs event ${event.attemptNum}`); }; const sceneKeyMatch = SCENE_KEY_NUM_RE.exec(event.streamId.replace(/^grip-attempt:/, "")); const expectedSceneNum = sceneKeyMatch?.[1]; if (parsed2d !== null && parsed2d.sceneNum !== expectedSceneNum) { throw new Error(`metadata mismatch: 2D scene ${parsed2d.sceneNum} vs event ${expectedSceneNum}`); };
```

#### Audit Table Separation
- 접근: audit_multimodal_integrity 테이블 추가, checkIntegrity 실패 시 INSERT violation record instead of DELETE.
- 제안 필드: auditTable
- 트레이드오프: storage overhead 증가, query complexity 상승, but provenance preserved
```typescript
// src/projection/runner/catch-up.runner.ts (violation handling)
```

### Decision Outcome
Existing Reinforcement (Projector Logic Adjustment & DB Purge)

### Consequences
- (+) Read Model 정합성 보장
- (+) 오염 데이터 영구 유출 차단
- (+) API/Schema 호환 유지
- (−) Catch-up 커서 관리 로직 복잡성 증가
- (−) 원천 payload 수정 요청 필요(외 시스템 영향)

### Non-Goals
- Zod schema 변경(coerce/default)
- URI 매핑 구현
- 새로운 Read Model 테이블 생성

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### 격리(containment) SQL — 신규 Read Model DDL 불필요, 결함 데이터 무해화가 조치다

```sql
DELETE FROM read_multimodal WHERE (stream_id = 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02026' AND attempt_num = 1) OR (stream_id = 'grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02027' AND attempt_num = 1);
```

## 3. API Versioning

### 버전 영향

변장 없음. Read Model 스키마와 API 엔드포인트가 그대로 유지하며, 본 권고는 오직 원천 데이터 정합성 검사 로직 조정과 DB 격리 조치가 수행될 뿐.

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
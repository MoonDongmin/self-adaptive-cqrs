당신은 이벤트 소싱 + CQRS 기반 Physical AI 데이터 플랫폼의 시니어 아키텍트이자 엄격한 평가자다. LLM 파이프라인이 [자료](로그·이벤트·스키마 정보)를 보고 [Docs]를 생성했다. Docs 는 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소를 항상 함께 담아야 하는 단일 산출물이다. 당신은 [정답 요지]와 [자료], [자동 검증 결과]를 기준으로 Docs 를 네 항목의 루브릭으로 채점한다. 채점은 관대하지 않게, 근거 없는 주장·지어낸 값·의도와 다른 SQL·서로 어긋나는 절에는 낮은 점수를 준다. 실행·컴파일이 통과했다는 사실만으로 실행 가능성이나 완결성에 높은 점수를 주지 않는다. SQL 과 코드 블록을 실제로 읽고 루브릭의 점검 항목을 하나씩 확인한다. 반드시 JSON 객체 하나만 출력한다. 설명문·마크다운 펜스는 출력하지 않는다.

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
<<<자료 끝>>>

[자동 검증 결과] — 실제 데이터베이스 실행·컴파일 결과. 실행 가능성 판단의 실측 근거로 삼는다.
- 문서 검사: 전 항목 통과
- SQL 실행: 블록 2개 중 2개 실행 성공
- 코드 컴파일: 파일 4개 중 2개 통과 / 실패: src/projection/projection.service.ts: [object Object] | src/projection/projection.controller.ts: [object Object]

[저장소 파일 확인] — 파이프라인은 진단 도구로 저장소 소스 코드를 조회할 수 있다. Docs 가 인용한 파일 경로의 실재 여부와 앞부분 발췌이다.
- 저장소에 실재하는 파일 (5건): src/projection/projection.controller.ts, src/projection/projection.module.ts, src/projection/projection.service.ts, src/projection/projector/multimodal.projector.ts, src/shared/database/schema/index.ts
- 저장소에 없는 파일 (1건): src/projection/projector/multimodal-enriched.projector.ts

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
docId: analysis-2e0ba5d4-c224-4a0e-9ab8-f169471f7bca
generatedAt: 2026-08-12T04:38:49.762Z
targetReadModel: read_multimodal
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: v1
  to: v2
  affectedEndpoints:
    - "POST /multimodal"
    - "POST /grip-result"
    - "POST /insert-all"
    - "POST /multimodal-enriched"
evidenceSources:
  - { origin: developer-logging, anchorId: "2e0ba5d4-c224-4a0e-9ab8-f169471f7bca" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_multimodal

> 결론(TL;DR): `read_multimodal`을(를) 재생성한다 — multimodal-projector 요청 처리 중 이벤트 매핑 완료 후, read_multimodal Read Model 투영 단계에서 2건의 정합성 위배(integrity.violation) 감지. 파일명(filename) 내 포함된 scene/attempt 식별자(metadata)가 해당 Read Model row의 key(authority)와 불일치로, '다른 시도의 미디어'가 매핑된 것으로 판정. (이상 유형: 투영 정합성 위반 · 심각도: critical)

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

## 1. 권고 (Recommendation)

### Status
proposed

### Context (근거)
- (level 50, `projection.integrity.violation`) read_multimodal 정합성 위반[modalFileNameAttemptConsistency]: 2D 이미지 파일명의 attempt(02)가 이 행의 권위 attempt(01)와 불일치 — 다른 시도의 미디어가 scene_key=반려동물용품_CR01_강아지공룡알장난감_02026 행에 매핑됨. column=image_2d_file_name, observed="반려동물용품_CR01_강아지공룡알장난감_02026_02_20230923.jpg". ← 트립 앵커 → read_multimodal row attempt(01)와 payload filename attempt(02) 불일치로, 다른 시도의 미디어가 매핑됨. [corr:2e0ba5d4-c224-4a0e-9ab8-f169471f7bca]
- (level 50, `projection.integrity.violation`) read_multimodal 정합성 위반[modalFileNameSceneConsistency]: 비디오 파일명의 scene(09999)이 scene_key(02027)과 불일치 — 다른 장면의 미디어가 매핑됨. column=video_file_name, observed="반려동물용품_CR01_강아지공룡알장난감_09999_00_20230923.mp4". → read_multimodal row scene_key(02027)와 payload filename scene(09999) 불일치로, 다른 장면의 미디어가 매핑됨. [corr:2e0ba5d4-c224-4a0e-9ab8-f169471f7bca]
- read_multimodal 스키마 PK는 (scene_key, attempt_num)이며 image_2d_file_name, video_file_name 컬럼은 원천 파일명 저장. [corr:2e0ba5d4-c224-4a0e-9ab8-f169471f7bca]
- MultiModalProjector.map() (src/projection/projector/multimodal.projector.ts) 에서 event.streamId.replace(/^grip-attempt:/, "") 로 sceneKey 할당하고 event.attemptNum 로 attemptNum 할당. 파일명은 payload.raw 값 그대로 매핑. [corr:2e0ba5d4-c224-4a0e-9ab8-f169471f7bca]
- checkIntegrity() 메서드에서 parseModalFileName 로 scene/attempt 추출하지만 위반 시 IntegrityViolation[] 만 반환, 투영 유입(upsert)은 차단하지 않음. 기존 Read Model 의 PK(이벤트 스트림 attempt)와 payload filename metadata 가 1:1 매핑 가정이 깨져 정합성 위배 발생. [corr:2e0ba5d4-c224-4a0e-9ab8-f169471f7bca]

### Decision Drivers
- Data Quality Routing Accuracy (filename metadata vs stream attempt mismatch)
- Defect Isolation Principle (reject/coerce 금지, 격리 유지)
- Projection Flow Stability (catch-up 재실행 안전)

### Considered Options
#### 기각 대안 (기존 보강)
- 접근: MultiModalProjector 의 checkIntegrity 반환 위반 시 throw new Error() 로 투영 중단/skip 적용.
- 제안 필드: catch-up 재시작 비용 증가, 정상 attempt 데이터도 함께 유실될 수 있음
- 트레이드오프: Driver 1(정립성 검증) 실패로 정상 attempt 동유실, Driver 3(재실행 안정) 저하
```typescript
if (violations.length > 0) throw new Error(violations[0].detail);
```

#### 권장안 (신규 분리)
- 접근: 신규 read_multimodal_enriched 채택. map() 에서 filename regex 추출하여 image_2d_scene_num, image_2d_attempt_num 등 신규 컬럼 채움. PK 는 (scene_key, attempt_num) 유지하되, 정합성 검증은 extracted values 대 sceneKey/attemptNum 비교로 변경.
- 제안 필드: migrationSql 및 projector map/upsert 수정 필요
- 트레이드오프: Driver 2(격리 유지) 충족, filename metadata 기반 정립성 검증 가능
```typescript
const parsed = parseModalFileName(payload["2D_image_file_name"]); return { ...image_2d_scene_num: parsed?.sceneNum ?? null, image_2d_attempt_num: parsed?.attemptNum ?? null };
```

#### 대안 (버전 교체)
- 접근: 기존 read_multimodal 유지, is_defect_media boolean 컬럼 추가.
- 제안 필드: query 로직 변경 필요
- 트레이드오프: Driver 1 실패로 routing logic 미해결, query 호환성 유지
```typescript
row.isDefectMedia = violations.length > 0;
```

### Decision Outcome
신규 분리(read_multimodal_enriched)

### Consequences
- (+) filename metadata 기반 정립성 검증 가능
- (+) mismatch media 격리/재로팅 용이
- (+) catch-up 재실행 안전
- (−) migrationSql 실행 및 projector 코드 수정 필요
- (−) 초기 deploy latency 증가

### Non-Goals
- 기존 read_multimodal 테이블 삭제
- zod schema 변경
- sensor value message format 변경

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

- 대상: `read_multimodal_enriched` · 키: (scene_key, attempt_num) · 원천 이벤트: GripAttemptRecorded

```sql
CREATE TABLE read_multimodal_enriched (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  image_2d_scene_num varchar,
  image_2d_attempt_num smallint,
  video_scene_num varchar,
  video_attempt_num smallint,
  stream_id varchar,
  global_seq bigint,
  PRIMARY KEY (scene_key, attempt_num)
);
```

### 필드

```mschema
# Table: read_multimodal_enriched
[
(scene_key:varchar, 장면 식별 키 (stream_id에서 'grip-attempt:' 제거), Primary Key, Primary Key),
(attempt_num:smallint, 동일 장면 내 파지 시도 번호, Primary Key, Primary Key),
(image_2d_scene_num:varchar, 2D 이미지 파일명에서 scene(5자리) 추출),
(image_2d_attempt_num:smallint, 2D 이미지 파일명에서 attempt(2자리) 추출),
(video_scene_num:varchar, 비디오 파일명에서 scene(5자리) 추출),
(video_attempt_num:smallint, 비디오 파일명에서 attempt(2자리) 추출 (sentinel 00)),
(stream_id:varchar, ES 스트림 ID — 추적 키),
(global_seq:bigint, 투영 출처 이벤트의 ES 전역 시퀀스 — 추적 키)
]
```

### 투영 매핑 명세 (이벤트 → 컬럼)

> upsert 키: scene_key,attempt_num · 리플레이: projection_cursor 초기화 시 첫 이벤트 global_seq 기준 설정. catch-up 전체 재투영 시 upsert 전 멱يد성 보장(동키 동payload 동일 행 갱신) 필수.

| 원천 이벤트 | payload 필드 | 컬럼 | 변환 |
| --- | --- | --- | --- |
| GripAttemptRecorded | 2D_image_file_name | image_2d_scene_num | extract 5-digit scene segment |

파생 컬럼(이벤트 payload 아님):
- `stream_id` ← event envelope stream ID
- `global_seq` ← event envelope global sequence number
- `scene_key` ← stream_id prefix 'grip-attempt:' 제거
- `attempt_num` ← 2D_image_file_name 2-digit attempt segment 추출, cast smallint
- `image_2d_attempt_num` ← 2D_image_file_name 2-digit attempt segment 추출, cast smallint
- `video_scene_num` ← video_file_name 5-digit scene segment 추출
- `video_attempt_num` ← video_file_name 2-digit attempt segment 추출, cast smallint (sentinel 00)

### Insight 카드 등록 (Insight Read DB 동기화)

> DDL 적용 시 아래 카드 등록도 함께 실행한다 — 다음 분석부터 신규 Read Model 이 LLM 컨텍스트에 노출된다.

```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_multimodal_enriched', 'read_model', '원천 미디어 파일명(scene/attempt)을 DB 레이어에 직접 추출·저장하여 row-level 정립성 검증과 조인 성능 확보. 기존 raw filename 저장만으로는 매핑 로직 오류(다른 시도의 미디어 덮어씀)를 runtime regex check로 유추해야 하며, DB 레이어에서 key consistency enforcement가 불가능.', '(scene_key, attempt_num)')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_multimodal_enriched', 'scene_key', 'varchar', '장면 식별 키 (stream_id에서 ''grip-attempt:'' 제거), Primary Key', 1),
  ('read_multimodal_enriched', 'attempt_num', 'smallint', '동일 장면 내 파지 시도 번호, Primary Key', 2),
  ('read_multimodal_enriched', 'image_2d_scene_num', 'varchar', '2D 이미지 파일명에서 scene(5자리) 추출', 3),
  ('read_multimodal_enriched', 'image_2d_attempt_num', 'smallint', '2D 이미지 파일명에서 attempt(2자리) 추출', 4),
  ('read_multimodal_enriched', 'video_scene_num', 'varchar', '비디오 파일명에서 scene(5자리) 추출', 5),
  ('read_multimodal_enriched', 'video_attempt_num', 'smallint', '비디오 파일명에서 attempt(2자리) 추출 (sentinel 00)', 6),
  ('read_multimodal_enriched', 'stream_id', 'varchar', 'ES 스트림 ID — 추적 키', 7),
  ('read_multimodal_enriched', 'global_seq', 'bigint', '투영 출처 이벤트의 ES 전역 시퀀스 — 추적 키', 8)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased (v1 → v2)

#### Added
- 신류 Read Model 테이블 read_multimodal_enriched (scene_key, attempt_num key + filename metadata 추출 컬럼)
- 신류 v2 프로젝터 MultimodalEnrichedProjector (map/upsert 시그니처 준수, metadata 직접 파싱)
- 신류 라우트 /multimodal-enriched (v1 호환성 완전 보존)

### 마이그레이션 절차

- 하위호환 변경: 기존 v1 라우트(/projection/multimodal) 및 ProjectionService DI 바인딩 완전 보존; 신류 테이블 read_multimodal_enriched은 기존 read_multimodal 동시 존재, 키 충돌 격치로 v1 데이터 미변영
- 파괴적 변경: 없음
- 컷오버 전 테스트: 1. /multimodal-enriched 라우트 실행 시 projection.integrity.violation 발생 0건 검증
2. read_multimodal_enriched row count = read_multimodal row count 동치 확인
3. image_2d_scene_num, video_scene_num 컬럼 null/valid regex 일치 전수 검증
- 롤백 창/조건: 컷오버 전 48h 롤백 창: /multimodal-enriched 라우트 실패 시 v1 /projection/multimodal 재실행. read_multimodal_enriched 테이블 DROP TABLE 실행, schema/index.ts export revert, DI 바인딩 revert.
- Insight 카드 등록: §2의 카드 등록 SQL을 DDL과 함께 적용(카탈로그 동기화)

### 사유·호환성

- 사유: 기존 v1 MultiModalProjector의 map 메서드에서 attemptNum을 event.attemptNum으로 매핑하고, checkIntegrity 메서드에서 파일명 파싱된 attempt와 행의 권위 attempt를 비교하는 로직이 충돌. 이벤트 스트림 ID 기반 attempt_num과 실제 미디어 파일명 metadata(시도/장면)가 불일치로 정합성 위배 발생. 신규 v2 MultimodalEnrichedProjector는 filename metadata를 직접 추출해 image_2d_scene_num, image_2d_attempt_num 등 보충 컬럼에 저장, 기존 key 기반 매핑은 유지하되 데이터 품질 결함을 격치로 처리할 수 있도록 확장 구조 제공. [corr:2e0ba5d4-c224-4a0e-9ab8-f169471f7bca]
- 트리거 근거: 04:38:47.286 | 50 | projection.integrity.violation | 2e0ba5d4-c224-4a0e-9ab8-f169471f7bca | grip-attempt:..._02026 | 1 | 26 | read_multimodal 정합성 위반[modalFileNameAttemptConsistency]: 2D 이미지 파일명의 attempt(02)가 이 행의 권위 attempt(01)와 불일치 — 다른 시도의 미디어가 scene_key=..._02026 행에 매핑됨. column=image_2d_file_name, observed="..._02026_02_20230923.jpg". [corr:2e0ba5d4-c224-4a0e-9ab8-f169471f7bca]
- v1 호환성: 기존 라우트(/projection/multimodal, /projection/grip-result)와 ProjectionService/ProjectionController DI 바인딩은 완전 보존. 신규 라우트(/multimodal-enriched)는 additive 변경이며, v1 프로젝터(MultiModalProjector)는 미사용으로 유지되 호환성 격치로 제공.

### 변경 파일

- `src/shared/database/schema/index.ts` (modifyFile) — 신류 스키마 export 추가. 기존 v1 export 완전 보존.
- `src/projection/projection.service.ts` (modifyFile) — 신류 v2 프로젝터 DI 바인딩 추가. 기존 메서드/로직 완전 보존.
- `src/projection/projection.controller.ts` (modifyFile) — 신류 v2 라우트 /multimodal-enriched 추가. 기존 라우트 완전 보존.

## Optional — 부속 자료(컨텍스트 축소 시 생략 가능)

### 신규 Read Model — Drizzle 스키마

```ts
import { bigint, index, pgTable, primaryKey, smallint, varchar } from 'drizzle-orm/pg-core';

export const readMultimodalEnriched = pgTable(
  "read_multimodal_enriched",
  {
    sceneKey: varchar("scene_key").notNull(),
    attemptNum: smallint("attempt_num").notNull(),

    image2dSceneNum: varchar("image_2d_scene_num"),
    image2dAttemptNum: smallint("image_2d_attempt_num"),

    videoSceneNum: varchar("video_scene_num"),
    videoAttemptNum: smallint("video_attempt_num"),

    streamId: varchar("stream_id").notNull(),
    globalSeq: bigint("global_seq", { mode: "number" }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.sceneKey, t.attemptNum] }),
    index("idx_multimodal_enriched_scene").on(t.image2dSceneNum, t.videoSceneNum),
  ],
);
```

### 신규 Read Model — Projector

```ts
import { Injectable } from '@nestjs/common';
import { type InferInsertModel } from 'drizzle-orm';
import { PinoLogger } from 'nestjs-pino';
import { type ToyDataDto, toyDataSchema } from '@/insert/dto/toy-data.dto';
import type { Projector } from '@/projection/projector/projector';
import type { EventStoreEventRow } from '@/projection/repository/event-store-reader.repository';
import { DrizzleTx } from '@/shared/database/drizzle.provider';
import { readMultimodalEnriched } from '@/shared/database/schema/service/read-multimodal-enriched';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

type ReadMultimodalEnrichedInsert = InferInsertModel<typeof readMultimodalEnriched>;

const MODAL_FILE_NAME_RE: RegExp = /_(\d{5})_(\d{2})_\d{8}\.[A-Za-z0-9]+$/;
function parseModalFileName(fileName: string): { sceneNum: string; attemptNum: number } | null {
  const matched = MODAL_FILE_NAME_RE.exec(fileName);
  return matched ? { sceneNum: matched[1], attemptNum: Number(matched[2]) } : null;
}

@Injectable()
export class MultimodalEnrichedProjector implements Projector<ReadMultimodalEnrichedInsert> {
  readonly name: string = "multimodal-enriched-projector";

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(MultimodalEnrichedProjector.name);
  }

  map(event: EventStoreEventRow): ReadMultimodalEnrichedInsert {
    let payload: ToyDataDto;
    try {
      payload = toyDataSchema.parse(event.payload);
    } catch (error) {
      this.logger.error(
        {
          action: LogAction.MAP_FAILED,
          error,
          [LogContext.EVENT_ID]: event.eventId,
          [LogContext.STREAM_ID]: event.streamId,
          [LogContext.ATTEMPT_NUM]: event.attemptNum,
          [LogContext.GLOBAL_SEQ]: event.globalSeq,
        },
        "이벤트 매핑(검증) 실패",
      );

      throw error;
    }

    const sceneKey = event.streamId.replace(/^grip-attempt:/, "");

    this.logger.debug(
      {
        action: LogAction.EVENT_MAPPED,
        [LogContext.PROJECTOR_NAME]: this.name,
        [LogContext.SCENE_KEY]: sceneKey,
        [LogContext.ATTEMPT_NUM]: event.attemptNum,
        [LogContext.GLOBAL_SEQ]: event.globalSeq,
      },
      "이벤트 매핑",
    );

    const image2dParsed = parseModalFileName(payload["2D_image_file_name"]);
    const videoParsed = parseModalFileName(payload.video_file_name);

    return {
      sceneKey,
      attemptNum: event.attemptNum,
      image2dSceneNum: image2dParsed?.sceneNum ?? null,
      image2dAttemptNum: image2dParsed?.attemptNum ?? null,
      videoSceneNum: videoParsed?.sceneNum ?? null,
      videoAttemptNum: videoParsed?.attemptNum ?? null,
      streamId: event.streamId,
      globalSeq: event.globalSeq,
    };
  }

  async upsert(tx: DrizzleTx, row: ReadMultimodalEnrichedInsert): Promise<void> {
    await tx
      .insert(readMultimodalEnriched)
      .values(row)
      .onConflictDoUpdate({
        target: [readMultimodalEnriched.sceneKey, readMultimodalEnriched.attemptNum],
        set: {
          image2dSceneNum: row.image2dSceneNum,
          image2dAttemptNum: row.image2dAttemptNum,
          videoSceneNum: row.videoSceneNum,
          videoAttemptNum: row.videoAttemptNum,
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
export * from "./service/read-multimodal-enriched";

// src/projection/projector/multimodal-enriched.projector.ts (import)
import { MultimodalEnrichedProjector } from '@/projection/projector/multimodal-enriched.projector';

// src/projection/projection.service.ts (constructor injection & method)
private readonly multimodalEnriched: MultimodalEnrichedProjector,
catchUpMultimodalEnriched(): Promise<ProjectionResult> { return this.runner.run(this.multimodalEnriched); }

// src/projection/projection.controller.ts (route)
@Post("/multimodal-enriched")
multimodalEnriched(): Promise<ProjectionResult> {
  this.logger.info({ action: LogAction.PROJECTION_REQUEST, [LogContext.ROUTE]: "POST /projection/multimodal-enriched" }, "projection 요청 수신");
  return this.projectionService.catchUpMultimodalEnriched();
}

// src/projection/projection.module.ts (providers)
MultimodalEnrichedProjector,
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
export * from "./service/read-multimodal-enriched";
```

### 버전 교체 코드 — `src/projection/projection.service.ts` (modifyFile)

```typescript
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { MultimodalEnrichedProjector } from '@/projection/projector/multimodal-enriched.projector';
import { ProjectionResult } from '@/projection/projector/projector';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';
import { LogAction } from '@/shared/logger/logging-context';

export type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
};

@Injectable()
export class ProjectionService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly runner: CatchUpRunner,
    private readonly multimodal: MultiModalProjector,
    private readonly gripResult: GripResultProjector,
    private readonly insertService: InsertService,
    private readonly multimodalEnriched: MultimodalEnrichedProjector,
  ) {
    this.logger.setContext(ProjectionService.name);
  }

  catchUpMultimodal(): Promise<ProjectionResult> {
    return this.runner.run(this.multimodal);
  }

  catchUpGripResult(): Promise<ProjectionResult> {
    return this.runner.run(this.gripResult);
  }

  catchUpMultimodalEnriched(): Promise<ProjectionResult> {
    return this.runner.run(this.multimodalEnriched);
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

  @Post("/multimodal-enriched")
  multimodalEnriched(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /multimodal-enriched",
      },
      "v2 projection 요청 수신",
    );

    return this.projectionService.catchUpMultimodalEnriched();
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
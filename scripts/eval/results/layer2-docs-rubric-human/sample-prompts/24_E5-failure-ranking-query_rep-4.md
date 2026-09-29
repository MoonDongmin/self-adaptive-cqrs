당신은 이벤트 소싱 + CQRS 기반 Physical AI 데이터 플랫폼의 시니어 아키텍트이자 엄격한 평가자다. LLM 파이프라인이 [자료](로그·이벤트·스키마 정보)를 보고 [Docs]를 생성했다. Docs 는 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소를 항상 함께 담아야 하는 단일 산출물이다. 당신은 [정답 요지]와 [자료], [자동 검증 결과]를 기준으로 Docs 를 네 항목의 루브릭으로 채점한다. 채점은 관대하지 않게, 근거 없는 주장·지어낸 값·의도와 다른 SQL·서로 어긋나는 절에는 낮은 점수를 준다. 반드시 JSON 객체 하나만 출력한다. 설명문·마크다운 펜스는 출력하지 않는다.

---

[시나리오] E5-failure-ranking-query
[상황] 사용자가 아래 조회를 요청했으나 기존 Read Model 로는 제공할 수 없다.
[정답 요지] 사용자가 파지 실패가 많은 객체 상위 목록(객체별 실패 수·실패율, 순위)을 요청했으나 기존 Read Model 에 랭킹/집계가 없음. 조치: object_name 별 실패 수·실패율 집계 Read Model 신설 + 백필, API v2 병행.

[자료] — Docs 생성 시 파이프라인이 받은 로그·이벤트·스키마 정보
<<<자료 시작>>>
<logging_context>
## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `projection.request`(level 30) 2회, `projection.batch`(level 30) 2회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `projection.event.mapped`(level 20) 60회, `-`(level 30) 5회, `projection.start`(level 30) 2회, `-`(level 20) 6회, `insert.request`(level 30) 1회, `insight.card.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insight.card.miss`(level 40) 1회, `insert.file.ok`(level 20) 60회, `projection.done`(level 30) 2회, `projection.cursor.advanced`(level 20) 2회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01:43:25.469 | 30 | projection.batch | 85a4fd70-2b45-4755-ad73-9a66730d4526 | - | - | - | 배치 처리 | projector=grip-result-projector |
| 01:43:25.469 | 30 | projection.done | 85a4fd70-2b45-4755-ad73-9a66730d4526 | - | - | - | catch-up 완료 | projector=grip-result-projector |
| 01:43:25.469 | 30 | - | 85a4fd70-2b45-4755-ad73-9a66730d4526 | - | - | - | request completed | - |
| 01:43:25.469 | 20 | projection.cursor.advanced | 85a4fd70-2b45-4755-ad73-9a66730d4526 | - | - | - | 커서 이동 | projector=grip-result-projector |
| 01:43:25.472 | 30 | insight.card.request | 41b622e1-0ee2-4137-be39-fc548f8a3894 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 01:43:25.473 | 40 | insight.card.miss | 41b622e1-0ee2-4137-be39-fc548f8a3894 | - | - | - | insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객체별 실패 수와 실패율을 순위대로 보고 싶다. ← 트립 앵커 | - |
| 01:43:25.473 | 30 | - | 41b622e1-0ee2-4137-be39-fc548f8a3894 | - | - | - | request completed | - |
| 01:43:25.778 | 30 | insight.card.request | 7eb7a1da-15b6-41af-8a4e-8ef763a94e10 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 01:43:25.781 | 40 | insight.card.miss | 7eb7a1da-15b6-41af-8a4e-8ef763a94e10 | - | - | - | insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객체별 실패 수와 실패율을 순위대로 보고 싶다. | - |
| 01:43:25.781 | 30 | - | 7eb7a1da-15b6-41af-8a4e-8ef763a94e10 | - | - | - | request completed | - |
| 01:43:26.087 | 30 | insight.card.request | ba807892-5855-44fa-8418-f6ddf6ca3205 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 01:43:26.089 | 40 | insight.card.miss | ba807892-5855-44fa-8418-f6ddf6ca3205 | - | - | - | insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객체별 실패 수와 실패율을 순위대로 보고 싶다. | - |
| 01:43:26.089 | 30 | - | ba807892-5855-44fa-8418-f6ddf6ca3205 | - | - | - | request completed | - |
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
- SQL 실행: 블록 2개 중 1개 실행 성공 / 실패 1개: type "doubleprecision" does not exist
- 코드 컴파일: 파일 4개 중 4개 통과

[저장소 파일 확인] — 파이프라인은 진단 도구로 저장소 소스 코드를 조회할 수 있다. Docs 가 인용한 파일 경로의 실재 여부와 앞부분 발췌이다.
- 저장소에 실재하는 파일 (5건): src/projection/projection.controller.ts, src/projection/projection.module.ts, src/projection/projection.service.ts, src/projection/projector/grip-result.projector.ts, src/shared/database/schema/index.ts
- 저장소에 없는 파일 (0건): 없음

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
docId: analysis-41b622e1-0ee2-4137-be39-fc548f8a3894
generatedAt: 2026-08-13T01:43:33.104Z
targetReadModel: read_grip_object_failures
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: v1
  to: v2
  affectedEndpoints:
    - "POST /multimodal"
    - "POST /grip-result"
    - "POST /grip-object-failures"
    - "POST /insert-all"
evidenceSources:
  - { origin: developer-logging, anchorId: "41b622e1-0ee2-4137-be39-fc548f8a3894" }
  - { origin: developer-logging, anchorId: "7eb7a1da-15b6-41af-8a4e-8ef763a94e10" }
  - { origin: developer-logging, anchorId: "ba807892-5855-44fa-8418-f6ddf6ca3205" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_grip_object_failures

> 결론(TL;DR): `read_grip_object_failures`을(를) 재생성한다 — 사용자가 '파지 실패 상위 목록(실패 수/비율)' 보고서를 요청한 세 번의 insight.card.request 모두 insight.card.miss 응답. (이상 유형: 카드 없는 Read Model 테이블 · 심각도: warning)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `projection.request`(level 30) 2회, `projection.batch`(level 30) 2회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `projection.event.mapped`(level 20) 60회, `-`(level 30) 5회, `projection.start`(level 30) 2회, `-`(level 20) 6회, `insert.request`(level 30) 1회, `insight.card.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insight.card.miss`(level 40) 1회, `insert.file.ok`(level 20) 60회, `projection.done`(level 30) 2회, `projection.cursor.advanced`(level 20) 2회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01:43:25.469 | 30 | projection.batch | 85a4fd70-2b45-4755-ad73-9a66730d4526 | - | - | - | 배치 처리 | projector=grip-result-projector |
| 01:43:25.469 | 30 | projection.done | 85a4fd70-2b45-4755-ad73-9a66730d4526 | - | - | - | catch-up 완료 | projector=grip-result-projector |
| 01:43:25.469 | 30 | - | 85a4fd70-2b45-4755-ad73-9a66730d4526 | - | - | - | request completed | - |
| 01:43:25.469 | 20 | projection.cursor.advanced | 85a4fd70-2b45-4755-ad73-9a66730d4526 | - | - | - | 커서 이동 | projector=grip-result-projector |
| 01:43:25.472 | 30 | insight.card.request | 41b622e1-0ee2-4137-be39-fc548f8a3894 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 01:43:25.473 | 40 | insight.card.miss | 41b622e1-0ee2-4137-be39-fc548f8a3894 | - | - | - | insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객체별 실패 수와 실패율을 순위대로 보고 싶다. ← 트립 앵커 | - |
| 01:43:25.473 | 30 | - | 41b622e1-0ee2-4137-be39-fc548f8a3894 | - | - | - | request completed | - |
| 01:43:25.778 | 30 | insight.card.request | 7eb7a1da-15b6-41af-8a4e-8ef763a94e10 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 01:43:25.781 | 40 | insight.card.miss | 7eb7a1da-15b6-41af-8a4e-8ef763a94e10 | - | - | - | insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객체별 실패 수와 실패율을 순위대로 보고 싶다. | - |
| 01:43:25.781 | 30 | - | 7eb7a1da-15b6-41af-8a4e-8ef763a94e10 | - | - | - | request completed | - |
| 01:43:26.087 | 30 | insight.card.request | ba807892-5855-44fa-8418-f6ddf6ca3205 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 01:43:26.089 | 40 | insight.card.miss | ba807892-5855-44fa-8418-f6ddf6ca3205 | - | - | - | insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객체별 실패 수와 실패율을 순위대로 보고 싶다. | - |
| 01:43:26.089 | 30 | - | ba807892-5855-44fa-8418-f6ddf6ca3205 | - | - | - | request completed | - |

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
- (level 40, `insight.card.miss`) insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객체별 실패 수와 실패율을 순위대로 보고 싶다. ← 트립 앵커 → 기존 Read Model(read_grip_result, read_multimodal)은 1:1 매핑(row-level) 테이블로, 객별 파지 실패 통계(실패 수/비율) aggregated report 카드 부재. [corr:41b622e1-0ee2-4137-be39-fc548f8a3894]
- (level 40, `insight.card.miss`) insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객체별 실패 수와 실패율을 순위대로 보고 싶다. → 동일 집계 의도 재요청으로, 기존 모델의 구조적 한계(Group By 산출값 미제공) 반복 신호. [corr:7eb7a1da-15b6-41af-8a4e-8ef763a94e10]
- (level 40, `insight.card.miss`) insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객체별 실패 수와 실패율을 순위대로 보고 싶다. → 세 번째 재요청으로, Read Model 부족 신호 확립. [corr:ba807892-5855-44fa-8418-f6ddf6ca3205]
- read_grip_result 스키마의 object_name 컬럼은 payload.objects[0].class_name 매핑만 존재, grip_succeed(0/1) 컬럼으로 성공/실패 구분 가능하나 Group By 집계(실패 수/비율)를 직접 제공하지 않음.
- GripResultProjector.map() (src/projection/projector/grip-result.projector.ts) 에서 objectName 과 gripSucceed 만 1:1 매핑, 집계 로직 부재.
- read_multimodal 스키마의 image_2d_uri, video_uri 컬럼은 현재 null 로 둠, 투영 실패(poison event) 관련 없음. 본 요청은 집계 보고 요청이므로 미디어 URI 보강과 무관.
- ProjectionService.catchUpAll() 호출 순서(multimodal -> gripResult) 로, 신규 테이블 연동 시 catchUpGripObjectFailures() 추가 필요.

### Decision Drivers
- 집게 의도 충족(Group By 산출값)
- 기존 모델 구조적 한계(1:1 매핑)
- 조회 성능 최적화
- Insight 카드 호환성

### Considered Options
#### 기전 read_grip_result 보강 (기각 대안)
- 접근: GripResultProjector.map() 수정하여 total_attempts, success_count, failure_count, failure_rate 필드 추가.
- 제안 필드: total_attempts, success_count, failure_count, failure_rate
- 트레이드오프: 재투영 비용 증가, 1:1 매핑 구조 위반으로 Group By 산출값 혼다, 기존 API/Insight 카드 호환성 저하.
```typescript
return { ...row, totalAttempts: payload.objects.length, successCount: payload.grip_succeed, failureCount: 1 - payload.grip_succeed, failureRate: payload.grip_succeed === 0 ? 1 : 0 };
```

#### 신read_grip_object_failures Read Model 생성 (권장)
- 접근: GripObjectFailuresProjector 신규 구현, map() 에서 objects[].class_name 과 grip_succeed 집계 로직 적용, upsert() 로 read_grip_object_failures Drizzle 테이블 연동.
- 제안 필드: object_name, total_attempts, success_count, failure_count, failure_rate
- 트레이드오프: 신규 테이블 생성 SQL/연결 가이드 필요, 초기 구축 비용 발생, but Group By 산출값 직접 제공으로 조회 성능 최적화, Insight 카드 호환성 확보.
```typescript
const agg = payload.objects.reduce((acc, obj) => { acc[obj.class_name] = acc[obj.class_name] || { total: 0, success: 0, fail: 0 }; acc[obj.class_name].total++; if (payload.grip_succeed === 1) acc[obj.class_name].success++; else acc[obj.class_name].fail++; }, {}); return Object.entries(agg).map(([name, stats]) => ({ objectName: name, totalAttempts: stats.total, successCount: stats.success, failureCount: stats.fail, failureRate: stats.total > 0 ? stats.fail / stats.total : null }));
```

### Decision Outcome
신read_grip_object_failures Read Model 생성. Group By 산출값 직접 제공으로 조회 성능 최적화 및 Insight 카드 호환성 확보.

### Consequences
- (+) Group By 산출값 직접 제공으로 Top-N 조회 성능 최적화
- (+) Insight 카드 호환성 확보, 재요청 insight.card.miss 신호 소멸
- (+) 기전 read_grip_result 1:1 매핑 구조 무해 유지
- (−) 신규 테이블 생성 SQL/연결 가이드 필요, 초기 구축 비용 발생
- (−) ProjectionService.catchUpAll() 호출 순서 수정(catchUpGripObjectFailures) 필요

### Non-Goals
- read_multimodal image_2d_uri/video_uri URI 매핑 보강 (무관한 집계 보고 요청)
- Zod 거절/투영 실패 poison event 격리 대응 (해당 없음)

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

- 대상: `read_grip_object_failures` · 키: object_name · 원천 이벤트: GripAttemptRecorded

```sql
CREATE TABLE read_grip_object_failures (
  object_name varchar NOT NULL,
  total_attempts bigint,
  success_count bigint,
  failure_count bigint,
  failure_rate doublePrecision,
  PRIMARY KEY (object_name)
);
```

### 필드

```mschema
# Table: read_grip_object_failures
[
(object_name:varchar, 파지 대상 객체명 (payload.objects[0].class_name), Primary Key),
(total_attempts:bigint, 해당 객체의 누적 시도 수),
(success_count:bigint, 해당 객체의 누적 성공 수 (grip_succeed=1)),
(failure_count:bigint, 해당 객체의 누적 실패 수 (grip_succeed=0)),
(failure_rate:doublePrecision, 실패율 (failure_count / total_attempts, 0일 시 NULL))
]
```

### 투영 매핑 명세 (이벤트 → 컬럼)

> upsert 키: object_name · 리플레이: projection_cursor 초기화 시 upsertKey(object_name) 기준 집게 상태 리셋. catch-up 재투영은 멱등 upsert 전제이므로 반드시 aggregate(SUM/COUNT) 함수 적용하여 누락/과수정 방지, failure_rate는 매 커서 업데이트 시 재계산.

| 원천 이벤트 | payload 필드 | 컬럼 | 변환 |
| --- | --- | --- | --- |
| GripAttemptRecorded | objects[0].class_name | object_name | verbatim |
| GripAttemptRecorded | grip_succeed | total_attempts | aggregate count +1 per event |
| GripAttemptRecorded | grip_succeed | success_count | conditional increment if == 1 |
| GripAttemptRecorded | grip_succeed | failure_count | conditional increment if == 0 |

파생 컬럼(이벤트 payload 아님):
- `failure_rate` ← failure_count / total_attempts (NULL if denominator == 0)

### Insight 카드 등록 (Insight Read DB 동기화)

> DDL 적용 시 아래 카드 등록도 함께 실행한다 — 다음 분석부터 신규 Read Model 이 LLM 컨텍스트에 노출된다.

```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_grip_object_failures', 'read_model', '파지 실패 상위 목록(실패 수/비율) 집계 보고서를 위한 객별 누적 통계 테이블. (scene_key, attempt_num) 행 단위 키를 물려받지 않고 object_name 을 집게 차원 키로 잡으며 onConflictDoUpdate 의 누적 갱신(up += excluded) 으로 매 이벤트 기여치를 더한다.', 'object_name')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_grip_object_failures', 'object_name', 'varchar', '파지 대상 객체명 (payload.objects[0].class_name)', 1),
  ('read_grip_object_failures', 'total_attempts', 'bigint', '해당 객체의 누적 시도 수', 2),
  ('read_grip_object_failures', 'success_count', 'bigint', '해당 객체의 누적 성공 수 (grip_succeed=1)', 3),
  ('read_grip_object_failures', 'failure_count', 'bigint', '해당 객체의 누적 실패 수 (grip_succeed=0)', 4),
  ('read_grip_object_failures', 'failure_rate', 'doublePrecision', '실패율 (failure_count / total_attempts, 0일 시 NULL)', 5)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased (v1 → v2)

#### Added
- 신규 Read Model 테이블 read_grip_object_failures 및 GripObjectFailuresProjector 구현으로 aggregated 실패 통계 보고 지원

### 마이그레이션 절차

- 하위호환 변경: 신규 라우트 /projection/grip-object-failures 추가; 신규 서비스 메서드 catchUpGripObjectFailures 추가; 기존 라우트/프로젝터/테이블 구조 무변 유지
- 파괴적 변경: 없음
- 컷오버 전 테스트: 1. read_grip_object_failures 테이블 생성 및 migrationSql 적용 검증
2. 첫 projection.batch 실행 후 total_attempts, success_count, failure_count, failure_rate 값 정산 일치 확인
3. insight.card.request 실패 통계 조회 시 miss 해제 확인
- 롤백 창/조건: read_grip_object_failures 테이블 DROP, ProjectionService/Controller DI/라우트 revert, schema/index.ts export revert. 조건: cutover 전 validation 실패 또는 downstream insight 카드 의존성 충돌.
- Insight 카드 등록: §2의 카드 등록 SQL을 DDL과 함께 적용(카탈로그 동기화)

### 사유·호환성

- 사유: 기존 Read Model read_grip_result은 payload.objects[0].class_name만 매핑하여 다중 객체 이벤트의 실패 통계를 누락했으며, aggregated failure report 카드가 부재 [corr:41b622e1-0ee2-4137-be39-fc548f8a3894].
- 트리거 근거: 01:43:25.473 | 40 | insight.card.miss | 41b622e1-0ee2-4137-be39-fc548f8a3894 | - | - | - | insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객체별 실패 수와 실패율을 순위대로 보고 싶다. ← 트립 앵커
- v1 호환성: 기존 테이블·라우트·프로젝터 클래스/이름은 보존. 신규 aggregating table 및 프로젝터는 추가만 수행, DI/라우트 wiring은 minimal changeKind=modifyFile.

### 변경 파일

- `src/shared/database/schema/index.ts` (modifyFile) — 신규 Drizzle 스키마 export 추가
- `src/projection/projection.service.ts` (modifyFile) — 신규 프로젝터 DI 배선 및 catchUpAll 메서드 확장
- `src/projection/projection.controller.ts` (modifyFile) — 신규 라우트 엔드포인트 추가 (POST /grip-object-failures)

## Optional — 부속 자료(컨텍스트 축소 시 생략 가능)

### 신규 Read Model — Drizzle 스키마

```ts
import { bigint, doublePrecision, index, pgTable, primaryKey, varchar } from 'drizzle-orm/pg-core';

export const readGripObjectFailures = pgTable(
  "read_grip_object_failures",
  {
    objectName: varchar("object_name").notNull(),
    totalAttempts: bigint("total_attempts", { mode: "number" }).default(0),
    successCount: bigint("success_count", { mode: "number" }).default(0),
    failureCount: bigint("failure_count", { mode: "number" }).default(0),
    failureRate: doublePrecision("failure_rate"),
  },
  (t) => [
    primaryKey({ columns: [t.objectName] }),
    index("idx_object_failures_name").on(t.objectName),
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
import { readGripObjectFailures } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';
import { sql } from 'drizzle-orm';

type ReadGripObjectFailuresInsert = InferInsertModel<typeof readGripObjectFailures>;

@Injectable()
export class GripObjectFailuresProjector implements Projector<ReadGripObjectFailuresInsert> {
  readonly name: string = "grip-object-failures-projector";

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(GripObjectFailuresProjector.name);
  }

  map(event: EventStoreEventRow): ReadGripObjectFailuresInsert {
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

    if (payload.objects.length === 0) {
      this.logger.error(
        {
          action: LogAction.MAP_FAILED,
          [LogContext.EVENT_ID]: event.eventId,
          [LogContext.STREAM_ID]: event.streamId,
        },
        "objects 비어 있음",
      );

      throw new Error(`grip-object-failures map: empty objects in event ${event.eventId}`);
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

    const isSucceed = payload.grip_succeed === 1;

    return {
      objectName: payload.objects[0].class_name,
      totalAttempts: 1,
      successCount: isSucceed ? 1 : 0,
      failureCount: isSucceed ? 0 : 1,
      failureRate: null,
    };
  }

  async upsert(tx: DrizzleTx, row: ReadGripObjectFailuresInsert): Promise<void> {
    await tx
      .insert(readGripObjectFailures)
      .values(row)
      .onConflictDoUpdate({
        target: [readGripObjectFailures.objectName],
        set: {
          totalAttempts: sql`${readGripObjectFailures.totalAttempts} + ${row.totalAttempts}`,
          successCount: sql`${readGripObjectFailures.successCount} + ${row.successCount}`,
          failureCount: sql`${readGripObjectFailures.failureCount} + ${row.failureCount}`,
          failureRate: sql`CASE WHEN (${readGripObjectFailures.totalAttempts} + ${row.totalAttempts}) > 0 THEN (${readGripObjectFailures.failureCount} + ${row.failureCount}) / (${readGripObjectFailures.totalAttempts} + ${row.totalAttempts}) ELSE NULL END`,
        },
      });
  }
}
```

### 신규 Read Model — 배선(컨트롤러/서비스/모듈)

```ts
// src/shared/database/schema/index.ts
export * from "./service/read-grip-object-failures";

// src/projection/projection.service.ts (type & method 추가)
export type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
  gripObjectFailures: ProjectionResult;
};

@Injectable()
export class ProjectionService {
  constructor(
    // ... 기존 주입 ...
    private readonly gripObjectFailures: GripObjectFailuresProjector,
  ) {}

  catchUpGripObjectFailures(): Promise<ProjectionResult> {
    return this.runner.run(this.gripObjectFailures);
  }

  async catchUpAll(): Promise<CatchUpAllResult> {
    // ... 기존 ...
    const gripObjectFailures: ProjectionResult = await this.catchUpGripObjectFailures();
    return { multimodal, gripResult, gripObjectFailures };
  }
}

// src/projection/projection.controller.ts (라우트 추가)
@Controller("projection")
export class ProjectionController {
  // ... 기존 ...
  @Post("/grip-object-failures")
  gripObjectFailures(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/grip-object-failures",
      },
      "projection 요청 수신",
    );
    return this.projectionService.catchUpGripObjectFailures();
  }
}

// src/projection/projection.module.ts (provider 추가)
@Module({
  providers: [
    // ... 기존 ...
    GripObjectFailuresProjector,
  ],
})
export class ProjectionModule {}
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
export * from "./service/read-grip-object-failures";
```

### 버전 교체 코드 — `src/projection/projection.service.ts` (modifyFile)

```typescript
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { GripObjectFailuresProjector } from '@/projection/projector/grip-object-failures.projector';
import { ProjectionResult } from '@/projection/projector/projector';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';
import { LogAction } from '@/shared/logger/logging-context';

export type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
  objectFailures: ProjectionResult;
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
    private readonly objectFailures: GripObjectFailuresProjector,
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

  catchUpGripObjectFailures(): Promise<ProjectionResult> {
    return this.runner.run(this.objectFailures);
  }

  async catchUpAll(): Promise<CatchUpAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_START }, "전체 투영 시작");

    const multimodal: ProjectionResult = await this.catchUpMultimodal();
    const gripResult: ProjectionResult = await this.catchUpGripResult();
    const objectFailures: ProjectionResult = await this.catchUpGripObjectFailures();

    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");

    return { multimodal, gripResult, objectFailures };
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
      { action: LogAction.PROJECTION_REQUEST, [LogContext.ROUTE]: "POST /projection/multimodal" },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpMultimodal();
  }

  @Post("/grip-result")
  gripResult(): Promise<ProjectionResult> {
    this.logger.info(
      { action: LogAction.PROJECTION_REQUEST, [LogContext.ROUTE]: "POST /projection/grip-result" },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpGripResult();
  }

  @Post("/grip-object-failures")
  gripObjectFailures(): Promise<ProjectionResult> {
    this.logger.info(
      { action: LogAction.PROJECTION_REQUEST, [LogContext.ROUTE]: "POST /projection/grip-object-failures" },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpGripObjectFailures();
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
- actionability (실행 가능성): Docs 의 SQL 과 절차를 그대로 따르면 문제가 해결되는가. [자동 검증 결과]를 실측으로 반영하되, 실행이 되더라도 의도와 다른 일을 하는 SQL(조건이 한 건도 맞지 않는 삭제문, 요구한 컬럼이 없는 테이블 등)은 감점한다. 기존 v1 테이블(read_grip_result, read_multimodal, event_store)을 ALTER/DROP 하면 감점. 5=그대로 따르면 해결(실행 성공 + 요구 충족). 3=오탈자·순서 등 소폭 수정 후 해결. 1=따르면 실패하거나 기존 자산이 손상.
- completeness (완결성): 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소가 모두 유효하고 서로 일치하는가(머리말·SQL 의 테이블명·권고 대상·코드가 서로 같은 것을 가리키는가). 5=세 요소가 모두 유효하고 서로 일치. 3=세 요소가 있으나 서로 어긋나거나 항목이 비어 있음. 1=요소 누락 또는 근거 부족 표시.

다음 형식의 JSON 객체 하나만 출력하라:
{"groundedness": 1-5, "diagnosisAccuracy": 1-5, "actionability": 1-5, "completeness": 1-5, "unsupportedClaims": ["자료에 없는 주장 인용 (없으면 빈 배열)"], "rationale": "각 항목 점수 근거를 항목당 1~2문장으로, 한국어로"}
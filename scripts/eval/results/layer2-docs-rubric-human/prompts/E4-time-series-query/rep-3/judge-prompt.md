당신은 이벤트 소싱 + CQRS 기반 Physical AI 데이터 플랫폼의 시니어 아키텍트이자 엄격한 평가자다. LLM 파이프라인이 [자료](로그·이벤트·스키마 정보)를 보고 [Docs]를 생성했다. Docs 는 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소를 항상 함께 담아야 하는 단일 산출물이다. 당신은 [정답 요지]와 [자료], [자동 검증 결과]를 기준으로 Docs 를 네 항목의 루브릭으로 채점한다. 채점은 관대하지 않게, 근거 없는 주장·지어낸 값·의도와 다른 SQL·서로 어긋나는 절에는 낮은 점수를 준다. 반드시 JSON 객체 하나만 출력한다. 설명문·마크다운 펜스는 출력하지 않는다.

---

[시나리오] E4-time-series-query
[상황] 사용자가 아래 조회를 요청했으나 기존 Read Model 로는 제공할 수 없다.
[정답 요지] 사용자가 일자별 파지 성공률 추이(날짜별 시도 수·성공 수·성공률, 시간 순)를 요청했으나 기존 Read Model 에 시계열 집계가 없음. 조치: 일자를 키로 하는 시계열 집계 Read Model 신설 + 백필, API v2 병행.

[자료] — Docs 생성 시 파이프라인이 받은 로그·이벤트·스키마 정보
<<<자료 시작>>>
<logging_context>
## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `projection.request`(level 30) 2회, `projection.batch`(level 30) 2회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `projection.event.mapped`(level 20) 60회, `-`(level 30) 5회, `projection.start`(level 30) 2회, `-`(level 20) 6회, `insert.request`(level 30) 1회, `insight.card.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insight.card.miss`(level 40) 1회, `insert.file.ok`(level 20) 60회, `projection.done`(level 30) 2회, `projection.cursor.advanced`(level 20) 2회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 07:28:44.578 | 30 | projection.batch | b24bbe2d-10b9-4a07-9b9f-5ed85d3562de | - | - | - | 배치 처리 | projector=grip-result-projector |
| 07:28:44.578 | 20 | projection.cursor.advanced | b24bbe2d-10b9-4a07-9b9f-5ed85d3562de | - | - | - | 커서 이동 | projector=grip-result-projector |
| 07:28:44.578 | 30 | projection.done | b24bbe2d-10b9-4a07-9b9f-5ed85d3562de | - | - | - | catch-up 완료 | projector=grip-result-projector |
| 07:28:44.579 | 30 | - | b24bbe2d-10b9-4a07-9b9f-5ed85d3562de | - | - | - | request completed | - |
| 07:28:44.582 | 30 | insight.card.request | 7145b74d-4a63-492a-9320-2fb8a584d2ec | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 07:28:44.583 | 40 | insight.card.miss | 7145b74d-4a63-492a-9320-2fb8a584d2ec | - | - | - | insight 카드 없음: 일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가? ← 트립 앵커 | - |
| 07:28:44.583 | 30 | - | 7145b74d-4a63-492a-9320-2fb8a584d2ec | - | - | - | request completed | - |
| 07:28:44.887 | 30 | insight.card.request | f3b85ecf-6bfe-4421-8ecd-7671bc0ab5d1 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 07:28:44.890 | 40 | insight.card.miss | f3b85ecf-6bfe-4421-8ecd-7671bc0ab5d1 | - | - | - | insight 카드 없음: 일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가? | - |
| 07:28:44.890 | 30 | - | f3b85ecf-6bfe-4421-8ecd-7671bc0ab5d1 | - | - | - | request completed | - |
| 07:28:45.196 | 30 | insight.card.request | d81eaabb-9aeb-4a27-bfa9-34636f1f8562 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 07:28:45.212 | 40 | insight.card.miss | d81eaabb-9aeb-4a27-bfa9-34636f1f8562 | - | - | - | insight 카드 없음: 일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가? | - |
| 07:28:45.212 | 30 | - | d81eaabb-9aeb-4a27-bfa9-34636f1f8562 | - | - | - | request completed | - |
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
- SQL 실행: 블록 2개 중 1개 실행 성공 / 실패 1개: type "double_precision" does not exist
- 코드 컴파일: 파일 4개 중 3개 통과 / 실패: src/projection/projection.service.ts: [object Object]

[저장소 파일 확인] — 파이프라인은 진단 도구로 저장소 소스 코드를 조회할 수 있다. Docs 가 인용한 파일 경로의 실재 여부와 앞부분 발췌이다.
- 저장소에 실재하는 파일 (6건): src/projection/projection.controller.ts, src/projection/projection.module.ts, src/projection/projection.service.ts, src/projection/projector/grip-result.projector.ts, src/shared/database/schema/index.ts, src/shared/database/schema/service/read-grip-result.ts
- 저장소에 없는 파일 (1건): src/shared/database/schema/service/read-grip-daily-success-rate.ts

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

<<<src/shared/database/schema/service/read-grip-result.ts 앞부분 80행>>>
import { bigint, index, jsonb, pgTable, primaryKey, smallint, timestamp, varchar } from 'drizzle-orm/pg-core';

export const readGripResult = pgTable(
  "read_grip_result",
  {
    sceneKey: varchar("scene_key").notNull(),
    attemptNum: smallint("attempt_num").notNull(),

    objectName: varchar("object_name").notNull(),
    gripSucceed: smallint("grip_succeed").notNull(),
    gripperType: varchar("gripper_type", { length: 16 }).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),

    grip2dPose: jsonb("grip_2d_pose"),
    grip3dPose: jsonb("grip_3d_pose"),

    robotTf: jsonb("robot_tf"),

    humanAnnotationGrasp: jsonb("human_annotation_grasp"),

    streamId: varchar("stream_id").notNull(),
    globalSeq: bigint("global_seq", { mode: "number" }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.sceneKey, t.attemptNum] }),
    index("idx_grip_result_object").on(t.objectName, t.occurredAt),
    index("idx_grip_result_succeed").on(t.gripSucceed, t.occurredAt),
  ],
);

<<<발췌 끝>>>

[Docs] — 채점 대상 문서 전문
<<<Docs 시작>>>
---
docId: analysis-7145b74d-4a63-492a-9320-2fb8a584d2ec
generatedAt: 2026-08-12T07:28:47.268Z
targetReadModel: read_grip_daily_success_rate
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: v1
  to: v2
  affectedEndpoints:
    - "POST /multimodal"
    - "POST /grip-result"
    - "POST /insert-all"
    - "POST /grip-daily-success-rate"
evidenceSources:
  - { origin: developer-logging, anchorId: "7145b74d-4a63-492a-9320-2fb8a584d2ec" }
  - { origin: developer-logging, anchorId: "f3b85ecf-6bfe-4421-8ecd-7671bc0ab5d1" }
  - { origin: developer-logging, anchorId: "d81eaabb-9aeb-4a27-bfa9-34636f1f8562" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_grip_daily_success_rate

> 결론(TL;DR): `read_grip_daily_success_rate`을(를) 재생성한다 — 사용자가 '일자별 파지 성공률 추이'를 요청하나, 현재 존재하는 Read Model(`read_grip_result`)은 원천 시도 기록(1건 단위)만 제공하여 해당 집계/요구 조건을 직접 조회할 수 없음. 시스템은 매칭 실패(`insight.card.miss`)로 응답. (이상 유형: 카드 없는 Read Model 테이블 · 심각도: warning)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `projection.request`(level 30) 2회, `projection.batch`(level 30) 2회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `projection.event.mapped`(level 20) 60회, `-`(level 30) 5회, `projection.start`(level 30) 2회, `-`(level 20) 6회, `insert.request`(level 30) 1회, `insight.card.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insight.card.miss`(level 40) 1회, `insert.file.ok`(level 20) 60회, `projection.done`(level 30) 2회, `projection.cursor.advanced`(level 20) 2회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 07:28:44.578 | 30 | projection.batch | b24bbe2d-10b9-4a07-9b9f-5ed85d3562de | - | - | - | 배치 처리 | projector=grip-result-projector |
| 07:28:44.578 | 20 | projection.cursor.advanced | b24bbe2d-10b9-4a07-9b9f-5ed85d3562de | - | - | - | 커서 이동 | projector=grip-result-projector |
| 07:28:44.578 | 30 | projection.done | b24bbe2d-10b9-4a07-9b9f-5ed85d3562de | - | - | - | catch-up 완료 | projector=grip-result-projector |
| 07:28:44.579 | 30 | - | b24bbe2d-10b9-4a07-9b9f-5ed85d3562de | - | - | - | request completed | - |
| 07:28:44.582 | 30 | insight.card.request | 7145b74d-4a63-492a-9320-2fb8a584d2ec | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 07:28:44.583 | 40 | insight.card.miss | 7145b74d-4a63-492a-9320-2fb8a584d2ec | - | - | - | insight 카드 없음: 일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가? ← 트립 앵커 | - |
| 07:28:44.583 | 30 | - | 7145b74d-4a63-492a-9320-2fb8a584d2ec | - | - | - | request completed | - |
| 07:28:44.887 | 30 | insight.card.request | f3b85ecf-6bfe-4421-8ecd-7671bc0ab5d1 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 07:28:44.890 | 40 | insight.card.miss | f3b85ecf-6bfe-4421-8ecd-7671bc0ab5d1 | - | - | - | insight 카드 없음: 일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가? | - |
| 07:28:44.890 | 30 | - | f3b85ecf-6bfe-4421-8ecd-7671bc0ab5d1 | - | - | - | request completed | - |
| 07:28:45.196 | 30 | insight.card.request | d81eaabb-9aeb-4a27-bfa9-34636f1f8562 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 07:28:45.212 | 40 | insight.card.miss | d81eaabb-9aeb-4a27-bfa9-34636f1f8562 | - | - | - | insight 카드 없음: 일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가? | - |
| 07:28:45.212 | 30 | - | d81eaabb-9aeb-4a27-bfa9-34636f1f8562 | - | - | - | request completed | - |

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
- (level 40, `insight.card.miss`) insight 카드 없음: 일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가? ← 트립 앵커 → 요청은 집계(일자별 시도/성도/성도률)이나, 기존 Read Model의 행 단위 원천 기록만 제공해 GROUP BY 일자 충족 못 함. [corr:7145b74d-4a63-492a-9320-2fb8a584d2ec]
- (level 40, `insight.card.miss`) insight 카드 없음: 일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가? → 동일 의도로 2회차 실패 반복, 지속된 조회 요구 미충만 신호. [corr:f3b85ecf-6bfe-4421-8ecd-7671bc0ab5d1]
- (level 40, `insight.card.miss`) insight 카드 없음: 일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가? → 3회차 실패 반복, 기존 read_grip_result 구조적 부족 확증. [corr:d81eaabb-9aeb-4a27-bfa9-34636f1f8562]
- Insight 카드 read_grip_result의 실제 컬럼명·의미: scene_key(장면 식별 키), attempt_num(동장 내 시도 번호), occurred_at(데이터 촬영 일자) 등. 현재 Read Model은 (scene_key, attempt_num) 키로 1:1 매칭 원천 시도 기록만 제공.
- GripResultProjector.map() (src/projection/projector/grip-result.projector.ts) 에서 occurredAt: event.occurredAt 만 매핑, 집계 로직(map() → upsert) 미구현. 기존 구현은 원천 데이터 1:1 투영만 수행.
- read_grip_result Drizzle 스키마 (src/shared/database/schema/service/read-grip-result.ts) 정의: sceneKey, attemptNum as Primary Key, occurredAt as timestamp. 키 구조가 원천 시도 단위이므로 GROUP BY occurred_at 집계 조회를 직접 수행할 수 없음.

### Decision Drivers
- 집게 조회 요구 충족(structural deficiency): 원천 1:1 매칭 테이블로는 occurred_at 기준 건수/성도 수/성도률 GROUP BY 조회 불가.
- 원천 데이터 정성 유지(1:1 매칭 vs 집계): 기존 Read Model의 키·컬럼 구조를 변경하면 원천 시도 단위 정성성 및 하위 조회 호환성 훼손.
- API 호환성/버전 관리(versionSwitch 필요): 신규 테이블·스키마 추가는 필연히 API 엔드포인트/호환성 변경 동반해야.

### Considered Options
#### 기각 대안: 기존 read_grip_result 보강
- 접근: GripResultProjector.map() 수정해 occurred_at 기준으로 집계 로직 추가, 테이블 스키마 변경.
- 제안 필드: attempt_count, success_count, success_rate
- 트레이드오프: 키 충돌(Primary Key 변경), 원천 1:1 매칭 정성성 위반, 재투영 비용 과다. (Driver 2·3에서 졌음)
```typescript
return { sceneKey: ..., attemptNum: ..., occurredAt: event.occurredAt, attemptCount: aggregatedAttempts, successCount: aggregatedSuccesses, successRate: aggregatedSuccesses / aggregatedAttempts, ... };
```

#### 권장안: 신규 Read Model read_grip_daily_success_rate 생성 + 버전 교체(versionSwitch) 연계
- 접근: src/shared/database/schema/service/read-grip-daily-success-rate.ts Drizzle 스키마 추가, GripDailySuccessRateProjector map() 구현해 occurred_date 기준 집계 로직.
- 제안 필드: occurred_date, attempt_count, success_count, success_rate
- 트레이드오프: API 엔드포인트/스키마 변경 필요(versionSwitch), 신규 테이블 관리 오버헤드, 원천 1:1 조회 시 기존 모델 병참 사용. (Driver 1·2·3 모두 충족)
```typescript
return { occurredDate: event.occurredAt.toISOString().split('T')[0], attemptCount: 1, successCount: payload.grip_succeed, successRate: payload.grip_succeed };
```

### Decision Outcome
신규 Read Model read_grip_daily_success_rate 생성 + 버전 교체(versionSwitch) 연계. 사유: 원천 1:1 매칭 정성성 유지하며 집계 조회 요구를 직접 충족, API 호환성 변경은 필연히 동반됨.

### Consequences
- (+) 일자별 시도 수/성도 수/성도률 GROUP BY 조회 시 O(1) 테이블 접근 가능.
- (+) 원천 read_grip_result 정성성·키 구조 무보장 유지, 하위 조회 호환성 보존.
- (+) CatchUpRunner 재실행 시 신규 집계 로직 병투영으로 일관성 유지.
- (−) API 엔드포인트/스키마 변경 수반(versionSwitch), 클라이언트 연동 테스트 필요.
- (−) 신규 테이블 관리 오버헤드(이슈·인덱스·백업) 발생.
- (−) 원천 1:1 조회 시 기존 모델 병참 사용으로 아키텍처 복잡성 증가.

### Non-Goals
- read_grip_result 키/컬럼 구조 변경 또는 필드 추가 금지.
- 검증된 값(zod 거절)을 z.coerce·기본값 치환으로 정상값처럼 꾸며 Read Model 유입 금지.
- 기존 GripResultProjector.map() 로직 수정 금지(1:1 매칭 정성성 훼손).

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

- 대상: `read_grip_daily_success_rate` · 키: occurred_date · 원천 이벤트: GripAttemptRecorded

```sql
CREATE TABLE read_grip_daily_success_rate (
  occurred_date date NOT NULL,
  attempt_count double_precision,
  success_count double_precision,
  success_rate double_precision,
  PRIMARY KEY (occurred_date)
);
```

### 필드

```mschema
# Table: read_grip_daily_success_rate
[
(occurred_date:date, 데이터 촬영 일자(YYYY-MM-DD)에서 도출, 집계 키, Primary Key),
(attempt_count:double_precision, 일자별 총 파지 시도 수(누적 갱신)),
(success_count:double_precision, 일자별 성공 수(0/1 기준, 누적 갱신)),
(success_rate:double_precision, 일자별 성공률(success_count / attempt_count, 누적 갱신))
]
```

### 투영 매핑 명세 (이벤트 → 컬럼)

> upsert 키: occurred_date · 리플레이: projection_cursor 초기화는 스트림 시작 지점을 기준으로 재시작; catch-up 전체 재투영 시 upsert 전제 조건으로 멱id 누적 집계 계산을 반드시 적용해야 누락/과계산이 발생하지.

| 원천 이벤트 | payload 필드 | 컬럼 | 변환 |
| --- | --- | --- | --- |
| GripAttemptRecorded | 2D_image_file_name | occurred_date | extract YYYY-MM-DD from filename (YYYYMMDD -> YYYY-MM-DD) |
| GripAttemptRecorded | grip_succeed | success_count | verbatim |

파생 컬럼(이벤트 payload 아님):
- `attempt_count` ← 1 per event occurrence, cumulative via upsert
- `success_rate` ← success_count / attempt_count (cumulative upsert; zero-division fallback 0.0)

### Insight 카드 등록 (Insight Read DB 동기화)

> DDL 적용 시 아래 카드 등록도 함께 실행한다 — 다음 분석부터 신규 Read Model 이 LLM 컨텍스트에 노출된다.

```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_grip_daily_success_rate', 'read_model', '일자별 파지 시도 수, 성공 수, 성공률 집계를 서버 차원에서 직접 조회 지원. 시간대별/시계열 조회 패턴을 위한 occurred_date 인덱스 포함.', 'occurred_date')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_grip_daily_success_rate', 'occurred_date', 'date', '데이터 촬영 일자(YYYY-MM-DD)에서 도출, 집계 키', 1),
  ('read_grip_daily_success_rate', 'attempt_count', 'double_precision', '일자별 총 파지 시도 수(누적 갱신)', 2),
  ('read_grip_daily_success_rate', 'success_count', 'double_precision', '일자별 성공 수(0/1 기준, 누적 갱신)', 3),
  ('read_grip_daily_success_rate', 'success_rate', 'double_precision', '일자별 성공률(success_count / attempt_count, 누적 갱신)', 4)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased (v1 → v2)

#### Added
- 신규 Read Model 테이블 `read_grip_daily_success_rate` (v2) 및 Drizzle 스키마
- 신규 Projector `GripDailySuccessRateProjector` 로 일일 시도·성·률 집계 매핑/적재
- 라우트 `/projection/grip-daily-success-rate` 및 서비스 메서드 `catchUpDailySuccessRateV2`

### 마이그레이션 절차

- 하위호환 변경: -
- 파괴적 변경: 없음
- 컷오버 전 테스트: 1. `read_grip_daily_success_rate_v2` 테이블 생성 SQL 실행 검증 (PRIMARY KEY, numeric 타입). 2. `GripDailySuccessRateProjector.map()` 단위 테스트: payload.grip_succeed(0/1) 및 occurredAt -> YYYY-MM-DD 추출 정합성. 3. `catchUpAllV2` 통합 테스트: 배치 이벤트 유입 -> DB row 누적(delta) 확인.
- 롤백 창/조건: 컷오버 실패 시 `/grip-daily-success-rate` 라우트/서비스 DI 제거, `read_grip_daily_success_rate_v2.ts` 파일 삭제. 기존 v1 `read_grip_result` 로테이션 무변 유지.
- Insight 카드 등록: §2의 카드 등록 SQL을 DDL과 함께 적용(카탈로그 동기화)

### 사유·호환성

- 사유: 사용자 요청 '일자별 파지 성공률 추이'는 현재 Read Model(`read_grip_result`)의 1건 단위 시도 기록만으로는 직접 조회할 수 없음. 시스템은 매칭 실패(`insight.card.miss`)로 응답 [corr:7145b74d-4a63-492a-9320-2fb8a584d2ec]. 신규 Read Model `read_grip_daily_success_rate` (v2) 로 일자별 시도·성·률 집계를 제공하여 요청 충족 [corr:f3b85ecf-6bfe-4421-8ecd-7671bc0ab5d1].
- 트리거 근거: 07:28:44.583 insight.card.miss [corr:7145b74d-4a63-492a-9320-2fb8a584d2ec] | 07:28:44.890 insight.card.miss [corr:f3b85ecf-6bfe-4421-8ecd-7671bc0ab5d1] | 07:28:45.212 insight.card.miss [corr:d81eaabb-9aeb-4a27-bfa9-34636f1f8562]. 기존 v1 `GripResultProjector.map()` 은 `objectName: payload.objects[0].class_name` 만 사용 및 1:1 매핑 구조로는 일일 성공률 추이를 불가능.
- v1 호환성: 기존 `read_grip_result`, `read_multimodal` 테이블·프로젝터·라우트·서비스 메서드는 무손상 유지. 신규 v2 컴포넌트는 동시 공존으로 이전 클라이언트/테스트 호환이 무해.

### 변경 파일

- `src/shared/database/schema/index.ts` (modifyFile) — 신규 v2 테이블 export 추가. 기존 export 무변.
- `src/projection/projection.service.ts` (modifyFile) — 신규 v2 프로젝터 DI 및 catchUpDailySuccessRateV2 메서드 추가. 기존 메서드/타입 무변.
- `src/projection/projection.controller.ts` (modifyFile) — 신규 v2 라우트 /grip-daily-success-rate 배선. 기존 엔드포인트 무변.

## Optional — 부속 자료(컨텍스트 축소 시 생략 가능)

### 신규 Read Model — Drizzle 스키마

```ts
import { doublePrecision, pgTable, primaryKey, timestamp } from 'drizzle-orm/pg-core';

export const readGripDailySuccessRate = pgTable(
  "read_grip_daily_success_rate",
  {
    occurredDate: timestamp("occurred_date", { withTimezone: true }).notNull(),
    attemptCount: doublePrecision("attempt_count"),
    successCount: doublePrecision("success_count"),
    successRate: doublePrecision("success_rate"),
  },
  (t) => [primaryKey({ columns: [t.occurredDate] })],
);

```

### 신규 Read Model — Projector

```ts
import { Injectable } from '@nestjs/common';
import { sql, type InferInsertModel } from 'drizzle-orm';
import { PinoLogger } from 'nestjs-pino';
import { toyDataSchema } from '@/insert/dto/toy-data.dto';
import type { Projector } from '@/projection/projector/projector';
import type { EventStoreEventRow } from '@/projection/repository/event-store-reader.repository';
import { DrizzleTx } from '@/shared/database/drizzle.provider';
import { readGripDailySuccessRate } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

type GripDailySuccessRateProjectorInsert = InferInsertModel<typeof readGripDailySuccessRate>;

@Injectable()
export class GripDailySuccessRateProjector implements Projector<GripDailySuccessRateProjectorInsert> {
  readonly name: string = "grip-daily-success-rate-projector";

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(GripDailySuccessRateProjector.name);
  }

  map(event: EventStoreEventRow): GripDailySuccessRateProjectorInsert {
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
      occurredDate: new Date(Math.floor(event.occurredAt.getTime() / 86400000) * 86400000),
      attemptCount: 1,
      successCount: payload.grip_succeed,
      successRate: payload.grip_succeed,
    };
  }

  async upsert(tx: DrizzleTx, row: GripDailySuccessRateProjectorInsert): Promise<void> {
    await tx
      .insert(readGripDailySuccessRate)
      .values(row)
      .onConflictDoUpdate({
        target: [readGripDailySuccessRate.occurredDate],
        set: {
          attemptCount: sql`${readGripDailySuccessRate.attemptCount} + ${row.attemptCount}`,
          successCount: sql`${readGripDailySuccessRate.successCount} + ${row.successCount}`,
          successRate: sql`(${readGripDailySuccessRate.successCount} + ${row.successCount})::double precision / NULLIF(${readGripDailySuccessRate.attemptCount} + ${row.attemptCount}, 0)`,
        },
      });
  }
}

```

### 신규 Read Model — 배선(컨트롤러/서비스/모듈)

```ts
// src/shared/database/schema/index.ts
export * from "./service/read-grip-daily-success-rate";

// src/projection/projection.service.ts (snippet)
private readonly gripDailySuccessRate: GripDailySuccessRateProjector,
catchUpGripDailySuccessRate(): Promise<ProjectionResult> {
  return this.runner.run(this.gripDailySuccessRate);
}

// src/projection/projection.controller.ts (snippet)
@Post("/grip-daily-success-rate")
gripDailySuccessRate(): Promise<ProjectionResult> {
  this.logger.info(
    { action: LogAction.PROJECTION_REQUEST, [LogContext.ROUTE]: "POST /projection/grip-daily-success-rate" },
    "projection 요청 수신",
  );
  return this.projectionService.catchUpGripDailySuccessRate();
}

// src/projection/projection.module.ts (snippet)
providers: [...existingProviders, GripDailySuccessRateProjector],
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
export * from "./service/read-grip-daily-success-rate-v2";
```

### 버전 교체 코드 — `src/projection/projection.service.ts` (modifyFile)

```typescript
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { ProjectionResult } from '@/projection/projector/projector';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';
import { GripDailySuccessRateProjector } from '@/projection/projector/grip-daily-success-rate-v2.projector';
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
    private readonly dailySuccessRateV2: GripDailySuccessRateProjector,
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

  catchUpDailySuccessRateV2(): Promise<ProjectionResult> {
    return this.runner.run(this.dailySuccessRateV2);
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

  @Post("/grip-daily-success-rate")
  dailySuccessRateV2(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/grip-daily-success-rate",
      },
      "v2 projection 요청 수신",
    );

    return this.projectionService.catchUpDailySuccessRateV2();
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
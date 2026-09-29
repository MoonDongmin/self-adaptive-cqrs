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
| 01:15:11.865 | 30 | projection.batch | 09a6de75-56d2-4bd4-b329-b183ebf72008 | - | - | - | 배치 처리 | projector=grip-result-projector |
| 01:15:11.865 | 30 | - | 09a6de75-56d2-4bd4-b329-b183ebf72008 | - | - | - | request completed | - |
| 01:15:11.865 | 20 | projection.cursor.advanced | 09a6de75-56d2-4bd4-b329-b183ebf72008 | - | - | - | 커서 이동 | projector=grip-result-projector |
| 01:15:11.865 | 30 | projection.done | 09a6de75-56d2-4bd4-b329-b183ebf72008 | - | - | - | catch-up 완료 | projector=grip-result-projector |
| 01:15:11.868 | 30 | insight.card.request | 4601b3a0-19c6-4f12-816c-4e2801538dfe | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 01:15:11.869 | 40 | insight.card.miss | 4601b3a0-19c6-4f12-816c-4e2801538dfe | - | - | - | insight 카드 없음: 일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가? ← 트립 앵커 | - |
| 01:15:11.869 | 30 | - | 4601b3a0-19c6-4f12-816c-4e2801538dfe | - | - | - | request completed | - |
| 01:15:12.175 | 30 | insight.card.request | 18dbbb66-0c29-44dd-8755-2e4fe3584e01 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 01:15:12.176 | 40 | insight.card.miss | 18dbbb66-0c29-44dd-8755-2e4fe3584e01 | - | - | - | insight 카드 없음: 일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가? | - |
| 01:15:12.177 | 30 | - | 18dbbb66-0c29-44dd-8755-2e4fe3584e01 | - | - | - | request completed | - |
| 01:15:12.482 | 30 | insight.card.request | aab82959-f3ca-4635-94b8-13d871b987c0 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 01:15:12.488 | 40 | insight.card.miss | aab82959-f3ca-4635-94b8-13d871b987c0 | - | - | - | insight 카드 없음: 일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가? | - |
| 01:15:12.489 | 30 | - | aab82959-f3ca-4635-94b8-13d871b987c0 | - | - | - | request completed | - |
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
- 저장소에 없는 파일 (1건): src/projection/projector/daily-grip-stats.projector.ts

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
docId: analysis-4601b3a0-19c6-4f12-816c-4e2801538dfe
generatedAt: 2026-08-13T01:15:14.353Z
targetReadModel: read_daily_grip_stats_v1
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: v1
  to: v2
  affectedEndpoints:
    - "POST /multimodal"
    - "POST /grip-result"
    - "POST /daily-grip-stats"
    - "POST /insert-all"
evidenceSources:
  - { origin: developer-logging, anchorId: "4601b3a0-19c6-4f12-816c-4e2801538dfe" }
  - { origin: developer-logging, anchorId: "18dbbb66-0c29-44dd-8755-2e4fe3584e01" }
  - { origin: developer-logging, anchorId: "aab82959-f3ca-4635-94b8-13d871b987c0" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_daily_grip_stats_v1

> 결론(TL;DR): `read_daily_grip_stats_v1`을(를) 재생성한다 — 사용자가 일자별 파지 성공률(시도, 성공, 성공률)을 조회 요청했으나 해당 aggregated 요약 통계 Insight Card가 미등록되어 실패. 원천 데이터는 read_grip_result 에 존재하나 실로 aggregated 테이블이 누락된 구조적 부족. (이상 유형: 카드 없는 Read Model 테이블 · 심각도: warning)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `projection.request`(level 30) 2회, `projection.batch`(level 30) 2회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `projection.event.mapped`(level 20) 60회, `-`(level 30) 5회, `projection.start`(level 30) 2회, `-`(level 20) 6회, `insert.request`(level 30) 1회, `insight.card.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insight.card.miss`(level 40) 1회, `insert.file.ok`(level 20) 60회, `projection.done`(level 30) 2회, `projection.cursor.advanced`(level 20) 2회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01:15:11.865 | 30 | projection.batch | 09a6de75-56d2-4bd4-b329-b183ebf72008 | - | - | - | 배치 처리 | projector=grip-result-projector |
| 01:15:11.865 | 30 | - | 09a6de75-56d2-4bd4-b329-b183ebf72008 | - | - | - | request completed | - |
| 01:15:11.865 | 20 | projection.cursor.advanced | 09a6de75-56d2-4bd4-b329-b183ebf72008 | - | - | - | 커서 이동 | projector=grip-result-projector |
| 01:15:11.865 | 30 | projection.done | 09a6de75-56d2-4bd4-b329-b183ebf72008 | - | - | - | catch-up 완료 | projector=grip-result-projector |
| 01:15:11.868 | 30 | insight.card.request | 4601b3a0-19c6-4f12-816c-4e2801538dfe | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 01:15:11.869 | 40 | insight.card.miss | 4601b3a0-19c6-4f12-816c-4e2801538dfe | - | - | - | insight 카드 없음: 일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가? ← 트립 앵커 | - |
| 01:15:11.869 | 30 | - | 4601b3a0-19c6-4f12-816c-4e2801538dfe | - | - | - | request completed | - |
| 01:15:12.175 | 30 | insight.card.request | 18dbbb66-0c29-44dd-8755-2e4fe3584e01 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 01:15:12.176 | 40 | insight.card.miss | 18dbbb66-0c29-44dd-8755-2e4fe3584e01 | - | - | - | insight 카드 없음: 일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가? | - |
| 01:15:12.177 | 30 | - | 18dbbb66-0c29-44dd-8755-2e4fe3584e01 | - | - | - | request completed | - |
| 01:15:12.482 | 30 | insight.card.request | aab82959-f3ca-4635-94b8-13d871b987c0 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 01:15:12.488 | 40 | insight.card.miss | aab82959-f3ca-4635-94b8-13d871b987c0 | - | - | - | insight 카드 없음: 일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가? | - |
| 01:15:12.489 | 30 | - | aab82959-f3ca-4635-94b8-13d871b987c0 | - | - | - | request completed | - |

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
- (level 30, `insight.card.request`) insight 카드 단건 조회 요청 수신 → read_grip_result 테이블에 일일 집계 컬럼/행이 미등록되어 요청 의도 충족 불가능. [corr:4601b3a0-19c6-4f12-816c-4e2801538dfe]
- (level 40, `insight.card.miss`) insight 카드 없음: 일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가? ← 트립 앵커 → read_grip_result 테이블에 일일 집계 컬럼/행이 미등록되어 요청 의도 충족 불가능. [corr:4601b3a0-19c6-4f12-816c-4e2801538dfe]
- (level 40, `insight.card.miss`) insight 카드 없음: 일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가? → 동일 의도 재요청 시 기존 Read Model 구조적 부족 신호 반복. [corr:18dbbb66-0c29-44dd-8755-2e4fe3584e01]
- (level 40, `insight.card.miss`) insight 카드 없음: 일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가? → 3회 연속 실패 확정 → aggregated 요약 통계 Insight Card 미등록으로 인한 결함. [corr:aab82959-f3ca-4635-94b8-13d871b987c0]
- read_grip_result 스키마의 occurred_at, grip_succeed는 행 단위(attempt level) 원천 데이터만 제공, GROUP BY occurred_at 및 도출된 성공률 산출값은 단일 모델로는 충족 불가능. [corr:4601b3a0-...]
- GripResultProjector.map() in src/projection/projector/grip-result.projector.ts only 매핑 event payload to single-row inserts, zero daily counter accumulation 로직 존재. [corr:18dbbb66-...]
- ProjectionService.catchUpAll() orchestrates projector runs sequentially; no cross-table aggregation step or batch flush mechanism exists in current pipeline. [corr:aab82959-...]

### Decision Drivers
- Semantic separation (row-level vs aggregate)
- Extensibility (new stats without modifying existing tables)
- Projection pipeline compatibility (batch processing & decoupling)

### Considered Options
#### New projector approach
- 접근: 신규 DailyGripStatsProjector 구현. catch-up 시 raw events 또는 read_grip_result 스캔을 통해 occurred_at 기준 GROUP BY 수행, total_attempts, success_count 누적 갱신, success_rate 계산, read_daily_grip_stats_v1 upsert.
- 제안 필드: occurred_date, total_attempts, success_count, success_rate
- 트레이드오프: 신규 테이블 migration 및 추가 projection pass 소모; 단, decouples aggregation logic cleanly, testability 향상.
```typescript
return { occurredDate: event.occurredAt.toISOString().split('T')[0], totalAttempts: 1, successCount: payload.grip_succeed, successRate: payload.grip_succeed / 1 }; // batch flush at end of projection pass aggregates these fields into read_daily_grip_stats_v1
```

#### 기각 대안: 기존 스키마 확장
- 접근: 기존 read_grip_result 스키마 확장으로 일일 집계 컬럼 추가.
- 제안 필드: occurred_date, total_attempts, success_count, success_rate
- 트레이드오프: violates single-row-per-attempt semantic, breaks primary key consistency (scene_key, attempt_num), high migration cost 및 query performance degradation → lost in decisionDriver(semantic separation).

#### 기각 대안: 내-memory counter 유지
- 접근: GripResultProjector 내-memory counter 유지 + batch flush.
- 제안 필드: occurred_date, total_attempts, success_count, success_rate
- 트레이드오프: tight coupling between row mapper and aggregator, harder to unit-test independently → lost in decisionDriver(extensibility & pipeline compatibility).

### Decision Outcome
New projector approach (DailyGripStatsProjector)

### Consequences
- (+) clear separation
- (+) independent testing
- (+) zero schema migration on read_grip_result
- (−) additional projection pass overhead
- (−) new table maintenance burden

### Non-Goals
- not modifying read_grip_result schema
- not changing API endpoints for existing queries
- not altering event_store structure

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

- 대상: `read_daily_grip_stats_v1` · 키: (occurred_date) · 원천 이벤트: GripAttemptRecorded

```sql
CREATE TABLE read_daily_grip_stats_v1 (
  occurred_date varchar(10) NOT NULL,
  total_attempts smallint,
  success_count smallint,
  success_rate doublePrecision(6),
  PRIMARY KEY (occurred_date)
);
```

### 필드

```mschema
# Table: read_daily_grip_stats_v1
[
(occurred_date:varchar(10), 데이터 촬영 일자 (YYYY-MM-DD) — 이벤트 occurredAt 기준., Primary Key),
(total_attempts:smallint, 일자별 총 파지 시도 수 — 누적 갱신.),
(success_count:smallint, 일자별 성공 수 (grip_succeed == 1) — 누적 갱신.),
(success_rate:doublePrecision(6), 일자별 성공률 (0.0 ~ 1.0) — calculated from totalAttempts/successCount.)
]
```

### 투영 매핑 명세 (이벤트 → 컬럼)

> upsert 키: occurred_date · 리플레이: projection_cursor 초기화 시 occurred_date 기준 정렬 필수; catch-up 전체 재투영 시 upsert 전제(해당 일일 통계 누적값 먼저 삭제/초기화)로 멱덴성 보장해야.

| 원천 이벤트 | payload 필드 | 컬럼 | 변환 |
| --- | --- | --- | --- |
| GripAttemptRecorded | 2D_image_file_name | occurred_date | extract YYYY-MM-DD from filename pattern _YYYYMMDD_ |

파생 컬럼(이벤트 payload 아님):
- `total_attempts` ← count(GripAttemptRecorded) grouped by occurred_date (upsert accumulate)
- `success_count` ← sum(grip_succeed where grip_succeed=1) grouped by occurred_date (upsert accumulate)
- `success_rate` ← success_count / total_attempts (0.0~1.0, doublePrecision(6), default 0.0 if denominator is zero)

### Insight 카드 등록 (Insight Read DB 동기화)

> DDL 적용 시 아래 카드 등록도 함께 실행한다 — 다음 분석부터 신규 Read Model 이 LLM 컨텍스트에 노출된다.

```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_daily_grip_stats_v1', 'read_model', '일자별 파지 성공률(시도, 성공, 성공률) 조회를 위한 집계(Aggregated) Read Model 테이블.', '(occurred_date)')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_daily_grip_stats_v1', 'occurred_date', 'varchar(10)', '데이터 촬영 일자 (YYYY-MM-DD) — 이벤트 occurredAt 기준.', 1),
  ('read_daily_grip_stats_v1', 'total_attempts', 'smallint', '일자별 총 파지 시도 수 — 누적 갱신.', 2),
  ('read_daily_grip_stats_v1', 'success_count', 'smallint', '일자별 성공 수 (grip_succeed == 1) — 누적 갱신.', 3),
  ('read_daily_grip_stats_v1', 'success_rate', 'doublePrecision(6)', '일자별 성공률 (0.0 ~ 1.0) — calculated from totalAttempts/successCount.', 4)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased (v1 → v2)

#### Added
- 신규 Read Model 테이블 read_daily_grip_stats_v1 (occurred_date, total_attempts, success_count, success_rate)
- DailyGripStatsV1Projector 구현: map/upsert aggregation logic
- 라우트 /daily-grip-stats 배선 및 DI wiring

### 마이그레이션 절차

- 하위호환 변경: 기존 v1 테이블·프로젝터·라우트 코드는 무손상 원칙을 따름. 새 aggregation table은 additive 만 추가.; EventStoreEventRow payload schema 및 Zod 검증 로직은 미변.
- 파괴적 변경: 없음
- 컷오버 전 테스트: 1. `catchUpDailyStatsV1` 실행 시 `read_daily_grip_stats_v1` 테이블 생성 및 초기 row 삽입 검증.
2. `total_attempts`, `success_count` 누적 갱신(upsert)이 `read_grip_result` 원천 데이터와 1:1 매칭.
3. `success_rate` 계산(6자리 고정)이 0.0~1.0 범위 준수.
- 롤백 창/조건: 컷오버 실패 시: `DROP TABLE read_daily_grip_stats_v1`, DI wiring revert(`ProjectionService`·`Controller`), schema index export 제거. v1 원천 데이터(`read_grip_result`)는 보존.
- Insight 카드 등록: §2의 카드 등록 SQL을 DDL과 함께 적용(카탈로그 동기화)

### 사유·호환성

- 사유: 기존 Read Model 컬럼(`read_grip_result`)은 원천 파지 시도 데이터만 보존. 사용자의 일자별 성공률 조회 요청이 실패[corr:4601b3a0-19c6-4f12-816c-4e2801538dfe][corr:18dbbb66-0c29-44dd-8755-2e4fe3584e01][corr:aab82959-f3ca-4635-94b8-13d871b987c0]가. aggregated Insight Card 테이블(`read_daily_grip_stats_v1`) 누락되어 구조적 부족을 해결.
- 트리거 근거: | time | level | action | correlation_id | msg |
| --- | --- | --- | --- | --- |
| 01:15:11.869 | 40 | insight.card.miss | 4601b3a0-19c6-4f12-816c-4e2801538dfe | insight 카드 없음: 일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가? ← 트립 앵커 |
| 01:15:12.176 | 40 | insight.card.miss | 18dbbb66-0c29-44dd-8755-2e4fe3584e01 | insight 카드 없음: 일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가? |
| 01:15:12.488 | 40 | insight.card.miss | aab82959-f3ca-4635-94b8-13d871b987c0 | insight 카드 없음: 일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가? |
- v1 호환성: 기존 `read_grip_result`·`read_multimodal` 테이블·프로젝터·라우트·DI 코드는 무손상 원칙을 따름. 새 테이블·프로젝터·라우트는 additive wiring만 추가. v1 데이터와 동시 보존.

### 변경 파일

- `src/shared/database/schema/index.ts` (modifyFile) — 신규 Drizzle 스키마 export 배선 추가. 기존 v1 export는 보존.
- `src/projection/projection.service.ts` (modifyFile) — 신규 Projector DI 배선, catchUpAllResult type 확장, catchUpDailyStatsV1 메서드 추가. 기존 v1 로직 보존.
- `src/projection/projection.controller.ts` (modifyFile) — 신규 라우트 /daily-grip-stats 배선. 기존 v1 엔드포인트 보존.

## Optional — 부속 자료(컨텍스트 축소 시 생략 가능)

### 신규 Read Model — Drizzle 스키마

```ts
import { doublePrecision, pgTable, primaryKey, smallint, varchar } from 'drizzle-orm/pg-core';

export const readDailyGripStatsV1 = pgTable(
  "read_daily_grip_stats_v1",
  {
    occurredDate: varchar("occurred_date").notNull(),
    totalAttempts: smallint("total_attempts"),
    successCount: smallint("success_count"),
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
import { readDailyGripStatsV1 } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

type DailyGripStatsV1ProjectorInsert = InferInsertModel<typeof readDailyGripStatsV1>;

@Injectable()
export class DailyGripStatsV1Projector implements Projector<DailyGripStatsV1ProjectorInsert> {
  readonly name: string = "daily-grip-stats-v1-projector";

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(DailyGripStatsV1Projector.name);
  }

  map(event: EventStoreEventRow): DailyGripStatsV1ProjectorInsert {
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
      occurredDate: event.occurredAt.toISOString().slice(0, 10),
      totalAttempts: 1,
      successCount: payload.grip_succeed,
      successRate: payload.grip_succeed,
    };
  }

  async upsert(tx: DrizzleTx, row: DailyGripStatsV1ProjectorInsert): Promise<void> {
    await tx
      .insert(readDailyGripStatsV1)
      .values(row)
      .onConflictDoUpdate({
        target: [readDailyGripStatsV1.occurredDate],
        set: {
          totalAttempts: sql`${readDailyGripStatsV1.totalAttempts} + ${row.totalAttempts}`,
          successCount: sql`${readDailyGripStatsV1.successCount} + ${row.successCount}`,
          successRate: sql`(${readDailyGripStatsV1.successCount} + ${row.successCount})::double precision / NULLIF(${readDailyGripStatsV1.totalAttempts} + ${row.totalAttempts}, 0)`,
        },
      });
  }
}

```

### 신규 Read Model — 배선(컨트롤러/서비스/모듈)

```ts
// src/shared/database/schema/index.ts (update)
export * from "./insight/insight-entity";
export * from "./insight/insight-field";
export * from "./log/log-cursor";
export * from "./log/log-event";
export * from "./service/event";
export * from "./service/projection-cursor";
export * from "./service/read-grip-result";
export * from "./service/read-multimodal";
export * from "./service/read-daily-grip-stats-v1";

// src/projection/projector/daily-grip-stats.projector.ts (new file)
import { Injectable } from '@nestjs/common';
import { type InferInsertModel } from 'drizzle-orm';
import { PinoLogger } from 'nestjs-pino';
import { type ToyDataDto, toyDataSchema } from '@/insert/dto/toy-data.dto';
import type { Projector } from '@/projection/projector/projector';
import type { EventStoreEventRow } from '@/projection/repository/event-store-reader.repository';
import { DrizzleTx } from '@/shared/database/drizzle.provider';
import { readDailyGripStats } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

// Drizzle SQL tag import for accumulation logic
import { sql } from 'drizzle-orm';

type ReadDailyGripStatsInsert = InferInsertModel<typeof readDailyGripStats>;

@Injectable()
export class DailyGripStatsProjector implements Projector<ReadDailyGripStatsInsert> {
  readonly name: string = "daily-grip-stats-projector";

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(DailyGripStatsProjector.name);
  }

  map(event: EventStoreEventRow): ReadDailyGripStatsInsert {
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

    // Extract date string (YYYY-MM-DD) from occurredAt
    const year = String(event.occurredAt.getFullYear());
    const month = String(event.occurredAt.getMonth() + 1).padStart(2, "0");
    const day = String(event.occurredAt.getDate()).padStart(2, "0");
    const occurredDate: string = `${year}-${month}-${day}`;

    // Calculate success flag (0 or 1)
    const successFlag: number = payload.grip_succeed === 1 ? 1 : 0;

    this.logger.debug(
      {
        action: LogAction.EVENT_MAPPED,
        [LogContext.PROJECTOR_NAME]: this.name,
        [LogContext.SCENE_KEY]: occurredDate,
        [LogContext.ATTEMPT_NUM]: event.attemptNum,
        [LogContext.GLOBAL_SEQ]: event.globalSeq,
      },
      "이벤트 매핑",
    );

    return {
      occurredDate,
      totalAttempts: 1,
      successCount: successFlag,
      // Rate is calculated during upsert accumulation, so initial insert is null.
      successRate: null,
    };
  }

  async upsert(tx: DrizzleTx, row: ReadDailyGripStatsInsert): Promise<void> {
    await tx
      .insert(readDailyGripStats)
      .values(row)
      .onConflictDoUpdate({
        target: [readDailyGripStats.occurredDate],
        set: {
          // Accumulate attempts and successes using table column + row value pattern
          totalAttempts: sql`${readDailyGripStats.totalAttempts} + ${row.totalAttempts}`,
          successCount: sql`${readDailyGripStats.successCount} + ${row.successCount}`,
          // Calculate rate based on new accumulated totals
          successRate: sql`
            CASE 
              WHEN (${readDailyGripStats.totalAttempts} + ${row.totalAttempts}) > 0 
              THEN CAST(${readDailyGripStats.successCount} + ${row.successCount} AS DOUBLE PRECISION) / (${readDailyGripStats.totalAttempts} + ${row.totalAttempts})
              ELSE NULL
            END
          `,
        },
      });
  }
}

// src/projection/projection.service.ts (update)
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { DailyGripStatsProjector } from '@/projection/projector/daily-grip-stats.projector';
import { ProjectionResult } from '@/projection/projector/projector';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';
import { LogAction } from '@/shared/logger/logging-context';

export type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
  dailyGripStats: ProjectionResult;
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
    private readonly dailyGripStats: DailyGripStatsProjector,
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

  catchUpDailyGripStats(): Promise<ProjectionResult> {
    return this.runner.run(this.dailyGripStats);
  }

  async catchUpAll(): Promise<CatchUpAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_START }, "전체 투영 시작");

    const multimodal: ProjectionResult = await this.catchUpMultimodal();
    const gripResult: ProjectionResult = await this.catchUpGripResult();
    const dailyGripStats: ProjectionResult = await this.catchUpDailyGripStats();

    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");

    return { multimodal, gripResult, dailyGripStats };
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

// src/projection/projection.controller.ts (update)
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

  @Post("/daily-grip-stats")
  dailyGripStats(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/daily-grip-stats",
      },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpDailyGripStats();
  }

  @Post("/insert-all")
  insertAll(): Promise<InsertAndProjectionAllResult> {
    this.logger.info(
      { action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/insert-all",
      },
      "projection 요청 수신",
    );

    return this.projectionService.insertAllAndProjectAll();
  }
}

// src/projection/projection.module.ts (update)
import { Module } from '@nestjs/common';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { DailyGripStatsProjector } from '@/projection/projector/daily-grip-stats.projector';
import { ProjectionService } from '@/projection/projection.service';

@Module({
  providers: [ProjectionService, GripResultProjector, MultiModalProjector, DailyGripStatsProjector],
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
export * from "./service/read-daily-grip-stats-v1";
```

### 버전 교체 코드 — `src/projection/projection.service.ts` (modifyFile)

```typescript
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { DailyGripStatsV1Projector } from '@/projection/projector/daily-grip-stats-v1.projector';
import { ProjectionResult } from '@/projection/projector/projector';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';
import { LogAction } from '@/shared/logger/logging-context';

export type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
  dailyStatsV1: ProjectionResult;
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
    private readonly dailyStatsV1: DailyGripStatsV1Projector,
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

  catchUpDailyStatsV1(): Promise<ProjectionResult> {
    return this.runner.run(this.dailyStatsV1);
  }

  async catchUpAll(): Promise<CatchUpAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_START }, "전체 투영 시작");

    const multimodal: ProjectionResult = await this.catchUpMultimodal();
    const gripResult: ProjectionResult = await this.catchUpGripResult();
    const dailyStatsV1: ProjectionResult = await this.catchUpDailyStatsV1();

    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");

    return { multimodal, gripResult, dailyStatsV1 };
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

  @Post("/daily-grip-stats")
  dailyStats(): Promise<ProjectionResult> {
    this.logger.info(
      { action: LogAction.PROJECTION_REQUEST, [LogContext.ROUTE]: "POST /projection/daily-grip-stats" },
      "daily stats projection 요청 수신",
    );

    return this.projectionService.catchUpDailyStatsV1();
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
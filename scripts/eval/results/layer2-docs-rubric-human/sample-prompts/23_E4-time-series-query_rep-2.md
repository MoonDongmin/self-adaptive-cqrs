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
| 17:40:45.623 | 30 | projection.done | 83354eae-5fb0-4efb-b3b1-0cc8f5504be7 | - | - | - | catch-up 완료 | projector=grip-result-projector |
| 17:40:45.623 | 30 | - | 83354eae-5fb0-4efb-b3b1-0cc8f5504be7 | - | - | - | request completed | - |
| 17:40:45.623 | 30 | projection.batch | 83354eae-5fb0-4efb-b3b1-0cc8f5504be7 | - | - | - | 배치 처리 | projector=grip-result-projector |
| 17:40:45.623 | 20 | projection.cursor.advanced | 83354eae-5fb0-4efb-b3b1-0cc8f5504be7 | - | - | - | 커서 이동 | projector=grip-result-projector |
| 17:40:45.626 | 30 | insight.card.request | 7f638470-b913-438a-a200-1c6b20779b34 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 17:40:45.627 | 40 | insight.card.miss | 7f638470-b913-438a-a200-1c6b20779b34 | - | - | - | insight 카드 없음: 일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가? ← 트립 앵커 | - |
| 17:40:45.627 | 30 | - | 7f638470-b913-438a-a200-1c6b20779b34 | - | - | - | request completed | - |
| 17:40:45.931 | 30 | insight.card.request | 78c90852-1512-4ef8-8580-ead0fc7789b6 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 17:40:45.933 | 40 | insight.card.miss | 78c90852-1512-4ef8-8580-ead0fc7789b6 | - | - | - | insight 카드 없음: 일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가? | - |
| 17:40:45.934 | 30 | - | 78c90852-1512-4ef8-8580-ead0fc7789b6 | - | - | - | request completed | - |
| 17:40:46.239 | 30 | insight.card.request | 1fb81635-7d91-4598-89bb-7a60927de40b | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 17:40:46.242 | 40 | insight.card.miss | 1fb81635-7d91-4598-89bb-7a60927de40b | - | - | - | insight 카드 없음: 일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가? | - |
| 17:40:46.242 | 30 | - | 1fb81635-7d91-4598-89bb-7a60927de40b | - | - | - | request completed | - |
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
docId: analysis-7f638470-b913-438a-a200-1c6b20779b34
generatedAt: 2026-08-11T17:40:52.913Z
targetReadModel: read_daily_grip_success_rate_v1
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: v1
  to: v2
  affectedEndpoints:
    - "POST /multimodal"
    - "POST /grip-result"
    - "POST /insert-all"
    - "POST /daily-grip-success-rate"
evidenceSources:
  - { origin: developer-logging, anchorId: "7f638470-b913-438a-a200-1c6b20779b34" }
  - { origin: developer-logging, anchorId: "78c90852-1512-4ef8-8580-ead0fc7789b6" }
  - { origin: developer-logging, anchorId: "1fb81635-7d91-4598-89bb-7a60927de40b" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_daily_grip_success_rate_v1

> 결론(TL;DR): `read_daily_grip_success_rate_v1`을(를) 재생성한다 — 사용자가 '일자별 파지 성공률 추이'를 요청하여 insight.card.request를 3회 연속 실행. 현재 시스템의 Read Model 카탈로그(`GripAttemptRecorded`, `read_grip_result`, `read_multimodal`)에는 해당 기능에 매칭된 카드가 존재하지 않아 insight.card.miss로 실패했다. (이상 유형: 카드 없는 Read Model 테이블 · 심각도: warning)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `projection.request`(level 30) 2회, `projection.batch`(level 30) 2회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `projection.event.mapped`(level 20) 60회, `-`(level 30) 5회, `projection.start`(level 30) 2회, `-`(level 20) 6회, `insert.request`(level 30) 1회, `insight.card.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insight.card.miss`(level 40) 1회, `insert.file.ok`(level 20) 60회, `projection.done`(level 30) 2회, `projection.cursor.advanced`(level 20) 2회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 17:40:45.623 | 30 | projection.done | 83354eae-5fb0-4efb-b3b1-0cc8f5504be7 | - | - | - | catch-up 완료 | projector=grip-result-projector |
| 17:40:45.623 | 30 | - | 83354eae-5fb0-4efb-b3b1-0cc8f5504be7 | - | - | - | request completed | - |
| 17:40:45.623 | 30 | projection.batch | 83354eae-5fb0-4efb-b3b1-0cc8f5504be7 | - | - | - | 배치 처리 | projector=grip-result-projector |
| 17:40:45.623 | 20 | projection.cursor.advanced | 83354eae-5fb0-4efb-b3b1-0cc8f5504be7 | - | - | - | 커서 이동 | projector=grip-result-projector |
| 17:40:45.626 | 30 | insight.card.request | 7f638470-b913-438a-a200-1c6b20779b34 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 17:40:45.627 | 40 | insight.card.miss | 7f638470-b913-438a-a200-1c6b20779b34 | - | - | - | insight 카드 없음: 일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가? ← 트립 앵커 | - |
| 17:40:45.627 | 30 | - | 7f638470-b913-438a-a200-1c6b20779b34 | - | - | - | request completed | - |
| 17:40:45.931 | 30 | insight.card.request | 78c90852-1512-4ef8-8580-ead0fc7789b6 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 17:40:45.933 | 40 | insight.card.miss | 78c90852-1512-4ef8-8580-ead0fc7789b6 | - | - | - | insight 카드 없음: 일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가? | - |
| 17:40:45.934 | 30 | - | 78c90852-1512-4ef8-8580-ead0fc7789b6 | - | - | - | request completed | - |
| 17:40:46.239 | 30 | insight.card.request | 1fb81635-7d91-4598-89bb-7a60927de40b | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 17:40:46.242 | 40 | insight.card.miss | 1fb81635-7d91-4598-89bb-7a60927de40b | - | - | - | insight 카드 없음: 일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가? | - |
| 17:40:46.242 | 30 | - | 1fb81635-7d91-4598-89bb-7a60927de40b | - | - | - | request completed | - |

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
- (level 30, `insight.card.request`) insight 카드 단건 조회 요청 수신 → 사용자 의도 신호 포착으로 일자별 파지 성공률 집계 요청 시작. [corr:7f638470-b913-438a-a200-1c6b20779b34]
- (level 40, `insight.card.miss`) insight 카드 없음: 일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가? ← 트립 앵커 → 시스템 내 카탈로그에 date-level aggregation card 부재로 매칭 실패. [corr:7f638470-b913-438a-a200-1c6b20779b34]
- (level 40, `insight.card.miss`) insight 카드 없음: 일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가? → 반복 실패 확증 현존 row-level 모델로는 chronological aggregation 충족 불가능. [corr:78c90852-1512-4ef8-8580-ead0fc7789b6]
- (level 40, `insight.card.miss`) insight 카드 없음: 일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가? → 3회 연속 miss 구조적 부족 재확인으로 신규 aggregated Read Model 카드 등록 필 필요. [corr:1fb81635-7d91-4598-89bb-7a60927de40b]
- read_grip_result Insight 카드 정의는 (scene_key, attempt_num)을 Primary Key로 구성하며 grip_succeed, occurred_at 열만 존재. date-level 집계 열(attempt_count, success_count, success_rate) 부재.
- GripResultProjector 구현(src/projection/projector/grip-result.projector.ts)의 map() 메서드는 이벤트 payload를 row-level insert 객체로 변환. occurred_date 추출, 일일 누적 더하기, 성공률 계산 로직 미구현.
- ProjectionService.catchUpAll() 호출 순서는 multimodal → gripResult. 기존 관례는 row-level projector 독립 실행. 일일 집계 로직은 별도 projector lifecycle 또는 pipeline 확장이 필요해 coupling avoidance.
- read_multimodal 및 GripAttemptRecorded는 media link/Event payload 전전용. 일일 성공률 계산 지원 card 부재 재확증.

### Decision Drivers
- Semantic Alignment: row-level raw data vs aggregated summary boundary separation
- Query Performance: pre-aggregation storage vs runtime GROUP BY compute cost
- System Extensibility: direct card registration & lifecycle decoupling
- API Versioning Compatibility: new table introduction contract expansion

### Considered Options
#### New ReadModel
- 접근: DailyRateProjector 생성 targeting read_daily_grip_success_rate_v1.
- 제안 필드: occurred_date, attempt_count, success_count, success_rate
- 트레이드오프: 신뢰 테이블 migration 및 별도 projector lifecycle 필요, but cleanly separates aggregated data from raw attempt records.
```typescript
const date = event.occurredAt.toISOString().split('T')[0]; return { occurredDate: date, attemptCount: 1, successCount: payload.grip_succeed, successRate: payload.grip_succeed };
```

#### Denormalization
- 접근: read_grip_result 확장에 일일 집계 열 추가.
- 제안 필드: occurred_date, attempt_count, success_count, success_rate
- 트레이드오프: row-level semantic 위배, storage bloat 증가, upsert logic 복잡화.
```typescript
N/A
```

#### Client Aggregation
- 접근: query time SQL GROUP BY 의존.
- 제안 필드: -
- 트레이드오프: insight request latency spike, compute cost per query 비효율.
```typescript
N/A
```

### Decision Outcome
newReadModel 채택 read_daily_grip_success_rate_v1. 사유: 확정 설계 매칭 date-level aggregation intent, cleanly separates aggregated data from raw attempt records, direct card registration 지원.

### Consequences
- (+) insight.request latency zero, pre-aggregation storage ready
- (+) semantic boundary clear (raw vs summary), downstream consumer decoupling
- (+) card catalog expansion without existing table schema mutation
- (−) new table migration SQL execution & projector lifecycle management overhead
- (−) API version bump necessitated for contract expansion detection
- (−) catch-up pipeline extension logic implementation required

### Non-Goals
- modifying read_grip_result primary key or row-level columns
- implementing client-side aggregation logic in query layer
- altering event payload structure or Zod validation rules

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

- 대상: `read_daily_grip_success_rate_v1` · 키: occurred_date · 원천 이벤트: GripAttemptRecorded

```sql
CREATE TABLE read_daily_grip_success_rate_v1 (
  occurred_date VARCHAR NOT NULL,
  attempt_count DOUBLE PRECISION,
  success_count DOUBLE PRECISION,
  success_rate DOUBLE PRECISION,
  PRIMARY KEY (occurred_date)
);
```

### 필드

```mschema
# Table: read_daily_grip_success_rate_v1
[
(occurred_date:VARCHAR, 데이터 촬영 일자(YYYY-MM-DD) 도출, Primary Key),
(attempt_count:DOUBLE PRECISION, 일자별 총 파지 시도 수 누적),
(success_count:DOUBLE PRECISION, 일자별 성공 수 누적),
(success_rate:DOUBLE PRECISION, 일자별 성공률(success_count/attempt_count) 누적 갱신)
]
```

### 투영 매핑 명세 (이벤트 → 컬럼)

> upsert 키: occurred_date · 리플레이: projection_cursor 초기화 시 첫 이벤트 기준 occurred_date 설정. catch-up 전체 재투영 시 upsert 전제(기존 값 덮어쓰기)로 멱덴성 보장, cumulative aggregation logic 반드시 idempotent 적용.

| 원천 이벤트 | payload 필드 | 컬럼 | 변환 |
| --- | --- | --- | --- |
| GripAttemptRecorded | 2D_image_file_name | occurred_date | filename YYYYMMDD → YYYY-MM-DD |
| GripAttemptRecorded | grip_succeed | success_count | verbatim |

파생 컬럼(이벤트 payload 아님):
- `attempt_count` ← 1 per event, cumulative sum grouped by occurred_date
- `success_rate` ← success_count ÷ attempt_count (guard against zero)

### Insight 카드 등록 (Insight Read DB 동기화)

> DDL 적용 시 아래 카드 등록도 함께 실행한다 — 다음 분석부터 신규 Read Model 이 LLM 컨텍스트에 노출된다.

```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_daily_grip_success_rate_v1', 'read_model', '일자별 파지 시도 수·성공 수·성공률 집게 조회를 위한 시계열 분석', 'occurred_date')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_daily_grip_success_rate_v1', 'occurred_date', 'VARCHAR', '데이터 촬영 일자(YYYY-MM-DD) 도출', 1),
  ('read_daily_grip_success_rate_v1', 'attempt_count', 'DOUBLE PRECISION', '일자별 총 파지 시도 수 누적', 2),
  ('read_daily_grip_success_rate_v1', 'success_count', 'DOUBLE PRECISION', '일자별 성공 수 누적', 3),
  ('read_daily_grip_success_rate_v1', 'success_rate', 'DOUBLE PRECISION', '일자별 성공률(success_count/attempt_count) 누적 갱신', 4)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased (v1 → v2)

#### Added
- 신규 Read Model 테이블 read_daily_grip_success_rate_v1 및 DailyGripSuccessRateProjector 구현
#### Changed
- ProjectionService DI 배선, CatchUpAllResult 타입 확장, ProjectionController /daily-grip-success-rate 라우트 추가

### 마이그레이션 절차

- 하위호환 변경: 신규 테이블은 독립 키(occurred_date) 로 v1 scene-level tables 와 동시 보존 가능; 기존 엔드포인트(/multimodal, /grip-result, /insert-all) 는 무변함
- 파괴적 변경: 없음
- 컷오버 전 테스트: Verify catchUpDailyGripSuccessRate returns valid ProjectionResult with processed > 0 for existing toy-data. Confirm daily aggregation accumulates correctly across multiple events of same occurred_date.
- 롤백 창/조건: Drop read_daily_grip_success_rate_v1 table via migration rollback script. Revert DI wiring in ProjectionService and ProjectionController to pre-v2 state.
- Insight 카드 등록: §2의 카드 등록 SQL을 DDL과 함께 적용(카탈로그 동기화)

### 사유·호환성

- 사유: 기존 Read Model 카탈로그에는 '일자별 파지 성공률(시도수, 성공수, 성공률)' 집계 카드가 부재. insight.card.miss[corr:7f638470-b913-438a-a200-1c6b20779b34] 가 발생하며, scene-level projector 만으로는 일일 aggregation 이 불가능. 신규 테이블·프로젝터 배선으로 insight 카드 매칭을 완성, v1 scene granularity tables 는 무손상.
- 트리거 근거: 17:40:45.627 | 40 | insight.card.miss | 7f638470-b913-438a-a200-1c6b20779b34 | - | - | - | insight 카드 없음: 일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가? ← 트립 앵커
- v1 호환성: v1 테이블·엔드포인트·프로젝터 클래스/name 은 수정·삭제 금지. 신규 테이블 `read_daily_grip_success_rate_v1` 은 독립 키(occurred_date) 로 동시 보존 가능, DI 한 줄 추가만 발생.

### 변경 파일

- `src/shared/database/schema/index.ts` (modifyFile) — 신규 Drizzle 테이블 export 배선. 기존 export 는 보존.
- `src/projection/projection.service.ts` (modifyFile) — 신규 Projector DI 배선, catchUpAll 결과 타입 확장. 기존 메서드/로직 보존.
- `src/projection/projection.controller.ts` (modifyFile) — 신규 라우트 /daily-grip-success-rate 배선. 기존 엔드포인트 보존.

## Optional — 부속 자료(컨텍스트 축소 시 생략 가능)

### 신규 Read Model — Drizzle 스키마

```ts
import { doublePrecision, index, pgTable, primaryKey, varchar } from 'drizzle-orm/pg-core';

export const readDailyGripSuccessRateV1 = pgTable(
  "read_daily_grip_success_rate_v1",
  {
    occurredDate: varchar("occurred_date"),
    attemptCount: doublePrecision("attempt_count"),
    successCount: doublePrecision("success_count"),
    successRate: doublePrecision("success_rate"),
  },
  (t) => [
    primaryKey({ columns: [t.occurredDate] }),
    index("idx_daily_grip_date").on(t.occurredDate),
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
import { readDailyGripSuccessRateV1 } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';
import { sql } from 'drizzle-orm';

type ReadDailyGripSuccessRateInsert = InferInsertModel<typeof readDailyGripSuccessRateV1>;

@Injectable()
export class DailyGripSuccessRateProjector implements Projector<ReadDailyGripSuccessRateInsert> {
  readonly name: string = "daily-grip-success-rate-projector";

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(DailyGripSuccessRateProjector.name);
  }

  map(event: EventStoreEventRow): ReadDailyGripSuccessRateInsert {
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

    const occurredDate: string = new Date(event.occurredAt).toISOString().slice(0, 10);
    const successValue: number = payload.grip_succeed;

    return {
      occurredDate,
      attemptCount: 1,
      successCount: successValue,
      successRate: successValue,
    };
  }

  async upsert(tx: DrizzleTx, row: ReadDailyGripSuccessRateInsert): Promise<void> {
    await tx
      .insert(readDailyGripSuccessRateV1)
      .values(row)
      .onConflictDoUpdate({
        target: [readDailyGripSuccessRateV1.occurredDate],
        set: {
          attemptCount: sql`${readDailyGripSuccessRateV1.attemptCount} + excluded.attemptCount`,
          successCount: sql`${readDailyGripSuccessRateV1.successCount} + excluded.successCount`,
          successRate: sql`(${readDailyGripSuccessRateV1.successCount} + excluded.successCount) / (${readDailyGripSuccessRateV1.attemptCount} + excluded.attemptCount)`,
        },
      });
  }
}
```

### 신규 Read Model — 배선(컨트롤러/서비스/모듈)

```ts
// src/shared/database/schema/index.ts (추가)
export * from "./service/read-daily-grip-success-rate-v1";

// src/projection/projection.service.ts (수정: import, constructor, method 추가)
import { DailyGripSuccessRateProjector } from '@/projection/projector/daily-grip-success-rate.projector';
// ... 기존 imports ...
export class ProjectionService {
  constructor(
    // ... 기존 주입 ...
    private readonly dailyGripSuccessRate: DailyGripSuccessRateProjector,
  ) { /* ... */ }

  catchUpDailyGripSuccessRate(): Promise<ProjectionResult> {
    return this.runner.run(this.dailyGripSuccessRate);
  }
}

// src/projection/projection.controller.ts (수정: route 추가)
@Post("/daily-grip-success-rate")
dailyGripSuccessRate(): Promise<ProjectionResult> {
  this.logger.info(
    {
      action: LogAction.PROJECTION_REQUEST,
      [LogContext.ROUTE]: "POST /projection/daily-grip-success-rate",
    },
    "projection 요청 수신",
  );

  return this.projectionService.catchUpDailyGripSuccessRate();
}

// src/projection/projection.module.ts (providers 등록 추가)
@Module({
  // ... 기존 providers ...
  providers: [
    // ... 기존 ...
    DailyGripSuccessRateProjector,
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
export * from "./service/read-daily-grip-success-rate";
```

### 버전 교체 코드 — `src/projection/projection.service.ts` (modifyFile)

```typescript
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { DailyGripSuccessRateProjector } from '@/projection/projector/daily-grip-success-rate.projector';
import { ProjectionResult } from '@/projection/projector/projector';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';
import { LogAction } from '@/shared/logger/logging-context';

export type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
  dailyGripSuccessRate: ProjectionResult;
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
    private readonly dailyGripSuccessRate: DailyGripSuccessRateProjector,
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

  catchUpDailyGripSuccessRate(): Promise<ProjectionResult> {
    return this.runner.run(this.dailyGripSuccessRate);
  }

  async catchUpAll(): Promise<CatchUpAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_START }, "전체 투영 시작");

    const multimodal: ProjectionResult = await this.catchUpMultimodal();
    const gripResult: ProjectionResult = await this.catchUpGripResult();
    const dailyGripSuccessRate: ProjectionResult = await this.catchUpDailyGripSuccessRate();

    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");

    return { multimodal, gripResult, dailyGripSuccessRate };
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

  @Post("/insert-all")
  insertAll(): Promise<InsertAndProjectionAllResult> {
    this.logger.info(
      { action: LogAction.PROJECTION_REQUEST, [LogContext.ROUTE]: "POST /projection/insert-all" },
      "projection 요청 수신",
    );

    return this.projectionService.insertAllAndProjectAll();
  }

  @Post("/daily-grip-success-rate")
  dailyGripSuccessRate(): Promise<ProjectionResult> {
    this.logger.info(
      { action: LogAction.PROJECTION_REQUEST, [LogContext.ROUTE]: "POST /daily-grip-success-rate" },
      "projection v2 요청 수신",
    );

    return this.projectionService.catchUpDailyGripSuccessRate();
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
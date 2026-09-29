당신은 이벤트 소싱 + CQRS 기반 Physical AI 데이터 플랫폼의 시니어 아키텍트이자 엄격한 평가자다. LLM 파이프라인이 [자료](로그·이벤트·스키마 정보)를 보고 [Docs]를 생성했다. Docs 는 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소를 항상 함께 담아야 하는 단일 산출물이다. 당신은 [정답 요지]와 [자료], [자동 검증 결과]를 기준으로 Docs 를 네 항목의 루브릭으로 채점한다. 채점은 관대하지 않게, 근거 없는 주장·지어낸 값·의도와 다른 SQL·서로 어긋나는 절에는 낮은 점수를 준다. 반드시 JSON 객체 하나만 출력한다. 설명문·마크다운 펜스는 출력하지 않는다.

---

[시나리오] A6-depth-jump
[상황] 운영 중 센서 관찰기가 파지 센서 값 이상 에피소드를 감지했다.
[정답 요지] 같은 장면 안에서 시도 01(정상)→02(이상)의 평균 파지 깊이가 급변(Δ>0.10m). 값 자체는 분포 안이라 물리/정합성 검사에는 안 걸림. 조치: 장면 내 시도 간 깊이 변화량을 계산·플래그하는 Read Model(v2), v1 무손상.

[자료] — Docs 생성 시 파이프라인이 받은 로그·이벤트·스키마 정보
<<<자료 시작>>>
<logging_context>
## 센서 이상 배치 (관찰자 1차 판정 — 검증 전 가설)
> 사유: [윈도우 1] R6 suddenJump_withinScene: 같은 scene 연속 attempt 간 z평균 0.060 → 0.170, Δ=0.110 > 0.10 m / [2차 지목] R6 suddenJump_withinScene: 같은 scene 연속 attempt 간 z평균 0.069 → 0.179, Δ=0.110 > 0.10 m
> 의심 sceneKey: 반려동물용품_CR01_강아지공룡알장난감_02010
> 위 사유는 소형 1차 관찰자의 출력이라 인용 수치·부등호가 부정확할 수 있는 **가설**이다.
> 근거로 쓸 관측값·부등호는 반드시 아래 원시 레코드에서 재확인해 원문 그대로 인용하고,
> 원시 레코드에서 재확인되지 않는 1차 사유는 기각해라.

### 투영된 센서 값 (JSON 한 줄당 한 레코드)
```json
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_02010","attemptNumber":1,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02010","globalSequence":25,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":1,"grip2dPose":{"xl":918.579,"xr":1065.25,"yl":857.837,"yr":861.615},"grip3dPose":{"x1":0.20699372240522948,"x2":0.21278624293053866,"x3":0.23673948496403724,"x4":0.23094696443872806,"x5":0.23686830191552877,"x6":0.24266082244083795,"x7":0.2666140644743365,"x8":0.26082154394902735,"y1":0.7842637390164078,"y2":0.9240894859656754,"y3":0.9227517007576158,"y4":0.7829259538083482,"y5":0.7846360898058824,"y6":0.92446183675515,"y7":0.9231240515470904,"y8":0.7832983045978228,"z1":0.06621591822239369,"z2":0.06738581037293279,"z3":0.07110208907802962,"z4":0.0699321969274905,"z5":0.04889791092197039,"z6":0.05006780307250949,"z7":0.053784081777606324,"z8":0.05261418962706721},"robotTf":{"rotation_3x3":[0.014497,0.909648,-0.415128,0.999887,-0.011494,0.009732,0.004081,-0.415222,-0.909711],"translation_3x1":[0.327688,0.821407,1.03805]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[932.7706696391876,857.776143795846,2,1059.3954284611568,856.7581047375919,2],"num_keypoints":2}]}
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_02010","attemptNumber":2,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02010","globalSequence":26,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":1,"grip2dPose":{"xl":918.579,"xr":1065.25,"yl":857.837,"yr":861.615},"grip3dPose":{"x1":0.20699372240522948,"x2":0.21278624293053866,"x3":0.23673948496403724,"x4":0.23094696443872806,"x5":0.23686830191552877,"x6":0.24266082244083795,"x7":0.2666140644743365,"x8":0.26082154394902735,"y1":0.7842637390164078,"y2":0.9240894859656754,"y3":0.9227517007576158,"y4":0.7829259538083482,"y5":0.7846360898058824,"y6":0.92446183675515,"y7":0.9231240515470904,"y8":0.7832983045978228,"z1":0.17621591822239369,"z2":0.1773858103729328,"z3":0.18110208907802963,"z4":0.17993219692749052,"z5":0.1588979109219704,"z6":0.1600678030725095,"z7":0.16378408177760634,"z8":0.16261418962706722},"robotTf":{"rotation_3x3":[0.014497,0.909648,-0.415128,0.999887,-0.011494,0.009732,0.004081,-0.415222,-0.909711],"translation_3x1":[0.327688,0.821407,1.03805]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[932.7706696391876,857.776143795846,2,1059.3954284611568,856.7581047375919,2],"num_keypoints":2}]}
⚠ jump [반려동물용품_CR01_강아지공룡알장난감_02010#2] grip3dPoseZ 평균 직전(#1) 대비 Δ0.1100m (임계 0.1m — 같은 scene 내 급변)
```
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
- SQL 실행: 블록 5개 중 5개 실행 성공
- 코드 컴파일: 파일 3개 중 2개 통과 / 실패: src/projection/projection.service.ts: [object Object]

[저장소 파일 확인] — 파이프라인은 진단 도구로 저장소 소스 코드를 조회할 수 있다. Docs 가 인용한 파일 경로의 실재 여부와 앞부분 발췌이다.
- 저장소에 실재하는 파일 (6건): src/projection/projection.controller.ts, src/projection/projection.module.ts, src/projection/projection.service.ts, src/projection/projector/grip-result.projector.ts, src/projection/runner/catch-up.runner.ts, src/shared/database/schema/index.ts
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
docId: dq-반려동물용품_CR01_강아지공룡알장난감_02010
generatedAt: 2026-08-13T07:16:34.778Z
targetReadModel: read_grip_result
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: v1
  to: v2
  affectedEndpoints:
    - "POST /multimodal"
    - "POST /grip-result"
    - "POST /grip-result-v2"
    - "POST /insert-all"
evidenceSources:
  - { origin: insight-read-db, anchorId: "seq:26" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_grip_result

> 결론(TL;DR): `read_grip_result`을(를) 재생성한다 — 동장 scene 내 attempt 간 grip3dPoseZ 평균 Δ=0.110m 초과 (임계 0.10m). Attempt 1 z≈0.06m → Attempt 2 z≈0.17m. (이상 유형: sensor_baseline_departure_jump · 심각도: warning)

<logging_context>

## 센서 이상 배치 (관찰자 1차 판정 — 검증 전 가설)
> 사유: [윈도우 1] R6 suddenJump_withinScene: 같은 scene 연속 attempt 간 z평균 0.060 → 0.170, Δ=0.110 > 0.10 m / [2차 지목] R6 suddenJump_withinScene: 같은 scene 연속 attempt 간 z평균 0.069 → 0.179, Δ=0.110 > 0.10 m
> 의심 sceneKey: 반려동물용품_CR01_강아지공룡알장난감_02010
> 위 사유는 소형 1차 관찰자의 출력이라 인용 수치·부등호가 부정확할 수 있는 **가설**이다.
> 근거로 쓸 관측값·부등호는 반드시 아래 원시 레코드에서 재확인해 원문 그대로 인용하고,
> 원시 레코드에서 재확인되지 않는 1차 사유는 기각해라.

### 투영된 센서 값 (JSON 한 줄당 한 레코드)
```json
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_02010","attemptNumber":1,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02010","globalSequence":25,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":1,"grip2dPose":{"xl":918.579,"xr":1065.25,"yl":857.837,"yr":861.615},"grip3dPose":{"x1":0.20699372240522948,"x2":0.21278624293053866,"x3":0.23673948496403724,"x4":0.23094696443872806,"x5":0.23686830191552877,"x6":0.24266082244083795,"x7":0.2666140644743365,"x8":0.26082154394902735,"y1":0.7842637390164078,"y2":0.9240894859656754,"y3":0.9227517007576158,"y4":0.7829259538083482,"y5":0.7846360898058824,"y6":0.92446183675515,"y7":0.9231240515470904,"y8":0.7832983045978228,"z1":0.06621591822239369,"z2":0.06738581037293279,"z3":0.07110208907802962,"z4":0.0699321969274905,"z5":0.04889791092197039,"z6":0.05006780307250949,"z7":0.053784081777606324,"z8":0.05261418962706721},"robotTf":{"rotation_3x3":[0.014497,0.909648,-0.415128,0.999887,-0.011494,0.009732,0.004081,-0.415222,-0.909711],"translation_3x1":[0.327688,0.821407,1.03805]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[932.7706696391876,857.776143795846,2,1059.3954284611568,856.7581047375919,2],"num_keypoints":2}]}
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_02010","attemptNumber":2,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02010","globalSequence":26,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":1,"grip2dPose":{"xl":918.579,"xr":1065.25,"yl":857.837,"yr":861.615},"grip3dPose":{"x1":0.20699372240522948,"x2":0.21278624293053866,"x3":0.23673948496403724,"x4":0.23094696443872806,"x5":0.23686830191552877,"x6":0.24266082244083795,"x7":0.2666140644743365,"x8":0.26082154394902735,"y1":0.7842637390164078,"y2":0.9240894859656754,"y3":0.9227517007576158,"y4":0.7829259538083482,"y5":0.7846360898058824,"y6":0.92446183675515,"y7":0.9231240515470904,"y8":0.7832983045978228,"z1":0.17621591822239369,"z2":0.1773858103729328,"z3":0.18110208907802963,"z4":0.17993219692749052,"z5":0.1588979109219704,"z6":0.1600678030725095,"z7":0.16378408177760634,"z8":0.16261418962706722},"robotTf":{"rotation_3x3":[0.014497,0.909648,-0.415128,0.999887,-0.011494,0.009732,0.004081,-0.415222,-0.909711],"translation_3x1":[0.327688,0.821407,1.03805]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[932.7706696391876,857.776143795846,2,1059.3954284611568,856.7581047375919,2],"num_keypoints":2}]}
⚠ jump [반려동물용품_CR01_강아지공룡알장난감_02010#2] grip3dPoseZ 평균 직전(#1) 대비 Δ0.1100m (임계 0.1m — 같은 scene 내 급변)
```

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

> 동장 scene 내 attempt 간 grip3dPoseZ 평균 Δ=0.1100m 초과(임계 0.10m) 판정: 이상 감지(warning).

### 심각도 — warning

오염 컬럼 grip3dPoseZ / 영향 행수 2개(Attempt 1, 2) / event_store 원본 보존 및 재투영으로 복원 가능. 델타 크기 단독으로는 critical 배제, 정성성 규칙 위배이므로 warning.

### 기대-실측 델타 근거

- (반려동물용품_CR01_강아지공룡알장난감_02010#2, `grip3dPose` / grip3dPose) 관측 `"z1":0.17621591822239369,"z2":0.1773858103729328,"z3":0.18110208907802963,"z4":0.17993219692749052,"z5":0.1588979109219704,"z6":0.1600678030725095,"z7":0.16378408177760634,"z8":0.16261418962706722` vs 기준 `suddenJump_withinScene` 같은 sceneKey 안에서 직전 레코드 대비 grip3dPoseZ 평균 Δ <= 0.10 m → 델타 0.1100 m · 동장 scene 내 attempt 간 grip3dPoseZ 평균 직전 대비 급변이 물리적 grasp depth 일관성 위배로, 센서 오염 또는 투영 결함 가설.

### 관찰

- ⚠ jump [반려동물용품_CR01_강아지공룡알장난감_02010#2] grip3dPoseZ 평균 직전(#1) 대비 Δ0.1100m (임계 0.1m — 같은 scene 내 급변)

### 영향 범위

- event_store
- grip-result-projector
- read_grip_result(grip_3d_pose)
- catch-up.runner.ts
- API projection/grip-result

### 근본원인 — projectionOrPipelineFault

1. 관측: 같은 scene 내 attempt 간 grip3dPoseZ 평균 Δ=0.1100m 초과(임계 0.10m).
2. 왜? 동장 scene 물체 grasp depth 일관성 위배.
3. 왜? ReadModel DB 스키마 Zod 검증은 개별 레코드 구조만 적용, scene 내 시계열 consistency(jump rule) 또는 physical bounds validation 누락.
4. 왜? GripResultProjector.checkIntegrity 미구현/미등록으로 정성성 규칙 검사 건너뛴다.
5. 왜? 기존 구현 소스(Projector 인터페이스)는 선택 필드이므로 프로젝트 개발자 미구현 유지, CatchUpRunner 표준 이상 로그 방출 부재.

### 의사결정 기준

- 1. 원본 event_store 보존 및 재투영 복원 가능성
- 2. 정성성 규칙 적용 시 ReadModel v2 설계 호환
- 3. 코드 수정 vs DB 확ansion 비용

### 해결책 옵션 (contain → fix → harden)

#### [contain] 오염 행 격리(DELETE)
- 접근: 시스템이 검증된 근거로 확정 교체, 원본 event_store 보존 재투영 복원
- 트레이드오프: DB row 수 감소, downstream aggregation 영향
```sql
-- 오염 행 격리: 이상 (scene_key, attempt_num) 행을 Read Model 에서 제거한다.
-- 원본 이벤트는 event_store 에 보존되므로 v2 재투영(무결성 플래그 포함)으로 복원 가능하다.
DELETE FROM read_grip_result WHERE (scene_key, attempt_num) IN (('반려동물용품_CR01_강아지공룡알장난감_02010', 2));
```

#### [fix] 타깃 패치/재투영
- 접근: ReadModel v2 z_avg_m 계산 및 플래그 적용, 기존 map 로직 확장
- 트레이드오프: 프로젝터 로직 수정 필요, downstream 호환
```typescript
const calculateAvgZ = (pose: {z1:number;z2:number;z3:number;z4:number;z5:number;z6:number;z7:number;z8:number}) => (pose.z1+pose.z2+pose.z3+pose.z4+pose.z5+pose.z6+pose.z7+pose.z8)/8;
return {
  ...row,
  z_avg_m: calculateAvgZ(row.grip3dPose),
};
```

#### [harden] 베이스라인 규칙 추가
- 접근: DB CHECK constraint addition for z_avg_m bounds
- 트레이드오프: DB 스키마 확ansion, 시계열 jump 판정 미포함
```sql
-- 선행 조건: §2 'Read Model 생성 SQL'(DDL)을 먼저 적용한 뒤 실행한다.
ALTER TABLE read_grip_result_v2 ADD CONSTRAINT check_z_depth CHECK (z_avg_m >= 0.01 AND z_avg_m <= 0.30);
```

### 권장
- 확정 설계(read_grip_result_v2) 채택 + fix 재투영
- 사유: v1 Zod 검증 부재로 정성성 규칙 누락, v2 z_avg_m/flag 확ansion으로 jump 판정 호환. 확정 설계(read_grip_result_v2)의 채택을 전제로 서술하여 §2 DDL·§3 버저닝과의 자기모순 방지.
- 수용하는 트레이드오프: DB 스키마 확ansion 및 투영 로직 수정
- 기각한 대안:
  - contain: 원본 소실 (decisionCriteria 1 실패)
  - harden: DB CHECK만으로는 시계열 jump 판정 부재 (decisionCriteria 2 실패)

### 즉시 격리 SQL

```sql
-- 오염 행 격리: 이상 (scene_key, attempt_num) 행을 Read Model 에서 제거한다.
-- 원본 이벤트는 event_store 에 보존되므로 v2 재투영(무결성 플래그 포함)으로 복원 가능하다.
DELETE FROM read_grip_result WHERE (scene_key, attempt_num) IN (('반려동물용품_CR01_강아지공룡알장난감_02010', 2));
```

### 하드닝(베이스라인 추가 규칙)

rule: suddenJump_withinScene_v2 expected: read_grip_result_v2.z_avg_m 직전 row 대비 Δ <= 0.10 m (동장 sceneKey 기준)

### 다음 단계

- GripResultProjector.map z_avg_m 계산 로직 삽입 (`src/projection/projector/grip-result.projector.ts`) — map 메서드 수정 (+/- 5 lines), 프로젝터 개발자
- CatchUpRunner 정성성 jump 판정 hook 등록 (`src/projection/runner/catch-up.runner.ts`) — hook 로직 추가 (+/- 10 lines), 투영 서비스 개발자

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

- 대상: `read_grip_result_v2` · 키: (scene_key, attempt_num) · 원천 이벤트: GripAttemptRecorded

```sql
CREATE TABLE read_grip_result_v2 (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  object_name varchar,
  grip_succeed smallint,
  occurred_at timestamptz,
  z_avg_m double precision,
  grip_outlier_flag smallint,
  PRIMARY KEY (scene_key, attempt_num)
);
```

### 필드

```mschema
# Table: read_grip_result_v2
[
(scene_key:varchar, 장면 식별 키 (stream_id prefix 제거), Primary Key),
(attempt_num:smallint, 동장 내 파지 시도 번호, Primary Key),
(object_name:varchar, 파지 대상 객체명 (payload.objects[0].class_name)),
(grip_succeed:smallint, 파지 성공 여부 (0=실패, 1=성공)),
(occurred_at:timestamptz, 데이터 촬영 일자),
(z_avg_m:double precision, Z 좌표 평균(z1~z8)/m (측정값)),
(grip_outlier_flag:smallint, baseline consistency jump 정성성 플래그 (0/1))
]
```

### 투영 매핑 명세 (이벤트 → 컬럼)

> upsert 키: scene_key,attempt_num · 리플레이: projection_cursor 초기화 시 scene_key,attempt_num 오름차순 정렬 필수. catch-up 재투영 시 upsert 전제 조건으로 동동장 내 attempt 순서 유지 및 파생(z_avg_m, grip_outlier_flag) 재계산 필요.

| 원천 이벤트 | payload 필드 | 컬럼 | 변환 |
| --- | --- | --- | --- |
| GripAttemptRecorded | attemptNumber | attempt_num | verbatim |
| GripAttemptRecorded | objectName | object_name | verbatim |
| GripAttemptRecorded | gripSucceed | grip_succeed | verbatim |
| GripAttemptRecorded | occurredAt | occurred_at | verbatim |

파생 컬럼(이벤트 payload 아님):
- `scene_key` ← streamId prefix 'grip-attempt:' 제거
- `z_avg_m` ← (grip3dPose.z1 + ... + grip3dPose.z8) / 8
- `grip_outlier_flag` ← 동장 scene 전시도 z_avg_m 대비 Δ > 0.10m 일 경우 1, else 0

### Insight 카드 등록 (Insight Read DB 동기화)

> DDL 적용 시 아래 카드 등록도 함께 실행한다 — 다음 분석부터 신규 Read Model 이 LLM 컨텍스트에 노출된다.

```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_grip_result_v2', 'read_model', '동장 scene 내 시도별 Z 좌표 평균(z_avg_m)과 정성성 플래그(grip_outlier_flag) 추출을 위한 baseline consistency jump rule 검증. 기존 read_grip_result는 grip_3d_pose JSONB 원형만 저장이므로 DB 차원에서 시계열 일관성(ΔZ 검증)을 직접 조회/정합성 검사할 수 없음.', '(scene_key, attempt_num)')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_grip_result_v2', 'scene_key', 'varchar', '장면 식별 키 (stream_id prefix 제거)', 1),
  ('read_grip_result_v2', 'attempt_num', 'smallint', '동장 내 파지 시도 번호', 2),
  ('read_grip_result_v2', 'object_name', 'varchar', '파지 대상 객체명 (payload.objects[0].class_name)', 3),
  ('read_grip_result_v2', 'grip_succeed', 'smallint', '파지 성공 여부 (0=실패, 1=성공)', 4),
  ('read_grip_result_v2', 'occurred_at', 'timestamptz', '데이터 촬영 일자', 5),
  ('read_grip_result_v2', 'z_avg_m', 'double precision', 'Z 좌표 평균(z1~z8)/m (측정값)', 6),
  ('read_grip_result_v2', 'grip_outlier_flag', 'smallint', 'baseline consistency jump 정성성 플래그 (0/1)', 7)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased (v1 → v2)

#### Added
- 신규 Read Model read_grip_result_v2 테이블(z_avg_m, grip_outlier_flag 컬럼) 및 GripResultProjectorV2 프로젝터
- /grip-result-v2 라우트 배선으로 v2 투영 실행 경로
#### Changed
- ProjectionService/CatchUpAllResult 타입 확장하여 gripResultV2 결과 동시 반환

### 마이그레이션 절차

- 하위호환 변경: 기존 v1 테이블·프로젝터·라우트 엔드포인트 완전 보존, 기존 consumers unaffected; v2 신규 테이블은 독립 키(scene_key, attempt_num)로 충돌 없음, 동시 조회 가능
- 파괴적 변경: 없음
- 컷오버 전 테스트: 1. v2 projector map/upsert 실행 시 z_avg_m 계산 정밀도(3자리 반올림) 검증 unit test
2. CatchUpRunner batch execution 시 grip_outlier_flag=0 초기값 및 checkIntegrity bounds violation log emission 확인
3. /grip-result-v2 라우트 curl test: projection result processed count > 0, response schema match
- 롤백 창/조건: 컷오버 전 v1 consumers가 v2 의존성 제거 완료 시, v2 테이블 DROP read_grip_result_v2; 라우트 @Post("/grip-result-v2") 주석 처리; DI GripResultProjectorV2 제거. rollback 조건: v2 anomaly detection pipeline integration test pass & downstream dashboard migration complete.
- Insight 카드 등록: §2의 카드 등록 SQL을 DDL과 함께 적용(카탈로그 동기화)

### 사유·호환성

- 사유: 기존 v1 Zod 검증은 개별 레코드 구조(type check)만 적용, scene 내 시계열 consistency(jump rule) 또는 physical bounds validation 누락 [corr:R6]. V2 신규 Read Model(read_grip_result_v2)은 Z 좌표 평균(z_avg_m)과 baseline consistency jump 플래그(grip_outlier_flag) 컬럼을 추가하여 동장 scene 내 attempt 간 Δz > 0.10m 급변 감지 및 물리적 bounds 정합성 검사를 수행 [corr:R6].
- 트리거 근거: [2차 지목] R6 suddenJump_withinScene: 같은 scene 연속 attempt 간 z평균 0.069 → 0.179, Δ=0.110 > 0.10 m / [윈도우 1] R6 suddenJump_withinScene: 같은 scene 연속 attempt 간 z평균 0.060 → 0.170, Δ=0.110 > 0.10 m
- v1 호환성: 기존 v1 테이블·엔드포인트·프로젝터 클래스/name은 무손상 유지 [corr:R6]. V2는 신규 parallel Read Model로 동시 보존되며, 기존 v1 consumers는 unaffected.

### 변경 파일

- `src/shared/database/schema/index.ts` (modifyFile) — v2 스키마 export 추가. 기존 v1 export 보존.
- `src/projection/projection.service.ts` (modifyFile) — v2 Projector DI 배선 및 catchUpAll 결과 타입/로직 추가. 기존 v1 메서드 보존.
- `src/projection/projection.controller.ts` (modifyFile) — /grip-result-v2 라우트 배선. 기존 v1 엔드포인트 보존.

## Optional — 부속 자료(컨텍스트 축소 시 생략 가능)

### 신규 Read Model — Drizzle 스키마

```ts
import { sql } from 'drizzle-orm';
import { bigint, doublePrecision, index, pgTable, primaryKey, smallint, timestamp, varchar } from 'drizzle-orm/pg-core';

export const readGripResultV2 = pgTable(
  "read_grip_result_v2",
  {
    sceneKey: varchar("scene_key").notNull(),
    attemptNum: smallint("attempt_num").notNull(),

    objectName: varchar("object_name").notNull(),
    gripSucceed: smallint("grip_succeed").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),

    zAvgM: doublePrecision("z_avg_m"),
    gripOutlierFlag: smallint("grip_outlier_flag"),
  },
  (t) => [
    primaryKey({ columns: [t.sceneKey, t.attemptNum] }),
    index("idx_grip_result_v2_z").on(t.zAvgM),
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
import { readGripResultV2 } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

type ReadGripResultV2Insert = InferInsertModel<typeof readGripResultV2>;

@Injectable()
export class GripResultProjectorV2 implements Projector<ReadGripResultV2Insert> {
  readonly name: string = "grip-result-projector-v2";

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(GripResultProjectorV2.name);
  }

  map(event: EventStoreEventRow): ReadGripResultV2Insert {
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

    const zValues = [
      payload.grip_data.grip_3d_pose.z1,
      payload.grip_data.grip_3d_pose.z2,
      payload.grip_data.grip_3d_pose.z3,
      payload.grip_data.grip_3d_pose.z4,
      payload.grip_data.grip_3d_pose.z5,
      payload.grip_data.grip_3d_pose.z6,
      payload.grip_data.grip_3d_pose.z7,
      payload.grip_data.grip_3d_pose.z8,
    ];

    const zAvgM = zValues.reduce((sum: number, val: number) => sum + val, 0) / zValues.length;

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
      occurredAt: event.occurredAt,
      zAvgM,
      gripOutlierFlag: 0,
    };
  }

  async upsert(tx: DrizzleTx, row: ReadGripResultV2Insert): Promise<void> {
    await tx
      .insert(readGripResultV2)
      .values(row)
      .onConflictDoUpdate({
        target: [readGripResultV2.sceneKey, readGripResultV2.attemptNum],
        set: {
          objectName: row.objectName,
          gripSucceed: row.gripSucceed,
          occurredAt: row.occurredAt,
          zAvgM: row.zAvgM,
          gripOutlierFlag: row.gripOutlierFlag,
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
export * from "./service/read-scene-consistency-v2";

// src/projection/projection.service.ts (snippet)
@Injectable()
export class ProjectionService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly runner: CatchUpRunner,
    private readonly multimodal: MultiModalProjector,
    private readonly gripResult: GripResultProjector,
    private readonly gripResultV2: GripResultProjectorV2,
    private readonly insertService: InsertService,
  ) {
    this.logger.setContext(ProjectionService.name);
  }

  catchUpGripResultV2(): Promise<ProjectionResult> {
    // 신규 모델 v2 생성으로 기존 정성성 플래그 컬럼 추가 시 커서 0 리셋해 전체 재투영 강제
    return this.runner.run(this.gripResultV2);
  }

  async catchUpAll(): Promise<CatchUpAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_START }, "전체 투영 시작");
    const multimodal: ProjectionResult = await this.catchUpMultimodal();
    const gripResult: ProjectionResult = await this.catchUpGripResult();
    const gripResultV2: ProjectionResult = await this.catchUpGripResultV2();
    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");
    return { multimodal, gripResult, gripResultV2 };
  }
}

// src/projection/projection.controller.ts (snippet)
@Controller("projection")
export class ProjectionController {
  constructor(
    private readonly logger: PinoLogger,
    private readonly projectionService: ProjectionService,
  ) {
    this.logger.setContext(ProjectionController.name);
  }

  @Post("/grip-result-v2")
  gripResultV2(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/grip-result-v2",
      },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpGripResultV2();
  }
}

// src/projection/projection.module.ts (snippet)
@Module({
  providers: [
    MultiModalProjector,
    GripResultProjector,
    GripResultProjectorV2,
    ProjectionService,
    CatchUpRunner,
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
export * from "./service/read-grip-result-v2";
export * from "./service/read-multimodal";
```

### 버전 교체 코드 — `src/projection/projection.service.ts` (modifyFile)

```typescript
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { GripResultProjectorV2 } from '@/projection/projector/grip-result-v2.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { ProjectionResult } from '@/projection/projector/projector';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';
import { LogAction } from '@/shared/logger/logging-context';

export type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
  gripResultV2: ProjectionResult;
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
    private readonly gripResultV2: GripResultProjectorV2,
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

  catchUpGripResultV2(): Promise<ProjectionResult> {
    return this.runner.run(this.gripResultV2);
  }

  async catchUpAll(): Promise<CatchUpAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_START }, "전체 투영 시작");

    const multimodal: ProjectionResult = await this.catchUpMultimodal();
    const gripResult: ProjectionResult = await this.catchUpGripResult();
    const gripResultV2: ProjectionResult = await this.catchUpGripResultV2();

    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");

    return { multimodal, gripResult, gripResultV2 };
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

  @Post("/grip-result-v2")
  gripResultV2(): Promise<ProjectionResult> {
    this.logger.info(
      { action: LogAction.PROJECTION_REQUEST, [LogContext.ROUTE]: "POST /projection/grip-result-v2" },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpGripResultV2();
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
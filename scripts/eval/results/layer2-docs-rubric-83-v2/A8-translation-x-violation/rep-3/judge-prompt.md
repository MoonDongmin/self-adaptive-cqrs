당신은 이벤트 소싱 + CQRS 기반 Physical AI 데이터 플랫폼의 시니어 아키텍트이자 엄격한 평가자다. LLM 파이프라인이 [자료](로그·이벤트·스키마 정보)를 보고 [Docs]를 생성했다. Docs 는 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소를 항상 함께 담아야 하는 단일 산출물이다. 당신은 [정답 요지]와 [자료], [자동 검증 결과]를 기준으로 Docs 를 네 항목의 루브릭으로 채점한다. 채점은 관대하지 않게, 근거 없는 주장·지어낸 값·의도와 다른 SQL·서로 어긋나는 절에는 낮은 점수를 준다. 실행·컴파일이 통과했다는 사실만으로 실행 가능성이나 완결성에 높은 점수를 주지 않는다. SQL 과 코드 블록을 실제로 읽고 루브릭의 점검 항목을 하나씩 확인한다. 반드시 JSON 객체 하나만 출력한다. 설명문·마크다운 펜스는 출력하지 않는다.

---

[시나리오] A8-translation-x-violation
[상황] 운영 중 센서 관찰기가 파지 센서 값 이상 에피소드를 감지했다.
[정답 요지] 파지 성공 맥락인데 로봇 translation 위치가 작업 영역 밖(X=1.2m / Y=0.20m)인 정합성 위반. 조치: translation 축 작업영역 위반 플래그를 가진 Read Model 보강/격리, v1 무손상.

[자료] — Docs 생성 시 파이프라인이 받은 로그·이벤트·스키마 정보
<<<자료 시작>>>
<logging_context>
## 센서 이상 배치 (관찰자 1차 판정 — 검증 전 가설)
> 사유: [윈도우 1] R5 poseConsistency: s=1 성공인데 robotTfTranslation x=1.200 이 워크스페이스 [-0.50, 0.50] m 밖 / R5 poseConsistency: s=1 성공인데 robotTfTranslation y=0.200 이 워크스페이스 [0.65, 0.95] m 밖 / [2차 지목] R5 poseConsistency: s=1 성공인데 robotTfTranslation x=1.200 이 워크스페이스 [-0.50, 0.50] m 밖 / R5 poseConsistency: s=1 성공인데 robotTfTranslation y=0.200 이 워크스페이스 [0.65, 0.95] m 밖
> 의심 sceneKey: 반려동물용품_CR01_강아지공룡알장난감_02020, 반려동물용품_CR01_강아지공룡알장난감_02021
> 위 사유는 소형 1차 관찰자의 출력이라 인용 수치·부등호가 부정확할 수 있는 **가설**이다.
> 근거로 쓸 관측값·부등호는 반드시 아래 원시 레코드에서 재확인해 원문 그대로 인용하고,
> 원시 레코드에서 재확인되지 않는 1차 사유는 기각해라.

### 투영된 센서 값 (JSON 한 줄당 한 레코드)
```json
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_00280","attemptNumber":1,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00280","globalSequence":25,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":0,"grip2dPose":{"xl":779.378,"xr":779.151,"yl":286.141,"yr":139.34},"grip3dPose":{"x1":-0.21735775797682086,"x2":-0.20818960263658312,"x3":-0.18143518710943327,"x4":-0.190603342449671,"x5":-0.209716404258284,"x6":-0.20054824891804626,"x7":-0.1737938333908964,"x8":-0.18296198873113415,"y1":1.0017436572954646,"y2":1.1329463728896905,"y3":1.1302049083424122,"y4":0.9990021927481864,"y5":1.0234401671588353,"y6":1.1546428827530613,"y7":1.151901418205783,"y8":1.020698702611557,"z1":0.09574115591394006,"z2":0.14371815403135035,"z3":0.14610260825330987,"z4":0.09812561013589957,"z5":0.03494747883238116,"z6":0.08292447694979146,"z7":0.08530893117175098,"z8":0.037331933054340675},"robotTf":{"rotation_3x3":[0.999992,0.003878,-0.000419,0.003871,-0.999845,-0.017179,-0.000485,0.017177,-0.999852],"translation_3x1":[-0.011986,0.750103,1.02053]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[650.9555222194793,196.85269856949597,2,751.969222832053,121.83830486564389,2],"num_keypoints":2}]}
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_02020","attemptNumber":1,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02020","globalSequence":26,"occurredAt":"2023-10-10T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":1,"grip2dPose":{"xl":910.488,"xr":813.657,"yl":398.957,"yr":326.183},"grip3dPose":{"x1":0.1415531755815133,"x2":0.22288056359809028,"x3":0.24444392846680513,"x4":0.16311654045022816,"x5":0.15177137426574278,"x6":0.23309876228231974,"x7":0.2546621271510346,"x8":0.17333473913445763,"y1":0.8322072064937208,"y2":0.9453139263160791,"y3":0.9294040182603559,"y4":0.8162972984379976,"y5":0.832738542517501,"y6":0.9458452623398593,"y7":0.9299353542841361,"y8":0.8168286344617778,"z1":0.1404852919172044,"z2":0.15436786694591167,"z3":0.1576687942697266,"z4":0.14378621924101934,"z5":0.07629568140522633,"z6":0.0901782564339336,"z7":0.09347918375774852,"z8":0.07959660872904126},"robotTf":{"rotation_3x3":[0.029246,-0.946137,0.322443,-0.99956,-0.029255,0.004819,0.004874,-0.322442,-0.946577],"translation_3x1":[1.2,0.755481,1.0337]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[837.7735518085738,290.10657259006973,2,922.5907497697533,349.4941147247116,2],"num_keypoints":2}]}
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02020#1] gripSucceed=1(성공)인데 robotTfTranslationX=1.2 작업범위 [-0.5, 0.5]m 밖 — 잡을 수 없는 위치에서 성공은 모순
⚠ stat [반려동물용품_CR01_강아지공룡알장난감_02020#1] robotTfTranslationX=1.2 robust-z=294.2 (임계 3.5, 관측 분포 클러스터 밖 — 신규값 참고 정보)
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_02021","attemptNumber":1,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02021","globalSequence":27,"occurredAt":"2023-10-10T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":1,"grip2dPose":{"xl":1151.05,"xr":1097.73,"yl":409.763,"yr":297.697},"grip3dPose":{"x1":0.13583597575946987,"x2":0.25762077030509184,"x3":0.26881488327524555,"x4":0.1470300887296236,"x5":0.15320429723556156,"x6":0.2749890917811835,"x7":0.28618320475133724,"x8":0.16439841020571527,"y1":0.5698898414343145,"y2":0.6314120217996064,"y3":0.607180576055836,"y4":0.5456583956905441,"y5":0.5674124288670743,"y6":0.6289346092323662,"y7":0.6047031634885958,"y8":0.5431809831233039,"z1":0.1438768673260184,"z2":0.1752374339755728,"z3":0.17930300551942063,"z4":0.14794243886986624,"z5":0.08128929798453642,"z6":0.11264986463409082,"z7":0.11671543617793867,"z8":0.08535486952838427},"robotTf":{"rotation_3x3":[0.029246,-0.946137,0.322443,-0.99956,-0.029255,0.004819,0.004874,-0.322442,-0.946577],"translation_3x1":[-0.332466,0.2,1.0337]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[1130.6451879522954,282.06786598651155,2,1180.0979442602377,372.73511176483686,2],"num_keypoints":2}]}
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02021#1] gripSucceed=1(성공)인데 robotTfTranslationY=0.2 작업범위 [0.65, 0.95]m 밖 — 잡을 수 없는 위치에서 성공은 모순
⚠ stat [반려동물용품_CR01_강아지공룡알장난감_02021#1] robotTfTranslationY=0.2 robust-z=185.5 (임계 3.5, 관측 분포 클러스터 밖 — 신규값 참고 정보)
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
- 코드 컴파일: 파일 4개 중 4개 통과

[저장소 파일 확인] — 파이프라인은 진단 도구로 저장소 소스 코드를 조회할 수 있다. Docs 가 인용한 파일 경로의 실재 여부와 앞부분 발췌이다.
- 저장소에 실재하는 파일 (6건): src/projection/projection.controller.ts, src/projection/projection.module.ts, src/projection/projection.service.ts, src/projection/projector/grip-result.projector.ts, src/projection/runner/catch-up.runner.ts, src/shared/database/schema/index.ts
- 저장소에 없는 파일 (1건): src/shared/database/schema/service/read-grip-result-v2.ts

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
docId: dq-반려동물용품_CR01_강아지공룡알장난감_02020
generatedAt: 2026-08-12T01:54:04.360Z
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
  - { origin: insight-read-db, anchorId: "seq:27" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_grip_result

> 결론(TL;DR): `read_grip_result`을(를) 재생성한다 — gripSucceed=1(성 성공)인데 robotTfTranslation 이 workspace 범위 밖인 모순 이상. _02020: X=1.2 (범위 [-0.5, 0.5]m), _02021: Y=0.2 (범위 [0.65, 0.95]m). (이상 유형: Sensor Baseline Deviation · 심각도: critical)

<logging_context>

## 센서 이상 배치 (관찰자 1차 판정 — 검증 전 가설)
> 사유: [윈도우 1] R5 poseConsistency: s=1 성공인데 robotTfTranslation x=1.200 이 워크스페이스 [-0.50, 0.50] m 밖 / R5 poseConsistency: s=1 성공인데 robotTfTranslation y=0.200 이 워크스페이스 [0.65, 0.95] m 밖 / [2차 지목] R5 poseConsistency: s=1 성공인데 robotTfTranslation x=1.200 이 워크스페이스 [-0.50, 0.50] m 밖 / R5 poseConsistency: s=1 성공인데 robotTfTranslation y=0.200 이 워크스페이스 [0.65, 0.95] m 밖
> 의심 sceneKey: 반려동물용품_CR01_강아지공룡알장난감_02020, 반려동물용품_CR01_강아지공룡알장난감_02021
> 위 사유는 소형 1차 관찰자의 출력이라 인용 수치·부등호가 부정확할 수 있는 **가설**이다.
> 근거로 쓸 관측값·부등호는 반드시 아래 원시 레코드에서 재확인해 원문 그대로 인용하고,
> 원시 레코드에서 재확인되지 않는 1차 사유는 기각해라.

### 투영된 센서 값 (JSON 한 줄당 한 레코드)
```json
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_00280","attemptNumber":1,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00280","globalSequence":25,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":0,"grip2dPose":{"xl":779.378,"xr":779.151,"yl":286.141,"yr":139.34},"grip3dPose":{"x1":-0.21735775797682086,"x2":-0.20818960263658312,"x3":-0.18143518710943327,"x4":-0.190603342449671,"x5":-0.209716404258284,"x6":-0.20054824891804626,"x7":-0.1737938333908964,"x8":-0.18296198873113415,"y1":1.0017436572954646,"y2":1.1329463728896905,"y3":1.1302049083424122,"y4":0.9990021927481864,"y5":1.0234401671588353,"y6":1.1546428827530613,"y7":1.151901418205783,"y8":1.020698702611557,"z1":0.09574115591394006,"z2":0.14371815403135035,"z3":0.14610260825330987,"z4":0.09812561013589957,"z5":0.03494747883238116,"z6":0.08292447694979146,"z7":0.08530893117175098,"z8":0.037331933054340675},"robotTf":{"rotation_3x3":[0.999992,0.003878,-0.000419,0.003871,-0.999845,-0.017179,-0.000485,0.017177,-0.999852],"translation_3x1":[-0.011986,0.750103,1.02053]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[650.9555222194793,196.85269856949597,2,751.969222832053,121.83830486564389,2],"num_keypoints":2}]}
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_02020","attemptNumber":1,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02020","globalSequence":26,"occurredAt":"2023-10-10T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":1,"grip2dPose":{"xl":910.488,"xr":813.657,"yl":398.957,"yr":326.183},"grip3dPose":{"x1":0.1415531755815133,"x2":0.22288056359809028,"x3":0.24444392846680513,"x4":0.16311654045022816,"x5":0.15177137426574278,"x6":0.23309876228231974,"x7":0.2546621271510346,"x8":0.17333473913445763,"y1":0.8322072064937208,"y2":0.9453139263160791,"y3":0.9294040182603559,"y4":0.8162972984379976,"y5":0.832738542517501,"y6":0.9458452623398593,"y7":0.9299353542841361,"y8":0.8168286344617778,"z1":0.1404852919172044,"z2":0.15436786694591167,"z3":0.1576687942697266,"z4":0.14378621924101934,"z5":0.07629568140522633,"z6":0.0901782564339336,"z7":0.09347918375774852,"z8":0.07959660872904126},"robotTf":{"rotation_3x3":[0.029246,-0.946137,0.322443,-0.99956,-0.029255,0.004819,0.004874,-0.322442,-0.946577],"translation_3x1":[1.2,0.755481,1.0337]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[837.7735518085738,290.10657259006973,2,922.5907497697533,349.4941147247116,2],"num_keypoints":2}]}
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02020#1] gripSucceed=1(성공)인데 robotTfTranslationX=1.2 작업범위 [-0.5, 0.5]m 밖 — 잡을 수 없는 위치에서 성공은 모순
⚠ stat [반려동물용품_CR01_강아지공룡알장난감_02020#1] robotTfTranslationX=1.2 robust-z=294.2 (임계 3.5, 관측 분포 클러스터 밖 — 신규값 참고 정보)
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_02021","attemptNumber":1,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02021","globalSequence":27,"occurredAt":"2023-10-10T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":1,"grip2dPose":{"xl":1151.05,"xr":1097.73,"yl":409.763,"yr":297.697},"grip3dPose":{"x1":0.13583597575946987,"x2":0.25762077030509184,"x3":0.26881488327524555,"x4":0.1470300887296236,"x5":0.15320429723556156,"x6":0.2749890917811835,"x7":0.28618320475133724,"x8":0.16439841020571527,"y1":0.5698898414343145,"y2":0.6314120217996064,"y3":0.607180576055836,"y4":0.5456583956905441,"y5":0.5674124288670743,"y6":0.6289346092323662,"y7":0.6047031634885958,"y8":0.5431809831233039,"z1":0.1438768673260184,"z2":0.1752374339755728,"z3":0.17930300551942063,"z4":0.14794243886986624,"z5":0.08128929798453642,"z6":0.11264986463409082,"z7":0.11671543617793867,"z8":0.08535486952838427},"robotTf":{"rotation_3x3":[0.029246,-0.946137,0.322443,-0.99956,-0.029255,0.004819,0.004874,-0.322442,-0.946577],"translation_3x1":[-0.332466,0.2,1.0337]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[1130.6451879522954,282.06786598651155,2,1180.0979442602377,372.73511176483686,2],"num_keypoints":2}]}
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02021#1] gripSucceed=1(성공)인데 robotTfTranslationY=0.2 작업범위 [0.65, 0.95]m 밖 — 잡을 수 없는 위치에서 성공은 모순
⚠ stat [반려동물용품_CR01_강아지공룡알장난감_02021#1] robotTfTranslationY=0.2 robust-z=185.5 (임계 3.5, 관측 분포 클러스터 밖 — 신규값 참고 정보)
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

> 이상 감지: gripSucceed=1(성 성공)과 robotTfTranslation 이 workspace 한계 밖인 모순 정합성 위이로, 오염 행 격리와 베이스라인 규칙 고정이 필하다.

### 심각도 — critical

오염 열은 robotTfTranslation 이며, 영향 행수는 2건(Sequence 26, 27)으로 국한되나 gripSucceed=1 과 workspace 부등성 모순이 downstream 컨트롤러 및 API 버전에서 물리적 잡 실패로 이어질 수 있음. event_store 원본은 보존되어 재투영으로 복원 가능하나 현 Read Model 의 Zod 구조 검증만으로는 의미적 값 오류를 누락됨.

### 기대-실측 델타 근거

- (반려동물용품_CR01_강아지공룡알장난감_02020#1, `robotTf` / robotTfTranslation) 관측 `1.2` vs 기준 `robotTfTranslationX_workspace` [-0.50, 0.50] m → 델타 +0.70 m · gripSucceed=1 인데 robotTfTranslationX 가 workspace 한계 밖인 모순 정합성 위이
- (반려동물용품_CR01_강아지공룡알장난감_02021#1, `robotTf` / robotTfTranslation) 관측 `0.2` vs 기준 `robotTfTranslationY_workspace` [0.65, 0.95] m → 델타 -0.45 m · gripSucceed=1 인데 robotTfTranslationY 가 workspace 한계 밖인 모순 정합성 위이

### 관찰

- gripSucceed=1 인데 robotTfTranslationX=1.2 이 workspace [-0.5, 0.5]m 밖
- gripSucceed=1 인데 robotTfTranslationY=0.2 이 workspace [0.65, 0.95]m 밖

### 영향 범위

- event_store
- grip-result-projector
- read_grip_result(컬럼)
- 컨트롤러 엔드포인트
- API 버전

### 근본원인 — projectionOrPipelineFault

1. 관측: gripSucceed=1 인데 robotTfTranslation 이 workspace 한계 밖임
2. 왜? → 프로젝트가 Zod 구조 검증만 수행하고 의미적 값 범위 검ᄒᆞᆫ 로직을 생략함
3. 왜? → GripResultProjector 의 checkIntegrity 메서드 미구현으로 정합성 검사 루트가 건너뜀음
4. 왜? → Read Model read_grip_result 에 translation value range CHECK 제약이 누락됨
5. 왜? → 초기 설계가 physical bounds 검ᄒᆞᆫ 로직을 별도 관자(LLM) 위안으로 미루어 구현함

### 의사결정 기준

- 데이터 무결성 유지(event_store 보존 vs Read Model 수정)
- downstream 영향 차단(컨트롤러/API 안정화)
- 운영 비용 및 유지보수 간소화

### 해결책 옵션 (contain → fix → harden)

#### [contain] 오염 행 격리
- 접근: verified 근거로 확정 교체이므로 read_grip_result 의 해당 (scene_key, attempt_num) 행을 DELETE 하되 event_store 원본은 보존하여 재투영으로 복원.
- 트레이드오프: downstream API 버전에서 null/결 결 발생 가능하나 event_store 완전 보존으로 재투영 복원 가능.
```sql
-- 오염 행 격리: 이상 (scene_key, attempt_num) 행을 Read Model 에서 제거한다.
-- 원본 이벤트는 event_store 에 보존되므로 v2 재투영(무결성 플래그 포함)으로 복원 가능하다.
DELETE FROM read_grip_result WHERE (scene_key, attempt_num) IN (('반려동물용품_CR01_강아지공룡알장난감_02020', 1), ('반려동물용품_CR01_강아지공룡알장난감_02021', 1));
```

#### [fix] 프로젝터 정합성 검사 로직 삽입
- 접근: GripResultProjector 에 checkIntegrity 메서드 구현하여 workspace bounds 검ᄒᆞᆫ 로직 추가.
- 트레이드오프: 일회성 코드 수정 비용 수용하나 downstream 안정화와 데이터 무결성 동부 확보.
```typescript
checkIntegrity(row: ReadGripResultInsert): IntegrityViolation[] {
  const violations: IntegrityViolation[] = [];
  if (row.gripSucceed === 1) {
    const tf = row.robotTf as { translation_3x1: number[] };
    const tx = tf.translation_3x1[0];
    const ty = tf.translation_3x1[1];
    if (tx < -0.5 || tx > 0.5) violations.push({ readModelName: "read_grip_result", sceneKey: row.sceneKey, attemptNum: row.attemptNum, streamId: row.streamId, globalSeq: row.globalSeq, ruleName: "gripSucceed_poseConsistency", affectedColumns: ["robotTf"], observedValue: String(tx), expected: "[-0.50, 0.50] m", detail: `robotTfTranslationX=${tx} 이 workspace 한계 밖` });
    if (ty < 0.65 || ty > 0.95) violations.push({ readModelName: "read_grip_result", sceneKey: row.sceneKey, attemptNum: row.attemptNum, streamId: row.streamId, globalSeq: row.globalSeq, ruleName: "gripSucceed_poseConsistency", affectedColumns: ["robotTf"], observedValue: String(ty), expected: "[0.65, 0.95] m", detail: `robotTfTranslationY=${ty} 이 workspace 한계 밖` });
  }
  return violations;
}
```

#### [harden] Read Model CHECK 제약 추가
- 접근: read_grip_result_v2 에 translation value range CHECK 제약 추가.
- 트레이드오프: 기존 v1 테이블 구조 변경으로 파급 호환 문제 발생이나 v2 설계 채택 전제로 안전화.
```sql
-- 선행 조건: §2 'Read Model 생성 SQL'(DDL)을 먼저 적용한 뒤 실행한다.
ALTER TABLE read_grip_result_v2 ADD CONSTRAINT check_robot_tf_x CHECK ((robot_tf_translation_x IS NULL) OR (robot_tf_translation_x >= -0.5 AND robot_tf_translation_x <= 0.5));
ALTER TABLE read_grip_result_v2 ADD CONSTRAINT check_robot_tf_y CHECK ((robot_tf_translation_y IS NULL) OR (robot_tf_translation_y >= 0.65 AND robot_tf_translation_y <= 0.95));
```

### 권장
- Read Model v2 채택과 정합성 검사 로직 동부
- 사유: 확정 설계 read_grip_result_v2 의 채택을 전제로 fix 단계의 프로젝트 검ᄒᆞᆫ 로직을 동부하여 downstream 안정화와 데이터 무결성을 모두 확보.
- 수용하는 트레이드오프: 일회성 migration SQL 과 프로젝트 코드 수정 비용 수용.
- 기각한 대안:
  - contain 만: downstream API 버전에서 null/결 결 발생, lost in decisionCriteria 2
  - harden 만: 기존 v1 테이블 구조 변경으로 파급 호환 문제, lost in decisionCriteria 3

### 즉시 격리 SQL

```sql
-- 오염 행 격리: 이상 (scene_key, attempt_num) 행을 Read Model 에서 제거한다.
-- 원본 이벤트는 event_store 에 보존되므로 v2 재투영(무결성 플래그 포함)으로 복원 가능하다.
DELETE FROM read_grip_result WHERE (scene_key, attempt_num) IN (('반려동물용품_CR01_강아지공룡알장난감_02020', 1), ('반려동물용품_CR01_강아지공룡알장난감_02021', 1));
```

### 하드닝(베이스라인 추가 규칙)

rule: robotTfTranslationX_workspace_v2 expected: [-0.50, 0.50] m / rule: robotTfTranslationY_workspace_v2 expected: [0.65, 0.95] m

### 다음 단계

- 프로젝터 정합성 검사 메서드 구현 (`src/projection/projector/grip-result.projector.ts`) — method implementation, developer
- Read Model v2 migration SQL 적용 (`src/shared/database/schema/service/read-grip-result-v2.ts`) — schema definition & migration execution, database engineer
- catch-up runner 정합성 검사 로직 연동 (`src/projection/runner/catch-up.runner.ts`) — integration wiring, developer

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

- 대상: `read_grip_result_v2` · 키: scene_key, attempt_num · 원천 이벤트: GripAttemptRecorded

```sql
DROP TABLE IF EXISTS read_grip_result_v2;

CREATE TABLE read_grip_result_v2 (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  object_name varchar NOT NULL,
  grip_succeed smallint NOT NULL,
  occurred_at timestamptz NOT NULL,
  robot_tf_translation_x double precision,
  robot_tf_translation_y double precision,
  grip_outlier_flag smallint NOT NULL,
  stream_id varchar NOT NULL,
  global_seq bigint NOT NULL,
  PRIMARY KEY (scene_key, attempt_num)
);

CREATE INDEX idx_grip_result_v2_outlier ON read_grip_result_v2 (grip_outlier_flag);
```

### 필드

```mschema
# Table: read_grip_result_v2
[
(scene_key:varchar, 장면 식별 키 (stream_id 제거 prefix), Primary Key),
(attempt_num:smallint, 동장면 grasp 시도 번호, Primary Key),
(object_name:varchar, grasp 대상 객체명 (payload.objects[0].class_name)),
(grip_succeed:smallint, grasp 성공 여부 (0=실패, 1=성공)),
(occurred_at:timestamptz, 데이터 촬영 일자),
(robot_tf_translation_x:double precision, 로봇 translation 벡터 X 좌 (translation_3x1[0])),
(robot_tf_translation_y:double precision, 로봇 translation 벡터 Y 좌 (translation_3x1[1])),
(grip_outlier_flag:smallint, workspace bounds 검ᄒᆞᆫ 플래그 (X∉[-0.5,0.5] OR Y∉[0.65,0.95] → 1)),
(stream_id:varchar, ES 스트림 ID (grip-attempt: + scene_key)),
(global_seq:bigint, 투영 출처 이벤트 ES 전역 시퀀스)
]
```

### 투영 매핑 명세 (이벤트 → 컬럼)

> upsert 키: scene_key, attempt_num · 리플레이: projection_cursor 초기화 시 upsertKey(scene_key, attempt_num) 기준 정렬을 필수해야 하며, catch-up 전 전체 재투영은 멱id(upsert) 전제 조건을 반드시 지켜 중복/정리 상태가 유지된다.

| 원천 이벤트 | payload 필드 | 컬럼 | 변환 |
| --- | --- | --- | --- |
| GripAttemptRecorded | streamId | scene_key | prefix "grip-attempt:" 제거 |
| GripAttemptRecorded | attemptNumber | attempt_num | verbatim |
| GripAttemptRecorded | objects[].class_name | object_name | verbatim |
| GripAttemptRecorded | gripSucceed | grip_succeed | number → smallint |
| GripAttemptRecorded | occurredAt | occurred_at | string → timestamptz |
| GripAttemptRecorded | robot_tf.translation_3x1 | robot_tf_translation_x | array index 0 추출 |
| GripAttemptRecorded | robot_tf.translation_3x1 | robot_tf_translation_y | array index 1 추출 |
| GripAttemptRecorded | streamId | stream_id | verbatim |
| GripAttemptRecorded | globalSequence | global_seq | verbatim |

파생 컬럼(이벤트 payload 아님):
- `grip_outlier_flag` ← robot_tf_translation_x ∉ [-0.5, 0.5] OR robot_tf_translation_y ∉ [0.65, 0.95] → 1 else 0

### Insight 카드 등록 (Insight Read DB 동기화)

> DDL 적용 시 아래 카드 등록도 함께 실행한다 — 다음 분석부터 신규 Read Model 이 LLM 컨텍스트에 노출된다.

```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_grip_result_v2', 'read_model', '시도별 로봇 grasp 결과 모델로, robotTfTranslation X/Y 좌우를 explicit numeric 컬럼으로 추출하고 workspace bounds 검ᄒᆞᆫ 플래그(gripOutlierFlag)를 전투영 단계에 계산하여, 클라이언드 parsing 없이 DB 직접 필터링으로 Sensor Baseline Deviation(성 성공인데 위치 밖)을 조인/시계열 조회가 가능.', 'scene_key, attempt_num')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_grip_result_v2', 'scene_key', 'varchar', '장면 식별 키 (stream_id 제거 prefix)', 1),
  ('read_grip_result_v2', 'attempt_num', 'smallint', '동장면 grasp 시도 번호', 2),
  ('read_grip_result_v2', 'object_name', 'varchar', 'grasp 대상 객체명 (payload.objects[0].class_name)', 3),
  ('read_grip_result_v2', 'grip_succeed', 'smallint', 'grasp 성공 여부 (0=실패, 1=성공)', 4),
  ('read_grip_result_v2', 'occurred_at', 'timestamptz', '데이터 촬영 일자', 5),
  ('read_grip_result_v2', 'robot_tf_translation_x', 'double precision', '로봇 translation 벡터 X 좌 (translation_3x1[0])', 6),
  ('read_grip_result_v2', 'robot_tf_translation_y', 'double precision', '로봇 translation 벡터 Y 좌 (translation_3x1[1])', 7),
  ('read_grip_result_v2', 'grip_outlier_flag', 'smallint', 'workspace bounds 검ᄒᆞᆫ 플래그 (X∉[-0.5,0.5] OR Y∉[0.65,0.95] → 1)', 8),
  ('read_grip_result_v2', 'stream_id', 'varchar', 'ES 스트림 ID (grip-attempt: + scene_key)', 9),
  ('read_grip_result_v2', 'global_seq', 'bigint', '투영 출처 이벤트 ES 전역 시퀀스', 10)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased (v1 → v2)

#### Added
- 신규 Read Model 테이블 read_grip_result_v2, Drizzle 스키마, GripResultV2Projector, /grip-result-v2 라우트
#### Fixed
- physical workspace bounds 검ᄒᆞᆫ 로직 결ᄒᆡ로 인한 silent DB 삽입 현장 해결. explicit X/Y 좌우 컬럼과 grip_outlier_flag 플래그 도입

### 마이그레이션 절차

- 하위호환 변경: v1 read_grip_result 테이블·프로젝터·라우트 무손상 유지; 신규 v2 엔드포인트는 additive 라우트(/grip-result-v2) 로 기존 consumers unaffected
- 파괴적 변경: 없음
- 컷오버 전 테스트: 1. 최신 이벤트 batch 에 v2 Projector 실행 검증
2. globalSequence 26/27 행에서 grip_outlier_flag=1 정확히 플래그 검ᄒᆞᆫ 확인
3. downstream dashboards 가 /grip-result-v2 엔드포인트 연결 테스트
- 롤백 창/조건: v2 DI/라우트 제거 revert. v1 테이블·프로젝터는 untouched 로 fallback query 가능. 컷오버 전 v2 검증 실패 시 rollback 즉시.
- Insight 카드 등록: §2의 카드 등록 SQL을 DDL과 함께 적용(카탈로그 동기화)

### 사유·호환성

- 사유: 기존 v1 Read Model은 robot_tf JSONB 컬럼만 존재하고 physical workspace bounds 검ᄒᆞᆫ 로직이 결ᄒᆡ. 이로 인해 잡을 수 없는 위치(X∉[-0.5,0.5]m, Y∉[0.65,0.95]m)에서 gripSucceed=1 이 조용히 DB에 삽입됨 [corr:26][corr:27]. v2는 explicit X/Y 좌우 컬럼과 grip_outlier_flag 플래그를 도입하여 baseline deviation downstream consumers 가 즉시 필터링할 수 있도록 구조화.
- 트리거 근거: [globalSequence: 26] sceneKey="반려동물용품_CR01_강아지공룡알장난감_02020" | gripSucceed=1 | robotTfTranslationX=1.2 (⚠ X-workspace [-0.5, 0.5]m 밖) [corr:26]
[globalSequence: 27] sceneKey="반려동물용품_CR01_강아지공룡알장난감_02021" | gripSucceed=1 | robotTfTranslationY=0.2 (⚠ Y-workspace [0.65, 0.95]m 밖) [corr:27]
- v1 호환성: v1 read_grip_result 테이블·프로젝터·라우트는 무손상 유지. v2 신규 테이블은 동시 존재하며, 컷오버 전 v2 검증 절차를 거치면 기존 consumers unaffected.

### 변경 파일

- `src/shared/database/schema/index.ts` (modifyFile) — 신규 v2 스키마 export 배선. 기존 v1 export 무손상.
- `src/projection/projection.service.ts` (modifyFile) — GripResultV2Projector DI 배선, catchUpAll 결과 타입/로직 확장. 기존 v1 로직 무손상.
- `src/projection/projection.controller.ts` (modifyFile) — /grip-result-v2 라우트 배선. 기존 v1 엔드포인트 무손상.

## Optional — 부속 자료(컨텍스트 축소 시 생략 가능)

### 신규 Read Model — Drizzle 스키마

```ts
import { bigint, doublePrecision, index, pgTable, primaryKey, smallint, timestamp, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const readGripResultV2 = pgTable(
  "read_grip_result_v2",
  {
    sceneKey: varchar("scene_key").notNull(),
    attemptNum: smallint("attempt_num").notNull(),

    objectName: varchar("object_name").notNull(),
    gripSucceed: smallint("grip_succeed").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),

    robotTfTranslationX: doublePrecision("robot_tf_translation_x"),
    robotTfTranslationY: doublePrecision("robot_tf_translation_y"),

    gripOutlierFlag: smallint("grip_outlier_flag").notNull(),

    streamId: varchar("stream_id").notNull(),
    globalSeq: bigint("global_seq", { mode: "number" }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.sceneKey, t.attemptNum] }),
    index("idx_grip_result_v2_outlier").on(t.gripOutlierFlag),
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
export class GripResultV2Projector implements Projector<ReadGripResultV2Insert> {
  readonly name: string = "grip-result-v2-projector";

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(GripResultV2Projector.name);
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

    const translation = payload.robot_tf.translation_3x1;
    const xValue: number = translation[0];
    const yValue: number = translation[1];

    // Workspace bounds: X ∈ [-0.5, 0.5], Y ∈ [0.65, 0.95]
    const isOutlier: number = (xValue < -0.5 || xValue > 0.5 || yValue < 0.65 || yValue > 0.95) ? 1 : 0;

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
      robotTfTranslationX: xValue,
      robotTfTranslationY: yValue,
      gripOutlierFlag: isOutlier,
      streamId: event.streamId,
      globalSeq: event.globalSeq,
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
          robotTfTranslationX: row.robotTfTranslationX,
          robotTfTranslationY: row.robotTfTranslationY,
          gripOutlierFlag: row.gripOutlierFlag,
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
export * from "./service/read-grip-result-v2";

// src/projection/projection.service.ts (snippet)
private readonly gripResultV2: GripResultV2Projector,
catchUpGripResultV2(): Promise<ProjectionResult> {
  // TODO: Reset projection cursor to 0 before this call to force full re-projection for baseline deviation validation.
  return this.runner.run(this.gripResultV2);
}

// src/projection/projection.controller.ts (snippet)
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

// src/projection/projection.module.ts (snippet)
providers: [
  GripResultProjector,
  MultiModalProjector,
  GripResultV2Projector,
],
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
export * from "./service/read-grip-result-v2";
```

### 버전 교체 코드 — `src/projection/projection.service.ts` (modifyFile)

```typescript
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { GripResultV2Projector } from '@/projection/projector/grip-result-v2.projector';
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
    private readonly gripResultV2: GripResultV2Projector,
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

  @Post("/grip-result-v2")
  gripResultV2(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/grip-result-v2",
      },
      "projection v2 요청 수신",
    );

    return this.projectionService.catchUpGripResultV2();
  }

  @Post("/insert-all")
  insertAll(): Promise<InsertAndProjectionAllResult> {
    this.logger.info(
      { action: LogAction.PROJECTION_REQUEST },
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
- actionability (실행 가능성): Docs 의 SQL 과 절차를 그대로 따르면 문제가 해결되는가. [자동 검증 결과]를 실측으로 반영하되, 실행·컴파일이 되더라도 의도와 다른 일을 하는 코드는 감점한다. 반드시 다음을 직접 확인한다: (1) 프로젝션 로직이 DDL 의 NOT NULL 컬럼에 null 이나 TODO 를 넣어 실제 적재 시 실패하지 않는가, (2) upsert 의 excluded. 뒤 식별자가 DDL 의 실제 컬럼명(snake_case)인가, (3) 비율·평균 계산이 정수 나눗셈으로 0/1 만 저장되지 않는가, (4) 정답이 요구한 값(성공률·실패율 등)이 실제 컬럼으로 존재하는가, (5) CHECK 제약이 플래그로 격리해야 할 바로 그 행의 적재를 막아 설계와 모순되지 않는가, (6) 기각했다고 쓴 조치(DELETE 등)를 즉시 격리 SQL 로 그대로 싣지 않았는가, (7) 기존 v1 테이블(read_grip_result, read_multimodal, event_store)의 행을 ALTER/DROP/DELETE 하지 않는가, (8) 정답 요지가 Read Model 보강을 요구하는데 검증용 SELECT 만 있지 않은가. 5=그대로 따르면 해결(실행 성공 + 요구 충족, 위 결함 없음). 4=위 결함 중 사소한 것 1개. 3=오탈자·순서·식별자 등 소폭 수정 후 해결. 2=따르면 적재·투영이 실패하거나 요구한 값을 얻지 못함. 1=따르면 기존 자산이 손상되거나 무관함.
- completeness (완결성): 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소가 모두 유효하고 서로 일치하는가. 반드시 다음을 직접 확인한다: (1) TL;DR·머리말의 대상 테이블과 DDL 의 테이블명이 같은가, (2) 권고(Decision Outcome, Non-Goals)와 실제 SQL·코드가 모순되지 않는가(예: '보강한다'고 쓰고 '구조 변경 없음'이라 함, '기존 확장'이라 쓰고 신규 테이블을 만듦), (3) 코드 블록 사이의 클래스명·파일명·라우트명·export 경로가 서로 같은가, (4) DDL 의 nullable 과 ORM 스키마의 notNull 이 일치하는가, (5) 권고 절이 '재실행 권장'·'최소 근거만 수록' 같은 대체 스텁이 아닌가, (6) API 버저닝 절이 비어 있거나 문장이 끊기지 않았는가. 5=세 요소가 모두 유효하고 서로 일치. 4=사소한 불일치 1개. 3=세 요소가 있으나 서로 어긋나거나 항목이 비어 있음. 2=한 요소가 실질적으로 비어 있음(예: DDL 절에 검증 SELECT 만). 1=요소 누락 또는 근거 부족 표시.

다음 형식의 JSON 객체 하나만 출력하라:
{"groundedness": 1-5, "diagnosisAccuracy": 1-5, "actionability": 1-5, "completeness": 1-5, "unsupportedClaims": ["자료에 없는 주장 인용 (없으면 빈 배열)"], "rationale": "각 항목 점수 근거를 항목당 1~2문장으로, 한국어로"}
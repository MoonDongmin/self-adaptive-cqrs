당신은 이벤트 소싱 + CQRS 기반 Physical AI 데이터 플랫폼의 시니어 아키텍트이자 엄격한 평가자다. LLM 파이프라인이 [자료](로그·이벤트·스키마 정보)를 보고 [Docs]를 생성했다. Docs 는 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소를 항상 함께 담아야 하는 단일 산출물이다. 당신은 [정답 요지]와 [자료], [자동 검증 결과]를 기준으로 Docs 를 네 항목의 루브릭으로 채점한다. 채점은 관대하지 않게, 근거 없는 주장·지어낸 값·의도와 다른 SQL·서로 어긋나는 절에는 낮은 점수를 준다. 반드시 JSON 객체 하나만 출력한다. 설명문·마크다운 펜스는 출력하지 않는다.

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
- 문서 검사: 실패 항목 hanCharacterFree
- SQL 실행: 블록 5개 중 5개 실행 성공
- 코드 컴파일: 파일 4개 중 4개 통과

[저장소 파일 확인] — 파이프라인은 진단 도구로 저장소 소스 코드를 조회할 수 있다. Docs 가 인용한 파일 경로의 실재 여부와 앞부분 발췌이다.
- 저장소에 실재하는 파일 (5건): src/projection/projection.controller.ts, src/projection/projection.module.ts, src/projection/projection.service.ts, src/projection/projector/grip-result.projector.ts, src/shared/database/schema/index.ts
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
generatedAt: 2026-08-10T14:13:02.125Z
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

> 결론(TL;DR): `read_grip_result`을(를) 재생성한다 — 두 장면에서 gripSucceed=1(성 성공)인데 robotTfTranslation 이 작업범위(workspace) 밖으로 치우쳐 물리적 모순(잡을 수 없는 위치에서 성공 보고). 02020: X=1.2m (범위 [-0.5, 0.5]m), 02021: Y=0.2m (범위 [0.65, 0.95]m). (이상 유형: Sensor Baseline Deviation · 심각도: critical)

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

> gripSucceed=1일 시 robotTfTranslation이 작업범위를 벗어나 물리적 모순 데이터가 누락된 정합성 검증으로 이상 판정.

### 심각도 — critical

오염 열은 robotTfTranslation이며, 영향 행수는 2건(Seq 26, 27)으로 국한되나 gripSucceed=1과 translation 부등치로 downstream 컨트롤러의 물리적 제스처 계산이 왜곡될 수 있으며, event_store 원본은 보존되어 재투영(fix)으로 복원 가능하나 현 read_grip_result 스키마에는 정합성 검사를 누락된 상태라 즉시 대응이 필요.

### 기대-실측 델타 근거

- (반려동물용품_CR01_강아지공룡알장난감_02020#1, `robotTf` / robotTfTranslation) 관측 `1.2` vs 기준 `robotTfTranslationX_workspace` [-0.50, 0.50] m → 델타 +0.7 · gripSucceed=1일 시 translation X가 workspace 상단 한도 0.5를 초과 0.7m로 잡을 수 없는 위치이므로 물리적 모순.
- (반려동물용품_CR01_강아지공룡알장난감_02021#1, `robotTf` / robotTfTranslation) 관측 `0.2` vs 기준 `robotTfTranslationY_workspace` [0.65, 0.95] m → 델타 -0.45 · gripSucceed=1일 시 translation Y가 workspace 하단 한도 0.65 미만 0.45m로 잡을 수 없는 위치이므로 물리적 모순.

### 관찰

- Seq 26에서 gripSucceed=1일 시 robotTfTranslationX가 1.2m로 작업범위 [-0.5, 0.5]m를 초과하며, Seq 27에서 gripSucceed=1일 시 robotTfTranslationY가 0.2m로 작업범위 [0.65, 0.95]m 미만이므로 물리적 모순 데이터가 누락된 정합성 검증으로 통과.

### 영향 범위

- grip-result-projector
- read_grip_result.robot_tf
- downstream_grasp_trajectory_calculator
- api_v1_read_model

### 근본원인 — projectionOrPipelineFault

1. 왜 이 데이터가 통과? -> 정합성 검증 로직이 누락된 상태라 구조(zod)만 통과됨.
2. 왜 정합성 검증 로직이 누락? -> 기존 GripResultProjector.checkIntegrity 미구且 DB 스키마에 translation 축 분리/검증 규칙 미적재.
3. 왜 미적재? -> 베이스라인 문서(gripSucceed_poseConsistency)는 존재하나 실제 코드/DDL 반영이 미완료됨.
4. 왜 미완료? -> 신규 v2 설계 확정되었으나 투영 서비스 연동 및 마이그레이션 SQL 미적재.
5. 왜 미적재? -> 운영 문서 생성자 미감지 누且 기존 v1 jsonb 구조만 유지함.

### 의사결정 기준

- physical_consistency_violation
- downstream_impact_risk
- event_store_preservation
- migration_complexity

### 해결책 옵션 (contain → fix → harden)

#### [contain] 오염 행 격리(DELETE)
- 접근: gripSucceed=1일 시 translation이 workspace 범위를 벗어나는 row를 read_grip_result에서 즉시 삭제. event_store 원본은 보존되어 재투영으로 복원 가능.
- 트레이드오프: 일시 데이터 손단 downstream 제스처 계산 오류 예방, 원복 가능
```sql
-- 오염 행 격리: 이상 (scene_key, attempt_num) 행을 Read Model 에서 제거한다.
-- 원본 이벤트는 event_store 에 보존되므로 v2 재투영(무결성 플래그 포함)으로 복원 가능하다.
DELETE FROM read_grip_result WHERE (scene_key, attempt_num) IN (('반려동물용품_CR01_강아지공룡알장난감_02020', 1), ('반려동물용품_CR01_강아지공룡알장난감_02021', 1));
```

#### [fix] 재투修正 및 v2 연동
- 접근: 확정된 read_grip_result_v2 스키마 채택하여 translation 축 분리且 grip_outlier_flag 적용, 기존 GripResultProjector.map/upsert 수정으로 v2 정렬 투영.
- 트레이드오프: v1 jsonb 구조 변경으로 하류 호환 필요但 물리적 검증 강화
```typescript
map(event: EventStoreEventRow): ReadGripResultV2Insert {
  const payload = toyDataSchema.parse(event.payload);
  const tx = payload.robot_tf.translation_3x1;
  return {
    sceneKey: event.streamId.replace(/^grip-attempt:/, ""),
    attemptNum: event.attemptNum,
    objectName: payload.objects[0].class_name,
    gripSucceed: payload.grip_succeed,
    occurredAt: event.occurredAt,
    robotTfTranslationX: tx[0],
    robotTfTranslationY: tx[1],
    gripOutlierFlag: payload.grip_succeed === 1 && (tx[0] < -0.5 || tx[0] > 0.5 || tx[1] < 0.65 || tx[1] > 0.95) ? 1 : 0,
    streamId: event.streamId,
    globalSeq: event.globalSeq,
  };
}
```

#### [harden] 베이스라인 규칙 추가(SQL CHECK)
- 접근: read_grip_result_v2에 grip_outlier_flag CHECK CONSTRAINT 적용으로 DB 수준 정합성 강제.
- 트레이드오프: DB constraint 추가且 기존 v1 jsonb 접근 로직 호환 필요
```sql
-- 선행 조건: §2 'Read Model 생성 SQL'(DDL)을 먼저 적용한 뒤 실행한다.
ALTER TABLE read_grip_result_v2 ADD CONSTRAINT chk_grip_outlier_flag CHECK (grip_succeed = 1 AND grip_outlier_flag = 0 OR grip_succeed = 0);
```

### 권장
- fix: v2 스키마 채택且 재투영
- 사유: 확정된 read_grip_result_v2 설계가 translation 축 분리且 outlier flag를 명확히 정의且 downstream 호환이 수반되나 물리적 모순 데이터 누락 prevention에 가장 부합.
- 수용하는 트레이드오프: v1 jsonb 구조 변경으로 하류 읽 로직 호환 작업 필요但 event_store 원본 보존且 재투영 가능.
- 기각한 대안:
  - contain: 격리만으로는 근본원인(검증 누락) 해결且 downstream 호환 미필요但 데이터 영구 손단 risk
  - harden: DB CHECK만으로는 v1 jsonb 구조 미변且 translation 축 접근 로직 호환 미수반且 fix 단계 선행 필요

### 즉시 격리 SQL

```sql
-- 오염 행 격리: 이상 (scene_key, attempt_num) 행을 Read Model 에서 제거한다.
-- 원본 이벤트는 event_store 에 보존되므로 v2 재투영(무결성 플래그 포함)으로 복원 가능하다.
DELETE FROM read_grip_result WHERE (scene_key, attempt_num) IN (('반려동물용품_CR01_강아지공룡알장난감_02020', 1), ('반려동물용품_CR01_강아지공룡알장난감_02021', 1));
```

### 하드닝(베이스라인 추가 규칙)

rule: gripSucceed_poseConsistency_v2 expected: grip_succeed=1일 시 robot_tf_translation_x IN [-0.50, 0.50] AND robot_tf_translation_y IN [0.65, 0.95] AND grip_outlier_flag = 0

### 다음 단계

- v2 스키마 마이그레이션且 투영 연동 (`src/projection/projector/grip-result.projector.ts`) — map/upsert 수정且 v2 InsertModel 적용, developer
- 하류 읽 로직 호환(v1 jsonb -> v2 column) (`src/shared/database/schema/service/read-grip-result-v2.ts`) — DDL migration且 Drizzle schema 수정, developer
- 정합성 검증 로직 누락 보강 (`src/projection/projector/grip-result.projector.ts`) — checkIntegrity 구현且 gripSucceed_poseConsistency 적용, developer

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
  grip_outlier_flag smallint NOT NULL DEFAULT 0,
  stream_id varchar NOT NULL,
  global_seq bigint NOT NULL,
  PRIMARY KEY (scene_key, attempt_num)
);
CREATE INDEX idx_grip_result_v2_time ON read_grip_result_v2 (occurred_at);
```

### 필드

```mschema
# Table: read_grip_result_v2
[
(scene_key:varchar, 장면 식별 키 (stream_id 제거 prefix), Primary Key),
(attempt_num:smallint, 동장면 내 시도 번호, Primary Key),
(object_name:varchar, 파지 대상 객체명 (payload.objects[0].class_name)),
(grip_succeed:smallint, 파지 성공 여부 (0=실패, 1=성)),
(occurred_at:timestamptz, 데이터 촬영 일자),
(robot_tf_translation_x:double precision, 로봇 translation X 축 값 (payload.robot_tf.translation_3x1[0])),
(robot_tf_translation_y:double precision, 로봇 translation Y 축 값 (payload.robot_tf.translation_3x1[1])),
(grip_outlier_flag:smallint, workspace bounds consistency violation flag (gripSucceed=1 일 시 1, else 0)),
(stream_id:varchar, ES 스트림 ID),
(global_seq:bigint, 투영 출처 이벤트 ES 전역 시퀀스)
]
```

### 투영 매핑 명세 (이벤트 → 컬럼)

> upsert 키: scene_key, attempt_num · 리플레이: projection_cursor 초기화(0/null) 필드시 반드시 세팅해야 하며, catch-up 전체 재투영 시 upsert 전제 조건으로 멱id(upsert)을 보장하여 기존 기록이 overwrite 없이 최신 payload로 갱신해야.

| 원천 이벤트 | payload 필드 | 컬럼 | 변환 |
| --- | --- | --- | --- |
| GripAttemptRecorded | objects[0].class_name | object_name | verbatim |
| GripAttemptRecorded | grip_succeed | grip_succeed | verbatim (number → smallint) |
| GripAttemptRecorded | robot_tf.translation_3x1 | robot_tf_translation_x | array index 0 추출 |
| GripAttemptRecorded | robot_tf.translation_3x1 | robot_tf_translation_y | array index 1 추출 |
| GripAttemptRecorded | streamId | stream_id | verbatim |
| GripAttemptRecorded | globalSequence | global_seq | verbatim (number → bigint) |

파생 컬럼(이벤트 payload 아님):
- `scene_key` ← streamId prefix 'grip-attempt:' 제거
- `attempt_num` ← data_key 파일명 시도번호 추출(YYYYMMDD_XX_YY format parsing)
- `occurred_at` ← data_key 날짜 추출(YYYYMMDD) → ISO timestamp
- `grip_outlier_flag` ← 1 if grip_succeed=1 AND (robot_tf_translation_x ∉ [-0.5, 0.5] OR robot_tf_translation_y ∉ [0.65, 0.95]), else 0

### Insight 카드 등록 (Insight Read DB 동기화)

> DDL 적용 시 아래 카드 등록도 함께 실행한다 — 다음 분석부터 신규 Read Model 이 LLM 컨텍스트에 노출된다.

```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_grip_result_v2', 'read_model', '행 단위 로봇 translation X/Y 추출과 gripSucceed=1 대 workspace bounds 정합성 플래그 저장을 위한 Sensor Baseline Deviation 분석. 기존 read_grip_result 에는 translation 분별 컬럼 및 consistency flag 가 미적재되어 물리적 모순 데이터가 조용히 통과.', 'scene_key, attempt_num')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_grip_result_v2', 'scene_key', 'varchar', '장면 식별 키 (stream_id 제거 prefix)', 1),
  ('read_grip_result_v2', 'attempt_num', 'smallint', '동장면 내 시도 번호', 2),
  ('read_grip_result_v2', 'object_name', 'varchar', '파지 대상 객체명 (payload.objects[0].class_name)', 3),
  ('read_grip_result_v2', 'grip_succeed', 'smallint', '파지 성공 여부 (0=실패, 1=성)', 4),
  ('read_grip_result_v2', 'occurred_at', 'timestamptz', '데이터 촬영 일자', 5),
  ('read_grip_result_v2', 'robot_tf_translation_x', 'double precision', '로봇 translation X 축 값 (payload.robot_tf.translation_3x1[0])', 6),
  ('read_grip_result_v2', 'robot_tf_translation_y', 'double precision', '로봇 translation Y 축 값 (payload.robot_tf.translation_3x1[1])', 7),
  ('read_grip_result_v2', 'grip_outlier_flag', 'smallint', 'workspace bounds consistency violation flag (gripSucceed=1 일 시 1, else 0)', 8),
  ('read_grip_result_v2', 'stream_id', 'varchar', 'ES 스트림 ID', 9),
  ('read_grip_result_v2', 'global_seq', 'bigint', '투영 출처 이벤트 ES 전역 시퀀스', 10)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased (v1 → v2)

#### Added
- 신규 Read Model 테이블 read_grip_result_v2, GripResultV2Projector, /grip-result-v2 라우트 엔드포인트
#### Fixed
- workspace bounds consistency violation(gripSucceed_poseConsistency) 감지 및 IntegrityViolation 방출 개스

### 마이그레이션 절차

- 하위호환 변경: 기존 read_grip_result 테이블·GripResultProjector·라우트 엔드포인트는 수정·삭제 금지로 유지; 신규 v2 테이블은 동시 공존 전제, 기존 v1 projection pipeline 은 전혀 간섭받지
- 파괴적 변경: 없음
- 컷오버 전 테스트: 1. CatchUpRunner 가 GripResultV2Projector.run() 호출 시 read_grip_result_v2 INSERT 성공 검증
2. sequence 02020/02021 투영 시 grip_outlier_flag=1, checkIntegrity() IntegrityViolation[] 반환 검증
3. 기존 /projection/grip-result 라우트 v1 pipeline 결과 무변함 검증
- 롤백 창/조건: DROP TABLE read_grip_result_v2; ProjectionService DI 제거 및 catchUpV2GripResult 메서드 삭제; Controller @Post("/grip-result-v2") 엔드포인트 삭제; schema/index.ts v2 export revert. 조건: v1 projection pipeline 정상 작동 재확인 시 롤백 창 진입.
- Insight 카드 등록: §2의 카드 등록 SQL을 DDL과 함께 적용(카탈로그 동기화)

### 사유·호환성

- 사유: 기존 v1 GripResultProjector.map() 메서드와 read_grip_result 스키마는 robot_tf.translation_3x1 벡터를 JSON 열에 담을 뿐, workspace bounds 정합성 검증(Rule: gripSucceed_poseConsistency)이 누락되어 물리적 모순 데이터가 조용히 통과 [corr:02020][corr:02021]. v2 신규 테이블·프로젝터는 translation_X/Y를 explicit numeric 열로 분리하고 grip_outlier_flag를 계산하며 checkIntegrity()를 구현하여 CatchUpRunner 가 표준 이상 로그로 방출할 수 있도록 개선했다.
- 트리거 근거: ⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02020#1] gripSucceed=1(성)인데 robotTfTranslationX=1.2 작업범위 [-0.5, 0.5]m 밖 — 잡을 수 없는 위치에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02021#1] gripSucceed=1(성)인데 robotTfTranslationY=0.2 작업범위 [0.65, 0.95]m 밖 — 잡을 수 없는 위치에서 성공은 모순
- v1 호환성: 기존 read_grip_result 테이블·GripResultProjector 클래스·라우트 엔드포인트·DI 바인딩은 수정·삭제 금지로 유지된다. 신규 read_grip_result_v2 테이블과 GripResultV2Projector 는 동시 공존을 전제하며, ProjectionService/ProjectionController/schema/index.ts 만 DI 한 줄 추가 및 라우트 엔드포인트 확장을 수행(changeKind=modifyFile). 기존 v1 projection pipeline 은 전혀 간섭받지.

### 변경 파일

- `src/shared/database/schema/index.ts` (modifyFile) — v2 테이블 export 확장. 기존 export 패턴 보존.
- `src/projection/projection.service.ts` (modifyFile) — v2 Projector DI 바인딩 및 catchUpV2GripResult 메서드 확장. 기존 v1 pipeline 보존.
- `src/projection/projection.controller.ts` (modifyFile) — /grip-result-v2 라우트 엔드포인트 확장. 기존 v1 엔드포인트 보존.

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
    index("idx_grip_result_v2_time").on(t.occurredAt),
  ],
);
```

### 신규 Read Model — Projector

```ts
import { Injectable } from '@nestjs/common';
import { type InferInsertModel } from 'drizzle-orm';
import { PinoLogger } from 'nestjs-pino';
import { type ToyDataDto, toyDataSchema } from '@/insert/dto/toy-data.dto';
import type { Projector, IntegrityViolation } from '@/projection/projector/projector';
import type { EventStoreEventRow } from '@/projection/repository/event-store-reader.repository';
import { DrizzleTx } from '@/shared/database/drizzle.provider';
import { readGripResultV2 } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

type ReadGripResultV2Insert = InferInsertModel<typeof readGripResultV2>;

const WORKSPACE_X_MIN: number = -0.5;
const WORKSPACE_X_MAX: number = 0.5;
const WORKSPACE_Y_MIN: number = 0.65;
const WORKSPACE_Y_MAX: number = 0.95;

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

    const translationX: number = payload.robot_tf.translation_3x1[0];
    const translationY: number = payload.robot_tf.translation_3x1[1];

    let outlierFlag: number = 0;
    if (payload.grip_succeed === 1) {
      const xOut: boolean = translationX < WORKSPACE_X_MIN || translationX > WORKSPACE_X_MAX;
      const yOut: boolean = translationY < WORKSPACE_Y_MIN || translationY > WORKSPACE_Y_MAX;
      if (xOut || yOut) {
        outlierFlag = 1;
      }
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
      occurredAt: event.occurredAt,
      robotTfTranslationX: translationX,
      robotTfTranslationY: translationY,
      gripOutlierFlag: outlierFlag,
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

  checkIntegrity(row: ReadGripResultV2Insert): IntegrityViolation[] {
    const violations: IntegrityViolation[] = [];

    if (row.gripOutlierFlag === 1) {
      violations.push({
        readModelName: "read_grip_result_v2",
        sceneKey: row.sceneKey,
        attemptNum: row.attemptNum,
        streamId: row.streamId,
        globalSeq: row.globalSeq,
        ruleName: "gripSucceed_poseConsistency",
        affectedColumns: ["robot_tf_translation_x", "robot_tf_translation_y"],
        observedValue: `x=${row.robotTfTranslationX}, y=${row.robotTfTranslationY}`,
        expected: `workspace bounds x:[${WORKSPACE_X_MIN},${WORKSPACE_X_MAX}], y:[${WORKSPACE_Y_MIN},${WORKSPACE_Y_MAX}]`,
        detail: `read_grip_result_v2 정합성 위반[gripSucceed_poseConsistency]: gripSucceed=1(성)인데 robotTfTranslation이 작업범위 밖 — scene_key=${row.sceneKey}, attempt_num=${row.attemptNum}.`,
      });
    }

    return violations;
  }
}
```

### 신규 Read Model — 배선(컨트롤러/서비스/모듈)

```ts
// src/shared/database/schema/index.ts
export * from "./service/read-grip-result-v2";

// src/projection/projection.service.ts (수정)
import { GripResultV2Projector } from '@/projection/projector/grip-result-v2.projector';
@Injectable()
export class ProjectionService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly runner: CatchUpRunner,
    private readonly multimodal: MultiModalProjector,
    private readonly gripResult: GripResultProjector,
    private readonly insertService: InsertService,
    // 신규 v2 프로젝터 주입
    private readonly gripResultV2: GripResultV2Projector,
  ) {
    this.logger.setContext(ProjectionService.name);
  }

  catchUpGripResultV2(): Promise<ProjectionResult> {
    // ⚠️ 신규 테이블 read_grip_result_v2 는 기존 cursor 레인 단호를 분리.
    // 전체 재투영 강제: CatchUpRunner 내부 cursor 로직에서 해당 v2 커서 강제로 0 리셋 해지 전수 적재 시동.
    return this.runner.run(this.gripResultV2);
  }
}

// src/projection/projection.controller.ts (수정)
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
      { action: LogAction.PROJECTION_REQUEST, [LogContext.ROUTE]: "POST /projection/grip-result-v2" },
      "projection 요청 수신",
    );
    return this.projectionService.catchUpGripResultV2();
  }
}

// src/projection/projection.module.ts (providers 등록)
@Module({
  providers: [
    // ... 기존 providers ...
    GripResultV2Projector,
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
import { GripResultV2Projector } from '@/projection/projector/grip-result-v2.projector';
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

  catchUpV2GripResult(): Promise<ProjectionResult> {
    return this.runner.run(this.gripResultV2);
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

  @Post("/grip-result-v2")
  gripResultV2(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/grip-result-v2",
      },
      "projection v2 요청 수신",
    );

    return this.projectionService.catchUpV2GripResult();
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
- actionability (실행 가능성): Docs 의 SQL 과 절차를 그대로 따르면 문제가 해결되는가. [자동 검증 결과]를 실측으로 반영하되, 실행이 되더라도 의도와 다른 일을 하는 SQL(조건이 한 건도 맞지 않는 삭제문, 요구한 컬럼이 없는 테이블 등)은 감점한다. 기존 v1 테이블(read_grip_result, read_multimodal, event_store)을 ALTER/DROP 하면 감점. 5=그대로 따르면 해결(실행 성공 + 요구 충족). 3=오탈자·순서 등 소폭 수정 후 해결. 1=따르면 실패하거나 기존 자산이 손상.
- completeness (완결성): 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소가 모두 유효하고 서로 일치하는가(머리말·SQL 의 테이블명·권고 대상·코드가 서로 같은 것을 가리키는가). 5=세 요소가 모두 유효하고 서로 일치. 3=세 요소가 있으나 서로 어긋나거나 항목이 비어 있음. 1=요소 누락 또는 근거 부족 표시.

다음 형식의 JSON 객체 하나만 출력하라:
{"groundedness": 1-5, "diagnosisAccuracy": 1-5, "actionability": 1-5, "completeness": 1-5, "unsupportedClaims": ["자료에 없는 주장 인용 (없으면 빈 배열)"], "rationale": "각 항목 점수 근거를 항목당 1~2문장으로, 한국어로"}
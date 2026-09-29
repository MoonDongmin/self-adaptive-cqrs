당신은 이벤트 소싱 + CQRS 기반 Physical AI 데이터 플랫폼의 시니어 아키텍트이자 엄격한 평가자다. LLM 파이프라인이 [자료](로그·이벤트·스키마 정보)를 보고 [Docs]를 생성했다. Docs 는 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소를 항상 함께 담아야 하는 단일 산출물이다. 당신은 [정답 요지]와 [자료], [자동 검증 결과]를 기준으로 Docs 를 네 항목의 루브릭으로 채점한다. 채점은 관대하지 않게, 근거 없는 주장·지어낸 값·의도와 다른 SQL·서로 어긋나는 절에는 낮은 점수를 준다. 반드시 JSON 객체 하나만 출력한다. 설명문·마크다운 펜스는 출력하지 않는다.

---

[시나리오] A5-consistency-violation
[상황] 운영 중 센서 관찰기가 파지 센서 값 이상 에피소드를 감지했다.
[정답 요지] 파지 성공(grip_succeed=1) 맥락과 모순되는 센서 값(성공인데 잡을 수 없는 위치/깊이)이 적재됨(정합성 위반). 조치: 성공 맥락 정합성 플래그를 가진 Read Model 보강/격리, v1 무손상.

[자료] — Docs 생성 시 파이프라인이 받은 로그·이벤트·스키마 정보
<<<자료 시작>>>
<logging_context>
## 센서 이상 배치 (관찰자 1차 판정 — 검증 전 가설)
> 사유: [윈도우 1] R5 poseConsistency: sceneKey 반려동물용품_CR01_강아지공룡알장난감_02008 에서 s=1 성공인데 robotTfTranslation z=1.500 이 워크스페이스 [0.95, 1.15] m 밖 / R5 poseConsistency: sceneKey 반려동물용품_CR01_강아지공룡알장난감_02009 에서 s=1 성공인데 grip3dPose z 최댓값 0.398 > 0.30 m / [2차 지목] R5 poseConsistency: sceneKey 반려동물용품_CR01_강아지공룡알장난감_02008 에서 s=1 성공인데 robotTfTranslation z=1.500 이 워크스페이스 [0.95, 1.15] m 밖 / R5 poseConsistency: sceneKey 반려동물용품_CR01_강아지공룡알장난감_02009 에서 s=1 성공인데 grip3dPose z 최댓값 0.398 > 0.30 m
> 의심 sceneKey: 반려동물용품_CR01_강아지공룡알장난감_02008, 반려동물용품_CR01_강아지공룡알장난감_02009
> 위 사유는 소형 1차 관찰자의 출력이라 인용 수치·부등호가 부정확할 수 있는 **가설**이다.
> 근거로 쓸 관측값·부등호는 반드시 아래 원시 레코드에서 재확인해 원문 그대로 인용하고,
> 원시 레코드에서 재확인되지 않는 1차 사유는 기각해라.

### 투영된 센서 값 (JSON 한 줄당 한 레코드)
```json
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_00338","attemptNumber":3,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00338","globalSequence":25,"occurredAt":"2023-10-10T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":1,"grip2dPose":{"xl":910.488,"xr":813.657,"yl":398.957,"yr":326.183},"grip3dPose":{"x1":0.1415531755815133,"x2":0.22288056359809028,"x3":0.24444392846680513,"x4":0.16311654045022816,"x5":0.15177137426574278,"x6":0.23309876228231974,"x7":0.2546621271510346,"x8":0.17333473913445763,"y1":0.8322072064937208,"y2":0.9453139263160791,"y3":0.9294040182603559,"y4":0.8162972984379976,"y5":0.832738542517501,"y6":0.9458452623398593,"y7":0.9299353542841361,"y8":0.8168286344617778,"z1":0.1404852919172044,"z2":0.15436786694591167,"z3":0.1576687942697266,"z4":0.14378621924101934,"z5":0.07629568140522633,"z6":0.0901782564339336,"z7":0.09347918375774852,"z8":0.07959660872904126},"robotTf":{"rotation_3x3":[0.029246,-0.946137,0.322443,-0.99956,-0.029255,0.004819,0.004874,-0.322442,-0.946577],"translation_3x1":[-0.332466,0.755481,1.0337]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[837.7735518085738,290.10657259006973,2,922.5907497697533,349.4941147247116,2],"num_keypoints":2}]}
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_02008","attemptNumber":1,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02008","globalSequence":26,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":1,"grip2dPose":{"xl":1204.54,"xr":1212.75,"yl":236.561,"yr":86.5838},"grip3dPose":{"x1":0.20868815546773717,"x2":0.2120971877954488,"x3":0.2387527114649914,"x4":0.23534367913727977,"x5":0.21891632529401264,"x6":0.22232535762172428,"x7":0.2489808812912669,"x8":0.24557184896355524,"y1":1.0428068422235417,"y2":1.182230370884519,"y3":1.18121236645957,"y4":1.0417888377985927,"y5":1.0481656056476465,"y6":1.1875891343086238,"y7":1.1865711298836747,"y8":1.0471476012226975,"z1":0.1550677646569067,"z2":0.1672930726002786,"z3":0.17147000028617865,"z4":0.15924469234280675,"z5":0.09110161582356402,"z6":0.10332692376693592,"z7":0.10750385145283597,"z8":0.09527854350946408},"robotTf":{"rotation_3x3":[0.999992,0.003878,-0.000419,0.003871,-0.999845,-0.017179,-0.000485,0.017177,-0.999852],"translation_3x1":[-0.011986,0.750103,1.5]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[1175.1586913366034,153.62620220212057,2,1303.2410941754256,148.1836067101173,2],"num_keypoints":2}]}
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02008#1] gripSucceed=1(성공)인데 robotTfTranslationZ=1.5 작업범위 [0.95, 1.15]m 밖 — 잡을 수 없는 위치에서 성공은 모순
⚠ stat [반려동물용품_CR01_강아지공룡알장난감_02008#1] robotTfTranslationZ=1.5 robust-z=70.1 (임계 3.5, 관측 분포 클러스터 밖 — 신규값 참고 정보)
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_02009","attemptNumber":1,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02009","globalSequence":27,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":1,"grip2dPose":{"xl":920.991,"xr":798.483,"yl":346.38,"yr":337.823},"grip3dPose":{"x1":0.20740538493252147,"x2":0.20984938180707235,"x3":0.2363171404040182,"x4":0.2338731435294673,"x5":0.22019766727354934,"x6":0.22264166414810022,"x7":0.24910942274504605,"x8":0.24666542587049517,"y1":0.814845975591995,"y2":0.9546519850385469,"y3":0.9539265540417183,"y4":0.8141205445951665,"y5":0.817787176491084,"y6":0.9575931859376359,"y7":0.9568677549408073,"y8":0.8170617454942555,"z1":0.38576422134704824,"z2":0.3927145164420681,"z3":0.39799954290582784,"z4":0.39104924781080797,"z5":0.3221033475721885,"z6":0.3290536426672084,"z7":0.33433866913096805,"z8":0.32738837403594817},"robotTf":{"rotation_3x3":[0.029246,-0.946137,0.322443,-0.99956,-0.029255,0.004819,0.004874,-0.322442,-0.946577],"translation_3x1":[-0.332466,0.755481,1.0337]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[809.9954836880814,310.80013849516473,2,918.7873224619614,313.3700241831166,2],"num_keypoints":2}]}
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02009#1] gripSucceed=1(성공)인데 grip3dPoseZ(z1)=0.38576422134704824 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02009#1] gripSucceed=1(성공)인데 grip3dPoseZ(z2)=0.3927145164420681 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02009#1] gripSucceed=1(성공)인데 grip3dPoseZ(z3)=0.39799954290582784 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02009#1] gripSucceed=1(성공)인데 grip3dPoseZ(z4)=0.39104924781080797 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02009#1] gripSucceed=1(성공)인데 grip3dPoseZ(z5)=0.3221033475721885 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02009#1] gripSucceed=1(성공)인데 grip3dPoseZ(z6)=0.3290536426672084 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02009#1] gripSucceed=1(성공)인데 grip3dPoseZ(z7)=0.33433866913096805 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02009#1] gripSucceed=1(성공)인데 grip3dPoseZ(z8)=0.32738837403594817 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ stat [반려동물용품_CR01_강아지공룡알장난감_02009#1] grip3dPoseZ(z1)=0.38576422134704824 robust-z=4.0 (임계 3.5, 관측 분포 클러스터 밖 — 신규값 참고 정보)
⚠ stat [반려동물용품_CR01_강아지공룡알장난감_02009#1] grip3dPoseZ(z2)=0.3927145164420681 robust-z=4.2 (임계 3.5, 관측 분포 클러스터 밖 — 신규값 참고 정보)
⚠ stat [반려동물용품_CR01_강아지공룡알장난감_02009#1] grip3dPoseZ(z3)=0.39799954290582784 robust-z=4.3 (임계 3.5, 관측 분포 클러스터 밖 — 신규값 참고 정보)
⚠ stat [반려동물용품_CR01_강아지공룡알장난감_02009#1] grip3dPoseZ(z4)=0.39104924781080797 robust-z=4.1 (임계 3.5, 관측 분포 클러스터 밖 — 신규값 참고 정보)
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
docId: dq-반려동물용품_CR01_강아지공룡알장난감_02008
generatedAt: 2026-08-14T02:44:56.851Z
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

> 결론(TL;DR): `read_grip_result`을(를) 재생성한다 — gripSucceed=1 인데 robotTfTranslationZ=1.5m(외 [0.95,1.15]) 또는 grip3dPoseZ(z1..z8) max 0.398m(외 [0.01,0.30]) 로, 잡을 수 없는 위치/깊이에서 성공 플래그가 켜진 모순. (이상 유형: poseConsistency_Violation · 심각도: critical)

<logging_context>

## 센서 이상 배치 (관찰자 1차 판정 — 검증 전 가설)
> 사유: [윈도우 1] R5 poseConsistency: sceneKey 반려동물용품_CR01_강아지공룡알장난감_02008 에서 s=1 성공인데 robotTfTranslation z=1.500 이 워크스페이스 [0.95, 1.15] m 밖 / R5 poseConsistency: sceneKey 반려동물용품_CR01_강아지공룡알장난감_02009 에서 s=1 성공인데 grip3dPose z 최댓값 0.398 > 0.30 m / [2차 지목] R5 poseConsistency: sceneKey 반려동물용품_CR01_강아지공룡알장난감_02008 에서 s=1 성공인데 robotTfTranslation z=1.500 이 워크스페이스 [0.95, 1.15] m 밖 / R5 poseConsistency: sceneKey 반려동물용품_CR01_강아지공룡알장난감_02009 에서 s=1 성공인데 grip3dPose z 최댓값 0.398 > 0.30 m
> 의심 sceneKey: 반려동물용품_CR01_강아지공룡알장난감_02008, 반려동물용품_CR01_강아지공룡알장난감_02009
> 위 사유는 소형 1차 관찰자의 출력이라 인용 수치·부등호가 부정확할 수 있는 **가설**이다.
> 근거로 쓸 관측값·부등호는 반드시 아래 원시 레코드에서 재확인해 원문 그대로 인용하고,
> 원시 레코드에서 재확인되지 않는 1차 사유는 기각해라.

### 투영된 센서 값 (JSON 한 줄당 한 레코드)
```json
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_00338","attemptNumber":3,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00338","globalSequence":25,"occurredAt":"2023-10-10T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":1,"grip2dPose":{"xl":910.488,"xr":813.657,"yl":398.957,"yr":326.183},"grip3dPose":{"x1":0.1415531755815133,"x2":0.22288056359809028,"x3":0.24444392846680513,"x4":0.16311654045022816,"x5":0.15177137426574278,"x6":0.23309876228231974,"x7":0.2546621271510346,"x8":0.17333473913445763,"y1":0.8322072064937208,"y2":0.9453139263160791,"y3":0.9294040182603559,"y4":0.8162972984379976,"y5":0.832738542517501,"y6":0.9458452623398593,"y7":0.9299353542841361,"y8":0.8168286344617778,"z1":0.1404852919172044,"z2":0.15436786694591167,"z3":0.1576687942697266,"z4":0.14378621924101934,"z5":0.07629568140522633,"z6":0.0901782564339336,"z7":0.09347918375774852,"z8":0.07959660872904126},"robotTf":{"rotation_3x3":[0.029246,-0.946137,0.322443,-0.99956,-0.029255,0.004819,0.004874,-0.322442,-0.946577],"translation_3x1":[-0.332466,0.755481,1.0337]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[837.7735518085738,290.10657259006973,2,922.5907497697533,349.4941147247116,2],"num_keypoints":2}]}
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_02008","attemptNumber":1,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02008","globalSequence":26,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":1,"grip2dPose":{"xl":1204.54,"xr":1212.75,"yl":236.561,"yr":86.5838},"grip3dPose":{"x1":0.20868815546773717,"x2":0.2120971877954488,"x3":0.2387527114649914,"x4":0.23534367913727977,"x5":0.21891632529401264,"x6":0.22232535762172428,"x7":0.2489808812912669,"x8":0.24557184896355524,"y1":1.0428068422235417,"y2":1.182230370884519,"y3":1.18121236645957,"y4":1.0417888377985927,"y5":1.0481656056476465,"y6":1.1875891343086238,"y7":1.1865711298836747,"y8":1.0471476012226975,"z1":0.1550677646569067,"z2":0.1672930726002786,"z3":0.17147000028617865,"z4":0.15924469234280675,"z5":0.09110161582356402,"z6":0.10332692376693592,"z7":0.10750385145283597,"z8":0.09527854350946408},"robotTf":{"rotation_3x3":[0.999992,0.003878,-0.000419,0.003871,-0.999845,-0.017179,-0.000485,0.017177,-0.999852],"translation_3x1":[-0.011986,0.750103,1.5]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[1175.1586913366034,153.62620220212057,2,1303.2410941754256,148.1836067101173,2],"num_keypoints":2}]}
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02008#1] gripSucceed=1(성공)인데 robotTfTranslationZ=1.5 작업범위 [0.95, 1.15]m 밖 — 잡을 수 없는 위치에서 성공은 모순
⚠ stat [반려동물용품_CR01_강아지공룡알장난감_02008#1] robotTfTranslationZ=1.5 robust-z=70.1 (임계 3.5, 관측 분포 클러스터 밖 — 신규값 참고 정보)
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_02009","attemptNumber":1,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02009","globalSequence":27,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":1,"grip2dPose":{"xl":920.991,"xr":798.483,"yl":346.38,"yr":337.823},"grip3dPose":{"x1":0.20740538493252147,"x2":0.20984938180707235,"x3":0.2363171404040182,"x4":0.2338731435294673,"x5":0.22019766727354934,"x6":0.22264166414810022,"x7":0.24910942274504605,"x8":0.24666542587049517,"y1":0.814845975591995,"y2":0.9546519850385469,"y3":0.9539265540417183,"y4":0.8141205445951665,"y5":0.817787176491084,"y6":0.9575931859376359,"y7":0.9568677549408073,"y8":0.8170617454942555,"z1":0.38576422134704824,"z2":0.3927145164420681,"z3":0.39799954290582784,"z4":0.39104924781080797,"z5":0.3221033475721885,"z6":0.3290536426672084,"z7":0.33433866913096805,"z8":0.32738837403594817},"robotTf":{"rotation_3x3":[0.029246,-0.946137,0.322443,-0.99956,-0.029255,0.004819,0.004874,-0.322442,-0.946577],"translation_3x1":[-0.332466,0.755481,1.0337]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[809.9954836880814,310.80013849516473,2,918.7873224619614,313.3700241831166,2],"num_keypoints":2}]}
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02009#1] gripSucceed=1(성공)인데 grip3dPoseZ(z1)=0.38576422134704824 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02009#1] gripSucceed=1(성공)인데 grip3dPoseZ(z2)=0.3927145164420681 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02009#1] gripSucceed=1(성공)인데 grip3dPoseZ(z3)=0.39799954290582784 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02009#1] gripSucceed=1(성공)인데 grip3dPoseZ(z4)=0.39104924781080797 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02009#1] gripSucceed=1(성공)인데 grip3dPoseZ(z5)=0.3221033475721885 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02009#1] gripSucceed=1(성공)인데 grip3dPoseZ(z6)=0.3290536426672084 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02009#1] gripSucceed=1(성공)인데 grip3dPoseZ(z7)=0.33433866913096805 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02009#1] gripSucceed=1(성공)인데 grip3dPoseZ(z8)=0.32738837403594817 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ stat [반려동물용품_CR01_강아지공룡알장난감_02009#1] grip3dPoseZ(z1)=0.38576422134704824 robust-z=4.0 (임계 3.5, 관측 분포 클러스터 밖 — 신규값 참고 정보)
⚠ stat [반려동물용품_CR01_강아지공룡알장난감_02009#1] grip3dPoseZ(z2)=0.3927145164420681 robust-z=4.2 (임계 3.5, 관측 분포 클러스터 밖 — 신규값 참고 정보)
⚠ stat [반려동물용품_CR01_강아지공룡알장난감_02009#1] grip3dPoseZ(z3)=0.39799954290582784 robust-z=4.3 (임계 3.5, 관측 분포 클러스터 밖 — 신규값 참고 정보)
⚠ stat [반려동물용품_CR01_강아지공룡알장난감_02009#1] grip3dPoseZ(z4)=0.39104924781080797 robust-z=4.1 (임계 3.5, 관측 분포 클러스터 밖 — 신규값 참고 정보)
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

> 관측된 robotTfTranslationZ와 grip3dPoseZ가 물리적 잡 가능 범위를 벗어나며 gripSucceed=1 플래그는 명백한 모순 치우치기.

### 심각도 — critical

오염 컬럼은 robotTfTranslation과 grip3dPose가 물리적 불가능 지점에 기록됨. 영향 행수는 두 sceneKey/attempt1 조합으로, downstream 정지 및 모순 치우치기 유발. event_store 원천 payload 보존되어 재투영으로 복원 가능하나, 현재 Read Model v1 스키마와 Projector 로직에는 physical range 검증과 정합성 플래그 부재로 이상이 조용히 통과.

### 기대-실측 델타 근거

- (반려동물용품_CR01_강아지공룡알장난감_02008#1, `robotTf` / robotTfTranslation) 관측 `1.5` vs 기준 `robotTfTranslationZ_workspace` [0.95, 1.15] m → 델타 +0.35 m (upper bound 초과) · 잡 가능 workspace 밖에서 성공 플래그 켜짐.
- (반려동물용품_CR01_강아지공룡알장난감_02009#1, `grip3dPose` / grip3dPose) 관측 `0.39799954290582784` vs 기준 `grip3dPoseZ_depth` [0.01, 0.30] m → 델타 +0.09799954290582784 m (upper bound 초과) · 파지 가능 깊이 밖에서 성공 플래그 켜짐.

### 관찰

- sceneKey 반려동물용품_CR01_강아지공룡알장난감_02008 attempt 1: gripSucceed=1 인데 robotTfTranslationZ=1.5 m 이 workspace [0.95, 1.15] m 밖.
- sceneKey 반려동물용품_CR01_강아지공룡알장난감_02009 attempt 1: gripSucceed=1 인데 grip3dPoseZ 최댓값 0.39799954290582784 m 이 파지 가능 깊이 [0.01, 0.30] m 밖.

### 영향 범위

- event_store
- grip-result-projector
- read_grip_result
- catch-up.runner.ts
- projection.controller.ts

### 근본원인 — projectionOrPipelineFault

1. 관측된 robotTfTranslationZ와 grip3dPoseZ가 물리적 잡 가능 범위를 벗어나며 gripSucceed=1 플래그는 켜진 모순.
2. Projector GripResultProjector 가 원천 payload 를 구조(Zod) 만 검증하고 physical range 판정 로직을 건너뛴다.
3. Read Model v1 스키마 가 jsonb/smallint 타입 만 정의할 뿐, Zod/스키마 검증에 값 이상 판정(physical range check) 이 누락되어 있다.
4. 베이스라인 규칙 문서 에 존재하나, DB 레vel CHECK constraint 와 Projector checkIntegrity 메서드 구현이 부재로 모순 치우치기 조용히 통과.
5. 신규 Read Model v2 설계 가 확정되나 아직 DDL migration 과 프로젝트터 로직 연동이 미적립된 상태.

### 의사결정 기준

- physical_range_enforcement
- data_preservation_in_event_store
- pipeline_integration_cost

### 해결책 옵션 (contain → fix → harden)

#### [contain] 오염 행 격리(DELETE)
- 접근: 즉시 SQL로 이상 원(scene_key, attempt_num) 삭제하여 downstream 정지 방지. 원본은 event_store 에 보존, 재투영으로 복원 가능.
- 트레이드오프: 데이터 영구 손단(재투영 필요), downstream 정지 방지
```sql
-- 오염 행 격리: 이상 (scene_key, attempt_num) 행을 Read Model 에서 제거한다.
-- 원본 이벤트는 event_store 에 보존되므로 v2 재투영(무결성 플래그 포함)으로 복원 가능하다.
DELETE FROM read_grip_result WHERE (scene_key, attempt_num) IN (('반려동물용품_CR01_강아지공룡알장난감_02008', 1), ('반려동물용품_CR01_강아지공룡알장난감_02009', 1));
```

#### [fix] 타깃 패치/재투영(Projector checkIntegrity 로직 삽입)
- 접근: 기존 GripResultProjector 에 checkIntegrity 메서드 구현, Zod/TS 로직으로 범위 판정 시 IntegrityViolation 방출.
- 트레이드오프: 코드 변경 및 테스트 리gression, 즉시 이상 로그 방울 가능
```typescript
checkIntegrity(row: ReadGripResultInsert, event: EventStoreEventRow): IntegrityViolation[] {
  const violations: IntegrityViolation[] = [];
  if (row.gripSucceed !== 1) return violations;
  const zTrans = row.robotTf?.translation_3x1?.[2];
  if (zTrans !== undefined && (zTrans < 0.95 || zTrans > 1.15)) {
    violations.push({ readModelName: 'read_grip_result', sceneKey: row.sceneKey, attemptNum: row.attemptNum, streamId: event.streamId, globalSeq: event.globalSeq, ruleName: 'robotTfTranslationZ_workspace', affectedColumns: ['robot_tf'], observedValue: String(zTrans), expected: '[0.95, 1.15] m', detail: `gripSucceed=1 but robotTfTranslationZ=${zTrans} outside workspace.` });
  }
  const zMax = row.grip3dPose ? Math.max(row.grip3dPose.z1, row.grip3dPose.z2, row.grip3dPose.z3, row.grip3dPose.z4, row.grip3dPose.z5, row.grip3dPose.z6, row.grip3dPose.z7, row.grip3dPose.z8) : undefined;
  if (zMax !== undefined && zMax > 0.30) {
    violations.push({ readModelName: 'read_grip_result', sceneKey: row.sceneKey, attemptNum: row.attemptNum, streamId: event.streamId, globalSeq: event.globalSeq, ruleName: 'grip3dPoseZ_depth', affectedColumns: ['grip_3d_pose'], observedValue: String(zMax), expected: '[0.01, 0.30] m', detail: `gripSucceed=1 but grip3dPoseZ max=${zMax} outside depth range.` });
  }
  return violations;
}
```

#### [harden] 베이스라인 규칙 추가(read_grip_result_v2 설계 채택)
- 접근: 확정 설계 read_grip_result_v2 채택, grip_outlier_flag 열과 CHECK constraint 적용.
- 트레이드오프: DDL migration 실행 필요, 기존 v1 호환성 유지
```sql
DROP TABLE IF EXISTS read_grip_result_v2;
CREATE TABLE read_grip_result_v2 (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  object_name varchar NOT NULL,
  grip_succeed smallint NOT NULL,
  occurred_at timestamptz NOT NULL,
  robot_tf_translation_z double precision,
  grip_3d_pose_z_max double precision,
  grip_outlier_flag smallint NOT NULL CHECK (grip_outlier_flag IN (0, 1)),
  stream_id varchar NOT NULL,
  global_seq bigint NOT NULL,
  PRIMARY KEY (scene_key, attempt_num)
);
CREATE INDEX idx_grip_result_v2_outlier ON read_grip_result_v2 (grip_outlier_flag, occurred_at);
```

### 권장
- harden (read_grip_result_v2 설계 채택)
- 사유: 확정 설계의 grip_outlier_flag 열과 CHECK constraint 를 적용하면 DB 레vel 에서 정합성을 강제하며, event_store 원본 보존 을 따름. v1 모순 치우치기 가 DB 레vel 차단되므로 downstream 정지 및 모순 전파 방지.
- 수용하는 트레이드오프: DDL migration 실행 및 v1 호환성 유지
- 기각한 대안:
  - contain: 데이터 영구 손단(재투영 필요) 으로 운영 효율 저하
  - fix: 코드 로직 만 변경으로는 DB 레vel 정합성 부재, 재투영 시 모순 치우치기 지속

### 즉시 격리 SQL

```sql
-- 오염 행 격리: 이상 (scene_key, attempt_num) 행을 Read Model 에서 제거한다.
-- 원본 이벤트는 event_store 에 보존되므로 v2 재투영(무결성 플래그 포함)으로 복원 가능하다.
DELETE FROM read_grip_result WHERE (scene_key, attempt_num) IN (('반려동물용품_CR01_강아지공룡알장난감_02008', 1), ('반려동물용품_CR01_강아지공룡알장난감_02009', 1));
```

### 하드닝(베이스라인 추가 규칙)

gripSucceed_poseConsistency_v2: robotTfTranslationZ ∈ [0.95, 1.15] m, grip3dPoseZ_max ∈ [0.01, 0.30] m

### 다음 단계

- Implement checkIntegrity in GripResultProjector (`src/projection/projector/grip-result.projector.ts`) — method addition, developer
- Apply v2 migration to DB and update projector upsert logic (`src/shared/database/schema/service/read-grip-result-v2.ts`) — DDL execution & integration, db-admin
- Verify catch-up runner logs IntegrityViolation from new checkIntegrity (`src/projection/runner/catch-up.runner.ts`) — log routing verification, developer

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

- 대상: `read_grip_result_v2` · 키: (scene_key, attempt_num) · 원천 이벤트: GripAttemptRecorded

```sql
DROP TABLE IF EXISTS read_grip_result_v2;

CREATE TABLE read_grip_result_v2 (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  object_name varchar NOT NULL,
  grip_succeed smallint NOT NULL,
  occurred_at timestamptz NOT NULL,
  robot_tf_translation_z double precision,
  grip_3d_pose_z_max double precision,
  grip_outlier_flag smallint NOT NULL,
  stream_id varchar NOT NULL,
  global_seq bigint NOT NULL,
  PRIMARY KEY (scene_key, attempt_num)
);

CREATE INDEX idx_grip_result_v2_outlier ON read_grip_result_v2 (grip_outlier_flag, occurred_at);
```

### 필드

```mschema
# Table: read_grip_result_v2
[
(scene_key:varchar, 장면 식별 키 = stream_id에서 'grip-attempt:' 제거, Primary Key),
(attempt_num:smallint, 동장 내 파지 시도 번호, Primary Key),
(object_name:varchar, 파지 대상 객체명 (payload.objects[0].class_name)),
(grip_succeed:smallint, 파지 성공 여부 (0=실패, 1=성공)),
(occurred_at:timestamptz, 데이터 촬영 일자),
(robot_tf_translation_z:double precision, 로봇 평행이동 Z좌석 (payload.robot_tf.translation_3x1[2])),
(grip_3d_pose_z_max:double precision, 3D 파지점 Z좌석 최댓값 (payload.grip_data.grip_3d_pose.z1..z8)),
(grip_outlier_flag:smallint, 정합성 플래그. robotTfTranslationZ 외 [0.95, 1.15]m 또는 grip3dPoseZMax > 0.30m 시 1),
(stream_id:varchar, ES 스트림 ID (grip-attempt: + scene_key)),
(global_seq:bigint, 투영 출처 이벤트의 ES 전역 시퀀스)
]
```

### 투영 매핑 명세 (이벤트 → 컬럼)

> upsert 키: scene_key,attempt_num · 리플레이: projection_cursor 초기화 시 scene_key/attempt_num 기준 정렬 필수. 전역 재투영 시 upsert 전제(overwrite)로 멱덴성 보장해야.

| 원천 이벤트 | payload 필드 | 컬럼 | 변환 |
| --- | --- | --- | --- |
| GripAttemptRecorded | attemptNumber | attempt_num | verbatim |
| GripAttemptRecorded | objectName | object_name | verbatim |
| GripAttemptRecorded | gripSucceed | grip_succeed | verbatim |
| GripAttemptRecorded | occurredAt | occurred_at | verbatim |
| GripAttemptRecorded | streamId | stream_id | verbatim |
| GripAttemptRecorded | globalSequence | global_seq | verbatim |

파생 컬럼(이벤트 payload 아님):
- `scene_key` ← stream_id에서 'grip-attempt:' 접두 제거
- `grip_outlier_flag` ← robot_tf_translation_z ∉ [0.95, 1.15] OR grip_3d_pose_z_max > 0.30 → 1 else 0

### Insight 카드 등록 (Insight Read DB 동기화)

> DDL 적용 시 아래 카드 등록도 함께 실행한다 — 다음 분석부터 신규 Read Model 이 LLM 컨텍스트에 노출된다.

```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_grip_result_v2', 'read_model', '장별 로봇 파지 결과와 물리적 좌석 정합성 플래그를 직접 적재하여 DB-level SQL 조회/집게 가능. 기존 모델은 jsonb/smallint 만 정의할 뿐, physical range check(로봇 Z/3D Pose Z) 가 누락되어 모순 치우치면 조용히 통과하는 현장을 DB 로직으로 포착.', '(scene_key, attempt_num)')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_grip_result_v2', 'scene_key', 'varchar', '장면 식별 키 = stream_id에서 ''grip-attempt:'' 제거', 1),
  ('read_grip_result_v2', 'attempt_num', 'smallint', '동장 내 파지 시도 번호', 2),
  ('read_grip_result_v2', 'object_name', 'varchar', '파지 대상 객체명 (payload.objects[0].class_name)', 3),
  ('read_grip_result_v2', 'grip_succeed', 'smallint', '파지 성공 여부 (0=실패, 1=성공)', 4),
  ('read_grip_result_v2', 'occurred_at', 'timestamptz', '데이터 촬영 일자', 5),
  ('read_grip_result_v2', 'robot_tf_translation_z', 'double precision', '로봇 평행이동 Z좌석 (payload.robot_tf.translation_3x1[2])', 6),
  ('read_grip_result_v2', 'grip_3d_pose_z_max', 'double precision', '3D 파지점 Z좌석 최댓값 (payload.grip_data.grip_3d_pose.z1..z8)', 7),
  ('read_grip_result_v2', 'grip_outlier_flag', 'smallint', '정합성 플래그. robotTfTranslationZ 외 [0.95, 1.15]m 또는 grip3dPoseZMax > 0.30m 시 1', 8),
  ('read_grip_result_v2', 'stream_id', 'varchar', 'ES 스트림 ID (grip-attempt: + scene_key)', 9),
  ('read_grip_result_v2', 'global_seq', 'bigint', '투영 출처 이벤트의 ES 전역 시퀀스', 10)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased (v1 → v2)

#### Added
- read_grip_result_v2 테이블, GripResultV2Projector, /grip-result-v2 라우트 배선
#### Fixed
- poseConsistency_Violation 근본원인: robotTfTranslationZ 및 grip3dPoseZMax physical range 판정 누락 치우치기 전 단계 Read Model 레이어 고착

### 마이그레이션 절차

- 하위호환 변경: -
- 파괴적 변경: 없음
- 컷오버 전 테스트: 모든 v1 read_grip_result gripSucceed=1 행에 대해 v2 read_grip_result_v2 매칭 row의 grip_outlier_flag가 0인지를 전수 검증. outlier_flag=1인 경우 physical consistency 위반이므로 컷오버 보류.
- 롤백 창/조건: read_grip_result_v2 테이블 DROP, GripResultV2Projector DI/라우트 제거, schema/index.ts revert. v1 레거시 쿼리 재적재.
- Insight 카드 등록: §2의 카드 등록 SQL을 DDL과 함께 적용(카탈로그 동기화)

### 사유·호환성

- 사유: 기존 v1 GripResultProjector.map() 메서드는 payload.raw 값만 투영할 뿐, robotTfTranslationZ와 grip3dPoseZMax에 대한 physical range 검증(정합성 규칙)이 누락되어 있어 graspSucceed=1 플래그가 비현장/workspace 밖 위치/깊이에서 조용히 통과하는 모순을 발생함. v2 신규 Read Model(read_grip_result_v2)과 GripResultV2Projector는 Z좌석 추출, outlier_flag 계산, 정합성 판정을 Read Model 레이어에 고착으로 근본원인 치우치기 전 단계.
- 트리거 근거: [_02008#1] robotTfTranslationZ=1.5 작업범위 [0.95, 1.15]m 밖 — 잡을 수 없는 위치에서 성공은 모순
[_02009#1] grip3dPoseZ(z1)=0.38576422134704824 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
[_02009#1] grip3dPoseZ(z3)=0.39799954290582784 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
- v1 호환성: v1 read_grip_result 테이블·프로젝터·라우트·DI 전수 무손상 유지. v2는 신규 테이블(read_grip_result_v2)과 독립 프로젝터 배선으로 운영. 컷오버 전 v1 gripSucceed=1 행의 physical consistency를 v2 grip_outlier_flag=0 매칭으로 검증해야 하며, v1 레거시 쿼리는 backwardCompatibleChanges로 유지.

### 변경 파일

- `src/shared/database/schema/index.ts` (modifyFile) — 신규 v2 스키마 export 배선. 기존 v1 export 무손상.
- `src/projection/projection.service.ts` (modifyFile) — GripResultV2Projector DI 배선 및 catchUp 메서드 추가. 기존 v1 서비스/메서드 무손상.
- `src/projection/projection.controller.ts` (modifyFile) — /grip-result-v2 라우트 배선. 기존 v1 라우트 무손상.

## Optional — 부속 자료(컨텍스트 축소 시 생략 가능)

### 신규 Read Model — Drizzle 스키마

```ts
import { bigint, doublePrecision, index, pgTable, primaryKey, smallint, timestamp, varchar } from 'drizzle-orm/pg-core';

export const readGripResultV2 = pgTable(
  "read_grip_result_v2",
  {
    sceneKey: varchar("scene_key").notNull(),
    attemptNum: smallint("attempt_num").notNull(),

    objectName: varchar("object_name").notNull(),
    gripSucceed: smallint("grip_succeed").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),

    robotTfTranslationZ: doublePrecision("robot_tf_translation_z"),
    grip3dPoseZMax: doublePrecision("grip_3d_pose_z_max"),

    gripOutlierFlag: smallint("grip_outlier_flag").notNull(),

    streamId: varchar("stream_id").notNull(),
    globalSeq: bigint("global_seq", { mode: "number" }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.sceneKey, t.attemptNum] }),
    index("idx_grip_result_v2_outlier").on(t.gripOutlierFlag, t.occurredAt),
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

    const robotTfZ: number = payload.robot_tf.translation_3x1[2];
    const zValues: number[] = [
      payload.grip_data.grip_3d_pose.z1,
      payload.grip_data.grip_3d_pose.z2,
      payload.grip_data.grip_3d_pose.z3,
      payload.grip_data.grip_3d_pose.z4,
      payload.grip_data.grip_3d_pose.z5,
      payload.grip_data.grip_3d_pose.z6,
      payload.grip_data.grip_3d_pose.z7,
      payload.grip_data.grip_3d_pose.z8,
    ];
    const grip3dPoseZMax: number = Math.max(...zValues);

    const robotTfZOutlier: boolean = robotTfZ < 0.95 || robotTfZ > 1.15;
    const grip3dPoseZMaxOutlier: boolean = grip3dPoseZMax > 0.30;
    const gripOutlierFlag: number = robotTfZOutlier || grip3dPoseZMaxOutlier ? 1 : 0;

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
      robotTfTranslationZ: robotTfZ,
      grip3dPoseZMax: grip3dPoseZMax,
      gripOutlierFlag: gripOutlierFlag,
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
          robotTfTranslationZ: row.robotTfTranslationZ,
          grip3dPoseZMax: row.grip3dPoseZMax,
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

// src/projection/projection.service.ts (신규 메서드 추가)
catchUpGripResultV2(): Promise<ProjectionResult> {
  // 신규 모델은 기존 read_grip_result ALTER 하지. 전체 재투영 강제: cursor 리셋 0.
  return this.runner.run(this.gripResultV2);
}

// src/projection/projection.controller.ts (신규 라우트 추가)
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

// src/projection/projection.module.ts (providers 등록)
providers: [/* 기존 providers */, GripResultV2Projector],
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

  catchUpGripResultV2(): Promise<ProjectionResult> {
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
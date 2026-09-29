당신은 이벤트 소싱 + CQRS 기반 Physical AI 데이터 플랫폼의 시니어 아키텍트이자 엄격한 평가자다. LLM 파이프라인이 [자료](로그·이벤트·스키마 정보)를 보고 [Docs]를 생성했다. Docs 는 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소를 항상 함께 담아야 하는 단일 산출물이다. 당신은 [정답 요지]와 [자료], [자동 검증 결과]를 기준으로 Docs 를 네 항목의 루브릭으로 채점한다. 채점은 관대하지 않게, 근거 없는 주장·지어낸 값·의도와 다른 SQL·서로 어긋나는 절에는 낮은 점수를 준다. 실행·컴파일이 통과했다는 사실만으로 실행 가능성이나 완결성에 높은 점수를 주지 않는다. SQL 과 코드 블록을 실제로 읽고 루브릭의 점검 항목을 하나씩 확인한다. 반드시 JSON 객체 하나만 출력한다. 설명문·마크다운 펜스는 출력하지 않는다.

---

[시나리오] A7-grip-depth-underflow
[상황] 운영 중 센서 관찰기가 파지 센서 값 이상 에피소드를 감지했다.
[정답 요지] 파지 성공 맥락인데 파지 깊이 z1~z8 이 전부 0.01m 미만(하한 위반)으로, 성공과 모순되는 정합성 위반. 조치: 최소 깊이·하한 위반 플래그를 가진 Read Model 보강/격리, v1 무손상.

[자료] — Docs 생성 시 파이프라인이 받은 로그·이벤트·스키마 정보
<<<자료 시작>>>
<logging_context>
## 센서 이상 배치 (관찰자 1차 판정 — 검증 전 가설)
> 사유: [윈도우 1] R5 poseConsistency: s=1 성공인데 robotTfTranslation z=1.038 은 워크스페이스 [0.95, 1.15] m 범위 안이지만, grip3dPose z 최솟값 0.008 m 이 물리 하한 0.01 m 보다 작아 잡을 수 없는 깊이 / R5 정합성 위반 / [2차 지목] R2 depthPositive: 반려동물용품_CR01_강아지공룡알장난감_02018#1 에서 minz=0.008 ≤ 0.01 (물리적으로 불가능한 극단적 얕은 깊이) / R5 poseConsistency: 반려동물용품_CR01_강아지공룡알장난감_02018#1 에서 s=1 성공인데 tz=1.038 이 워크스페이스 하한 0.95 보다 낮음 (1.038 < 0.95) / R5 poseConsistency: 반려동물용품_CR01_강아지공룡알장난감_02019#1 에서 s=1 성공인데 tz=1.038 이 워크스페이스 하한 0.95 보다 낮음 (1.038 < 0.95)
> 의심 sceneKey: 반려동물용품_CR01_강아지공룡알장난감_02018, 반려동물용품_CR01_강아지공룡알장난감_02019
> 위 사유는 소형 1차 관찰자의 출력이라 인용 수치·부등호가 부정확할 수 있는 **가설**이다.
> 근거로 쓸 관측값·부등호는 반드시 아래 원시 레코드에서 재확인해 원문 그대로 인용하고,
> 원시 레코드에서 재확인되지 않는 1차 사유는 기각해라.

### 투영된 센서 값 (JSON 한 줄당 한 레코드)
```json
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_00226","attemptNumber":1,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00226","globalSequence":25,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":0,"grip2dPose":{"xl":784.822,"xr":700.891,"yl":741.938,"yr":630.937},"grip3dPose":{"x1":-0.199450014791367,"x2":-0.28640285211019534,"x3":-0.2656118311615029,"x4":-0.17865899384267456,"x5":-0.18996650077633348,"x6":-0.2769193380951618,"x7":-0.25612831714646933,"x8":-0.16917547982764103,"y1":0.5371453145659518,"y2":0.6461534381514451,"y3":0.6630953288256005,"y4":0.5540872052401072,"y5":0.5373319555750138,"y6":0.6463400791605071,"y7":0.6632819698346625,"y8":0.5542738462491692,"z1":0.14888378212413161,"z2":0.1363764612849113,"z3":0.1394918727017228,"z4":0.1519991935409431,"z5":0.08457959775747938,"z6":0.07207227691825906,"z7":0.07518768833507057,"z8":0.08769500917429089},"robotTf":{"rotation_3x3":[0.999992,0.003878,-0.000419,0.003871,-0.999845,-0.017179,-0.000485,0.017177,-0.999852],"translation_3x1":[-0.011986,0.750103,1.02053]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[672.4345935848123,684.1255949352643,2,667.8582107161069,807.9573634810615,2],"num_keypoints":2}]}
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_02018","attemptNumber":1,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02018","globalSequence":26,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":1,"grip2dPose":{"xl":951.079,"xr":1098.33,"yl":807.832,"yr":813.644},"grip3dPose":{"x1":0.16475296398674474,"x2":0.17330658103438495,"x3":0.19772017225257327,"x4":0.18916655520493306,"x5":0.19222857061573467,"x6":0.20078218766337488,"x7":0.2251957788815632,"x8":0.21664216183392299,"y1":0.8156262802722475,"y2":0.9551216936901339,"y3":0.9529558077348521,"y4":0.8134603943169657,"y5":0.8174187515339728,"y6":0.9569141649518592,"y7":0.9547482789965774,"y8":0.815252865578691,"z1":0.008231681976014742,"z2":0.008643583878096137,"z3":0.0092098998275888,"z4":0.008797997925507405,"z5":0.005287671918650429,"z6":0.005699573820731824,"z7":0.006265889770224487,"z8":0.005853987868143092},"robotTf":{"rotation_3x3":[0.014497,0.909648,-0.415128,0.999887,-0.011494,0.009732,0.004081,-0.415222,-0.909711],"translation_3x1":[0.327688,0.821407,1.03805]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[1029.6659401614954,798.8841194965165,2,1034.7114781433231,932.4941213334656,2],"num_keypoints":2}]}
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02018#1] gripSucceed=1(성공)인데 grip3dPoseZ(z1)=0.008231681976014742 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02018#1] gripSucceed=1(성공)인데 grip3dPoseZ(z2)=0.008643583878096137 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02018#1] gripSucceed=1(성공)인데 grip3dPoseZ(z3)=0.0092098998275888 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02018#1] gripSucceed=1(성공)인데 grip3dPoseZ(z4)=0.008797997925507405 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02018#1] gripSucceed=1(성공)인데 grip3dPoseZ(z5)=0.005287671918650429 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02018#1] gripSucceed=1(성공)인데 grip3dPoseZ(z6)=0.005699573820731824 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02018#1] gripSucceed=1(성공)인데 grip3dPoseZ(z7)=0.006265889770224487 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02018#1] gripSucceed=1(성공)인데 grip3dPoseZ(z8)=0.005853987868143092 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_02019","attemptNumber":1,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02019","globalSequence":27,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":1,"grip2dPose":{"xl":656.657,"xr":801.407,"yl":813.692,"yr":828.131},"grip3dPose":{"x1":0.16896221497528283,"x2":0.1848493909394196,"x3":0.20992890197682607,"x4":0.1940417260126893,"x5":0.19188072131121459,"x6":0.20776789727535136,"x7":0.23284740831275783,"x8":0.21696023234862105,"y1":0.5377019333556028,"y2":0.6766896263186952,"y3":0.6734498983485733,"y4":0.5344622053854808,"y5":0.537479950175437,"y6":0.6764676431385295,"y7":0.6732279151684075,"y8":0.5342402222053151,"z1":0.008564493079812194,"z2":0.008838440358872001,"z3":0.009311521453411343,"z4":0.009037574174351536,"z5":0.005523238079488488,"z6":0.005797185358548294,"z7":0.006270266453087635,"z8":0.0059963191740278286},"robotTf":{"rotation_3x3":[0.014497,0.909648,-0.415128,0.999887,-0.011494,0.009732,0.004081,-0.415222,-0.909711],"translation_3x1":[0.327688,0.821407,1.03805]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[641.0894514521013,863.4502108547322,2,770.6156501152399,873.940681061053,2],"num_keypoints":2}]}
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02019#1] gripSucceed=1(성공)인데 grip3dPoseZ(z1)=0.008564493079812194 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02019#1] gripSucceed=1(성공)인데 grip3dPoseZ(z2)=0.008838440358872001 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02019#1] gripSucceed=1(성공)인데 grip3dPoseZ(z3)=0.009311521453411343 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02019#1] gripSucceed=1(성공)인데 grip3dPoseZ(z4)=0.009037574174351536 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02019#1] gripSucceed=1(성공)인데 grip3dPoseZ(z5)=0.005523238079488488 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02019#1] gripSucceed=1(성공)인데 grip3dPoseZ(z6)=0.005797185358548294 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02019#1] gripSucceed=1(성공)인데 grip3dPoseZ(z7)=0.006270266453087635 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02019#1] gripSucceed=1(성공)인데 grip3dPoseZ(z8)=0.0059963191740278286 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
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
- SQL 실행: 블록 4개 중 4개 실행 성공
- 코드 컴파일: 파일 4개 중 3개 통과 / 실패: src/projection/projector/grip-result-projector-v2.ts: [object Object]

[저장소 파일 확인] — 파이프라인은 진단 도구로 저장소 소스 코드를 조회할 수 있다. Docs 가 인용한 파일 경로의 실재 여부와 앞부분 발췌이다.
- 저장소에 실재하는 파일 (5건): src/projection/projection.controller.ts, src/projection/projection.service.ts, src/projection/projector/grip-result.projector.ts, src/projection/runner/catch-up.runner.ts, src/shared/database/schema/index.ts
- 저장소에 없는 파일 (2건): src/projection/projector/grip-result-projector-v2.ts, src/shared/database/schema/service/read-grip-result-v2.ts

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
docId: dq-반려동물용품_CR01_강아지공룡알장난감_02018
generatedAt: 2026-08-14T11:41:55.913Z
targetReadModel: read_grip_result
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: v1
  to: v2
  affectedEndpoints:
    - "POST /multimodal"
    - "POST /grip-result"
    - "POST /v2/grip-result"
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

> 결론(TL;DR): `read_grip_result`을(를) 보강한다 — sceneKey 02018/02019#1에서 gripSucceed=1인데 grip3dPoseZ(z1~z8)가 모두 ~0.005~0.009m로 물리적 하한 0.01m 미만. robotTfTranslation z는 정상(1.038m). consistency rule gripSucceed_poseConsistency 위반. (이상 유형: sensor_baseline_deviation · 심각도: critical)

<logging_context>

## 센서 이상 배치 (관찰자 1차 판정 — 검증 전 가설)
> 사유: [윈도우 1] R5 poseConsistency: s=1 성공인데 robotTfTranslation z=1.038 은 워크스페이스 [0.95, 1.15] m 범위 안이지만, grip3dPose z 최솟값 0.008 m 이 물리 하한 0.01 m 보다 작아 잡을 수 없는 깊이 / R5 정합성 위반 / [2차 지목] R2 depthPositive: 반려동물용품_CR01_강아지공룡알장난감_02018#1 에서 minz=0.008 ≤ 0.01 (물리적으로 불가능한 극단적 얕은 깊이) / R5 poseConsistency: 반려동물용품_CR01_강아지공룡알장난감_02018#1 에서 s=1 성공인데 tz=1.038 이 워크스페이스 하한 0.95 보다 낮음 (1.038 < 0.95) / R5 poseConsistency: 반려동물용품_CR01_강아지공룡알장난감_02019#1 에서 s=1 성공인데 tz=1.038 이 워크스페이스 하한 0.95 보다 낮음 (1.038 < 0.95)
> 의심 sceneKey: 반려동물용품_CR01_강아지공룡알장난감_02018, 반려동물용품_CR01_강아지공룡알장난감_02019
> 위 사유는 소형 1차 관찰자의 출력이라 인용 수치·부등호가 부정확할 수 있는 **가설**이다.
> 근거로 쓸 관측값·부등호는 반드시 아래 원시 레코드에서 재확인해 원문 그대로 인용하고,
> 원시 레코드에서 재확인되지 않는 1차 사유는 기각해라.

### 투영된 센서 값 (JSON 한 줄당 한 레코드)
```json
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_00226","attemptNumber":1,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00226","globalSequence":25,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":0,"grip2dPose":{"xl":784.822,"xr":700.891,"yl":741.938,"yr":630.937},"grip3dPose":{"x1":-0.199450014791367,"x2":-0.28640285211019534,"x3":-0.2656118311615029,"x4":-0.17865899384267456,"x5":-0.18996650077633348,"x6":-0.2769193380951618,"x7":-0.25612831714646933,"x8":-0.16917547982764103,"y1":0.5371453145659518,"y2":0.6461534381514451,"y3":0.6630953288256005,"y4":0.5540872052401072,"y5":0.5373319555750138,"y6":0.6463400791605071,"y7":0.6632819698346625,"y8":0.5542738462491692,"z1":0.14888378212413161,"z2":0.1363764612849113,"z3":0.1394918727017228,"z4":0.1519991935409431,"z5":0.08457959775747938,"z6":0.07207227691825906,"z7":0.07518768833507057,"z8":0.08769500917429089},"robotTf":{"rotation_3x3":[0.999992,0.003878,-0.000419,0.003871,-0.999845,-0.017179,-0.000485,0.017177,-0.999852],"translation_3x1":[-0.011986,0.750103,1.02053]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[672.4345935848123,684.1255949352643,2,667.8582107161069,807.9573634810615,2],"num_keypoints":2}]}
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_02018","attemptNumber":1,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02018","globalSequence":26,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":1,"grip2dPose":{"xl":951.079,"xr":1098.33,"yl":807.832,"yr":813.644},"grip3dPose":{"x1":0.16475296398674474,"x2":0.17330658103438495,"x3":0.19772017225257327,"x4":0.18916655520493306,"x5":0.19222857061573467,"x6":0.20078218766337488,"x7":0.2251957788815632,"x8":0.21664216183392299,"y1":0.8156262802722475,"y2":0.9551216936901339,"y3":0.9529558077348521,"y4":0.8134603943169657,"y5":0.8174187515339728,"y6":0.9569141649518592,"y7":0.9547482789965774,"y8":0.815252865578691,"z1":0.008231681976014742,"z2":0.008643583878096137,"z3":0.0092098998275888,"z4":0.008797997925507405,"z5":0.005287671918650429,"z6":0.005699573820731824,"z7":0.006265889770224487,"z8":0.005853987868143092},"robotTf":{"rotation_3x3":[0.014497,0.909648,-0.415128,0.999887,-0.011494,0.009732,0.004081,-0.415222,-0.909711],"translation_3x1":[0.327688,0.821407,1.03805]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[1029.6659401614954,798.8841194965165,2,1034.7114781433231,932.4941213334656,2],"num_keypoints":2}]}
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02018#1] gripSucceed=1(성공)인데 grip3dPoseZ(z1)=0.008231681976014742 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02018#1] gripSucceed=1(성공)인데 grip3dPoseZ(z2)=0.008643583878096137 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02018#1] gripSucceed=1(성공)인데 grip3dPoseZ(z3)=0.0092098998275888 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02018#1] gripSucceed=1(성공)인데 grip3dPoseZ(z4)=0.008797997925507405 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02018#1] gripSucceed=1(성공)인데 grip3dPoseZ(z5)=0.005287671918650429 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02018#1] gripSucceed=1(성공)인데 grip3dPoseZ(z6)=0.005699573820731824 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02018#1] gripSucceed=1(성공)인데 grip3dPoseZ(z7)=0.006265889770224487 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02018#1] gripSucceed=1(성공)인데 grip3dPoseZ(z8)=0.005853987868143092 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_02019","attemptNumber":1,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02019","globalSequence":27,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":1,"grip2dPose":{"xl":656.657,"xr":801.407,"yl":813.692,"yr":828.131},"grip3dPose":{"x1":0.16896221497528283,"x2":0.1848493909394196,"x3":0.20992890197682607,"x4":0.1940417260126893,"x5":0.19188072131121459,"x6":0.20776789727535136,"x7":0.23284740831275783,"x8":0.21696023234862105,"y1":0.5377019333556028,"y2":0.6766896263186952,"y3":0.6734498983485733,"y4":0.5344622053854808,"y5":0.537479950175437,"y6":0.6764676431385295,"y7":0.6732279151684075,"y8":0.5342402222053151,"z1":0.008564493079812194,"z2":0.008838440358872001,"z3":0.009311521453411343,"z4":0.009037574174351536,"z5":0.005523238079488488,"z6":0.005797185358548294,"z7":0.006270266453087635,"z8":0.0059963191740278286},"robotTf":{"rotation_3x3":[0.014497,0.909648,-0.415128,0.999887,-0.011494,0.009732,0.004081,-0.415222,-0.909711],"translation_3x1":[0.327688,0.821407,1.03805]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[641.0894514521013,863.4502108547322,2,770.6156501152399,873.940681061053,2],"num_keypoints":2}]}
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02019#1] gripSucceed=1(성공)인데 grip3dPoseZ(z1)=0.008564493079812194 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02019#1] gripSucceed=1(성공)인데 grip3dPoseZ(z2)=0.008838440358872001 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02019#1] gripSucceed=1(성공)인데 grip3dPoseZ(z3)=0.009311521453411343 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02019#1] gripSucceed=1(성공)인데 grip3dPoseZ(z4)=0.009037574174351536 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02019#1] gripSucceed=1(성공)인데 grip3dPoseZ(z5)=0.005523238079488488 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02019#1] gripSucceed=1(성공)인데 grip3dPoseZ(z6)=0.005797185358548294 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02019#1] gripSucceed=1(성공)인데 grip3dPoseZ(z7)=0.006270266453087635 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
⚠ consistency [반려동물용품_CR01_강아지공룡알장난감_02019#1] gripSucceed=1(성공)인데 grip3dPoseZ(z8)=0.0059963191740278286 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순
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

> 감지된 이상은 성공(gripSucceed=1)과 물리적 하한 미달(grip3dPoseZ < 0.01m)의 모순 정합성 위이로, 즉시 격리 및 판정 로직 보완이 필하다.

### 심각도 — critical

오염 컬럼 grip_3d_pose(jsonb) / 영향 행수 2건(sceneKey _02018#1, _02019#1) / event_store 원천 데이터 보존되어 재투영으로 복원 가능하나, 현재 downstream 정합성 판정 부재로 오염이 조용히 유입됨.

### 기대-실측 델타 근거

- (반려동물용품_CR01_강아지공룡알장난감_02018#1, `grip3dPose` / grip3dPose) 관측 `gripSucceed=1(성공)인데 grip3dPoseZ(z1)=0.008231681976014742 파지 가능 깊이 [0.01, 0.3]m 밖` vs 기준 `gripSucceed_poseConsistency` grip_succeed=1(성공) 이면 robotTfTranslation 이 workspace 범위 안, grip3dPoseZ 가 [0.01, 0.30] m 안이어야 한다. → 델타 하한 0.01m 미달 (차이 0.001768318023985258m) · 물리적 하한 미달로 잡을 수 없는 깊이이나 성공 플래그 설정됨 — 센서 오염 또는 투영 결함 가설

### 관찰

- gripSucceed=1 기록되나 grip3dPoseZ(z1~z8) 모두 ~0.005~0.009m로 물리적 하한 0.01m 미만. robotTfTranslation z는 정상(1.038m). consistency rule gripSucceed_poseConsistency 위반.
- read_grip_result 스키마(jsonb)가 구조만 검증, 수치 범위·조건부 정합성(gripSucceed=1 시 depth/translation 동치) Zod 검증 미구현. 이상값이 조용히 통과.

### 영향 범위

- event_store
- grip-result-projector
- read_grip_result
- catch-up.runner.ts
- API /projection/grip-result

### 근본원인 — projectionOrPipelineFault

1. 관측 증상: gripSucceed=1인데 grip3dPoseZ < 0.01m
2. 왜? 정합성 판정 로직이 미구현되어 모순 조합을 허용함
3. 왜? Zod 스키마는 구조만 검증, 수치 범위/조건부 정합성 규칙 적용이 누락됨
4. 왜? Projector.checkIntegrity() 메서드 미구현 또는 미호출됨
5. 왜? 시스템적 이상 판정 부재 — 구조적 zod만 존재

### 의사결정 기준

- 데이터 보존(event_store 원천 유지) vs 격리 우선도
- 판정 로직 적용(하류 유입 차단) vs 즉시 격리(SQL)
- 베이스라인 규칙 보완(지속성)

### 해결책 옵션 (contain → fix → harden)

#### [contain] 오염 행 격리
- 접근: 원천 event_store 보존하며 read_grip_result 해당 (scene_key, attempt_num) 행 삭제하여 하류 유입 차단
- 트레이드오프: 재투영 필요 시 원천 복원 가능하나 현재 세션 데이터 손단
```sql
-- 오염 행 격리: 이상 (scene_key, attempt_num) 행을 Read Model 에서 제거한다.
-- 원본 이벤트는 event_store 에 보존되므로 v2 재투영(무결성 플래그 포함)으로 복원 가능하다.
DELETE FROM read_grip_result WHERE (scene_key, attempt_num) IN (('반려동물용품_CR01_강아지공룡알장난감_02018', 1));
```

#### [fix] 정합성 판로직 적용
- 접근: GripResultProjector.checkIntegrity() 구현하여 gripSucceed=1 시 depth 하한 미달 감지 및 IntegrityViolation 방출
- 트레이드오프: 프로젝터 로직 수정 필요하나 원천 데이터 보존됨
```typescript
// src/projection/projector/grip-result.projector.ts
  checkIntegrity(row: ReadGripResultInsert): IntegrityViolation[] {
    const violations: IntegrityViolation[] = [];
    if (row.gripSucceed === 1) {
      const pose3d = row.grip3dPose as { z1: number; z2: number; z3: number; z4: number; z5: number; z6: number; z7: number; z8: number };
      const minZ = Math.min(pose3d.z1, pose3d.z2, pose3d.z3, pose3d.z4, pose3d.z5, pose3d.z6, pose3d.z7, pose3d.z8);
      if (minZ < 0.01) {
        violations.push({
          readModelName: 'read_grip_result',
          sceneKey: row.sceneKey,
          attemptNum: row.attemptNum,
          streamId: row.streamId,
          globalSeq: row.globalSeq,
          ruleName: 'gripSucceed_poseConsistency',
          affectedColumns: ['grip_3d_pose'],
          observedValue: `minZ=${minZ.toFixed(6)}m`,
          expected: '[0.01, 0.30] m',
          detail: `정합성 위반[poseConsistency]: gripSucceed=1인데 물리적 하한 미달(minZ < 0.01m). scene_key=${row.sceneKey}, attempt_num=${row.attemptNum}.`,
        });
      }
    }
    return violations;
  }
```

#### [harden] 베이스라인 규칙 추가
- 접근: read_grip_result jsonb CHECK CONSTRAINT 또는 별도 검증 테이블 로직 도입
- 트레이드오프: DB 스키마 변경으로 마이그레이션 필요하나 영구히 방지
```sql
-- jsonb 중첩 키 직접 CHECK 제약은 포스트그레스에서는 지원하지. 별도 정합성 검증 테이블 도입 권장.
ALTER TABLE read_grip_result ADD COLUMN grip_depth_valid boolean DEFAULT true;
```

### 권장
- 정합성 판로직 적용(fix)
- 사유: 원천 데이터 보존하며 하류 유입 차단이 필하다. contain은 재투영 필요 시 복원 가능하나 현재 세션 손단, harden은 DB 마이그레이션 부담. fix가 가장 균형 잡힘.
- 수용하는 트레이드오프: 프로젝터 로직 수정 및 테스트 보강 필요
- 기각한 대안:
  - contain: 데이터 손단 발생
  - harden: DB 스키마 변경으로 인한 마이그레이션 비용 과다

### 즉시 격리 SQL

```sql
-- 오염 행 격리: 이상 (scene_key, attempt_num) 행을 Read Model 에서 제거한다.
-- 원본 이벤트는 event_store 에 보존되므로 v2 재투영(무결성 플래그 포함)으로 복원 가능하다.
DELETE FROM read_grip_result WHERE (scene_key, attempt_num) IN (('반려동물용품_CR01_강아지공룡알장난감_02018', 1));
```

### 하드닝(베이스라인 추가 규칙)

rule: gripSucceed_poseConsistency_depthLowerBound expected: grip_succeed=1 시 min(grip3dPose.z1..z8) >= 0.01 m

### 다음 단계

- GripResultProjector.checkIntegrity() 메서드 구현 (`src/projection/projector/grip-result.projector.ts`) — 메서드 추가/테스트 보강, 프로젝터 개발자
- CatchUpRunner 이상 로그 방출 로직 연동 확인 (`src/projection/runner/catch-up.runner.ts`) — 로직 검증/연동, 프로젝터 운영자

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### 위반 레코드 식별·검증 SQL — 신규 DDL 대신 센서 근거 레코드의 실측 확인이 §2 조치다

```sql
-- 센서 무결성 위반 레코드 식별·검증 SELECT (sensorEvidence 결정론 합성 — 데이터 변경 없음)
-- ⚠ 격리/수정 DDL 은 아래 검증 결과를 확인한 뒤 인간 승인 하에 별도 실행한다.
SELECT scene_key, attempt_num, object_name, grip_succeed, occurred_at
FROM read_grip_result
WHERE (scene_key, attempt_num) IN (
  ('반려동물용품_CR01_강아지공룡알장난감_02018', 1)
);

-- 원천 이벤트 대조 (event_store 재처리/복구 앵커)
SELECT global_seq, stream_id, attempt_num, occurred_at
FROM event_store
WHERE global_seq IN (26);
```

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased (v1 → v2)

#### Added
- read_grip_result_v2 테이블, GripResultProjectorV2 프로젝트, /v2/grip-result 라우트
#### Fixed
- gripSucceed=1 시 z-depth 하한/상한 [0.01, 0.3]m 및 poseConsistency 정합성 규칙 위반 차단(v2)

### 마이그레이션 절차

- 하위호환 변경: v2 테이블·프로젝터·라우트 추가만, v1 기존 코드는 수정·삭제 금지; CatchUpRunner 가 v1/v2 동시 투영 가능
- 파괴적 변경: 없음
- 컷오버 전 테스트: SELECT scene_key, attempt_num FROM read_grip_result_v2 WHERE pose_consistency_valid = 0 AND grip_succeed = 1; — 결과 공이 cutover 전 검증
- 롤백 창/조건: DROP TABLE read_grip_result_v2; revert DI/route/schema/index.ts additions. v1 원복.

### 사유·호환성

- 사유: 기존 v1 read_grip_result 스키마는 grip3dPose 만 jsonb 로 저장할 뿐, gripSucceed=1 시 물리적 하한/상한 [0.01, 0.3]m 준수 및 poseConsistency 정합성 규칙을 Zod/DB 레벨에서 검증하지 구현해 미구현. 이상값(~0.005~0.009m) 이 조용히 통과 downstream 판정만 감지. v2 는 새 테이블+프로젝터로 동시 보존하며, map() 시 depthMinMeters/poseConsistencyValid 계산과 checkIntegrity() 규칙 위반 방출을 구현해 근본원인 차단.
- 트리거 근거: ⚠ consistency [반..._02018#1] gripSucceed=1(성공)인데 grip3dPoseZ(z5)=0.005287671918650429 파지 가능 깊이 [0.01, 0.3]m 밖 — 닿지 않는 깊이에서 성공은 모순 [corr:R5]. v1 GripResultProjector.map() 줄 grip3dPose: payload.grip_data.grip_3d_pose, 만 할당할 뿐 z-depth 하한/정합성 판정을 건너뛰어.
- v1 호환성: 기존 read_grip_result 테이블·프로젝터·라우트·DI 는 수정·삭제 금지. v2 는 새 테이블(read_grip_result_v2), 새 프로젝터(GripResultProjectorV2), 새 라우트(/v2/grip-result) 만 추가. DI 한 줄, 라우트 한 줄, schema/index.ts export 한 줄 추가(changeKind=modifyFile). 기존 코드는 보존.

### 변경 파일

- `src/shared/database/schema/service/read-grip-result-v2.ts` (addFile) — v2 테이블 스키마. v1 열과 동일하며 depthMinMeters(numeric), poseConsistencyValid(smallint) 추가.
- `src/projection/projector/grip-result-projector-v2.ts` (addFile) — v2 프로젝트. map() 시 z-depth 최소 계산 및 정합성 판정, checkIntegrity() 규칙 위반 방출.
- `src/projection/projection.service.ts` (modifyFile) — DI 추가, catchUpGripResultV2 메서드, CatchUpAllResult 타입 확장.
- `src/projection/projection.controller.ts` (modifyFile) — /v2/grip-result 라우트 추가.
- `src/shared/database/schema/index.ts` (modifyFile) — v2 테이블 export 추가.

## Optional — 부속 자료(컨텍스트 축소 시 생략 가능)

### 버전 교체 코드 — `src/shared/database/schema/service/read-grip-result-v2.ts` (addFile)

```typescript
import { bigint, index, jsonb, numeric, pgTable, primaryKey, smallint, timestamp, varchar } from 'drizzle-orm/pg-core';

export const readGripResultV2 = pgTable(
  "read_grip_result_v2",
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

    depthMinMeters: numeric("depth_min_meters", { precision: 6, scale: 3 }),
    poseConsistencyValid: smallint("pose_consistency_valid").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.sceneKey, t.attemptNum] }),
    index("idx_grip_result_v2_object").on(t.objectName, t.occurredAt),
    index("idx_grip_result_v2_succeed").on(t.gripSucceed, t.occurredAt),
  ],
);
```

### 버전 교체 코드 — `src/projection/projector/grip-result-projector-v2.ts` (addFile)

```typescript
import { Injectable } from '@nestjs/common';
import { type InferInsertModel } from 'drizzle-orm';
import { PinoLogger } from 'nestjs-pino';
import { type ToyDataDto, toyDataSchema } from '@/insert/dto/toy-data.dto';
import { SensorValueMessage } from '@/projection/kafka/sensor-value.message';
import type { Projector } from '@/projection/projector/projector';
import type { EventStoreEventRow } from '@/projection/repository/event-store-reader.repository';
import { DrizzleTx } from '@/shared/database/drizzle.provider';
import { readGripResultV2 } from '@/shared/database/schema/service/read-grip-result-v2';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

import type { IntegrityViolation } from '@/projection/projector/projector';

type ReadGripResultV2Insert = InferInsertModel<typeof readGripResultV2>;

const GRIP_DEPTH_MIN_M: number = 0.01;
const GRIP_DEPTH_MAX_M: number = 0.3;

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
        `grip-result-v2 map: empty objects in event ${event.eventId}`,
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

    const depthMinMeters = Math.min(...zValues);
    const poseConsistencyValid = payload.grip_succeed === 1
      ? (depthMinMeters >= GRIP_DEPTH_MIN_M && depthMinMeters <= GRIP_DEPTH_MAX_M)
        ? 1 : 0
      : 1;

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
      depthMinMeters,
      poseConsistencyValid,
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
          gripperType: row.gripperType,
          occurredAt: row.occurredAt,
          grip2dPose: row.grip2dPose,
          grip3dPose: row.grip3dPose,
          robotTf: row.robotTf,
          humanAnnotationGrasp: row.humanAnnotationGrasp,
          streamId: row.streamId,
          globalSeq: row.globalSeq,
          depthMinMeters: row.depthMinMeters,
          poseConsistencyValid: row.poseConsistencyValid,
        },
      });
  }

  toSensorValueMessages(rows: ReadGripResultV2Insert[], _events: EventStoreEventRow[]): SensorValueMessage[] {
    return rows.map((row) => ({
      sceneKey: row.sceneKey,
      attemptNumber: row.attemptNum,
      streamId: row.streamId,
      globalSequence: row.globalSeq,
      occurredAt: row.occurredAt.toISOString(),
      objectName: row.objectName,
      gripSucceed: row.gripSucceed,
      grip2dPose: row.grip2dPose,
      grip3dPose: row.grip3dPose,
      robotTf: row.robotTf,
      humanAnnotationGrasp: row.humanAnnotationGrasp,
    }));
  }

  checkIntegrity(row: ReadGripResultV2Insert): IntegrityViolation[] {
    const violations: IntegrityViolation[] = [];

    if (row.gripSucceed === 1 && row.poseConsistencyValid === 0) {
      violations.push({
        readModelName: "read_grip_result_v2",
        sceneKey: row.sceneKey,
        attemptNum: row.attemptNum,
        streamId: row.streamId,
        globalSeq: row.globalSeq,
        ruleName: "gripSucceed_poseConsistency",
        affectedColumns: ["depth_min_meters", "pose_consistency_valid"],
        observedValue: `depthMin=${row.depthMinMeters}m`,
        expected: `[${GRIP_DEPTH_MIN_M}, ${GRIP_DEPTH_MAX_M}]m`,
        detail: `read_grip_result_v2 정합성 위반[gripSucceed_poseConsistency]: gripSucceed=1(성공)인데 grip3dPoseZ 최소 깊이(${row.depthMinMeters}m)이 물리적 하한/상한 [${GRIP_DEPTH_MIN_M}, ${GRIP_DEPTH_MAX_M}]m 밖 — 닿지 않는 깊이에서 성공은 모순.`,
      });
    }

    return violations;
  }
}
```

### 버전 교체 코드 — `src/projection/projection.service.ts` (modifyFile)

```typescript
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { GripResultProjectorV2 } from '@/projection/projector/grip-result-projector-v2';
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

  @Post("/v2/grip-result")
  gripResultV2(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/v2/grip-result",
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
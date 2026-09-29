당신은 이벤트 소싱 + CQRS 기반 Physical AI 데이터 플랫폼의 시니어 아키텍트이자 엄격한 평가자다. LLM 파이프라인이 [자료](로그·이벤트·스키마 정보)를 보고 [Docs]를 생성했다. Docs 는 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소를 항상 함께 담아야 하는 단일 산출물이다. 당신은 [정답 요지]와 [자료], [자동 검증 결과]를 기준으로 Docs 를 네 항목의 루브릭으로 채점한다. 채점은 관대하지 않게, 근거 없는 주장·지어낸 값·의도와 다른 SQL·서로 어긋나는 절에는 낮은 점수를 준다. 실행·컴파일이 통과했다는 사실만으로 실행 가능성이나 완결성에 높은 점수를 주지 않는다. SQL 과 코드 블록을 실제로 읽고 루브릭의 점검 항목을 하나씩 확인한다. 반드시 JSON 객체 하나만 출력한다. 설명문·마크다운 펜스는 출력하지 않는다.

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
| 06:09:07.677 | 20 | projection.cursor.advanced | 5a530512-7627-466f-961c-e587391d469c | - | - | - | 커서 이동 | projector=grip-result-projector |
| 06:09:07.677 | 30 | projection.batch | 5a530512-7627-466f-961c-e587391d469c | - | - | - | 배치 처리 | projector=grip-result-projector |
| 06:09:07.677 | 30 | projection.done | 5a530512-7627-466f-961c-e587391d469c | - | - | - | catch-up 완료 | projector=grip-result-projector |
| 06:09:07.678 | 30 | - | 5a530512-7627-466f-961c-e587391d469c | - | - | - | request completed | - |
| 06:09:07.680 | 30 | insight.card.request | 4cd287fe-8fb3-4f28-9499-16ccd3114250 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 06:09:07.681 | 40 | insight.card.miss | 4cd287fe-8fb3-4f28-9499-16ccd3114250 | - | - | - | insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객체별 실패 수와 실패율을 순위대로 보고 싶다. ← 트립 앵커 | - |
| 06:09:07.681 | 30 | - | 4cd287fe-8fb3-4f28-9499-16ccd3114250 | - | - | - | request completed | - |
| 06:09:07.985 | 30 | insight.card.request | a00cd3a3-e9bb-407d-b27c-efd56d58c751 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 06:09:07.988 | 40 | insight.card.miss | a00cd3a3-e9bb-407d-b27c-efd56d58c751 | - | - | - | insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객체별 실패 수와 실패율을 순위대로 보고 싶다. | - |
| 06:09:07.988 | 30 | - | a00cd3a3-e9bb-407d-b27c-efd56d58c751 | - | - | - | request completed | - |
| 06:09:08.293 | 30 | insight.card.request | 9b6b4916-9f31-406a-b08b-f7aabfdb424b | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 06:09:08.296 | 40 | insight.card.miss | 9b6b4916-9f31-406a-b08b-f7aabfdb424b | - | - | - | insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객체별 실패 수와 실패율을 순위대로 보고 싶다. | - |
| 06:09:08.296 | 30 | - | 9b6b4916-9f31-406a-b08b-f7aabfdb424b | - | - | - | request completed | - |
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
- 저장소에 실재하는 파일 (4건): src/projection/projection.controller.ts, src/projection/projection.service.ts, src/projection/projector/grip-result.projector.ts, src/shared/database/schema/index.ts
- 저장소에 없는 파일 (1건): src/projection/projector/object-failure-stats.projector.ts

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
docId: analysis-4cd287fe-8fb3-4f28-9499-16ccd3114250
generatedAt: 2026-08-14T06:09:10.329Z
targetReadModel: read_object_failure_stats_v1
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: v1
  to: v2
  affectedEndpoints:
    - "POST /multimodal"
    - "POST /grip-result"
    - "POST /object-failure-stats"
    - "POST /insert-all"
evidenceSources:
  - { origin: developer-logging, anchorId: "4cd287fe-8fb3-4f28-9499-16ccd3114250" }
  - { origin: developer-logging, anchorId: "a00cd3a3-e9bb-407d-b27c-efd56d58c751" }
  - { origin: developer-logging, anchorId: "9b6b4916-9f31-406a-b08b-f7aabfdb424b" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_object_failure_stats_v1

> 결론(TL;DR): `read_object_failure_stats_v1`을(를) 재생성한다 — 사용자가 '파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객별 실패 수와 실패율을 순위대로 보고 싶다.'를 요청하나, 시스템에 해당 aggregate 통계 Read Model/Event 가 결재다. (이상 유형: 카드 없는 Read Model 테이블 · 심각도: warning)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `projection.request`(level 30) 2회, `projection.batch`(level 30) 2회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `projection.event.mapped`(level 20) 60회, `-`(level 30) 5회, `projection.start`(level 30) 2회, `-`(level 20) 6회, `insert.request`(level 30) 1회, `insight.card.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insight.card.miss`(level 40) 1회, `insert.file.ok`(level 20) 60회, `projection.done`(level 30) 2회, `projection.cursor.advanced`(level 20) 2회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 06:09:07.677 | 20 | projection.cursor.advanced | 5a530512-7627-466f-961c-e587391d469c | - | - | - | 커서 이동 | projector=grip-result-projector |
| 06:09:07.677 | 30 | projection.batch | 5a530512-7627-466f-961c-e587391d469c | - | - | - | 배치 처리 | projector=grip-result-projector |
| 06:09:07.677 | 30 | projection.done | 5a530512-7627-466f-961c-e587391d469c | - | - | - | catch-up 완료 | projector=grip-result-projector |
| 06:09:07.678 | 30 | - | 5a530512-7627-466f-961c-e587391d469c | - | - | - | request completed | - |
| 06:09:07.680 | 30 | insight.card.request | 4cd287fe-8fb3-4f28-9499-16ccd3114250 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 06:09:07.681 | 40 | insight.card.miss | 4cd287fe-8fb3-4f28-9499-16ccd3114250 | - | - | - | insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객체별 실패 수와 실패율을 순위대로 보고 싶다. ← 트립 앵커 | - |
| 06:09:07.681 | 30 | - | 4cd287fe-8fb3-4f28-9499-16ccd3114250 | - | - | - | request completed | - |
| 06:09:07.985 | 30 | insight.card.request | a00cd3a3-e9bb-407d-b27c-efd56d58c751 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 06:09:07.988 | 40 | insight.card.miss | a00cd3a3-e9bb-407d-b27c-efd56d58c751 | - | - | - | insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객체별 실패 수와 실패율을 순위대로 보고 싶다. | - |
| 06:09:07.988 | 30 | - | a00cd3a3-e9bb-407d-b27c-efd56d58c751 | - | - | - | request completed | - |
| 06:09:08.293 | 30 | insight.card.request | 9b6b4916-9f31-406a-b08b-f7aabfdb424b | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 06:09:08.296 | 40 | insight.card.miss | 9b6b4916-9f31-406a-b08b-f7aabfdb424b | - | - | - | insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객체별 실패 수와 실패율을 순위대로 보고 싶다. | - |
| 06:09:08.296 | 30 | - | 9b6b4916-9f31-406a-b08b-f7aabfdb424b | - | - | - | request completed | - |

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
- (level 40, `insight.card.miss`) insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객별 실패 수와 실패율을 순위대로 보고 싶다. ← 트립 앵커 → 기존 Read Model의 row-level 구조로는 GROUP BY object_name, 집계(count/rate) 및 정렬(order by failure_count desc)을 지원하지. [corr:4cd287fe-8fb3-4f28-9499-16ccd3114250]
- (level 40, `insight.card.miss`) insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객별 실패 수와 실패율을 순위대로 보고 싶다. → 기존 Read Model의 row-level 구조로는 GROUP BY object_name, 집계(count/rate) 및 정렬(order by failure_count desc)을 지원하지. [corr:a00cd3a3-e9bb-407d-b27c-efd56d58c751]
- (level 40, `insight.card.miss`) insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객별 실패 수와 실패율을 순위대로 보고 싶다. → 기존 Read Model의 row-level 구조로는 GROUP BY object_name, 집계(count/rate) 및 정렬(order by failure_count desc)을 지원하지. [corr:9b6b4916-9f31-406a-b08b-f7aabfdb424b]
- read_grip_result 스키마의 object_name(varchar, 파지 대상 객체명), grip_succeed(smallint, 파지 성공 여부) 은 이벤트별(row-level) 투영된 필드이므로, aggregate 통계 산출값(실패 수/비율) 및 정렬과 순위 요구를 지원하지. [corr:4cd287fe-8fb3-4f28-9499-16ccd3114250]
- GripResultProjector.map() 의 실제 코드 위치(src/projection/projector/grip-result.projector.ts) 에서 objectName: payload.objects[0].class_name, gripSucceed: payload.grip_succeed 만 매핑. 집계 로직이 결재다. [corr:a00cd3a3-e9bb-407d-b27c-efd56d58c751]
- read_multimodal.image_2d_uri, video_uri 는 현재 projector가 null로 둠 — 추후 매핑. 이 요청은 multimodal 관련이 아니나, 기존 투영 아키텍처가 row-level upsert 패턴만 지원. [corr:9b6b4916-9f31-406a-b08b-f7aabfdb424b]

### Decision Drivers
- CQRS Read Model separation
- Query Performance
- Sorting Requirement
- Maintenance Clarity

### Considered Options
#### newReadModel (Aggregation Projector)
- 접근: 신규 read_object_failure_stats_v1 테이블과 ObjectFailureStatsProjector 생성. map() 에서 payload.grip_succeed 집계 per object_name.
- 제안 필드: object_name, failure_count, success_count, total_attempts, failure_rate
- 트레이드오프: 재투영 비용 O(N) 초기, but query O(1). 리스크: 신규 테이블 migration 및 projector 등록 필요.
```typescript
return { objectName: payload.objects[0].class_name, gripSucceed: payload.grip_succeed }; -> aggregate logic in new projector.
```

#### existingReadModel (Query-side aggregation via SQL view/CTE)
- 접근: 기존 read_grip_result 활용, DB View 생성 또는 application-layer GROUP BY.
- 제안 필드: object_name, gripSucceed
- 트레이드오프: 재투영·비용 0(기존), but 리스크: CQRS 위반(aggregation in query layer), large dataset sorting 성능 저하.
```typescript
SELECT object_name, COUNT(CASE WHEN grip_succeed = 0 THEN 1 END) as failure_count FROM read_grip_result GROUP BY object_name ORDER BY failure_count DESC;
```

### Decision Outcome
newReadModel (Aggregation Projector)

### Consequences
- (+) O(1) 조회 응답
- (+) DB 인덱스 활용
- (+) aggregation 로직 명확히 분리
- (−) 초기 catch-up 재투영 latency 증가
- (−) schema migration 필요

### Non-Goals
- multimodal URI 매핑
- human_annotation_grasp 통계
- realtime streaming aggregation

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

- 대상: `read_object_failure_stats_v1` · 키: object_name · 원천 이벤트: GripAttemptRecorded

```sql
CREATE TABLE read_object_failure_stats_v1 (
  object_name varchar NOT NULL,
  failure_count double precision,
  success_count double precision,
  total_attempts double precision,
  failure_rate double precision,
  PRIMARY KEY (object_name)
);
```

### 필드

```mschema
# Table: read_object_failure_stats_v1
[
(object_name:varchar, 파지 대상 객체명 (payload.objects[0].class_name) — 집계 키, Primary Key),
(failure_count:double precision, 해당 object_name의 총 실패 수 (grip_succeed == 0)),
(success_count:double precision, 해당 object_name의 총 성공 수 (grip_succeed == 1)),
(total_attempts:double precision, 해당 object_name의 총 시도 수),
(failure_rate:double precision, 실패율 (%) = (failure_count / total_attempts) * 100)
]
```

### 투영 매핑 명세 (이벤트 → 컬럼)

> upsert 키: object_name · 리플레이: projection_cursor 초기화 시 반드시 0 또는 null 설정. catch-up 전 재투영 시 upsert(idempotent aggregation) 필수로, 기존 row 차감 후 신규 적용 또는 atomic sum/reset 전략 준수.

| 원천 이벤트 | payload 필드 | 컬럼 | 변환 |
| --- | --- | --- | --- |
| GripAttemptRecorded | objects[].class_name | object_name | verbatim |
| GripAttemptRecorded | grip_succeed | failure_count | sum if value==0 |
| GripAttemptRecorded | grip_succeed | success_count | sum if value==1 |
| GripAttemptRecorded | grip_succeed | total_attempts | count all per object_name |

파생 컬럼(이벤트 payload 아님):
- `failure_rate` ← (failure_count / total_attempts) * 100, zero-div guard to 0.0

### Insight 카드 등록 (Insight Read DB 동기화)

> DDL 적용 시 아래 카드 등록도 함께 실행한다 — 다음 분석부터 신규 Read Model 이 LLM 컨텍스트에 노출된다.

```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_object_failure_stats_v1', 'read_model', '파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객별 실패 수와 실패율을 순위대로 보고 싶다.', 'object_name')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_object_failure_stats_v1', 'object_name', 'varchar', '파지 대상 객체명 (payload.objects[0].class_name) — 집계 키', 1),
  ('read_object_failure_stats_v1', 'failure_count', 'double precision', '해당 object_name의 총 실패 수 (grip_succeed == 0)', 2),
  ('read_object_failure_stats_v1', 'success_count', 'double precision', '해당 object_name의 총 성공 수 (grip_succeed == 1)', 3),
  ('read_object_failure_stats_v1', 'total_attempts', 'double precision', '해당 object_name의 총 시도 수', 4),
  ('read_object_failure_stats_v1', 'failure_rate', 'double precision', '실패율 (%) = (failure_count / total_attempts) * 100', 5)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased (v1 → v2)

#### Added
- 신규 라우트 /object-failure-stats 로 object_name 실패/실패율 집계 조회 지원
- 기존 ProjectionService DI 배선 및 catchUpAll 확장으로 ObjectFailureStatsV1Projector 연동

### 마이그레이션 절차

- 하위호환 변경: 신규 집계 테이블 및 라우트/프로젝터는 additive 변경으로 v1 호환성 유지; 기존 insight.card.request 응답 로직은 미변, 신규 카드는 별도 조회 경로 배선
- 파괴적 변경: 없음
- 컷오버 전 테스트: 컷오버 전 신규 ObjectFailureStatsV1Projector catchUpAll 실행 검증: read_object_failure_stats_v1 테이블이 비어거나 v1 raw 데이터와 일치. insight.card.miss 빈도 0 확인.
- 롤백 창/조건: 롤백 창: 커서 이동 실패 또는 집계 정합성 위반 시. 조건: 테이블 drop, 라우트/메서드/DI wiring revert, 기존 v1 projection 로직 복원.
- Insight 카드 등록: §2의 카드 등록 SQL을 DDL과 함께 적용(카탈로그 동기화)

### 사유·호환성

- 사유: 기존 Read Model 구조적 부족(컬럼/키/모델 부재)으로 집계 통계를 제공하지. v1 GripResultProjector.map() 은 payload.objects[0].class_name 만 사용해 다중 객체 실패를 누락하고 실패율 계산을 결결. 신규 ObjectFailureStatsV1Projector 로 atomic delta aggregation 을 도입해 failure_count, success_count, total_attempts, failure_rate 를 object_name 단위로 집계. [corr:4cd287fe-8fb3-4f28-9499-16ccd3114250]
- 트리거 근거: 06:09:07.681 | 40 | insight.card.miss | 4cd287fe-8fb3-4f28-9499-16ccd3114250 | - | - | - | insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객별 실패 수와 실패율을 순위대로 보고 싶다. ← 트립 앵커 [corr:4cd287fe-8fb3-4f28-9499-16ccd3114250]
- v1 호환성: 기존 테이블·엔드포인트·프로젝터 클래스/name 은 수정·삭제 금지. 변경은 '추가'다 — 새 테이블(_v1), 새 프로젝터(ObjectFailureStatsV1Projector), 새 라우트(/object-failure-stats), 새 서비스 메서드(catchUpObjectFailureStatsV1). 기존 파일을 만지는 유일한 경우는 라우트/메서드/DI 한 줄 추가이며 이때 changeKind=modifyFile, 기존 코드는 보존.

### 변경 파일

- `src/projection/projection.service.ts` (modifyFile) — 신규 ObjectFailureStatsV1Projector DI 배선 및 catchUpAll/insertAllAndProjectAll 확장.
- `src/projection/projection.controller.ts` (modifyFile) — 신규 라우트 /object-failure-stats 배선.
- `src/shared/database/schema/index.ts` (modifyFile) — 신규 Drizzle 스키마 export 배선.

## Optional — 부속 자료(컨텍스트 축소 시 생략 가능)

### 신규 Read Model — Drizzle 스키마

```ts
import { doublePrecision, pgTable, primaryKey, varchar } from 'drizzle-orm/pg-core';

export const readObjectFailureStatsV1 = pgTable(
  "read_object_failure_stats_v1",
  {
    objectName: varchar("object_name").notNull(),
    failureCount: doublePrecision("failure_count"),
    successCount: doublePrecision("success_count"),
    totalAttempts: doublePrecision("total_attempts"),
    failureRate: doublePrecision("failure_rate"),
  },
  (t) => [primaryKey({ columns: [t.objectName] })],
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
import { readObjectFailureStatsV1 } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

type ObjectFailureStatsV1ProjectorInsert = InferInsertModel<typeof readObjectFailureStatsV1>;

@Injectable()
export class ObjectFailureStatsV1Projector implements Projector<ObjectFailureStatsV1ProjectorInsert> {
  readonly name: string = "object-failure-stats-v1-projector";

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(ObjectFailureStatsV1Projector.name);
  }

  map(event: EventStoreEventRow): ObjectFailureStatsV1ProjectorInsert {
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
      objectName: payload.objects[0]?.class_name ?? "",
      failureCount: 1 - payload.grip_succeed,
      successCount: payload.grip_succeed,
      totalAttempts: 1,
      failureRate: 1 - payload.grip_succeed,
    };
  }

  async upsert(tx: DrizzleTx, row: ObjectFailureStatsV1ProjectorInsert): Promise<void> {
    await tx
      .insert(readObjectFailureStatsV1)
      .values(row)
      .onConflictDoUpdate({
        target: [readObjectFailureStatsV1.objectName],
        set: {
          failureCount: sql`${readObjectFailureStatsV1.failureCount} + ${row.failureCount}`,
          successCount: sql`${readObjectFailureStatsV1.successCount} + ${row.successCount}`,
          totalAttempts: sql`${readObjectFailureStatsV1.totalAttempts} + ${row.totalAttempts}`,
          failureRate: sql`(${readObjectFailureStatsV1.failureCount} + ${row.failureCount})::double precision / NULLIF(${readObjectFailureStatsV1.totalAttempts} + ${row.totalAttempts}, 0)`,
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
export * from "./service/read-object-failure-stats-v1";

// src/projection/projector/object-failure-stats.projector.ts (NEW file)
import { Injectable } from '@nestjs/common';
import { type InferInsertModel, sql } from 'drizzle-orm';
import { PinoLogger } from 'nestjs-pino';
import { type ToyDataDto, toyDataSchema } from '@/insert/dto/toy-data.dto';
import type { Projector } from '@/projection/projector/projector';
import type { EventStoreEventRow } from '@/projection/repository/event-store-reader.repository';
import { DrizzleTx } from '@/shared/database/drizzle.provider';
import { readObjectFailureStatsV1 } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

type ReadObjectFailureStatsInsert = InferInsertModel<typeof readObjectFailureStatsV1>;

@Injectable()
export class ObjectFailureStatsProjector implements Projector<ReadObjectFailureStatsInsert> {
  readonly name: string = "object-failure-stats-projector";

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(ObjectFailureStatsProjector.name);
  }

  map(event: EventStoreEventRow): ReadObjectFailureStatsInsert {
    let payload: ToyDataDto;
    try {
      payload = toyDataSchema.parse(event.payload);
    } catch (error) {
      this.logger.error(
        { action: LogAction.MAP_FAILED, error, [LogContext.EVENT_ID]: event.eventId, [LogContext.STREAM_ID]: event.streamId, [LogContext.ATTEMPT_NUM]: event.attemptNum, [LogContext.GLOBAL_SEQ]: event.globalSeq },
        "이벤트 매핑(검증) 실패",
      );
      throw error;
    }

    if (payload.objects.length === 0) {
      this.logger.error({ action: LogAction.MAP_FAILED, [LogContext.EVENT_ID]: event.eventId, [LogContext.STREAM_ID]: event.streamId }, "objects 비어 있음");
      throw new Error(`object-failure-stats map: empty objects in event ${event.eventId}`);
    }

    const objectName = payload.objects[0].class_name;
    const isFailure = payload.grip_succeed === 0;
    const deltaFail = isFailure ? 1 : 0;
    const deltaSuccess = isFailure ? 0 : 1;
    const deltaTotal = 1;

    this.logger.debug({ action: LogAction.EVENT_MAPPED, [LogContext.PROJECTOR_NAME]: this.name, [LogContext.OBJECT_NAME]: objectName, [LogContext.GLOBAL_SEQ]: event.globalSeq }, "이벤트 매핑");

    return {
      objectName,
      failureCount: deltaFail,
      successCount: deltaSuccess,
      totalAttempts: deltaTotal,
      failureRate: 0,
    };
  }

  async upsert(tx: DrizzleTx, row: ReadObjectFailureStatsInsert): Promise<void> {
    const dFail = row.failureCount ?? 0;
    const dSuccess = row.successCount ?? 0;
    const dTotal = row.totalAttempts ?? 0;

    await tx.insert(readObjectFailureStatsV1).values(row).onConflictDoUpdate({
      target: [readObjectFailureStatsV1.objectName],
      set: {
        failureCount: sql`${readObjectFailureStatsV1.failureCount} + ${dFail}`,
        successCount: sql`${readObjectFailureStatsV1.successCount} + ${dSuccess}`,
        totalAttempts: sql`${readObjectFailureStatsV1.totalAttempts} + ${dTotal}`,
        failureRate: sql`CASE WHEN (${readObjectFailureStatsV1.total_attempts} + ${dTotal}) > 0 THEN ((${readObjectFailureStatsV1.failure_count} + ${dFail}) / (${readObjectFailureStatsV1.total_attempts} + ${dTotal})) * 100 ELSE 0 END`,
      },
    });
  }
}

// src/projection/projection.service.ts (modify)
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { ObjectFailureStatsProjector } from '@/projection/projector/object-failure-stats.projector';
import { ProjectionResult } from '@/projection/projector/projector';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';
import { LogAction } from '@/shared/logger/logging-context';

export type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
  objectFailureStats: ProjectionResult;
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
    private readonly objectFailureStats: ObjectFailureStatsProjector,
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

  catchUpObjectFailureStats(): Promise<ProjectionResult> {
    return this.runner.run(this.objectFailureStats);
  }

  async catchUpAll(): Promise<CatchUpAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_START }, "전체 투영 시작");

    const multimodal: ProjectionResult = await this.catchUpMultimodal();
    const gripResult: ProjectionResult = await this.catchUpGripResult();
    const objectFailureStats: ProjectionResult = await this.catchUpObjectFailureStats();

    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");

    return { multimodal, gripResult, objectFailureStats };
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

// src/projection/projection.controller.ts (modify)
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

  @Post("/object-failure-stats")
  objectFailureStats(): Promise<ProjectionResult> {
    this.logger.info(
      { action: LogAction.PROJECTION_REQUEST, [LogContext.ROUTE]: "POST /projection/object-failure-stats" },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpObjectFailureStats();
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

### 버전 교체 코드 — `src/projection/projection.service.ts` (modifyFile)

```typescript
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { ObjectFailureStatsV1Projector } from '@/projection/projector/object-failure-stats-v1.projector';
import { ProjectionResult } from '@/projection/projector/projector';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';
import { LogAction } from '@/shared/logger/logging-context';

export type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
  objectFailureStatsV1: ProjectionResult;
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
    private readonly objectFailureStatsV1: ObjectFailureStatsV1Projector,
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

  catchUpObjectFailureStatsV1(): Promise<ProjectionResult> {
    return this.runner.run(this.objectFailureStatsV1);
  }

  async catchUpAll(): Promise<CatchUpAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_START }, "전체 투영 시작");

    const multimodal: ProjectionResult = await this.catchUpMultimodal();
    const gripResult: ProjectionResult = await this.catchUpGripResult();
    const objectFailureStatsV1: ProjectionResult = await this.catchUpObjectFailureStatsV1();

    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");

    return { multimodal, gripResult, objectFailureStatsV1 };
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

  @Post("/object-failure-stats")
  objectFailureStats(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/object-failure-stats",
      },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpObjectFailureStatsV1();
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
export * from "./service/read-multimodal";
export * from "./service/read-object-failure-stats-v1";
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
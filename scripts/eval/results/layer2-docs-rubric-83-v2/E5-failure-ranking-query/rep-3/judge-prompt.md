당신은 이벤트 소싱 + CQRS 기반 Physical AI 데이터 플랫폼의 시니어 아키텍트이자 엄격한 평가자다. LLM 파이프라인이 [자료](로그·이벤트·스키마 정보)를 보고 [Docs]를 생성했다. Docs 는 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소를 항상 함께 담아야 하는 단일 산출물이다. 당신은 [정답 요지]와 [자료], [자동 검증 결과]를 기준으로 Docs 를 네 항목의 루브릭으로 채점한다. 채점은 관대하지 않게, 근거 없는 주장·지어낸 값·의도와 다른 SQL·서로 어긋나는 절에는 낮은 점수를 준다. 실행·컴파일이 통과했다는 사실만으로 실행 가능성이나 완결성에 높은 점수를 주지 않는다. SQL 과 코드 블록을 실제로 읽고 루브릭의 점검 항목을 하나씩 확인한다. 반드시 JSON 객체 하나만 출력한다. 설명문·마크다운 펜스는 출력하지 않는다.

---

[시나리오] E5-failure-ranking-query
[상황] 사용자가 아래 조회를 요청했으나 기존 Read Model 로는 제공할 수 없다.
[정답 요지] 사용자가 파지 실패가 많은 객체 상위 목록(객체별 실패 수·실패율, 순위)을 요청했으나 기존 Read Model 에 랭킹/집계가 없음. 조치: object_name 별 실패 수·실패율 집계 Read Model 신설 + 백필, API v2 병행.

[자료] — Docs 생성 시 파이프라인이 받은 로그·이벤트·스키마 정보
<<<자료 시작>>>
<logging_context>
## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `projection.request`(level 30) 2회, `projection.batch`(level 30) 2회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `projection.event.mapped`(level 20) 60회, `-`(level 30) 4회, `projection.start`(level 30) 2회, `-`(level 20) 6회, `insert.request`(level 30) 1회, `insight.card.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insight.card.miss`(level 40) 1회, `insert.file.ok`(level 20) 60회, `projection.done`(level 30) 2회, `projection.cursor.advanced`(level 20) 2회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 08:47:24.040 | 30 | projection.done | b0ac7861-1446-410a-ade5-89b9e25155c4 | - | - | - | catch-up 완료 | projector=grip-result-projector |
| 08:47:24.040 | 30 | projection.batch | b0ac7861-1446-410a-ade5-89b9e25155c4 | - | - | - | 배치 처리 | projector=grip-result-projector |
| 08:47:24.040 | 30 | - | b0ac7861-1446-410a-ade5-89b9e25155c4 | - | - | - | request completed | - |
| 08:47:24.040 | 20 | projection.cursor.advanced | b0ac7861-1446-410a-ade5-89b9e25155c4 | - | - | - | 커서 이동 | projector=grip-result-projector |
| 08:47:24.043 | 30 | insight.card.request | 5dafb157-8e5b-49d5-a5cc-c16b33d3c95d | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 08:47:24.043 | 40 | insight.card.miss | 5dafb157-8e5b-49d5-a5cc-c16b33d3c95d | - | - | - | insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객체별 실패 수와 실패율을 순위대로 보고 싶다. ← 트립 앵커 | - |
| 08:47:24.044 | 30 | - | 5dafb157-8e5b-49d5-a5cc-c16b33d3c95d | - | - | - | request completed | - |
| 08:47:24.349 | 30 | insight.card.request | c1bed7e9-335e-4693-a69b-a1e933d5c8c4 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 08:47:24.351 | 40 | insight.card.miss | c1bed7e9-335e-4693-a69b-a1e933d5c8c4 | - | - | - | insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객체별 실패 수와 실패율을 순위대로 보고 싶다. | - |
| 08:47:24.351 | 30 | - | c1bed7e9-335e-4693-a69b-a1e933d5c8c4 | - | - | - | request completed | - |
| 08:47:24.658 | 30 | insight.card.request | 608efded-3621-4b0f-b9e5-d9711fa7b671 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 08:47:24.661 | 40 | insight.card.miss | 608efded-3621-4b0f-b9e5-d9711fa7b671 | - | - | - | insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객체별 실패 수와 실패율을 순위대로 보고 싶다. | - |
| 08:47:24.662 | 30 | - | 608efded-3621-4b0f-b9e5-d9711fa7b671 | - | - | - | request completed | - |
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
- 코드 컴파일: 파일 4개 중 4개 통과

[저장소 파일 확인] — 파이프라인은 진단 도구로 저장소 소스 코드를 조회할 수 있다. Docs 가 인용한 파일 경로의 실재 여부와 앞부분 발췌이다.
- 저장소에 실재하는 파일 (4건): src/projection/projection.controller.ts, src/projection/projection.module.ts, src/projection/projection.service.ts, src/shared/database/schema/index.ts
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
docId: analysis-5dafb157-8e5b-49d5-a5cc-c16b33d3c95d
generatedAt: 2026-08-12T08:47:26.731Z
targetReadModel: read_grip_failure_stats
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: v1
  to: v2
  affectedEndpoints:
    - "POST /multimodal"
    - "POST /grip-result"
    - "POST /grip-failure-stats"
    - "POST /insert-all"
evidenceSources:
  - { origin: developer-logging, anchorId: "5dafb157-8e5b-49d5-a5cc-c16b33d3c95d" }
  - { origin: developer-logging, anchorId: "c1bed7e9-335e-4693-a69b-a1e933d5c8c4" }
  - { origin: developer-logging, anchorId: "608efded-3621-4b0f-b9e5-d9711fa7b671" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_grip_failure_stats

> 결론(TL;DR): `read_grip_failure_stats`을(를) 재생성한다 — 사용자가 Trip 실패에 대한 실패 수/실패율 집계가 요청하나, 현재 시스템에는 원본 `read_grip_result`만 존재하고 집계(Aggregation) Read Model이 결결한 현안. (이상 유형: 카드 없는 Read Model 테이블 · 심각도: warning)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `projection.request`(level 30) 2회, `projection.batch`(level 30) 2회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `projection.event.mapped`(level 20) 60회, `-`(level 30) 4회, `projection.start`(level 30) 2회, `-`(level 20) 6회, `insert.request`(level 30) 1회, `insight.card.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insight.card.miss`(level 40) 1회, `insert.file.ok`(level 20) 60회, `projection.done`(level 30) 2회, `projection.cursor.advanced`(level 20) 2회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 08:47:24.040 | 30 | projection.done | b0ac7861-1446-410a-ade5-89b9e25155c4 | - | - | - | catch-up 완료 | projector=grip-result-projector |
| 08:47:24.040 | 30 | projection.batch | b0ac7861-1446-410a-ade5-89b9e25155c4 | - | - | - | 배치 처리 | projector=grip-result-projector |
| 08:47:24.040 | 30 | - | b0ac7861-1446-410a-ade5-89b9e25155c4 | - | - | - | request completed | - |
| 08:47:24.040 | 20 | projection.cursor.advanced | b0ac7861-1446-410a-ade5-89b9e25155c4 | - | - | - | 커서 이동 | projector=grip-result-projector |
| 08:47:24.043 | 30 | insight.card.request | 5dafb157-8e5b-49d5-a5cc-c16b33d3c95d | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 08:47:24.043 | 40 | insight.card.miss | 5dafb157-8e5b-49d5-a5cc-c16b33d3c95d | - | - | - | insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객체별 실패 수와 실패율을 순위대로 보고 싶다. ← 트립 앵커 | - |
| 08:47:24.044 | 30 | - | 5dafb157-8e5b-49d5-a5cc-c16b33d3c95d | - | - | - | request completed | - |
| 08:47:24.349 | 30 | insight.card.request | c1bed7e9-335e-4693-a69b-a1e933d5c8c4 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 08:47:24.351 | 40 | insight.card.miss | c1bed7e9-335e-4693-a69b-a1e933d5c8c4 | - | - | - | insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객체별 실패 수와 실패율을 순위대로 보고 싶다. | - |
| 08:47:24.351 | 30 | - | c1bed7e9-335e-4693-a69b-a1e933d5c8c4 | - | - | - | request completed | - |
| 08:47:24.658 | 30 | insight.card.request | 608efded-3621-4b0f-b9e5-d9711fa7b671 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 08:47:24.661 | 40 | insight.card.miss | 608efded-3621-4b0f-b9e5-d9711fa7b671 | - | - | - | insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객체별 실패 수와 실패율을 순위대로 보고 싶다. | - |
| 08:47:24.662 | 30 | - | 608efded-3621-4b0f-b9e5-d9711fa7b671 | - | - | - | request completed | - |

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
- (level 40, `insight.card.miss`) insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객제별 실패 수와 실패율을 순위대로 보고 싶다. → 기존 Read Model 부재로 집계 요청 실패. [corr:5dafb157-8e5b-49d5-a5cc-c16b33d3c95d]
- (level 40, `insight.card.miss`) insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객제별 실패 수와 실패율을 순위대로 보고 싶다. → 반복 miss 신호로 집계 모델 결결 확신. [corr:c1bed7e9-335e-4693-a69b-a1e933d5c8c4]
- (level 40, `insight.card.miss`) insight 카드 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객제별 실패 수와 실패율을 순위대로 보고 싶다. → 동일 의도 재요청으로 신규 Read Model 필요 확증. [corr:608efded-3621-4b0f-b9e5-d9711fa7b671]
- read_grip_result 스키마의 object_name, grip_succeed 컬럼은 원본 Record 테이블로, GROUP BY 산출값(실패 수·실패율) 및 정렬 요구를 기존 스키마로 채울 수 없다. [corr:5dafb157-8e5b-49d5-a5cc-c16b33d3c95d]
- GripResultProjector.map() 에서 payload.objects[0].class_name 은 objectName 에 매핑하나, upsert() 는 행 단위 overwrite 로 집계 상태 추적을 불가능하다. [corr:c1bed7e9-335e-4693-a69b-a1e933d5c8c4]
- 요청 의도('파지 실패가 가장 많은 객체 상위 목록... 순위대로') 는 read_grip_result 만으로는 충족할 수 없어, 신규 집계 모델(read_grip_failure_stats) 이필요하며 정합성 규칙에 recommendationDocs 를 동반해야. [corr:608efded-3621-4b0f-b9e5-d9711fa7b671]

### Decision Drivers
- Aggregation requirement (GROUP BY/Rate)
- Idempotency & Catch-up safety
- Schema separation of concerns (Record vs Stats)

### Considered Options
#### 기존 보강
- 접근: GripResultProjector 의 map()/upsert() 확장을 집계 로직에 포함.
- 제안 필드: total_count, fail_count, failure_rate
- 트레이드오프: 높은 결합도, catch-up 재실행 시 상태 일관성 유지 어려움.
```typescript
return { ...row, total_count: (prev.total_count || 0) + 1, failCount: prev.failCount + payload.grip_succeed === 0 ? 1 : 0 };
```

#### 신규 분리
- 접근: read_grip_failure_stats 신규 Projector(GripFailureStatsProjector) 생성.
- 제안 필드: object_name, total_count, fail_count, failure_rate
- 트레이드오프: Clean separation, idempotent upserts, 표준 CQRS 패턴.
```typescript
await tx.insert(readGripFailureStats).values({ objectName: row.objectName, totalCount: 1, failCount: payload.grip_succeed === 0 ? 1 : 0 });
```

### Decision Outcome
신규 분리 (read_grip_failure_stats)

### Consequences
- (+) 명세된 집계 테이블 로직 분리
- (+) catch-up 재실행 안전성 확보
- (+) LLM/Insight 카드 조회 성능 향상
- (−) 신규 Projector 등록 및 migration SQL 적용 필요
- (−) 초기화/정합성 검사 코드 추가 작업 발생

### Non-Goals
- read_grip_result 스키마 직접 수정
- poison event 처리 로직 확장
- multimodal URI 매핑 보강

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

- 대상: `read_grip_failure_stats` · 키: object_name · 원천 이벤트: GripAttemptRecorded

```sql
CREATE TABLE read_grip_failure_stats (
  object_name varchar NOT NULL,
  total_count double_precision,
  fail_count double_precision,
  failure_rate double_precision,
  PRIMARY KEY (object_name)
);
```

### 필드

```mschema
# Table: read_grip_failure_stats
[
(object_name:varchar, 파지 대상 객체명 (payload.objects[0].class_name), Primary Key),
(total_count:double_precision, 해당 object_name 누적 시도 수),
(fail_count:double_precision, 해당 object_name 누적 실패 수 (grip_succeed === 0)),
(failure_rate:double_precision, 누적 실패율 (fail_count / total_count))
]
```

### 투영 매핑 명세 (이벤트 → 컬럼)

> upsert 키: object_name · 리플레이: projection_cursor 초기화 시 global_seq 기준 정렬으로 재투영 시작. catch-up 전체 재투영 시 반드시 upsert state를 초기값(0,0)으로 리셋하고 멱id(upsert) 연산으로 재계산해야 누적 오류가 발생하지.

| 원천 이벤트 | payload 필드 | 컬럼 | 변환 |
| --- | --- | --- | --- |
| GripAttemptRecorded | objects[0].class_name | object_name | verbatim |
| GripAttemptRecorded | grip_succeed | total_count | 누적 1 per event |
| GripAttemptRecorded | grip_succeed | fail_count | 누적 if ==0 else 0 |

파생 컬럼(이벤트 payload 아님):
- `failure_rate` ← fail_count / total_count (total_count=0 시 null)

### Insight 카드 등록 (Insight Read DB 동기화)

> DDL 적용 시 아래 카드 등록도 함께 실행한다 — 다음 분석부터 신규 Read Model 이 LLM 컨텍스트에 노출된다.

```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_grip_failure_stats', 'read_model', '객별 파지 실패 수·실패율 집계를 영적 DB 레이어에서 전계화하여 상위 실패 객체 순위 조회를 지원.', 'object_name')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_grip_failure_stats', 'object_name', 'varchar', '파지 대상 객체명 (payload.objects[0].class_name)', 1),
  ('read_grip_failure_stats', 'total_count', 'double_precision', '해당 object_name 누적 시도 수', 2),
  ('read_grip_failure_stats', 'fail_count', 'double_precision', '해당 object_name 누적 실패 수 (grip_succeed === 0)', 3),
  ('read_grip_failure_stats', 'failure_rate', 'double_precision', '누적 실패율 (fail_count / total_count)', 4)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased (v1 → v2)

#### Added
- 신규 집계 Read Model 테이블 read_grip_failure_stats 및 Projector GripFailureStatsProjector, 라우트 /projection/grip-failure-stats
#### Changed
- ProjectionService DI 및 CatchUpAllResult 타입 확장으로 gripFailureStats 필드 추가

### 마이그레이션 절차

- 하위호환 변경: 신규 집계 테이블 read_grip_failure_stats 은 기존 원본 테이블 read_grip_result 와 무관한 키/데이터 구조이므로 기존 Read Model 조회 API 가 호환성 유지; 기존 v1 Projector/Controller 엔드포인트는 건드리지 않음
- 파괴적 변경: 없음
- 컷오버 전 테스트: 전체 catch-up 재시작 후 read_grip_failure_stats.total_count 합이 ES 이벤트 수와 일치, failure_rate = fail_count / total_count 검증, object_name 중복 키 충돌 무
- 롤백 창/조건: ALTER TABLE read_grip_failure_stats DROP COLUMN IF EXISTS ... or DROP TABLE IF 필요 시 트랜잭션 롤백. v1 원본 테이블은 보존되므로 집계 손실만 발생
- Insight 카드 등록: §2의 카드 등록 SQL을 DDL과 함께 적용(카탈로그 동기화)

### 사유·호환성

- 사유: 기존 read_grip_result는 원본(Record) 테이블로, 실패/실패율 집계가 결결한 모델이 결결하다. 사용자가 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객체별 실패 수와 실패율을 순위대로 보고 싶다.[corr:5dafb157-8e5b-49d5-a5cc-c16b33d3c95d] v1 GripResultProjector.map의 objectName: payload.objects[0].class_name, 줄은 원본 1건 매핑만 수행하여 집계(Aggregation) Read Model이 결결한 현안.[corr:c1bed7e9-335e-4693-a69b-a1e933d5c8c4]
- 트리거 근거: 08:47:24.043 insight.card.request -> 08:47:24.044 insight.card.miss (insight card 없음: 파지 실패가 가장 많은 객체 상위 목록을 조회하고 싶다. 객체별 실패 수와 실패율을 순위대로 보고 싶다.) [corr:5dafb157-8e5b-49d5-a5cc-c16b33d3c95d]
- v1 호환성: 신규 집계 테이블 read_grip_failure_stats 은 기존 원본 테이블 read_grip_result 와 무관한 키/데이터 구조이므로 기존 Read Model 조회 API 가 호환성 유지. v1 클래스/테이블/로직은 건드리지 않음.

### 변경 파일

- `src/shared/database/schema/index.ts` (modifyFile) — 신규 스키마 export 추가 (기존 export 보존)
- `src/projection/projection.service.ts` (modifyFile) — 신규 Projector DI, catchUpAllResult 타입 확장, catchUpGripFailureStats 메서드 및 catchUpAll 호출 추가 (기존 로직 보존)
- `src/projection/projection.controller.ts` (modifyFile) — 신규 라우트 /projection/grip-failure-stats 추가 (기존 엔드포인트 보존)

## Optional — 부속 자료(컨텍스트 축소 시 생략 가능)

### 신규 Read Model — Drizzle 스키마

```ts
import { bigint, doublePrecision, index, pgTable, primaryKey, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const readGripFailureStats = pgTable(
  "read_grip_failure_stats",
  {
    objectName: varchar("object_name").notNull(),
    totalCount: doublePrecision("total_count"),
    failCount: doublePrecision("fail_count"),
    failureRate: doublePrecision("failure_rate"),
  },
  (t) => [
    primaryKey({ columns: [t.objectName] }),
    index("idx_failure_stats_object").on(t.objectName),
  ],
);
```

### 신규 Read Model — Projector

```ts
import { Injectable } from '@nestjs/common';
import { type InferInsertModel, sql } from 'drizzle-orm';
import { PinoLogger } from 'nestjs-pino';
import { type ToyDataDto, toyDataSchema } from '@/insert/dto/toy-data.dto';
import type { Projector } from '@/projection/projector/projector';
import type { EventStoreEventRow } from '@/projection/repository/event-store-reader.repository';
import { DrizzleTx } from '@/shared/database/drizzle.provider';
import { readGripFailureStats } from '@/shared/database/schema/service/read-grip-failure-stats';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

type ReadGripFailureStatsInsert = InferInsertModel<typeof readGripFailureStats>;

@Injectable()
export class GripFailureStatsProjector implements Projector<ReadGripFailureStatsInsert> {
  readonly name: string = "grip-failure-stats-projector";

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(GripFailureStatsProjector.name);
  }

  map(event: EventStoreEventRow): ReadGripFailureStatsInsert {
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

      throw new Error(`grip-failure-stats map: empty objects in event ${event.eventId}`);
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

    const objectName = payload.objects[0].class_name;
    const isFail = payload.grip_succeed === 0 ? 1 : 0;

    return {
      objectName,
      totalCount: 1.0,
      failCount: Number(isFail),
      failureRate: undefined,
    };
  }

  async upsert(tx: DrizzleTx, row: ReadGripFailureStatsInsert): Promise<void> {
    await tx
      .insert(readGripFailureStats)
      .values(row)
      .onConflictDoUpdate({
        target: [readGripFailureStats.objectName],
        set: {
          totalCount: sql`${readGripFailureStats.totalCount} + excluded.value`,
          failCount: sql`${readGripFailureStats.failCount} + excluded.value`,
          failureRate: sql`(${readGripFailureStats.failCount} + excluded.value) / (${readGripFailureStats.totalCount} + excluded.value)`,
        },
      });
  }
}
```

### 신규 Read Model — 배선(컨트롤러/서비스/모듈)

```ts
// src/shared/database/schema/index.ts 추가:
export * from "./service/read-grip-failure-stats";

// src/projection/projection.service.ts 추가:
import { GripFailureStatsProjector } from '@/projection/projector/grip-failure-stats.projector';
// ... constructor(..., private readonly gripFailureStats: GripFailureStatsProjector, ...)
catchUpGripFailureStats(): Promise<ProjectionResult> {
  return this.runner.run(this.gripFailureStats);
}

// src/projection/projection.controller.ts 추가:
@Post("/grip-failure-stats")
gripFailureStats(): Promise<ProjectionResult> {
  this.logger.info(
    { action: LogAction.PROJECTION_REQUEST, [LogContext.ROUTE]: "POST /projection/grip-failure-stats" },
    "projection 요청 수신",
  );

  return this.projectionService.catchUpGripFailureStats();
}

// src/projection/projection.module.ts providers 추가:
GripFailureStatsProjector,
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
export * from "./service/read-grip-failure-stats";
```

### 버전 교체 코드 — `src/projection/projection.service.ts` (modifyFile)

```typescript
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { GripFailureStatsProjector } from '@/projection/projector/grip-failure-stats.projector';
import { ProjectionResult } from '@/projection/projector/projector';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';
import { LogAction } from '@/shared/logger/logging-context';

export type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
  gripFailureStats: ProjectionResult;
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
    private readonly gripFailureStats: GripFailureStatsProjector,
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

  catchUpGripFailureStats(): Promise<ProjectionResult> {
    return this.runner.run(this.gripFailureStats);
  }

  async catchUpAll(): Promise<CatchUpAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_START }, "전체 투영 시작");

    const multimodal: ProjectionResult = await this.catchUpMultimodal();
    const gripResult: ProjectionResult = await this.catchUpGripResult();
    const gripFailureStats: ProjectionResult = await this.catchUpGripFailureStats();

    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");

    return { multimodal, gripResult, gripFailureStats };
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

  @Post("/grip-failure-stats")
  gripFailureStats(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/grip-failure-stats",
      },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpGripFailureStats();
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
- actionability (실행 가능성): Docs 의 SQL 과 절차를 그대로 따르면 문제가 해결되는가. [자동 검증 결과]를 실측으로 반영하되, 실행·컴파일이 되더라도 의도와 다른 일을 하는 코드는 감점한다. 반드시 다음을 직접 확인한다: (1) 프로젝션 로직이 DDL 의 NOT NULL 컬럼에 null 이나 TODO 를 넣어 실제 적재 시 실패하지 않는가, (2) upsert 의 excluded. 뒤 식별자가 DDL 의 실제 컬럼명(snake_case)인가, (3) 비율·평균 계산이 정수 나눗셈으로 0/1 만 저장되지 않는가, (4) 정답이 요구한 값(성공률·실패율 등)이 실제 컬럼으로 존재하는가, (5) CHECK 제약이 플래그로 격리해야 할 바로 그 행의 적재를 막아 설계와 모순되지 않는가, (6) 기각했다고 쓴 조치(DELETE 등)를 즉시 격리 SQL 로 그대로 싣지 않았는가, (7) 기존 v1 테이블(read_grip_result, read_multimodal, event_store)의 행을 ALTER/DROP/DELETE 하지 않는가, (8) 정답 요지가 Read Model 보강을 요구하는데 검증용 SELECT 만 있지 않은가. 5=그대로 따르면 해결(실행 성공 + 요구 충족, 위 결함 없음). 4=위 결함 중 사소한 것 1개. 3=오탈자·순서·식별자 등 소폭 수정 후 해결. 2=따르면 적재·투영이 실패하거나 요구한 값을 얻지 못함. 1=따르면 기존 자산이 손상되거나 무관함.
- completeness (완결성): 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소가 모두 유효하고 서로 일치하는가. 반드시 다음을 직접 확인한다: (1) TL;DR·머리말의 대상 테이블과 DDL 의 테이블명이 같은가, (2) 권고(Decision Outcome, Non-Goals)와 실제 SQL·코드가 모순되지 않는가(예: '보강한다'고 쓰고 '구조 변경 없음'이라 함, '기존 확장'이라 쓰고 신규 테이블을 만듦), (3) 코드 블록 사이의 클래스명·파일명·라우트명·export 경로가 서로 같은가, (4) DDL 의 nullable 과 ORM 스키마의 notNull 이 일치하는가, (5) 권고 절이 '재실행 권장'·'최소 근거만 수록' 같은 대체 스텁이 아닌가, (6) API 버저닝 절이 비어 있거나 문장이 끊기지 않았는가. 5=세 요소가 모두 유효하고 서로 일치. 4=사소한 불일치 1개. 3=세 요소가 있으나 서로 어긋나거나 항목이 비어 있음. 2=한 요소가 실질적으로 비어 있음(예: DDL 절에 검증 SELECT 만). 1=요소 누락 또는 근거 부족 표시.

다음 형식의 JSON 객체 하나만 출력하라:
{"groundedness": 1-5, "diagnosisAccuracy": 1-5, "actionability": 1-5, "completeness": 1-5, "unsupportedClaims": ["자료에 없는 주장 인용 (없으면 빈 배열)"], "rationale": "각 항목 점수 근거를 항목당 1~2문장으로, 한국어로"}
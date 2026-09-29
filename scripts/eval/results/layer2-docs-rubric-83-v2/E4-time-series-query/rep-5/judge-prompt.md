당신은 이벤트 소싱 + CQRS 기반 Physical AI 데이터 플랫폼의 시니어 아키텍트이자 엄격한 평가자다. LLM 파이프라인이 [자료](로그·이벤트·스키마 정보)를 보고 [Docs]를 생성했다. Docs 는 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소를 항상 함께 담아야 하는 단일 산출물이다. 당신은 [정답 요지]와 [자료], [자동 검증 결과]를 기준으로 Docs 를 네 항목의 루브릭으로 채점한다. 채점은 관대하지 않게, 근거 없는 주장·지어낸 값·의도와 다른 SQL·서로 어긋나는 절에는 낮은 점수를 준다. 실행·컴파일이 통과했다는 사실만으로 실행 가능성이나 완결성에 높은 점수를 주지 않는다. SQL 과 코드 블록을 실제로 읽고 루브릭의 점검 항목을 하나씩 확인한다. 반드시 JSON 객체 하나만 출력한다. 설명문·마크다운 펜스는 출력하지 않는다.

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
| 01:30:11.770 | 20 | projection.cursor.advanced | 618c5ecf-d08f-4fa9-8762-3fd871dd9663 | - | - | - | 커서 이동 | projector=grip-result-projector |
| 01:30:11.770 | 30 | projection.done | 618c5ecf-d08f-4fa9-8762-3fd871dd9663 | - | - | - | catch-up 완료 | projector=grip-result-projector |
| 01:30:11.770 | 30 | - | 618c5ecf-d08f-4fa9-8762-3fd871dd9663 | - | - | - | request completed | - |
| 01:30:11.770 | 30 | projection.batch | 618c5ecf-d08f-4fa9-8762-3fd871dd9663 | - | - | - | 배치 처리 | projector=grip-result-projector |
| 01:30:11.773 | 30 | insight.card.request | e6070e58-70d5-406f-93a1-a92ca161723e | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 01:30:11.773 | 40 | insight.card.miss | e6070e58-70d5-406f-93a1-a92ca161723e | - | - | - | insight 카드 없음: 일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가? ← 트립 앵커 | - |
| 01:30:11.773 | 30 | - | e6070e58-70d5-406f-93a1-a92ca161723e | - | - | - | request completed | - |
| 01:30:12.080 | 30 | insight.card.request | 1b74591d-1801-4a8d-873e-76b323696c71 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 01:30:12.098 | 40 | insight.card.miss | 1b74591d-1801-4a8d-873e-76b323696c71 | - | - | - | insight 카드 없음: 일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가? | - |
| 01:30:12.099 | 30 | - | 1b74591d-1801-4a8d-873e-76b323696c71 | - | - | - | request completed | - |
| 01:30:12.404 | 30 | insight.card.request | f74dec4b-060c-4369-a40b-f985b02fbf63 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 01:30:12.409 | 40 | insight.card.miss | f74dec4b-060c-4369-a40b-f985b02fbf63 | - | - | - | insight 카드 없음: 일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가? | - |
| 01:30:12.410 | 30 | - | f74dec4b-060c-4369-a40b-f985b02fbf63 | - | - | - | request completed | - |
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
- 저장소에 실재하는 파일 (4건): src/projection/projection.controller.ts, src/projection/projection.service.ts, src/shared/database/schema/index.ts, src/shared/database/schema/service/read-grip-result.ts
- 저장소에 없는 파일 (1건): src/projection/projector/daily-stats.projector.ts

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
docId: analysis-e6070e58-70d5-406f-93a1-a92ca161723e
generatedAt: 2026-08-15T01:30:19.038Z
targetReadModel: read_daily_grip_stats_v2
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: v1
  to: v2
  affectedEndpoints:
    - "POST /multimodal"
    - "POST /grip-result"
    - "POST /insert-all"
    - "POST /daily-grip-stats-v2"
evidenceSources:
  - { origin: developer-logging, anchorId: "e6070e58-70d5-406f-93a1-a92ca161723e" }
  - { origin: developer-logging, anchorId: "1b74591d-1801-4a8d-873e-76b323696c71" }
  - { origin: developer-logging, anchorId: "f74dec4b-060c-4369-a40b-f985b02fbf63" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_daily_grip_stats_v2

> 결론(TL;DR): `read_daily_grip_stats_v2`을(를) 재생성한다 — 사용자는 일자별 파지 성공률 추이(날짜별 시도 수, 성공 수, 성공률)를 요청하나, 현재 시스템에는 원천 매핑(`read_grip_result`)만 존재하고 날짜별 집계(Aggregation) Read Model이 미구현되어 `insight.card.miss` 발생. (이상 유형: 카드 없는 Read Model 테이블 · 심각도: warning)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `projection.request`(level 30) 2회, `projection.batch`(level 30) 2회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `projection.event.mapped`(level 20) 60회, `-`(level 30) 5회, `projection.start`(level 30) 2회, `-`(level 20) 6회, `insert.request`(level 30) 1회, `insight.card.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insight.card.miss`(level 40) 1회, `insert.file.ok`(level 20) 60회, `projection.done`(level 30) 2회, `projection.cursor.advanced`(level 20) 2회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01:30:11.770 | 20 | projection.cursor.advanced | 618c5ecf-d08f-4fa9-8762-3fd871dd9663 | - | - | - | 커서 이동 | projector=grip-result-projector |
| 01:30:11.770 | 30 | projection.done | 618c5ecf-d08f-4fa9-8762-3fd871dd9663 | - | - | - | catch-up 완료 | projector=grip-result-projector |
| 01:30:11.770 | 30 | - | 618c5ecf-d08f-4fa9-8762-3fd871dd9663 | - | - | - | request completed | - |
| 01:30:11.770 | 30 | projection.batch | 618c5ecf-d08f-4fa9-8762-3fd871dd9663 | - | - | - | 배치 처리 | projector=grip-result-projector |
| 01:30:11.773 | 30 | insight.card.request | e6070e58-70d5-406f-93a1-a92ca161723e | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 01:30:11.773 | 40 | insight.card.miss | e6070e58-70d5-406f-93a1-a92ca161723e | - | - | - | insight 카드 없음: 일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가? ← 트립 앵커 | - |
| 01:30:11.773 | 30 | - | e6070e58-70d5-406f-93a1-a92ca161723e | - | - | - | request completed | - |
| 01:30:12.080 | 30 | insight.card.request | 1b74591d-1801-4a8d-873e-76b323696c71 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 01:30:12.098 | 40 | insight.card.miss | 1b74591d-1801-4a8d-873e-76b323696c71 | - | - | - | insight 카드 없음: 일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가? | - |
| 01:30:12.099 | 30 | - | 1b74591d-1801-4a8d-873e-76b323696c71 | - | - | - | request completed | - |
| 01:30:12.404 | 30 | insight.card.request | f74dec4b-060c-4369-a40b-f985b02fbf63 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 01:30:12.409 | 40 | insight.card.miss | f74dec4b-060c-4369-a40b-f985b02fbf63 | - | - | - | insight 카드 없음: 일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가? | - |
| 01:30:12.410 | 30 | - | f74dec4b-060c-4369-a40b-f985b02fbf63 | - | - | - | request completed | - |

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
- (level 40, `insight.card.miss`) insight 카드 없음: 일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가? ← 트립 앵커 → 기존 read_grip_result는 시도별(row-level) 데이터만 제공, DATE 기반 GROUP BY 집계(성 성공률·건수) 산출값이 미구현되어 조회 실패. [corr:e6070e58-70d5-406f-93a1-a92ca161723e]
- (level 40, `insight.card.miss`) insight 카드 없음: 일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가? → 반복 insight.card.miss(3회) 신호는 단순 404가 아닌 기존 Read Model로 충족 못 하는 조회 요구. [corr:1b74591d-1801-4a8d-873e-76b323696c71]
- (level 40, `insight.card.miss`) insight 카드 없음: 일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가? → 사용자 의도('일자별 파지 성공률 추이')는 단일 기존 모델 보강만으로는 충족할 수 없으므로 신규 테이블 생성이 필연. [corr:f74dec4b-060c-4369-a40b-f985b02fbf63]
- read_grip_result 스키마의 occurred_at(timestamptz)과 grip_succeed(smallint) 존재하나, total_attempts/success_count 집계 컬럼은 미존재 [corr:e6070e58-70d5-406f-93a1-a92ca161723e].
- GripResultProjector.map()에서 occurredAt: event.occurredAt 및 gripSucceed: payload.grip_succeed 추출만 수행, 일일 집계 로직 미적재 [corr:e6070e58-70d5-406f-93a1-a92ca161723e].
- ProjectionService.catchUpAll() 호출 순으로 catchUpMultimodal → catchUpGripResult, aggregation projector 미등록 [corr:1b74591d-1801-4a8d-873e-76b323696c71].
- 사용자 의도('일자별 파지 성공률 추이')는 단일 기존 모델 보강만으로는 충족할 수 없으므로 신규 테이블 생성이 필연 [corr:f74dec4b-060c-4369-a40b-f985b02fbf63].

### Decision Drivers
- CQRS Read Model 순도(Compute-on-Read 기각)
- 조회 성능/부하(ROW-level aggregation 미적재)
- 기존 스키마 정파성(read_grip_result 무수정 원칙)

### Considered Options
#### newReadModel (권장)
- 접근: read_daily_grip_stats_v2 테이블 생성 + dedicated aggregator projector 등록. src/projection/projector/daily-stats.projector.ts 신규 파일, map()에서 occurredAt.toISOString().split('T')[0] 도출, upsert()로 total_attempts/success_count 누적 갱신(excluded).
- 제안 필드: occurred_date, total_attempts, success_count
- 트레이드오프: 추가 ES 읽/쓰 부하 발생, 커서 관리 필요.
```typescript
map(event: EventStoreEventRow): DailyStatsInsert {
  const dateKey = event.occurredAt.toISOString().split('T')[0];
  return { occurredDate: dateKey, totalAttempts: 1, successCount: payload.grip_succeed };
}
async upsert(tx: DrizzleTx, row: DailyStatsInsert): Promise<void> {
  await tx.insert(readDailyGripStatsV2).values(row).onConflictDoUpdate({
    target: [readDailyGripStatsV2.occurredDate],
    set: { totalAttempts: readDailyGripStatsV2.totalAttempts + row.totalAttempts, successCount: readDailyGripStatsV2.successCount + row.successCount },
  });
}
```

#### computeOnRead
- 접근: API 레이어에서 read_grip_result GROUP BY date 계산. 기존 projector 미수정, Controller/Service 확증으로 SQL aggregation 수행.
- 제안 필드: -
- 트레이드오프: Read Model 순도 저감(Compute-on-Read), 고빈도 조회 시 DB 부하 증가.
```typescript
// src/projection/projection.controller.ts (확장)
@Post('/daily-stats')
dailyStats(): Promise<DailyStatsResult> {
  return this.projectionService.computeDailyStats();
}
```

#### singleTableExtension
- 접근: read_grip_result에 daily_total_attempts/daily_success_count 추가. 기존 스키마·프로젝터 수정, onConflictDoUpdate로 일일 키 매핑.
- 제안 필드: daily_total_attempts, daily_success_count
- 트레이드오프: Row-level table 구조 왜곡, key 충돌 관리 복잡성 증가.
```typescript
// src/shared/database/schema/service/read-grip-result.ts (확장)
export const readGripResult = pgTable('read_grip_result', {
  // ... 기존 필드 ...
  dailyTotalAttempts: bigint('daily_total_attempts'),
  dailySuccessCount: bigint('daily_success_count'),
}, (t) => [primaryKey({ columns: [t.sceneKey, t.attemptNum] })]);
```

### Decision Outcome
newReadModel (권장)

### Consequences
- (+) 조회 latency 감소
- (+) ES 읽/쓰 패턴 예측 가능
- (+) 기존 projector 재사용 호환성
- (−) 추가 테이블 관리 overhead
- (−) catch-up 커서 확장 필요

### Non-Goals
- read_multimodal URI 매핑
- grip_succeed 의미적 검증 로직 수정

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

- 대상: `read_daily_grip_stats_v2` · 키: occurred_date · 원천 이벤트: GripAttemptRecorded

```sql
-- Table: read_daily_grip_stats_v2
CREATE TABLE public.read_daily_grip_stats_v2 (
  occurred_date varchar NOT NULL,
  total_attempts double precision,
  success_count double precision,
  CONSTRAINT pk_read_daily_grip_stats_v2 PRIMARY KEY (occurred_date)
);

-- Index: idx_daily_stats_occurred_date
CREATE INDEX idx_daily_stats_occurred_date ON public.read_daily_grip_stats_v2 (occurred_date);
```

### 필드

```mschema
# Table: read_daily_grip_stats_v2
[
(occurred_date:varchar, 데이터 촬영 일자 (YYYY-MM-DD). event.occurredAt.toISOString().split('T')[0], Primary Key),
(total_attempts:double precision, 일자별 총 시도 수. 누적 갱신(excluded)으로 적재.),
(success_count:double precision, 일자별 성공 수. 누적 갱신(excluded)으로 적재.)
]
```

### 투영 매핑 명세 (이벤트 → 컬럼)

> upsert 키: occurred_date · 리플레이: projection_cursor 초기화 시 첫 이벤트 기준 occurred_date 설정. catch-up 전체 재투영 시 cumulative aggregation state reset 및 멱집(upsert) 전제 필수.

| 원천 이벤트 | payload 필드 | 컬럼 | 변환 |
| --- | --- | --- | --- |
| GripAttemptRecorded | grip_succeed | success_count | cumulative sum per occurred_date |

파생 컬럼(이벤트 payload 아님):
- `occurred_date` ← extract YYYY-MM-DD from 2D_image_file_name (parse _YYYYMMDD.ext pattern)
- `total_attempts` ← cumulative count of GripAttemptRecorded events per occurred_date

### Insight 카드 등록 (Insight Read DB 동기화)

> DDL 적용 시 아래 카드 등록도 함께 실행한다 — 다음 분석부터 신규 Read Model 이 LLM 컨텍스트에 노출된다.

```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_daily_grip_stats_v2', 'read_model', '일자별 파지 성공률 추이(날짜별 시도 수, 성공 수)를 위한 집계(Aggregation) Read Model.', 'occurred_date')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_daily_grip_stats_v2', 'occurred_date', 'varchar', '데이터 촬영 일자 (YYYY-MM-DD). event.occurredAt.toISOString().split(''T'')[0]', 1),
  ('read_daily_grip_stats_v2', 'total_attempts', 'double precision', '일자별 총 시도 수. 누적 갱신(excluded)으로 적재.', 2),
  ('read_daily_grip_stats_v2', 'success_count', 'double precision', '일자별 성공 수. 누적 갱신(excluded)으로 적재.', 3)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased (v1 → v2)

#### Added
- 신규 Read Model 테이블 `read_daily_grip_stats_v2` 및 집계 프로젝터 `DailyGripStatsV2Projector` 구현. 라우트 `/daily-grip-stats-v2` 추가.

### 마이그레이션 절차

- 하위호환 변경: -
- 파괴적 변경: 없음
- 컷오버 전 테스트: 1. `/daily-grip-stats-v2` 엔드포인트 호출 시 `ProjectionResult` 반환값이 정의된 schema/프로젝터 name(`daily-grip-stats-v2-projector`)과 일치하는지 검증.
2. `read_daily_grip_stats_v2` 테이블 생성 SQL 실행 후, 샘플 이벤트(occurredAt=2023-09-23, grip_succeed=1) 투영 시 occurred_date='2023-09-23', total_attempts='1', success_count='1' 행이 정확히 적재되는지 SQL 검증.
3. 기존 `/projection/multimodal` 및 `/projection/grip-result` 라우트 호출 시 v1 테이블/프로젝터 동작이 unchanged인지를 regression test.
- 롤백 창/조건: 컷오버 실패 또는 v2 충돌 발생 시: 1) `DROP TABLE public.read_daily_grip_stats_v2;` 및 `DROP INDEX idx_daily_stats_occurred_date;` SQL 실행. 2) `src/shared/database/schema/index.ts`, `src/projection/projection.service.ts`, `src/projection/projection.controller.ts` v2 관련 import/라우트/메서드 제거. 3) DI wiring revert within 1 projection window cycle.
- Insight 카드 등록: §2의 카드 등록 SQL을 DDL과 함께 적용(카탈로그 동기화)

### 사유·호환성

- 사유: 기존 Read Model(`read_grip_result`)은 장면별·시도별 원천 매핑만 존재하며, 일자별 집계(Aggregation) 테이블이 미구현되어 `insight.card.miss` 발생 [corr:e6070e58-70d5-406f-93a1-a92ca161723e]. v1 `GripResultProjector.map`의 `objectName: payload.objects[0].class_name` 줄은 단일 객체만 추출할 뿐만, 전수 시도를 날짜별 성공률 추이를 위한 집계 로직이 결결. 신규 Read Model `read_daily_grip_stats_v2`와 `DailyGripStatsV2Projector`를 추가하여 일자별 시도·성공 누적을 지원.
- 트리거 근거: 01:30:11.773 | 40 | insight.card.miss | e6070e58-70d5-406f-93a1-a92ca161723e | - | - | - | insight 카드 없음: 일자별 파지 성공률 추이를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다. 현재 Read Model로 가능한가? ← 트립 앵커
- v1 호환성: 기존 테이블·엔드포인트·프로젝터 클래스/name은 수정·삭제 금지. 변경은 '추가'다 — 새 테이블(`read_daily_grip_stats_v2`), 새 프로젝터(`DailyGripStatsV2Projector`), 새 라우트(`/daily-grip-stats-v2`), 새 서비스 메서드(`catchUpDailyGripStatsV2`). 기존 DI/라우트 파일은 한 줄 추가만 허용, v1 코드는 보존.

### 변경 파일

- `src/shared/database/schema/index.ts` (modifyFile) — 신규 스키마 export 추가. 기존 v1 export는 보존.
- `src/projection/projection.service.ts` (modifyFile) — 신규 프로젝터 DI 주입 및 catchUpDailyGripStatsV2 메서드 추가. 기존 v1 메서드/타입은 보존.
- `src/projection/projection.controller.ts` (modifyFile) — 신규 라우트 `/daily-grip-stats-v2` 추가. 기존 v1 엔드포인트는 보존.

## Optional — 부속 자료(컨텍스트 축소 시 생략 가능)

### 신규 Read Model — Drizzle 스키마

```ts
import { doublePrecision, pgTable, primaryKey, varchar } from 'drizzle-orm/pg-core';

export const readDailyGripStatsV2 = pgTable(
  "read_daily_grip_stats_v2",
  {
    occurredDate: varchar("occurred_date").notNull(),
    totalAttempts: doublePrecision("total_attempts"),
    successCount: doublePrecision("success_count"),
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
import { readDailyGripStatsV2 } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

type DailyGripStatsV2ProjectorInsert = InferInsertModel<typeof readDailyGripStatsV2>;

@Injectable()
export class DailyGripStatsV2Projector implements Projector<DailyGripStatsV2ProjectorInsert> {
  readonly name: string = "daily-grip-stats-v2-projector";

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(DailyGripStatsV2Projector.name);
  }

  map(event: EventStoreEventRow): DailyGripStatsV2ProjectorInsert {
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
    };
  }

  async upsert(tx: DrizzleTx, row: DailyGripStatsV2ProjectorInsert): Promise<void> {
    await tx
      .insert(readDailyGripStatsV2)
      .values(row)
      .onConflictDoUpdate({
        target: [readDailyGripStatsV2.occurredDate],
        set: {
          totalAttempts: sql`${readDailyGripStatsV2.totalAttempts} + ${row.totalAttempts}`,
          successCount: sql`${readDailyGripStatsV2.successCount} + ${row.successCount}`,
        },
      });
  }
}

```

### 신규 Read Model — 배선(컨트롤러/서비스/모듈)

```ts
// src/shared/database/schema/index.ts
export * from "./service/read-daily-grip-stats-v2";

// src/projection/projection.service.ts
import { DailyGripStatsProjector } from '@/projection/projector/daily-grip-stats.projector';

@Injectable()
export class ProjectionService {
  constructor(
    // ...
    private readonly dailyGripStats: DailyGripStatsProjector,
  ) {}

  catchUpDailyGripStats(): Promise<ProjectionResult> {
    return this.runner.run(this.dailyGripStats);
  }
}

// src/projection/projection.controller.ts
import { Controller, Post } from '@nestjs/common';

@Controller("projection")
export class ProjectionController {
  @Post("/daily-grip-stats-v2")
  dailyGripStats(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/daily-grip-stats-v2",
      },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpDailyGripStats();
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
export * from "./service/read-daily-grip-stats-v2";
```

### 버전 교체 코드 — `src/projection/projection.service.ts` (modifyFile)

```typescript
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { DailyGripStatsV2Projector } from '@/projection/projector/daily-grip-stats-v2.projector';
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
    private readonly dailyGripStatsV2: DailyGripStatsV2Projector,
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

  catchUpDailyGripStatsV2(): Promise<ProjectionResult> {
    return this.runner.run(this.dailyGripStatsV2);
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
      { action: LogAction.PROJECTION_REQUEST, [LogContext.ROUTE]: "POST /projection/insert-all" },
      "projection 요청 수신",
    );

    return this.projectionService.insertAllAndProjectAll();
  }

  @Post("/daily-grip-stats-v2")
  dailyGripStatsV2(): Promise<ProjectionResult> {
    this.logger.info(
      { action: LogAction.PROJECTION_REQUEST, [LogContext.ROUTE]: "POST /projection/daily-grip-stats-v2" },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpDailyGripStatsV2();
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
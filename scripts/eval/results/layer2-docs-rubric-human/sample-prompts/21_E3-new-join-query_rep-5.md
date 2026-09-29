당신은 이벤트 소싱 + CQRS 기반 Physical AI 데이터 플랫폼의 시니어 아키텍트이자 엄격한 평가자다. LLM 파이프라인이 [자료](로그·이벤트·스키마 정보)를 보고 [Docs]를 생성했다. Docs 는 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소를 항상 함께 담아야 하는 단일 산출물이다. 당신은 [정답 요지]와 [자료], [자동 검증 결과]를 기준으로 Docs 를 네 항목의 루브릭으로 채점한다. 채점은 관대하지 않게, 근거 없는 주장·지어낸 값·의도와 다른 SQL·서로 어긋나는 절에는 낮은 점수를 준다. 반드시 JSON 객체 하나만 출력한다. 설명문·마크다운 펜스는 출력하지 않는다.

---

[시나리오] E3-new-join-query
[상황] 사용자가 아래 조회를 요청했으나 기존 Read Model 로는 제공할 수 없다.
[정답 요지] 사용자가 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 보길 요청했으나 read_grip_result 와 read_multimodal 이 분리돼 있어 통합 Read Model 이 없음. 조치: (scene_key, attempt_num) 으로 조인한 통합 Read Model 신설(또는 뷰) + 백필, API v2 병행.

[자료] — Docs 생성 시 파이프라인이 받은 로그·이벤트·스키마 정보
<<<자료 시작>>>
<logging_context>
## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `projection.request`(level 30) 2회, `projection.batch`(level 30) 2회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `projection.event.mapped`(level 20) 60회, `-`(level 30) 5회, `projection.start`(level 30) 2회, `-`(level 20) 6회, `insert.request`(level 30) 1회, `insight.card.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insight.card.miss`(level 40) 1회, `insert.file.ok`(level 20) 60회, `projection.done`(level 30) 2회, `projection.cursor.advanced`(level 20) 2회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01:09:58.715 | 30 | - | f5c4e7c5-a0a2-46f1-a56c-ef306b3bfc1c | - | - | - | request completed | - |
| 01:09:58.715 | 30 | projection.batch | f5c4e7c5-a0a2-46f1-a56c-ef306b3bfc1c | - | - | - | 배치 처리 | projector=grip-result-projector |
| 01:09:58.715 | 30 | projection.done | f5c4e7c5-a0a2-46f1-a56c-ef306b3bfc1c | - | - | - | catch-up 완료 | projector=grip-result-projector |
| 01:09:58.715 | 20 | projection.cursor.advanced | f5c4e7c5-a0a2-46f1-a56c-ef306b3bfc1c | - | - | - | 커서 이동 | projector=grip-result-projector |
| 01:09:58.718 | 30 | insight.card.request | 7ec0d044-5f61-427a-ac34-f2bdbafd80a1 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 01:09:58.719 | 40 | insight.card.miss | 7ec0d044-5f61-427a-ac34-f2bdbafd80a1 | - | - | - | insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. ← 트립 앵커 | - |
| 01:09:58.719 | 30 | - | 7ec0d044-5f61-427a-ac34-f2bdbafd80a1 | - | - | - | request completed | - |
| 01:09:59.022 | 30 | insight.card.request | dc7fe9e5-d900-471d-82dc-4ae0cea2a610 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 01:09:59.025 | 40 | insight.card.miss | dc7fe9e5-d900-471d-82dc-4ae0cea2a610 | - | - | - | insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. | - |
| 01:09:59.025 | 30 | - | dc7fe9e5-d900-471d-82dc-4ae0cea2a610 | - | - | - | request completed | - |
| 01:09:59.330 | 30 | insight.card.request | 5af21770-656a-47c9-8b26-df8ba19ee40d | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 01:09:59.333 | 40 | insight.card.miss | 5af21770-656a-47c9-8b26-df8ba19ee40d | - | - | - | insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. | - |
| 01:09:59.333 | 30 | - | 5af21770-656a-47c9-8b26-df8ba19ee40d | - | - | - | request completed | - |
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
- 저장소에 실재하는 파일 (3건): src/projection/projection.controller.ts, src/projection/projection.service.ts, src/shared/database/schema/index.ts
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
docId: analysis-7ec0d044-5f61-427a-ac34-f2bdbafd80a1
generatedAt: 2026-08-15T01:10:00.966Z
targetReadModel: read_grip_media_join
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: v1
  to: v2
  affectedEndpoints:
    - "POST /multimodal"
    - "POST /grip-result"
    - "POST /insert-all"
    - "POST /grip-media-join"
evidenceSources:
  - { origin: developer-logging, anchorId: "7ec0d044-5f61-427a-ac34-f2bdbafd80a1" }
  - { origin: developer-logging, anchorId: "dc7fe9e5-d900-471d-82dc-4ae0cea2a610" }
  - { origin: developer-logging, anchorId: "5af21770-656a-47c9-8b26-df8ba19ee40d" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_grip_media_join

> 결론(TL;DR): `read_grip_media_join`을(를) 재생성한다 — 사용자가 파지 결과와 해당 시도의 이미지·영상 경로를 조인된 뷰를 요청하나, 시스템의 Insight 카드 카탈로그에는 단일 조인 모델이 존재하지. 기존 `read_grip_result`와 `read_multimodal`은 각각 독립으로 제공하여 사용자의 일관성 요구를 충족할 수 없음. (이상 유형: 카드 없는 Read Model 테이블 · 심각도: warning)

<logging_context>

## 이상 로그 맥락 (±N 윈도우)
> 빈도: 최근 1h — `projection.request`(level 30) 2회, `projection.batch`(level 30) 2회, `insert.batch.start`(level 30) 1회, `log.delete.request`(level 30) 1회, `projection.event.mapped`(level 20) 60회, `-`(level 30) 5회, `projection.start`(level 30) 2회, `-`(level 20) 6회, `insert.request`(level 30) 1회, `insight.card.request`(level 30) 1회, `log.delete.done`(level 30) 1회, `insight.card.miss`(level 40) 1회, `insert.file.ok`(level 20) 60회, `projection.done`(level 30) 2회, `projection.cursor.advanced`(level 20) 2회, `insert.batch.done`(level 30) 1회.

| time | level | action | correlation_id | stream_id | attempt | global_seq | msg | detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01:09:58.715 | 30 | - | f5c4e7c5-a0a2-46f1-a56c-ef306b3bfc1c | - | - | - | request completed | - |
| 01:09:58.715 | 30 | projection.batch | f5c4e7c5-a0a2-46f1-a56c-ef306b3bfc1c | - | - | - | 배치 처리 | projector=grip-result-projector |
| 01:09:58.715 | 30 | projection.done | f5c4e7c5-a0a2-46f1-a56c-ef306b3bfc1c | - | - | - | catch-up 완료 | projector=grip-result-projector |
| 01:09:58.715 | 20 | projection.cursor.advanced | f5c4e7c5-a0a2-46f1-a56c-ef306b3bfc1c | - | - | - | 커서 이동 | projector=grip-result-projector |
| 01:09:58.718 | 30 | insight.card.request | 7ec0d044-5f61-427a-ac34-f2bdbafd80a1 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 01:09:58.719 | 40 | insight.card.miss | 7ec0d044-5f61-427a-ac34-f2bdbafd80a1 | - | - | - | insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. ← 트립 앵커 | - |
| 01:09:58.719 | 30 | - | 7ec0d044-5f61-427a-ac34-f2bdbafd80a1 | - | - | - | request completed | - |
| 01:09:59.022 | 30 | insight.card.request | dc7fe9e5-d900-471d-82dc-4ae0cea2a610 | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 01:09:59.025 | 40 | insight.card.miss | dc7fe9e5-d900-471d-82dc-4ae0cea2a610 | - | - | - | insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. | - |
| 01:09:59.025 | 30 | - | dc7fe9e5-d900-471d-82dc-4ae0cea2a610 | - | - | - | request completed | - |
| 01:09:59.330 | 30 | insight.card.request | 5af21770-656a-47c9-8b26-df8ba19ee40d | - | - | - | insight 카드 단건 조회 요청 수신 | - |
| 01:09:59.333 | 40 | insight.card.miss | 5af21770-656a-47c9-8b26-df8ba19ee40d | - | - | - | insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. | - |
| 01:09:59.333 | 30 | - | 5af21770-656a-47c9-8b26-df8ba19ee40d | - | - | - | request completed | - |

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
- (level 40, `insight.card.miss`) insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. ← 트립 앵커 → 동일 시도 기준 조인 뷰의 Insight Card/Read Model 부재 신호. [corr:7ec0d044-5f61-427a-ac34-f2bdbafd80a1]
- (level 40, `insight.card.miss`) insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. → 반발 요청으로 Read Model 부재 확신. [corr:dc7fe9e5-d900-471d-82dc-4ae0cea2a610]
- (level 40, `insight.card.miss`) insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다. → 시스템의 현재 카탈로그에는 단일 조인 모델이 존재하지. [corr:5af21770-656a-47c9-8b26-df8ba19ee40d]
- read_grip_result 스키마에 image_2d_file_name, video_file_name 등 미디어 컬럼이 결결. 반면 read_multimodal 스키마에 grip_succeed, object_name 등 파지 결과 컬럼이 결결.
- multimodal.projector.ts 의 map() 메서드에서 image2dUri: null, videoUri: null 로직이 고정되어, URI 매핑이 미구현 상태임.
- grip-result.projector.ts 의 map() 메서드는 payload.objects[0].class_name 등 파지 데이터만 추출, 미디어 payload("2D_image_file_name", video_file_name)는 무시.
- 두 기존 Read Model 모두 (scene_key, attempt_num) 으로 동동 Primary Key 설정되어, DB 차원 조인 가능하나 Insight 카드 카탈로그에 미등록.

### Decision Drivers
- 일관성 요구 충족 (동일 시도 기준 한 화면 보기)
- Insight 카탈로그 정립 (신규 Card 등록)
- 기존 Read Model 책임 분리 유지
- URI 매핑 미구현 상태 고려

### Considered Options
#### read_multimodal 확장을 파지 결과 컬럼에 추가
- 접근: MultiModalProjector.map() 수정으로 grip_succeed, object_name 등 주입.
- 제안 필드: objectName, gripSucceed, gripperType
- 트레이드오프: 스키마 확장, 중복 데이터 저장 비용 증가, 단일 실패 시 전체 뷰 유실 리스크.
```typescript
return { sceneKey: event.streamId.replace(/^grip-attempt:/, ""), attemptNum: event.attemptNum, occurredAt: event.occurredAt, image2dFileName: payload["2D_image_file_name"], image2dUri: null, videoFileName: payload.video_file_name, videoUri: null, objectName: payload.objects[0].class_name, gripSucceed: payload.grip_succeed, gripperType: "finger", streamId: event.streamId, globalSeq: event.globalSeq };
```

#### read_grip_media_join 신규 Read Model 생성
- 접근: 신규 Projector(GripMediaJoinProjector) 구현, map() 메서드에서 동동 payload 파싱하여 확정 설계 테이블 매핑.
- 제안 필드: sceneKey, attemptNum, objectName, gripSucceed, gripperType, occurredAt, grip2dPose, grip3dPose, robotTf, humanAnnotationGrasp, image2dFileName, image2dUri, videoFileName, videoUri, streamId, globalSeq
- 트레이드오프: API 뷰 일관성 확보, 저장 공간 중복 발생, 신규 카탈로그/버전 노출 필요.
```typescript
return { sceneKey: event.streamId.replace(/^grip-attempt:/, ""), attemptNum: event.attemptNum, objectName: payload.objects[0].class_name, gripSucceed: payload.grip_succeed, gripperType: "finger", occurredAt: event.occurredAt, grip2dPose: payload.grip_data.grip_2d_pose, grip3dPose: payload.grip_data.grip_3d_pose, robotTf: payload.robot_tf, humanAnnotationGrasp: payload.human_annotation_grasp, image2dFileName: payload["2D_image_file_name"], image2dUri: null, videoFileName: payload.video_file_name, videoUri: null, streamId: event.streamId, globalSeq: event.globalSeq };
```

#### 기존 모델 유지 + DB View/Query Join
- 접근: 기존 모델 유지 + DB View/Query Join.
- 제안 필드: -
- 트레이드오프: Read Model 부재 해결 안됨(Insight 카드 미등록), 런타임 조인 오버헤드 발생.
```typescript
(application layer join logic omitted)
```

### Decision Outcome
read_grip_media_join 신규 Read Model 생성

### Consequences
- (+) API 뷰 일관성 확보
- (+) Insight 카탈로그 정립
- (+) 기존 Read Model 책임 분리 유지
- (−) 저장 공간 중복 발생
- (−) API 버전을 minor로 상승
- (−) 신규 엔드포인트/테이블 관리 오버헤드 발생

### Non-Goals
- 기존 read_grip_result, read_multimodal 스키마/프로젝터 수정 금지
- URI 매핑 구현(추후 미션)
- zod 거절/투영 실패 poison event 격리 양상 대응

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

- 대상: `read_grip_media_join` · 키: (scene_key, attempt_num) · 원천 이벤트: GripAttemptRecorded

```sql
CREATE TABLE read_grip_media_join (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  object_name varchar,
  grip_succeed smallint,
  gripper_type varchar(16),
  occurred_at timestamptz,
  grip_2d_pose jsonb,
  grip_3d_pose jsonb,
  robot_tf jsonb,
  human_annotation_grasp jsonb,
  image_2d_file_name varchar,
  image_2d_uri text,
  video_file_name varchar,
  video_uri text,
  stream_id varchar,
  global_seq bigint,
  PRIMARY KEY (scene_key, attempt_num)
);
```

### 필드

```mschema
# Table: read_grip_media_join
[
(scene_key:varchar, 장면 식별 키 (stream_id에서 'grip-attempt:' 제거), Primary Key),
(attempt_num:smallint, 동일 장면 내 파지 시도 번호, Primary Key),
(object_name:varchar, 파지 대상 객체명 (payload.objects[0].class_name)),
(grip_succeed:smallint, 파지 성공 여부 (0=실패, 1=성공)),
(gripper_type:varchar(16), 그리퍼 종류 (finger/suction)),
(occurred_at:timestamptz, 데이터 촬영 일자),
(grip_2d_pose:jsonb, 2D 파지점 (핑거: xl,xr,yl,yr / 흡착: x,y)),
(grip_3d_pose:jsonb, 3D 파지점 (핑거: x1..z8 24좌표 / 흡착: x,y,z,roll,pitch,yaw,penetrate)),
(robot_tf:jsonb, 로봇 변환행렬 (rotation_3x3 + translation_3x1)),
(human_annotation_grasp:jsonb, 휴먼 어노테이션 파지 영역),
(image_2d_file_name:varchar, 원천 2D 이미지 파일명 (payload.2D_image_file_name)),
(image_2d_uri:text, 2D 이미지 저장 위치 URI),
(video_file_name:varchar, 원천 비디오 파일명 (payload.video_file_name)),
(video_uri:text, 비디오 저장 위치 URI),
(stream_id:varchar, ES 스트림 ID),
(global_seq:bigint, 투영 출처 이벤트의 ES 전역 시퀀스)
]
```

### 투영 매핑 명세 (이벤트 → 컬럼)

> upsert 키: scene_key, attempt_num · 리플레이: projection_cursor 초기화 시 주의: 첫 투영 시작부터 현재 커서까지 전체 catch-up 재투영 수행해야 일관성 유지. upsert 전제 조건은 key(scene_key, attempt_num) 중복 시 이전 row 완전 overwrite(멱idency) 적용.

| 원천 이벤트 | payload 필드 | 컬럼 | 변환 |
| --- | --- | --- | --- |
| GripAttemptRecorded | objects[].class_name | object_name | verbatim |
| GripAttemptRecorded | grip_succeed | grip_succeed | verbatim |
| GripAttemptRecorded | grip_data.grip_2d_pose | grip_2d_pose | verbatim |
| GripAttemptRecorded | grip_data.grip_3d_pose | grip_3d_pose | verbatim |
| GripAttemptRecorded | human_annotation_grasp[] | human_annotation_grasp | verbatim |
| GripAttemptRecorded | 2D_image_file_name | image_2d_file_name | verbatim |
| GripAttemptRecorded | video_file_name | video_file_name | verbatim |

파생 컬럼(이벤트 payload 아님):
- `scene_key` ← stream_id prefix 'grip-attempt:' 제거
- `attempt_num` ← 2D_image_file_name 또는 video_file_name 내 '_XX_' 패턴 추출 (시도번호)
- `gripper_type` ← 고정값 'finger' (payload 미제공, 설계 기준)
- `occurred_at` ← data_key 또는 filename 날짜 부분 'YYYYMMDD' → ISO8601 timestamptz
- `robot_tf` ← robot_tf.rotation_3x3 & translation_3x1 합쳐서 단일 JSON object
- `image_2d_uri` ← null (추후 매핑 로직 대임)
- `video_uri` ← null (추후 매핑 로직 대임)
- `stream_id` ← 이벤트 envelope metadata stream_id
- `global_seq` ← 이벤트 envelope metadata global_seq

### Insight 카드 등록 (Insight Read DB 동기화)

> DDL 적용 시 아래 카드 등록도 함께 실행한다 — 다음 분석부터 신규 Read Model 이 LLM 컨텍스트에 노출된다.

```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_grip_media_join', 'read_model', '파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다.', '(scene_key, attempt_num)')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_grip_media_join', 'scene_key', 'varchar', '장면 식별 키 (stream_id에서 ''grip-attempt:'' 제거)', 1),
  ('read_grip_media_join', 'attempt_num', 'smallint', '동일 장면 내 파지 시도 번호', 2),
  ('read_grip_media_join', 'object_name', 'varchar', '파지 대상 객체명 (payload.objects[0].class_name)', 3),
  ('read_grip_media_join', 'grip_succeed', 'smallint', '파지 성공 여부 (0=실패, 1=성공)', 4),
  ('read_grip_media_join', 'gripper_type', 'varchar(16)', '그리퍼 종류 (finger/suction)', 5),
  ('read_grip_media_join', 'occurred_at', 'timestamptz', '데이터 촬영 일자', 6),
  ('read_grip_media_join', 'grip_2d_pose', 'jsonb', '2D 파지점 (핑거: xl,xr,yl,yr / 흡착: x,y)', 7),
  ('read_grip_media_join', 'grip_3d_pose', 'jsonb', '3D 파지점 (핑거: x1..z8 24좌표 / 흡착: x,y,z,roll,pitch,yaw,penetrate)', 8),
  ('read_grip_media_join', 'robot_tf', 'jsonb', '로봇 변환행렬 (rotation_3x3 + translation_3x1)', 9),
  ('read_grip_media_join', 'human_annotation_grasp', 'jsonb', '휴먼 어노테이션 파지 영역', 10),
  ('read_grip_media_join', 'image_2d_file_name', 'varchar', '원천 2D 이미지 파일명 (payload.2D_image_file_name)', 11),
  ('read_grip_media_join', 'image_2d_uri', 'text', '2D 이미지 저장 위치 URI', 12),
  ('read_grip_media_join', 'video_file_name', 'varchar', '원천 비디오 파일명 (payload.video_file_name)', 13),
  ('read_grip_media_join', 'video_uri', 'text', '비디오 저장 위치 URI', 14),
  ('read_grip_media_join', 'stream_id', 'varchar', 'ES 스트림 ID', 15),
  ('read_grip_media_join', 'global_seq', 'bigint', '투영 출처 이벤트의 ES 전역 시퀀스', 16)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased (v1 → v2)

#### Added
- 신류 Read Model 테이블 read_grip_media_join, Projector GripMediaJoinProjector, 라우트 /projection/grip-media-join 추가.

### 마이그레이션 절차

- 하위호환 변경: 기존 v1 라우트(/multimodal, /grip-result) 및 DI/테이블 무손단.; 신류 v2 라우트만 추가하여 기존 클라이언트 호출 경로 영향 없음.
- 파괴적 변경: 없음
- 컷오버 전 테스트: POST /projection/grip-media-join 엔드포인트 실행 시 CatchUpAllResult.gripMediaJoin.processed > 0 검증. 반환된 ProjectionResult.projectorName === "grip-media-join-projector" 확인.
- 롤백 창/조건: DROP TABLE read_grip_media_join; DI 제거; 라우트 @Post("/grip-media-join") 삭제; CatchUpAllResult 타입 revert.
- Insight 카드 등록: §2의 카드 등록 SQL을 DDL과 함께 적용(카탈로그 동기화)

### 사유·호환성

- 사유: 기존 Read Model(`read_grip_result`, `read_multimodal`)은 각각 파지 결과와 미디어 경로만 제공, 요청한 '동일 시도(scene_key, attempt_num) 기준 조인 뷰'의 Insight Card/Read Model 부재[corr:7ec0d044-5f61-427a-ac34-f2bdbafd80a1]. 사용자의 일관성 요구를 충족할 수 없음.
- 트리거 근거: 01:09:58.718 | 30 | insight.card.request | 7ec0d044-5f61-427a-ac34-f2bdbafd80a1 | - | - | - | insight 카드 단건 조회 요청 수신[corr:7ec0d044-5f61-427a-ac34-f2bdbafd80a1] → 01:09:58.719 | 40 | insight.card.miss | 7ec0d044-5f61-427a-ac34-f2bdbafd80a1 | - | - | - | insight 카드 없음: 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 함께 보고 싶다.[corr:7ec0d044-5f61-427a-ac34-f2bdbafd80a1]. 동일 패턴 재발 01:09:59.022/025[corr:dc7fe9e5-d900-471d-82dc-4ae0cea2a610], 01:09:59.330/333[corr:5af21770-656a-47c9-8b26-df8ba19ee40d]. v1 코드의 GripResultProjector와 MultiModalProjector는 각각 독립 테이블을 투영하여, 단일 조인 모델 부재가 근본 원인.
- v1 호환성: 기존 read_grip_result 및 read_multimodal 테이블·프로젝터·라우트·DI를 무손단 보존. 신규 v2 라우트(/projection/grip-media-join)와 서비스 메서드만 추가하여 backwardCompatible.

### 변경 파일

- `src/projection/projection.service.ts` (modifyFile) — DI 추가, CatchUpAllResult 타입 확장, catchUpGripMediaJoin 메서드 추가. 기존 v1 로직 무손단.
- `src/projection/projection.controller.ts` (modifyFile) — 신류 라우트 /projection/grip-media-join 추가. 기존 v1 엔드포인트 무손단.
- `src/shared/database/schema/index.ts` (modifyFile) — 신류 테이블 export 추가. 기존 v1 export 무손단.

## Optional — 부속 자료(컨텍스트 축소 시 생략 가능)

### 신규 Read Model — Drizzle 스키마

```ts
import {
  bigint,
  index,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  timestamp,
  varchar,
  text,
} from 'drizzle-orm/pg-core';

export const readGripMediaJoin = pgTable(
  "read_grip_media_join",
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

    image2dFileName: varchar("image_2d_file_name"),
    image2dUri: text("image_2d_uri"),

    videoFileName: varchar("video_file_name"),
    videoUri: text("video_uri"),

    streamId: varchar("stream_id").notNull(),
    globalSeq: bigint("global_seq", { mode: "number" }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.sceneKey, t.attemptNum] }),
    index("idx_read_grip_media_join_scene_attempt")
      .on(t.sceneKey, t.attemptNum),
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
import { readGripMediaJoin } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

type ReadGripMediaJoinInsert = InferInsertModel<typeof readGripMediaJoin>;

@Injectable()
export class GripMediaJoinProjector implements Projector<ReadGripMediaJoinInsert> {
  readonly name: string = "grip-media-join-projector";

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(GripMediaJoinProjector.name);
  }

  map(event: EventStoreEventRow): ReadGripMediaJoinInsert {
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
        `grip-media-join map: empty objects in event ${event.eventId}`,
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
      image2dFileName: payload["2D_image_file_name"],
      image2dUri: null,
      videoFileName: payload.video_file_name,
      videoUri: null,
      streamId: event.streamId,
      globalSeq: event.globalSeq,
    };
  }

  async upsert(tx: DrizzleTx, row: ReadGripMediaJoinInsert): Promise<void> {
    await tx
      .insert(readGripMediaJoin)
      .values(row)
      .onConflictDoUpdate({
        target: [readGripMediaJoin.sceneKey, readGripMediaJoin.attemptNum],
        set: {
          objectName: row.objectName,
          gripSucceed: row.gripSucceed,
          gripperType: row.gripperType,
          occurredAt: row.occurredAt,
          grip2dPose: row.grip2dPose,
          grip3dPose: row.grip3dPose,
          robotTf: row.robotTf,
          humanAnnotationGrasp: row.humanAnnotationGrasp,
          image2dFileName: row.image2dFileName,
          image2dUri: row.image2dUri,
          videoFileName: row.videoFileName,
          videoUri: row.videoUri,
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
export * from "./insight/insight-entity";
export * from "./insight/insight-field";
export * from "./log/log-cursor";
export * from "./log/log-event";
export * from "./service/event";
export * from "./service/projection-cursor";
export * from "./service/read-grip-result";
export * from "./service/read-multimodal";
export * from "./service/read-grip-media-join"; // 신규 Read Model export

// src/projection/projection.service.ts (providers 및 catchUpAll 추가)
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripMediaJoinProjector } from '@/projection/projector/grip-media-join.projector'; // 신규 import
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { ProjectionResult } from '@/projection/projector/projector';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';
import { LogAction } from '@/shared/logger/logging-context';

export type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
  gripMediaJoin: ProjectionResult; // 신규 결과 타입
};

@Injectable()
export class ProjectionService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly runner: CatchUpRunner,
    private readonly multimodal: MultiModalProjector,
    private readonly gripResult: GripResultProjector,
    private readonly gripMediaJoin: GripMediaJoinProjector, // 신규 주입
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

  catchUpGripMediaJoin(): Promise<ProjectionResult> { // 신규 catchUp 메서드
    return this.runner.run(this.gripMediaJoin);
  }

  async catchUpAll(): Promise<CatchUpAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_START }, "전체 투영 시작");

    const multimodal: ProjectionResult = await this.catchUpMultimodal();
    const gripResult: ProjectionResult = await this.catchUpGripResult();
    const gripMediaJoin: ProjectionResult = await this.catchUpGripMediaJoin(); // 신규 투영 실행

    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");

    return { multimodal, gripResult, gripMediaJoin };
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

// src/projection/projection.controller.ts (라우트 추가)
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

  @Post("/grip-media-join") // 신규 라우트
  gripMediaJoin(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/grip-media-join",
      },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpGripMediaJoin();
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
import { ProjectionResult } from '@/projection/projector/projector';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';
import { GripMediaJoinProjector } from '@/projection/projector/grip-media-join.projector';
import { LogAction } from '@/shared/logger/logging-context';

export type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
  gripMediaJoin: ProjectionResult;
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
    private readonly gripMediaJoin: GripMediaJoinProjector,
  ) {
    this.logger.setContext(ProjectionService.name);
  }

  catchUpMultimodal(): Promise<ProjectionResult> {
    return this.runner.run(this.multimodal);
  }

  catchUpGripResult(): Promise<ProjectionResult> {
    return this.runner.run(this.gripResult);
  }

  catchUpGripMediaJoin(): Promise<ProjectionResult> {
    return this.runner.run(this.gripMediaJoin);
  }

  async catchUpAll(): Promise<CatchUpAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_START }, "전체 투영 시작");

    const multimodal: ProjectionResult = await this.catchUpMultimodal();
    const gripResult: ProjectionResult = await this.catchUpGripResult();
    const gripMediaJoin: ProjectionResult = await this.catchUpGripMediaJoin();

    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");

    return { multimodal, gripResult, gripMediaJoin };
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

  @Post("/grip-media-join")
  gripMediaJoin(): Promise<ProjectionResult> {
    this.logger.info(
      { action: LogAction.PROJECTION_REQUEST, [LogContext.ROUTE]: "POST /projection/grip-media-join" },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpGripMediaJoin();
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
export * from "./service/read-grip-media-join";
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
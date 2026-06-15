import type {
  InsightEntityInput,
  InsightFieldInput,
} from "@/insight/repository/insight-catalog.repository";

export interface SeedCard {
  entity: InsightEntityInput;
  fields: InsightFieldInput[];
}

/*
 * Phase 1 InsightDB 시드 카드.
 *
 * - read_grip_result / read_multimodal : 현존 Read Model 카드(완성품). 컬럼은 각 Drizzle 스키마와 1:1.
 * - GripAttemptRecorded                : 원천 이벤트 payload 카드(재료). 필드는 zod toyDataSchema 기준.
 *
 * 도메인 키 규칙(insert.service / toy-data-file-name.parser 기준):
 *   파일명  : {카테고리}_{CR카메라코드}_{객체명}_{장면번호5}_{시도번호2}_{날짜8}.json
 *   scene_key = {카테고리}_{카메라코드}_{객체명}_{장면번호}
 *   stream_id = "grip-attempt:" + scene_key
 *   attempt_num = 시도번호(정수)
 *   event_type = "GripAttemptRecorded"
 *
 * 예시 값은 data/research(활용데이터구조)와 toy-data 파일명 규칙에서 가져온 대표값이다.
 */
export const PHASE1_CARDS: SeedCard[] = [
  {
    entity: {
      entityName: "read_grip_result",
      kind: "read_model",
      purpose: "장면별 로봇 파지 결과 조회 (성공여부·포즈·그리퍼)",
      keyColumns: "(scene_key, attempt_num)",
      rowCount: null,
      refreshedAt: null,
    },
    fields: [
      {
        entityName: "read_grip_result",
        fieldName: "scene_key",
        dataType: "varchar",
        meaning:
          "장면 식별 키 = {카테고리}_{카메라코드}_{객체명}_{장면번호} (stream_id에서 'grip-attempt:' 제거)",
        example: "반려동물용품_CR01_강아지공룡알장난감_00018",
        displayOrder: 1,
      },
      {
        entityName: "read_grip_result",
        fieldName: "attempt_num",
        dataType: "smallint",
        meaning: "같은 장면 내 파지 시도 번호 (파일명의 시도번호)",
        example: "1",
        displayOrder: 2,
      },
      {
        entityName: "read_grip_result",
        fieldName: "object_name",
        dataType: "varchar",
        meaning: "파지 대상 객체명 (payload.objects[0].class_name)",
        example: "강아지공룡알장난감",
        displayOrder: 3,
      },
      {
        entityName: "read_grip_result",
        fieldName: "grip_succeed",
        dataType: "smallint",
        meaning: "파지 성공 여부 (0=실패, 1=성공)",
        example: "1",
        displayOrder: 4,
      },
      {
        entityName: "read_grip_result",
        fieldName: "gripper_type",
        dataType: "varchar(16)",
        meaning: "그리퍼 종류 (현재 적재는 finger 고정, 흡착형은 suction)",
        example: "finger",
        displayOrder: 5,
      },
      {
        entityName: "read_grip_result",
        fieldName: "occurred_at",
        dataType: "timestamptz",
        meaning: "데이터 촬영 일자 (파일명 날짜에서 도출)",
        example: "2023-09-23T00:00:00Z",
        displayOrder: 6,
      },
      {
        entityName: "read_grip_result",
        fieldName: "grip_2d_pose",
        dataType: "jsonb",
        meaning: "2D 파지점 (핑거: xl,xr,yl,yr / 흡착: x,y)",
        example: '{"xl":0,"xr":0,"yl":0,"yr":0}',
        displayOrder: 7,
      },
      {
        entityName: "read_grip_result",
        fieldName: "grip_3d_pose",
        dataType: "jsonb",
        meaning:
          "3D 파지점 (핑거: x1..z8 24좌표 / 흡착: x,y,z,roll,pitch,yaw,penetrate)",
        example: '{"x1":10.2,"y1":3.1,"z1":-100.0, "...":"...", "z8":-90.5}',
        displayOrder: 8,
      },
      {
        entityName: "read_grip_result",
        fieldName: "robot_tf",
        dataType: "jsonb",
        meaning: "로봇 변환행렬 (rotation_3x3 9개 + translation_3x1 3개)",
        example:
          '{"rotation_3x3":[1,0,0,0,1,0,0,0,1],"translation_3x1":[0,0,0]}',
        displayOrder: 9,
      },
      {
        entityName: "read_grip_result",
        fieldName: "human_annotation_grasp",
        dataType: "jsonb",
        meaning: "휴먼 어노테이션 파지 영역 (핑거: keypoints 2점)",
        example:
          '[{"annotation_type":"keypoints","id":1,"annotation_points":[120,330,140,360],"num_keypoints":2}]',
        displayOrder: 10,
      },
      {
        entityName: "read_grip_result",
        fieldName: "stream_id",
        dataType: "varchar",
        meaning: 'ES 스트림 ID ("grip-attempt:" + scene_key) — 추적 키',
        example: "grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018",
        displayOrder: 11,
      },
      {
        entityName: "read_grip_result",
        fieldName: "global_seq",
        dataType: "bigint",
        meaning: "투영 출처 이벤트의 ES 전역 시퀀스 — 추적 키",
        example: "1024",
        displayOrder: 12,
      },
    ],
  },
  {
    entity: {
      entityName: "read_multimodal",
      kind: "read_model",
      purpose: "장면별 2D이미지·비디오 미디어 링크 조회",
      keyColumns: "(scene_key, attempt_num)",
      rowCount: null,
      refreshedAt: null,
    },
    fields: [
      {
        entityName: "read_multimodal",
        fieldName: "scene_key",
        dataType: "varchar",
        meaning: "장면 식별 키 (read_grip_result와 동일 규칙)",
        example: "반려동물용품_CR01_강아지공룡알장난감_00018",
        displayOrder: 1,
      },
      {
        entityName: "read_multimodal",
        fieldName: "attempt_num",
        dataType: "smallint",
        meaning: "같은 장면 내 파지 시도 번호",
        example: "1",
        displayOrder: 2,
      },
      {
        entityName: "read_multimodal",
        fieldName: "occurred_at",
        dataType: "timestamptz",
        meaning: "데이터 촬영 일자",
        example: "2023-09-23T00:00:00Z",
        displayOrder: 3,
      },
      {
        entityName: "read_multimodal",
        fieldName: "image_2d_file_name",
        dataType: "varchar",
        meaning: "원천 2D 이미지 파일명 (payload.2D_image_file_name)",
        example: "반려동물용품_CR01_강아지공룡알장난감_00018_01_20230923.jpg",
        displayOrder: 4,
      },
      {
        entityName: "read_multimodal",
        fieldName: "image_2d_uri",
        dataType: "text",
        meaning:
          "2D 이미지 저장 위치 URI (현재 projector가 null로 둠 — 추후 매핑)",
        example: null,
        displayOrder: 5,
      },
      {
        entityName: "read_multimodal",
        fieldName: "video_file_name",
        dataType: "varchar",
        meaning:
          "원천 비디오 파일명 (시도번호 자리가 항상 00 — 한 비디오 N:1로 여러 시도가 공유)",
        example: "반려동물용품_CR01_강아지공룡알장난감_00018_00_20230923.mp4",
        displayOrder: 6,
      },
      {
        entityName: "read_multimodal",
        fieldName: "video_uri",
        dataType: "text",
        meaning:
          "비디오 저장 위치 URI (현재 projector가 null로 둠 — 추후 매핑)",
        example: null,
        displayOrder: 7,
      },
      {
        entityName: "read_multimodal",
        fieldName: "stream_id",
        dataType: "varchar",
        meaning: "ES 스트림 ID — 추적 키",
        example: "grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018",
        displayOrder: 8,
      },
      {
        entityName: "read_multimodal",
        fieldName: "global_seq",
        dataType: "bigint",
        meaning: "투영 출처 이벤트의 ES 전역 시퀀스 — 추적 키",
        example: "1024",
        displayOrder: 9,
      },
    ],
  },
  {
    entity: {
      // event_store.event_type 실제 값과 일치 확인됨 (insert.service.ts)
      entityName: "GripAttemptRecorded",
      kind: "event",
      purpose: "원천 파지 시도 1건의 전체 payload (Read Model의 재료)",
      keyColumns: "(stream_id, attempt_num)",
      rowCount: null,
      refreshedAt: null,
    },
    fields: [
      {
        entityName: "GripAttemptRecorded",
        fieldName: "2D_image_file_name",
        dataType: "string",
        meaning: "원천데이터(2D 이미지) 파일 이름",
        example: "반려동물용품_CR01_강아지공룡알장난감_00018_01_20230923.jpg",
        displayOrder: 1,
      },
      {
        entityName: "GripAttemptRecorded",
        fieldName: "3D_image_file_name",
        dataType: "string",
        meaning: "상품 3D 데이터(.pcd) 파일 이름",
        example: "반려동물용품_CR01_강아지공룡알장난감_00018_01_20230923.pcd",
        displayOrder: 2,
      },
      {
        entityName: "GripAttemptRecorded",
        fieldName: "video_file_name",
        dataType: "string",
        meaning: "원천 비디오 파일 이름 (시도번호 자리 00, 비디오 N:1 공유)",
        example: "반려동물용품_CR01_강아지공룡알장난감_00018_00_20230923.mp4",
        displayOrder: 3,
      },
      {
        entityName: "GripAttemptRecorded",
        fieldName: "box_type",
        dataType: "string",
        meaning: "파지 상자 종류 (toy-data에서는 None)",
        example: "None",
        displayOrder: 4,
      },
      {
        entityName: "GripAttemptRecorded",
        fieldName: "data_key",
        dataType: "string",
        meaning: "원천 데이터 이름(키)",
        example: "반려동물용품_CR01_강아지공룡알장난감_00018_01_20230923",
        displayOrder: 5,
      },
      {
        entityName: "GripAttemptRecorded",
        fieldName: "camera_info.camera_name",
        dataType: "string",
        meaning: "카메라 모델명",
        example: "Azure Kinect DK",
        displayOrder: 6,
      },
      {
        entityName: "GripAttemptRecorded",
        fieldName: "camera_info.camera_type",
        dataType: "string",
        meaning: "카메라 위치 종류",
        example: "고정형",
        displayOrder: 7,
      },
      {
        entityName: "GripAttemptRecorded",
        fieldName: "camera_info.camera_intrinsic_param",
        dataType: "object",
        meaning:
          "카메라 내부 파라미터 (fx,fy,cx,cy 초점·주점, k1..k6 방사왜곡, p1,p2 접선왜곡, codx,cody)",
        example: '{"fx":912.3,"fy":912.1,"cx":640.5,"cy":360.2, "...":"..."}',
        displayOrder: 8,
      },
      {
        entityName: "GripAttemptRecorded",
        fieldName: "grip_succeed",
        dataType: "number",
        meaning: "파지 성공 여부 (0=실패, 1=성공)",
        example: "1",
        displayOrder: 9,
      },
      {
        entityName: "GripAttemptRecorded",
        fieldName: "grip_data.grip_2d_pose",
        dataType: "object",
        meaning: "2D 파지점 (핑거: xl,xr,yl,yr / 흡착: x,y)",
        example: '{"xl":0,"xr":0,"yl":0,"yr":0}',
        displayOrder: 10,
      },
      {
        entityName: "GripAttemptRecorded",
        fieldName: "grip_data.grip_3d_pose",
        dataType: "object",
        meaning:
          "3D 파지점 (핑거: x1..z8 24좌표 / 흡착: x,y,z,roll,pitch,yaw,penetrate)",
        example: '{"x1":10.2,"y1":3.1,"z1":-100.0, "...":"...", "z8":-90.5}',
        displayOrder: 11,
      },
      {
        entityName: "GripAttemptRecorded",
        fieldName: "objects[].annotation_type",
        dataType: "string",
        meaning: "객체 어노테이션 타입",
        example: "Polygon",
        displayOrder: 12,
      },
      {
        entityName: "GripAttemptRecorded",
        fieldName: "objects[].class_name",
        dataType: "string",
        meaning: "객체 클래스 이름 (Read Model의 object_name 출처)",
        example: "강아지공룡알장난감",
        displayOrder: 13,
      },
      {
        entityName: "GripAttemptRecorded",
        fieldName: "objects[].package_type",
        dataType: "string",
        meaning: "파손방지 재포장 타입 (toy-data에서는 '없음')",
        example: "없음",
        displayOrder: 14,
      },
      {
        entityName: "GripAttemptRecorded",
        fieldName: "objects[].object_properties",
        dataType: "array<string>",
        meaning: "객체 속성 문자열 목록",
        example: "[]",
        displayOrder: 15,
      },
      {
        entityName: "GripAttemptRecorded",
        fieldName: "objects[].id",
        dataType: "number",
        meaning: "라벨링 식별자",
        example: "1",
        displayOrder: 16,
      },
      {
        entityName: "GripAttemptRecorded",
        fieldName: "objects[].segmentation_points",
        dataType: "array",
        meaning:
          "객체 윤곽 세그멘테이션 좌표 (중첩 배열, 대용량 — redact 권장)",
        example: "[[[320,410],[322,415], ...]]",
        displayOrder: 17,
      },
      {
        entityName: "GripAttemptRecorded",
        fieldName: "robot_tf.rotation_3x3",
        dataType: "array<number>",
        meaning: "로봇 회전행렬 (3x3 → 9개 원소)",
        example: "[1,0,0,0,1,0,0,0,1]",
        displayOrder: 18,
      },
      {
        entityName: "GripAttemptRecorded",
        fieldName: "robot_tf.translation_3x1",
        dataType: "array<number>",
        meaning: "로봇 평행이동 벡터 (3개 원소)",
        example: "[0.0,0.0,0.0]",
        displayOrder: 19,
      },
      {
        entityName: "GripAttemptRecorded",
        fieldName: "human_annotation_grasp[].annotation_type",
        dataType: "string",
        meaning: "휴먼 파지 어노테이션 타입 (핑거: keypoints / 흡착: polygon)",
        example: "keypoints",
        displayOrder: 20,
      },
      {
        entityName: "GripAttemptRecorded",
        fieldName: "human_annotation_grasp[].id",
        dataType: "number",
        meaning: "라벨링 식별자",
        example: "1",
        displayOrder: 21,
      },
      {
        entityName: "GripAttemptRecorded",
        fieldName: "human_annotation_grasp[].annotation_points",
        dataType: "array<number>",
        meaning: "키포인트/세그멘테이션 좌표 위치",
        example: "[120,330,140,360]",
        displayOrder: 22,
      },
      {
        entityName: "GripAttemptRecorded",
        fieldName: "human_annotation_grasp[].num_keypoints",
        dataType: "number",
        meaning: "키포인트 수 (핑거 파지는 2)",
        example: "2",
        displayOrder: 23,
      },
    ],
  },
];

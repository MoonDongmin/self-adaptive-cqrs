// 층3(다운스트림 효과) 평가 — 시나리오별 과제 정의.
//
// 같은 Local LLM 에 "로그+스키마(B1)" 와 "생성 Docs(A)" 를 각각 주고 4개 과제를 풀게 한다.
//   T1 진단      : 무슨 문제/요청이고 원인이 무엇인가 (앵커 채점 + judge)
//   T2 SQL       : 해결에 필요한 SQL — 신규 Read Model DDL 또는 조치 SQL (실 Postgres 실행)
//   T3 파생 질의 : T2 산출물로 시나리오별 사전 정의 질문에 답하는 SELECT (Docs 복사로는 못 푸는 과제)
//   T4 호환성    : v1 클라이언트를 깨지 않는 전환 절차 (체크리스트)
//
// T3 질문·채점 앵커·정답 요지(groundTruth, judge 용)는 평가 실행 전에 여기서 고정한다(정답 소급 정의 금지).
// 앵커 규칙: 바깥 배열의 각 그룹마다, 안쪽 대안 중 하나 이상이 나타나야 통과.
// diagnosisAnchors 는 층2 verify-layer2-docs.mjs 의 GROUNDING 표와 동일 출처.

const SITUATION_LOG_WARNING = "운영 중 시스템이 경고 수준의 이상 로그를 감지했다.";
const SITUATION_ZOD_REJECT = "운영 중 시스템이 적재 검증 실패(zod 거부) 로그를 감지했다.";
const SITUATION_SENSOR = "운영 중 센서 관찰기가 파지 센서 값 이상 에피소드를 감지했다.";
const SITUATION_QUERY = "사용자가 아래 조회를 요청했으나 기존 Read Model 로는 제공할 수 없다.";

export const SCENARIO_TASKS = {
  // ── A. 로그 채널 (payload / zod) ─────────────────────────────────────────────
  "A1-payload-drift": {
    channel: "log",
    situation: SITUATION_LOG_WARNING,
    groundTruth:
      "적재 payload 최상위에 스키마 밖 신규 필드(gripper_temperature, conveyor_speed)가 유입되어 적재 시 유실됨(payload.schema.drift). 조치: 기존 v1 테이블은 건드리지 않고 신규 키를 담는 새 Read Model(또는 v2)을 만들고 API 를 v2 로 병행 운영.",
    derivedQuestion:
      "적재 시 유실된 신규 키(gripper_temperature, conveyor_speed)의 값을 장면(scene_key)·시도(attempt_num)별로 조회하라.",
    derivedColumnAnchors: [["gripper_temperature", "conveyor_speed"]],
    diagnosisAnchors: [["drift", "드리프트", "신규 키", "newKeys", "gripper_temperature", "conveyor_speed"]],
  },
  "A2-type-mismatch": {
    channel: "log",
    situation: SITUATION_ZOD_REJECT,
    groundTruth:
      "grip_succeed 가 타입/도메인 위반(문자열 \"true\", 도메인 밖 정수 2)으로 zod 검증에 걸려 적재가 거부됨. JSON 자체는 유효. 조치: 거부 건을 추적할 수 있는 Read Model/검증 로그 보강과 클라이언트 타입 정규화 권고, v1 무손상.",
    derivedQuestion: "적재가 거부된 건을 위반 필드명·거부 사유·원본 값과 함께 건수로 집계하라.",
    derivedColumnAnchors: [["field", "필드", "reason", "사유", "reject", "거부", "error", "grip_succeed"]],
    diagnosisAnchors: [["zod", "타입", "type"], ["grip_succeed", "gripSucceed"]],
  },
  "A3-missing-field": {
    channel: "log",
    situation: SITUATION_ZOD_REJECT,
    groundTruth:
      "필수 필드(grip_data, robot_tf)가 삭제된 payload 가 zod 파싱 자체에 실패해 적재가 거부됨. 조치: 누락 필드별 거부 추적 Read Model/검증 로그 보강과 클라이언트 스키마 안내, v1 무손상.",
    derivedQuestion: "필수 필드 누락으로 거부된 적재 건을 누락 필드명별 건수로 집계하라.",
    derivedColumnAnchors: [["field", "필드", "missing", "누락", "count", "cnt", "건수", "reason"]],
    diagnosisAnchors: [["zod", "누락", "missing"], ["object_name", "objectName", "grip_data", "robot_tf", "필수"]],
  },
  "A9-non-integer-id": {
    channel: "log",
    situation: SITUATION_ZOD_REJECT,
    groundTruth:
      "정수여야 하는 식별 필드에 소수가 유입(objects[0].id=1.5, num_keypoints=2.5)되어 zod .int() 위반으로 적재가 거부됨. 조치: 정수 제약 위반 추적 Read Model/검증 로그 보강, 클라이언트 정수화 권고, v1 무손상.",
    derivedQuestion: "정수 제약 위반으로 거부된 적재 건을 위반 필드명과 원본 값과 함께 조회하라.",
    derivedColumnAnchors: [["field", "필드", "id", "num_keypoints", "reason", "사유", "reject", "거부", "value", "값"]],
    diagnosisAnchors: [["zod", "타입", "type", "정수"], ["int", "1.5", "2.5", "num_keypoints", "정수"]],
  },
  "A10-null-intrinsic-param": {
    channel: "log",
    situation: SITUATION_ZOD_REJECT,
    groundTruth:
      "카메라 내부 파라미터(cody, fx)에 null 이 유입되어 zod 검증에 걸려 거부됨(codx 만 nullable 인 스키마 비대칭). 조치: null 유입 추적 Read Model/검증 로그 보강, 스키마 비대칭 정리 권고, v1 무손상.",
    derivedQuestion: "카메라 내부 파라미터(cody, fx)가 null 이어서 거부된 건을 필드명별 건수로 집계하라.",
    derivedColumnAnchors: [["field", "필드", "cody", "fx", "null", "count", "cnt", "건수", "reason"]],
    diagnosisAnchors: [["cody", "fx", "intrinsic", "카메라", "camera"], ["null", "누락", "missing"]],
  },

  // ── A. 센서 채널 (physical / consistency / jump) ────────────────────────────
  "A4-physical-impossible": {
    channel: "sensor",
    situation: SITUATION_SENSOR,
    groundTruth:
      "값 하나만 봐도 물리적으로 불가능한 센서 값(깊이 z1<0, 이미지 밖 픽셀 xl=2500)이 파지 결과에 적재됨. 조치: 위반 값을 플래그/격리하는 Read Model(v2 또는 별도 테이블)과 CHECK 제약, v1 무손상.",
    derivedQuestion: "물리적으로 불가능한 값(깊이 음수 또는 이미지 밖 픽셀)이 포함된 파지 시도를 장면·시도·위반 값과 함께 조회하라.",
    derivedColumnAnchors: [["scene_key"], ["z", "depth", "깊이", "xl", "pixel", "픽셀", "violation", "위반", "flag", "reason"]],
    diagnosisAnchors: [["회전행렬", "rotation", "직교", "det", "깊이", "음수", "픽셀", "physical", "물리"]],
  },
  "A5-consistency-violation": {
    channel: "sensor",
    situation: SITUATION_SENSOR,
    groundTruth:
      "파지 성공(grip_succeed=1) 맥락과 모순되는 센서 값(성공인데 잡을 수 없는 위치/깊이)이 적재됨(정합성 위반). 조치: 성공 맥락 정합성 플래그를 가진 Read Model 보강/격리, v1 무손상.",
    derivedQuestion: "파지 성공(grip_succeed=1)인데 깊이 또는 위치가 작업 범위를 벗어난 시도를 장면·시도·해당 값과 함께 조회하라.",
    derivedColumnAnchors: [["scene_key"], ["z", "depth", "깊이", "translation", "x", "workspace", "flag", "violation", "위반"]],
    diagnosisAnchors: [["consistency", "정합", "일관성", "workspace", "성공", "모순"]],
  },
  "A6-depth-jump": {
    channel: "sensor",
    situation: SITUATION_SENSOR,
    groundTruth:
      "같은 장면 안에서 시도 01(정상)→02(이상)의 평균 파지 깊이가 급변(Δ>0.10m). 값 자체는 분포 안이라 물리/정합성 검사에는 안 걸림. 조치: 장면 내 시도 간 깊이 변화량을 계산·플래그하는 Read Model(v2), v1 무손상.",
    derivedQuestion: "같은 장면(scene_key) 안에서 시도(attempt_num) 간 평균 깊이(z 평균) 변화량이 0.10m 를 넘는 장면을 변화량과 함께 조회하라.",
    derivedColumnAnchors: [["z_avg", "z_mean", "avg_z", "depth", "delta", "diff", "jump", "변화", "Δ", "z_"]],
    diagnosisAnchors: [["jump", "급변", "Δ", "델타", "0.10", "깊이"]],
  },
  "A7-grip-depth-underflow": {
    channel: "sensor",
    situation: SITUATION_SENSOR,
    groundTruth:
      "파지 성공 맥락인데 파지 깊이 z1~z8 이 전부 0.01m 미만(하한 위반)으로, 성공과 모순되는 정합성 위반. 조치: 최소 깊이·하한 위반 플래그를 가진 Read Model 보강/격리, v1 무손상.",
    derivedQuestion: "파지 성공인데 최소 깊이(z 최소값)가 0.01m 미만인 시도를 장면·시도·최소 깊이와 함께 조회하라.",
    derivedColumnAnchors: [["scene_key"], ["z_min", "zmin", "min_z", "depth", "깊이", "z"]],
    diagnosisAnchors: [["깊이", "depth", "zmin", "minz", "z_min"], ["0.01", "하한", "성공", "모순", "consistency"]],
  },
  "A8-translation-x-violation": {
    channel: "sensor",
    situation: SITUATION_SENSOR,
    groundTruth:
      "파지 성공 맥락인데 로봇 translation 위치가 작업 영역 밖(X=1.2m / Y=0.20m)인 정합성 위반. 조치: translation 축 작업영역 위반 플래그를 가진 Read Model 보강/격리, v1 무손상.",
    derivedQuestion: "파지 성공인데 로봇 translation X 또는 Y 가 작업 영역을 벗어난 시도를 장면·시도·좌표와 함께 조회하라.",
    derivedColumnAnchors: [["scene_key"], ["translation", "x", "y", "tx", "ty", "workspace", "위치", "violation", "flag"]],
    diagnosisAnchors: [["translation", "워크스페이스", "workspace", "작업 범위", "작업범위", "작업 영역", "작업영역", "1.2"]],
  },

  // ── B. 투영 채널 ─────────────────────────────────────────────────────────────
  "B1-projection-map-failed": {
    channel: "log",
    situation: "운영 중 시스템이 치명 수준의 투영(projection) 실패 로그를 감지했다.",
    groundTruth:
      "objects 가 빈 배열인 결함(poison) 이벤트에서 GripResultProjector.map 이 예외를 던져 배치 트랜잭션 전체가 롤백되고 정상 이벤트까지 미투영. 새 Read Model 은 불필요하고, poison 이벤트 skip/dead-letter 후 catch-up 재실행이 조치. 커서를 직접 점프시키면 정상 이벤트가 유실되므로 금지.",
    derivedQuestion: "투영 실패를 유발한 결함(poison) 이벤트를 제외하고, 아직 Read Model 에 투영되지 않은 정상 이벤트의 수를 조회하라.",
    derivedColumnAnchors: [["count", "cnt", "unprojected", "missing", "pending", "미투영", "n"]],
    diagnosisAnchors: [["projection.map.failed", "투영", "poison", "매핑 실패", "objects"]],
  },
  "B2-multimodal-integrity": {
    channel: "log",
    situation: "운영 중 시스템이 Read Model 정합성 위반(projection.integrity.violation) 로그를 감지했다.",
    groundTruth:
      "모달 파일명(image/video)의 scene/attempt 가 레코드 좌표와 불일치. zod·투영은 통과하지만 read_multimodal 정합성 검사가 잡음. 조치: 불일치 행 식별·격리(플래그 Read Model 또는 정합성 검증 테이블), v1 무손상.",
    derivedQuestion: "모달 파일명의 장면/시도가 레코드 좌표(scene_key, attempt_num)와 불일치한 read_multimodal 행을 파일명과 함께 조회하라.",
    derivedColumnAnchors: [["scene_key", "file_name", "image_2d_file_name", "video_file_name", "filename", "파일"]],
    diagnosisAnchors: [["integrity", "정합", "불일치", "파일명", "file_name", "filename"], ["multimodal", "read_multimodal", "모달"]],
  },

  // ── E. 질의 채널 (Read Model 재생성) ─────────────────────────────────────────
  "E1-new-column-query": {
    channel: "query",
    situation: SITUATION_QUERY,
    groundTruth:
      "사용자가 신규 필드 gripper_temperature 의 시간대별 조회를 요청했으나 기존 Read Model 에 컬럼이 없음(payload-drift 로 유실 중). 조치: gripper_temperature 를 담는 새 Read Model(또는 v2 컬럼 추가)과 백필, API v2 병행.",
    derivedQuestion: "gripper_temperature 를 시간대(시 단위)별 평균값으로 시간 순으로 조회하라.",
    derivedColumnAnchors: [["hour", "시간", "time", "occurred", "bucket", "date_trunc", "period", "ts"], ["gripper_temperature", "temperature", "avg", "평균", "temp"]],
    diagnosisAnchors: [["gripper_temperature"]],
  },
  "E2-new-aggregate-query": {
    channel: "query",
    situation: SITUATION_QUERY,
    groundTruth:
      "사용자가 object_name 별 파지 성공률(시도 수·성공 수·성공률) 집계를 요청했으나 기존 read_grip_result 는 시도 단위 1:1 테이블이라 집계 Read Model 이 없음. 조치: object_name 을 키로 하는 집계 Read Model 신설 + 백필, API v2 병행.",
    derivedQuestion: "객체(object_name)별 파지 성공률이 높은 순으로 상위 3개 객체를 시도 수·성공 수·성공률과 함께 조회하라.",
    derivedColumnAnchors: [["object_name"], ["rate", "ratio", "성공률", "pct", "percent"]],
    diagnosisAnchors: [["성공률", "집계", "aggregate", "GROUP BY", "group by"]],
  },
  "E3-new-join-query": {
    channel: "query",
    situation: SITUATION_QUERY,
    groundTruth:
      "사용자가 파지 결과와 해당 시도의 이미지·영상 경로를 한 화면에서 보길 요청했으나 read_grip_result 와 read_multimodal 이 분리돼 있어 통합 Read Model 이 없음. 조치: (scene_key, attempt_num) 으로 조인한 통합 Read Model 신설(또는 뷰) + 백필, API v2 병행.",
    derivedQuestion: "각 파지 시도의 성공 여부와 해당 시도의 이미지·영상 파일명(또는 URI)을 한 행에 조회하라.",
    derivedColumnAnchors: [["scene_key"], ["image", "video", "uri", "file"]],
    diagnosisAnchors: [["멀티모달", "multimodal", "조인", "JOIN", "join", "통합"]],
  },
  "E4-time-series-query": {
    channel: "query",
    situation: SITUATION_QUERY,
    groundTruth:
      "사용자가 일자별 파지 성공률 추이(날짜별 시도 수·성공 수·성공률, 시간 순)를 요청했으나 기존 Read Model 에 시계열 집계가 없음. 조치: 일자를 키로 하는 시계열 집계 Read Model 신설 + 백필, API v2 병행.",
    derivedQuestion: "일자별 파지 성공률을 날짜 오름차순으로, 시도 수·성공 수·성공률과 함께 조회하라.",
    derivedColumnAnchors: [["date", "day", "occurred", "일자", "일별", "bucket", "period"], ["rate", "ratio", "성공률", "pct", "percent"]],
    diagnosisAnchors: [["일자별", "일별", "날짜별", "시계열", "추이", "date_trunc", "DATE"]],
  },
  "E5-failure-ranking-query": {
    channel: "query",
    situation: SITUATION_QUERY,
    groundTruth:
      "사용자가 파지 실패가 많은 객체 상위 목록(객체별 실패 수·실패율, 순위)을 요청했으나 기존 Read Model 에 랭킹/집계가 없음. 조치: object_name 별 실패 수·실패율 집계 Read Model 신설 + 백필, API v2 병행.",
    derivedQuestion: "객체(object_name)별 실패 수와 실패율을 실패 수 내림차순으로 상위 3개 조회하라.",
    derivedColumnAnchors: [["object_name"], ["fail", "실패"]],
    diagnosisAnchors: [["실패", "fail"], ["상위", "순위", "랭킹", "rank", "ORDER BY", "order by"]],
  },
};

// T4 체크리스트 — 3항목 중 2개 이상이면 통과.
export const VERSIONING_CHECKLIST = [
  { id: "versionPath", description: "버전 경로(v2 등) 도입 언급", pattern: /v2|v\d+|버전|version/i },
  {
    id: "coexistence",
    description: "신구 병행 운영·하위 호환 언급",
    pattern: /병행|공존|하위\s*호환|호환성|backward|deprecat|기존[^\n]{0,20}(유지|그대로)/i,
  },
  {
    id: "migrationOrCutover",
    description: "마이그레이션·컷오버·전환 절차 언급",
    pattern: /마이그레이션|migration|컷오버|cutover|전환|백필|backfill|승인/i,
  },
];

export const TASK_IDS = ["T1", "T2", "T3", "T4"];

export function buildSystemPrompt() {
  return [
    "당신은 이벤트 소싱 + CQRS 로 운영되는 Physical AI 데이터 플랫폼의 백엔드 엔지니어다.",
    "저장소는 Postgres 이고 Read Model 테이블은 read_ 접두 스네이크 케이스를 쓴다.",
    "제공된 자료에 있는 사실만 근거로 답하고, 자료에 없는 사실은 지어내지 마라.",
    "SQL 은 Postgres 문법으로 ```sql 코드 블록 안에만 작성한다.",
    "답변은 한국어로 한다.",
  ].join(" ");
}

export function buildTaskInstruction(taskId, scenarioTask, previousSqlAnswer) {
  switch (taskId) {
    case "T1":
      return [
        "위 자료를 근거로 (1) 무슨 문제 또는 요청이 발생했는지, (2) 그 원인 또는 근거가 무엇인지를",
        "한 문단(5문장 이내)으로 진단하라. 관련 로그 action, 필드명, 값 등 구체적 근거를 인용하라.",
      ].join(" ");
    case "T2":
      return [
        "이 상황을 해결하기 위해 실행할 SQL 을 작성하라.",
        "새 Read Model 테이블이 필요하면 CREATE TABLE DDL(테이블명 read_ 접두, 기존 테이블 read_grip_result·read_multimodal 은 변경 금지)을,",
        "새 테이블이 필요 없으면 필요한 조치·검증 SQL 을 작성하라. 각 SQL 은 그대로 실행 가능해야 한다.",
      ].join(" ");
    case "T3":
      return [
        "아래는 이 상황에 대해 앞서 작성된 SQL 이다.",
        "",
        previousSqlAnswer,
        "",
        `이제 다음 질문에 답하는 SELECT 문을 작성하라: ${scenarioTask.derivedQuestion}`,
        "필요하면 기존 데이터(read_grip_result, read_multimodal, event_store)로 새 테이블을 채우는 백필 SQL 을 먼저 작성하고,",
        "질문에 답하는 SELECT 문은 반드시 마지막 ```sql 블록에 단독으로 작성하라.",
      ].join("\n");
    case "T4":
      return [
        "이 변경을 적용할 때 기존 v1 API 클라이언트가 깨지지 않게 하려면 무엇을 해야 하는가?",
        "버전 경로, 신구 병행 운영, 마이그레이션·컷오버 절차를 포함해 구체적 단계로 답하라.",
      ].join(" ");
    default:
      throw new Error(`알 수 없는 과제: ${taskId}`);
  }
}

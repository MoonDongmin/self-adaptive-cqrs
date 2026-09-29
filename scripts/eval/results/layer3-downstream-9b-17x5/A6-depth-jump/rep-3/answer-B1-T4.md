제공된 자료에는 API 클라이언트 호환성, 버전 관리 전략, 마이그레이션 절차, 또는 컷오버 (cutover) 절차에 대한 명시적인 정보가 포함되어 있지 않습니다. 따라서 요청하신 대로 "자료에 없는 사실은 지어내지 마라"는 원칙에 따라, 구체적인 단계별 마이그레이션 절차를 제시할 수 없습니다.

자료에 근거할 수 있는 유일한 사실은 **Read Model 테이블의 명명 규칙**입니다.
- 기존 Read Model: `read_grip_result`, `read_multimodal`
- 변경 사항 (가정): 파지 센서 값 이상 에피소드 (suddenJump_withinScene) 를 저장해야 하므로, 새 Read Model 테이블이 생성되어야 합니다.
- 명명 규칙: `read_` 접두사와 스네이크 케이스 사용.

따라서 추론 가능한 테이블명은 `read_grip_anomaly` 또는 `read_sensor_anomaly` 형태일 것입니다.

```sql
-- 자료에 명시된 명명 규칙 (read_ 접두사 + 스네이크 케이스) 에 따른 예상 테이블 생성 쿼리 예시
-- 실제 생성명은 도메인 컨벤션에 따라 결정되어야 합니다.
CREATE TABLE read_grip_anomaly (
    scene_key varchar PRIMARY KEY,
    attempt_num smallint,
    stream_id varchar,
    global_seq bigint,
    occurred_at timestamptz,
    object_name varchar,
    anomaly_type varchar, -- 예: suddenJump_withinScene
    anomaly_reason text,  -- 예: "z평균 0.060 → 0.170, Δ=0.110 > 0.10 m"
    z_avg_before numeric,
    z_avg_after numeric,
    delta_z numeric
);
```

**주의:** 위 SQL 은 자료에 명시된 필드 정의가 없으므로, 실제 스키마 정의는 불가능하며, 위 내용은 자료의 명명 규칙과 상황 설명을 바탕으로 한 **추론 결과**입니다.
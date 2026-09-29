기존 v1 API 클라이언트가 깨지지 않도록 하려면 **비파괴적 마이그레이션 (Non-destructive Migration)** 전략을 따르고, **버전 관리 (Versioning)** 를 통해 신구 API 를 병행 운영해야 합니다.

제공된 자료에 근거한 구체적인 단계는 다음과 같습니다.

### 1. 데이터베이스 스키마 변경 (DDL)
신규 Read Model `read_daily_grip_stats_v1` 테이블을 생성하되, 기존 `read_grip_result` 및 `read_multimodal` 테이블은 **변경하지 않습니다**.
*   **근거:** `constraints` 항목에 "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상" 및 "PK (scene_key, attempt_num) 유지"가 명시되어 있습니다.
*   **SQL:**
```sql
CREATE TABLE read_daily_grip_stats_v1 (
  occurred_at timestamptz NOT NULL,
  total_attempts bigint,
  success_count bigint,
  success_rate double precision,
  PRIMARY KEY (occurred_at)
);
```

### 2. 인사이트 카드 (Insight Card) 등록
신규 Read Model 을 메타데이터 카탈로그에 등록하여, LLM 기반 분석 도구에서 자동으로 인식되도록 합니다.
*   **근거:** `insight_read_db` 섹션의 "Insight 카드 등록" SQL 코드.
*   **SQL:**
```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_daily_grip_stats_v1', 'read_model', '일자별 파지 성공률 추이(시도 수, 성공 수, 성공률)를 보고 싶다. 날짜별 시도 수, 성공 수, 성공률이 시간 순으로 필요하다.', 'occurred_at')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_daily_grip_stats_v1', 'occurred_at', 'timestamptz', '데이터 촬영 일자 (파일명 날짜에서 도출)', 1),
  ('read_daily_grip_stats_v1', 'total_attempts', 'bigint', '일자별 총 파지 시도 수', 2),
  ('read_daily_grip_stats_v1', 'success_count', 'bigint', '일자별 성공 수 (grip_succeed == 1)', 3),
  ('read_daily_grip_stats_v1', 'success_rate', 'double precision', '일자별 성공률 (success_count / total_attempts)', 4)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

### 3. 신규 프로젝터 구현 및 배선
`DailyGripStatsProjector` 클래스를 생성하여 이벤트 스토어에서 `GripAttemptRecorded` 이벤트를 구독하고, 일자별 집계 (`total_attempts`, `success_count`, `success_rate`) 로직을 수행하도록 합니다. 기존 `GripResultProjector` 로직은 건드리지 않습니다.
*   **근거:** `Decision Outcome` 에 "New DailyGripStatsProjector targeting read_daily_grip_stats_v1"이 선택되었고, `src/projection/projection.service.ts` 에 `DailyGripStatsProjector` DI 배선이 추가되어야 합니다.
*   **코드 변경:** `src/projection/projection.service.ts` 파일에 `DailyGripStatsProjector` 인스턴스를 주입하고 `catchUpDailyGripStatsV1` 메서드를 추가합니다.

### 4. API 엔드포인트 버전 추가 (v2)
기존 `/daily-grip-stats` (또는 해당 경로) 엔드포인트를 수정하지 않고, **새로운 버전 경로 `/daily-grip-stats-v1`** 를 추가합니다.
*   **근거:** `apiVersion` 섹션에서 `from: v1`, `to: v2`로 정의되어 있으며, `affectedEndpoints` 에 `POST /daily-grip-stats-v1`이 포함되어 있습니다. 기존 엔드포인트는 무손상해야 합니다.
*   **코드 변경:** `src/projection/projection.controller.ts` 파일에 `@Post("/daily-grip-stats-v1")` 라우트를 추가합니다.

### 5. 컷오버 (Cutover) 절차
1.  **준비:** DDL 실행, 인사이트 카드 등록, 신규 프로젝터 코드 배포 완료.
2.  **초기 투영 (Catch-up):** 기존에 쌓여있던 이벤트들을 신규 `DailyGripStatsProjector` 로 처리하여 `read_daily_grip_stats_v1` 테이블에 초기 데이터를 채웁니다.
3.  **검증:** `SELECT occurred_at FROM read_daily_grip_stats_v1 WHERE success_rate IS NULL OR total_attempts = 0;` 쿼리를 실행하여 빈 데이터가 없는지 확인합니다.
4.  **전환:** 클라이언트 측에서 `/daily-grip-stats-v1` 엔드포인트를 호출하도록 변경합니다.
5.  **정리:** 모든 데이터가 v1 로 처리된 후, 기존 `/daily-grip-stats` (v1) 엔드포인트를 삭제합니다.

이 절차는 `constraints`에 명시된 "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)" 및 "v1 자산 무손상"을 준수합니다.
제공된 자료에 따르면, 이번 변경은 **Read Model 생성 SQL**이 필요하지 않으며, 기존 v1 자산 (테이블/엔드포인트/프로젝터) 을 무손상 상태로 유지하는 **격리 (Containment)** 전략을 따릅니다.

자료의 'Decision Outcome'는 **"거절 유지 + 원천 데이터 수정 요청"**이며, 'Recommendation' 섹션의 'Decision Drivers'와 'Consequences'에서 "(+) Read Model schema 정합 유지", "(+) downstream projection unaffected"이 명시되어 있습니다. 또한 'API Versioning' 섹션에서는 "변 변경 없음... 버전 호환성 영향이 제로"라고 명시되어 있습니다.

따라서, 기존 v1 API 클라이언트를 깨뜨리지 않기 위해 **아무런 코드 변경 (DDL 실행, API 컷오버) 을 수행하지 않고**, 단순히 **원천 데이터 파이프라인을 수정하여 정상적인 데이터를 공급**하는 절차만 수행하면 됩니다.

구체적 단계는 다음과 같습니다:

1.  **격리 (Containment) 단계**:
    *   제공된 자료의 '2. Read Model 생성 SQL'에 있는 `SELECT count(*)` 쿼리를 실행하여, `event_store` 테이블에 실패한 파일 (`..._02004`, `..._02005`) 에 해당하는 이벤트가 유입되지 않았음을 확인합니다.
    *   이 단계는 기존 DB 스키마를 건드리지 않으므로 v1 API 클라이언트에는 영향이 없습니다.

2.  **인간 승인 (Human-in-the-loop)**:
    *   위 확인 결과와 함께, "원천 데이터 파이프라인 (Toy-Data 생성 스크립트 등) 에 `grip_data` 와 `robot_tf` 필드를 필수로 포함하도록 수정"해야 한다는 사실을 운영 담당자에게 보고하여 승인을 받습니다.
    *   **주의**: 이 단계에서 DDL 실행이나 API 엔드포인트 변경을 승인받으면 안 됩니다.

3.  **원천 데이터 수정 및 재적재 (Remediation)**:
    *   승인 후, Toy-Data 생성 스크립트 (예: `src/data/toy-data/..._02004.json`, `..._02005.json`) 를 수정하여 `grip_data` 와 `robot_tf` 객체를 포함하도록 변경합니다.
    *   수정된 데이터를 다시 적재 (Re-load) 합니다.
    *   이 과정에서 `insert.file.failed` 로그는 다시 발생하지 않고, `insert.file.ok` 로 정상 처리될 것입니다.

4.  **자동 복구 (Automatic Recovery)**:
    *   정상적인 데이터가 `Event Store` 에 유입되면, 기존에 존재하던 `GripResultProjector` (v1) 가 자동으로 해당 이벤트를 `read_grip_result` 테이블에 투영합니다.
    *   `read_grip_result` 테이블에는 누락된 행이 채워지고, 기존 행들은 그대로 유지됩니다.

5.  **검증 (Verification)**:
    *   v1 API 클라이언트가 `GET /projection/read_grip_result?scene_key=...&attempt_num=1` 을 호출했을 때, 이제 `..._02004` 와 `..._02005` 에 대한 데이터가 정상적으로 반환되는지 확인합니다.

**요약**: 버전 경로 변경이나 마이그레이션 스크립트 실행 없이, **원본 JSON 파일 수정 -> 재적재**만으로 문제를 해결하며, v1 API 클라이언트는 기존 스키마와 엔드포인트를 그대로 사용하므로 깨지지 않습니다.
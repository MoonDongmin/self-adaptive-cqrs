기존 v1 API 클라이언트가 깨지지 않도록 하려면 **파괴적 변경 (Breaking Change) 을 피하는 전략**을 적용해야 합니다. 제공된 자료에 따르면, 기존 `/multimodal`, `/grip-result`, `/insert-all` 엔드포인트는 완전히 보존되며, 신규 `/multimodal-enriched` 엔드포인트는 추가되는 형태입니다.

구체적인 단계는 다음과 같습니다:

### 1. 버전 경로 (Versioned Route) 사용
신규 Read Model (`read_multimodal_enriched`) 을 조회하는 API 는 기존 경로가 아닌 **새로운 버전 경로**를 사용해야 합니다.
- **기존 v1 경로**: `POST /multimodal`, `POST /grip-result` (보존)
- **신규 v2 경로**: `POST /multimodal-enriched` (추가)

클라이언트 코드는 기존 요청 (`/multimodal`) 은 그대로 유지하고, 새로운 필드 (`image_2d_scene_num` 등) 가 포함된 데이터가 필요할 때만 새로운 경로 (`/multimodal-enriched`) 를 호출하도록 로직을 수정합니다.

### 2. 신규 API 엔드포인트 추가 (Additive Change)
백엔드 코드 (`src/projection/projection.controller.ts`) 에 신규 라우트를 추가하되, 기존 라우트 로직은 **완전히 무손상**으로 유지합니다.
- `POST /multimodal`: 기존 `MultiModalProjector` 로 처리 (기존 스키마 `read_multimodal` 투영)
- `POST /grip-result`: 기존 `GripResultProjector` 로 처리 (기존 스키마 `read_grip_result` 투영)
- `POST /multimodal-enriched`: 신규 `MultimodalEnrichedProjector` 로 처리 (신규 스키마 `read_multimodal_enriched` 투영)

### 3. 마이그레이션 및 컷오버 절차 (Human-in-the-Loop)
DDL 실행과 API 컷오버는 반드시 인간 승인을 거친 후 단계별로 수행합니다.

#### 단계 A: DDL 실행 (Schema Migration)
신규 테이블 `read_multimodal_enriched` 을 생성하는 SQL 을 실행합니다. 기존 테이블 `read_multimodal` 은 삭제하지 않고 **병존** 상태로 유지합니다.
```sql
CREATE TABLE read_multimodal_enriched (
  scene_key varchar NOT NULL,
  attempt_num smallint NOT NULL,
  image_2d_scene_num varchar,
  image_2d_attempt_num smallint,
  video_scene_num varchar,
  video_attempt_num smallint,
  stream_id varchar,
  global_seq bigint,
  PRIMARY KEY (scene_key, attempt_num)
);
```
*주의: `read_multimodal` 테이블은 삭제하지 않아야 하므로 `DROP TABLE` 은 금지됩니다.

#### 단계 B: Insight 카드 등록 (Metadata Sync)
신규 Read Model 에 대한 메타데이터를 `insight_entity` 와 `insight_field` 테이블에 등록합니다.
```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_multimodal_enriched', 'read_model', '원천 미디어 파일명(scene/attempt)을 DB 레이어에 직접 추출·저장하여 row-level 정립성 검증과 조인 성능 확보. 기존 raw filename 저장만으로는 매핑 로직 오류(다른 시도의 미디어 덮어씀) 를 runtime regex check 로 유추해야 하며, DB 레이어에서 key consistency enforcement 가 불가능.', '(scene_key, attempt_num)')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_multimodal_enriched', 'scene_key', 'varchar', '장면 식별 키 (stream_id 에서 ''grip-attempt:'' 제거), Primary Key', 1),
  ('read_multimodal_enriched', 'attempt_num', 'smallint', '동일 장면 내 파지 시도 번호, Primary Key', 2),
  ('read_multimodal_enriched', 'image_2d_scene_num', 'varchar', '2D 이미지 파일명에서 scene(5 자리) 추출', 3),
  ('read_multimodal_enriched', 'image_2d_attempt_num', 'smallint', '2D 이미지 파일명에서 attempt(2 자리) 추출', 4),
  ('read_multimodal_enriched', 'video_scene_num', 'varchar', '비디오 파일명에서 scene(5 자리) 추출', 5),
  ('read_multimodal_enriched', 'video_attempt_num', 'smallint', '비디오 파일명에서 attempt(2 자리) 추출 (sentinel 00)', 6),
  ('read_multimodal_enriched', 'stream_id', 'varchar', 'ES 스트림 ID — 추적 키', 7),
  ('read_multimodal_enriched', 'global_seq', 'bigint', '투영 출처 이벤트의 ES 전역 시퀀스 — 추적 키', 8)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

#### 단계 C: API 컷오버 (Cutover)
인간 승인이 완료된 후, 신규 프로젝터 (`MultimodalEnrichedProjector`) 가 정상 작동하는지 검증한 후, 신규 엔드포인트를 서비스 목록에 등록합니다.
- `POST /multimodal-enriched` 엔드포인트를 `ProjectionController` 에 추가합니다.
- 기존 `POST /multimodal` 및 `POST /grip-result` 엔드포인트는 그대로 유지됩니다.

### 4. 클라이언트 호환성 보장 (Backward Compatibility)
- **기존 클라이언트**: `POST /multimodal` 또는 `POST /grip-result` 를 호출하면 기존 `read_multimodal` 테이블 데이터를 반환하므로, 기존 로직은 깨지지 않습니다.
- **신규 클라이언트**: `POST /multimodal-enriched` 를 호출하면 `read_multimodal_enriched` 테이블 데이터를 반환하며, 여기에 `image_2d_scene_num`, `video_scene_num` 등의 파생 필드가 포함됩니다.

### 요약
1. **기존 엔드포인트 (`/multimodal`, `/grip-result`) 는 변경하지 않음.**
2. **신규 엔드포인트 (`/multimodal-enriched`) 만 추가.**
3. **신규 테이블 (`read_multimodal_enriched`) 만 생성 (기존 `read_multimodal` 삭제 X).**
4. **클라이언트는 필요 시 새 엔드포인트 호출, 기존엔 기존 엔드포인트 호출로 병행 가능.**

이 방식은 자료에 명시된 "v1 자산 무손상", "PK 유지", "DDL 실행·API 컷오버는 인간 승인 후" 등의 제약 조건을 모두 충족합니다.
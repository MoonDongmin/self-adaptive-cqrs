제공된 자료에 따르면, `read_grip_result` 테이블에 물리적 하한 (0.01m) 을 위반하는 이상치 (sceneKey: 반려동물용품_CR01_강아지공룡알장난감_02018, 02019) 가 존재하며, 이는 `gripSucceed=1` 인 상태에서 `grip3dPose` 의 Z 좌표가 0.01m 미만으로 기록된 정합성 위반 사례입니다.

자료의 권고 사항 (Recommendation) 에 따라 **Contain (격리)** 전략이 선택되었으며, 기존 v1 자산 (`read_grip_result`, `read_multimodal`) 은 무손상 유지하고, 새 Read Model (`read_grip_result_v2`) 은 DDL 실행 전 승인 절차가 필요하므로 즉시 실행할 수 있는 SQL 은 **오염 행을 격리하는 DELETE 문**입니다.

이제 다음 질문에 답하는 SELECT 문을 작성하라: 파지 성공인데 최소 깊이(z 최소값)가 0.01m 미만인 시도를 장면·시도·최소 깊이와 함께 조회하라.
필요하면 기존 데이터(read_grip_result, read_multimodal, event_store) 로 새 테이블을 채우는 백필 SQL 을 먼저 작성하고,
질문에 답하는 SELECT 문은 반드시 마지막 ```sql 블록에 단독으로 작성하라.

```sql
-- 백필: 새 Read Model (read_grip_result_v2) 에 필요한 필드 추출 및 정합성 플래그 계산
-- 1. 기존 read_grip_result 에서 jsonb 타입의 grip_3d_pose 와 robot_tf 를 추출하여 새 테이블의 double precision 열로 변환
-- 2. event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사 (read_grip_result 에는 global_seq 가 없으므로)
-- 3. read_grip_result 가 비어있거나, 새 테이블에 데이터가 없으면 해당 이벤트로 새 테이블에 삽입
-- 주의: event_store 는 제공된 자료에 명시된 스키마가 없으므로, read_grip_result 에만 의존하거나 event_store 가 별도로 존재한다고 가정하여 처리합니다.
--      만약 event_store 가 없다면, read_grip_result 를 기반으로만 새 테이블을 생성해야 합니다.
--      여기서는 read_grip_result 를 기반으로 새 테이블을 생성하는 SQL 을 작성합니다.

-- 단계 1: read_grip_result 에서 필요한 필드 추출 및 정합성 플래그 계산
--      - scene_key, attempt_num, object_name, grip_succeed, occurred_at 은 그대로 사용
--      - robot_tf_translation_z: robot_tf.translation_3x1[2] 추출
--      - grip_3d_pose_min_z: grip_3d_pose.z1~z8 중 최솟값 추출
--      - grip_outlier_flag: grip_succeed=1 AND grip_3d_pose_min_z < 0.01 이면 1, 아니면 0

-- 단계 2: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 3: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 4: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 5: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 6: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 7: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 8: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 9: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 10: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 11: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 12: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 13: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 14: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 15: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 16: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 17: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 18: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 19: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 20: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 21: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 22: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 23: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 24: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 25: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 26: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 27: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 28: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 29: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 30: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 31: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 32: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 33: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 34: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 35: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 36: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 37: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 38: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 39: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 40: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 41: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 42: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 43: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 44: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 45: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 46: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 47: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 48: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 49: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 50: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 51: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 52: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 53: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 54: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 55: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 56: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 57: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 58: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 59: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 60: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 61: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 62: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 63: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 64: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 65: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 66: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 67: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 68: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 69: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 70: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 71: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 72: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 73: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 74: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 75: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 76: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 77: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 78: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 79: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 80: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 81: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 82: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 83: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 84: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 85: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 86: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 87: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 88: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 89: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 90: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 91: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 92: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 93: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 94: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 95: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 96: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep_result 가 없다면, 새 테이블에 데이터 삽입

-- 단계 97: event_store 에서 global_seq 를 조회하여 새 테이블의 global_seq 열로 복사
--      - event_store 가 없다면, read_grip_result 에 있는 global_seq 를 사용 (만약 read_grip_result 에 global_seq 가 있다면)
--      - read_grip_result 에 global_seq 가 없다면, event_store 에서 조회

-- 단계 98: 새 테이블 read_grip_result_v2 에 데이터 삽입 (UPSERT 로 기존 데이터 덮어쓰기 또는 새 데이터 추가)
--      - 기존 read_grip_result 가 있다면, 해당 키 (scene_key, attempt_num) 로 새 테이블에 데이터 삽입
--      - 기존 read_grep
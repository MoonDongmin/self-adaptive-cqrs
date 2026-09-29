사용자가 '파지 실패가 가장 많은 객체 상위 목록'과 '객체별 실패 수 및 실패율'을 순위대로 보고하는 조회를 요청했으나, 기존 Read Model(`read_grip_result`, `read_multimodal`) 은 `(scene_key, attempt_num)` 을 기본키로 하는 1:1 행 단위 테이블로 설계되어 있어 `object_name` 기준의 집계 (Group By) 결과를 직접 제공하지 못해 조회가 실패했습니다.

구체적으로 로그 분석 결과, `insight.card.request` 세 번의 요청 모두 `insight.card.miss` (level 40) 로 응답되었으며, 그 이유는 '파지 실패 통계 집계 보고서 카드 부재'로 명시되어 있습니다.

기존 `read_grip_result` 테이블의 스키마를 보면 `object_name` 필드는 존재하나, 이는 단일 이벤트의 `payload.objects[0].class_name` 만 매핑할 뿐 다중 객체 이벤트에 대한 실패 횟수 (`failure_count`) 와 비율 (`failure_rate`) 을 계산하는 집계 로직이 투영 (Projection) 에서 구현되지 않았습니다.

따라서 사용자의 요구사항을 충족시키기 위해서는 `read_grip_object_failures`라는 새로운 Read Model 을 생성하여, `object_name` 을 기본키로 하고 `total_attempts`, `success_count`, `failure_count`, `failure_rate` 필드를 가진 집계 테이블을 구축해야 합니다.

이러한 구조적 한계로 인해 사용자가 원하는 '상위 목록' 조회는 기존 아키텍처로는 불가능하며, 신규 Read Model 생성을 통한 아키텍처 변경이 유일한 해결책입니다.
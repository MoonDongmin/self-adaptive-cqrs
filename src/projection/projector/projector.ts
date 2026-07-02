import { SensorValueMessage } from '@/projection/kafka/sensor-value.message';
import { EventStoreEventRow } from '@/projection/repository/event-store-reader.repository';
import { DrizzleTx } from '@/shared/database/drizzle.provider';

// 투영된 행이 해당 Read Model 의 도메인 정합성 규칙을 위반했을 때의 단일 위반 근거.
// 구조(zod)는 통과했으나 값이 의미적으로 틀린 경우(예: 파일명 attempt 불일치)를 담아
// CatchUpRunner 가 표준 이상 로그로 방출한다. 로그 윈도우는 msg 만 LLM 에 보이므로
// detail 에 자족적 문장을 담고, 나머지 필드는 log_event 구조화 컬럼으로도 남긴다.
export type IntegrityViolation = {
  readModelName: string; // 대상 Read Model 테이블명(예: read_multimodal) — Insight 카드와 매칭
  sceneKey: string;
  attemptNum: number;
  streamId: string;
  globalSeq: number;
  ruleName: string; // 위반한 규칙 이름
  affectedColumns: string[]; // 오염된 Read Model 컬럼
  observedValue: string; // 실제 관측된(위반한) 값 — 근거
  expected: string; // 규칙이 기대한 값/범위
  detail: string; // 사람이 읽는 자족적 한 문장(로그 msg 로 방출)
};

export interface Projector<Insert> {
  readonly name: string;

  map(event: EventStoreEventRow): Insert;

  upsert(tx: DrizzleTx, row: Insert): Promise<void>;

  // 선택: 커밋 후 센서 값 관찰용 메시지로 변환한다. 미구현 프로젝터(예: multimodal)는
  // 발행하지 않으므로 CatchUpRunner 는 프로젝터-불문으로 유지된다.
  toSensorValueMessages?(
    rows: Insert[],
    events: EventStoreEventRow[],
  ): SensorValueMessage[];

  // 선택: 투영된 행이 이 Read Model 의 도메인 정합성 규칙을 위반하는지 검사한다.
  // 구조 검증(zod)만으로 못 잡는 의미적 값 오류를 잡아 위반 목록으로 돌려주면,
  // CatchUpRunner 가 표준 이상 로그(error)로 방출 → 기존 로그 레인이 근본원인·권고 문서를 낸다.
  // 미구현 프로젝터는 검사를 건너뛴다(프로젝터-불문 유지).
  checkIntegrity?(row: Insert, event: EventStoreEventRow): IntegrityViolation[];
}

export type ProjectionResult = {
  projectorName: string;
  fromSeq: number;
  toSeq: number;
  processed: number;
};

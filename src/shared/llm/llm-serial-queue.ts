// 분석용 LLM 호출 직렬화 큐.
//
// LangGraph 의사결정 게이트가 생성기 노드들을 fan-out 하면 무거운 생성 요청(코드 포함
// 수천~1만 토큰)이 동시에 LM Studio 로 나간다. 단일 모델 서버는 직렬 처리라 뒤에 선
// 요청이 큐 대기 시간까지 HTTP 타임아웃에 잡아먹혀 전 생성기가 동반 강등된다
// (2026-07-14 실측: dataQuality/newReadModel/versionSwitch 3개 전부 TimeoutError).
// 클라이언트 쪽에서 한 번에 한 요청만 내보내면, 각 요청의 타임아웃은 실제 처리
// 시간에만 적용된다. 그래프 구조(병렬 fan-out)는 그대로 두고 호출 경계만 직렬화한다.
let tail: Promise<unknown> = Promise.resolve();

export function runExclusive<T>(task: () => Promise<T>): Promise<T> {
  const next: Promise<T> = tail.then(task, task);
  // 실패해도 큐가 끊기지 않게 정착만 기다린다(에러는 next 로 전파).
  tail = next.catch(() => undefined);
  return next;
}

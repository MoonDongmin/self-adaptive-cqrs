# 층1 이상신호 탐지 평가 (`run-layer1-detection.mjs`)

## 1. 무엇을 확인하는가

**"층1(결정론적 이상 탐지 + LLM 종합 판정)이 벤치마크 500건 속 이상 파일 50건을 얼마나 잡아내고, 정상 450건을 얼마나 잘못 잡는가"** 를 실제 실행 중인 시스템(E2E)에 대해 측정한다.

단위 테스트가 아니라, 실제 앱(:3000) · Postgres · Kafka · LLM(LM Studio)이 모두 떠 있는 상태에서 벤치마크 데이터를 REST API 로 흘려 넣고, 시스템이 남기는 **로그와 응답**을 정답지(`manifest.json`)와 대조해 채점하는 방식이다.

### 측정 지표

| 지표 | 의미 |
|---|---|
| Recall (strict / loose) | 이상 50건 중 탐지된 비율. strict 는 "정확히 그 scene 을 지목", loose 는 "그 파일이 포함된 이상 판정 윈도우에 걸림"까지 인정 |
| FPR (오탐율) | 정상 450건 중 이상으로 잘못 플래그된 비율 |
| Precision | strict 탐지 기준 정밀도 |
| 하드 네거티브 통과율 | "값이 튀지만 정상으로 판정되어야 하는" 함정 5건을 통과했는가 |
| 유형별 탐지율 | 이상 10유형 각각의 strict/loose 탐지 수 |

### 벤치마크 데이터셋 (`data/eval/layer1-detection/`, 총 500건)

- 정상 445건: 실측 원본 139 + 증강 301 + jump 선행 파일 5
- 이상 50건: 10유형 × 5 variant
- 하드 네거티브 5건: 변조되어 있으나 **정상 판정이 정답**인 함정 (오탐 측정용)

## 2. 이상 유형 10종과 탐지 채널

각 이상 유형은 시스템의 서로 다른 지점에서 잡혀야 하며, 러너는 유형별로 다른 관측 채널을 본다.

| 이상 유형 | 이상 내용 | 탐지 지점 | 러너의 관측 채널 |
|---|---|---|---|
| zod-reject-type-mismatch | 타입 불일치 (예: `grip_succeed: true`) | 삽입 단계 `toyDataSchema.parse` | `POST /insert/:index` 응답의 `failed[]` + `insert.file.failed` 로그 |
| zod-reject-missing-field | 필수 필드 누락 (예: `grip_data` 통째 삭제) | 삽입 단계 `toyDataSchema.parse` | 위와 동일 |
| payload-drift | 스키마에 없는 미지 필드 추가 (예: `gripper_temperature`) | `payload-drift.detector.ts` | `payload.schema.drift` 로그의 `newKeys` (파일별 고유 키로 귀속) |
| projection-map-failed | `objects` 빈 배열 → 투영 매핑 실패 | `grip-result.projector.ts` | `projection.map.failed` 로그의 `streamId` |
| physical-rotation-invalid | 회전행렬 직교성 붕괴 | 센서 관찰 (⚠ physical) | `sensor.observe.triggered` 로그 |
| physical-negative-depth | 파지 깊이 ≤ 0 | 센서 관찰 (⚠ physical) | 위와 동일 |
| physical-2d-out-of-image | 2D 좌표가 이미지 범위 밖 | 센서 관찰 (⚠ physical) | 위와 동일 |
| consistency-translation-workspace | 성공(grip=1)인데 위치가 워크스페이스 밖 | 센서 관찰 (⚠ consistency) | 위와 동일 |
| consistency-grip-depth | 성공인데 파지 깊이가 허용 범위 밖 | 센서 관찰 (⚠ consistency) | 위와 동일 |
| jump-grip-depth | 같은 scene 선행 시도 대비 깊이 급변 | 센서 관찰 (⚠ jump) | 위와 동일 |

## 3. 어떻게 판단하는가 — 센서 관찰 채널의 판정 구조

physical / consistency / jump 6개 유형(30건)이 이 평가의 핵심이며, **"산수는 코드가, 해석은 LLM 이"** 하는 2단 구조로 판정된다.

### 3-1. 결정론적 4층 주석 (`sensor-batch-annotator.ts`)

Kafka 로 흘러온 센서 값 배치의 각 레코드에 코드가 수치 검사를 돌려 ⚠ 주석을 붙인다.

| 층 | 검사 내용 | 판정 권한 |
|---|---|---|
| ⚠ physical | 그 자체로 불가능한 값: 회전행렬 R·Rᵀ≠I 또는 det≠+1, 깊이 ≤ 0, 이미지 경계(1920×1110px) 밖 좌표, grip_succeed ∉ {0,1} | **확정** — LLM 이 뒤집을 수 없음 |
| ⚠ consistency | 값들끼리의 모순: 성공(grip=1)인데 translation 이 워크스페이스(X±0.5, Y 0.65~0.95, Z 0.95~1.15m) 밖이거나 파지 깊이가 [0.01, 0.3]m 밖 | **확정** — LLM 이 뒤집을 수 없음 |
| ⚠ jump | 같은 sceneKey 내 직전 레코드 대비 평균 파지 깊이 Δ > 0.1m (translation 급변은 마운트 이동이 정상이라 검사 안 함) | **LLM 이 판정** — 재시도 등 정상 맥락일 수 있음 |
| ⚠ stat | 관측 분포(실측 139건, MAD 기반 robust-z > 3.5) 밖 신규값 | **참고 정보만** — 단독 판정 근거 아님 |

### 3-2. LLM 의 역할 (`sensor-screener.ts`)

- **주석이 하나도 없는 배치** → LLM 호출 없이 정상 확정(`sensor.observe.skipped`). 싼 모델이 원시 수치에서 위반을 지어내는 환각을 차단하기 위함.
- **⚠ physical / consistency 가 있는 배치** → LLM 에게 배치 + 수기 베이스라인을 주고 판정시키되, 확정 위반 scene 은 LLM 출력과 무관하게 verdict 에 **강제 병합**된다. LLM 이 "정상"이라 해도 탐지가 소실되지 않는다.
- **⚠ jump 만 있는 배치** → LLM 의 실제 판정 영역. "물체·장면 전환으로 설명되는 급변은 정상, 같은 물체인데 값만 튀면 이상"을 배치 맥락으로 판단한다.
- **LLM 장애 시 폴백** → 재시도 상한 도달 시 결정론적 주석만으로 판정을 강등 수행한다(physical/consistency/jump 주석이 있으면 triggered).

즉 이 평가에서 **LLM 의 순수 기여분은 (1) jump 의 정상/이상 분별과 (2) 확정 위반의 사유 서술**이고, physical/consistency 는 결정론 계산이 안전망으로 보장한다.

### 3-3. strict vs loose 채점

`sensor.observe.triggered` 로그에는 두 목록이 실린다:

- `offendingSceneKeys` — 판정이 지목한 의심 scene → **strict** 탐지: 이상 파일의 scene 이 여기 포함
- `batchSceneKeys` — 이상 판정된 윈도우의 전체 구성원 → **loose** 탐지: strict 실패여도 그 파일이 이상 윈도우에 속하면 인정

zod / drift / projection 채널은 파일 단위로 확정적이라 strict = loose 다.

### 3-4. 오탐(FP) 판정 규칙

정상 라벨 파일이 어느 채널에든 걸리면 FP 로 센다. 단 예외가 하나 있다: jump 선행 파일(`_01`)처럼 **이상 파일과 scene 을 공유**하는 정상 파일은, scene 단위 플래그가 이상 파일 몫이므로 FP 로 세지 않는다 (`insert` 채널 거절은 파일 단위라 예외 없음).

## 4. 실행 흐름 (6단계)

```
[1] 리셋      event_store · read model · projection_cursor 초기화 (--skip-reset 로 생략 가능)
[2] 적재      poison(projection-map-failed) 5건 제외 495건을 정렬 순서대로 POST /insert/:index
              → zod 거절이 여기서 잡힘
[3] 투영      POST /projection/multimodal, /projection/grip-result
              → grip-result 가 센서 값을 Kafka 로 발행
[4] 관찰 대기  sensor.observe.triggered/skipped 로그의 count 누적이 투영 건수에 닿을 때까지 폴링
              (상한 30분, 정체 5분 — LLM 판정이 끼어 오래 걸릴 수 있음)
[5] poison    한 건씩 적재 → 투영 실패 확인 → projection_cursor 수동 전진
              (poison 은 투영 트랜잭션을 통째로 실패시켜 커서가 못 넘어가므로 마지막에 격리 검증)
[6] 채점      러너 시작 이후의 pino 로그 슬라이스를 manifest 와 대조 → 지표 산출
              → scripts/eval/results/layer1-run-<timestamp>.json 저장
```

로그는 `LogTailer` 가 러너 시작 시점의 파일 오프셋부터만 읽어(`src/shared/logger/logs/log.json`), 이전 실행의 로그가 채점에 섞이지 않는다.

## 5. 실행 방법

```bash
# 전제: 앱(:3000) · Postgres(:65432) · Kafka · LLM(LM Studio) 기동 상태
node scripts/eval/run-layer1-detection.mjs              # DB 리셋 후 전체 실행
node scripts/eval/run-layer1-detection.mjs --skip-reset # 리셋 생략

# 대기 상한 조정
EVAL_OBSERVE_TIMEOUT_MS=3600000 EVAL_OBSERVE_STAGNATION_MS=600000 \
  node scripts/eval/run-layer1-detection.mjs
```

결과는 콘솔 요약(전체/유형별 탐지율, 오탐·미탐 파일 목록)과 `results/` 아래 JSON(파일별 판정 기록 포함)으로 남는다.

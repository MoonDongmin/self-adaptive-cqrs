# Kafka 기반 선판단(이상 탐지) 구현 스펙

> **문서 성격**: 사용자가 **직접 구현**하기 위한 실행 가능한 구현 스펙. 코드 청사진이 아니라 "무엇을 어디에 어떻게 만드는가"의 지시서.
> **상위 설계**: `docs/llm-context/llm-context-빌더-구현계획.md` (전체 파이프라인). 본 문서는 그중 **선판단(screener)** 만 떼어낸다.
> **이 문서의 범위 한 줄**: `log-events` 토픽에 쌓인 로그를 컨슈머가 배치로 드레인하고, **싼 LLM이 "이 구간에 문제가 있나?"를 1차 판정(trigger verdict)** 하는 데까지. 컨텍스트 .md 조립·분석 LLM(3출력)은 **다음 라운드**.

---

## 0. 사전 사실 (이 저장소의 현재 상태)

구현 전 반드시 인지할 현행 구조. 설계 문서의 일부 가정과 다르다.

| 항목 | 현재 상태 | 출처 |
| --- | --- | --- |
| 런타임 | **Node.js** (Bun 아님). prod = `node dist/main`, 테스트 = Jest, 린터 = Biome | `package.json` |
| 적재 경로 | pino → `src/shared/logger/logs/log.json` → `LogService.run()`이 byteOffset tail → `log_event` hypertable | `src/log-collector/log.service.ts`, `json-reader.ts` |
| 커서 | `log_cursor` 테이블에 byteOffset 저장 | `src/shared/database/schema/log/log-cursor.ts` |
| Kafka | **없음** (의존성 0건) | `package.json` |
| LLM | **없음** (langchain/ollama 0건) | grep 결과 |
| 집계 | continuous aggregate **없음**. 수동 hypertable SQL만 존재 | `drizzle/manual/log-event-hypertable.sql` |
| DB | TimescaleDB (`timescale/timescaledb:2.17.2-pg17`), 포트 `65432` | `docker/docker-compose.yml`, `.env` |

> **중요**: 본 스펙은 **앱 코드(pino 로깅)를 건드리지 않는다.** 적재는 별도 로그 셰퍼(Fluent Bit)가 맡는다(§2 근거).
> 또한 현행 `LogService`의 파일 tail → hypertable 적재 경로는 **그대로 유지**한다(이번 범위에서 writer 컨슈머로 이관하지 않음).

---

## 1. 목표와 범위 (한눈에)

### 흐름도

```
[앱]      pino ──▶ src/shared/logger/logs/log.json   (현행, 무변경)
                          │
[셰퍼]    Fluent Bit(file tail + json parse) ──produce──▶ Kafka 토픽 `log-events`   ← 신규
                          │
          ┌───────────────┴─────────────────────────────────────────────┐
[기존]    LogService 파일 tail ──▶ log_event hypertable (현행, 무변경)     │  ← 빈도 집계 소스로 재사용
[신규]    llm-context 컨슈머(배치 드레인) ──▶ 선판단 LLM "문제?" ──▶ PrejudgeVerdict(trigger 여부)
                                              ▲
                                              └── log_event 빈도 롤업 요약(범위 집계 쿼리)
```

### 코드 / LLM 경계 (반드시 지킬 선)

| 누가 | 무엇을 | 안 하는 것 |
| --- | --- | --- |
| **코드 (Kafka 컨슈머)** | 토픽 레코드를 `maxBatchSize`까지 시간순으로 드레인 = **운반** | "이상인가?" 판단 안 함. 필터·선별 없음 |
| **코드 (빈도 repository)** | `log_event` 범위 집계로 "action별 N회" **카운팅** | "이 횟수가 비정상인가?" 판단 안 함 |
| **LLM (선판단 screener)** | (raw 배치 + 빈도 요약)을 보고 **"이 수치/시퀀스가 비정상인가" 해석** = trigger 여부 | 개수 세기(산수) 안 함, 권고(3출력) 생성 안 함 |

> 카운팅은 DB가, **판단만 LLM**이. LLM에 raw 500줄을 던져 세게 하지 않는다 — 압축된 빈도 요약을 주고 해석만 시킨다.

### 이번 범위 / 다음 라운드

- ✅ **이번**: Apache Kafka+Fluent Bit 인프라, `log-events` 컨슈머(배치 드레인), 빈도 집계 repository, 선판단 LLM(Ollama), `PrejudgeVerdict` 산출, 수동 트리거 엔드포인트.
- ❌ **다음**: 컨텍스트 .md 조립(±N 윈도우 + Insight 카드), 분석 LLM(3출력), continuous aggregate, writer 컨슈머 이관.

---

## 2. 인프라 — Apache Kafka + Fluent Bit (왜 이 구조인가 + docker-compose)

### 왜 "앱 직접 produce"가 아니라 "로그 셰퍼"인가

프로덕션에서 로그를 Kafka로 보내는 **표준 패턴**은 앱이 토픽에 직접 produce하는 것이 아니라, 앱은 평소대로 파일/stdout에 구조화 로그를 쓰고 **별도 로그 셰퍼**(Fluent Bit / Vector)가 그것을 tail해 Kafka로 흘리는 것이다. 이유:

- **디커플링**: 브로커가 잠깐 죽어도 앱은 영향 없음(셰퍼가 버퍼링·재시도·백프레셔 담당).
- **앱 코드 무변경**: pino는 이미 `log.json`에 JSON을 쓰고 있음 → 추가 코드 0.
- pino 메인테이너도 인앱 `pino-kafka` 직결보다 **셰퍼를 통한 포워딩을 권장**(로그 I/O를 메인 스레드 밖으로).

> 선택: **Fluent Bit**(C 단일 바이너리, 최소 footprint, 네이티브 Kafka output, docker 서비스 1개). 이 용도는 순수 운반(tail→produce)이라 가장 가벼운 셰퍼가 정답. 대안 Vector(VRL 변환·로그+메트릭 통합이 필요해지면) — 동일 패턴이라 갈아끼우기 쉬움.

### 왜 Redpanda가 아니라 공식 Apache Kafka인가

브로커는 본 연구의 기여(LLM 기반 Read Model 자가적응)에서 가장 먼 배관이다. 따라서 **덜 놀랍고 더 표준적인** 공식 구현을 택한다.

- **무게 차이 소멸**: Kafka 3.3+ `KRaft` 모드가 GA되며 **ZooKeeper가 제거**됐다. 공식 Kafka도 이제 **노드당 단일 프로세스**(별도 ZooKeeper 컨테이너 없이)로 뜬다 — Redpanda의 "단일 바이너리" 이점이 상쇄됨. (HA를 위해 노드를 3개로 늘려도 각 노드는 여전히 프로세스 하나다.)
- **재현성·표준성**: 연구 산출물에서 "Apache Kafka 사용"이 써드파티 호환 구현보다 설명 부담이 없다. 자료·트러블슈팅 문서도 압도적으로 많다.
- **클라이언트 코드 0줄 차이**: 둘 다 동일한 Kafka wire protocol이라 `kafkajs` 컨슈머·`bootstrap_servers`가 그대로다. 이건 순수 인프라(이미지) 결정이라 나중에 바꿔도 비용이 없다.

### 왜 단일 노드가 아니라 3노드 KRaft 클러스터인가 (고가용성)

브로커가 1대뿐이면 그 컨테이너가 죽는 순간 선판단 파이프라인 전체가 멈추고, 더 중요하게는 **이벤트 소싱의 로그 스트림이 유실**될 수 있다(이벤트는 진실의 원천이라 잃으면 안 됨). 그래서 1대 장애를 견디도록 **노드 3개**로 띄운다. 핵심은 KRaft의 두 층을 **둘 다** 살려야 한다는 것:

- **컨트롤러 층(메타데이터 합의)**: Raft 합의라 **과반수(quorum)** 가 모여야 동작. 노드 2개면 과반이 2라 1대만 죽어도 마비된다 → **1대 장애를 견디려면 컨트롤러가 최소 3개**(과반 2, 1대 죽어도 2 유지). 분산 시스템에서 항상 홀수(3·5)로 두는 이유.
- **데이터 층(브로커 복제)**: 복제 계수 3 + `min.insync.replicas=2`. 1대 죽어도 동기화 복제본 2개가 남아 `2 ≥ 2` → 쓰기 계속 성공. 2대 죽으면 쓰기는 막히지만 **데이터는 유실되지 않는다**.

> 2노드는 데이터 복제는 되지만 컨트롤러 과반이 깨져 오히려 "1개보다 장애에 강하지 않다". HA를 실제로 보려면 3노드가 최소 단위.

### `docker/docker-compose.yml`에 추가 (기존 `database` 서비스 옆)

3노드는 **세 서비스가 거의 동일**하고, 노드마다 다른 건 딱 3가지뿐이다:

| 항목 | kafka1 | kafka2 | kafka3 |
| --- | --- | --- | --- |
| `KAFKA_NODE_ID` | 1 | 2 | 3 |
| 호스트 포트 / `OUTSIDE` 리스너 포트 | 19092 | 19093 | 19094 |
| `ADVERTISED` `OUTSIDE` 주소 | `localhost:19092` | `localhost:19093` | `localhost:19094` |

나머지(`CONTROLLER_QUORUM_VOTERS` 3개 전부 명시, `CLUSTER_ID`, 복제계수 3, `min.isr` 2)는 **세 노드가 완전히 동일**해야 한다.

```yaml
  # ── Kafka 3노드 KRaft 클러스터 (ZooKeeper 없음, 1대 장애 견딤) ──
  kafka1:
    image: apache/kafka:latest
    container_name: self-adaptive-cqrs-kafka1
    ports:
      - "19092:19092"   # 호스트(NestJS 앱)에서 접속용
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      # 합의에 참여하는 3개 컨트롤러 전부 명시 (과반수 = 2 → 1대 죽어도 유지)
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka1:9093,2@kafka2:9093,3@kafka3:9093
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_INTER_BROKER_LISTENER_NAME: INTERNAL
      # 리스너: 컨테이너 간 9092 / 호스트 앱 19092 / 컨트롤러 9093
      KAFKA_LISTENERS: INTERNAL://0.0.0.0:9092,OUTSIDE://0.0.0.0:19092,CONTROLLER://0.0.0.0:9093
      KAFKA_ADVERTISED_LISTENERS: INTERNAL://kafka1:9092,OUTSIDE://localhost:19092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: INTERNAL:PLAINTEXT,OUTSIDE:PLAINTEXT,CONTROLLER:PLAINTEXT
      # 노드 3개 → 내부 토픽도 복제계수 3 + 최소동기화 2로 고가용
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 3
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 3
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 2
      # 새로 만들어지는 사용자 토픽(log-events 포함)의 기본 고가용 설정
      KAFKA_DEFAULT_REPLICATION_FACTOR: 3
      KAFKA_MIN_INSYNC_REPLICAS: 2
      KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS: 0
      KAFKA_LOG_DIRS: /var/lib/kafka/data
      # 3개 노드가 같은 ID로 스토리지를 포맷해야 한 클러스터로 묶임 (반드시 동일)
      CLUSTER_ID: 5L6g3nShT-eMCtK--X86sw
    volumes:
      - kafka1-data:/var/lib/kafka/data

  kafka2:
    image: apache/kafka:latest
    container_name: self-adaptive-cqrs-kafka2
    ports:
      - "19093:19093"
    environment:
      KAFKA_NODE_ID: 2
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka1:9093,2@kafka2:9093,3@kafka3:9093
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_INTER_BROKER_LISTENER_NAME: INTERNAL
      KAFKA_LISTENERS: INTERNAL://0.0.0.0:9092,OUTSIDE://0.0.0.0:19093,CONTROLLER://0.0.0.0:9093
      KAFKA_ADVERTISED_LISTENERS: INTERNAL://kafka2:9092,OUTSIDE://localhost:19093
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: INTERNAL:PLAINTEXT,OUTSIDE:PLAINTEXT,CONTROLLER:PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 3
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 3
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 2
      KAFKA_DEFAULT_REPLICATION_FACTOR: 3
      KAFKA_MIN_INSYNC_REPLICAS: 2
      KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS: 0
      KAFKA_LOG_DIRS: /var/lib/kafka/data
      CLUSTER_ID: 5L6g3nShT-eMCtK--X86sw
    volumes:
      - kafka2-data:/var/lib/kafka/data

  kafka3:
    image: apache/kafka:latest
    container_name: self-adaptive-cqrs-kafka3
    ports:
      - "19094:19094"
    environment:
      KAFKA_NODE_ID: 3
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka1:9093,2@kafka2:9093,3@kafka3:9093
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_INTER_BROKER_LISTENER_NAME: INTERNAL
      KAFKA_LISTENERS: INTERNAL://0.0.0.0:9092,OUTSIDE://0.0.0.0:19094,CONTROLLER://0.0.0.0:9093
      KAFKA_ADVERTISED_LISTENERS: INTERNAL://kafka3:9092,OUTSIDE://localhost:19094
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: INTERNAL:PLAINTEXT,OUTSIDE:PLAINTEXT,CONTROLLER:PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 3
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 3
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 2
      KAFKA_DEFAULT_REPLICATION_FACTOR: 3
      KAFKA_MIN_INSYNC_REPLICAS: 2
      KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS: 0
      KAFKA_LOG_DIRS: /var/lib/kafka/data
      CLUSTER_ID: 5L6g3nShT-eMCtK--X86sw
    volumes:
      - kafka3-data:/var/lib/kafka/data

  fluent-bit:
    image: fluent/fluent-bit:latest
    container_name: self-adaptive-cqrs-fluent-bit
    depends_on:
      - kafka1
      - kafka2
      - kafka3
    volumes:
      - ./fluent-bit.conf:/fluent-bit/etc/fluent-bit.conf:ro
      - ../src/shared/logger/logs:/logs:ro   # log.json 마운트(경로는 실제에 맞게 확인)

# 파일 맨 아래(services 밖)에 named volume 3개 선언
volumes:
  kafka1-data:
  kafka2-data:
  kafka3-data:
```

> **리스너 포인트**: `INTERNAL`은 세 컨테이너 모두 `9092`로 같아도 충돌하지 않는다(도커 네트워크에서 `kafka1/2/3` IP가 달라 구분됨). 반면 `OUTSIDE`는 전부 호스트 `localhost`로 나가므로 포트(19092/3/4)를 반드시 다르게 준다.
> **접속 주소**: 앱(호스트)에서는 `localhost:19092,localhost:19093,localhost:19094`(3개 다), 컨테이너 간에는 `kafka1:9092` 등. 포트·호스트 이름은 실제 네트워크에 맞춰 조정.
> **`CLUSTER_ID`**: 예시 값(`5L6g3nShT-eMCtK--X86sw`)을 그대로 써도 되고, `kafka-storage.sh random-uuid`로 새로 발급해 **세 노드에 동일하게** 넣어도 된다.

### `docker/fluent-bit.conf` (신규)

```ini
[SERVICE]
    Flush        5
    Log_Level    info
    Parsers_File parsers.conf      # 이미지 기본 제공(/fluent-bit/etc/parsers.conf, json 파서 포함)

[INPUT]
    Name           tail
    Path           /logs/log.json
    Tag            log-events
    Read_from_Head On             # 기존 내용부터(= 처음부터 적재)
    Parser         json           # pino NDJSON 한 줄 → 구조화

[OUTPUT]
    Name           kafka
    Match          *
    Brokers        kafka1:9092,kafka2:9092,kafka3:9092
    Topics         log-events
    Format         json
```

> `Brokers`에 3개를 다 적는다 — 셰퍼가 부팅 시 하나가 죽어 있어도 나머지로 붙어 클러스터 지도를 받아온다. 하나만 적으면 그 노드가 죽은 순간 셰퍼의 첫 접속(부트스트랩)부터 실패한다.

> pino의 `time`은 epoch ms(숫자)라 기본 `json` 파서의 Time_Format(ISO)과 맞지 않는다. **Fluent Bit의 시간 파싱에 의존하지 않는다** — 컨슈머가 토픽 레코드 JSON의 `time` 필드를 직접 읽는다(§4-3). 프로덕션에선 tail 위치 영속화를 위해 `[INPUT]`에 `DB /fluent-bit/tail.db`를 추가한다(재시작 시 중복 적재 방지).

### 클러스터 기동 + 토픽 생성 + 왕복 검증

> CLI는 살아있는 아무 노드 컨테이너 *안*에서 실행하므로 `--bootstrap-server localhost:9092`(내부 리스너)를 쓴다. 호스트용 19092가 아님에 주의.

```bash
# 0) 3노드 기동
docker compose up -d kafka1 kafka2 kafka3 fluent-bit

# 1) 브로커 3개가 다 붙었는지 확인 (id 1,2,3 이 보이면 클러스터 형성 성공)
docker exec -it self-adaptive-cqrs-kafka1 \
  /opt/kafka/bin/kafka-broker-api-versions.sh --bootstrap-server localhost:9092 | grep -o 'id: [0-9]*'

# 2) 토픽 생성 — 복제계수 3으로 3개 노드에 복제 (고가용)
docker exec -it self-adaptive-cqrs-kafka1 \
  /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 \
  --create --topic log-events --replication-factor 3 --partitions 3

# 3) 복제 배치 확인 (Replicas: 1,2,3 / Isr: 1,2,3 으로 세 노드에 퍼졌는지)
docker exec -it self-adaptive-cqrs-kafka1 \
  /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 \
  --describe --topic log-events

# 4) 앱 로그가 토픽에 도달하는지 확인 (앱 실행해 로그 발생 후)
docker exec -it self-adaptive-cqrs-kafka1 \
  /opt/kafka/bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 \
  --topic log-events --from-beginning --max-messages 5
```

> **verify**: 브로커 3개 부팅 OK → 토픽이 `Isr: 1,2,3`으로 복제 OK → 앱이 로그를 남기면 `kafka-console-consumer.sh`에 JSON 레코드가 보임.

### 고가용성 검증 — 1대 죽여도 동작 (failover 데모)

```bash
# 5) 노드 1대 강제 종료
docker stop self-adaptive-cqrs-kafka2

# 6) 살아있는 노드로 describe → Isr가 1,3 으로 줄지만 토픽은 여전히 살아있음
docker exec -it self-adaptive-cqrs-kafka1 \
  /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 \
  --describe --topic log-events

# 7) 한 대 죽은 상태에서도 produce/consume이 되는지 (= HA의 핵심)
echo '{"time":0,"level":50,"msg":"failover-test"}' | docker exec -i self-adaptive-cqrs-kafka1 \
  /opt/kafka/bin/kafka-console-producer.sh --bootstrap-server localhost:9092 --topic log-events
docker exec -it self-adaptive-cqrs-kafka1 \
  /opt/kafka/bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 \
  --topic log-events --from-beginning --timeout-ms 5000

# 8) 죽은 노드 복구 → Isr가 다시 1,2,3 으로 회복되는지 관찰
docker start self-adaptive-cqrs-kafka2
```

> **verify(HA)**: 7)에서 한 대를 죽였는데도 메시지 송수신 성공 + `Isr`가 `1,2,3 → 1,3`으로 줄었다가 8) 복구 후 다시 `1,2,3`으로 차오름. 복제계수 3 + `min.isr=2` 덕에 1대 장애는 데이터·컨트롤러 양쪽에서 견딘다.

---

## 3. 의존성

```bash
npm install kafkajs @langchain/core @langchain/ollama
```

- `kafkajs` — Kafka 컨슈머.
- `@langchain/ollama` — `ChatOllama` (로컬 10B 모델 호출). `@langchain/core`는 메시지·structured output용.
- `zod` — **이미 설치됨**(`^4.4.3`). LLM 응답 파싱·검증에 재사용.

### Ollama 준비 (로컬)

```bash
ollama pull <10b-모델명>     # 예: qwen2.5:7b / llama3.1:8b 등 보유 모델
ollama serve                 # 기본 http://localhost:11434
```

### `.env` 추가

```
KAFKA_BROKERS=localhost:19092,localhost:19093,localhost:19094
OLLAMA_BASE_URL=http://localhost:11434
PREJUDGE_MODEL=<10b-모델명>
```

> 브로커 주소는 **3개 다** 적는다. 하나만 적으면 그 노드가 죽었을 때 앱의 첫 접속(부트스트랩)부터 실패한다. kafkajs는 이 중 살아있는 노드로 진입해 클러스터 지도를 받아온다.

---

## 4. 신규/수정 파일 명세

> **프로젝트 규칙(CLAUDE.md)**: ① `any` 절대 금지 — 모르면 `unknown`+타입가드 또는 zod. ② 식별자는 전체 단어(약어 금지, `id/url/db/llm/dto` 등 정식 약자만 예외). ③ 기존 repository 패턴(인터페이스 + impl + `unique symbol` 토큰 + `@Inject(DRIZZLE)`)을 그대로 따른다 — 참조: `src/insert/repository/event-store.repository.ts`.

### 신규 (`src/llm-context/`)

| 파일 | 책임 |
| --- | --- |
| `llm-context.type.ts` | zod 스키마 + 타입: `LogBatchRecord`, `FrequencySummary`, `PrejudgeVerdict`. **LLM 응답은 여기 스키마로 파싱**(any 금지). |
| `kafka/log-consumer.config.ts` | 타입 상수 `LOG_CONSUMER_CONFIG`(topic·groupId·maxBatchSize·pollIntervalMS). |
| `kafka/log-consumer.ts` | kafkajs 컨슈머: `log-events` 구독, 배치 드레인, offset 커밋. **운반만, 판정 없음.** |
| `repository/log-frequency.repository.ts` | 인터페이스 + `LOG_FREQUENCY` 심볼 토큰. |
| `repository/log-frequency.repository.impl.ts` | Drizzle: `log_event` 최근 N시간 `action`/`level`별 **빈도 집계**(범위 쿼리). |
| `screener/prejudge.config.ts` | 선판단 상수(모델명·baseUrl·온도·recall 편향 지시문). |
| `screener/prejudge.ts` | **선판단 핵심.** (raw 배치 + 빈도 요약) → `ChatOllama` → `PrejudgeVerdict`. |
| `llm-context.service.ts` | 오케스트레이터: 배치 수신 → 빈도 조회 → 선판단 호출 → verdict 반환/로깅. |
| `llm-context.controller.ts` | `GET /llm-context/detect` — 수동 1회 드레인→선판단(디버그/테스트용). verdict JSON 응답. |
| `llm-context.module.ts` | NestJS 모듈: provider·토큰 wiring. |

### 수정

| 파일 | 변경 |
| --- | --- |
| `src/app.module.ts` | `imports`에 `LlmContextModule` 추가. |
| `src/shared/logger/logging-context.ts` | `LogAction`에 `LLM_PREJUDGE_TRIGGERED: "llm.prejudge.triggered"`, `LLM_PREJUDGE_SKIPPED: "llm.prejudge.skipped"` 추가. |
| `docker/docker-compose.yml` | Apache Kafka(KRaft) + Fluent Bit 서비스 추가(§2). |
| `package.json` | 의존성 추가(§3). |
| `.env` | Kafka/Ollama 변수 추가(§3). |

---

### 4-1. `llm-context.type.ts` — 타입/스키마

```ts
import { z } from "zod";

// Fluent Bit이 토픽에 넣는 레코드 = pino 로그 JSON. 필요한 필드만 좁게 검증.
export const logBatchRecordSchema = z.object({
  time: z.number(),                       // pino epoch ms
  level: z.number(),                      // 30 info / 40 warn / 50 error
  action: z.string().nullable().optional(),
  msg: z.string().nullable().optional(),
  correlation_id: z.string().nullable().optional(),
  stream_id: z.string().nullable().optional(),
});
export type LogBatchRecord = z.infer<typeof logBatchRecordSchema>;

// 빈도 집계 한 줄.
export const frequencyRowSchema = z.object({
  action: z.string().nullable(),
  level: z.number(),
  count: z.number(),
});
export type FrequencyRow = z.infer<typeof frequencyRowSchema>;
export type FrequencySummary = { windowHours: number; rows: FrequencyRow[] };

// 선판단 LLM 출력 = 트리거 여부 + 트립 위치.
export const prejudgeCheckedSchema = z.object({
  triggered: z.boolean(),
  reason: z.string(),                     // 왜 비정상/정상이라 보는지
  tripCorrelationIds: z.array(z.string()).default([]),  // 의심 레코드 추적용
});
export type PrejudgeVerdict = z.infer<typeof prejudgeCheckedSchema>;
```

> `time/level` 등은 pino 원본 키. Fluent Bit이 그대로 흘리므로 snake/원본 키를 그대로 받는다. **`any` 없이 zod로 좁게 검증.**
> **상태**: 이 파일은 **이미 작성돼 있다**(`src/llm-context/llm-context.type.ts`). 출력 스키마 변수명은 `prejudgeCheckedSchema`(타입 별칭은 `PrejudgeVerdict`)이며, 아래 §4-5 prejudge·§4-6 service는 이 이름을 그대로 import한다.
> **재사용 포인트**: `FrequencyRow`는 여기서 zod로 정의된다. §4-4 repository는 **이 타입을 import**하고 재정의하지 않는다(한 곳에서만 정의 → 두 모듈이 갈라지지 않게).

---

### 4-2. `kafka/log-consumer.config.ts` (이미 작성됨)

```ts
export const LOG_CONSUMER_CONFIG = {
  topic: "log-events",
  groupId: "llm-context-builder",   // 독립 컨슈머 그룹 = 독립 offset(= 커서). 별도 커서 테이블 불필요
  maxBatchSize: 500,                // drainOnce가 한 번에 꺼내 LLM에 넘길 최대 레코드 = 토큰 통제
  pollIntervalMS: 1 * 60 * 1000,    // service의 setInterval 주기 드레인(ms)
} as const;
```

> **상태**: 이 파일은 **이미 작성돼 있다**(`src/llm-context/kafka/log-consumer.config.ts`). 키 이름은 `pollIntervalMS`(대문자 MS)이며 §4-3 컨슈머·§4-6 service가 그대로 import한다. 값(주기 1분)은 필요 시 조정.
> 비용 통제는 오직 `maxBatchSize` + `pollIntervalMS`. 이상 목록 같은 사람이 박은 필터는 **두지 않는다.**

### 4-3. `kafka/log-consumer.ts`

**역할 한 줄**: kafkajs `consumer.run({ eachBatch })`로 토픽을 계속 받아 **인메모리 버퍼에 운반**만 하고, `drainOnce()`로 ≤`maxBatchSize`만큼 시간순으로 꺼내준다. **판정·필터 없음.**

> **설계 결정 — push/pull 경계**: kafkajs `consumer.run`은 *푸시*(데이터가 오면 `eachBatch` 호출)인데, 우리 오케스트레이터(§4-6)는 *풀*(`drainOnce()` 호출)이다. 둘을 한 곳에서 부딪히지 않게: **`eachBatch`는 버퍼에 적재만**, **판정은 오직 `detectOnce` 한 경로**(타이머 또는 HTTP가 호출). 두 판정 경로가 생기지 않는다.
> **유실 정직성**: kafkajs는 버퍼에 쌓는 동안 offset을 auto-commit하므로, 프로세스가 *버퍼에 남은 미선별분*을 안은 채 죽으면 그 레코드는 재전달되지 않는다. 이게 허용되는 이유는 **진실의 원천이 `log_event` hypertable(LogService 파일-tail 경로, 무변경)** 이고 빈도 집계(§4-4)도 거기서 읽기 때문 — Kafka 선판단은 best-effort 1차 선별이다. 엄밀한 재드레인이 필요하면 컨슈머 그룹 offset reset(§7-4).

```ts
import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Consumer, EachBatchPayload, Kafka } from "kafkajs";
import { PinoLogger } from "nestjs-pino";
import { LOG_CONSUMER_CONFIG } from "@/llm-context/kafka/log-consumer.config";
import {
  type LogBatchRecord,
  logBatchRecordSchema,
} from "@/llm-context/llm-context.type";
import { LogContext } from "@/shared/logger/logging-context";

@Injectable()
export class LogConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly kafka: Kafka;
  private readonly consumer: Consumer;
  // eachBatch가 채우고 drainOnce가 비우는 인메모리 버퍼(운반 전용).
  private readonly buffer: LogBatchRecord[] = [];

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(LogConsumer.name);

    // 3개 브로커를 콤마로 분리 → 한 노드가 죽어도 나머지로 부트스트랩.
    const brokers: string[] = (process.env.KAFKA_BROKERS ?? "")
      .split(",")
      .map((broker) => broker.trim())
      .filter((broker) => broker.length > 0);

    this.kafka = new Kafka({ clientId: "llm-context", brokers });
    this.consumer = this.kafka.consumer({
      groupId: LOG_CONSUMER_CONFIG.groupId,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.consumer.connect();
    await this.consumer.subscribe({
      topic: LOG_CONSUMER_CONFIG.topic,
      fromBeginning: false,
    });
    // eachBatch = 운반만. kafkajs가 파티션 순서대로 배치를 밀어준다.
    await this.consumer.run({
      eachBatch: (payload: EachBatchPayload) => this.onBatch(payload),
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumer.disconnect();
  }

  // 토픽 레코드 → 파싱 → 버퍼 적재. 판정 없음. 깨진 줄/스키마 불일치는 스킵.
  private async onBatch({
    batch,
    resolveOffset,
    heartbeat,
  }: EachBatchPayload): Promise<void> {
    let skipped = 0;

    for (const message of batch.messages) {
      resolveOffset(message.offset); // 처리 표시 → kafkajs가 offset 커밋(단조 증가)
      const value: string | undefined = message.value?.toString();
      if (value === undefined) {
        skipped += 1;
        continue;
      }

      let json: unknown;
      try {
        json = JSON.parse(value);
      } catch {
        skipped += 1; // 깨진 JSON 한 줄 스킵
        continue;
      }

      const parsed = logBatchRecordSchema.safeParse(json);
      if (!parsed.success) {
        skipped += 1; // 스키마 불일치 스킵
        continue;
      }
      this.buffer.push(parsed.data);
    }

    await heartbeat();

    if (skipped > 0) {
      this.logger.debug(
        {
          [LogContext.SKIPPED]: skipped,
          [LogContext.COUNT]: batch.messages.length,
        },
        "선판단 버퍼 적재 중 스킵",
      );
    }
  }

  // ≤ maxBatchSize 만큼 버퍼에서 꺼내 시간순 정렬해 반환. "이상인가" 판단 금지.
  drainOnce(): LogBatchRecord[] {
    const drained: LogBatchRecord[] = this.buffer.splice(
      0,
      LOG_CONSUMER_CONFIG.maxBatchSize,
    );
    // 파티션 간 순서는 전역 보장이 안 되므로 time 기준으로 한 번 더 정렬(시퀀스 해석용).
    return drained.sort((left, right) => left.time - right.time);
  }
}
```

> **포인트**: `eachBatch` 콜백은 `unknown`(JSON.parse) → `safeParse`로만 좁히므로 **`any` 0건**. `message.value`는 `Buffer | null`이라 `?.toString()` + `undefined` 가드. 식별자는 전체 단어(`broker`/`message`/`value`/`left`/`right`).
> **verify**: 토픽에 N건 produce → 잠시 후 `drainOnce()`가 시간순 배치 반환. 프로세스 재시작 시 마지막 커밋 offset부터 재개(이미 버퍼에 들어가 splice된 분은 재전달 안 됨 — 위 "유실 정직성" 참고).

---

### 4-4. `repository/log-frequency.repository.{ts,impl.ts}`

`log-collector/repository/log-event.repository.{ts,impl.ts}` 분리 패턴 그대로: 인터페이스+토큰은 `.ts`, 구현은 `.impl.ts`.

**`repository/log-frequency.repository.ts`** (인터페이스 + `unique symbol` 토큰):

```ts
import { type FrequencyRow } from "@/llm-context/llm-context.type";

export interface LogFrequencyRepository {
  // 최근 windowHours 동안 action/level별 발생 횟수
  countByActionLevel(windowHours: number): Promise<FrequencyRow[]>;
}

export const LOG_FREQUENCY: unique symbol = Symbol("LOG_FREQUENCY");
```

> `FrequencyRow`(= `{ action: string | null; level: number; count: number }`)는 §4-1 `llm-context.type.ts`에 zod로 이미 정의돼 있다 → **import만** 한다(재정의 금지).

**`repository/log-frequency.repository.impl.ts`** (Drizzle, `@Inject(DRIZZLE)`):

대응 SQL:

```sql
SELECT action, level, COUNT(*)::int AS count
FROM log_event
WHERE time >= now() - (interval '1 hour') * $windowHours
GROUP BY action, level
ORDER BY count DESC;
```

```ts
import { Inject, Injectable } from "@nestjs/common";
import { gte, sql } from "drizzle-orm";
import { type FrequencyRow } from "@/llm-context/llm-context.type";
import { type LogFrequencyRepository } from "@/llm-context/repository/log-frequency.repository";
import { DRIZZLE, type Drizzle } from "@/shared/database/drizzle.provider";
import { logEvents } from "@/shared/database/schema";

@Injectable()
export class LogFrequencyRepositoryImpl implements LogFrequencyRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Drizzle) {}

  // 최근 windowHours 동안 action/level별 발생 횟수.
  // TODO: continuous aggregate 도입 시 이 범위 쿼리를 CA 조회로 교체.
  async countByActionLevel(windowHours: number): Promise<FrequencyRow[]> {
    const since: Date = new Date(Date.now() - windowHours * 60 * 60 * 1000);

    const rows: FrequencyRow[] = await this.db
      .select({
        action: logEvents.action,
        level: logEvents.level,
        count: sql<number>`count(*)::int`, // int4 캐스팅 → node-pg가 number로 반환
      })
      .from(logEvents)
      .where(gte(logEvents.time, since))
      .groupBy(logEvents.action, logEvents.level)
      .orderBy(sql`count(*)::int desc`);

    return rows;
  }
}
```

- **실제 컬럼**(`src/shared/database/schema/log/log-event.ts`): `time`(timestamptz, PK 일부), `level`(int), `action`(varchar 64, nullable), `correlationId`/`streamId`/`msg`, `payload`(jsonb). action이 nullable이라 `FrequencyRow.action`도 `string | null`.
- `count(*)`는 bigint(→ node-pg가 string 반환)이므로 `::int`로 캐스팅해 number로 받는다. `sql<number>`로 타입을 명시해 **`any` 없이** 좁힌다.
- `now() - interval * windowHours`를 SQL에 박지 않고 앱에서 `since: Date`를 계산해 `gte`로 넘긴다(drizzle 파라미터 바인딩).

> **verify**: 알려진 로그 N건 적재 후 `countByActionLevel(N)` 합이 N과 일치(action/level 그룹별 분해 합).

---

### 4-5. `screener/prejudge.config.ts` + `screener/prejudge.ts` (핵심)

**config**:

```ts
export const PREJUDGE_CONFIG = {
  model: process.env.PREJUDGE_MODEL ?? "qwen2.5:7b",
  baseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
  temperature: 0,             // 판정 일관성
  frequencyWindowHours: 1,    // 빈도 요약 창
} as const;
```

**prejudge.ts** — (raw 배치 + 빈도 요약) → `ChatOllama` → `PrejudgeVerdict`.

처리 흐름:
1. 빈도 요약·배치를 각각 **마크다운 파이프 표**로 렌더(§5).
2. **산문 추론 + 끝에 ```json 블록** 패턴으로 호출 — JSON-mode를 응답 전체에 강제하면 추론력이 떨어진다(Tam et al.). 모델은 자유롭게 추론한 뒤 마지막에 JSON 한 덩이만 낸다.
3. 마지막 ```json 블록만 뽑아 `JSON.parse` → `prejudgeCheckedSchema.parse`로 검증(`unknown` → 스키마). **`any` 없이.**

```ts
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOllama } from "@langchain/ollama";
import {
  type FrequencySummary,
  type LogBatchRecord,
  type PrejudgeVerdict,
  prejudgeCheckedSchema,
} from "@/llm-context/llm-context.type";
import { PREJUDGE_CONFIG } from "@/llm-context/screener/prejudge.config";

const SYSTEM_PROMPT: string = [
  "너는 로그 이상 1차 선별기다. 아래 (A) 최근 배치와 (B) 빈도 요약을 보고",
  '"들여다볼 문제가 있는가"만 판정하라. 개수는 (B)에 이미 집계돼 있으니',
  "세지 말고 해석만 하라. 두 종류의 이상을 노린다:",
  "  ① 순서/시퀀스 이상 — 배치 안에서 정상 흐름을 벗어난 순서.",
  "  ② 반복/빈도 이상 — 같은 action이 평소보다 비정상적으로 많은 경우.",
  "확신이 없으면 triggered=true 로 둔다(너는 선별기지 확정기가 아니다).",
  "추론은 자유롭게 산문으로 한 뒤, 마지막에 아래 형식의 JSON 한 덩이만 코드블록으로 출력하라:",
  "```json",
  '{ "triggered": boolean, "reason": string, "tripCorrelationIds": string[] }',
  "```",
].join("\n");

// 배치를 시간순 마크다운 표로. time(epoch ms)은 ISO로 보여 가독성↑.
function renderBatchTable(batch: LogBatchRecord[]): string {
  const header = "| time | level | action | correlation_id | msg |\n| --- | --- | --- | --- | --- |";
  const lines = batch.map((record) => {
    const time = new Date(record.time).toISOString();
    return `| ${time} | ${record.level} | ${record.action ?? ""} | ${record.correlation_id ?? ""} | ${record.msg ?? ""} |`;
  });
  return [header, ...lines].join("\n");
}

// 빈도 요약을 마크다운 표로.
function renderFrequencyTable(frequency: FrequencySummary): string {
  const header = "| action | level | count |\n| --- | --- | --- |";
  const lines = frequency.rows.map(
    (row) => `| ${row.action ?? ""} | ${row.level} | ${row.count} |`,
  );
  return [header, ...lines].join("\n");
}

// AIMessage.content는 string | 복합블록[] 둘 다 가능 → 안전하게 문자열로.
function contentToString(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((part) =>
        typeof part === "object" && part !== null && "text" in part
          ? String((part as { text: unknown }).text)
          : "",
      )
      .join("");
  }
  return "";
}

// 마지막 ```json 블록(없으면 첫 { ~ 마지막 })만 뽑아 unknown으로 반환.
function extractJson(text: string): unknown {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  const raw = fenced
    ? fenced[1]
    : text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  return JSON.parse(raw);
}

export async function prejudge(
  batch: LogBatchRecord[],
  frequency: FrequencySummary,
): Promise<PrejudgeVerdict> {
  const model = new ChatOllama({
    model: PREJUDGE_CONFIG.model,
    baseUrl: PREJUDGE_CONFIG.baseUrl,
    temperature: PREJUDGE_CONFIG.temperature,
  });

  const userPrompt: string = [
    "(A) 최근 배치 (시간순):",
    renderBatchTable(batch),
    "",
    `(B) 최근 ${frequency.windowHours}시간 빈도:`,
    renderFrequencyTable(frequency),
  ].join("\n");

  const response = await model.invoke([
    new SystemMessage(SYSTEM_PROMPT),
    new HumanMessage(userPrompt),
  ]);

  // unknown → zod 검증. 파싱 실패하면 throw → service에서 잡아 로깅.
  return prejudgeCheckedSchema.parse(extractJson(contentToString(response.content)));
}
```

> recall 편향: 애매하면 `triggered: true`. 선별이지 확정이 아니다(false positive는 다음 라운드 분석 LLM이 흡수).
> **더 간단한 대안**: 파싱 견고함이 우선이면 `model.withStructuredOutput(prejudgeCheckedSchema)`로 한 줄 처리 가능(추출 함수 불필요, `any` 없음). 단 Ollama에선 응답 전체가 JSON-mode로 강제돼 추론이 다소 떨어질 수 있다 — 본문은 그 트레이드오프를 피하려 산문+추출을 기본으로 둔다.

---

### 4-6. `llm-context.service.ts` (오케스트레이터, 이번 범위)

판정의 **유일한 경로**. `setInterval`(주기)과 HTTP 컨트롤러(수동)가 똑같이 `detectOnce()`를 호출한다(§4-3 push/pull 결정).

```ts
import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { LogConsumer } from "@/llm-context/kafka/log-consumer";
import { LOG_CONSUMER_CONFIG } from "@/llm-context/kafka/log-consumer.config";
import {
  type FrequencySummary,
  type PrejudgeVerdict,
} from "@/llm-context/llm-context.type";
import {
  LOG_FREQUENCY,
  type LogFrequencyRepository,
} from "@/llm-context/repository/log-frequency.repository";
import { prejudge } from "@/llm-context/screener/prejudge";
import { PREJUDGE_CONFIG } from "@/llm-context/screener/prejudge.config";
import { LogAction, LogContext } from "@/shared/logger/logging-context";

@Injectable()
export class LlmContextService implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly logger: PinoLogger,
    private readonly consumer: LogConsumer,
    @Inject(LOG_FREQUENCY)
    private readonly frequency: LogFrequencyRepository,
  ) {
    this.logger.setContext(LlmContextService.name);
  }

  // 주기 드레인 = 평상시 자동 선판단. 한 번 실패해도 다음 주기로 계속.
  onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.detectOnce().catch((error: unknown) => {
        this.logger.error(
          { [LogContext.REASON]: String(error) },
          "선판단 주기 실행 실패",
        );
      });
    }, LOG_CONSUMER_CONFIG.pollIntervalMS);
  }

  onModuleDestroy(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
    }
  }

  async detectOnce(): Promise<PrejudgeVerdict | null> {
    const batch = this.consumer.drainOnce(); // §4-3, 동기(인메모리 splice)
    if (batch.length === 0) {
      return null;
    }

    const rows = await this.frequency.countByActionLevel(
      PREJUDGE_CONFIG.frequencyWindowHours,
    ); // §4-4
    const summary: FrequencySummary = {
      windowHours: PREJUDGE_CONFIG.frequencyWindowHours,
      rows,
    };

    const verdict: PrejudgeVerdict = await prejudge(batch, summary); // §4-5

    this.logger.info(
      {
        action: verdict.triggered
          ? LogAction.LLM_PREJUDGE_TRIGGERED
          : LogAction.LLM_PREJUDGE_SKIPPED,
        [LogContext.COUNT]: batch.length,
        [LogContext.REASON]: verdict.reason,
      },
      verdict.triggered ? "선판단: 트리거" : "선판단: 정상",
    );

    // TODO(다음 라운드): triggered면 ±N 윈도우 조립 → 컨텍스트 .md → 분석 LLM(3출력)
    return verdict;
  }
}
```

- `drainOnce()`는 인메모리 splice라 동기(`await` 불필요). 빈도 조회·prejudge만 비동기.
- 주기 콜백은 `void ...catch(...)`로 감싸 한 번 실패해도 타이머가 죽지 않게 한다(`error: unknown`으로 받아 `any` 회피).
- `LogAction.LLM_PREJUDGE_TRIGGERED/SKIPPED`는 §수정-표대로 `logging-context.ts`에 추가해야 한다(미추가 시 타입 에러).

### 4-7. `llm-context.controller.ts` + `llm-context.module.ts`

**`llm-context.controller.ts`** — 수동 1회 드레인→선판단(디버그/테스트용):

```ts
import { Controller, Get } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { LlmContextService } from "@/llm-context/llm-context.service";
import { type PrejudgeVerdict } from "@/llm-context/llm-context.type";
import { LogContext } from "@/shared/logger/logging-context";

@Controller("llm-context")
export class LlmContextController {
  constructor(
    private readonly logger: PinoLogger,
    private readonly service: LlmContextService,
  ) {
    this.logger.setContext(LlmContextController.name);
  }

  @Get("/detect")
  async detect(): Promise<PrejudgeVerdict> {
    this.logger.info(
      { [LogContext.ROUTE]: "GET /llm-context/detect" },
      "선판단 수동 트리거",
    );

    const verdict: PrejudgeVerdict | null = await this.service.detectOnce();

    // 버퍼가 비어 드레인할 게 없을 때도 동일 스키마로 응답(triggered:false).
    return (
      verdict ?? {
        triggered: false,
        reason: "드레인할 배치 없음(버퍼 비어있음)",
        tripCorrelationIds: [],
      }
    );
  }
}
```

**`llm-context.module.ts`** — provider·토큰 wiring. `prejudge`는 순수 함수라 provider화하지 않고 service가 직접 import한다. `DrizzleModule`은 `@Global`이라 import 불필요.

```ts
import { Module } from "@nestjs/common";
import { LogConsumer } from "@/llm-context/kafka/log-consumer";
import { LlmContextController } from "@/llm-context/llm-context.controller";
import { LlmContextService } from "@/llm-context/llm-context.service";
import { LOG_FREQUENCY } from "@/llm-context/repository/log-frequency.repository";
import { LogFrequencyRepositoryImpl } from "@/llm-context/repository/log-frequency.repository.impl";

@Module({
  controllers: [LlmContextController],
  providers: [
    LogConsumer,
    LlmContextService,
    { provide: LOG_FREQUENCY, useClass: LogFrequencyRepositoryImpl },
  ],
})
export class LlmContextModule {}
```

**`src/app.module.ts`** — `imports` 배열에 `LlmContextModule` 추가(§수정-표):

```ts
import { LlmContextModule } from "@/llm-context/llm-context.module";
// ...
@Module({
  imports: [
    AppLoggerModule,
    InsertModule,
    DrizzleModule,
    ProjectionModule,
    LogModule,
    InsightModule,
    LlmContextModule, // ← 추가
  ],
  // ...
})
```

**`src/shared/logger/logging-context.ts`** — `LogAction`에 두 액션 추가(§4-6 service가 사용):

```ts
  // llm-context 선판단
  LLM_PREJUDGE_TRIGGERED: "llm.prejudge.triggered",
  LLM_PREJUDGE_SKIPPED: "llm.prejudge.skipped",
```

> **verify**: 앱 부팅 시 컨슈머 connect 로그 → `GET /llm-context/detect` 호출 → verdict JSON 산출(배치 없으면 `triggered:false`).

---

## 5. 선판단 프롬프트 설계

잡을 두 종류의 이상:
- ① **순서/시퀀스 이상** (DeepLog 근거) — 배치 안에서 정상 흐름을 벗어난 순서.
- ② **반복/빈도 이상** (LogAnomaly 근거) — 예: "같은 action이 평소 5회/분인데 487회".

프롬프트 원칙:
- **카운팅은 LLM이 아니라 집계** — 빈도 요약(표)을 주고 "이 수치가 비정상인가"만 해석시킨다. 산수 시키지 않음.
- **마크다운 입력** (파이프 표). JSON-mode 강제는 추론력 저하(Tam et al.) → 출력 스키마는 structured output로만 강제.
- **recall 편향** 지시문: "확신이 없으면 triggered=true. 너는 확정이 아니라 선별을 한다."

프롬프트 골격(역할 + 입력 표 2개 + 출력 지시):

```
너는 로그 이상 1차 선별기다. 아래 (A) 최근 배치와 (B) 빈도 요약을 보고
"들여다볼 문제가 있는가"만 판정하라. 개수는 (B)에 이미 집계돼 있으니 세지 말고 해석만 하라.
확신이 없으면 triggered=true 로 둔다(너는 선별기지 확정기가 아니다).

(A) 최근 배치 (시간순):
| time | level | action | correlation_id | msg |
| ... |

(B) 최근 N시간 빈도:
| action | level | count |
| ... |

출력: { triggered, reason, tripCorrelationIds }
```

> **verify**: 정상 로그만 있는 배치 → `triggered:false`. 실패 로그(`db.error`)/빈도 급증("같은 요청 487회") 섞인 배치 → `triggered:true`, `tripCorrelationIds`에 의심 레코드 포함.

---

## 6. 구현 순서 (각 단계 verify 포함)

| 단계 | 작업 | verify |
| --- | --- | --- |
| 0 | docker-compose에 Apache Kafka+Fluent Bit, `fluent-bit.conf`, 토픽 생성, 의존성 설치 | 앱 로그 한 줄이 `kafka-console-consumer.sh ... --topic log-events`에 보임 |
| 1 | `llm-context.type.ts` (zod 스키마) | `tsc --noEmit` 통과, `any`·약어 0건 |
| 2 | `kafka/log-consumer.{config,ts}` | N건 produce → 시간순 배치 수신, 재시작 시 offset 재개(누락·중복 0) |
| 3 | `repository/log-frequency.*` | 빈도 합 일치(범위 쿼리) |
| 4 | `screener/prejudge.{config,ts}` | 정상=무트리거 / 실패·빈도급증=트리거(recall 편향), tripCorrelationIds 포함 |
| 5 | `service` + `controller` + `module` + `app.module` 등록 | 앱 부팅, `GET /llm-context/detect`로 verdict JSON 산출 |

---

## 7. 검증 (end-to-end)

1. **빌드/타입**: `tsc --noEmit` (또는 `nest build`) — 통과, `any`·약어 식별자 0건 (CLAUDE.md 규칙).
2. **적재 왕복**: 앱 실행 → 로그 발생 → Fluent Bit이 `log-events`에 produce → `kafka-console-consumer.sh`로 확인.
3. **선판단 트리거**: `db.error` 등 실패 로그 다수 발생 → `GET /llm-context/detect` → `triggered:true` + 이유 + tripCorrelationIds 확인. (정상 로그만이면 `triggered:false`.)
4. **replay**: 컨슈머 그룹 offset 되돌린 뒤 재드레인 → 같은 배치 재투입, 동일 verdict(재생 가능성).
5. **단위 테스트(Jest)**: 배치 드레인(maxBatchSize 경계·시간순), offset 재개(누락·중복 0), 선판단(정상=무트리거/실패=트리거), 빈도 집계 합.

---

## 8. 범위 밖 (다음 라운드)

- 트리거 시 **컨텍스트 .md 조립** — ±N 윈도우(`log_event` 질의) + Insight 카드(`InsightService.renderAllCards()` 재사용).
- **분석 LLM(3출력)** — langchain PromptTemplate(역할+3출력 지시) → ① 버전 교체 / ② 권고 문서 / ③ 신규 Read Model.
- **continuous aggregate** 정의 SQL(빈도 롤업을 firehose 규모에서 싸게) — §4-4 범위 쿼리를 교체.
- **writer 컨슈머 이관** — 현행 `LogService` 파일 tail → Kafka 컨슈머로 hypertable 적재 이전(현재는 파일 tail 유지).
- Kafka 운영 심화(파티셔닝/복제, consumer lag 모니터링, dead-letter, exactly-once).

---

## 9. 재사용할 기존 자산 (신규 작성 금지)

- **Repository 패턴**: `src/insert/repository/event-store.repository.ts` — 인터페이스 + impl + `unique symbol` + `@Inject(DRIZZLE)`.
- **`DRIZZLE` 토큰 / `Drizzle` 타입**: `src/shared/database/drizzle.provider.ts`. `DrizzleModule`은 `@Global`.
- **`log_event` 스키마**: `src/shared/database/schema/log/log-event.ts` (컬럼: time/level/action/correlationId/streamId/msg/payload …).
- **로깅**: `src/shared/logger/logging-context.ts` (`LogAction`/`LogContext`), PinoLogger 주입 패턴.
- **모듈 등록**: `src/app.module.ts`. 경로 별칭 `@/*` (`tsconfig.json`).
- **zod**: 이미 설치됨(`^4.4.3`) — LLM 응답·토픽 레코드 검증에 재사용.

# Self-Adaptive CQRS — Docs 산출물 포맷 규칙 (v2)

> 본 문서는 LLM 영역이 산출하는 **단일 Docs 산출물**의 형태를 "확실한 규칙"으로 고정한다.
> 성공 기준은 "사람이 읽기 좋다"가 아니라 **"이 Docs를 일반 LLM에 컨텍스트로 넣으면 없을 때보다 결과가 더 좋다"**이며, 그 향상을 실측으로 증명하는 프로토콜(§6)까지 포함한다.

## 0. 확정된 설계 결정 (owner sign-off)

| # | 결정 | 값 |
|---|---|---|
| 1 | 증명 기준선(baseline) | **B0(무맥락) + B1(같은 정보 비구조화) 둘 다 실행, B1 vs Docs 를 헤드라인** |
| 2 | 3대 산출물 강제 | **항상 3섹션 강제 + `INSUFFICIENT_EVIDENCE` 센티넬** (현행 0~3 선택 폐기) |
| 3 | 드롭인 대상 LLM | **로컬 Gemma** (소형·짧은 유효 컨텍스트 전제) |
| 4 | 본문 언어 | **한국어 본문 + 이중 라벨 앵커**(`## 1. 권고 (Recommendation)`) |
| 5 (v2) | 코어 토큰 예산 | 목표 **8,000토큰 이하** / 하드캡 **20,000토큰**(3자/토큰 근사, 결정론 검증) |
| 6 (v2) | 근거 스키마 표현 | **M-Schema식 반구조화** 튜플(`(이름:타입, 의미, Primary Key, Examples)`)로 DDL 대체 |
| 7 (v2) | 로그 노이즈 필터링 | 신호 라인(level ≥ 40 또는 트립 correlation_id 일치) **앞 4줄/뒤 6줄**만 유지 |
| 8 (v2) | 인간 확인 게이트 | DDL 실행·API 컷오버는 **인간 승인 후에만**(human-in-the-loop) |

`self-adaptive-cqrs`의 핵심 기여는 "LLM이 무엇을 컨텍스트로 받아, 사용자가 곧바로 활용 가능한 이 Docs를 어떻게 산출하는가"이다. 본 규칙은 그 산출물의 **형태 계약**이다.

---

## 1. 포맷 결정과 근거

**아우터 컨테이너 = 표준 Markdown(H1/H2 + fenced code). JSON은 아우터로 절대 쓰지 않는다.**
전체 레이아웃: `YAML front-matter → H1 + 한 문장 결론(blockquote) → 근거블록(상단) → 고정 H2 3섹션 → Optional → Guardrails(맨 끝)`.
설계 근거(References) 푸터는 **산출물에 넣지 않는다** — 소비자 LLM 과업에 무관한 메타 정보(Context Rot: 무관 토큰이 정확도를 낮춤)이며, 제거하면 Guardrails 가 컨텍스트 맨 끝에 와 U자형 배치(규칙 13)가 온전해진다. 설계 근거는 본 스펙 §1·§3-a 로 일원화한다.

| 결정 | 근거 (검증 완료) | 출처 |
|---|---|---|
| 아우터 Markdown, JSON 금지 | GPT‑4‑32k HumanEval에서 plain **76.22%** vs JSON **21.95%**(>300% 상대차, p<0.001). OpenAI도 "문서 컬렉션엔 JSON이 특히 나빴다". | arXiv:2411.10541 · OpenAI GPT‑4.1 guide |
| 결론 최상단 + 제약 최하단 재진술 | 정확도는 위치에 대해 **U자형**(처음/끝 최고, 중간 최악). | arXiv:2307.03172 (Lost in the Middle) |
| 근거를 결론보다 위, 출처별 분리 | 후행 self-citation은 "맞다" 판정돼도 **최대 57% 사후 합리화**. 근거를 구조적으로 앞에 고정. | arXiv:2412.18004 |
| 근거는 최소 고신호 발췌만 | 창 한도 이내여도 토큰↑ → 정확도↓(context rot). **Gemma 소형에선 더 치명적.** | Chroma Context Rot |
| 섹션2 = CREATE TABLE + 샘플 ≤3행 | SQL 생성 최적 컨텍스트 67.0% EX(vs DDL-only 59.9%). 10행은 오히려 하락. | arXiv:2204.00498 |
| 코어 토큰 예산(목표 8K/하드캡 20K) | 128K 공칭 모델의 유효 컨텍스트는 실제 **2K~8K 토큰**(GPT-4o ~8K · Llama 3.3 70B ~2K · Claude 3.5 Sonnet ~4K, 공칭≠유효). 27B급도 RULER 32K→128K에서 85.9%→72.9%로 하락. | NoLiMa, arXiv:2502.05167 (ICML 2025) · Gemma 3 TR, arXiv:2503.19786 |
| §2 필드/`<insight_read_db>` 스키마 표현 = M-Schema 튜플 | 반구조화 스키마 표현(컬럼별 이름:타입·의미·PK·예시값 + FK 블록)이 DDL 대비 4개 LLM ablation 평균 **+2.03%**. DDL 약점: 컬럼 설명·예시값 부재로 유사 컬럼 혼동. | XiYan-SQL, arXiv:2411.08599 |
| 매칭 실패 시 스키마 스냅샷 폴백(생략 금지) | schema linking(관련 테이블만 선별)→SQL 생성 2단계 분해가 실행정확도 **3~7%p** 향상 — 단 "관련 것만"이지 "없으면 0"은 아님. | DTS-SQL, arXiv:2402.01117 (EMNLP 2024 Findings) |
| 로그 노이즈 필터링(신호 앞4/뒤6줄) | 성공 로그 템플릿(Drain) 대비 diff로 노이즈 제거 → 에러 라인 앞뒤 컨텍스트 확장 → 토큰 예산 내 가중 프루닝. **설계 패턴만 검증, 정량 성과 인용 금지.** | LogSage, arXiv:2506.03691 |
| 섹션 자기완결(서사적 참조 금지) | ~300토큰 집중 프롬프트가 ~113K 전체 프롬프트를 전 모델에서 능가. 18개 모델 전부에서 **셔플된 haystack**이 논리적으로 짜인 문서보다 needle 검색 성능이 높음(서사적 흐름은 검색에 도움 안 됨). 벤더 비동료심사·needle 태스크 한정. | Context Rot, Chroma (2025) |
| 단일 문서 주입 유지(RAG 미채택) | long-context 주입이 RAG를 평균 능가(**56.3% vs 49.0%**, 13,628문항). | LC vs RAG, arXiv:2501.01880 |
| 인간 확인 게이트·코어 라우터 구조 | 항상 로드되는 코어 라우터 문서 + 키워드 매칭 조건부 로드 전문 문서 + 환경 변경 액션 전 명시적 human-in-the-loop 확인 게이트. | AWS incident-response playbooks (github.com/aws-samples/aws-incident-response-playbooks) |

### 1-a. 20B급 로컬 모델 전제로 인한 조정 — **중요**
- 포맷 근거의 상당수는 Claude/GPT 튜닝값이다. **20B급 로컬 모델(로컬 Gemma·gpt-oss-20b·Qwen3 14B급 등)에서의 유효성은 §6 ablation이 곧 재검증**이다(consumer=로컬 Gemma, 결정 #3).
- 근거블록은 **속성 많은 중첩 XML을 쓰지 않는다**. 출처 분리는 **1단계 얕은 태그**(`<logging_context>`, `<insight_read_db>`)로만 하고 내부는 **마크다운 표/펜스**로 채운다(소형 모델 파싱 견고성 + 토큰 절약).
- **코어(front-matter + 결론 + 근거 + §1~3)는 대상 모델의 유효 컨텍스트에 여유 있게 들어가야 한다.** NoLiMa/Gemma 3 TR가 보이듯 공칭 컨텍스트와 유효 컨텍스트는 별개이므로(공칭≠유효), 코어는 규칙 16의 토큰 예산(목표 8,000 / 하드캡 20,000)을 따른다. Optional은 컨텍스트 예산 부족 시 **실제로 잘라내는** 구획이다.

---

## 2. 확정 규칙셋 (16)

### A. 컨테이너/포맷
1. 파일 맨 앞 **YAML front-matter**(기계검증용, §4 스키마). 파서가 본문을 읽지 않고도 "3요소 계약"과 API 델타를 검증할 수 있어야 한다.
2. front-matter 다음 = **H1(산출물명) + 한 문장 blockquote 결론(TL;DR)**: `결론: <X>를 <Y>로 <재생성|보강>한다 — <핵심 근거 한 문장>. (심각도: …)`. 단 **권고 계열(§1) 산출물이 없으면 '재생성/보강' 단정 금지**(§1 센티넬과 결론이 모순되지 않게 '조치 검토'로 표기 — `renderVerdict` 결정론 강제).
3. 아우터는 **표준 Markdown**. JSON 아우터/근거-컬렉션 래퍼 금지. 임베드 코드·SQL은 언어태그 붙인 ` ``` ` 펜스에만.

### B. 근거-우선 / 그라운딩
4. **원자료 근거는 결론·산출물보다 먼저, 상단**에 둔다. 출처별 얕은 태그(`<logging_context>`, `<insight_read_db>`), 각 항목에 **provenance id**(correlation_id / global_seq)와 타임스탬프를 붙인다. (중첩 XML 금지 — 내부는 마크다운 표.)
5. §1~3의 **모든 사실 주장은 근거 id를 대괄호로 인용**(`[corr:454cc5b0]`, `[seq:1423]`). id로 뒷받침 안 되면 **삭제하거나 `[unsupported]`** 표기. **새 id/컬럼/지표 발명 금지.**
6. 구조적 출력의 **필드 순서 = 생성 순서 = 근거 필드가 결론 필드보다 먼저**(현행 Zod 순서 유지). 답 모양 필드(recommendation, migrationSql)가 그 근거 필드보다 앞서면 안 된다.
7. 근거는 **최소 고신호 발췌**(실패/이상 행, 부재 컬럼)만, 관련도 내림차순. 산문은 ~300줄 이하. CQRS/ES 교과서 설명 금지. **(20B급 로컬 모델 전제로 상향된 핵심 규칙.)** `<logging_context>` 조립 시 신호 라인(level ≥ 40 또는 트립 correlation_id 일치) 주변 **앞 4줄/뒤 6줄**만 유지하고 나머지(부팅 로그·라우트 매핑 등 배경 노이즈)는 제거한다(`contextBeforeLines: 4` / `contextAfterLines: 6`, `log-window.config.ts`). 근거: LogSage 설계 패턴(정량 성과 인용 금지).
8. **자기완결** — "로그 참조"/"스키마는 다른 곳" 같은 외부 참조 금지. 권고·DDL·버전 변경을 정당화할 모든 사실을 인라인. **섹션 간 서사적 참조("위에서 보았듯" 등) 금지 — 각 섹션은 자기완결**이어야 한다(18개 모델 전부에서 셔플된 haystack이 논리적으로 짜인 문서보다 검색 성능이 높다는 근거; Context Rot, Chroma 2025).

### C. 3대 필수 산출물 (일관 형태)
9. **항상 정확히 3개 H2**, 고정 순서·바이트 동일:
   `## 1. 권고 (Recommendation)` / `## 2. Read Model 생성 SQL (Read Model DDL)` / `## 3. API Versioning`.
   근거 없는 섹션은 본문에 `INSUFFICIENT_EVIDENCE — <사유>`를 쓰고 front-matter `sufficientEvidence: false`.
   **정합 게이트(결정론, decision.node.ts)**: (a) 트립 앵커가 `insight.card.miss`뿐이고 다른 에러 신호가 없으면 LLM 호출 없이 '조치 불필요' 확정(프리게이트 — 프롬프트 지시만으로는 확률적으로 뚫림, analysis-bruno-card-miss-a 사례), (b) newReadModel/versionSwitch 선택 시 권고 계열(recommendationDocs/dataQuality)을 결정론으로 동반 강제 — "§1 센티넬 + §2/§3 충실"이라는 자기모순 문서 차단.
10. **섹션1 = ADR/MADR 스켈레톤**: Status · Context · Decision Drivers · Considered Options(**기각 대안 ≥1 + 진 이유**) · Decision Outcome · Consequences(**+/− 둘 다**) · Non-Goals. (근본원인 분석은 여기 Context로 흡수된다 — §5 참조.)
11. **섹션2 산출 SQL 자체는 여전히 완전한 `CREATE TABLE` DDL(+인덱스)** in ` ```sql ` — M-Schema는 **입력 근거 표현**이지 산출 SQL 표현을 바꾸지 않는다. 반면 **`<insight_read_db>`와 §2의 필드 목록은 M-Schema식 반구조화 표현**을 쓴다: ` ```mschema ` 펜스 안에 `# Table: <이름>` + 컬럼별 `(이름:타입, 의미, Primary Key, Examples: [값])` 튜플 목록(PK 플래그는 keyColumns 포함 여부로 결정론 판정, 예시값은 카드의 example 필드에서 채움). §2의 신규 Read Model 필드도 동일 튜플 형식을 쓰되 신규 테이블이라 **Examples는 생략**한다. FK 블록(`【Foreign Keys】`)은 현재 도메인에 FK 메타데이터가 없으므로 생략한다(발명 금지, 규칙 5). 이전 "CREATE TABLE + 샘플 ≤3행"에서 이어받는 원칙은 **예시값을 포함한다는 것**이며 표현 형식만 DDL에서 M-Schema 튜플로 교체됐다. **신규 Read Model 이 있으면 §2에 `### Insight 카드 등록` 블록을 결정론으로 동봉**한다: newReadModel 구조적 출력(proposedName/purpose/keyColumns/fields.meaning)이 insight_entity/insight_field 와 동형이라 LLM 재호출 없이 INSERT SQL 로 변환되며, DDL 과 함께 적용해야 다음 분석부터 신규 모델이 LLM 컨텍스트(카탈로그)에 노출된다 — 자기적응 루프의 카탈로그 폐쇄. §3 마이그레이션 절차에도 카드 등록 단계가 자동 추가된다. 예시값·행수는 '사실' 메타라 재투영 후 introspection 으로 채운다. 대상 Read Model 카드 매칭 실패(또는 `targetReadModel: unknown`) 시 `<insight_read_db>`를 통째로 생략하지 말고, ReadModel 종류 카드 전체를 **최소 스키마 스냅샷**으로 포함한다(소비자 LLM이 현재 스키마를 알아야 해결책을 제시할 수 있다 — schema linking은 "관련 것만"이지 "없으면 0"이 아니다).
12. **섹션3 = Keep a Changelog**: 상단 `Unreleased` 엔트리(ISO date, `from → to`), 6 카테고리(Added/Changed/Deprecated/Removed/Fixed/Security)만 사용 + **마이그레이션 절차**(하위호환 vs 파괴적 / 컷오버 전 테스트 / 롤백 창·조건).

### D. 위치/견고성
13. 최하단 **`## Guardrails (constraints)`** 에 하드 제약 재진술(v1 무손상 · PK `(scene_key, attempt_num)` 유지 · TypeScript `any` 금지 · 식별자 전체 단어 · **DDL 실행·API 컷오버는 인간 승인 후에만(human-in-the-loop)**) — U자형 방지. §2·§3 본문에도 실행 대상 변경이 있을 때는 헤딩 직후에 `> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).` blockquote를 삽입한다.
14. 부속 자료(projectorCode / controllerWiring / 확장 rationale)는 **`## Optional —`** 로 명시. **§2 SQL·§3 API diff는 Optional에 두지 않는다.**
15. **조립은 결정론**(`render.ts`가 구조적 출력을 verbatim 임베드, 조립 단계 LLM 요약 없음). 헤더/순서 바이트 동일.

### E. 예산
16. **토큰 예산**: 코어(front-matter + H1 + 결론 + 근거블록 + §1~3 + Guardrails)는 추정 **8,000토큰 이하 목표**, **20,000토큰 하드캡**. 토큰 추정은 한/영 혼합 보수치 **3자/토큰** 근사(결정론 검증기용). 검증기(`validate-docs.ts`)는 하드캡 초과 시 `error`, 목표 초과 시 `warning`. 근거: NoLiMa + Gemma 3 TR(§1).

---

## 3. 일관 Docs 템플릿

```markdown
---
docId: analysis-<uuid>
generatedAt: <ISO-8601>
targetReadModel: read_grip_result
sqlDialect: postgres
sufficientEvidence: true          # false ⇒ §1~3 은 INSUFFICIENT_EVIDENCE 센티넬
apiVersion:
  from: v1
  to: v2
  affectedEndpoints: ["POST /projection/v2/grip-result"]
evidenceSources:
  - { origin: developer-logging, anchorId: "454cc5b0" }
  - { origin: insight-read-db,   anchorId: "seq:1423" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
---

# Self-Adaptive CQRS Docs — read_grip_result

> 결론(TL;DR): read_grip_result 를 read_grip_result_v2 로 재생성한다 — 빈 objects로 map 실패[corr:454cc5b0]. (심각도: critical)

<logging_context windowHours="1">

빈도: projection.map.failed(level 50) 1회 · integrity.violation(level 50) 4회

| id | time | level | action | msg |
| --- | --- | --- | --- | --- |
| 454cc5b0 | 05:42:57.837 | 50 | projection.map.failed | objects 비어 있음 ← 앵커 |
| 454cc5b0 | 05:42:57.838 | 50 | db.error | 투영 트랜잭션 실패 |

</logging_context>

<insight_read_db>

## ReadModel: read_grip_result

용도: 그립 시도별 감지 물체 결과 조회

키: (scene_key, attempt_num) · 행수 12,480 · 갱신 2026-06-30

```mschema
# Table: read_grip_result
[
(scene_key:varchar, 씬 식별자, Primary Key, Examples: [90002]),
(attempt_num:smallint, 시도 번호, Primary Key, Examples: [1]),
(object_name:varchar, 감지된 물체명, Examples: [강아지공룡알장난감])
]
```

gap: 정합성 플래그 컬럼 부재 — 이상값이 조용히 통과[seq:1423]

</insight_read_db>

## 1. 권고 (Recommendation)
- Status: proposed
- Context: 빈 objects로 map 실패, 정합성 위반 4회[corr:454cc5b0]
- Decision Drivers: 정합성 · read-latency · v1 무중단
- Considered Options:
  - (권장) A. read_grip_result_v2 신규 + 정합성 플래그 — 재투영 비용 수용
  - (기각) B. 기존 테이블 ALTER — v1 소비자 파괴, "무손상" Driver에서 짐
- Decision Outcome: A — Drivers 대비 근거
- Consequences: + 정합성 격리·롤백 용이 / − 재투영 1회 필요
- Non-Goals: multimodal 파이프라인은 손대지 않음

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

```sql
DROP TABLE IF EXISTS read_grip_result_v2;
CREATE TABLE read_grip_result_v2 ( /* … */ grip_outlier_flag smallint );
CREATE INDEX idx_grip_result_v2_object ON read_grip_result_v2 (object_name, occurred_at);
```
- 키: (scene_key, attempt_num) · 원천 이벤트: GripAttemptRecorded[seq:1423]

### 필드
```mschema
# Table: read_grip_result_v2
[
(scene_key:varchar, 씬 식별자, Primary Key),
(attempt_num:smallint, 시도 번호, Primary Key),
(grip_outlier_flag:smallint, 정합성 이상값 플래그 — 신규[seq:1423])
]
```

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased — <ISO date> (v1 → v2)
- Added: `POST /projection/v2/grip-result`
### 마이그레이션 절차
- 하위호환: 기존 /grip-result 유지 · 파괴적: 없음(추가만)
- 컷오버 전 테스트: /v2 라우트로 재투영 검증
- 롤백 창/조건: v2 파일 삭제로 롤백, 관찰 창 N시간

## Optional — 부속 자료(컨텍스트 축소 시 생략 가능)
<!-- projectorCode / controllerWiring / 확장 rationale. §2 SQL·§3 API diff는 여기 두지 말 것 -->

## Guardrails (constraints)
<!-- 문서 맨 끝 = U자형 주의 최고 지점. References 푸터는 산출물에 넣지 않는다(§1) -->
- v1 무손상 · PK (scene_key, attempt_num) · TypeScript any 금지 · 식별자 전체 단어 · DDL 실행·API 컷오버는 인간 승인 후에만(human-in-the-loop)
```

---

## 3-a. 템플릿 요소별 출처(근거 매핑)

**핵심: 템플릿 골격은 하나의 논문에서 온 게 아니다.** 요소마다 출처가 다르고 강도도 다르다. 정직하게 나누면 — 위치·포맷·SQL 컨텍스트·큐레이션은 **경험적 논문**이 받치고, 골격 관례(front-matter·ADR·Changelog·Optional·태그)는 **업계 표준/컨벤션**(논문 아님)이다.

| 템플릿 요소 | 왜 이렇게 | 강도 | 출처 |
|---|---|---|---|
| 결론(TL;DR) 최상단 · Guardrails 최하단 | 정확도 U자형: 처음/끝 최고, 중간 최악 → 핵심을 양 끝에 | **경험적-강** | Lost in the Middle, arXiv:2307.03172 · OpenAI GPT‑4.1 guide(지시 양끝 반복) |
| §2: `CREATE TABLE` DDL + 샘플 ≤3행 | 이 조합이 SQL 생성 최적(67.0% EX); 10행은 하락 | **경험적-강** | arXiv:2204.00498 |
| 아우터 Markdown · JSON 금지 · 코드는 펜스 | JSON 컨테이너가 코드/추론 성능 폭락(HumanEval 76%→22%) | **경험적-강** | arXiv:2411.10541 · OpenAI GPT‑4.1 guide |
| 근거블록을 결론보다 위(상단) | 롱컨텍스트는 데이터 먼저·질의 나중이 유리(≈30%, 벤더) + 근거 구조적 선고정 | 경험적-혼합 | Anthropic long-context tips · arXiv:2412.18004 |
| 근거 필드 → 결론 필드 순서(생성순서) | 좌→우 생성이라 근거-먼저가 CoT 강제기로 작동 | 경험적-혼합 | dsdev.in (order of fields in structured output) |
| §1~3 각 주장에 provenance id 인용 | 후행 self-citation은 "맞다" 판정에도 최대 57% 사후합리화 → id로 고정 근거에 결속 | 경험적-혼합(단일모델) | arXiv:2412.18004 (ICTIR 2025) |
| 근거는 고신호 발췌만(전체 덤프 금지) | 무관 토큰이 정확도를 실제로 낮춤(context rot). **Gemma 소형엔 더 치명** | 경험적-혼합(벤더 COI) | Chroma Context Rot · (보강) arXiv:2307.03172 |
| 출처별 얕은 태그 `<logging_context>`·`<insight_read_db>` | 태그 구분이 소스 혼동 방지(단, Gemma용으로 중첩 제거) | 컨벤션(가이드) | Anthropic XML tags guide |
| YAML front-matter(기계검증 메타) | 기계판독 문서 관례; 메타/서사 분리. **논문 아님** | 컨벤션 | llmstxt.org · Anthropic Claude Code best-practices |
| §1 권고 = ADR/MADR 스켈레톤 | 결정문서 표준(기각 대안·Consequences 강제). **논문 아님** | 컨벤션 | adr.github.io (ADR/MADR) · Google design docs |
| §3 = Keep a Changelog + 마이그레이션 절차 | 버전 변경 표준 어휘(6 카테고리)·롤백 절차. **논문 아님** | 컨벤션 | keepachangelog.com 1.1.0 · Stripe API upgrades |
| `## Optional` 삭제 가능 꼬리 | 스킵 가능 구획 명시. **단일 제안이며 LLM 프로바이더 미채택** | 컨벤션(약) | llmstxt.org |
| `INSUFFICIENT_EVIDENCE` 탈출구 | 지어내기 대신 구조적 "모름" 허용 = 환각 완화 | 가이드 | Anthropic reduce-hallucinations |
| §2 필드/`<insight_read_db>` M-Schema 튜플(이름:타입, 의미, PK, Examples) | DDL보다 컬럼 의미·예시값이 명시돼 유사 컬럼 혼동 감소, 4모델 ablation 평균 +2.03% | **경험적-강** | XiYan-SQL, arXiv:2411.08599 |
| 코어 토큰 예산(목표 8K/하드캡 20K, 3자/토큰) | 공칭 컨텍스트≠유효 컨텍스트 — 128K 공칭 모델도 유효 컨텍스트는 2K~8K | **경험적-강** | NoLiMa, arXiv:2502.05167 (ICML 2025) · Gemma 3 TR, arXiv:2503.19786 |
| 매칭 실패 시 스키마 스냅샷 폴백(생략 금지) | schema linking은 "관련 것만"이지 "없으면 0"이 아님; 2단계 분해로 실행정확도 3~7%p 향상 | **경험적-강** | DTS-SQL, arXiv:2402.01117 (EMNLP 2024 Findings) |
| 로그 신호 앞4/뒤6줄 프루닝 | 성공 로그 diff 제거 → 에러 라인 컨텍스트 확장 → 토큰 예산 내 프루닝 | 설계 패턴(정량 미검증) | LogSage, arXiv:2506.03691 |
| §2·§3 실행 게이트 blockquote(human-in-the-loop) | 환경 변경 액션 전 명시적 인간 확인 게이트 컨벤션 | 컨벤션 | AWS incident-response playbooks |
| 섹션 자기완결(서사적 참조 금지) | 18개 모델 전부에서 셔플된 haystack이 논리적으로 짜인 문서보다 검색 성능이 높음 → 서사적 흐름은 검색에 도움 안 됨 | 경험적-혼합(벤더 COI, needle 태스크 한정) | Context Rot, Chroma (2025) |

> ⚠️ **논문 작성 시 주의.** 위 표의 **'컨벤션' 행(front-matter·ADR·Changelog·Optional·XML태그·실행 게이트)은 실험으로 검증된 성능 향상이 아니다.** 게다가 그 근거는 대부분 Claude/GPT 대상이다. **20B급 로컬 모델에서 이 관례들이 실제 이득인지는 §5 ablation이 판정한다** — 즉 이 행들은 우리가 검증할 *가설*이고, **'경험적-강' 6행(위치 2307.03172 · 포맷 2411.10541 · SQL 2204.00498 · M-Schema 2411.08599 · 토큰예산 2502.05167/2503.19786 · schema linking 2402.01117)이 우리가 기대는 단단한 바닥**이다. LogSage(로그 필터링)는 **설계 패턴만** 검증됐고 정량 성과(98% precision 등)는 인용 금지 — 경험적-강에 넣지 않는다. 주장할 때 강도를 섞지 말 것.

---

## 4. Front-matter 스키마 (기계검증 계약)

| 필드 | 타입 | 의미 |
|---|---|---|
| `docId` | string | `analysis-<uuid>` (파일명과 일치) |
| `generatedAt` | ISO-8601 | 생성 시각 |
| `targetReadModel` | string | 대상 Read Model 이름 |
| `sqlDialect` | enum | `postgres` |
| `sufficientEvidence` | bool | false면 §1~3 중 하나 이상이 센티넬 |
| `apiVersion.from` / `.to` | string\|null | 버전 델타 |
| `apiVersion.affectedEndpoints` | string[] | 바뀌는 라우트 |
| `evidenceSources[]` | `{origin, anchorId}` | 본문 인용 id의 매니페스트 |
| `constraints[]` | string[] | 하드 제약(하단 Guardrails에서 재진술) |

**검증기(CI/test)가 강제할 것**: (a) front-matter 파싱 성공, (b) `## 1./2./3.` 3섹션 존재, (c) `sufficientEvidence:false`면 대응 섹션에 센티넬 존재, (d) §1~3의 모든 `[id]` 인용이 `evidenceSources`에 실재, (e) **코어(front-matter+H1+결론+근거블록+§1~3) 추정 토큰이 하드캡(20,000) 초과 시 `error`, 목표(8,000) 초과 시 `warning`**(3자/토큰 근사, 규칙 16).

---

## 5. 증명 프로토콜 — "Docs 있으면 더 잘 나온다" (핵심 기여의 평가)

**설계**: within-item paired ablation, 3-arm. 요청·모델·디코딩 고정(greedy/temp 0).

| Arm | 입력 | 증명 |
|---|---|---|
| **B0** | 요청만 (Docs 전무) | 정보가 load-bearing (새너티) |
| **B1** | 요청 + **같은 정보 비구조화 덤프** | 대조군 핵심 |
| **A** | 요청 + **우리 Docs** | — |

- **B0 vs A** = 정보 덕분. **B1 vs A** = **우리 구조가 진짜 기여** ← 헤드라인(결정 #1).
- **Consumer = 로컬 Gemma**(결정 #3). 즉 이 실험이 곧 "Gemma에서 우리 포맷이 실제로 먹히는가"의 재검증.
- **데이터셋**: 실제 파이프라인 트레이스 20~40 시나리오(로그·센서 경로), 각 gold DDL + gold changelog(사람 검수).
- **지표**:
  1. SQL/DDL = **Execution Accuracy** — 샌드박스 Postgres에 실행, 스키마 생성·gold 질의 결과셋 비교. **exact-match 금지**(의미 동등한데 문자열 다르면 오탈락, arXiv:2010.02840).
  2. 권고/API 산문 = **pairwise LLM-judge, 순서 스왑 2회 평균**(flip이면 tie). 위치편향 완화.
  3. **RAGAS식** Faithfulness / Context Precision·Recall 로 기여를 컨텍스트 구성 vs 생성으로 분해.
- **편향 완화**: judge는 **Gemma와 다른 패밀리**(cloud Claude/GPT) — self-preference 자동 회피. 50~100쌍 human-label로 judge 캘리브레이션(인간-인간 일치 ~80% 근접 시 채택, reference-guided). 길이 무시 지시. ≥3 시드. **Wilcoxon signed-rank**로 유의성.
- **헤드라인 주장**: "cross-family 캘리브레이션 judge 기준, A가 B1을 Execution Accuracy와 순서-스왑 win-rate에서 이긴다 — 즉 정보가 아니라 **구조**가 향상을 만든다."
- (선택) 생성 파이프라인에 **Chain-of-Verification** 패스(초안→검증질문→근거만 재검, +23% F1, arXiv:2309.11495).

---

## 6. 구현 상태

**✅ 구현 완료 (Stage 1 + 2)** — `tsc` 0 에러, jest 6/6, 실제 렌더→검증 `valid:true`.
- `src/analysis/front-matter.ts` **(신규)** — front-matter TS 인터페이스 + 결정론 빌더(§4). 파싱이 아니라 산출물에서 3요소 계약을 추출·직렬화하므로 Zod 대신 빌더. 엔드포인트는 versionSwitch 코드 스니펫에서 정규식 추출.
- `src/analysis/render.ts` — `renderReport` 재정렬: **front-matter → H1+결론 → `<logging_context>`(근거 상단) → `<insight_read_db>`(대상 카드 큐레이션) → §1/2/3(센티넬) → Optional → Guardrails(맨 끝, References 푸터 없음)**. `## 근본원인 분석` 상단 섹션 제거(→ 결론·§1 Context 흡수, 규칙4 해소). §1=ADR 렌더러, §3=Keep-a-Changelog 렌더러. 고아(renderDecision/VersionSwitch/NewReadModel/RecommendationDocs) 제거.
- `src/analysis/type/output.type.ts` — recommendationDocs +ADR 필드(decisionDrivers/consequences±/nonGoals), versionSwitch +Changelog(changelogEntries 6-카테고리·backwardCompatible·breaking·testBeforeCutover). evidence-first 순서 유지, 신필드 `.default([])`.
- `src/analysis/prompts/index.ts` — RECOMMENDATION→ADR 구조 + `[corr:id]` 인용, VERSION_SWITCH→Keep-a-Changelog + 마이그레이션 + `[corr:id]` (JSON 스키마 동기화).
- `src/analysis/annalysis.graph.ts` — 조건부 엣지 = 경로별 **고정 3 생성기** 팬아웃(항상 3섹션). `analysis.state.ts`/`aggregate.node.ts`/서비스 2곳 — `docId`·`generatedAt`·`insightCards` 배선.
- `src/analysis/validate-docs.ts`(+`.spec.ts`, 6 케이스) **(신규)** — front-matter 파싱·3섹션 순서·센티넬↔sufficientEvidence 정합·`[id]`↔evidenceSources 매핑 검증.

**✅ v2 Stage 구현 완료** — `tsc` 0 에러, jest 8/8(토큰 예산 테스트 2개 추가), 렌더→검증 스모크 `valid:true`(폴백 케이스 포함).
- ✅ `src/llm-context/repository/log-window.config.ts` — `contextBeforeLines: 4` / `contextAfterLines: 6` 추가(LogSage 패턴, 규칙 7).
- ✅ `src/llm-context/repository/log-window.repository.impl.ts` — `pruneNoise()`가 신호 라인(level≥40 · 앵커 · 트립 correlation_id) 주변 앞4/뒤6줄만 남기고 배경 노이즈 제거.
- ✅ `src/insight/insight-card.renderer.ts` — M-Schema 반구조화 렌더러(` ```mschema ` 펜스 + 튜플, PK는 keyColumns 포함 여부로 결정론 판정, 규칙 11).
- ✅ `src/analysis/render.ts`의 `renderInsightReadDb()` — 대상 카드 매칭 실패 시 생략 대신 ReadModel 카드 전체를 최소 스키마 스냅샷으로 폴백(규칙 11-D, DTS-SQL).
- ✅ `src/analysis/front-matter.ts`의 `STANDING_CONSTRAINTS` — 5번째 human-in-the-loop 제약 추가 완료.
- ✅ `src/analysis/render.ts` — §2·§3 실행 게이트 blockquote(`HUMAN_GATE` 상수), §2 "### 필드" M-Schema 튜플 전환(PK는 keyColumns 포함 여부, Examples 생략).
- ✅ `src/analysis/render.ts` — **References 푸터 제거 + 섹션 순서 교환(Optional → Guardrails)**: 설계 근거는 소비자 무관 메타 정보라 산출물에서 삭제(본 스펙 §1·§3-a로 일원화), Guardrails 가 문서 맨 끝(U자형 온전).
- ✅ `src/analysis/validate-docs.ts` — 코어 토큰 예산 체크 완료. `warnings: string[]` 필드 신설, 코어 = 전체 문서에서 Optional 구획(`## Optional —` ~ `## Guardrails` 직전)만 제외한 부분, 추정 = `ceil(문자수/3)`, 8,000 초과 warning · 20,000 초과 error(규칙 16). 필수 tail 섹션은 Guardrails 만(References 검사 제거).
- ✅ `src/analysis/nodes/decision.node.ts` — **정합 게이트 2종(규칙 9)**: `isCatalogMissOnly()` 프리게이트(카탈로그 404 단독이면 LLM 미호출 '조치 불필요' 확정) + `enforceCoherentSelection()`(산출물 선택 시 권고 계열 동반 강제).
- ✅ `src/analysis/render.ts` — `renderVerdict` 정합(권고 계열 없으면 '조치 검토'로 강등, 규칙 2) + `renderInsightCardRegistration()`(§2에 insight_entity/insight_field INSERT 결정론 동봉, §3 절차에 카드 등록 단계 자동 추가, 규칙 11).
- ✅ `src/analysis/prompts/index.ts` — DECISION_PROMPT 에서 구체 컬럼명 예시 누출 제거(무관 경로로 `grip_outlier_flag` 류가 새는 것 차단) + 정합성 규칙 명문화.

**⬜ 남은 작업 (Stage 3)**
- eval 하네스 — B0/B1/A ablation 러너 + 샌드박스 Postgres Execution Accuracy + cross-family LLM-judge(§5). 별도 대형 작업.
- `decisionNode` repurpose — 지금은 라우팅 없이 잔존(LLM 호출은 함). "섹션별 충분성 판정 게이트"로 전환하면 센티넬을 LLM 판단으로 결정 가능.
- `[id]` 인용을 newReadModel/dataQuality 프롬프트까지 확대(현재는 구조적 필드로 그라운딩).

---

## v2 검증 주의 (기각 클레임)

2026-07 deep-research 적대적 검증(25개 클레임 → 16 확정 / 9 기각)에서 다음 클레임들은 **기각되어 본 스펙·논문에서 인용 금지**다:
(a) LogSage 정량 성과(98% precision · ByteDance 85%),
(b) "원문 로그가 최악(rank 9/11)" 및 grep+tail 하이브리드 최적,
(c) Gemma 3 4B vs 12B 비교 수치,
(d) "소형 모델일수록 RAG 이득이 크다"는 역상관,
(e) LogRoBERTa/LogFiT의 원문 로그 무전처리 클레임.

---

## 참고 문헌

- Does Prompt Formatting Have Any Impact on LLM Performance? — arXiv:2411.10541
- Lost in the Middle — arXiv:2307.03172 (TACL 2024)
- Context Rot — Chroma (2025)
- Post-hoc citation unfaithfulness — arXiv:2412.18004 (ICTIR 2025)
- Evaluating Text-to-SQL / schema context — arXiv:2204.00498
- Semantic Evaluation for Text-to-SQL (Execution Accuracy) — arXiv:2010.02840
- Chain-of-Verification — arXiv:2309.11495 (Findings of ACL 2024)
- Judging LLM-as-a-Judge (MT-Bench, self-preference·position bias) — arXiv:2306.05685
- Field order in structured output (evidence-first as CoT) — dsdev.in
- ADR/MADR templates — adr.github.io · Keep a Changelog 1.1.0 · Google design docs — industrialempathy.com · Stripe API upgrades — docs.stripe.com/upgrades
- Anthropic long-context/XML tags/reduce-hallucinations guides · Claude Code best-practices — code.claude.com · OpenAI GPT-4.1 prompting guide · llmstxt.org
- NoLiMa: Long-Context Evaluation Beyond Literal Matching — arXiv:2502.05167 (ICML 2025)
- Gemma 3 Technical Report — arXiv:2503.19786
- XiYan-SQL / M-Schema — arXiv:2411.08599 · github.com/XGenerationLab/M-Schema
- DTS-SQL: Decomposed Text-to-SQL — arXiv:2402.01117 (EMNLP 2024 Findings)
- LogSage — arXiv:2506.03691
- Long Context vs. RAG for LLMs — arXiv:2501.01880
- AWS incident-response playbooks (ai-playbooks) — github.com/aws-samples/aws-incident-response-playbooks
# InsightDB (Insight Read DB) Phase 1 구현 가이드

> 생성일: 2026-06-15
> 대상 브랜치: main
> 설계 근거: `docs/insight-read-db-설계.md` (포맷 계약·2테이블 구조·라이프사이클)
>
> **개정**: `값/분포` 열과 `insight_field_statistic` 테이블은 Phase 1에서 제외한다.
> 저장 구조는 **2테이블**(`insight_entity`, `insight_field`), 카드 필드표는 **4열**(필드·타입·의미·예시).

## 1. 목표 & 배경

- **무엇을**: 도메인 payload·Read Model 카탈로그를 작은 LLM도 읽을 수 있는 마크다운 "데이터 카드"로 변환해 주는 InsightDB의 **Phase 1**(개발자 수동 등록)을 구현한다.
- **왜**: LLM이 Read Model을 자가 적응시키려면, "지금 무엇을 제공 중이고(완성품) 원천에 어떤 필드가 더 있는가(재료)"를 명시적 사실로 알아야 한다. 이 근거 소스가 InsightDB다.
- **성공 기준**:
  - [ ] `insight_entity` / `insight_field` 2테이블이 기존 Postgres에 생성된다.
  - [ ] 두 테이블을 join해 §4.1(설계 문서) 형식의 마크다운 표 카드(4열)를 찍는 렌더러가 동작한다.
  - [ ] Phase 1 시드로 Read Model 카드 2종(`read_grip_result`, `read_multimodal`)과 이벤트 카드 1종이 등록·렌더링된다.
  - [ ] `bun run tsc --noEmit` / `bun run lint` 통과, `any` 미사용, 전체 단어 식별자.

> **현재 상태**: 스키마 2개(`src/shared/database/schema/insight/insight-entity.ts`, `insight-field.ts`)는
> 이미 정의·등록되어 있다(아래 Step 1~2는 그 확인/마이그레이션 단계). `insight_field_statistic`은 제외됐다.

## 2. 현재 구조 분석 (재사용 대상)

이 기능은 기존 인프라/패턴을 그대로 따른다. 새로 발명할 것이 없다.

- `src/shared/database/drizzle.provider.ts` — `DRIZZLE` 토큰, `Drizzle`/`DrizzleTx` 타입, `Pool` 기반 provider. 모든 DB 접근의 진입점.
- `src/shared/database/drizzle.module.ts` — `@Global()` 모듈로 `DRIZZLE` export. 다른 모듈은 import 없이 주입 가능.
- `src/shared/database/schema/index.ts` — 모든 스키마를 `export *`로 모은다. 스키마는 `insight/`·`log/`·`service/` 하위 폴더로 구성됨.
- `src/shared/database/schema/insight/insight-entity.ts`, `insight-field.ts` — **이미 정의됨**(본 가이드 대상 테이블).
- `src/shared/database/schema/service/read-grip-result.ts`, `read-multimodal.ts`, `event.ts`, `projection-cursor.ts` — `pgTable` + `primaryKey`/`index` 패턴 참고 + 카드 시드의 출처.
- `src/projection/repository/projection-cursor.repository.ts` / `.impl.ts` — **리포지토리 패턴 표준**: `interface` + `unique symbol` 토큰 + `Impl`(`@Inject(DRIZZLE)` + `PinoLogger`, `try/catch`로 `LogAction.DB_ERROR` 로깅).
- `src/projection/projection.module.ts` — `{ provide: TOKEN, useClass: Impl }` DI 등록 패턴.
- `src/projection/projection.controller.ts` — 수동 트리거용 `@Post` 컨트롤러 + Pino 로깅 패턴.
- `src/insert/dto/toy-data.dto.ts` — `toyDataSchema`(zod). **이벤트 카드 필드 정의의 출처**.
- `src/shared/logger/logging-context.ts` — `LogContext`/`LogAction` enum. 신규 액션은 여기 추가.

마이그레이션 흐름: `bun run db:generate`(스키마→SQL) → `bun run db:migrate`(적용). 설정은 `src/config/drizzle.config.ts`(`schema: index.ts`, `out: ./drizzle/migrations`).

## 3. 변경 사항 요약

- `[done]` `src/shared/database/schema/insight/insight-entity.ts` — `insight_entity` (정의 완료)
- `[done]` `src/shared/database/schema/insight/insight-field.ts` — `insight_field` (정의 완료)
- `[done]` `src/shared/database/schema/index.ts` — 위 2개 `export *` 등록 완료
- `[new]` `drizzle/migrations/****_*.sql` — `bun run db:generate` 산출물
- `[new]` `src/insight/insight-card.type.ts` — 렌더러 입출력 타입(`InsightCardData`, `InsightCardField`)
- `[new]` `src/insight/insight-card.renderer.ts` — 카드 데이터 → 마크다운 (순수 변환)
- `[new]` `src/insight/repository/insight-catalog.repository.ts` — 인터페이스 + `INSIGHT_CATALOG` 토큰
- `[new]` `src/insight/repository/insight-catalog.repository.impl.ts` — Drizzle 구현(읽기 join + 쓰기 upsert)
- `[new]` `src/insight/insight.service.ts` — 리포지토리 + 렌더러 조합(`renderCard`/`renderAllCards`)
- `[new]` `src/insight/seed/phase1-cards.ts` — Phase 1 카드 3종 데이터(타입 상수)
- `[new]` `src/insight/seed/insight-seed.service.ts` — 카드 데이터 upsert
- `[new]` `src/insight/insight.controller.ts` — `POST /insight/seed`, `GET /insight/cards`
- `[new]` `src/insight/insight.module.ts` — DI 등록
- `[mod]` `src/app.module.ts` — `InsightModule` import
- `[mod]` `src/shared/logger/logging-context.ts` — `LogAction`에 insight 액션 추가

## 4. 구현 순서 (Bottom-up)

콜리(작은 조각: 스키마 → 타입 → 렌더러/리포지토리)를 먼저, 콜러(서비스 → 시드 → 모듈/컨트롤러)를 나중에 둔다. 각 Step 이후 `tsc --noEmit`가 통과하도록 설계했다.

---

### Step 1: 2테이블 Drizzle 스키마 (이미 정의됨 — 확인)

**파일**: `src/shared/database/schema/insight/insight-entity.ts`, `insight-field.ts`

**목표**: 카드의 저장 골격(엔티티=헤더, 필드=필드표 정의)을 확인한다. **이미 정의·등록되어 있다.**

현재 정의 요약:
```typescript
// insight_entity — 카드 1장 = 1행 (헤더/정의의 뿌리)
//   entity_name(PK), kind('event'|'read_model', .$type 로 리터럴 유니온),
//   purpose(용도), key_columns, row_count(nullable), refreshed_at(nullable)

// insight_field — 카드 필드표의 1행 = 1행 (정의)
//   (entity_name FK + field_name) 복합 PK,
//   data_type, meaning(의미), example(nullable), display_order
```

**주의사항**: `값/분포`(distribution)와 `insight_field_statistic` 테이블은 제외됐다. 필드 정의는 `insight_field`만으로 완결된다. (`값/분포` 재도입은 설계 §4.2 노트의 1:N 시점에.)

---

### Step 2: 마이그레이션 적용

**파일**: `drizzle/migrations/*.sql` *(생성물)*, `src/shared/database/schema/index.ts` *(등록 완료)*

**목표**: 정의된 2테이블을 실제 DB에 반영한다.

**왜 이 순서**: 테이블이 실재해야 이후 리포지토리의 런타임 동작을 검증할 수 있다.

**CLI 실행**:
```bash
bun run db:generate   # 스키마 diff → drizzle/migrations/*.sql 생성
bun run db:migrate    # 마이그레이션 적용
```

**주의사항**: `index.ts`에 `insight/insight-entity`, `insight/insight-field`가 등록돼 있는지 확인(이미 등록됨). 적용 후 `bun run db:studio`로 빈 테이블 2개가 보이면 정상.

---

### Step 3: 카드 데이터 타입 정의

**파일**: `src/insight/insight-card.type.ts` *(신규)*

**목표**: 리포지토리가 만들어 내고 렌더러가 소비하는 "카드 한 장"의 형태를 명시 타입으로 고정한다.

**왜 이 순서**: 렌더러(Step 4)와 리포지토리(Step 5~6)가 모두 이 타입에 의존. DB·NestJS 의존 없는 순수 타입이라 가장 먼저 둔다.

**구현**:
```typescript
// 카드 필드표의 한 행 (4열: 필드·타입·의미·예시)
export interface InsightCardField {
  fieldName: string;
  dataType: string;
  meaning: string;
  example: string | null;
}

// 카드 한 장 (헤더 + 필드표)
export interface InsightCardData {
  kind: "event" | "read_model";
  name: string;
  purpose: string;
  keyColumns: string;
  rowCount: number | null;
  refreshedAt: Date | null;
  fields: InsightCardField[];
}
```

**주의사항**: `example`/`rowCount`/`refreshedAt`는 nullable이다 — Phase 1에서 개발자가 일부를 비워둘 수 있으므로 렌더러가 null을 안전히 처리해야 한다(Step 4).

---

### Step 4: 카드 렌더러 (순수 변환)

**파일**: `src/insight/insight-card.renderer.ts` *(신규)*

**목표**: `InsightCardData` → 설계 문서 §4.1 형식의 **마크다운 표 카드**(4열) 문자열로 변환한다.

**왜 이 순서**: Step 3 타입에만 의존하는 순수 함수다. DB가 없어 단독 단위 테스트가 쉽고, 서비스(Step 7)가 이를 호출한다.

**표가 깨지지 않게 하는 두 규칙**: ① 헤더 줄을 빈 줄로 분리(`\n` 하나면 뷰어가 한 줄로 합침). ② 모든 셀을 `cell()`로 한 줄 압축 + 파이프 이스케이프(셀 줄바꿈/`|`이 표를 깨뜨림). → 시드에 여러 줄 JSON을 넣어도 안전하다.

**구현**:
```typescript
import { Injectable } from "@nestjs/common";
import { InsightCardData, InsightCardField } from "@/insight/insight-card.type";

@Injectable()
export class InsightCardRenderer {
  render(card: InsightCardData): string {
    const heading: string =
      card.kind === "read_model"
        ? `## ReadModel: ${card.name}`
        : `## Event: ${card.name}`;

    const keyParts: string[] = [card.keyColumns];
    if (card.rowCount !== null) {
      keyParts.push(`행수 ${card.rowCount.toLocaleString()}`);
    }
    if (card.refreshedAt !== null) {
      keyParts.push(`갱신 ${card.refreshedAt.toISOString().slice(0, 10)}`);
    }

    const tableHeader: string =
      "| 필드 | 타입 | 의미 | 예시 |\n| --- | --- | --- | --- |";
    const rows: string[] = card.fields.map((field: InsightCardField) =>
      this.renderRow(field),
    );

    // 헤더 줄은 빈 줄로 분리해야 마크다운에서 각각 별도 줄로 렌더된다.
    return [
      heading,
      "",
      `용도: ${this.cell(card.purpose)}`,
      "",
      `키: ${keyParts.join(" · ")}`,
      "",
      tableHeader,
      ...rows,
    ].join("\n");
  }

  private renderRow(field: InsightCardField): string {
    const example: string =
      field.example === null ? "-" : this.cell(field.example);
    return `| ${this.cell(field.fieldName)} | ${this.cell(field.dataType)} | ${this.cell(field.meaning)} | ${example} |`;
  }

  // 표 셀이 깨지지 않도록 개행·중복 공백을 한 줄로 압축하고 파이프(|)를 이스케이프한다.
  private cell(value: string): string {
    return value.replace(/\s+/g, " ").trim().replace(/\|/g, "\\|");
  }
}
```

**주의사항**: `cell()`이 예시의 줄바꿈·`|`을 정제하므로 시드에 여러 줄 JSON을 넣어도 표가 안 깨진다. JSON 예시가 길면 행이 가로로 넓어지는데, 길이를 줄이려면 시드에서 예시를 `{"x1":..., "z8":...}`처럼 축약한다.

---

### Step 5: 카탈로그 리포지토리 인터페이스 + 토큰

**파일**: `src/insight/repository/insight-catalog.repository.ts` *(신규)*

**목표**: 카드 읽기(join)와 시드 쓰기(upsert)의 계약을 정의한다.

**왜 이 순서**: 구현(Step 6)·서비스(Step 7)·시드(Step 8)가 이 인터페이스에 의존. 토큰은 기존 `PROJECTION_CURSOR` 패턴(`unique symbol`)을 그대로 따른다.

**구현**:
```typescript
import type { InsightCardData } from "@/insight/insight-card.type";

// 쓰기 입력 형태 (시드가 채워 넘긴다)
export interface InsightEntityInput {
  entityName: string;
  kind: "event" | "read_model";
  purpose: string;
  keyColumns: string;
  rowCount: number | null;
  refreshedAt: Date | null;
}

export interface InsightFieldInput {
  entityName: string;
  fieldName: string;
  dataType: string;
  meaning: string;
  example: string | null;
  displayOrder: number;
}

export interface InsightCatalogRepository {
  listEntityNames(): Promise<string[]>;
  findCardData(entityName: string): Promise<InsightCardData | null>;
  upsertEntity(entity: InsightEntityInput): Promise<void>;
  upsertField(field: InsightFieldInput): Promise<void>;
}

export const INSIGHT_CATALOG: unique symbol = Symbol("INSIGHT_CATALOG");
```

---

### Step 6: 카탈로그 리포지토리 구현

**파일**: `src/insight/repository/insight-catalog.repository.impl.ts` *(신규)*

**목표**: 2테이블 읽기(엔티티 + 필드) + upsert 쓰기를 Drizzle로 구현한다.

**왜 이 순서**: Step 1(스키마)·Step 3(타입)·Step 5(인터페이스)에 의존. 기존 `ProjectionCursorRepositoryImpl`의 `@Inject(DRIZZLE)` + `PinoLogger` + `try/catch(DB_ERROR)` 패턴을 그대로 따른다.

**구현** (핵심 골자):
```typescript
import { Inject, Injectable } from "@nestjs/common";
import { asc, eq } from "drizzle-orm";
import { PinoLogger } from "nestjs-pino";
import type { InsightCardData } from "@/insight/insight-card.type";
import type {
  InsightCatalogRepository,
  InsightEntityInput,
  InsightFieldInput,
} from "@/insight/repository/insight-catalog.repository";
import { DRIZZLE, type Drizzle } from "@/shared/database/drizzle.provider";
import {
  insightEntity,
  insightField,
} from "@/shared/database/schema";
import { LogAction } from "@/shared/logger/logging-context";

@Injectable()
export class InsightCatalogRepositoryImpl implements InsightCatalogRepository {
  constructor(
    private readonly logger: PinoLogger,
    @Inject(DRIZZLE) private readonly db: Drizzle,
  ) {
    this.logger.setContext(InsightCatalogRepositoryImpl.name);
  }

  async listEntityNames(): Promise<string[]> {
    const rows = await this.db
      .select({ entityName: insightEntity.entityName })
      .from(insightEntity)
      .orderBy(asc(insightEntity.entityName));
    return rows.map((row) => row.entityName);
  }

  async findCardData(entityName: string): Promise<InsightCardData | null> {
    const entityRows = await this.db
      .select()
      .from(insightEntity)
      .where(eq(insightEntity.entityName, entityName))
      .limit(1);
    if (entityRows.length === 0) {
      return null;
    }
    const entity = entityRows[0];

    const fieldRows = await this.db
      .select({
        fieldName: insightField.fieldName,
        dataType: insightField.dataType,
        meaning: insightField.meaning,
        example: insightField.example,
      })
      .from(insightField)
      .where(eq(insightField.entityName, entityName))
      .orderBy(asc(insightField.displayOrder));

    return {
      kind: entity.kind,
      name: entity.entityName,
      purpose: entity.purpose,
      keyColumns: entity.keyColumns,
      rowCount: entity.rowCount,
      refreshedAt: entity.refreshedAt,
      fields: fieldRows.map((row) => ({
        fieldName: row.fieldName,
        dataType: row.dataType,
        meaning: row.meaning,
        example: row.example,
      })),
    };
  }

  async upsertEntity(entity: InsightEntityInput): Promise<void> {
    try {
      await this.db
        .insert(insightEntity)
        .values(entity)
        .onConflictDoUpdate({
          target: insightEntity.entityName,
          set: {
            kind: entity.kind,
            purpose: entity.purpose,
            keyColumns: entity.keyColumns,
            rowCount: entity.rowCount,
            refreshedAt: entity.refreshedAt,
          },
        });
    } catch (err) {
      this.logger.error({ action: LogAction.DB_ERROR, err }, "엔티티 upsert 실패");
      throw err;
    }
  }

  async upsertField(field: InsightFieldInput): Promise<void> {
    try {
      await this.db
        .insert(insightField)
        .values(field)
        .onConflictDoUpdate({
          target: [insightField.entityName, insightField.fieldName],
          set: {
            dataType: field.dataType,
            meaning: field.meaning,
            example: field.example,
            displayOrder: field.displayOrder,
          },
        });
    } catch (err) {
      this.logger.error({ action: LogAction.DB_ERROR, err }, "필드 upsert 실패");
      throw err;
    }
  }
}
```

**주의사항**: `entity.kind`는 `varchar.$type<...>()` 덕분에 `"event" | "read_model"`로 추론되어 `InsightCardData.kind`에 그대로 대입 가능하다(`any`/단언 불필요).

---

### Step 7: InsightService (리포지토리 + 렌더러 조합)

**파일**: `src/insight/insight.service.ts` *(신규)*

**목표**: "이름으로 카드 한 장 렌더" / "전체 카드 렌더"를 제공한다.

**왜 이 순서**: Step 4(렌더러)·Step 6(리포지토리)를 주입받아 조합하는 콜러다.

**구현**:
```typescript
import { Inject, Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { InsightCardRenderer } from "@/insight/insight-card.renderer";
import {
  INSIGHT_CATALOG,
  type InsightCatalogRepository,
} from "@/insight/repository/insight-catalog.repository";

@Injectable()
export class InsightService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly renderer: InsightCardRenderer,
    @Inject(INSIGHT_CATALOG)
    private readonly catalog: InsightCatalogRepository,
  ) {
    this.logger.setContext(InsightService.name);
  }

  async renderCard(entityName: string): Promise<string | null> {
    const card = await this.catalog.findCardData(entityName);
    return card === null ? null : this.renderer.render(card);
  }

  async renderAllCards(): Promise<string> {
    const names: string[] = await this.catalog.listEntityNames();
    const cards: string[] = [];
    for (const name of names) {
      const rendered: string | null = await this.renderCard(name);
      if (rendered !== null) {
        cards.push(rendered);
      }
    }
    return cards.join("\n\n");
  }

  // 브라우저 뷰잉용: 카드들을 HTML 표 페이지로 렌더(마크다운 renderAllCards는 LLM 주입용 유지).
  async renderAllCardsAsHtml(): Promise<string> {
    const names: string[] = await this.catalog.listEntityNames();
    const sections: string[] = [];
    for (const name of names) {
      const card = await this.catalog.findCardData(name);
      if (card !== null) {
        sections.push(this.renderer.renderHtml(card));
      }
    }
    // <!doctype html> ... <style> 표 테두리 ... </style> ... sections.join("\n") ...
    return wrapHtmlPage(sections); // 본문은 renderer.renderHtml(card)들을 합친 것
  }
}
```

**주의사항**: 마크다운 `renderAllCards`는 **LLM 주입용**(설계 §6 "주입"), `renderAllCardsAsHtml`는 **브라우저 뷰잉용**이다. 후자는 `InsightCardRenderer.renderHtml(card)`(HTML `<table>` + `escapeHtml`)를 카드별로 만들어 `<!doctype html>` 페이지로 감싼다. 실제 코드는 `src/insight/insight-card.renderer.ts`/`insight.service.ts` 참고.

---

### Step 8: Phase 1 시드 데이터 + 시드 서비스

**파일**: `src/insight/seed/phase1-cards.ts`, `src/insight/seed/insight-seed.service.ts` *(신규 2개)*

**목표**: Read Model 카드 2종 + 이벤트 카드 1종을 타입 상수로 정의하고 upsert한다.

**왜 이 순서**: Step 5의 입력 타입과 Step 6의 리포지토리에 의존하는 콜러다.

**구현** — `phase1-cards.ts` (대표 발췌; 개발자가 나머지 필드 보강):
```typescript
import type {
  InsightEntityInput,
  InsightFieldInput,
} from "@/insight/repository/insight-catalog.repository";

export interface SeedCard {
  entity: InsightEntityInput;
  fields: InsightFieldInput[];
}

export const PHASE1_CARDS: SeedCard[] = [
  {
    entity: {
      entityName: "read_grip_result",
      kind: "read_model",
      purpose: "장면별 로봇 파지 결과 조회 (성공여부·포즈·그리퍼)",
      keyColumns: "(scene_key, attempt_num)",
      rowCount: null,
      refreshedAt: null,
    },
    fields: [
      {
        entityName: "read_grip_result",
        fieldName: "object_name",
        dataType: "varchar",
        meaning: "파지 대상 객체명",
        example: "강아지공룡알장난감",
        displayOrder: 1,
      },
      {
        entityName: "read_grip_result",
        fieldName: "grip_succeed",
        dataType: "smallint",
        meaning: "파지 성공여부",
        example: "1",
        displayOrder: 2,
      },
      {
        entityName: "read_grip_result",
        fieldName: "gripper_type",
        dataType: "varchar",
        meaning: "그리퍼 종류",
        example: "finger",
        displayOrder: 3,
      },
      // grip_2d_pose, grip_3d_pose, robot_tf, human_annotation_grasp, occurred_at 추가
    ],
  },
  {
    entity: {
      entityName: "read_multimodal",
      kind: "read_model",
      purpose: "장면별 2D이미지·비디오 미디어 링크 조회",
      keyColumns: "(scene_key, attempt_num)",
      rowCount: null,
      refreshedAt: null,
    },
    fields: [
      {
        entityName: "read_multimodal",
        fieldName: "image_2d_uri",
        dataType: "text",
        meaning: "2D 이미지 저장 위치",
        example: "s3://.../00018_01.jpg",
        displayOrder: 1,
      },
      {
        entityName: "read_multimodal",
        fieldName: "video_uri",
        dataType: "text",
        meaning: "원천 비디오 위치",
        example: "s3://.../00018_00.mp4",
        displayOrder: 2,
      },
      // image_2d_file_name, video_file_name 추가
    ],
  },
  {
    entity: {
      entityName: "GripAttemptRecorded", // ⚠️ event_store.event_type 실제 값과 일치시킬 것(주의사항 참조)
      kind: "event",
      purpose: "원천 파지 시도 1건의 전체 payload (Read Model의 재료)",
      keyColumns: "(stream_id, attempt_num)",
      rowCount: null,
      refreshedAt: null,
    },
    fields: [
      {
        entityName: "GripAttemptRecorded",
        fieldName: "grip_succeed",
        dataType: "number",
        meaning: "파지 성공여부",
        example: "1",
        displayOrder: 1,
      },
      {
        entityName: "GripAttemptRecorded",
        fieldName: "grip_data.grip_3d_pose",
        dataType: "object",
        meaning: "3D 파지점 (finger=x1..z8, suction=x,y,z,roll,pitch,yaw,penetrate)",
        example: "{x1:..}",
        displayOrder: 2,
      },
      {
        entityName: "GripAttemptRecorded",
        fieldName: "objects[].class_name",
        dataType: "string",
        meaning: "객체 클래스명",
        example: "강아지공룡알장난감",
        displayOrder: 3,
      },
      // robot_tf, segmentation_points(redact), video_file_name 등 toyDataSchema 기준 보강
    ],
  },
];
```

**구현** — `insight-seed.service.ts`:
```typescript
import { Inject, Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { PHASE1_CARDS } from "@/insight/seed/phase1-cards";
import {
  INSIGHT_CATALOG,
  type InsightCatalogRepository,
} from "@/insight/repository/insight-catalog.repository";
import { LogAction } from "@/shared/logger/logging-context";

@Injectable()
export class InsightSeedService {
  constructor(
    private readonly logger: PinoLogger,
    @Inject(INSIGHT_CATALOG)
    private readonly catalog: InsightCatalogRepository,
  ) {
    this.logger.setContext(InsightSeedService.name);
  }

  async seedPhase1(): Promise<{ entities: number; fields: number }> {
    let fieldCount = 0;
    for (const card of PHASE1_CARDS) {
      await this.catalog.upsertEntity(card.entity);
      for (const field of card.fields) {
        await this.catalog.upsertField(field);
        fieldCount += 1;
      }
    }
    this.logger.info(
      { action: LogAction.INSIGHT_SEED_DONE },
      "InsightDB Phase 1 시드 완료",
    );
    return { entities: PHASE1_CARDS.length, fields: fieldCount };
  }
}
```

**주의사항**:
- **이벤트 카드의 `entityName`은 `event_store.event_type`의 실제 값과 일치**시켜야 LLM이 로그/이벤트와 카드를 연결한다. `src/insert/insert.service.ts`에서 append 시 쓰는 `eventType` 값을 확인해 `"GripAttemptRecorded"`를 교정할 것.
- 발췌에는 대표 필드만 넣었다. `toyDataSchema`(`toy-data.dto.ts`)와 `read-*` 스키마의 나머지 필드를 동일 패턴으로 채운다.

---

### Step 9: 모듈 + 컨트롤러 배선

**파일**: `src/insight/insight.module.ts`, `src/insight/insight.controller.ts` *(신규)*, `src/app.module.ts` *(수정)*

**목표**: DI를 등록하고 수동 트리거 엔드포인트를 연다.

**왜 이 순서**: 위 모든 조각을 묶는 최상위 콜러다.

**구현** — `insight.controller.ts`:
```typescript
import { Controller, Get, Header, Param, Post } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { InsightService } from "@/insight/insight.service";
import { InsightSeedService } from "@/insight/seed/insight-seed.service";
import { LogAction, LogContext } from "@/shared/logger/logging-context";

@Controller("insight")
export class InsightController {
  constructor(
    private readonly logger: PinoLogger,
    private readonly insightService: InsightService,
    private readonly seedService: InsightSeedService,
  ) {
    this.logger.setContext(InsightController.name);
  }

  @Post("/seed")
  seed(): Promise<{ entities: number; fields: number }> {
    this.logger.info(
      { action: LogAction.INSIGHT_SEED_REQUEST, [LogContext.ROUTE]: "POST /insight/seed" },
      "insight 시드 요청 수신",
    );
    return this.seedService.seedPhase1();
  }

  // 브라우저는 마크다운을 렌더하지 못하므로 전체 카드는 HTML 표 페이지로 응답한다.
  @Get("/cards")
  @Header("Content-Type", "text/html; charset=utf-8")
  allCards(): Promise<string> {
    return this.insightService.renderAllCardsAsHtml();
  }

  // 개별 카드는 마크다운 그대로 반환(마크다운 뷰어로 확인).
  @Get("/cards/:name")
  async card(@Param("name") name: string): Promise<string> {
    const rendered: string | null = await this.insightService.renderCard(name);
    return rendered ?? `# (없음) ${name}`;
  }
}
```

**구현** — `insight.module.ts`:
```typescript
import { Module } from "@nestjs/common";
import { InsightController } from "@/insight/insight.controller";
import { InsightCardRenderer } from "@/insight/insight-card.renderer";
import { InsightService } from "@/insight/insight.service";
import { INSIGHT_CATALOG } from "@/insight/repository/insight-catalog.repository";
import { InsightCatalogRepositoryImpl } from "@/insight/repository/insight-catalog.repository.impl";
import { InsightSeedService } from "@/insight/seed/insight-seed.service";

@Module({
  controllers: [InsightController],
  providers: [
    InsightService,
    InsightCardRenderer,
    InsightSeedService,
    { provide: INSIGHT_CATALOG, useClass: InsightCatalogRepositoryImpl },
  ],
  exports: [InsightService],
})
export class InsightModule {}
```

**`app.module.ts` 수정**: `imports` 배열에 `InsightModule` 추가(`DrizzleModule`이 `@Global`이라 DB는 자동 주입).

**`logging-context.ts` 수정**: `LogAction`에 insight 블록 추가.
```typescript
  // insight
  INSIGHT_SEED_REQUEST: "insight.seed.request",
  INSIGHT_SEED_DONE: "insight.seed.done",
```

**주의사항**: 브라우저는 마크다운을 렌더하지 못해 개행을 공백으로 합쳐버린다(전체 카드가 한 줄로 뭉개짐). 그래서 `/insight/cards`는 `renderAllCardsAsHtml()`로 **HTML 표 페이지**를 반환한다(브라우저에서 바로 표로 보임). 마크다운 `renderAllCards()`는 LLM 주입용으로 보존한다. 개별 카드(`/cards/:name`)는 마크다운 그대로이므로 마크다운 뷰어로 확인한다.

## 5. 테스트 포인트

- **단위 테스트** (`*.spec.ts`, ts-jest):
  - `InsightCardRenderer.render` — DB 없이 `InsightCardData` 고정 입력 → 마크다운 스냅샷. `example`이 여러 줄이거나 `|`를 포함해도 한 줄로 압축·이스케이프되는지(`cell`), `kind`별 헤더(`## ReadModel:` vs `## Event:`) 확인, 표가 4열인지 확인.
  - `InsightService.renderAllCards` — `InsightCatalogRepository`를 mock해 정렬·연결(`\n\n`) 검증.
- **통합 확인** (라이브 Postgres 필요):
  - `bun run db:migrate` 후 `POST /insight/seed` → `{ entities: 3, fields: N }`.
  - `GET /insight/cards` → 브라우저에서 HTML 표 3장으로 렌더(개행 안 뭉개짐). `GET /insight/cards/:name` → 마크다운(뷰어로 표 확인).
- **수동 확인**: `GET /insight/cards/read_grip_result` 응답이 설계 문서 예시 카드와 형태 일치.

## 6. 체크리스트

- [ ] Step 1: `insight_entity` / `insight_field` 스키마 확인 (정의·등록 완료)
- [ ] Step 2: `db:generate` + `db:migrate`
- [ ] Step 3: `insight-card.type.ts` 타입 정의 (4열, distribution 없음)
- [ ] Step 4: `InsightCardRenderer` 구현 (4열 표)
- [ ] Step 5: `InsightCatalogRepository` 인터페이스 + `INSIGHT_CATALOG` 토큰
- [ ] Step 6: `InsightCatalogRepositoryImpl` 구현
- [ ] Step 7: `InsightService` 구현
- [ ] Step 8: `PHASE1_CARDS` 데이터 + `InsightSeedService` (event_type 실제 값 교정, 잔여 필드 보강)
- [ ] Step 9: 모듈/컨트롤러 배선 + `app.module.ts` import + `LogAction` 추가
- [ ] `bun run tsc --noEmit` 통과 (또는 `bun run build`)
- [ ] `bun run lint` 통과, `any` 미사용 확인
- [ ] `POST /insight/seed` → `GET /insight/cards` 수동 확인

## 7. 주의사항 & 리스크

- **이벤트 카드 이름 정합성**: `entityName`("GripAttemptRecorded")이 `event_store.event_type` 실제 값과 다르면 LLM이 로그·카드를 연결하지 못한다. `insert.service.ts`의 append 코드를 확인해 맞춘다. (Step 8)
- **`값/분포`는 Phase 1 제외**: 값의 분포·카디널리티·성공률은 *집계*가 필요한 시변 정보라 Phase 1에서 다루지 않는다. 필드 1개 ↔ 통계 N개(이력/다중 메트릭)가 필요해지는 시점에 1:N `insight_field_statistic` 테이블로 재도입한다(설계 §4.2 노트). 그 전까지 자동 집계 프로파일러는 **도입하지 않는다**.
- **카드 선별은 후속 작업**: 카드가 많아지면 전체를 LLM에 주입할 수 없다. 요청 관련성 기반 선별은 설계 §7의 Phase 2 미해결 항목이며 본 가이드 범위 밖이다.
- **마크다운 escape**: 시드 값에 `|`·개행을 넣지 않는다(렌더러가 표를 깨뜨린다). escape 처리는 필요 시 후속.

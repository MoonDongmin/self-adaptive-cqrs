import { Injectable } from '@nestjs/common';
import { InsightCardData, InsightCardField } from '@/insight/insight-card.type';

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

    // M-Schema(arXiv:2411.08599) 반구조화 표현: 컬럼별 (이름:타입, 의미, PK, 예시) 튜플.
    // DDL/표 대비 컬럼 설명·예시값이 붙어 소형 LLM의 유사 컬럼 혼동을 줄인다.
    const tuples: string[] = card.fields.map((field: InsightCardField) =>
      this.renderTuple(field, card.keyColumns),
    );

    // 헤더 줄은 빈 줄로 분리해야 마크다운에서 각각 별도 줄로 렌더된다.
    return [
      heading,
      "",
      `용도: ${this.cell(card.purpose)}`,
      "",
      `키: ${keyParts.join(" · ")}`,
      "",
      "```mschema",
      `# Table: ${card.name}`,
      "[",
      tuples.join(",\n"),
      "]",
      "```",
    ].join("\n");
  }

  private renderTuple(field: InsightCardField, keyColumns: string): string {
    const parts: string[] = [
      `${this.cell(field.fieldName)}:${this.cell(field.dataType)}`,
      this.cell(field.meaning),
    ];

    if (keyColumns.includes(field.fieldName)) {
      parts.push("Primary Key");
    }

    if (field.example !== null) {
      parts.push(`Examples: [${this.cell(field.example)}]`);
    }

    return `(${parts.join(", ")})`;
  }

  // 표 셀이 깨지지 않도록 개행·중복 공백을 한 줄로 압축하고 파이프(|)를 이스케이프한다.
  private cell(value: string): string {
    return value.replace(/\s+/g, " ").trim().replace(/\|/g, "\\|");
  }

  // 브라우저가 마크다운을 렌더하지 못하므로, 뷰잉용으로 HTML 표를 직접 만든다.
  renderHtml(card: InsightCardData): string {
    const title: string =
      card.kind === "read_model"
        ? `ReadModel: ${card.name}`
        : `Event: ${card.name}`;

    const keyParts: string[] = [card.keyColumns];

    if (card.rowCount !== null) {
      keyParts.push(`행수 ${card.rowCount.toLocaleString()}`);
    }

    if (card.refreshedAt !== null) {
      keyParts.push(`갱신 ${card.refreshedAt.toISOString().slice(0, 10)}`);
    }

    const bodyRows: string = card.fields
      .map((field: InsightCardField) => {
        const example: string =
          field.example === null ? "-" : this.escapeHtml(field.example);

        return `      <tr><td><code>${this.escapeHtml(field.fieldName)}</code></td><td>${this.escapeHtml(field.dataType)}</td><td>${this.escapeHtml(field.meaning)}</td><td>${example}</td></tr>`;
      })
      .join("\n");

    return [
      "  <section>",
      `    <h2>${this.escapeHtml(title)}</h2>`,
      `    <p><strong>용도</strong>: ${this.escapeHtml(card.purpose)}</p>`,
      `    <p><strong>키</strong>: ${this.escapeHtml(keyParts.join(" · "))}</p>`,
      "    <table>",
      "      <thead><tr><th>필드</th><th>타입</th><th>의미</th><th>예시</th></tr></thead>",
      "      <tbody>",
      bodyRows,
      "      </tbody>",
      "    </table>",
      "  </section>",
    ].join("\n");
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
}

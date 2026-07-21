// Excalidraw figure generator for the Self-Adaptive CQRS paper.
// Emits .excalidraw JSON files under docs/architecture/figures/.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUTPUT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
mkdirSync(OUTPUT_DIRECTORY, { recursive: true });

let seedState = 123456789;
function nextSeed() {
  seedState = (seedState * 1103515245 + 12345) % 2147483647;
  return Math.abs(seedState);
}

const FONT_FAMILY = 2; // clean sans-serif (Virgil lacks Korean glyphs)

// Semantic color palette (consistent across all figures)
const COLOR = {
  llmCall: "#fff9db",    // node that invokes an LLM
  storage: "#e9ecef",    // DB / file storage
  kafka: "#d3f9d8",      // Kafka topic
  docs: "#ffe3e3",       // Docs artifact
  human: "#f3d9fa",      // human-in-the-loop
  context: "#e6fcf5",    // LLM context source zone
  llmZone: "#e7f5ff",    // LLM 영역 zone
  legacyZone: "#f8f9fa", // 기존 ES+CQRS zone
  plain: "#ffffff",
};

function measureText(text, fontSize) {
  const lines = text.split("\n");
  let maxWidth = 0;
  for (const line of lines) {
    let lineWidth = 0;
    for (const character of line) {
      lineWidth += character.charCodeAt(0) > 0x2000 ? fontSize : fontSize * 0.55;
    }
    maxWidth = Math.max(maxWidth, lineWidth);
  }
  return { width: Math.ceil(maxWidth), height: Math.ceil(lines.length * fontSize * 1.25) };
}

function midpointOf(points) {
  const count = points.length;
  if (count % 2 === 1) return points[(count - 1) / 2];
  const a = points[count / 2 - 1];
  const b = points[count / 2];
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

class Figure {
  constructor(fileName, options = {}) {
    this.fileName = fileName;
    this.roughness = options.roughness ?? 1;
    this.elements = [];
    this.byId = {};
  }

  push(element) {
    this.elements.push(element);
    this.byId[element.id] = element;
    return element;
  }

  base(overrides) {
    return {
      angle: 0,
      strokeColor: "#1e1e1e",
      backgroundColor: "transparent",
      fillStyle: "solid",
      strokeWidth: 1,
      strokeStyle: "solid",
      roughness: this.roughness,
      opacity: 100,
      groupIds: [],
      frameId: null,
      roundness: null,
      seed: nextSeed(),
      version: 1,
      versionNonce: nextSeed(),
      isDeleted: false,
      boundElements: null,
      updated: 1,
      link: null,
      locked: false,
      ...overrides,
    };
  }

  shape(id, type, x, y, width, height, label, options = {}) {
    const fontSize = options.fontSize ?? 16;
    const container = this.push(
      this.base({
        id,
        type,
        x,
        y,
        width,
        height,
        backgroundColor: options.bg ?? COLOR.plain,
        strokeColor: options.stroke ?? "#1e1e1e",
        strokeStyle: options.dashed ? "dashed" : "solid",
        strokeWidth: options.strokeWidth ?? 1,
        roundness: type === "rectangle" ? { type: 3 } : null,
        boundElements: label ? [{ type: "text", id: id + "_t" }] : null,
      })
    );
    if (label) {
      const dimensions = measureText(label, fontSize);
      const textWidth = Math.min(dimensions.width, width - 16);
      this.push(
        this.base({
          id: id + "_t",
          type: "text",
          x: x + width / 2 - textWidth / 2,
          y: y + height / 2 - dimensions.height / 2,
          width: textWidth,
          height: dimensions.height,
          text: label,
          originalText: label,
          fontSize,
          fontFamily: FONT_FAMILY,
          textAlign: "center",
          verticalAlign: "middle",
          containerId: id,
          lineHeight: 1.25,
          baseline: dimensions.height - 4,
          strokeColor: options.textColor ?? "#1e1e1e",
          autoResize: true,
        })
      );
    }
    return container;
  }

  box(id, x, y, width, height, label, options = {}) {
    return this.shape(id, "rectangle", x, y, width, height, label, options);
  }

  diamond(id, x, y, width, height, label, options = {}) {
    return this.shape(id, "diamond", x, y, width, height, label, options);
  }

  ellipse(id, x, y, width, height, label, options = {}) {
    return this.shape(id, "ellipse", x, y, width, height, label, options);
  }

  zone(id, x, y, width, height, title, options = {}) {
    this.push(
      this.base({
        id,
        type: "rectangle",
        x,
        y,
        width,
        height,
        backgroundColor: options.bg ?? COLOR.legacyZone,
        strokeColor: options.stroke ?? "#868e96",
        strokeStyle: "dashed",
        roundness: { type: 3 },
      })
    );
    if (title) {
      this.text(id + "_title", x + 14, y + 10, title, {
        fontSize: options.fontSize ?? 16,
        color: options.stroke ?? "#495057",
      });
    }
  }

  text(id, x, y, content, options = {}) {
    const fontSize = options.fontSize ?? 14;
    const dimensions = measureText(content, fontSize);
    this.push(
      this.base({
        id,
        type: "text",
        x,
        y,
        width: dimensions.width,
        height: dimensions.height,
        text: content,
        originalText: content,
        fontSize,
        fontFamily: FONT_FAMILY,
        textAlign: options.align ?? "left",
        verticalAlign: "top",
        containerId: null,
        lineHeight: 1.25,
        baseline: dimensions.height - 4,
        strokeColor: options.color ?? "#1e1e1e",
        autoResize: true,
      })
    );
  }

  anchor(id, side, t = 0.5) {
    const element = this.byId[id];
    const { x, y, width, height } = element;
    switch (side) {
      case "top": return [x + width * t, y];
      case "bottom": return [x + width * t, y + height];
      case "left": return [x, y + height * t];
      case "right": return [x + width, y + height * t];
      default: throw new Error("bad side " + side);
    }
  }

  arrow(id, points, options = {}) {
    const [x0, y0] = points[0];
    const relativePoints = points.map(([px, py]) => [px - x0, py - y0]);
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    const arrowElement = this.push(
      this.base({
        id,
        type: "arrow",
        x: x0,
        y: y0,
        width: Math.max(...xs) - Math.min(...xs),
        height: Math.max(...ys) - Math.min(...ys),
        points: relativePoints,
        lastCommittedPoint: null,
        startBinding: options.start ? { elementId: options.start, focus: 0, gap: 4 } : null,
        endBinding: options.end ? { elementId: options.end, focus: 0, gap: 4 } : null,
        startArrowhead: options.startArrowhead ?? null,
        endArrowhead: options.endArrowhead ?? "arrow",
        strokeStyle: options.dashed ? "dashed" : "solid",
        strokeColor: options.color ?? "#1e1e1e",
        strokeWidth: options.strokeWidth ?? 1,
        roundness: { type: 2 },
        boundElements: null,
      })
    );
    for (const boundId of [options.start, options.end]) {
      if (boundId && this.byId[boundId]) {
        const bound = this.byId[boundId];
        bound.boundElements = (bound.boundElements ?? []).concat([{ id, type: "arrow" }]);
      }
    }
    if (options.label) {
      const fontSize = options.labelSize ?? 12.5;
      const dimensions = measureText(options.label, fontSize);
      const [mx, my] = midpointOf(points);
      arrowElement.boundElements = (arrowElement.boundElements ?? []).concat([
        { type: "text", id: id + "_t" },
      ]);
      this.push(
        this.base({
          id: id + "_t",
          type: "text",
          x: mx - dimensions.width / 2,
          y: my - dimensions.height / 2,
          width: dimensions.width,
          height: dimensions.height,
          text: options.label,
          originalText: options.label,
          fontSize,
          fontFamily: FONT_FAMILY,
          textAlign: "center",
          verticalAlign: "middle",
          containerId: id,
          lineHeight: 1.25,
          baseline: dimensions.height - 4,
          strokeColor: options.labelColor ?? "#495057",
          autoResize: true,
        })
      );
    }
    return arrowElement;
  }

  validate() {
    const ids = new Set();
    for (const element of this.elements) {
      if (ids.has(element.id)) throw new Error(`${this.fileName}: duplicate id ${element.id}`);
      ids.add(element.id);
    }
    for (const element of this.elements) {
      if (element.containerId && !this.byId[element.containerId])
        throw new Error(`${this.fileName}: missing container ${element.containerId}`);
      for (const binding of [element.startBinding, element.endBinding]) {
        if (binding && !this.byId[binding.elementId])
          throw new Error(`${this.fileName}: missing binding target ${binding.elementId}`);
      }
      if (element.boundElements) {
        for (const bound of element.boundElements) {
          if (!this.byId[bound.id])
            throw new Error(`${this.fileName}: missing bound element ${bound.id}`);
        }
      }
      if (element.type === "arrow" && element.points.length < 2)
        throw new Error(`${this.fileName}: arrow ${element.id} has <2 points`);
    }
  }

  save() {
    this.validate();
    const document = {
      type: "excalidraw",
      version: 2,
      source: "self-adaptive-cqrs figure generator",
      elements: this.elements,
      appState: { viewBackgroundColor: "#ffffff", gridSize: null },
      files: {},
    };
    writeFileSync(join(OUTPUT_DIRECTORY, this.fileName), JSON.stringify(document, null, 1));
    console.log(`wrote ${this.fileName} (${this.elements.length} elements)`);
  }
}

// ───────────────────────── 그림 1 — 전체 시스템 아키텍처 ─────────────────────────
function figure1() {
  const f = new Figure("fig1-전체-시스템-아키텍처.excalidraw", { roughness: 0 });
  const A = (id, side, t) => f.anchor(id, side, t);

  // zones
  f.zone("Z_WRITE", 40, 100, 300, 300, "Write 측 (Command)");
  f.zone("Z_READ", 40, 470, 300, 280, "Read 측 (Query)");
  f.zone("Z_OBS", 420, 100, 360, 650, "관측 백본 (Observability)");
  f.zone("Z_LLM", 840, 100, 420, 650, "LLM 영역 (본 연구)", { bg: COLOR.llmZone, stroke: "#1971c2" });
  f.zone("Z_CTX", 420, 800, 820, 150, "LLM 컨텍스트 소스", { bg: COLOR.context, stroke: "#0ca678" });

  // write side
  f.box("TOY", 70, 150, 240, 54, "Physical AI 이벤트\n(grip attempt, JSON)", { fontSize: 14 });
  f.box("INS", 70, 240, 240, 54, "InsertService\n+ Payload Drift 감지", { fontSize: 14 });
  f.box("ES", 70, 330, 240, 50, "Event Store", { bg: COLOR.storage, fontSize: 14 });

  // read side
  f.box("RUN", 70, 530, 240, 54, "CatchUpRunner\n+ 정합성 검사", { fontSize: 14 });
  f.box("RM1", 70, 614, 240, 44, "read_multimodal", { bg: COLOR.storage, fontSize: 14 });
  f.box("RM2", 70, 682, 240, 44, "read_grip_result", { bg: COLOR.storage, fontSize: 14 });

  // observability backbone
  f.box("PINO", 450, 150, 300, 54, "Pino Logger", { fontSize: 14 });
  f.box("LOGDB", 450, 270, 140, 64, "Log DB", { bg: COLOR.storage, fontSize: 14 });
  f.box("KAFKA1", 610, 270, 140, 64, "Kafka\nlog-events", { bg: COLOR.kafka, fontSize: 14 });
  f.box("KAFKA2", 560, 600, 190, 54, "Kafka\nsensor-values", { bg: COLOR.kafka, fontSize: 14 });

  // llm zone
  f.box("PRE", 880, 180, 320, 58, "Prejudge (소형 LLM)\n로그 1차 선별", { bg: COLOR.llmCall, fontSize: 14 });
  f.box("GRAPH", 880, 330, 320, 64, "분석 그래프 (LangGraph)\n+ 진단 에이전트", { bg: COLOR.llmCall, fontSize: 15 });
  f.box("TOOLS", 880, 460, 200, 54, "진단 도구 5종", { fontSize: 14 });
  f.box("SOBS", 990, 640, 260, 64, "Sensor Screener (소형 LLM)\n센서 1차 선별", { bg: COLOR.llmCall, fontSize: 13.5 });

  // context sources
  f.box("WIN", 450, 850, 230, 70, "이상 로그 윈도우", { bg: COLOR.storage, fontSize: 13.5 });
  f.box("CARDS", 710, 850, 230, 70, "Insight 카드 카탈로그", { bg: COLOR.storage, fontSize: 13.5 });
  f.box("SRC", 970, 850, 240, 70, "소스 코드 ·\n센서 베이스라인", { bg: COLOR.storage, fontSize: 13.5 });

  // output
  f.box("DOCS", 1340, 320, 290, 130, "단일 Docs (.md)\n① 권고 ② Read Model DDL\n③ API Versioning", { bg: COLOR.docs, stroke: "#e03131", fontSize: 15 });

  // flows — write/read
  f.arrow("toy->ins", [A("TOY", "bottom"), A("INS", "top")], { start: "TOY", end: "INS" });
  f.arrow("ins->es", [A("INS", "bottom"), A("ES", "top")], { start: "INS", end: "ES" });
  f.arrow("es->run", [A("ES", "bottom"), A("RUN", "top")], { start: "ES", end: "RUN" });
  f.arrow("run->rm1", [A("RUN", "bottom", 0.3), A("RM1", "top", 0.5)], { start: "RUN", end: "RM1" });
  f.arrow("run->rm2", [A("RUN", "bottom", 0.85), [350, 655], A("RM2", "right", 0.5)], { start: "RUN", end: "RM2" });

  // flows — observability
  f.arrow("pino->logdb", [A("PINO", "bottom", 0.25), A("LOGDB", "top", 0.5)], { start: "PINO", end: "LOGDB" });
  f.arrow("pino->kafka1", [A("PINO", "bottom", 0.8), A("KAFKA1", "top", 0.5)], { start: "PINO", end: "KAFKA1", label: "info 이상", labelSize: 11.5 });
  f.arrow("run->kafka2", [A("RUN", "right", 0.5), A("KAFKA2", "left", 0.5)], { start: "RUN", end: "KAFKA2", label: "센서 값 발행", labelSize: 11.5 });

  // flows — into llm zone
  f.arrow("kafka1->pre", [A("KAFKA1", "right", 0.5), A("PRE", "left", 0.5)], { start: "KAFKA1", end: "PRE" });
  f.arrow("kafka2->sobs", [A("KAFKA2", "right", 0.5), A("SOBS", "left", 0.5)], { start: "KAFKA2", end: "SOBS" });
  f.arrow("pre->graph", [A("PRE", "bottom", 0.5), A("GRAPH", "top", 0.5)], { start: "PRE", end: "GRAPH", label: "트립 시 승급" });
  f.arrow("sobs->graph", [A("SOBS", "top", 0.5), [1120, 394]], { start: "SOBS", end: "GRAPH", label: "트립 시 승급" });
  f.arrow("graph<->tools", [[976, 394], A("TOOLS", "top", 0.5)], { start: "GRAPH", end: "TOOLS", startArrowhead: "arrow", label: "tool-calling", labelSize: 11.5 });

  // context push / pull
  f.arrow("logdb->win", [A("LOGDB", "bottom", 0.5), A("WIN", "top", 0.5)], { start: "LOGDB", end: "WIN" });
  f.arrow("win->graph", [A("WIN", "right", 0.5), A("GRAPH", "left", 0.5)], { start: "WIN", end: "GRAPH", label: "push", labelSize: 11.5 });
  f.arrow("cards->graph", [A("CARDS", "top", 0.5), A("GRAPH", "left", 0.85)], { start: "CARDS", end: "GRAPH", label: "push", labelSize: 11.5 });
  f.arrow("tools->logdb", [A("TOOLS", "left", 0.5), A("LOGDB", "bottom", 0.8)], { start: "TOOLS", end: "LOGDB", dashed: true, label: "pull", labelSize: 11.5, color: "#1971c2", labelColor: "#1971c2" });
  f.arrow("tools->ctx", [A("TOOLS", "bottom", 0.5), [980, 800]], { start: "TOOLS", end: "Z_CTX", dashed: true, label: "pull", labelSize: 11.5, color: "#1971c2", labelColor: "#1971c2" });

  // output flows
  f.arrow("graph->docs", [A("GRAPH", "right", 0.5), A("DOCS", "left", 0.5)], { start: "GRAPH", end: "DOCS" });
  f.arrow("docs->read", [A("DOCS", "bottom", 0.5), [1485, 1000], [190, 1000], [190, 750]], { start: "DOCS", end: "Z_READ", dashed: true, label: "인간 승인 후 DDL 적용", color: "#e03131", labelColor: "#e03131" });
  f.arrow("docs->cards", [A("DOCS", "bottom", 0.2), [1300, 760], A("CARDS", "right", 0.5)], { start: "DOCS", end: "CARDS", dashed: true, label: "카드 등록 (카탈로그 폐쇄)", labelSize: 11.5, color: "#e03131", labelColor: "#e03131" });

  // legend
  f.box("LG1", 40, 1010, 26, 18, null, { bg: COLOR.llmCall });
  f.text("LG1_t", 74, 1011, "LLM 호출", { fontSize: 12 });
  f.box("LG2", 170, 1010, 26, 18, null, { bg: COLOR.storage });
  f.text("LG2_t", 204, 1011, "저장소", { fontSize: 12 });
  f.box("LG3", 280, 1010, 26, 18, null, { bg: COLOR.kafka });
  f.text("LG3_t", 314, 1011, "Kafka 토픽", { fontSize: 12 });
  f.box("LG4", 410, 1010, 26, 18, null, { bg: COLOR.docs });
  f.text("LG4_t", 444, 1011, "산출물 Docs", { fontSize: 12 });
  f.arrow("LG5", [[560, 1019], [615, 1019]], {});
  f.text("LG5_t2", 625, 1011, "자동 흐름", { fontSize: 12 });
  f.arrow("LG6", [[720, 1019], [775, 1019]], { dashed: true });
  f.text("LG6_t2", 785, 1011, "승인 게이트 · pull 조회", { fontSize: 12 });

  f.save();
}

// ─────────────────── 그림 2 — 이상 신호 5종 → 두 레인 → 판정 경로 ───────────────────
function figure2() {
  const f = new Figure("fig2-이상신호-레인-판정경로.excalidraw");
  const A = (id, side, t) => f.anchor(id, side, t);

  f.text("title", 40, 15, "이상 신호 5종 → 두 레인 → 판정 경로", { fontSize: 22 });

  f.zone("SZ", 20, 55, 1230, 120, "이상 신호 5종 (시스템이 스스로 방출)", { bg: "#fff4e6", stroke: "#e8590c" });
  const signals = [
    ["S1", 40, "S1 Payload Drift\n(warn 40)"],
    ["S2", 270, "S2 정합성 위반\n(error 50)"],
    ["S3", 500, "S3 카드 드리프트\n(warn 40)"],
    ["S4", 730, "S4 HTTP 4xx/5xx\n· 반복 요청"],
    ["S5", 1030, "S5 센서 값\n베이스라인 이탈"],
  ];
  for (const [id, x, label] of signals) f.box(id, x, 100, 200, 60, label, { fontSize: 13.5 });

  f.zone("L1", 120, 190, 580, 400, "로그 레인");
  f.box("K1", 260, 230, 300, 50, "Kafka: log-events", { bg: COLOR.kafka, fontSize: 14 });
  f.box("F1", 200, 330, 420, 64, "LogConsumer 필터\ninsert 경로 level<40 제외 · corr 없고 level<40 제외", { fontSize: 13 });
  f.diamond("P1", 230, 450, 360, 110, "Prejudge\n(소형 LLM · fail-open)", { bg: COLOR.llmCall, fontSize: 14 });

  f.zone("L2", 860, 190, 380, 400, "센서 레인");
  f.box("K2", 890, 230, 320, 50, "Kafka: sensor-values", { bg: COLOR.kafka, fontSize: 14 });
  f.box("F2", 890, 330, 320, 60, "SensorValueConsumer\n(배치 8건)", { fontSize: 13 });
  f.diamond("P2", 880, 450, 340, 110, "Sensor Screener\n(소형 LLM · 통계 주석)", { bg: COLOR.llmCall, fontSize: 13.5 });

  f.arrow("s1->k1", [A("S1", "bottom"), A("K1", "top", 0.15)], { start: "S1", end: "K1" });
  f.arrow("s2->k1", [A("S2", "bottom"), A("K1", "top", 0.38)], { start: "S2", end: "K1" });
  f.arrow("s3->k1", [A("S3", "bottom"), A("K1", "top", 0.62)], { start: "S3", end: "K1" });
  f.arrow("s4->k1", [A("S4", "bottom"), A("K1", "top", 0.85)], { start: "S4", end: "K1" });
  f.arrow("s5->k2", [A("S5", "bottom"), A("K2", "top", 0.5)], { start: "S5", end: "K2" });

  f.arrow("k1->f1", [A("K1", "bottom"), A("F1", "top")], { start: "K1", end: "F1" });
  f.arrow("f1->p1", [A("F1", "bottom"), A("P1", "top")], { start: "F1", end: "P1" });
  f.arrow("k2->f2", [A("K2", "bottom"), A("F2", "top")], { start: "K2", end: "F2" });
  f.arrow("f2->p2", [A("F2", "bottom"), A("P2", "top")], { start: "F2", end: "P2" });

  f.box("GRAPH", 400, 650, 440, 70, "분석 그래프 (LangGraph)\n+ 진단 에이전트", { bg: COLOR.llmCall, fontSize: 15 });
  f.arrow("p1->graph", [A("P1", "bottom"), A("GRAPH", "top", 0.25)], { start: "P1", end: "GRAPH", label: "triggered = true", labelSize: 12 });
  f.arrow("p2->graph", [A("P2", "bottom"), A("GRAPH", "top", 0.8)], { start: "P2", end: "GRAPH", label: "triggered = true", labelSize: 12 });

  f.box("X1", 60, 660, 150, 50, "폐기", { bg: COLOR.storage, fontSize: 14 });
  f.arrow("p1->x1", [A("P1", "left", 0.5), A("X1", "top", 0.5)], { start: "P1", end: "X1", label: "false", labelSize: 12 });
  f.box("X2", 1100, 660, 150, 50, "폐기", { bg: COLOR.storage, fontSize: 14 });
  f.arrow("p2->x2", [A("P2", "right", 0.5), A("X2", "top", 0.5)], { start: "P2", end: "X2", label: "false", labelSize: 12 });
  f.text("x2_note", 1000, 725,
    "관찰 실패 시 requeue,\n3연속 실패 시 결정론 폴백 판정으로 강등 (폐기 아님)\njudgeMode: hybrid(기본) · llm-only(룰북 주입 ablation)",
    { fontSize: 11, color: "#868e96" });

  f.box("D1", 320, 790, 290, 50, "분석 Docs\n(docId: analysis-⟨corrId⟩)", { bg: COLOR.docs, fontSize: 12.5 });
  f.box("D2", 650, 790, 260, 50, "데이터 품질 Docs\n(docId: dq-⟨sceneKey⟩)", { bg: COLOR.docs, fontSize: 12.5 });
  f.arrow("graph->d1", [A("GRAPH", "bottom", 0.3), A("D1", "top", 0.5)], { start: "GRAPH", end: "D1" });
  f.arrow("graph->d2", [A("GRAPH", "bottom", 0.7), A("D2", "top", 0.5)], { start: "GRAPH", end: "D2" });

  f.text("note", 40, 865,
    "두 스크리너는 \"들여다볼 가치가 있는가\"만 판정하는 2-pass 게이트 — 근본원인·조치 판단은 분석 그래프의 몫",
    { fontSize: 12.5, color: "#495057" });

  f.save();
}

// ─────────────────── 그림 3 — 분석 그래프 (LangGraph) 토폴로지 ───────────────────
function figure3() {
  const f = new Figure("fig3-분석-그래프-토폴로지.excalidraw");
  const A = (id, side, t) => f.anchor(id, side, t);

  f.text("title", 40, 15, "분석 그래프 (LangGraph StateGraph) 토폴로지", { fontSize: 22 });

  f.ellipse("START", 530, 70, 120, 50, "START", { bg: COLOR.storage, fontSize: 14 });
  f.box("RC", 410, 170, 360, 84, "analyzeRootCause — 진단 에이전트\n(tool-calling LLM)\nanomalyKind 판정 (open-set)", { bg: COLOR.llmCall, fontSize: 14 });
  f.box("DEC", 440, 310, 300, 64, "decide — 의사결정\n(프리게이트 + LLM)", { bg: COLOR.llmCall, fontSize: 14 });

  f.box("VS", 40, 450, 220, 76, "genVersionSwitch\nAPI 버전 전환안 (LLM)", { bg: COLOR.llmCall, fontSize: 13.5 });
  f.box("RD", 290, 450, 240, 76, "genRecommendationDocs\n권고 문서 (LLM)", { bg: COLOR.llmCall, fontSize: 13.5 });
  f.box("NRM", 560, 450, 230, 76, "genNewReadModel\n신규 Read Model DDL (LLM)", { bg: COLOR.llmCall, fontSize: 13 });
  f.box("DQ", 820, 450, 240, 76, "genDataQuality\n데이터 품질 권고 (LLM)\n(센서 레인 전용)", { bg: COLOR.llmCall, fontSize: 12.5 });
  f.box("PM", 560, 590, 230, 70, "genProjectionMapping\n투영 매핑 명세 (동반 스테이지)", { bg: COLOR.llmCall, fontSize: 12.5 });

  f.box("AGG", 440, 720, 300, 64, "aggregate — 결정론 조립\n(LLM 미호출)", { fontSize: 14 });
  f.ellipse("END", 530, 830, 120, 50, "END", { bg: COLOR.storage, fontSize: 14 });

  f.arrow("start->rc", [A("START", "bottom"), A("RC", "top")], { start: "START", end: "RC" });
  f.arrow("rc->dec", [A("RC", "bottom"), A("DEC", "top")], { start: "RC", end: "DEC" });

  f.arrow("dec->vs", [A("DEC", "left", 0.5), A("VS", "top", 0.5)], { start: "DEC", end: "VS", dashed: true, label: "selected 포함 시\n(병렬 fan-out)", labelSize: 11.5 });
  f.arrow("dec->rd", [A("DEC", "bottom", 0.25), A("RD", "top", 0.5)], { start: "DEC", end: "RD", dashed: true });
  f.arrow("dec->nrm", [A("DEC", "bottom", 0.75), A("NRM", "top", 0.5)], { start: "DEC", end: "NRM", dashed: true });
  f.arrow("dec->dq", [A("DEC", "right", 0.5), A("DQ", "top", 0.5)], { start: "DEC", end: "DQ", dashed: true });
  f.arrow("dec->agg", [A("DEC", "right", 0.25), [1120, 326], [1120, 752], A("AGG", "right", 0.5)], { start: "DEC", end: "AGG", dashed: true, label: "selected = []\n(조치 불필요)", labelSize: 11.5 });

  f.arrow("nrm->pm", [A("NRM", "bottom"), A("PM", "top")], { start: "NRM", end: "PM" });

  f.arrow("vs->agg", [A("VS", "bottom", 0.5), A("AGG", "top", 0.1)], { start: "VS", end: "AGG" });
  f.arrow("rd->agg", [A("RD", "bottom", 0.5), A("AGG", "top", 0.3)], { start: "RD", end: "AGG" });
  f.arrow("pm->agg", [A("PM", "bottom", 0.5), A("AGG", "top", 0.7)], { start: "PM", end: "AGG" });
  f.arrow("dq->agg", [A("DQ", "bottom", 0.5), [800, 690], A("AGG", "top", 0.95)], { start: "DQ", end: "AGG" });

  f.arrow("agg->end", [A("AGG", "bottom"), A("END", "top")], { start: "AGG", end: "END" });

  f.text("note_pm", 810, 600,
    "PM은 decide가 고르는 OutputKind가\n아니라 genNewReadModel의\n결정론 동반 스테이지 — 행동 enum을\n늘리지 않고 산출물만 보강",
    { fontSize: 12, color: "#495057" });
  f.text("note_guard", 40, 270,
    "결정론 가드:\n· card.miss 단독 트립이면 LLM 없이 selected=[]\n· DDL/버전을 골랐으면 권고 문서 강제 동반\n  (aggregate에서 재검사)",
    { fontSize: 12, color: "#495057" });

  f.save();
}

// ─────────────────── 그림 4 — 진단 에이전트 ReAct 루프 ───────────────────
function figure4() {
  const f = new Figure("fig4-진단-에이전트-루프.excalidraw");
  const A = (id, side, t) => f.anchor(id, side, t);

  f.text("title", 40, 15, "진단 에이전트 — 도구 사용 근본원인 분석 (ReAct 루프)", { fontSize: 22 });

  f.box("IN", 40, 200, 250, 90, "입력 (push 컨텍스트)\n로그 윈도우 또는 센서 소견\n(Insight 카드는 도구로 pull)", { bg: COLOR.context, stroke: "#0ca678", fontSize: 13 });
  f.box("LLM", 380, 190, 280, 70, "LLM (tools bound,\ntemperature 0)", { bg: COLOR.llmCall, fontSize: 14.5 });
  f.diamond("DIA", 360, 330, 320, 100, "tool_calls 존재?\n(도구 왕복 ≤ 4회)", { fontSize: 13.5 });
  f.box("TK", 770, 310, 360, 120,
    "DiagnosisToolkit — 도구 5종\nsearch_logs (스택 상단 6프레임 발췌)\nlist_insight_cards · get_insight_card\nget_sensor_baseline\nread_source_code (경로 경계 검증)",
    { fontSize: 12.5 });
  f.box("ZOD", 380, 520, 280, 70, "extractJson → zod 검증\n(re-ask ≤ 1회)", { fontSize: 14 });
  f.box("OUT", 380, 660, 280, 84, "RootCauseAnalysis\nanomalyKind (open-set)\n+ diagnosisTrajectory", { bg: "#d0ebff", stroke: "#1971c2", fontSize: 13.5 });

  f.arrow("in->llm", [A("IN", "right", 0.5), A("LLM", "left", 0.5)], { start: "IN", end: "LLM" });
  f.arrow("llm->dia", [A("LLM", "bottom"), A("DIA", "top")], { start: "LLM", end: "DIA" });
  f.arrow("dia->tk", [A("DIA", "right", 0.5), A("TK", "left", 0.5)], { start: "DIA", end: "TK", label: "예 — 도구 실행", labelSize: 12 });
  f.arrow("tk->llm", [A("TK", "top", 0.5), [950, 140], [520, 140], A("LLM", "top", 0.5)], { start: "TK", end: "LLM", label: "ToolMessage 누적 · 결과 4,000자 truncate", labelSize: 11.5 });
  f.arrow("dia->zod", [A("DIA", "bottom"), A("ZOD", "top")], { start: "DIA", end: "ZOD", label: "아니오 — 최종 응답", labelSize: 12 });
  f.arrow("zod->out", [A("ZOD", "bottom"), A("OUT", "top")], { start: "ZOD", end: "OUT", label: "성공", labelSize: 12 });
  f.arrow("zod->llm", [A("ZOD", "left", 0.5), [310, 555], [310, 249], A("LLM", "left", 0.85)], { start: "ZOD", end: "LLM", dashed: true, label: "실패 —\n자기 오류 재제시\n(re-ask)", labelSize: 11 });

  f.text("note_limits", 40, 520,
    "3중 상한 (무한 루프 ·\nContext Rot 차단):\n· 도구 왕복 ≤ 4회\n· 최종 응답 시도 ≤ 2회 (re-ask 1회)\n· 전체 LLM 호출 ≤ 8회 (안전핀)",
    { fontSize: 12.5, color: "#495057" });
  f.text("note_traj", 770, 470,
    "궤적(diagnosisTrajectory)은 서비스 로그에만 기록\n— Docs 미포함 · 사후 LLM-as-Judge 평가 입력",
    { fontSize: 12, color: "#495057" });
  f.text("note_flow", 770, 540,
    "전형적 진단 루프:\nsearch_logs (에러+스택 확보)\n→ read_source_code (실패 지점 열람)\n→ 카드·베이스라인 대조\n→ anomalyKind 판정",
    { fontSize: 12, color: "#495057" });

  f.save();
}

// ─────────────────── 그림 5 — 단일 Docs 산출물 레이아웃 (U자형) ───────────────────
function figure5() {
  const f = new Figure("fig5-docs-산출물-레이아웃.excalidraw");
  const A = (id, side, t) => f.anchor(id, side, t);

  f.text("title", 40, 15, "산출물 — 단일 Docs 레이아웃 (U자형 배치)", { fontSize: 22 });

  f.zone("DOC", 330, 70, 520, 810, "llm-docs/⟨날짜⟩-⟨시각⟩-⟨corrId | sceneKey⟩.md", { fontSize: 15 });

  f.box("FM", 360, 130, 460, 64, "YAML front-matter\ndocId · sufficientEvidence · evidenceSources · API 델타", { bg: COLOR.storage, fontSize: 12.5 });
  f.box("H1B", 360, 214, 460, 58, "H1 + 한 문장 결론 (TL;DR)\n+ anomalyKind · 심각도", { bg: COLOR.docs, stroke: "#e03131", fontSize: 13.5 });
  f.box("EV", 360, 292, 460, 64, "근거 블록 (상단 고정)\n⟨logging_context⟩ · ⟨insight_read_db⟩ (M-Schema)", { bg: COLOR.storage, fontSize: 12.5 });
  f.box("S1B", 360, 376, 460, 70, "① 권고 (Recommendation) — ADR 형식\nContext · Options(기각 대안) · Decision · Consequences", { bg: "#d0ebff", stroke: "#1971c2", fontSize: 12 });
  f.box("S2B", 360, 466, 460, 86, "② Read Model 생성 SQL\nCREATE TABLE + 인덱스 + 투영 매핑 명세\n+ Insight 카드 등록 INSERT (결정론 동봉)", { bg: "#d0ebff", stroke: "#1971c2", fontSize: 12 });
  f.box("S3B", 360, 572, 460, 64, "③ API Versioning — Keep a Changelog\nfrom→to · 마이그레이션 절차 · 롤백 조건", { bg: "#d0ebff", stroke: "#1971c2", fontSize: 12 });
  f.box("OPT", 360, 656, 460, 56, "Optional — projectorCode 등\n(코어 토큰 집계 제외 · 절삭 가능 구획)", { dashed: true, fontSize: 12 });
  f.box("GR", 360, 732, 460, 64, "Guardrails (constraints) — 맨 끝\nv1 무손상 · PK 유지 · DDL은 인간 승인 후 실행", { bg: COLOR.docs, stroke: "#e03131", fontSize: 12 });

  const stack = ["FM", "H1B", "EV", "S1B", "S2B", "S3B", "OPT", "GR"];
  for (let i = 0; i < stack.length - 1; i++) {
    f.arrow(`st${i}`, [A(stack[i], "bottom", 0.5), A(stack[i + 1], "top", 0.5)], { start: stack[i], end: stack[i + 1] });
  }

  f.text("a1", 40, 180, "결론은 최상단 ↘", { fontSize: 12.5, color: "#e03131" });
  f.arrow("a1->h1", [[250, 205], A("H1B", "left", 0.5)], { end: "H1B", dashed: true, color: "#e03131" });
  f.text("a2", 40, 290, "근거가 결론 뒤 · 본문 앞에\n구조적으로 고정\n= 사후 합리화 방지", { fontSize: 12, color: "#495057" });
  f.arrow("a2->ev", [[250, 315], A("EV", "left", 0.5)], { end: "EV", dashed: true, color: "#868e96" });
  f.text("a3", 40, 470, "투영 매핑 명세는 코어 예산에\n잔존 — projector 코드는\nOptional로 절삭 가능", { fontSize: 12, color: "#495057" });
  f.arrow("a3->s2", [[250, 500], A("S2B", "left", 0.5)], { end: "S2B", dashed: true, color: "#868e96" });
  f.text("a4", 40, 750, "제약은 최하단 ↗\n(U자형: Lost in the Middle 대응)", { fontSize: 12.5, color: "#e03131" });
  f.arrow("a4->gr", [[250, 764], A("GR", "left", 0.5)], { end: "GR", dashed: true, color: "#e03131" });

  f.text("b1", 880, 290, "모든 사실 주장에\n[corr:x] / [seq:n] 인용 강제", { fontSize: 12, color: "#495057" });
  f.arrow("b1->ev", [[880, 315], A("EV", "right", 0.5)], { end: "EV", dashed: true, color: "#868e96" });
  f.text("b2", 880, 380, "근거 없는 섹션은\nINSUFFICIENT_EVIDENCE 센티넬\n(3섹션 형태는 항상 유지)", { fontSize: 12, color: "#495057" });
  f.arrow("b2->s1", [[880, 410], A("S1B", "right", 0.5)], { end: "S1B", dashed: true, color: "#868e96" });
  f.text("b3", 880, 620, "토큰 예산: 목표 8K / 하드캡 20K\n— 이 Docs가 다시 소형 LLM의\n컨텍스트로 주입되는 전제", { fontSize: 12, color: "#495057" });

  f.save();
}

// ─────────────────── 그림 6 — 자기 적응 피드백 루프 3종 ───────────────────
function figure6() {
  const f = new Figure("fig6-피드백-루프.excalidraw");
  const A = (id, side, t) => f.anchor(id, side, t);

  f.text("title", 40, 15, "자기 적응 피드백 루프 3종", { fontSize: 22 });

  // Loop A
  f.zone("ZA", 40, 80, 580, 560, "루프 A — 카탈로그 폐쇄 (자기 적응의 핵심)", { bg: COLOR.llmZone, stroke: "#1971c2" });
  f.box("D", 200, 140, 280, 70, "Docs: 신규 Read Model DDL\n+ 카드 등록 INSERT", { bg: COLOR.docs, stroke: "#e03131", fontSize: 13 });
  f.diamond("H", 240, 260, 200, 80, "인간 승인", { bg: COLOR.human, fontSize: 14 });
  f.box("NEWRM", 70, 400, 220, 60, "신규 Read Model\n테이블", { bg: COLOR.storage, fontSize: 13 });
  f.box("CARD", 350, 400, 240, 60, "insight_entity /\ninsight_field 카드", { bg: COLOR.storage, fontSize: 13 });
  f.box("NEXT", 180, 520, 320, 84, "다음 분석 사이클의 컨텍스트에\n신규 모델 자동 노출\n(renderAllCards)", { fontSize: 12.5 });

  f.arrow("d->h", [A("D", "bottom"), A("H", "top")], { start: "D", end: "H" });
  f.arrow("h->newrm", [A("H", "left", 0.5), [180, 350], A("NEWRM", "top", 0.5)], { start: "H", end: "NEWRM" });
  f.arrow("h->card", [A("H", "right", 0.5), [470, 350], A("CARD", "top", 0.5)], { start: "H", end: "CARD" });
  f.arrow("card->next", [A("CARD", "bottom", 0.5), A("NEXT", "top", 0.7)], { start: "CARD", end: "NEXT" });
  f.arrow("next->d", [A("NEXT", "right", 0.5), [595, 400], [595, 175], A("D", "right", 0.5)], { start: "NEXT", end: "D", dashed: true, label: "다음 사이클", labelSize: 11.5 });

  // Loop B
  f.zone("ZB", 660, 80, 440, 560, "루프 B — 카드 드리프트 감시 (누락 자기 교정)");
  f.box("OBS2", 690, 160, 380, 70, "CardDriftObserver (60초 주기)\npublic 테이블 − 인프라 − 카드 diff", { fontSize: 13 });
  f.box("WARN", 690, 310, 380, 64, "warn: insight.card.drift\n(테이블별 1시간 억제 창)", { fontSize: 13.5 });
  f.box("DOCS2", 690, 460, 380, 56, "\"카드 등록 권고\" Docs", { bg: COLOR.docs, stroke: "#e03131", fontSize: 13.5 });

  f.arrow("obs2->warn", [A("OBS2", "bottom"), A("WARN", "top")], { start: "OBS2", end: "WARN" });
  f.arrow("warn->docs2", [A("WARN", "bottom"), A("DOCS2", "top")], { start: "WARN", end: "DOCS2", label: "로그 레인 경유", labelSize: 11.5 });
  f.arrow("docs2->obs2", [A("DOCS2", "right", 0.5), [1086, 330], A("OBS2", "right", 0.5)], { start: "DOCS2", end: "OBS2", dashed: true, label: "카드 등록되면\nwarn 중단", labelSize: 11 });

  f.arrow("newrm->zb", [A("NEWRM", "bottom", 0.5), [180, 670], [760, 670], [760, 640]], { start: "NEWRM", end: "ZB", dashed: true, label: "카드 등록 누락 시 루프 B가 감지", labelSize: 11.5 });

  // Loop C
  f.zone("ZC", 1140, 80, 440, 560, "루프 C — 자기 로그 발진 억제 (음의 피드백)");
  f.box("SVC3", 1170, 160, 380, 60, "LLM 파이프라인 자신의 로그", { fontSize: 13.5 });
  f.box("RULE", 1170, 310, 380, 70, "규약: 분석 결과는 info(30)로만 기록\nwarn(40) 이상 금지", { stroke: "#2f9e44", fontSize: 13 });
  f.box("BLOCK", 1170, 460, 380, 90, "차단하지 않으면:\n자기 로그 → Kafka → prejudge 재트립\n→ 무한 Docs 생성 (발진)", { dashed: true, stroke: "#e03131", textColor: "#e03131", fontSize: 12.5 });

  f.arrow("svc3->rule", [A("SVC3", "bottom"), A("RULE", "top")], { start: "SVC3", end: "RULE" });
  f.arrow("rule->block", [A("RULE", "bottom"), A("BLOCK", "top")], { start: "RULE", end: "BLOCK", dashed: true, color: "#e03131", label: "차단", labelSize: 11.5, labelColor: "#e03131" });

  f.save();
}

// ─────────────────── 그림 7 — 노드 공통 LLM 호출 규약 ───────────────────
function figure7() {
  const f = new Figure("fig7-llm-호출-규약.excalidraw");
  const A = (id, side, t) => f.anchor(id, side, t);

  f.text("title", 40, 15, "노드 공통 LLM 호출 규약 — 산문 CoT → 펜스드 JSON → zod → re-ask", { fontSize: 20 });

  f.box("N", 80, 80, 300, 56, "그래프 노드\ninvokeNode⟨T⟩(rolePrompt, facts, schema)", { fontSize: 12.5 });
  f.box("M", 80, 200, 300, 64, "LLM (temperature 0)\n산문 추론 + 펜스드 JSON 블록", { bg: COLOR.llmCall, fontSize: 13.5 });
  f.box("EX", 80, 330, 300, 56, "extractJson()\n펜스 블록 추출", { fontSize: 13.5 });
  f.diamond("ZD", 60, 450, 340, 100, "zod schema.parse", { fontSize: 14 });
  f.box("OK", 540, 470, 240, 60, "구조화 출력 T 반환", { bg: COLOR.kafka, stroke: "#2f9e44", fontSize: 14 });
  f.box("RA", 80, 630, 300, 84, "re-ask (1회 한정)\n직전 AI 응답 + 에러 내용 제시\n→ 수정 JSON 재검증", { bg: COLOR.llmCall, fontSize: 12.5 });

  f.arrow("n->m", [A("N", "bottom"), A("M", "top")], { start: "N", end: "M" });
  f.arrow("m->ex", [A("M", "bottom"), A("EX", "top")], { start: "M", end: "EX" });
  f.arrow("ex->zd", [A("EX", "bottom"), A("ZD", "top")], { start: "EX", end: "ZD" });
  f.arrow("zd->ok", [A("ZD", "right", 0.5), A("OK", "left", 0.5)], { start: "ZD", end: "OK", label: "성공", labelSize: 12 });
  f.arrow("zd->ra", [A("ZD", "bottom"), A("RA", "top")], { start: "ZD", end: "RA", label: "실패 (ZodError)", labelSize: 12 });
  f.arrow("ra->m", [A("RA", "left", 0.5), [30, 672], [30, 232], A("M", "left", 0.5)], { start: "RA", end: "M", dashed: true, label: "재호출", labelSize: 11 });

  f.text("note", 460, 600,
    "temperature 0에서 동일 프롬프트 재전송은\n같은 실패를 결정론적으로 재현 —\n블라인드 재시도 대신 자기 오류를 보게 하는 re-ask.\n\n구조화 출력 API 대신 산문 CoT를 쓰는 근거:\ngrammar-constrained decoding의 추론 품질 저해\n(arXiv:2408.02442). 재실패 시 예외 throw.",
    { fontSize: 12, color: "#495057" });

  f.save();
}

// ─────────────────── 그림 8 — Self-Adaptive Loop (발표용 가로 밴드) ───────────────────
function figure8() {
  const f = new Figure("fig8-self-adaptive-loop.excalidraw", { roughness: 0 });
  const A = (id, side, t) => f.anchor(id, side, t);

  f.text("title", 60, 22, "Self-Adaptive Loop — 두 컨텍스트 소스가 Docs를 만든다 (5초 폴링 주기)", { fontSize: 24 });
  f.zone("BAND", 20, 62, 1970, 830, null, { bg: "#ffffff", stroke: "#1971c2" });

  // ── 상단: 탐지 루프. 이상 신호는 '스트림'이지 Read DB 조회가 아니다 ──
  f.box("SIG1", 60, 110, 310, 58, "① 애플리케이션 로그 (Write · Read)\npino(info 이상) → TCP socket", { stroke: "#e8590c", fontSize: 11.5 });
  f.box("SIG2", 60, 186, 310, 58, "② 카드 드리프트 warn(40)\n무카드 Read Model 테이블", { stroke: "#e03131", fontSize: 11.5 });
  f.box("SIG3", 60, 262, 310, 58, "③ 센서 값 스트림 (배치 8건)", { stroke: "#2f9e44", fontSize: 11.5 });

  f.box("MQ", 420, 150, 160, 140, "Message Queue\n(Kafka)\n\nlog-events\nsensor-values", { bg: COLOR.kafka, fontSize: 12.5 });
  f.box("P1", 630, 140, 300, 160, "1차 선별 (소형 LLM)\n\n① 결정론 프리게이트 level ≥ 40\n② Prejudge · Sensor Screener\n    (fail-open)", { bg: COLOR.llmCall, fontSize: 12 });
  f.box("P2", 990, 140, 300, 160, "2차 분석\n\nLangGraph StateGraph\n+ Tool Calling 진단 에이전트", { bg: COLOR.llmCall, fontSize: 13 });

  // ── 단일 산출물 Docs: 섹션 이름은 validate-docs.ts 의 계약과 일치시킨다 ──
  f.box("DOCS", 1400, 110, 420, 290, null, { bg: COLOR.docs, stroke: "#e03131", strokeWidth: 2 });
  f.text("DOCS_t", 1440, 130, "Docs — 단일 산출물 (.md)", { fontSize: 16, color: "#c92a2a" });
  f.box("D1", 1430, 170, 360, 50, "1. 권고 (Recommendation)", { fontSize: 13.5 });
  f.box("D2", 1430, 234, 360, 50, "2. Read Model 생성 SQL (DDL)", { fontSize: 13.5 });
  f.box("D3", 1430, 298, 360, 50, "3. API Versioning", { fontSize: 13.5 });
  f.text("DOCS_n", 1430, 362, "세 섹션 항상 포함 · front-matter · Guardrails\n코어 토큰 예산 8K (하드캡 20K)", { fontSize: 11.5, color: "#868e96" });

  f.box("FB", 1420, 480, 380, 76, "Read Model 재생성 · Insight 카드 등록\n(인간 승인 게이트)", { bg: COLOR.human, fontSize: 12.5 });

  // ── 하단: 본 연구의 핵심 — 두 DB 를 '의미 있는 컨텍스트'로 가공하는 계층 ──
  f.zone("Z_CTX", 60, 400, 1250, 430, "LLM 컨텍스트 구축 — 본 연구의 핵심 기여 (두 소스에서 컨텍스트를 만든다)", { bg: COLOR.context, stroke: "#0ca678", fontSize: 17 });

  f.box("PA", 100, 455, 560, 250, null, { bg: "#ffffff", stroke: "#0ca678", strokeWidth: 2 });
  f.text("PA_h", 120, 472, "① Log DB (log_event) — 개발자 Logging", { fontSize: 14.5, color: "#0b7285" });
  f.text("PA_b", 120, 505,
    "커서 기반 증분 적재 (LogService)\n\n→ 이상 로그 윈도우 조립 (LogWindowRepository)\n    · 앵커: level ≥ 40 첫 에러 행\n    · 앵커 앞 20 / 뒤 20행 수집, 상한 80행\n    · 노이즈 프루닝 — 신호 앞 4 / 뒤 6줄만 유지\n       (LogSage arXiv:2506.03691)\n    · 최근 1시간 action × level 빈도 롤업",
    { fontSize: 12 });
  f.text("PA_f", 120, 660, "raw 로그 적재가 아니라 '무엇을 보여줄지' 고른 윈도우", { fontSize: 11, color: "#868e96" });

  f.box("PB", 700, 455, 560, 250, null, { bg: "#ffffff", stroke: "#0ca678", strokeWidth: 2 });
  f.text("PB_h", 720, 472, "② Insight Read DB (insight_entity · insight_field)", { fontSize: 14.5, color: "#0b7285" });
  f.text("PB_b", 720, 505,
    "도메인 어휘 카탈로그 — Read Model · Event 1개 = 카드 1장\n\n엔티티: kind · purpose · keyColumns · rowCount · refreshedAt\n필드: fieldName · dataType · meaning · example\n\n→ renderAllCards() 로 카드 세트를 마크다운 렌더\n→ LLM 이 '이 도메인에 무엇이 있는지' 아는 유일한 근거",
    { fontSize: 12 });
  f.text("PB_f", 720, 660, "카탈로그 자체가 드리프트 관찰 대상 — 무카드 테이블이 곧 신호 ②", { fontSize: 11, color: "#868e96" });

  f.box("TL", 100, 730, 1160, 80, null, { bg: "#ffffff", stroke: "#1971c2", dashed: true });
  f.text("TL_h", 120, 745, "진단 도구 5종 (pull · tool-calling)", { fontSize: 13, color: "#1971c2" });
  f.text("TL_b", 120, 772,
    "search_logs · list_insight_cards · get_insight_card · get_sensor_baseline · read_source_code\n→ 5종 중 3종이 위 두 DB 를 되짚는다 (push 로 받은 컨텍스트를 에이전트가 스스로 심화 조회)",
    { fontSize: 11.5 });

  // 신호 → MQ
  f.arrow("s1->mq", [A("SIG1", "right", 0.5), A("MQ", "left", 0.2)], { start: "SIG1", end: "MQ", color: "#e8590c" });
  f.arrow("s2->mq", [A("SIG2", "right", 0.5), A("MQ", "left", 0.5)], { start: "SIG2", end: "MQ", color: "#e03131" });
  f.arrow("s3->mq", [A("SIG3", "right", 0.5), A("MQ", "left", 0.8)], { start: "SIG3", end: "MQ", color: "#2f9e44" });

  // MQ → 1차 → 2차 → Docs
  f.arrow("mq->p1", [A("MQ", "right", 0.5), A("P1", "left", 0.5)], { start: "MQ", end: "P1" });
  f.arrow("p1->p2", [A("P1", "right", 0.5), A("P2", "left", 0.5)], { start: "P1", end: "P2" });
  f.text("p1->p2_t", 908, 306, "triggered = true", { fontSize: 11.5, color: "#495057" });
  f.arrow("p2->docs", [A("P2", "right", 0.5), A("DOCS", "left", 0.5)], { start: "P2", end: "DOCS" });

  // 두 소스 → 2차 분석: push 주입(MQ 경유 아님) / 도구 → 두 소스: pull 심화 조회
  f.arrow("pa->p2", [A("PA", "top", 0.9), A("P2", "bottom", 0.25)], { start: "PA", end: "P2", color: "#0ca678", strokeWidth: 2, label: "push", labelSize: 12, labelColor: "#0b7285" });
  f.arrow("pb->p2", [A("PB", "top", 0.5), A("P2", "bottom", 0.6)], { start: "PB", end: "P2", color: "#0ca678", strokeWidth: 2, label: "push", labelSize: 12, labelColor: "#0b7285" });
  f.arrow("p2->tl", [A("P2", "bottom", 0.95), [1345, 300], [1345, 770], A("TL", "right", 0.5)], { start: "P2", end: "TL", dashed: true, color: "#1971c2" });
  f.text("p2->tl_t", 1352, 520, "pull\n(tool-calling)", { fontSize: 11.5, color: "#1971c2" });
  f.arrow("tl->pa", [A("TL", "top", 0.2), A("PA", "bottom", 0.5)], { start: "TL", end: "PA", dashed: true, color: "#1971c2" });
  f.arrow("tl->pb", [A("TL", "top", 0.75), A("PB", "bottom", 0.5)], { start: "TL", end: "PB", dashed: true, color: "#1971c2" });

  // 폴링 리듬: 빈 배치면 5초 대기, 트립하면 즉시 재확인 (llm-context.service.ts)
  f.arrow("poll", [A("P1", "top", 0.5), [780, 100], [500, 100], A("MQ", "top", 0.5)], { start: "P1", end: "MQ", dashed: true, color: "#868e96" });
  f.text("poll_t", 560, 72, "빈 배치 → 5초 후 재폴링 · 트립 → 즉시 재확인", { fontSize: 11.5, color: "#868e96" });

  // 자가 적응 폐루프: Docs → 인간 승인 → Read Model 교체 → 카탈로그 갱신 → 신호 해소
  f.arrow("docs->fb", [A("DOCS", "bottom", 0.5), A("FB", "top", 0.5)], { start: "DOCS", end: "FB", dashed: true, color: "#e03131" });
  f.text("docs->fb_t", 1625, 424, "인간 승인 후 DDL 적용", { fontSize: 11.5, color: "#e03131" });
  f.arrow("fb->s2", [A("FB", "bottom", 0.3), [1534, 858], [36, 858], [36, 215], A("SIG2", "left", 0.5)], { start: "FB", end: "SIG2", dashed: true, color: "#e03131" });
  f.text("fb->s2_t", 700, 834, "신호 해소 — 새 Read Model 은 카드로 등록되어 카탈로그가 다시 닫힌다", { fontSize: 11.5, color: "#e03131" });

  // legend
  f.box("LG1", 60, 920, 26, 18, null, { bg: COLOR.llmCall });
  f.text("LG1_t", 94, 921, "LLM 호출", { fontSize: 12 });
  f.box("LG2", 200, 920, 26, 18, null, { bg: COLOR.kafka });
  f.text("LG2_t", 234, 921, "Kafka 토픽", { fontSize: 12 });
  f.box("LG3", 350, 920, 26, 18, null, { bg: COLOR.context });
  f.text("LG3_t", 384, 921, "컨텍스트 구축 계층", { fontSize: 12 });
  f.box("LG4", 560, 920, 26, 18, null, { bg: COLOR.docs });
  f.text("LG4_t", 594, 921, "산출물 Docs", { fontSize: 12 });
  f.box("LG5", 720, 920, 26, 18, null, { bg: COLOR.human });
  f.text("LG5_t", 754, 921, "인간 승인", { fontSize: 12 });
  f.arrow("LG6", [[880, 929], [935, 929]], { color: "#0ca678", strokeWidth: 2 });
  f.text("LG6_t2", 945, 921, "push 주입", { fontSize: 12 });
  f.arrow("LG7", [[1060, 929], [1115, 929]], { dashed: true, color: "#1971c2" });
  f.text("LG7_t2", 1125, 921, "pull 조회", { fontSize: 12 });
  f.arrow("LG8", [[1240, 929], [1295, 929]], { dashed: true, color: "#e03131" });
  f.text("LG8_t2", 1305, 921, "승인 게이트 · 폐루프", { fontSize: 12 });

  f.save();
}

figure1();
figure2();
figure3();
figure4();
figure5();
figure6();
figure7();
figure8();
console.log("done");

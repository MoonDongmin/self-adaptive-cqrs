export interface InsightCardField {
  fieldName: string;
  dataType: string;
  meaning: string;
  example: string | null;
}

export interface InsightCardData {
  kind: "event" | "read_model";
  name: string;
  purpose: string;
  keyColumns: string;
  rowCount: number | null;
  refreshedAt: Date | null;
  fields: InsightCardField[];
}

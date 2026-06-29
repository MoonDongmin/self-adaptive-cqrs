import { InsightCardData } from '@/insight/insight-card.type';

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

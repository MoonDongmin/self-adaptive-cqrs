import { Inject, Injectable } from "@nestjs/common";
import { asc, eq } from "drizzle-orm";
import { PinoLogger } from "nestjs-pino";
import {
  InsightCatalogRepository,
  InsightEntityInput,
  InsightFieldInput,
} from "@/insight/repository/insight-catalog.repository";
import { DRIZZLE, type Drizzle } from "@/shared/database/drizzle.provider";
import { insightEntity, insightField } from "@/shared/database/schema";
import { LogAction } from "@/shared/logger/logging-context";
import { InsightCardData } from "../insight-card.type";

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
      this.logger.error(
        { action: LogAction.DB_ERROR, err },
        "엔티티 upsert 실패",
      );
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
      this.logger.error(
        { action: LogAction.DB_ERROR, err },
        "필드 upsert 실패",
      );
      throw err;
    }
  }
}

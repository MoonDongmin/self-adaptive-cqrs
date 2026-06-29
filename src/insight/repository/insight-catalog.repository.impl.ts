import { Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { PinoLogger } from 'nestjs-pino';
import {
  InsightCatalogRepository,
  InsightEntityInput,
  InsightFieldInput,
} from '@/insight/repository/insight-catalog.repository';
import { DRIZZLE, type Drizzle } from '@/shared/database/drizzle.provider';
import { insightEntity, insightField } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';
import { InsightCardData } from '../insight-card.type';

@Injectable()
export class InsightCatalogRepositoryImpl implements InsightCatalogRepository {
  constructor(
    private readonly logger: PinoLogger,
    @Inject(DRIZZLE) private readonly db: Drizzle,
  ) {
    this.logger.setContext(InsightCatalogRepositoryImpl.name);
  }

  async listEntityNames(): Promise<string[]> {
    try {
      const rows = await this.db
        .select({ entityName: insightEntity.entityName })
        .from(insightEntity)
        .orderBy(asc(insightEntity.entityName));

      this.logger.debug(
        { [LogContext.ENTITY_COUNT]: rows.length },
        "엔티티 목록 조회",
      );

      return rows.map((row) => row.entityName);
    } catch (err) {
      this.logger.error(
        { action: LogAction.DB_ERROR, err },
        "엔티티 목록 조회 실패",
      );
      throw err;
    }
  }

  async findCardData(entityName: string): Promise<InsightCardData | null> {
    try {
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

      this.logger.debug(
        {
          [LogContext.ENTITY_NAME]: entityName,
          [LogContext.COUNT]: fieldRows.length,
        },
        "카드 데이터 조회",
      );

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
    } catch (err) {
      this.logger.error(
        {
          action: LogAction.DB_ERROR,
          err,
          [LogContext.ENTITY_NAME]: entityName,
        },
        "카드 데이터 조회 실패",
      );
      throw err;
    }
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

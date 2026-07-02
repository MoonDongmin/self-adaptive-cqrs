import { CardDriftObserver } from '@/insight/observer/card-drift.observer';
import type { ReadModelTableRepository } from '@/insight/observer/read-model-table.repository';
import type { InsightCatalogRepository } from '@/insight/repository/insight-catalog.repository';
import { LogAction } from '@/shared/logger/logging-context';

interface WarnCall {
  payload: Record<string, unknown>;
  message: string;
}

function makeObserver(tables: string[], cardNames: string[]) {
  const warnCalls: WarnCall[] = [];
  const logger = {
    setContext: (): void => {},
    warn: (payload: Record<string, unknown>, message: string): void => {
      warnCalls.push({ payload, message });
    },
    error: (): void => {},
  };
  const tableRepository = {
    listPublicTableNames: async (): Promise<string[]> => tables,
  };
  const catalog = {
    listEntityNames: async (): Promise<string[]> => cardNames,
  };

  // 생성자 시그니처에 맞춰 부분 목을 주입한다(런타임에서 쓰는 메서드만 구현).
  const observer = new CardDriftObserver(
    logger as unknown as ConstructorParameters<typeof CardDriftObserver>[0],
    tableRepository as unknown as ReadModelTableRepository,
    catalog as unknown as InsightCatalogRepository,
  );

  return { observer, warnCalls };
}

describe('CardDriftObserver', () => {
  it('카드 없는 Read Model 테이블을 warn 한다', async () => {
    const { observer, warnCalls } = makeObserver(
      ["event_store", "read_grip_result", "read_orphan"],
      ["read_grip_result"],
    );

    await observer.observeOnce();

    expect(warnCalls).toHaveLength(1);
    expect(warnCalls[0].payload.action).toBe(LogAction.INSIGHT_CARD_DRIFT);
    expect(warnCalls[0].payload.missingCardTables).toEqual(["read_orphan"]);
  });

  it('인프라 테이블과 카드 있는 테이블은 침묵한다', async () => {
    const { observer, warnCalls } = makeObserver(
      ["event_store", "log_event", "insight_field", "read_grip_result"],
      ["read_grip_result"],
    );

    await observer.observeOnce();

    expect(warnCalls).toHaveLength(0);
  });

  it('억제 창 안에서는 같은 테이블을 재발행하지 않는다', async () => {
    const { observer, warnCalls } = makeObserver(["read_orphan"], []);

    await observer.observeOnce();
    await observer.observeOnce();

    expect(warnCalls).toHaveLength(1);
  });

  it('카드가 등록되면 억제 기록을 청소해 재드리프트 시 다시 warn 한다', async () => {
    const warnCalls: WarnCall[] = [];
    const logger = {
      setContext: (): void => {},
      warn: (payload: Record<string, unknown>, message: string): void => {
        warnCalls.push({ payload, message });
      },
      error: (): void => {},
    };
    let cardNames: string[] = [];
    let tableNames: string[] = ["read_orphan"];
    const observer = new CardDriftObserver(
      logger as unknown as ConstructorParameters<typeof CardDriftObserver>[0],
      {
        listPublicTableNames: async (): Promise<string[]> => tableNames,
      } as unknown as ReadModelTableRepository,
      {
        listEntityNames: async (): Promise<string[]> => cardNames,
      } as unknown as InsightCatalogRepository,
    );

    await observer.observeOnce(); // 1회차: warn
    cardNames = ["read_orphan"]; // 사람이 카드 등록 → 억제 기록 청소됨
    await observer.observeOnce(); // 침묵(카드 있음)
    cardNames = []; // 카드가 다시 사라짐(재드리프트)
    await observer.observeOnce(); // 억제 창과 무관하게 다시 warn

    expect(warnCalls).toHaveLength(2);
  });
});

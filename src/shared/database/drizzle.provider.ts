import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export const DRIZZLE: unique symbol = Symbol("DRIZZLE");

export type Drizzle = ReturnType<typeof drizzle<typeof schema>>;

// db.transaction(async (tx) => ...) 콜백의 tx 타입.
// Drizzle(=DB 인스턴스)과는 다른 PgTransaction<...> 타입이라 별도 alias 로 둔다.
export type DrizzleTx = Parameters<Parameters<Drizzle["transaction"]>[0]>[0];

export const drizzleProvider = {
  provide: DRIZZLE,
  useFactory: (): NodePgDatabase<any> => {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    return drizzle(pool, { schema, logger: false });
  },
};

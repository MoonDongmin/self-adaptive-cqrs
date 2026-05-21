import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { Pool } from "pg";

export const DRIZZLE: unique symbol = Symbol("DRIZZLE");

export type Drizzle = ReturnType<typeof drizzle<typeof schema>>;

export const drizzleProvider = {
  provide: DRIZZLE,
  useFactory: (): NodePgDatabase<any> => {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    return drizzle(pool, { schema, logger: false });
  },
};

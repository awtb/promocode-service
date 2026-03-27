import { resolve } from "node:path";

import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

import { env } from "promocode-service/config/env.js";
import * as schema from "promocode-service/db/schema.js";

export type Database = NodePgDatabase<typeof schema>;
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

export const database = drizzle(pool, { schema });

export const applyMigrations = async (): Promise<void> => {
  await migrate(database, {
    migrationsFolder: resolve(process.cwd(), "drizzle"),
  });
};

export const closeDbConnection = async (): Promise<void> => {
  await pool.end();
};

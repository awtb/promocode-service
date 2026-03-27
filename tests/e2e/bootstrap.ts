import { GenericContainer, Wait, type StartedTestContainer } from "testcontainers";
import type { FastifyInstance } from "fastify";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

interface E2EContext {
  app: FastifyInstance;
  baseUrl: string;
  resetDatabase: () => Promise<void>;
  shutdown: () => Promise<void>;
}

const POSTGRES_PORT = 5432;
const POSTGRES_USER = "postgres";
const POSTGRES_PASSWORD = "postgres";
const POSTGRES_DB = "promocode_service";
const E2E_DATABASE_URL_ENV = "E2E_DATABASE_URL";
const POSTGRES_IMAGE = "public.ecr.aws/docker/library/postgres:16-alpine";
const migrationsFolder = new URL("../../drizzle", import.meta.url);

const startPostgresContainer = async (): Promise<StartedTestContainer> => {
  return new GenericContainer(POSTGRES_IMAGE)
    .withEnvironment({
      POSTGRES_DB,
      POSTGRES_USER,
      POSTGRES_PASSWORD,
    })
    .withExposedPorts(POSTGRES_PORT)
    .withWaitStrategy(
      Wait.forLogMessage("database system is ready to accept connections", 2),
    )
    .start();
};

const getDatabaseUrl = (container: StartedTestContainer) => {
  const host = container.getHost();
  const port = container.getMappedPort(POSTGRES_PORT);

  return `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${host}:${port}/${POSTGRES_DB}`;
};

const migrateDatabase = async (databaseUrl: string) => {
  const pool = new Pool({
    connectionString: databaseUrl,
  });

  try {
    const database = drizzle(pool);

    await migrate(database, {
      migrationsFolder: migrationsFolder.pathname,
    });
  } finally {
    await pool.end();
  }
};

export const startE2EApp = async (): Promise<E2EContext> => {
  const externalDatabaseUrl = process.env[E2E_DATABASE_URL_ENV];
  const container = externalDatabaseUrl ? null : await startPostgresContainer();
  const databaseUrl =
    externalDatabaseUrl ?? getDatabaseUrl(container as StartedTestContainer);

  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = databaseUrl;

  await migrateDatabase(databaseUrl);

  const [{ createApp }, { database }] = await Promise.all([
    import("promocode-service/app.js"),
    import("promocode-service/db/index.js"),
  ]);

  const app = createApp();

  await app.ready();
  await app.listen({
    host: "127.0.0.1",
    port: 0,
  });

  return {
    app,
    baseUrl: app.listeningOrigin,
    resetDatabase: async () => {
      await database.execute(
        sql`TRUNCATE TABLE "activations", "promocodes" RESTART IDENTITY CASCADE`,
      );
    },
    shutdown: async () => {
      await app.close();
      if (container) {
        await container.stop();
      }
    },
  };
};

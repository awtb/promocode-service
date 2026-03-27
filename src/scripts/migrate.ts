import { applyMigrations, closeDbConnection } from "promocode-service/db/index.js";

const run = async () => {
  try {
    await applyMigrations();
  } finally {
    await closeDbConnection();
  }
};

void run();

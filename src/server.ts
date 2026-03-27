import { createApp } from "promocode-service/app.js";
import { env } from "promocode-service/config/env.js";

const start = async () => {
  const app = createApp();

  try {
    await app.listen({
      host: env.HOST,
      port: env.PORT,
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

void start();

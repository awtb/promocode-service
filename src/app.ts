import Fastify from "fastify";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

import { env } from "promocode-service/config/env.js";
import { closeDbConnection } from "promocode-service/db/index.js";
import { internalRoutes } from "promocode-service/modules/internal/routes.js";
import { promocodesRoutes } from "promocode-service/modules/promocodes/routes.js";

const developmentLogger = {
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      ignore: "pid,hostname",
      translateTime: "SYS:standard",
    },
  },
} as const;

const openApiTags = [
  {
    name: "Internal",
    description: "Internal service endpoints.",
  },
  {
    name: "Promocodes",
    description: "Promocode management and activation endpoints.",
  },
];

const getLoggerConfig = () => {
  switch (env.NODE_ENV) {
    case "test":
      return false;
    case "development":
      return developmentLogger;
    default:
      return true;
  }
};

export const createApp = () => {
  const app = Fastify({
    logger: getLoggerConfig(),
  });

  if (env.NODE_ENV !== "production") {
    app.register(swagger, {
      openapi: {
        info: {
          title: "Promocode Service API",
          description: "API documentation for the promocode service.",
          version: "1.0.0",
        },
        tags: openApiTags,
      },
    });

    app.register(swaggerUi, {
      routePrefix: "/docs",
    });
  }

  app.register(internalRoutes, {
    prefix: "/internal",
  });

  app.register(promocodesRoutes, {
    prefix: "/promocodes",
  });

  app.addHook("onClose", async () => {
    await closeDbConnection();
  });

  return app;
};

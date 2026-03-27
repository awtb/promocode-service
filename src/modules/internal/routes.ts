import type { FastifyPluginAsync } from "fastify";

const tags = ["Internal"];
const healthResponseSchema = {
  type: "object",
  required: ["status"],
  properties: {
    status: {
      type: "string",
      const: "ok",
    },
  },
  additionalProperties: false,
} as const;

export const internalRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/health",
    {
      schema: {
        tags,
        summary: "Health check",
        description: "Returns the current service health status.",
        response: {
          200: healthResponseSchema,
        },
      },
    },
    async () => {
      return { status: "ok" };
    },
  );
};

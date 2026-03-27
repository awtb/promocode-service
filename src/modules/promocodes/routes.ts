import type { FastifyPluginAsync } from "fastify";

import {
  DEFAULT_LIST_PROMOCODES_LIMIT,
  DEFAULT_LIST_PROMOCODES_OFFSET,
} from "promocode-service/modules/promocodes/contracts.js";
import type {
  CreateActivationInput,
  CreatePromocodeInput,
  ListPromocodesContract,
} from "promocode-service/modules/promocodes/contracts.js";
import {
  alreadyActivatedResponseSchema,
  alreadyExistsResponseSchema,
  activatePromocodeSuccessResponseSchema,
  activationLimitReachedResponseSchema,
  createActivationBodySchema,
  createPromocodeBodySchema,
  expiredPromocodeResponseSchema,
  listPromocodesQuerystringSchema,
  messageResponseSchema,
  promocodeListResponseSchema,
  promocodeResponseSchema,
  promocodeCodeRouteParamsSchema,
  promocodeIdRouteParamsSchema,
} from "promocode-service/modules/promocodes/schemas.js";
import {
  activatePromocode,
  createPromocodeService,
  getPromocodeById,
  listPromocodesService,
} from "promocode-service/modules/promocodes/service.js";
import type { ActivatePromocodeFailureResult } from "promocode-service/modules/promocodes/types.js";

const tags = ["Promocodes"];

const PROMOCODE_NOT_FOUND_MESSAGE = "Promocode not found";
const PROMOCODE_ALREADY_ACTIVATED_MESSAGE =
  "Promocode already activated for this email";
const PROMOCODE_ALREADY_EXISTS_MESSAGE =
  "Promocode with this code already exists";

const toListPromocodesInput = (
  query: ListPromocodesContract["Querystring"],
) => ({
  limit: query.limit ?? DEFAULT_LIST_PROMOCODES_LIMIT,
  offset: query.offset ?? DEFAULT_LIST_PROMOCODES_OFFSET,
});

const toActivationFailureResponse = (
  result: ActivatePromocodeFailureResult,
) => {
  switch (result.kind) {
    case "not_found":
      return {
        statusCode: 404,
        body: { message: PROMOCODE_NOT_FOUND_MESSAGE },
      };
    case "expired":
      return {
        statusCode: 409,
        body: {
          message: "Promocode is expired",
          expiresAt: result.expiresAt,
        },
      };
    case "limit_reached":
      return {
        statusCode: 409,
        body: {
          message: "Promocode activation limit reached",
          activationsLimit: result.activationsLimit,
        },
      };
    case "already_activated":
      return {
        statusCode: 409,
        body: { message: PROMOCODE_ALREADY_ACTIVATED_MESSAGE },
      };
  }
};

export const promocodesRoutes: FastifyPluginAsync = async (app) => {
  app.get<ListPromocodesContract>(
    "/",
    {
      schema: {
        tags,
        summary: "List promocodes",
        description: "Returns promocodes ordered by creation time, newest first.",
        querystring: listPromocodesQuerystringSchema,
        response: {
          200: promocodeListResponseSchema,
        },
      },
    },
    async (request) => {
      return listPromocodesService(toListPromocodesInput(request.query));
    },
  );

  app.get<{ Params: { id: string } }>(
    "/:id",
    {
      schema: {
        tags,
        summary: "Get promocode by id",
        description: "Returns a single promocode by its UUID.",
        params: promocodeIdRouteParamsSchema,
        response: {
          200: promocodeResponseSchema,
          404: messageResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const promocode = await getPromocodeById(request.params.id);

      if (!promocode) {
        return reply.code(404).send({ message: PROMOCODE_NOT_FOUND_MESSAGE });
      }

      return promocode;
    },
  );

  app.post<{ Body: CreatePromocodeInput }>(
    "/",
    {
      schema: {
        tags,
        summary: "Create promocode",
        description: "Creates a new promocode.",
        body: createPromocodeBodySchema,
        response: {
          201: promocodeResponseSchema,
          409: alreadyExistsResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await createPromocodeService(request.body);

      if (result.kind === "already_exists") {
        return reply
          .code(409)
          .send({ message: PROMOCODE_ALREADY_EXISTS_MESSAGE });
      }

      return reply.code(201).send(result.promocode);
    },
  );

  app.post<{ Params: { code: string }; Body: CreateActivationInput }>(
    "/:code/activate",
    {
      schema: {
        tags,
        summary: "Activate promocode",
        description: "Activates a promocode for an email address.",
        params: promocodeCodeRouteParamsSchema,
        body: createActivationBodySchema,
        response: {
          201: activatePromocodeSuccessResponseSchema,
          404: messageResponseSchema,
          409: {
            oneOf: [
              expiredPromocodeResponseSchema,
              activationLimitReachedResponseSchema,
              alreadyActivatedResponseSchema,
            ],
          },
        },
      },
    },
    async (request, reply) => {
      const result = await activatePromocode(request.params.code, request.body);

      if (result.kind === "success") {
        return reply.code(201).send(result);
      }

      const failureResponse = toActivationFailureResponse(result);

      return reply.code(failureResponse.statusCode).send(failureResponse.body);
    },
  );
};

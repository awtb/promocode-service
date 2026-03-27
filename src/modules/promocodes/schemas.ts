import {
  DEFAULT_LIST_PROMOCODES_LIMIT,
  DEFAULT_LIST_PROMOCODES_OFFSET,
  MAX_LIST_PROMOCODES_LIMIT,
} from "promocode-service/modules/promocodes/contracts.js";

export const promocodeIdRouteParamsSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "string", format: "uuid" },
  },
  additionalProperties: false,
} as const;

export const promocodeCodeRouteParamsSchema = {
  type: "object",
  required: ["code"],
  properties: {
    code: { type: "string", minLength: 1, maxLength: 64 },
  },
  additionalProperties: false,
} as const;

export const listPromocodesQuerystringSchema = {
  type: "object",
  properties: {
    limit: {
      type: "integer",
      minimum: 1,
      maximum: MAX_LIST_PROMOCODES_LIMIT,
      default: DEFAULT_LIST_PROMOCODES_LIMIT,
    },
    offset: {
      type: "integer",
      minimum: 0,
      default: DEFAULT_LIST_PROMOCODES_OFFSET,
    },
  },
  additionalProperties: false,
} as const;

export const createPromocodeBodySchema = {
  type: "object",
  required: ["code", "discountPercent", "activationsLimit", "expiresAt"],
  properties: {
    code: { type: "string", minLength: 3, maxLength: 64 },
    discountPercent: { type: "integer", minimum: 1, maximum: 100 },
    activationsLimit: { type: "integer", minimum: 1 },
    expiresAt: { type: "string", format: "date" },
  },
  additionalProperties: false,
} as const;

export const createActivationBodySchema = {
  type: "object",
  required: ["email"],
  properties: {
    email: { type: "string", format: "email", maxLength: 320 },
  },
  additionalProperties: false,
} as const;

export const messageResponseSchema = {
  type: "object",
  required: ["message"],
  properties: {
    message: { type: "string" },
  },
  additionalProperties: false,
} as const;

export const promocodeResponseSchema = {
  type: "object",
  required: [
    "id",
    "code",
    "discountPercent",
    "activationsCount",
    "activationsLimit",
    "expiresAt",
    "createdAt",
  ],
  properties: {
    id: { type: "string", format: "uuid" },
    code: { type: "string", minLength: 3, maxLength: 64 },
    discountPercent: { type: "integer", minimum: 1, maximum: 100 },
    activationsCount: { type: "integer", minimum: 0 },
    activationsLimit: { type: "integer", minimum: 1 },
    expiresAt: { type: "string", format: "date" },
    createdAt: { type: "string", format: "date-time" },
  },
  additionalProperties: false,
} as const;

export const promocodeListResponseSchema = {
  type: "array",
  items: promocodeResponseSchema,
} as const;

export const activationResponseSchema = {
  type: "object",
  required: ["id", "promocodeId", "email", "createdAt"],
  properties: {
    id: { type: "string", format: "uuid" },
    promocodeId: { type: "string", format: "uuid" },
    email: { type: "string", format: "email", maxLength: 320 },
    createdAt: { type: "string", format: "date-time" },
  },
  additionalProperties: false,
} as const;

export const activatePromocodeSuccessResponseSchema = {
  type: "object",
  required: [
    "kind",
    "activation",
    "activationsCount",
    "activationsLimit",
  ],
  properties: {
    kind: {
      type: "string",
      const: "success",
    },
    activation: activationResponseSchema,
    activationsCount: { type: "integer", minimum: 0 },
    activationsLimit: { type: "integer", minimum: 1 },
  },
  additionalProperties: false,
} as const;

export const expiredPromocodeResponseSchema = {
  type: "object",
  required: ["message", "expiresAt"],
  properties: {
    message: { type: "string" },
    expiresAt: { type: "string", format: "date" },
  },
  additionalProperties: false,
} as const;

export const activationLimitReachedResponseSchema = {
  type: "object",
  required: ["message", "activationsLimit"],
  properties: {
    message: { type: "string" },
    activationsLimit: { type: "integer", minimum: 1 },
  },
  additionalProperties: false,
} as const;

export const alreadyActivatedResponseSchema = {
  type: "object",
  required: ["message"],
  properties: {
    message: {
      type: "string",
      const: "Promocode already activated for this email",
    },
  },
  additionalProperties: false,
} as const;

export const alreadyExistsResponseSchema = {
  type: "object",
  required: ["message"],
  properties: {
    message: {
      type: "string",
      const: "Promocode with this code already exists",
    },
  },
  additionalProperties: false,
} as const;

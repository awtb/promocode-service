import { DrizzleQueryError } from "drizzle-orm";
import { DatabaseError } from "pg";

import {
  ACTIVATIONS_PROMOCODE_ID_EMAIL_CONSTRAINT,
  PROMOCODES_CODE_UNIQUE_CONSTRAINT,
} from "promocode-service/db/schema.js";

export type PgConstraintError = DatabaseError & {
  constraint?: string;
};

export const getPgError = (error: unknown) => {
  if (error instanceof DatabaseError) {
    return error as PgConstraintError;
  }

  if (
    error instanceof DrizzleQueryError &&
    error.cause instanceof DatabaseError
  ) {
    return error.cause as PgConstraintError;
  }

  return null;
};

export const isConstraintViolation = (
  error: unknown,
  constraint: string,
): boolean => {
  const pgError = getPgError(error);

  return pgError?.code === "23505" && pgError.constraint === constraint;
};

export const isPromocodeCodeConflict = (error: unknown) =>
  isConstraintViolation(error, PROMOCODES_CODE_UNIQUE_CONSTRAINT);

export const isActivationEmailConflict = (error: unknown) =>
  isConstraintViolation(error, ACTIVATIONS_PROMOCODE_ID_EMAIL_CONSTRAINT);

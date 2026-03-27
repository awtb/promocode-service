import { desc, eq, sql } from "drizzle-orm";

import type { Database, Transaction } from "promocode-service/db/index.js";
import {
  isActivationEmailConflict,
  isPromocodeCodeConflict,
} from "promocode-service/db/errors.js";
import { activations, promocodes } from "promocode-service/db/schema.js";
import type {
  CreateActivationInput,
  CreatePromocodeInput,
  ListPromocodesInput,
} from "promocode-service/modules/promocodes/contracts.js";
import type {
  CreateActivationResult,
  CreatePromocodeResult,
} from "promocode-service/modules/promocodes/types.js";

export const listPromocodes = async (
  db: Database,
  input: ListPromocodesInput,
) => {
  return db
    .select()
    .from(promocodes)
    .orderBy(desc(promocodes.createdAt))
    .limit(input.limit)
    .offset(input.offset);
};

export async function findPromocodeById(
  db: Database,
  id: string,
) {
  const [promocode] = await db
    .select()
    .from(promocodes)
    .where(eq(promocodes.id, id))
    .limit(1);

  return promocode ?? null;
}

export const findPromocodeByCodeForUpdate = async (
  tx: Transaction,
  code: string,
) => {
  const [promocode] = await tx
    .select()
    .from(promocodes)
    .where(eq(promocodes.code, code))
    .limit(1)
    .for("update");

  return promocode ?? null;
};

export const createPromocode = async (
  db: Database,
  input: CreatePromocodeInput,
): Promise<CreatePromocodeResult> => {
  try {
    const [promocode] = await db
      .insert(promocodes)
      .values({
        code: input.code,
        discountPercent: input.discountPercent,
        activationsCount: 0,
        activationsLimit: input.activationsLimit,
        expiresAt: input.expiresAt,
      })
      .returning();

    return {
      kind: "created",
      promocode,
    };
  } catch (error) {
    if (isPromocodeCodeConflict(error)) {
      return { kind: "already_exists" };
    }

    throw error;
  }
};

export const createActivation = async (
  tx: Transaction,
  input: CreateActivationInput & { promocodeId: string },
): Promise<CreateActivationResult> => {
  try {
    const [activation] = await tx
      .insert(activations)
      .values({
        promocodeId: input.promocodeId,
        email: input.email,
      })
      .returning();

    return {
      kind: "created",
      activation,
    };
  } catch (error) {
    if (isActivationEmailConflict(error)) {
      return { kind: "already_activated" };
    }

    throw error;
  }
};

export const incrementPromocodeActivationsCount = async (
  tx: Transaction,
  promocodeId: string,
) => {
  const [promocode] = await tx
    .update(promocodes)
    .set({
      activationsCount: sql`${promocodes.activationsCount} + 1`,
    })
    .where(eq(promocodes.id, promocodeId))
    .returning();

  return promocode;
};

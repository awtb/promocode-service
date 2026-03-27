import type {
  CreateActivationInput,
  CreatePromocodeInput,
  ListPromocodesInput,
} from "promocode-service/modules/promocodes/contracts.js";
import type {
  ActivatePromocodeResult,
  CreatePromocodeResult,
} from "promocode-service/modules/promocodes/types.js";
import { database } from "promocode-service/db/index.js";
import {
  createActivation,
  createPromocode,
  findPromocodeById,
  findPromocodeByCodeForUpdate,
  incrementPromocodeActivationsCount,
  listPromocodes,
} from "promocode-service/modules/promocodes/repository.js";

const getCurrentIsoDate = () => new Date().toISOString().slice(0, 10);
const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const listPromocodesService = async (input: ListPromocodesInput) => {
  return listPromocodes(database, input);
};

export const getPromocodeById = async (id: string) => {
  return findPromocodeById(database, id);
};

export const createPromocodeService = async (
  input: CreatePromocodeInput,
): Promise<CreatePromocodeResult> => {
  return createPromocode(database, input);
};

export const activatePromocode = async (
  code: string,
  input: CreateActivationInput,
): Promise<ActivatePromocodeResult> => {
  return database.transaction(async (tx) => {
    const promocode = await findPromocodeByCodeForUpdate(tx, code);
    const currentDate = getCurrentIsoDate();

    if (!promocode) {
      return { kind: "not_found" };
    }

    if (promocode.expiresAt < currentDate) {
      return {
        kind: "expired",
        expiresAt: promocode.expiresAt,
      };
    }

    if (promocode.activationsCount >= promocode.activationsLimit) {
      return {
        kind: "limit_reached",
        activationsLimit: promocode.activationsLimit,
      };
    }

    const createActivationResult = await createActivation(tx, {
      promocodeId: promocode.id,
      email: normalizeEmail(input.email),
    });

    if (createActivationResult.kind === "already_activated") {
      return createActivationResult;
    }

    const updatedPromocode = await incrementPromocodeActivationsCount(
      tx,
      promocode.id,
    );

    return {
      kind: "success",
      activation: createActivationResult.activation,
      activationsCount: updatedPromocode.activationsCount,
      activationsLimit: updatedPromocode.activationsLimit,
    };
  });
};

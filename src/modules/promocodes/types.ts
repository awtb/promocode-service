import type { Activation, Promocode } from "promocode-service/db/schema.js";

export type CreatePromocodeResult =
  | {
      kind: "created";
      promocode: Promocode;
    }
  | {
      kind: "already_exists";
    };

export type CreateActivationResult =
  | {
      kind: "created";
      activation: Activation;
    }
  | {
      kind: "already_activated";
    };

export type ActivatePromocodeResult =
  | { kind: "not_found" }
  | { kind: "expired"; expiresAt: string }
  | { kind: "limit_reached"; activationsLimit: number }
  | { kind: "already_activated" }
  | {
      kind: "success";
      activation: Activation;
      activationsCount: number;
      activationsLimit: number;
    };

export type ActivatePromocodeFailureResult = Exclude<
  ActivatePromocodeResult,
  { kind: "success" }
>;

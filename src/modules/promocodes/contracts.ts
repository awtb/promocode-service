export const DEFAULT_LIST_PROMOCODES_LIMIT = 50;
export const MAX_LIST_PROMOCODES_LIMIT = 100;
export const DEFAULT_LIST_PROMOCODES_OFFSET = 0;

export interface CreatePromocodeInput {
  code: string;
  discountPercent: number;
  activationsLimit: number;
  expiresAt: string;
}

export interface CreateActivationInput {
  email: string;
}

export interface ListPromocodesQuery {
  limit?: number;
  offset?: number;
}

export interface ListPromocodesInput {
  limit: number;
  offset: number;
}

export interface ListPromocodesContract {
  Querystring: ListPromocodesQuery;
}

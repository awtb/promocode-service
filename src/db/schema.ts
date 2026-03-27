import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const PROMOCODES_CODE_UNIQUE_CONSTRAINT = "promocodes_code_unique";
export const ACTIVATIONS_PROMOCODE_ID_EMAIL_CONSTRAINT =
  "activations_promocode_id_email_key";
export const PROMOCODES_ACTIVATIONS_COUNT_LTE_LIMIT_CONSTRAINT =
  "promocodes_activations_count_lte_limit";

export const promocodes = pgTable(
  "promocodes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 64 }).notNull().unique(),
    discountPercent: integer("discount_percent").notNull(),
    activationsCount: integer("activations_count").notNull().default(0),
    activationsLimit: integer("activations_limit").notNull().default(1),
    expiresAt: date("expires_at").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      PROMOCODES_ACTIVATIONS_COUNT_LTE_LIMIT_CONSTRAINT,
      sql`${table.activationsCount} <= ${table.activationsLimit}`,
    ),
  ],
);

export const activations = pgTable(
  "activations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    promocodeId: uuid("promocode_id")
      .notNull()
      .references(() => promocodes.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 320 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("activations_promocode_id_idx").on(table.promocodeId),
    uniqueIndex(ACTIVATIONS_PROMOCODE_ID_EMAIL_CONSTRAINT).on(
      table.promocodeId,
      table.email,
    ),
  ],
);

export type Promocode = typeof promocodes.$inferSelect;
export type Activation = typeof activations.$inferSelect;

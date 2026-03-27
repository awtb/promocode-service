CREATE EXTENSION IF NOT EXISTS "pgcrypto";
--> statement-breakpoint
CREATE TABLE "activations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"promocode_id" uuid NOT NULL,
	"email" varchar(320) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promocodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(64) NOT NULL,
	"discount_percent" integer NOT NULL,
	"activations_count" integer DEFAULT 0 NOT NULL,
	"activations_limit" integer DEFAULT 1 NOT NULL,
	"expires_at" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promocodes_code_unique" UNIQUE("code"),
	CONSTRAINT "promocodes_activations_count_lte_limit" CHECK ("promocodes"."activations_count" <= "promocodes"."activations_limit")
);
--> statement-breakpoint
ALTER TABLE "activations" ADD CONSTRAINT "activations_promocode_id_promocodes_id_fk" FOREIGN KEY ("promocode_id") REFERENCES "public"."promocodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activations_promocode_id_idx" ON "activations" USING btree ("promocode_id");--> statement-breakpoint
CREATE UNIQUE INDEX "activations_promocode_id_email_key" ON "activations" USING btree ("promocode_id","email");

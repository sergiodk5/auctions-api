CREATE TABLE "refresh_families" (
	"family_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"absolute_expiry" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"jti" uuid PRIMARY KEY NOT NULL,
	"family_id" uuid NOT NULL,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	"revoked_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "refresh_families" ADD CONSTRAINT "refresh_families_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_family_id_refresh_families_family_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."refresh_families"("family_id") ON DELETE no action ON UPDATE no action;
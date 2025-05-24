CREATE TABLE "email_verification" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "email_verification_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"token" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"verified_at" timestamp,
	CONSTRAINT "email_verification_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "email_verification" ADD CONSTRAINT "email_verification_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
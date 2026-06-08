CREATE TYPE "public"."artifact_kind_enum" AS ENUM('text');--> statement-breakpoint
CREATE TYPE "public"."artifact_version_source_enum" AS ENUM('assistant', 'user', 'restore');--> statement-breakpoint
CREATE TABLE "artifact" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"chat_id" text NOT NULL,
	"kind" "artifact_kind_enum" DEFAULT 'text' NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "artifact_version" (
	"id" text PRIMARY KEY NOT NULL,
	"artifact_id" text NOT NULL,
	"version_number" integer NOT NULL,
	"content" text NOT NULL,
	"source" "artifact_version_source_enum" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"message_id" text,
	"restored_from_version_id" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "artifact" ADD CONSTRAINT "artifact_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "artifact" ADD CONSTRAINT "artifact_chat_id_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chat"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "artifact_version" ADD CONSTRAINT "artifact_version_artifact_id_artifact_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifact"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "artifact_version" ADD CONSTRAINT "artifact_version_message_id_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."message"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "artifact_chat_updated_at_idx" ON "artifact" USING btree ("chat_id","updated_at");--> statement-breakpoint
CREATE INDEX "artifact_user_chat_updated_at_idx" ON "artifact" USING btree ("user_id","chat_id","updated_at");--> statement-breakpoint
CREATE INDEX "artifact_version_artifact_created_at_idx" ON "artifact_version" USING btree ("artifact_id","created_at");--> statement-breakpoint
CREATE INDEX "artifact_version_artifact_version_number_idx" ON "artifact_version" USING btree ("artifact_id","version_number");--> statement-breakpoint
CREATE UNIQUE INDEX "artifact_version_artifact_version_number_unique_idx" ON "artifact_version" USING btree ("artifact_id","version_number");
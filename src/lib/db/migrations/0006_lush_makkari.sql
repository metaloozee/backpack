CREATE TYPE "public"."knowledge_status_enum" AS ENUM('pending', 'processing', 'ready', 'failed');--> statement-breakpoint
CREATE TABLE "vote" (
	"chat_id" text NOT NULL,
	"message_id" text NOT NULL,
	"is_upvoted" boolean NOT NULL,
	CONSTRAINT "vote_chat_id_message_id_pk" PRIMARY KEY("chat_id","message_id")
);
--> statement-breakpoint
ALTER TABLE "knowledge" ADD COLUMN "source_url" text;--> statement-breakpoint
ALTER TABLE "knowledge" ADD COLUMN "status" "knowledge_status_enum" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "knowledge" ADD COLUMN "error_message" text;--> statement-breakpoint
ALTER TABLE "knowledge" ADD COLUMN "processing_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "knowledge" ADD COLUMN "last_processing_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "knowledge" ADD COLUMN "processed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "vote" ADD CONSTRAINT "vote_chat_id_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chat"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "vote" ADD CONSTRAINT "vote_message_id_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE cascade;
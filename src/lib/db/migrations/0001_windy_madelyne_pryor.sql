ALTER TABLE "chat" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "chat" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "chat" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "chat" ALTER COLUMN "space_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "knowledge" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "knowledge" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "knowledge" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "knowledge" ALTER COLUMN "space_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "knowledge_embeddings" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "knowledge_embeddings" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "knowledge_embeddings" ALTER COLUMN "knowledge_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "message" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "message" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "message" ALTER COLUMN "chat_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "spaces" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "spaces" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "spaces" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "stream" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "stream" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "stream" ALTER COLUMN "chat_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "id" DROP DEFAULT;
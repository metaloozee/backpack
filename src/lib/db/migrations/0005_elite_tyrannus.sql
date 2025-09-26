DROP INDEX "chat_user_id_idx";--> statement-breakpoint
DROP INDEX "chat_space_id_idx";--> statement-breakpoint
DROP INDEX "chat_created_at_idx";--> statement-breakpoint
DROP INDEX "knowledge_user_id_idx";--> statement-breakpoint
DROP INDEX "knowledge_space_id_idx";--> statement-breakpoint
DROP INDEX "knowledge_uploaded_at_idx";--> statement-breakpoint
DROP INDEX "knowledge_embeddings_knowledge_id_idx";--> statement-breakpoint
DROP INDEX "knowledge_embeddings_created_at_idx";--> statement-breakpoint
DROP INDEX "memories_user_id_idx";--> statement-breakpoint
DROP INDEX "memories_created_at_idx";--> statement-breakpoint
DROP INDEX "message_chat_id_idx";--> statement-breakpoint
DROP INDEX "message_created_at_idx";--> statement-breakpoint
DROP INDEX "spaces_user_id_idx";--> statement-breakpoint
DROP INDEX "spaces_created_at_idx";--> statement-breakpoint
DROP INDEX "stream_chat_id_idx";--> statement-breakpoint
DROP INDEX "stream_created_at_idx";--> statement-breakpoint
CREATE INDEX "knowledge_user_uploaded_at_idx" ON "knowledge" USING btree ("user_id","uploaded_at");--> statement-breakpoint
CREATE INDEX "knowledge_embeddings_knowledge_created_at_idx" ON "knowledge_embeddings" USING btree ("knowledge_id","created_at");--> statement-breakpoint
CREATE INDEX "memories_user_created_at_idx" ON "memories" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "spaces_user_created_at_idx" ON "spaces" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "stream_chat_created_at_idx" ON "stream" USING btree ("chat_id","created_at");
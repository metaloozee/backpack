CREATE INDEX "memories_user_id_idx" ON "memories" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "memories" DROP COLUMN "last_accessed_at";
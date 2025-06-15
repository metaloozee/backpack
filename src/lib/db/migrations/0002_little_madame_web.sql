ALTER TABLE "spaces" RENAME COLUMN "space_name" TO "space_description";--> statement-breakpoint
ALTER TABLE "spaces" ALTER COLUMN "space_title" SET NOT NULL;
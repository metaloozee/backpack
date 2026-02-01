CREATE TABLE "mcp_server_config" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"api_key_encrypted" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"tools_cache" jsonb,
	"last_connected_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mcp_server_config" ADD CONSTRAINT "mcp_server_config_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "mcp_config_user_created_idx" ON "mcp_server_config" USING btree ("user_id","created_at");
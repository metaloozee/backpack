import type { InferSelectModel } from "drizzle-orm";
import {
	boolean,
	index,
	jsonb,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { user } from "@/lib/db/schema/auth";

export const mcpServerConfig = pgTable(
	"mcp_server_config",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		name: text("name").notNull(),
		url: text("url").notNull(),
		apiKeyEncrypted: text("api_key_encrypted"),
		enabled: boolean("enabled").default(true).notNull(),
		toolsCache: jsonb("tools_cache"),
		lastConnectedAt: timestamp("last_connected_at", {
			withTimezone: true,
			mode: "date",
		}),
		lastError: text("last_error"),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "date",
		})
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", {
			withTimezone: true,
			mode: "date",
		})
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		userCreatedAtIdx: index("mcp_config_user_created_idx").on(
			table.userId,
			table.createdAt
		),
	})
);

export type McpServerConfig = InferSelectModel<typeof mcpServerConfig>;

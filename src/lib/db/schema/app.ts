import type { InferSelectModel } from "drizzle-orm";
import { index, json, pgEnum, pgTable, text, timestamp, varchar, vector } from "drizzle-orm/pg-core";
import { user } from "@/lib/db/schema/auth";

export const memories = pgTable(
	"memories",
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
		content: text("content").notNull(),
		embedding: vector("embedding", { dimensions: 768 }),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "date",
		})
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => ({
		embeddingIndex: index("memories_embedding_index").using("hnsw", table.embedding.op("vector_cosine_ops")),
		userCreatedAtIdx: index("memories_user_created_at_idx").on(table.userId, table.createdAt),
	})
);
export type Memory = InferSelectModel<typeof memories>;

export const spaces = pgTable(
	"spaces",
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
		spaceTitle: text("space_title").notNull(),
		spaceDescription: text("space_description"),
		spaceCustomInstructions: text("custom_instructions"),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "date",
		}).notNull(),
	},
	(table) => ({
		userCreatedAtIdx: index("spaces_user_created_at_idx").on(table.userId, table.createdAt),
	})
);

export const KnowledgeTypeEnum = pgEnum("knowledge_type_enum", ["webpage", "pdf"]);
export const knowledge = pgTable(
	"knowledge",
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
		spaceId: text("space_id")
			.notNull()
			.references(() => spaces.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		knowledgeType: KnowledgeTypeEnum("knowledge_type").notNull(),
		knowledgeName: text("knowledge_name").notNull(),
		knowledgeSummary: text("knowledge_summary"),
		uploadedAt: timestamp("uploaded_at", {
			withTimezone: true,
			mode: "date",
		}).notNull(),
	},
	(table) => ({
		userSpaceIdx: index("knowledge_user_space_idx").on(table.userId, table.spaceId),
		userUploadedAtIdx: index("knowledge_user_uploaded_at_idx").on(table.userId, table.uploadedAt),
	})
);
export type Knowledge = InferSelectModel<typeof knowledge>;

export const knowledgeEmbeddings = pgTable(
	"knowledge_embeddings",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		knowledgeId: text("knowledge_id")
			.notNull()
			.references(() => knowledge.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		content: text("content").notNull(),
		embedding: vector("embedding", { dimensions: 768 }),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "date",
		}).notNull(),
	},
	(table) => ({
		embeddingIndex: index("embedding_index").using("hnsw", table.embedding.op("vector_cosine_ops")),
		knowledgeCreatedAtIdx: index("knowledge_embeddings_knowledge_created_at_idx").on(
			table.knowledgeId,
			table.createdAt
		),
	})
);

export const chat = pgTable(
	"chat",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		title: text("title").notNull(),
		createdAt: timestamp("created_at").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		spaceId: text("space_id").references(() => spaces.id, {
			onDelete: "cascade",
			onUpdate: "cascade",
		}),
	},
	(table) => ({
		userSpaceIdx: index("chat_user_space_idx").on(table.userId, table.spaceId),
		userCreatedAtIdx: index("chat_user_created_at_idx").on(table.userId, table.createdAt),
	})
);
export type Chat = InferSelectModel<typeof chat>;

export const message = pgTable(
	"message",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		chatId: text("chat_id")
			.notNull()
			.references(() => chat.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		role: varchar("role").notNull(),
		parts: json("parts").notNull(),
		attachments: json("attachments").notNull(),
		createdAt: timestamp("created_at").notNull(),
	},
	(table) => ({
		chatCreatedAtIdx: index("message_chat_created_at_idx").on(table.chatId, table.createdAt),
		roleIdx: index("message_role_idx").on(table.role),
	})
);
export type Message = InferSelectModel<typeof message>;

export const stream = pgTable(
	"stream",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		chatId: text("chat_id")
			.notNull()
			.references(() => chat.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "date",
		}).notNull(),
	},
	(table) => ({
		chatCreatedAtIdx: index("stream_chat_created_at_idx").on(table.chatId, table.createdAt),
	})
);
export type Stream = InferSelectModel<typeof stream>;

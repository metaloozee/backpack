import { randomUUID } from "node:crypto";
import type { InferSelectModel } from "drizzle-orm";
import { index, json, pgEnum, pgTable, text, timestamp, varchar, vector } from "drizzle-orm/pg-core";
import { user } from "@/lib/db/schema/auth";

export const memories = pgTable(
	"memories",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => randomUUID()),
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
		userIdIdx: index("memories_user_id_idx").on(table.userId),
		createdAtIdx: index("memories_created_at_idx").on(table.createdAt),
	})
);
export type Memory = InferSelectModel<typeof memories>;

export const spaces = pgTable(
	"spaces",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => randomUUID()),
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
		userIdIdx: index("spaces_user_id_idx").on(table.userId),
		createdAtIdx: index("spaces_created_at_idx").on(table.createdAt),
	})
);

export const KnowledgeTypeEnum = pgEnum("knowledge_type_enum", ["webpage", "pdf"]);
export const knowledge = pgTable(
	"knowledge",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => randomUUID()),
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
		userIdIdx: index("knowledge_user_id_idx").on(table.userId),
		spaceIdIdx: index("knowledge_space_id_idx").on(table.spaceId),
		userSpaceIdx: index("knowledge_user_space_idx").on(table.userId, table.spaceId),
		uploadedAtIdx: index("knowledge_uploaded_at_idx").on(table.uploadedAt),
	})
);
export type Knowledge = InferSelectModel<typeof knowledge>;

export const knowledgeEmbeddings = pgTable(
	"knowledge_embeddings",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => randomUUID()),
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
		knowledgeIdIdx: index("knowledge_embeddings_knowledge_id_idx").on(table.knowledgeId),
		createdAtIdx: index("knowledge_embeddings_created_at_idx").on(table.createdAt),
	})
);

export const chat = pgTable(
	"chat",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => randomUUID()),
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
		userIdIdx: index("chat_user_id_idx").on(table.userId),
		spaceIdIdx: index("chat_space_id_idx").on(table.spaceId),
		userSpaceIdx: index("chat_user_space_idx").on(table.userId, table.spaceId),
		createdAtIdx: index("chat_created_at_idx").on(table.createdAt),
		userCreatedAtIdx: index("chat_user_created_at_idx").on(table.userId, table.createdAt),
	})
);
export type Chat = InferSelectModel<typeof chat>;

export const message = pgTable(
	"message",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => randomUUID()),
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
		chatIdIdx: index("message_chat_id_idx").on(table.chatId),
		createdAtIdx: index("message_created_at_idx").on(table.createdAt),
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
			.$defaultFn(() => randomUUID()),
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
		chatIdIdx: index("stream_chat_id_idx").on(table.chatId),
		createdAtIdx: index("stream_created_at_idx").on(table.createdAt),
	})
);
export type Stream = InferSelectModel<typeof stream>;

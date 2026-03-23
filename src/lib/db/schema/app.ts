import { type InferSelectModel, sql } from "drizzle-orm";
import {
	boolean,
	check,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
	varchar,
	vector,
} from "drizzle-orm/pg-core";
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
			.defaultNow(),
	},
	(table) => ({
		embeddingIndex: index("memories_embedding_index").using(
			"hnsw",
			table.embedding.op("vector_cosine_ops")
		),
		userCreatedAtIdx: index("memories_user_created_at_idx").on(
			table.userId,
			table.createdAt
		),
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
		})
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		userCreatedAtIdx: index("spaces_user_created_at_idx").on(
			table.userId,
			table.createdAt
		),
	})
);

export const KnowledgeTypeEnum = pgEnum("knowledge_type_enum", [
	"webpage",
	"pdf",
]);
export const KnowledgeStatusEnum = pgEnum("knowledge_status_enum", [
	"pending",
	"processing",
	"ready",
	"failed",
]);
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
		sourceUrl: text("source_url"),
		status: KnowledgeStatusEnum("status").notNull().default("pending"),
		errorMessage: text("error_message"),
		processingAttempts: integer("processing_attempts").notNull().default(0),
		lastProcessingAt: timestamp("last_processing_at", {
			withTimezone: true,
			mode: "date",
		}),
		processedAt: timestamp("processed_at", {
			withTimezone: true,
			mode: "date",
		}),
		uploadedAt: timestamp("uploaded_at", {
			withTimezone: true,
			mode: "date",
		})
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		processingAttemptsCheck: check(
			"knowledge_processing_attempts_check",
			sql`${table.processingAttempts} >= 0`
		),
		userSpaceIdx: index("knowledge_user_space_idx").on(
			table.userId,
			table.spaceId
		),
		userSpaceUploadedAtIdx: index(
			"knowledge_user_space_uploaded_at_idx"
		).on(table.userId, table.spaceId, table.uploadedAt),
		userUploadedAtIdx: index("knowledge_user_uploaded_at_idx").on(
			table.userId,
			table.uploadedAt
		),
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
		})
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		embeddingIndex: index("embedding_index").using(
			"hnsw",
			table.embedding.op("vector_cosine_ops")
		),
		knowledgeCreatedAtIdx: index(
			"knowledge_embeddings_knowledge_created_at_idx"
		).on(table.knowledgeId, table.createdAt),
	})
);

export const chat = pgTable(
	"chat",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		title: text("title").notNull(),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "date",
		})
			.notNull()
			.defaultNow(),
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
		activeStreamId: text("active_stream_id"),
	},
	(table) => ({
		userSpaceIdx: index("chat_user_space_idx").on(
			table.userId,
			table.spaceId
		),
		userCreatedAtIdx: index("chat_user_created_at_idx").on(
			table.userId,
			table.createdAt
		),
		titleTrgmIdx: index("chat_title_trgm_idx").using(
			"gin",
			table.title.op("gin_trgm_ops")
		),
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
		parts: jsonb("parts").notNull(),
		attachments: jsonb("attachments").notNull(),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "date",
		})
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		roleCheck: check(
			"message_role_check",
			sql`${table.role} in ('user', 'data', 'assistant', 'system')`
		),
		chatCreatedAtIdx: index("message_chat_created_at_idx").on(
			table.chatId,
			table.createdAt
		),
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
		})
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		chatCreatedAtIdx: index("stream_chat_created_at_idx").on(
			table.chatId,
			table.createdAt
		),
	})
);
export type Stream = InferSelectModel<typeof stream>;

export const vote = pgTable(
	"vote",
	{
		chatId: text("chat_id")
			.notNull()
			.references(() => chat.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		messageId: text("message_id")
			.notNull()
			.references(() => message.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		isUpvoted: boolean("is_upvoted").notNull(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.chatId, table.messageId] }),
		messageIdIdx: index("vote_message_id_idx").on(table.messageId),
	})
);
export type Vote = InferSelectModel<typeof vote>;

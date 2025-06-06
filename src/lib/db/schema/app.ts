import {
    index,
    pgTable,
    text,
    vector,
    timestamp,
    pgEnum,
    json,
    uuid,
    varchar,
} from 'drizzle-orm/pg-core';
import { InferSelectModel } from 'drizzle-orm';
import { users } from '@/lib/db/schema/auth';

export const spaces = pgTable('spaces', {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, {
            onDelete: 'cascade',
            onUpdate: 'cascade',
        }),
    spaceTitle: text('space_name').notNull(),
    spaceDescription: text('space_title'),
    spaceCustomInstructions: text('custom_instructions'),
    createdAt: timestamp('created_at', {
        withTimezone: true,
        mode: 'date',
    }).notNull(),
});

export const KnowledgeTypeEnum = pgEnum('knowledge_type_enum', ['webpage', 'pdf']);
export const knowledge = pgTable('knowledge', {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, {
            onDelete: 'cascade',
            onUpdate: 'cascade',
        }),
    spaceId: uuid('space_id')
        .notNull()
        .references(() => spaces.id, {
            onDelete: 'cascade',
            onUpdate: 'cascade',
        }),
    knowledgeType: KnowledgeTypeEnum('knowledge_type').notNull(),
    knowledgeName: text('knowledge_name').notNull(),
    knowledgeSummary: text('knowlegde_summary'),
    uploadedAt: timestamp('uploaded_at', {
        withTimezone: true,
        mode: 'date',
    }).notNull(),
});
export type Knowledge = InferSelectModel<typeof knowledge>;

export const knowledgeEmbeddings = pgTable(
    'knowledge_embeddings',
    {
        id: uuid('id').primaryKey().notNull().defaultRandom(),
        knowledgeId: uuid('knowledge_id')
            .notNull()
            .references(() => knowledge.id, {
                onDelete: 'cascade',
                onUpdate: 'cascade',
            }),
        content: text('content').notNull(),
        embedding: vector('embedding', { dimensions: 768 }),
        createdAt: timestamp('created_at', {
            withTimezone: true,
            mode: 'date',
        }).notNull(),
    },
    (table) => ({
        embeddingIndex: index('embedding_index').using(
            'hnsw',
            table.embedding.op('vector_cosine_ops')
        ),
    })
);

export const chat = pgTable('chat', {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    title: text('title').notNull(),
    createdAt: timestamp('created_at').notNull(),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, {
            onDelete: 'cascade',
            onUpdate: 'cascade',
        }),
    spaceId: uuid('space_id').references(() => spaces.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
    }),
});
export type Chat = InferSelectModel<typeof chat>;

export const message = pgTable('message', {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    chatId: uuid('chat_id')
        .notNull()
        .references(() => chat.id, {
            onDelete: 'cascade',
            onUpdate: 'cascade',
        }),
    role: varchar('role').notNull(),
    parts: json('parts').notNull(),
    attachments: json('attachments').notNull(),
    createdAt: timestamp('created_at').notNull(),
});
export type Message = InferSelectModel<typeof message>;

export const stream = pgTable('stream', {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    chatId: uuid('chat_id')
        .notNull()
        .references(() => chat.id, {
            onDelete: 'cascade',
            onUpdate: 'cascade',
        }),
    createdAt: timestamp('created_at', {
        withTimezone: true,
        mode: 'date',
    }).notNull(),
});
export type Stream = InferSelectModel<typeof stream>;

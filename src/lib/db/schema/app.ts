import { index, pgTable, text, vector, timestamp, pgEnum, json } from 'drizzle-orm/pg-core';
import { randomUUID } from 'crypto';
import { InferSelectModel } from 'drizzle-orm';
import { generateId, Message } from 'ai';
import { users } from '@/lib/db/schema/auth';

export const spaces = pgTable('spaces', {
    id: text('id')
        .primaryKey()
        .notNull()
        .$defaultFn(() => randomUUID()),
    userId: text('user_id')
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

export const KnowledgeTypeEnum = pgEnum('knowledge_type', ['webpage', 'pdf']);
export const knowledge = pgTable('knowledge', {
    id: text('id')
        .primaryKey()
        .notNull()
        .$defaultFn(() => randomUUID()),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, {
            onDelete: 'cascade',
            onUpdate: 'cascade',
        }),
    spaceId: text('space_id')
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

export const knowledgeEmbeddings = pgTable(
    'knowledge_embeddings',
    {
        id: text('id')
            .primaryKey()
            .notNull()
            .$defaultFn(() => randomUUID()),
        knowledgeId: text('knowledge_id')
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

export const chats = pgTable('chats', {
    id: text('id')
        .primaryKey()
        .notNull()
        .$defaultFn(() => generateId()),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, {
            onDelete: 'cascade',
            onUpdate: 'cascade',
        }),
    spaceId: text('space_id')
        // .notNull() Temporary
        .references(() => spaces.id, {
            onDelete: 'cascade',
            onUpdate: 'cascade',
        }),
    chatName: text('chat_name').default('Unnamed Chat').notNull(),
    messages: json('messages').notNull(),
    createdAt: timestamp('created_at', {
        withTimezone: true,
        mode: 'date',
    }).notNull(),
});

export type Knowledge = InferSelectModel<typeof knowledge>;
export type Chat = Omit<InferSelectModel<typeof chats>, 'messages'> & { messages: Array<Message> };

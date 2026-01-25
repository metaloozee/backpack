/** biome-ignore-all lint/suspicious/noConsole: console.log */

import { TRPCError } from "@trpc/server";
import { del, put } from "@vercel/blob";
import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { start } from "workflow/api";
import { z } from "zod";
import { db } from "@/lib/db";
import {
	chat,
	knowledge,
	knowledgeEmbeddings,
	spaces,
} from "@/lib/db/schema/app";
import { protectedProcedure, router } from "@/lib/server/trpc";
import { sanitizeFileName, sanitizeUserInput } from "@/lib/utils/sanitization";
import { processKnowledgeWorkflow } from "@/workflows/knowledge-process";

const MAX_PDF_SIZE_MB = 25;
const BYTES_PER_KILOBYTE = 1024;
const KILOBYTES_PER_MEGABYTE = 1024;
const BYTES_PER_MB = BYTES_PER_KILOBYTE * KILOBYTES_PER_MEGABYTE;

export const spaceRouter = router({
	getSpaceOverview: protectedProcedure
		.input(
			z.object({
				spaceId: z.string().uuid(),
			})
		)
		.query(async ({ ctx, input }) => {
			const [spaceData] = await db
				.select()
				.from(spaces)
				.where(
					and(
						eq(spaces.id, input.spaceId),
						eq(spaces.userId, ctx.session.user.id)
					)
				)
				.limit(1);

			if (!spaceData) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Space not found",
				});
			}

			const [firstChat] = await db
				.select({ id: chat.id })
				.from(chat)
				.where(
					and(
						eq(chat.spaceId, spaceData.id),
						eq(chat.userId, ctx.session.user.id)
					)
				)
				.limit(1);

			return {
				spaceData,
				hasChats: Boolean(firstChat),
			};
		}),
	getSpaces: protectedProcedure
		.input(
			z.object({
				limit: z.number().optional(),
			})
		)
		.query(async ({ ctx, input }) => {
			const userSpaces = await db
				.select()
				.from(spaces)
				.where(eq(spaces.userId, ctx.session.user.id))
				.orderBy(desc(spaces.createdAt))
				.limit(input.limit ?? 100);

			return { spaces: userSpaces };
		}),
	createSpace: protectedProcedure
		.input(
			z.object({
				userId: z.string(),
				spaceTitle: z
					.string()
					.min(1)
					.max(255)
					.transform(sanitizeUserInput),
				spaceDescription: z
					.string()
					.max(1000)
					.transform(sanitizeUserInput)
					.optional(),
				spaceCustomInstructions: z
					.string()
					.max(2000)
					.transform(sanitizeUserInput)
					.optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			try {
				if (input.userId !== ctx.session.user.id) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Access denied",
					});
				}

				const [space] = await db
					.insert(spaces)
					.values({
						userId: ctx.session.user.id,
						spaceTitle: input.spaceTitle,
						spaceDescription: input.spaceDescription,
						spaceCustomInstructions: input.spaceCustomInstructions,
						createdAt: new Date(),
					})
					.returning({ id: spaces.id });

				if (!space) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to create space",
					});
				}

				return { id: space.id };
			} catch {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create space",
				});
			}
		}),
	updateSpace: protectedProcedure
		.input(
			z.object({
				spaceId: z.string().uuid(),
				spaceTitle: z
					.string()
					.min(1)
					.max(255)
					.transform(sanitizeUserInput),
				spaceDescription: z
					.string()
					.max(1000)
					.transform(sanitizeUserInput)
					.optional(),
				spaceCustomInstructions: z
					.string()
					.max(2000)
					.transform(sanitizeUserInput)
					.optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const [space] = await db
				.update(spaces)
				.set({
					spaceTitle: input.spaceTitle,
					spaceDescription: input.spaceDescription,
					spaceCustomInstructions: input.spaceCustomInstructions,
				})
				.where(
					and(
						eq(spaces.id, input.spaceId),
						eq(spaces.userId, ctx.session.user.id)
					)
				)
				.returning({ id: spaces.id });

			if (!space) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Space not found",
				});
			}

			return { success: true, id: space.id };
		}),
	deleteSpace: protectedProcedure
		.input(
			z.object({
				spaceId: z.string().uuid(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const [space] = await db
				.delete(spaces)
				.where(
					and(
						eq(spaces.id, input.spaceId),
						eq(spaces.userId, ctx.session.user.id)
					)
				)
				.returning({ id: spaces.id });

			if (!space) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Space not found",
				});
			}

			return { success: true, id: space.id };
		}),
	savePdf: protectedProcedure
		.input(z.instanceof(FormData))
		.mutation(async ({ ctx, input }) => {
			const spaceId = input.get("spaceId") as string | null;
			const file = input.get("file") as File | null;

			const parsedSpaceId = z.string().uuid().safeParse(spaceId);
			if (!parsedSpaceId.success) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Invalid space id",
				});
			}

			const [spaceExists] = await db
				.select({ id: spaces.id })
				.from(spaces)
				.where(
					and(
						eq(spaces.id, parsedSpaceId.data),
						eq(spaces.userId, ctx.session.user.id)
					)
				)
				.limit(1);

			if (!spaceExists) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Space not found",
				});
			}

			if (!file) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No file uploaded",
				});
			}

			if (file.type !== "application/pdf") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Only PDF files are allowed",
				});
			}

			if (file.size > MAX_PDF_SIZE_MB * BYTES_PER_MB) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `PDF size should be less than ${MAX_PDF_SIZE_MB}MB`,
				});
			}

			const fileBuffer = await file.arrayBuffer();
			const sanitizedFileName = sanitizeFileName(file.name);
			const blob = await put(
				`${ctx.session.user.id}/knowledge/${sanitizedFileName}`,
				fileBuffer,
				{
					access: "public",
					addRandomSuffix: true,
				}
			);

			const [knowledgeData] = await db
				.insert(knowledge)
				.values({
					userId: ctx.session.user.id,
					spaceId: parsedSpaceId.data,
					knowledgeType: "pdf" as const,
					knowledgeName: file.name,
					sourceUrl: blob.url,
					status: "pending",
					uploadedAt: new Date(),
				})
				.returning({ id: knowledge.id });

			if (!knowledgeData) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to save knowledge",
				});
			}

			await start(processKnowledgeWorkflow, [
				{
					knowledgeId: knowledgeData.id,
					userId: ctx.session.user.id,
				},
			]);

			revalidatePath(`/s/${parsedSpaceId.data}`);
			return { success: true };
		}),
	saveWebPage: protectedProcedure
		.input(
			z.object({
				spaceId: z.string(),
				url: z.string().url(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const [spaceExists] = await db
				.select()
				.from(spaces)
				.where(
					and(
						eq(spaces.id, input.spaceId),
						eq(spaces.userId, ctx.session.user.id)
					)
				)
				.limit(1);

			if (!spaceExists) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Space not found",
				});
			}

			const [knowledgeData] = await db
				.insert(knowledge)
				.values({
					userId: ctx.session.user.id,
					spaceId: input.spaceId,
					knowledgeType: "webpage" as const,
					knowledgeName: input.url,
					sourceUrl: input.url,
					status: "pending",
					uploadedAt: new Date(),
				})
				.returning({ id: knowledge.id });

			if (!knowledgeData) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to save knowledge",
				});
			}

			await start(processKnowledgeWorkflow, [
				{
					knowledgeId: knowledgeData.id,
					userId: ctx.session.user.id,
				},
			]);

			revalidatePath(`/s/${input.spaceId}`);
			return { success: true };
		}),
	getKnowledge: protectedProcedure
		.input(
			z.object({
				spaceId: z.string().uuid(),
			})
		)
		.query(async ({ ctx, input }) => {
			const knowledgeData = await db
				.select()
				.from(knowledge)
				.where(
					and(
						eq(knowledge.spaceId, input.spaceId),
						eq(knowledge.userId, ctx.session.user.id)
					)
				)
				.orderBy(desc(knowledge.uploadedAt));

			return knowledgeData;
		}),
	retryKnowledge: protectedProcedure
		.input(
			z.object({
				spaceId: z.string().uuid(),
				knowledgeId: z.string().uuid(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const [knowledgeRecord] = await db
				.select({
					id: knowledge.id,
					status: knowledge.status,
				})
				.from(knowledge)
				.where(
					and(
						eq(knowledge.id, input.knowledgeId),
						eq(knowledge.spaceId, input.spaceId),
						eq(knowledge.userId, ctx.session.user.id)
					)
				)
				.limit(1);

			if (!knowledgeRecord) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Knowledge not found",
				});
			}

			if (knowledgeRecord.status !== "failed") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Knowledge is not in a failed state",
				});
			}

			await db
				.update(knowledge)
				.set({
					status: "pending",
					errorMessage: null,
					processedAt: null,
					lastProcessingAt: null,
				})
				.where(
					and(
						eq(knowledge.id, input.knowledgeId),
						eq(knowledge.userId, ctx.session.user.id)
					)
				);

			await start(processKnowledgeWorkflow, [
				{
					knowledgeId: input.knowledgeId,
					userId: ctx.session.user.id,
				},
			]);

			revalidatePath(`/s/${input.spaceId}`);
			return { success: true };
		}),
	renameKnowledge: protectedProcedure
		.input(
			z.object({
				spaceId: z.string().uuid(),
				knowledgeId: z.string().uuid(),
				knowledgeName: z
					.string()
					.min(1)
					.max(255)
					.transform(sanitizeUserInput),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const [updatedKnowledge] = await db
				.update(knowledge)
				.set({ knowledgeName: input.knowledgeName })
				.where(
					and(
						eq(knowledge.id, input.knowledgeId),
						eq(knowledge.spaceId, input.spaceId),
						eq(knowledge.userId, ctx.session.user.id)
					)
				)
				.returning({ id: knowledge.id });

			if (!updatedKnowledge) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Knowledge not found",
				});
			}

			revalidatePath(`/s/${input.spaceId}`);
			return { success: true };
		}),
	deleteKnowledge: protectedProcedure
		.input(
			z.object({
				spaceId: z.string().uuid(),
				knowledgeId: z.string().uuid(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const [knowledgeRecord] = await db
				.select({
					id: knowledge.id,
					knowledgeType: knowledge.knowledgeType,
					sourceUrl: knowledge.sourceUrl,
				})
				.from(knowledge)
				.where(
					and(
						eq(knowledge.id, input.knowledgeId),
						eq(knowledge.spaceId, input.spaceId),
						eq(knowledge.userId, ctx.session.user.id)
					)
				)
				.limit(1);

			if (!knowledgeRecord) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Knowledge not found",
				});
			}

			if (
				knowledgeRecord.knowledgeType === "pdf" &&
				knowledgeRecord.sourceUrl
			) {
				await del(knowledgeRecord.sourceUrl);
			}

			await db
				.delete(knowledgeEmbeddings)
				.where(eq(knowledgeEmbeddings.knowledgeId, knowledgeRecord.id));

			const [deletedKnowledge] = await db
				.delete(knowledge)
				.where(
					and(
						eq(knowledge.id, input.knowledgeId),
						eq(knowledge.spaceId, input.spaceId),
						eq(knowledge.userId, ctx.session.user.id)
					)
				)
				.returning({ id: knowledge.id });

			if (!deletedKnowledge) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Knowledge not found",
				});
			}

			revalidatePath(`/s/${input.spaceId}`);
			return { success: true };
		}),
});

/** biome-ignore-all lint/suspicious/noConsole: console.log */

import { Mistral } from "@mistralai/mistralai";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateEmbeddings } from "@/lib/ai/embedding";
import { extractRawText, sanitizeData } from "@/lib/ai/extract-web-page";
import { db } from "@/lib/db";
import { chat, knowledge, knowledgeEmbeddings, spaces } from "@/lib/db/schema/app";
import { env } from "@/lib/env.mjs";
import { protectedProcedure, router } from "@/lib/server/trpc";

import { sanitizeUserInput } from "@/lib/utils/sanitization";

const mistral = new Mistral({ apiKey: env.MISTRAL_API_KEY });

async function fileToBase64(file: File): Promise<string> {
	const arrayBuffer = await file.arrayBuffer();
	return Buffer.from(arrayBuffer).toString("base64");
}

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
				.where(and(eq(spaces.id, input.spaceId), eq(spaces.userId, ctx.session.user.id)))
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
				.where(and(eq(chat.spaceId, spaceData.id), eq(chat.userId, ctx.session.user.id)))
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
				spaceTitle: z.string().min(1).max(255).transform(sanitizeUserInput),
				spaceDescription: z.string().max(1000).transform(sanitizeUserInput).optional(),
				spaceCustomInstructions: z.string().max(2000).transform(sanitizeUserInput).optional(),
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

				if (!space.id) {
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
				spaceTitle: z.string().min(1).max(255).transform(sanitizeUserInput),
				spaceDescription: z.string().max(1000).transform(sanitizeUserInput).optional(),
				spaceCustomInstructions: z.string().max(2000).transform(sanitizeUserInput).optional(),
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
				.where(and(eq(spaces.id, input.spaceId), eq(spaces.userId, ctx.session.user.id)))
				.returning({ id: spaces.id });

			if (!space.id) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update space",
				});
			}

			return { success: true, id: space.id };
		}),
	savePdf: protectedProcedure.input(z.instanceof(FormData)).mutation(async ({ ctx, input }) => {
		const spaceId = input.get("spaceId") as string;
		const file = input.get("file") as File;

		console.log("🔃 converting file to base64");
		const base64Pdf = (await fileToBase64(file)) as string;

		console.log("🔃 ocr processing");
		const ocrResponse = await mistral.ocr.process({
			model: "mistral-ocr-latest",
			document: {
				type: "document_url",
				documentUrl: `data:application/pdf;base64,${base64Pdf}`,
			},
		});

		if (ocrResponse.pages.length === 0) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Failed to process PDF",
			});
		}

		console.log("🔃 generating embeddings");
		const pdfText = ocrResponse.pages.map((page) => page.markdown).join("\n");
		const embeddings = await generateEmbeddings(pdfText);
		if (!embeddings || embeddings.length === 0) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to generate embeddings",
			});
		}

		console.log("🔃 saving knowledge");
		const [knowledgeData] = await db
			.insert(knowledge)
			.values({
				userId: ctx.session.user.id,
				spaceId,
				knowledgeType: "pdf" as const,
				knowledgeName: file.name,
				uploadedAt: new Date(),
			})
			.returning({ id: knowledge.id });

		console.log("🔃 saving embeddings");
		await db.insert(knowledgeEmbeddings).values(
			embeddings.map((embedding) => ({
				knowledgeId: knowledgeData.id,
				createdAt: new Date(),
				content: embedding.content,
				embedding: embedding.embedding,
			}))
		);

		revalidatePath(`/s/${spaceId}`);
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
				.where(and(eq(spaces.id, input.spaceId), eq(spaces.userId, ctx.session.user.id)))
				.limit(1);

			if (!spaceExists) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Space not found",
				});
			}

			console.log("🔃 extracting raw text");

			const { success, result } = await extractRawText({ url: input.url });
			if (!(success && result)) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Failed to extract content from URL",
				});
			}

			console.log("🔃 sanitizing extracted content");
			const { success: sanitizedSuccess, sanitizedText } = await sanitizeData({
				rawText: result[0].rawContent,
			});
			if (!(sanitizedSuccess && sanitizedText)) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Failed to sanitize extracted content",
				});
			}

			console.log("🔃 generating embeddings");
			const embeddings = await generateEmbeddings(sanitizedText);
			if (!embeddings || embeddings.length === 0) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to generate embeddings",
				});
			}

			console.log("🔃 saving knowledge");
			const [knowledgeData] = await db
				.insert(knowledge)
				.values({
					userId: ctx.session.user.id,
					spaceId: input.spaceId,
					knowledgeType: "webpage" as const,
					knowledgeName: input.url,
					knowledgeSummary: sanitizedText.slice(0, 500) + (sanitizedText.length > 500 ? "..." : ""),
					uploadedAt: new Date(),
				})
				.returning({ id: knowledge.id });

			console.log("🔃 saving embeddings");
			await db.insert(knowledgeEmbeddings).values(
				embeddings.map((embedding) => ({
					knowledgeId: knowledgeData.id,
					createdAt: new Date(),
					content: embedding.content,
					embedding: embedding.embedding,
				}))
			);

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
				.where(and(eq(knowledge.spaceId, input.spaceId), eq(knowledge.userId, ctx.session.user.id)))
				.orderBy(desc(knowledge.uploadedAt));

			return knowledgeData;
		}),
});

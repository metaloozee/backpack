/** biome-ignore-all lint/suspicious/noConsole: console.log */

import { auth } from "@trigger.dev/sdk";
import { TRPCError } from "@trpc/server";
import { del, put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
	createKnowledge,
	deleteKnowledgeByIdAndUserId,
	deleteKnowledgeEmbeddingsByKnowledgeId,
	getKnowledgeByIdSpaceAndUserId,
	getKnowledgeBySpaceIdAndUserId,
	renameKnowledgeByIdAndUserId,
	resetKnowledgeForRetry,
} from "@/lib/db/queries/knowledge";
import {
	createSpace,
	deleteSpaceByIdAndUserId,
	getSpaceByIdAndUserId,
	getSpaceOverview,
	getSpacesByUserId,
	updateSpace,
} from "@/lib/db/queries/spaces";
import { protectedProcedure, router } from "@/lib/server/trpc";
import { sanitizeFileName, sanitizeUserInput } from "@/lib/utils/sanitization";
import { processKnowledgeTask } from "@/trigger/knowledge";

const MAX_PDF_SIZE_MB = 25;
const BYTES_PER_KILOBYTE = 1024;
const KILOBYTES_PER_MEGABYTE = 1024;
const BYTES_PER_MB = BYTES_PER_KILOBYTE * KILOBYTES_PER_MEGABYTE;
const KNOWLEDGE_REALTIME_TOKEN_TTL = "2h";

const getSpaceTag = (spaceId: string) => `space:${spaceId}`;
const getKnowledgeTag = (knowledgeId: string) => `knowledge:${knowledgeId}`;

const triggerKnowledgeProcessing = async ({
	knowledgeId,
	userId,
	spaceId,
	knowledgeType,
}: {
	knowledgeId: string;
	userId: string;
	spaceId: string;
	knowledgeType: "webpage" | "pdf";
}) => {
	const run = await processKnowledgeTask.trigger(
		{
			knowledgeId,
			userId,
		},
		{
			tags: [getSpaceTag(spaceId), getKnowledgeTag(knowledgeId)],
			metadata: {
				spaceId,
				knowledgeId,
				knowledgeType,
			},
		}
	);

	return {
		id: run.id,
		publicAccessToken: run.publicAccessToken,
		taskIdentifier: run.taskIdentifier,
	};
};

export const spaceRouter = router({
	getSpaceOverview: protectedProcedure
		.input(
			z.object({
				spaceId: z.string().uuid(),
			})
		)
		.query(async ({ ctx, input }) => {
			const { spaceData, hasChats } = await getSpaceOverview({
				spaceId: input.spaceId,
				userId: ctx.session.user.id,
			});

			if (!spaceData) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Space not found",
				});
			}

			return {
				spaceData,
				hasChats,
			};
		}),
	getSpaces: protectedProcedure
		.input(
			z.object({
				limit: z.number().optional(),
			})
		)
		.query(async ({ ctx, input }) => {
			const userSpaces = await getSpacesByUserId({
				userId: ctx.session.user.id,
				limit: input.limit ?? 100,
			});

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

				const space = await createSpace({
					userId: ctx.session.user.id,
					spaceTitle: input.spaceTitle,
					spaceDescription: input.spaceDescription,
					spaceCustomInstructions: input.spaceCustomInstructions,
				});

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
			const space = await updateSpace({
				spaceId: input.spaceId,
				userId: ctx.session.user.id,
				spaceTitle: input.spaceTitle,
				spaceDescription: input.spaceDescription,
				spaceCustomInstructions: input.spaceCustomInstructions,
			});

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
			const space = await deleteSpaceByIdAndUserId({
				spaceId: input.spaceId,
				userId: ctx.session.user.id,
			});

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

			const spaceExists = await getSpaceByIdAndUserId({
				spaceId: parsedSpaceId.data,
				userId: ctx.session.user.id,
			});

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

			const knowledgeData = await createKnowledge({
				userId: ctx.session.user.id,
				spaceId: parsedSpaceId.data,
				knowledgeType: "pdf",
				knowledgeName: file.name,
				sourceUrl: blob.url,
				status: "pending",
				uploadedAt: new Date(),
			});

			if (!knowledgeData) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to save knowledge",
				});
			}

			const run = await triggerKnowledgeProcessing({
				knowledgeId: knowledgeData.id,
				userId: ctx.session.user.id,
				spaceId: parsedSpaceId.data,
				knowledgeType: "pdf",
			});

			revalidatePath(`/s/${parsedSpaceId.data}`);
			return { success: true, knowledgeId: knowledgeData.id, run };
		}),
	saveWebPage: protectedProcedure
		.input(
			z.object({
				spaceId: z.string(),
				url: z.string().url(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const spaceExists = await getSpaceByIdAndUserId({
				spaceId: input.spaceId,
				userId: ctx.session.user.id,
			});

			if (!spaceExists) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Space not found",
				});
			}

			const knowledgeData = await createKnowledge({
				userId: ctx.session.user.id,
				spaceId: input.spaceId,
				knowledgeType: "webpage",
				knowledgeName: input.url,
				sourceUrl: input.url,
				status: "pending",
				uploadedAt: new Date(),
			});

			if (!knowledgeData) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to save knowledge",
				});
			}

			const run = await triggerKnowledgeProcessing({
				knowledgeId: knowledgeData.id,
				userId: ctx.session.user.id,
				spaceId: input.spaceId,
				knowledgeType: "webpage",
			});

			revalidatePath(`/s/${input.spaceId}`);
			return { success: true, knowledgeId: knowledgeData.id, run };
		}),

	getKnowledge: protectedProcedure
		.input(
			z.object({
				spaceId: z.string().uuid(),
			})
		)
		.query(
			async ({ ctx, input }) =>
				await getKnowledgeBySpaceIdAndUserId({
					spaceId: input.spaceId,
					userId: ctx.session.user.id,
				})
		),
	retryKnowledge: protectedProcedure
		.input(
			z.object({
				spaceId: z.string().uuid(),
				knowledgeId: z.string().uuid(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const knowledgeRecord = await getKnowledgeByIdSpaceAndUserId({
				knowledgeId: input.knowledgeId,
				spaceId: input.spaceId,
				userId: ctx.session.user.id,
			});

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

			await resetKnowledgeForRetry({
				knowledgeId: input.knowledgeId,
				userId: ctx.session.user.id,
			});

			const run = await triggerKnowledgeProcessing({
				knowledgeId: input.knowledgeId,
				userId: ctx.session.user.id,
				spaceId: input.spaceId,
				knowledgeType: knowledgeRecord.knowledgeType,
			});

			revalidatePath(`/s/${input.spaceId}`);
			return { success: true, knowledgeId: input.knowledgeId, run };
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
			const updatedKnowledge = await renameKnowledgeByIdAndUserId({
				knowledgeId: input.knowledgeId,
				spaceId: input.spaceId,
				userId: ctx.session.user.id,
				knowledgeName: input.knowledgeName,
			});

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
			const knowledgeRecord = await getKnowledgeByIdSpaceAndUserId({
				knowledgeId: input.knowledgeId,
				spaceId: input.spaceId,
				userId: ctx.session.user.id,
			});

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

			await deleteKnowledgeEmbeddingsByKnowledgeId({
				knowledgeId: knowledgeRecord.id,
			});

			const deletedKnowledge = await deleteKnowledgeByIdAndUserId({
				knowledgeId: input.knowledgeId,
				spaceId: input.spaceId,
				userId: ctx.session.user.id,
			});

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

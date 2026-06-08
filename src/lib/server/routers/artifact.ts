import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
	appendArtifactVersion,
	getArtifactsByChatIdAndUserId,
	getArtifactWithVersionsByIdAndUserId,
	renameArtifact,
	restoreArtifactVersion,
} from "@/lib/db/queries/artifacts";
import { getChatByIdAndUserId } from "@/lib/db/queries/chat";
import { protectedProcedure, router } from "@/lib/server/trpc";
import { sanitizeUserInput } from "@/lib/utils/sanitization";

const MAX_ARTIFACT_CONTENT_LENGTH = 250_000;

const requireOwnedChat = async ({
	chatId,
	userId,
}: {
	chatId: string;
	userId: string;
}) => {
	const selectedChat = await getChatByIdAndUserId({ chatId, userId });
	if (!selectedChat) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Chat not found",
		});
	}
	return selectedChat;
};

export const artifactRouter = router({
	listByChat: protectedProcedure
		.input(
			z.object({
				chatId: z.string().uuid(),
			})
		)
		.query(async ({ ctx, input }) => {
			await requireOwnedChat({
				chatId: input.chatId,
				userId: ctx.session.user.id,
			});

			return await getArtifactsByChatIdAndUserId({
				chatId: input.chatId,
				userId: ctx.session.user.id,
			});
		}),
	getById: protectedProcedure
		.input(
			z.object({
				artifactId: z.string().uuid(),
			})
		)
		.query(async ({ ctx, input }) => {
			const result = await getArtifactWithVersionsByIdAndUserId({
				artifactId: input.artifactId,
				userId: ctx.session.user.id,
			});

			if (!result) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Artifact not found",
				});
			}

			return result;
		}),
	saveVersion: protectedProcedure
		.input(
			z.object({
				artifactId: z.string().uuid(),
				content: z.string().min(1).max(MAX_ARTIFACT_CONTENT_LENGTH),
				baseVersionNumber: z.number().int().positive().optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const current = await getArtifactWithVersionsByIdAndUserId({
				artifactId: input.artifactId,
				userId: ctx.session.user.id,
			});

			if (!current) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Artifact not found",
				});
			}

			const latestVersion = current.versions[0];
			const staleBase =
				typeof input.baseVersionNumber === "number" &&
				latestVersion?.versionNumber !== input.baseVersionNumber;

			const version = await appendArtifactVersion({
				artifactId: input.artifactId,
				userId: ctx.session.user.id,
				content: input.content,
				source: "user",
			});

			return { version, staleBase };
		}),
	rename: protectedProcedure
		.input(
			z.object({
				artifactId: z.string().uuid(),
				title: z.string().min(1).max(120).transform(sanitizeUserInput),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const updatedArtifact = await renameArtifact({
				artifactId: input.artifactId,
				userId: ctx.session.user.id,
				title: input.title,
			});

			if (!updatedArtifact) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Artifact not found",
				});
			}

			return updatedArtifact;
		}),
	restoreVersion: protectedProcedure
		.input(
			z.object({
				artifactId: z.string().uuid(),
				versionId: z.string().uuid(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			return await restoreArtifactVersion({
				artifactId: input.artifactId,
				versionId: input.versionId,
				userId: ctx.session.user.id,
			});
		}),
});

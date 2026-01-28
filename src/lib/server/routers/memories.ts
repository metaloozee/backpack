import { z } from "zod";
import {
	deleteAllMemoriesByUserId,
	deleteMemoriesByIdsAndUserId,
	deleteMemoryByIdAndUserId,
	getMemoriesByUserId,
} from "@/lib/db/queries";
import { protectedProcedure, router } from "@/lib/server/trpc";

export const memoriesRouter = router({
	getMemories: protectedProcedure.query(async ({ ctx }) => {
		return await getMemoriesByUserId({ userId: ctx.session.user.id });
	}),
	deleteMemory: protectedProcedure
		.input(
			z.object({
				id: z.string(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			await deleteMemoryByIdAndUserId({
				id: input.id,
				userId: ctx.session.user.id,
			});
			return { success: true };
		}),
	deleteSelectedMemories: protectedProcedure
		.input(
			z.object({
				ids: z.array(z.string()),
			})
		)
		.mutation(async ({ ctx, input }) => {
			if (input.ids.length === 0) {
				throw new Error("No memory IDs provided");
			}
			await deleteMemoriesByIdsAndUserId({
				ids: input.ids,
				userId: ctx.session.user.id,
			});
			return { success: true };
		}),
	deleteAllMemories: protectedProcedure.mutation(async ({ ctx }) => {
		await deleteAllMemoriesByUserId({ userId: ctx.session.user.id });
		return { success: true };
	}),
});

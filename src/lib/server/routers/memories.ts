import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { memories } from "@/lib/db/schema/app";
import { protectedProcedure, router } from "@/lib/server/trpc";

export const memoriesRouter = router({
	getMemories: protectedProcedure.query(async ({ ctx }) => {
		return await db
			.select()
			.from(memories)
			.where(eq(memories.userId, ctx.session.user.id))
			.orderBy(desc(memories.createdAt));
	}),
	deleteMemory: protectedProcedure
		.input(
			z.object({
				id: z.string(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			return await db
				.delete(memories)
				.where(and(eq(memories.id, input.id), eq(memories.userId, ctx.session.user.id)));
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

			return await db
				.delete(memories)
				.where(and(eq(memories.userId, ctx.session.user.id), inArray(memories.id, input.ids)));
		}),
	deleteAllMemories: protectedProcedure.mutation(async ({ ctx }) => {
		return await db.delete(memories).where(eq(memories.userId, ctx.session.user.id));
	}),
});

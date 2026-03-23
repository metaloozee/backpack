import { z } from "zod";

const textPartSchema = z.object({
	type: z.enum(["text"]),
	text: z.string().min(1).max(2000),
});

const filePartSchema = z.object({
	type: z.enum(["file"]),
	mediaType: z.enum(["image/jpeg", "image/png"]),
	name: z.string().min(1).max(100),
	url: z.string().url(),
});

export const postRequestBodySchema = z.object({
	id: z.string().uuid(),
	env: z.object({
		inSpace: z.boolean(),
		spaceId: z.string().uuid().optional(),
		spaceName: z.string().optional(),
		spaceDescription: z.string().optional(),
		spaceCustomInstructions: z.string().optional(),
	}),
	message: z.object({
		id: z.string().uuid(),
		role: z.enum(["user"]),
		parts: z.array(z.union([textPartSchema, filePartSchema])),
	}),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;

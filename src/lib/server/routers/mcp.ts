import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
	createMcpServerConfig,
	deleteMcpServerConfigByIdAndUserId,
	getMcpServerConfigByIdAndUserId,
	getMcpServerConfigsByUserId,
	updateMcpServerConfig,
} from "@/lib/db/queries";
import { testMcpConnection } from "@/lib/mcp/client";
import {
	decryptKey,
	encryptKey,
	parseEncryptedKey,
} from "@/lib/mcp/encryption";
import { protectedProcedure, router } from "@/lib/server/trpc";

const MCP_CONNECTION_TIMEOUT_MS = 5000;

export const mcpRouter = router({
	getServers: protectedProcedure
		.input(
			z
				.object({
					limit: z.number().optional(),
				})
				.optional()
		)
		.query(async ({ ctx, input }) => {
			const servers = await getMcpServerConfigsByUserId({
				userId: ctx.session.user.id,
				limit: input?.limit,
			});

			return {
				servers: servers.map(({ apiKeyEncrypted, ...server }) => {
					const hasApiKey = Boolean(apiKeyEncrypted);
					let apiKeyLast4: string | null = null;

					if (apiKeyEncrypted) {
						try {
							const decrypted = decryptKey(
								parseEncryptedKey(apiKeyEncrypted)
							);
							apiKeyLast4 = decrypted.slice(-4);
						} catch {
							/* decrypt failure: apiKeyLast4 stays null, hasApiKey stays true */
						}
					}

					return {
						...server,
						hasApiKey,
						apiKeyLast4,
					};
				}),
			};
		}),

	addServer: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1).max(255),
				url: z.string().url(),
				apiKey: z.string().optional(),
				enabled: z.boolean().optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			try {
				const apiKeyEncrypted = input.apiKey
					? JSON.stringify(encryptKey(input.apiKey))
					: undefined;

				const config = await createMcpServerConfig({
					userId: ctx.session.user.id,
					name: input.name,
					url: input.url,
					apiKeyEncrypted,
					enabled: input.enabled,
				});

				return { id: config.id };
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: `Failed to add MCP server: ${errorMessage}`,
				});
			}
		}),

	updateServer: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				name: z.string().min(1).max(255).optional(),
				url: z.string().url().optional(),
				apiKey: z.string().optional(),
				enabled: z.boolean().optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const existingServer = await getMcpServerConfigByIdAndUserId({
				id: input.id,
				userId: ctx.session.user.id,
			});

			if (!existingServer) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "MCP server not found",
				});
			}

			const apiKey = input.apiKey;
			const shouldEncryptNewApiKey =
				apiKey !== undefined && apiKey !== "";
			const apiKeyEncrypted = shouldEncryptNewApiKey
				? JSON.stringify(encryptKey(apiKey))
				: undefined;

			const authOrUrlChanged =
				input.url !== undefined ||
				(input.apiKey !== undefined && input.apiKey !== "");

			try {
				const config = await updateMcpServerConfig({
					id: input.id,
					userId: ctx.session.user.id,
					name: input.name,
					url: input.url,
					apiKeyEncrypted,
					enabled: input.enabled,
					...(authOrUrlChanged && {
						lastConnectedAt: null,
						lastError: null,
						toolsCache: null,
					}),
				});

				if (!config) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "MCP server not found",
					});
				}

				return { success: true, id: config.id };
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: `Failed to update MCP server: ${errorMessage}`,
				});
			}
		}),

	deleteServer: protectedProcedure
		.input(
			z.object({
				serverId: z.string().uuid(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const config = await deleteMcpServerConfigByIdAndUserId({
				id: input.serverId,
				userId: ctx.session.user.id,
			});

			if (!config) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "MCP server not found",
				});
			}

			return { success: true, id: config.id };
		}),

	testConnection: protectedProcedure
		.input(
			z.object({
				serverId: z.string().uuid().optional(),
				url: z.string().url().optional(),
				apiKey: z.string().optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { url, apiKey, serverId } = await resolveConnectionParams(
				{ id: input.serverId, url: input.url, apiKey: input.apiKey },
				ctx.session.user.id
			);

			try {
				const controller = new AbortController();
				const timeoutId = setTimeout(
					() => controller.abort(),
					MCP_CONNECTION_TIMEOUT_MS
				);

				const result = await Promise.race([
					testMcpConnection(url, apiKey),
					new Promise<never>((_, reject) => {
						controller.signal.addEventListener("abort", () => {
							reject(new Error("Connection timeout"));
						});
					}),
				]);

				clearTimeout(timeoutId);

				if (serverId) {
					if (result.success) {
						await updateMcpServerConfig({
							id: serverId,
							userId: ctx.session.user.id,
							lastConnectedAt: new Date(),
							lastError: null,
							toolsCache: result.tools ?? null,
						});
					} else {
						await updateMcpServerConfig({
							id: serverId,
							userId: ctx.session.user.id,
							lastError: result.error ?? "Connection failed",
						});
					}
				}

				return result;
			} catch (error) {
				const errorMessage =
					error instanceof Error
						? error.message
						: "Connection failed";

				if (serverId) {
					await updateMcpServerConfig({
						id: serverId,
						userId: ctx.session.user.id,
						lastError: errorMessage,
					});
				}

				return {
					success: false,
					error: errorMessage,
				};
			}
		}),
});

async function resolveConnectionParams(
	input: { id?: string; url?: string; apiKey?: string },
	userId: string
): Promise<{ url: string; apiKey?: string; serverId?: string }> {
	if (input.id) {
		const server = await getMcpServerConfigByIdAndUserId({
			id: input.id,
			userId,
		});

		if (!server) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "MCP server not found",
			});
		}

		return {
			url: server.url,
			apiKey: server.apiKeyEncrypted
				? decryptKey(parseEncryptedKey(server.apiKeyEncrypted))
				: undefined,
			serverId: input.id,
		};
	}

	if (input.url) {
		return {
			url: input.url,
			apiKey: input.apiKey,
		};
	}

	throw new TRPCError({
		code: "BAD_REQUEST",
		message: "Either id or url must be provided",
	});
}

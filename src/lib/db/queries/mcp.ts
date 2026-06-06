import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { type McpServerConfig, mcpServerConfig } from "@/lib/db/schema/mcp";
import { BackpackError } from "@/lib/errors";

export async function getMcpServerConfigsByUserId({
	userId,
	limit,
}: {
	userId: string;
	limit?: number;
}): Promise<McpServerConfig[]> {
	try {
		const query = db
			.select()
			.from(mcpServerConfig)
			.where(eq(mcpServerConfig.userId, userId))
			.orderBy(desc(mcpServerConfig.createdAt));

		if (limit) {
			return await query.limit(limit);
		}
		return await query;
	} catch (error) {
		throw BackpackError.database(
			"Failed to get MCP server configs by user id",
			error
		);
	}
}

export async function getMcpServerConfigByIdAndUserId({
	id,
	userId,
}: {
	id: string;
	userId: string;
}): Promise<McpServerConfig | undefined> {
	try {
		const [config] = await db
			.select()
			.from(mcpServerConfig)
			.where(
				and(
					eq(mcpServerConfig.id, id),
					eq(mcpServerConfig.userId, userId)
				)
			)
			.limit(1);
		return config;
	} catch (error) {
		throw BackpackError.database(
			"Failed to get MCP server config by id and user",
			error
		);
	}
}

export async function getMcpServerConfigsByIds({
	ids,
	userId,
}: {
	ids: string[];
	userId: string;
}): Promise<McpServerConfig[]> {
	try {
		if (ids.length === 0) {
			return [];
		}
		return await db
			.select()
			.from(mcpServerConfig)
			.where(
				and(
					inArray(mcpServerConfig.id, ids),
					eq(mcpServerConfig.userId, userId)
				)
			);
	} catch (error) {
		throw BackpackError.database(
			"Failed to get MCP server configs by ids",
			error
		);
	}
}

export async function createMcpServerConfig({
	userId,
	name,
	url,
	apiKeyEncrypted,
	enabled = true,
}: {
	userId: string;
	name: string;
	url: string;
	apiKeyEncrypted?: string;
	enabled?: boolean;
}): Promise<McpServerConfig> {
	try {
		const [config] = await db
			.insert(mcpServerConfig)
			.values({
				userId,
				name,
				url,
				apiKeyEncrypted,
				enabled,
			})
			.returning();
		return config;
	} catch (error) {
		throw BackpackError.database(
			"Failed to create MCP server config",
			error
		);
	}
}

export async function updateMcpServerConfig({
	id,
	userId,
	name,
	url,
	apiKeyEncrypted,
	enabled,
	lastConnectedAt,
	lastError,
	toolsCache,
}: {
	id: string;
	userId: string;
	name?: string;
	url?: string;
	apiKeyEncrypted?: string;
	enabled?: boolean;
	lastConnectedAt?: Date | null;
	lastError?: string | null;
	toolsCache?: unknown | null;
}): Promise<McpServerConfig | undefined> {
	try {
		const updateData: Partial<{
			name: string;
			url: string;
			apiKeyEncrypted: string;
			enabled: boolean;
			lastConnectedAt: Date | null;
			lastError: string | null;
			toolsCache: unknown | null;
			updatedAt: Date;
		}> = {
			updatedAt: new Date(),
		};

		if (name !== undefined) {
			updateData.name = name;
		}
		if (url !== undefined) {
			updateData.url = url;
		}
		if (apiKeyEncrypted !== undefined) {
			updateData.apiKeyEncrypted = apiKeyEncrypted;
		}
		if (enabled !== undefined) {
			updateData.enabled = enabled;
		}
		if (lastConnectedAt !== undefined) {
			updateData.lastConnectedAt = lastConnectedAt;
		}
		if (lastError !== undefined) {
			updateData.lastError = lastError;
		}
		if (toolsCache !== undefined) {
			updateData.toolsCache = toolsCache;
		}

		const [config] = await db
			.update(mcpServerConfig)
			.set(updateData)
			.where(
				and(
					eq(mcpServerConfig.id, id),
					eq(mcpServerConfig.userId, userId)
				)
			)
			.returning();
		return config;
	} catch (error) {
		throw BackpackError.database(
			"Failed to update MCP server config",
			error
		);
	}
}

export async function deleteMcpServerConfigByIdAndUserId({
	id,
	userId,
}: {
	id: string;
	userId: string;
}): Promise<McpServerConfig | undefined> {
	try {
		const [config] = await db
			.delete(mcpServerConfig)
			.where(
				and(
					eq(mcpServerConfig.id, id),
					eq(mcpServerConfig.userId, userId)
				)
			)
			.returning();
		return config;
	} catch (error) {
		throw BackpackError.database(
			"Failed to delete MCP server config",
			error
		);
	}
}

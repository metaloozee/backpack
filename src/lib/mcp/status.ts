export type McpStatus =
	| "needs_auth"
	| "ready"
	| "degraded"
	| "failed"
	| "unknown";

export interface McpStatusInput {
	lastConnectedAt?: Date | null;
	lastError?: string | null;
	hasApiKey?: boolean;
}

export function getMcpStatus(server: McpStatusInput): McpStatus {
	const hasError = Boolean(server.lastError);
	const hadSuccess = Boolean(server.lastConnectedAt);

	if (hasError && !hadSuccess) {
		return server.hasApiKey === false ? "needs_auth" : "failed";
	}
	if (hasError && hadSuccess) {
		return "degraded";
	}
	if (hadSuccess && !hasError) {
		return "ready";
	}
	return "unknown";
}

export function isMcpServerSelectable(status: McpStatus): boolean {
	return status === "ready" || status === "degraded";
}

export function isMcpServerDisabled(status: McpStatus): boolean {
	return (
		status === "needs_auth" || status === "failed" || status === "unknown"
	);
}

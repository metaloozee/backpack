/** biome-ignore-all lint/suspicious/noConsole: Error logging is intentional */
import { TRPCError } from "@trpc/server";

// Error types (what went wrong)
export const ErrorType = {
	BAD_REQUEST: "bad_request",
	UNAUTHORIZED: "unauthorized",
	FORBIDDEN: "forbidden",
	NOT_FOUND: "not_found",
	CONFLICT: "conflict",
	TOO_MANY_REQUESTS: "too_many_requests",
	INTERNAL: "internal",
	SERVICE_UNAVAILABLE: "service_unavailable",
	AI_ERROR: "ai_error",
} as const;

export type ErrorTypeValue = (typeof ErrorType)[keyof typeof ErrorType];

// Surfaces (where it happened)
export const Surface = {
	CHAT: "chat",
	API: "api",
	STREAM: "stream",
	DATABASE: "database",
	AUTH: "auth",
	SPACE: "space",
	MEMORY: "memory",
	KNOWLEDGE: "knowledge",
} as const;

export type SurfaceValue = (typeof Surface)[keyof typeof Surface];

// Compound error code format: "error_type:surface"
export type CompoundErrorCode = `${ErrorTypeValue}:${SurfaceValue}`;

// Visibility determines whether error details are returned to client or just logged
export type ErrorVisibility = "response" | "log";

const visibilityBySurface: Record<SurfaceValue, ErrorVisibility> = {
	database: "log", // Database errors are logged only, generic message to client
	chat: "response",
	api: "response",
	stream: "response",
	auth: "response",
	space: "response",
	memory: "response",
	knowledge: "response",
};

// Legacy error codes for backward compatibility
export const ErrorCode = {
	UNAUTHORIZED: "UNAUTHORIZED",
	FORBIDDEN: "FORBIDDEN",
	BAD_REQUEST: "BAD_REQUEST",
	NOT_FOUND: "NOT_FOUND",
	CONFLICT: "CONFLICT",
	TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",
	INTERNAL_ERROR: "INTERNAL_ERROR",
	SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
	AI_PROVIDER_ERROR: "AI_PROVIDER_ERROR",
	AI_RATE_LIMITED: "AI_RATE_LIMITED",
	AI_CONTEXT_LENGTH_EXCEEDED: "AI_CONTEXT_LENGTH_EXCEEDED",
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

const httpStatusMap: Record<ErrorCodeType, number> = {
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	BAD_REQUEST: 400,
	NOT_FOUND: 404,
	CONFLICT: 409,
	TOO_MANY_REQUESTS: 429,
	INTERNAL_ERROR: 500,
	SERVICE_UNAVAILABLE: 503,
	AI_PROVIDER_ERROR: 502,
	AI_RATE_LIMITED: 429,
	AI_CONTEXT_LENGTH_EXCEEDED: 400,
};

type TRPCErrorCode =
	| "BAD_REQUEST"
	| "UNAUTHORIZED"
	| "FORBIDDEN"
	| "NOT_FOUND"
	| "TIMEOUT"
	| "CONFLICT"
	| "PRECONDITION_FAILED"
	| "PAYLOAD_TOO_LARGE"
	| "METHOD_NOT_SUPPORTED"
	| "UNPROCESSABLE_CONTENT"
	| "TOO_MANY_REQUESTS"
	| "CLIENT_CLOSED_REQUEST"
	| "INTERNAL_SERVER_ERROR"
	| "NOT_IMPLEMENTED"
	| "BAD_GATEWAY"
	| "SERVICE_UNAVAILABLE"
	| "GATEWAY_TIMEOUT";

const trpcErrorMap: Record<ErrorCodeType, TRPCErrorCode> = {
	UNAUTHORIZED: "UNAUTHORIZED",
	FORBIDDEN: "FORBIDDEN",
	BAD_REQUEST: "BAD_REQUEST",
	NOT_FOUND: "NOT_FOUND",
	CONFLICT: "CONFLICT",
	TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",
	INTERNAL_ERROR: "INTERNAL_SERVER_ERROR",
	SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
	AI_PROVIDER_ERROR: "BAD_GATEWAY",
	AI_RATE_LIMITED: "TOO_MANY_REQUESTS",
	AI_CONTEXT_LENGTH_EXCEEDED: "BAD_REQUEST",
};

interface BackpackErrorOptions {
	code: ErrorCodeType;
	message: string;
	cause?: unknown;
	userMessage?: string;
}

interface SurfaceErrorOptions {
	type: ErrorTypeValue;
	surface: SurfaceValue;
	message: string;
	cause?: unknown;
	userMessage?: string;
}

// Map error types to HTTP status codes
const errorTypeToStatus: Record<ErrorTypeValue, number> = {
	bad_request: 400,
	unauthorized: 401,
	forbidden: 403,
	not_found: 404,
	conflict: 409,
	too_many_requests: 429,
	internal: 500,
	service_unavailable: 503,
	ai_error: 502,
};

// Map error types to tRPC error codes
const errorTypeToTRPC: Record<ErrorTypeValue, TRPCErrorCode> = {
	bad_request: "BAD_REQUEST",
	unauthorized: "UNAUTHORIZED",
	forbidden: "FORBIDDEN",
	not_found: "NOT_FOUND",
	conflict: "CONFLICT",
	too_many_requests: "TOO_MANY_REQUESTS",
	internal: "INTERNAL_SERVER_ERROR",
	service_unavailable: "SERVICE_UNAVAILABLE",
	ai_error: "BAD_GATEWAY",
};

export class BackpackError extends Error {
	readonly code: ErrorCodeType;
	readonly httpStatus: number;
	readonly userMessage: string;
	// Surface-specific error fields
	readonly errorType?: ErrorTypeValue;
	readonly surface?: SurfaceValue;
	readonly compoundCode?: CompoundErrorCode;
	readonly visibility?: ErrorVisibility;

	constructor(options: BackpackErrorOptions) {
		super(options.message);
		this.name = "BackpackError";
		this.code = options.code;
		this.httpStatus = httpStatusMap[options.code];
		this.userMessage = options.userMessage ?? options.message;

		if (options.cause) {
			this.cause = options.cause;
		}
	}

	/**
	 * Create a surface-specific error with compound error code (e.g., "bad_request:chat")
	 */
	static fromSurface(options: SurfaceErrorOptions): BackpackError {
		const compoundCode: CompoundErrorCode = `${options.type}:${options.surface}`;
		const visibility = visibilityBySurface[options.surface];
		const httpStatus = errorTypeToStatus[options.type];

		// Map to legacy code for backward compatibility
		const legacyCode = mapTypeToLegacyCode(options.type);

		const error = new BackpackError({
			code: legacyCode,
			message: options.message,
			cause: options.cause,
			userMessage: options.userMessage,
		});

		// Add surface-specific properties
		Object.defineProperties(error, {
			errorType: { value: options.type, enumerable: true },
			surface: { value: options.surface, enumerable: true },
			compoundCode: { value: compoundCode, enumerable: true },
			visibility: { value: visibility, enumerable: true },
			httpStatus: { value: httpStatus, enumerable: true, writable: true },
		});

		return error;
	}

	toTRPCError(): TRPCError {
		const code = this.errorType
			? errorTypeToTRPC[this.errorType]
			: trpcErrorMap[this.code];

		return new TRPCError({
			code,
			message: this.userMessage,
			cause: this,
		});
	}

	toResponse(): Response {
		// If visibility is "log", return generic message and log the real error
		if (this.visibility === "log") {
			console.error({
				compoundCode: this.compoundCode,
				message: this.message,
				cause: this.cause,
			});

			return Response.json(
				{
					error: {
						code: this.compoundCode ?? this.code,
						message:
							"Something went wrong. Please try again later.",
					},
				},
				{ status: this.httpStatus }
			);
		}

		return Response.json(
			{
				error: {
					code: this.compoundCode ?? this.code,
					message: this.userMessage,
				},
			},
			{ status: this.httpStatus }
		);
	}

	// Legacy static methods (preserved for backward compatibility)
	static unauthorized(message = "Authentication required"): BackpackError {
		return new BackpackError({
			code: ErrorCode.UNAUTHORIZED,
			message,
		});
	}

	static notFound(resource: string): BackpackError {
		return new BackpackError({
			code: ErrorCode.NOT_FOUND,
			message: `${resource} not found`,
		});
	}

	static badRequest(message: string): BackpackError {
		return new BackpackError({
			code: ErrorCode.BAD_REQUEST,
			message,
		});
	}

	static aiError(_message: string, cause?: unknown): BackpackError {
		return new BackpackError({
			code: ErrorCode.AI_PROVIDER_ERROR,
			message: "AI service temporarily unavailable",
			userMessage:
				"AI service temporarily unavailable. Please try again.",
			cause,
		});
	}

	static internal(message: string, cause?: unknown): BackpackError {
		return new BackpackError({
			code: ErrorCode.INTERNAL_ERROR,
			message,
			userMessage: "An unexpected error occurred. Please try again.",
			cause,
		});
	}

	// New surface-specific factory methods
	static chat(
		type: ErrorTypeValue,
		message: string,
		cause?: unknown
	): BackpackError {
		return BackpackError.fromSurface({
			type,
			surface: Surface.CHAT,
			message,
			cause,
			userMessage: getMessageByCompoundCode(`${type}:${Surface.CHAT}`),
		});
	}

	static database(message: string, cause?: unknown): BackpackError {
		return BackpackError.fromSurface({
			type: ErrorType.INTERNAL,
			surface: Surface.DATABASE,
			message,
			cause,
			userMessage: "A database error occurred. Please try again.",
		});
	}

	static api(
		type: ErrorTypeValue,
		message: string,
		cause?: unknown
	): BackpackError {
		return BackpackError.fromSurface({
			type,
			surface: Surface.API,
			message,
			cause,
			userMessage: getMessageByCompoundCode(`${type}:${Surface.API}`),
		});
	}

	static stream(message: string, cause?: unknown): BackpackError {
		return BackpackError.fromSurface({
			type: ErrorType.INTERNAL,
			surface: Surface.STREAM,
			message,
			cause,
			userMessage:
				"We're having trouble processing your request. Please try again.",
		});
	}
}

/**
 * Map error type to legacy error code for backward compatibility
 */
function mapTypeToLegacyCode(type: ErrorTypeValue): ErrorCodeType {
	const mapping: Record<ErrorTypeValue, ErrorCodeType> = {
		bad_request: ErrorCode.BAD_REQUEST,
		unauthorized: ErrorCode.UNAUTHORIZED,
		forbidden: ErrorCode.FORBIDDEN,
		not_found: ErrorCode.NOT_FOUND,
		conflict: ErrorCode.CONFLICT,
		too_many_requests: ErrorCode.TOO_MANY_REQUESTS,
		internal: ErrorCode.INTERNAL_ERROR,
		service_unavailable: ErrorCode.SERVICE_UNAVAILABLE,
		ai_error: ErrorCode.AI_PROVIDER_ERROR,
	};
	return mapping[type];
}

/**
 * Get user-friendly message by compound error code
 */
function getMessageByCompoundCode(code: CompoundErrorCode): string {
	const messages: Partial<Record<CompoundErrorCode, string>> = {
		"bad_request:api":
			"The request couldn't be processed. Please check your input.",
		"bad_request:chat": "Invalid chat request. Please try again.",
		"unauthorized:auth": "You need to sign in before continuing.",
		"unauthorized:chat":
			"You need to sign in to view this chat. Please sign in and try again.",
		"forbidden:chat":
			"This chat belongs to another user. Please check the chat ID.",
		"forbidden:space": "You don't have access to this space.",
		"not_found:chat":
			"The requested chat was not found. Please check the chat ID.",
		"not_found:space": "The requested space was not found.",
		"not_found:memory": "The requested memory was not found.",
		"internal:database":
			"An error occurred while accessing the database. Please try again.",
		"internal:stream":
			"We're having trouble processing your request. Please try again.",
		"ai_error:chat":
			"The AI service is temporarily unavailable. Please try again.",
	};

	return messages[code] ?? "Something went wrong. Please try again later.";
}

export function wrapError(
	error: unknown,
	fallbackMessage = "An unexpected error occurred"
): BackpackError {
	if (error instanceof BackpackError) {
		return error;
	}

	if (error instanceof TRPCError) {
		const code =
			error.code === "UNAUTHORIZED"
				? ErrorCode.UNAUTHORIZED
				: ErrorCode.INTERNAL_ERROR;
		return new BackpackError({
			code,
			message: error.message,
			cause: error,
		});
	}

	if (error instanceof Error) {
		return BackpackError.internal(error.message, error);
	}

	return BackpackError.internal(fallbackMessage, error);
}

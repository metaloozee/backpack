import { TRPCError } from "@trpc/server";

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

export class BackpackError extends Error {
	readonly code: ErrorCodeType;
	readonly httpStatus: number;
	readonly userMessage: string;

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

	toTRPCError(): TRPCError {
		return new TRPCError({
			code: trpcErrorMap[this.code],
			message: this.userMessage,
			cause: this,
		});
	}

	toResponse(): Response {
		return Response.json(
			{
				error: {
					code: this.code,
					message: this.userMessage,
				},
			},
			{ status: this.httpStatus }
		);
	}

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

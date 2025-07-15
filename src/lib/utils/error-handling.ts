import { TRPCError } from '@trpc/server';
import { ZodError } from 'zod';

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;

        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message: string) {
        super(message, 400);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = 'Resource not found') {
        super(message, 404);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized') {
        super(message, 401);
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = 'Forbidden') {
        super(message, 403);
    }
}

export class DatabaseError extends AppError {
    constructor(message: string = 'Database operation failed') {
        super(message, 500);
    }
}

export class ExternalServiceError extends AppError {
    constructor(message: string = 'External service error') {
        super(message, 502);
    }
}

// Error handler for API routes
export function handleApiError(error: unknown): Response {
    console.error('API Error:', error);

    if (error instanceof AppError) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: error.statusCode,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    if (error instanceof ZodError) {
        return new Response(
            JSON.stringify({
                error: 'Validation error',
                details: error.errors.map((e) => ({ path: e.path, message: e.message })),
            }),
            {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }

    // Generic error response
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
    });
}

// Error handler for tRPC
export function handleTRPCError(error: unknown): TRPCError {
    console.error('tRPC Error:', error);

    if (error instanceof AppError) {
        return new TRPCError({
            code: mapStatusToTRPCCode(error.statusCode),
            message: error.message,
        });
    }

    if (error instanceof ZodError) {
        return new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Validation error',
            cause: error,
        });
    }

    return new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
    });
}

function mapStatusToTRPCCode(statusCode: number): TRPCError['code'] {
    switch (statusCode) {
        case 400:
            return 'BAD_REQUEST';
        case 401:
            return 'UNAUTHORIZED';
        case 403:
            return 'FORBIDDEN';
        case 404:
            return 'NOT_FOUND';
        case 409:
            return 'CONFLICT';
        case 422:
            return 'UNPROCESSABLE_CONTENT';
        case 429:
            return 'TOO_MANY_REQUESTS';
        default:
            return 'INTERNAL_SERVER_ERROR';
    }
}

// Database operation wrapper with error handling
export async function safeDbOperation<T>(
    operation: () => Promise<T>,
    errorMessage: string = 'Database operation failed'
): Promise<T> {
    try {
        return await operation();
    } catch (error) {
        console.error('Database operation error:', error);
        throw new DatabaseError(errorMessage);
    }
}

// External service operation wrapper with error handling
export async function safeExternalOperation<T>(
    operation: () => Promise<T>,
    errorMessage: string = 'External service operation failed'
): Promise<T> {
    try {
        return await operation();
    } catch (error) {
        console.error('External service error:', error);
        throw new ExternalServiceError(errorMessage);
    }
}

// Validation wrapper
export function validateInput<T>(
    schema: any,
    input: unknown,
    errorMessage: string = 'Invalid input'
): T {
    try {
        return schema.parse(input);
    } catch (error) {
        if (error instanceof ZodError) {
            throw new ValidationError(
                `${errorMessage}: ${error.errors.map((e) => e.message).join(', ')}`
            );
        }
        throw new ValidationError(errorMessage);
    }
}

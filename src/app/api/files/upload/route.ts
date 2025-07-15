import { getSession } from '@/lib/auth/utils';
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
    handleApiError,
    safeExternalOperation,
    UnauthorizedError,
    ValidationError,
} from '@/lib/utils/error-handling';
import { sanitizeFileName } from '@/lib/utils/sanitization';

const FileSchema = z.object({
    file: z
        .instanceof(File)
        .refine((file) => file.size <= 5 * 1024 * 1024, {
            message: 'File size should be less than 5MB.',
        })
        .refine((file) => ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type), {
            message: 'Only JPEG and PNG images are allowed.',
        }),
});

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            throw new UnauthorizedError('Access denied');
        }

        if (request.body === null) {
            throw new ValidationError('Request body is empty');
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            throw new ValidationError('No file uploaded');
        }

        const validatedFile = FileSchema.safeParse({ file });
        if (!validatedFile.success) {
            const errorMessage = validatedFile.error.errors
                .map((error) => error.message)
                .join(', ');
            throw new ValidationError(errorMessage);
        }

        const sanitizedFileName = sanitizeFileName(file.name);
        const fileBuffer = await file.arrayBuffer();

        const data = await safeExternalOperation(
            () =>
                put(`${session.userId}/chat/${sanitizedFileName}`, fileBuffer, {
                    access: 'public',
                }),
            'File upload failed'
        );

        return NextResponse.json(data);
    } catch (error) {
        return handleApiError(error);
    }
}

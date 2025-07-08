import type { Attachment } from 'ai';

import { LoaderCircleIcon } from 'lucide-react';

export const PreviewAttachment = ({
    attachment,
    isUploading = false,
}: {
    attachment: Attachment;
    isUploading?: boolean;
}) => {
    const { name, url, contentType } = attachment;

    return (
        <div
            data-testid="input-attachment-preview"
            className="flex flex-row gap-2 justify-center items-center bg-transparent"
        >
            <div className="aspect-video w-16 h-9 bg-muted relative flex flex-col items-center justify-center rounded">
                {contentType ? (
                    contentType.startsWith('image') ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            key={url}
                            src={url}
                            alt={name ?? 'An image attachment'}
                            className="rounded size-full object-cover"
                        />
                    ) : (
                        <div className="" />
                    )
                ) : (
                    <div className="" />
                )}

                {isUploading && (
                    <div data-testid="input-attachment-loader" className="animate-spin absolute">
                        <LoaderCircleIcon className="size-4 animate-spin" />
                    </div>
                )}
            </div>
            {/* <div className="text-xs max-w-16 truncate">{name}</div> */}
        </div>
    );
};

import Image from "next/image";
import { Loader } from "@/components/ui/loader";
import type { Attachment } from "@/lib/ai/types";

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
			className="flex flex-row items-center justify-center gap-2 bg-transparent"
			data-testid="input-attachment-preview"
		>
			<div className="relative flex aspect-video h-9 w-16 flex-col items-center justify-center rounded bg-muted">
				{contentType ? (
					contentType.startsWith("image") ? (
						<Image
							alt={name ?? "An image attachment"}
							className="size-full rounded object-cover"
							fill
							key={url}
							sizes="64px"
							src={url}
						/>
					) : (
						<div className="" />
					)
				) : (
					<div className="" />
				)}

				{isUploading && (
					<div className="absolute" data-testid="input-attachment-loader">
						<Loader />
					</div>
				)}
			</div>
			{/* <div className="text-xs max-w-16 truncate">{name}</div> */}
		</div>
	);
};

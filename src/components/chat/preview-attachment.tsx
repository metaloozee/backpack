import { XIcon } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Attachment } from "@/lib/ai/types";

const imageNameRegex = /\.(png|jpe?g|gif|webp|bmp|svg)$/i;

export const PreviewAttachment = ({
	attachment,
	isUploading = false,
	onRemove,
	showName = false,
}: {
	attachment: Attachment;
	isUploading?: boolean;
	onRemove?: () => void;
	showName?: boolean;
}) => {
	const { name, url, contentType } = attachment;

	const isImage = (() => {
		if (contentType) {
			return contentType.startsWith("image");
		}
		if (name) {
			return imageNameRegex.test(name);
		}
		return false;
	})();

	const extension = (() => {
		if (name?.includes(".")) {
			const ext = name.split(".").pop();
			if (ext && ext.length < 10) {
				return ext.toUpperCase();
			}
		}
		if (contentType?.includes("/")) {
			return contentType.split("/")[1]?.toUpperCase() ?? "";
		}
		return "";
	})();

	return (
		<div
			className="flex flex-row items-center justify-center gap-2 bg-transparent"
			data-testid="input-attachment-preview"
		>
			<div className="relative flex aspect-video h-9 w-16 flex-col items-center justify-center overflow-hidden rounded bg-muted">
				{isImage && url ? (
					<Image
						alt={name ?? "An image attachment"}
						className="size-full rounded object-cover"
						fill
						key={url || name}
						sizes="120px"
						src={url}
					/>
				) : (
					<div className="flex size-full items-center justify-center">
						<span className="font-medium text-[10px] text-muted-foreground">{extension || "FILE"}</span>
					</div>
				)}
				{isUploading && (
					<div
						className="absolute inset-0 grid place-items-center bg-black/20"
						data-testid="input-attachment-loader"
					>
						<Loader />
					</div>
				)}
				{!!onRemove && !isUploading && (
					<div className="absolute top-1 right-1 z-20">
						<Button
							aria-label="Remove attachment"
							className="size-5 rounded"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								onRemove();
							}}
							size="icon"
							variant="ghost"
						>
							<span className="sr-only">Remove attachment</span>
							<XIcon className="size-3" />
						</Button>
					</div>
				)}
				{url && !isUploading && (
					<a className="absolute inset-0" href={url} rel="noreferrer" target="_blank">
						<span className="sr-only">Open attachment</span>
					</a>
				)}
			</div>
			{showName && name && (
				<div className="max-w-28 text-muted-foreground text-xs">
					<TooltipProvider delayDuration={200}>
						<Tooltip>
							<TooltipTrigger asChild>
								<div className="truncate">{name}</div>
							</TooltipTrigger>
							<TooltipContent side="top" sideOffset={8}>
								{name}
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
			)}
		</div>
	);
};

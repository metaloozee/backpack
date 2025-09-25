"use client";

import {
	BookOpenIcon,
	FileIcon,
	FileSpreadsheetIcon,
	FileTextIcon,
	ImageIcon,
	NotebookTabsIcon,
	PresentationIcon,
	VideoIcon,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Citation as CitationType } from "@/lib/hooks/use-citations";

type CitationProps = {
	citation: CitationType;
};

function FaviconIcon({ domain }: { domain: string }) {
	const [faviconError, setFaviconError] = useState(false);
	const [faviconLoaded, setFaviconLoaded] = useState(false);

	const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;

	if (faviconError) {
		return <NotebookTabsIcon className="mt-0.5 size-4 flex-shrink-0 fill-current" />;
	}

	return (
		<div className="relative mt-0.5 size-4 flex-shrink-0">
			{!faviconLoaded && <NotebookTabsIcon className="size-4 fill-current" />}
			<Image
				alt={`${domain} favicon`}
				className="size-4"
				height={16}
				onError={() => setFaviconError(true)}
				onLoad={() => setFaviconLoaded(true)}
				sizes="16px"
				src={faviconUrl}
				style={{ display: faviconLoaded ? "block" : "none" }}
				width={16}
			/>
		</div>
	);
}

function isKnowledgeBaseDocument(url: string, titleLower: string): boolean {
	return (
		url.includes("/knowledge/") ||
		url.startsWith("kb:") ||
		url.includes("/space/") ||
		titleLower.includes("knowledge base") ||
		titleLower.includes("internal doc") ||
		titleLower.includes("company doc") ||
		titleLower.includes("internal policy") ||
		titleLower.includes("company policy") ||
		titleLower.includes("internal guide") ||
		titleLower.includes("company guide") ||
		titleLower.includes("documentation") ||
		titleLower.includes("manual") ||
		titleLower.includes("handbook") ||
		(titleLower.includes("policy") && !url.includes("wikipedia")) ||
		(titleLower.includes("guideline") && !url.includes("wikipedia")) ||
		(titleLower.includes("procedure") && !url.includes("wikipedia"))
	);
}

function isPdfDocument(urlLower: string, titleLower: string): boolean {
	return urlLower.includes(".pdf") || titleLower.includes("pdf");
}

function isWordDocument(urlLower: string, titleLower: string): boolean {
	return urlLower.includes(".doc") || urlLower.includes(".docx") || titleLower.includes("word");
}

function isSpreadsheetDocument(urlLower: string, titleLower: string): boolean {
	return (
		urlLower.includes(".xls") ||
		urlLower.includes(".xlsx") ||
		urlLower.includes(".csv") ||
		titleLower.includes("excel") ||
		titleLower.includes("spreadsheet")
	);
}

function isPresentationDocument(urlLower: string, titleLower: string): boolean {
	return (
		urlLower.includes(".ppt") ||
		urlLower.includes(".pptx") ||
		titleLower.includes("powerpoint") ||
		titleLower.includes("presentation")
	);
}

function isImageDocument(urlLower: string, titleLower: string): boolean {
	return (
		urlLower.includes(".jpg") ||
		urlLower.includes(".jpeg") ||
		urlLower.includes(".png") ||
		urlLower.includes(".gif") ||
		urlLower.includes(".svg") ||
		urlLower.includes(".webp") ||
		titleLower.includes("image") ||
		titleLower.includes("photo")
	);
}

function isVideoDocument(urlLower: string, titleLower: string): boolean {
	return (
		urlLower.includes(".mp4") ||
		urlLower.includes(".avi") ||
		urlLower.includes(".mov") ||
		urlLower.includes(".webm") ||
		titleLower.includes("video")
	);
}

function DocumentIcon({ url, title }: { url: string; title: string }) {
	const urlLower = url.toLowerCase();
	const titleLower = title.toLowerCase();

	if (isPdfDocument(urlLower, titleLower)) {
		return <FileIcon className="mt-0.5 size-4 flex-shrink-0 fill-current text-red-500" />;
	}

	if (isWordDocument(urlLower, titleLower)) {
		return <FileTextIcon className="mt-0.5 size-4 flex-shrink-0 fill-current text-blue-600" />;
	}

	if (isSpreadsheetDocument(urlLower, titleLower)) {
		return <FileSpreadsheetIcon className="mt-0.5 size-4 flex-shrink-0 fill-current text-green-600" />;
	}

	if (isPresentationDocument(urlLower, titleLower)) {
		return <PresentationIcon className="mt-0.5 size-4 flex-shrink-0 fill-current text-orange-600" />;
	}

	if (isImageDocument(urlLower, titleLower)) {
		return <ImageIcon className="mt-0.5 size-4 flex-shrink-0 fill-current text-purple-600" />;
	}

	if (isVideoDocument(urlLower, titleLower)) {
		return <VideoIcon className="mt-0.5 size-4 flex-shrink-0 fill-current text-red-600" />;
	}

	if (isKnowledgeBaseDocument(url, titleLower)) {
		return <BookOpenIcon className="mt-0.5 size-4 flex-shrink-0 fill-current text-emerald-600" />;
	}

	return <FileIcon className="mt-0.5 size-4 flex-shrink-0 fill-current text-gray-500" />;
}

export function Citation({ citation }: CitationProps) {
	const handleClick = () => {
		window.open(citation.url, "_blank", "noopener,noreferrer");
	};

	const handleKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			handleClick();
		}
	};

	const domain = (() => {
		try {
			return new URL(citation.url).hostname;
		} catch {
			return citation.url;
		}
	})();

	const isWebUrl = citation.url.startsWith("http://") || citation.url.startsWith("https://");
	const urlLower = citation.url.toLowerCase();
	const titleLower = citation.title.toLowerCase();

	const isDocument =
		!isWebUrl ||
		urlLower.includes(".pdf") ||
		urlLower.includes(".doc") ||
		urlLower.includes(".docx") ||
		urlLower.includes(".xls") ||
		urlLower.includes(".xlsx") ||
		urlLower.includes(".csv") ||
		urlLower.includes(".ppt") ||
		urlLower.includes(".pptx") ||
		urlLower.includes(".txt") ||
		urlLower.includes(".jpg") ||
		urlLower.includes(".jpeg") ||
		urlLower.includes(".png") ||
		urlLower.includes(".gif") ||
		urlLower.includes(".svg") ||
		urlLower.includes(".webp") ||
		urlLower.includes(".mp4") ||
		urlLower.includes(".avi") ||
		urlLower.includes(".mov") ||
		citation.url.includes("/knowledge/") ||
		citation.url.includes("/space/") ||
		citation.url.startsWith("kb:") ||
		titleLower.includes("knowledge base") ||
		titleLower.includes("internal doc") ||
		titleLower.includes("company doc") ||
		titleLower.includes("internal policy") ||
		titleLower.includes("company policy") ||
		titleLower.includes("internal guide") ||
		titleLower.includes("company guide") ||
		titleLower.includes("documentation") ||
		titleLower.includes("manual") ||
		titleLower.includes("guide") ||
		titleLower.includes("handbook") ||
		(titleLower.includes("policy") && !urlLower.includes("wikipedia")) ||
		(titleLower.includes("guideline") && !urlLower.includes("wikipedia")) ||
		(titleLower.includes("procedure") && !urlLower.includes("wikipedia"));

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					aria-label={`Open citation: ${citation.title}`}
					className="mx-0.5 inline-flex h-5 min-w-[1.2rem] cursor-pointer items-center justify-center rounded-full border px-1 font-medium text-blue-400 text-xs transition-colors hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
					onClick={handleClick}
					onKeyDown={handleKeyDown}
					type="button"
				>
					{citation.id}
				</button>
			</TooltipTrigger>
			<TooltipContent className="max-w-xs space-y-2 border bg-background p-3" sideOffset={10}>
				<div className="flex items-start gap-2 text-primary">
					{isDocument ? (
						<DocumentIcon title={citation.title} url={citation.url} />
					) : (
						<FaviconIcon domain={domain} />
					)}
					<div className="space-y-1">
						<p className="font-medium text-sm leading-tight">{citation.title}</p>
						<p className="text-xs">{domain}</p>
						{citation.content && <p className="line-clamp-3 text-xs">{citation.content}</p>}
					</div>
				</div>
			</TooltipContent>
		</Tooltip>
	);
}

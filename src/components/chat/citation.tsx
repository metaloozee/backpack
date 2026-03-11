"use client";

import {
	InlineCitation,
	InlineCitationCard,
	InlineCitationCardBody,
	InlineCitationCardTrigger,
	InlineCitationCarousel,
	InlineCitationCarouselContent,
	InlineCitationCarouselHeader,
	InlineCitationCarouselIndex,
	InlineCitationCarouselItem,
	InlineCitationCarouselNext,
	InlineCitationCarouselPrev,
	InlineCitationSource,
} from "@/components/ai-elements/inline-citation";
import type { CitationSource } from "@/lib/streamdown";

const FALLBACK_DISPLAY_URL = "https://source.local";

function parseCitationItems(itemsBase64: string): CitationSource[] {
	try {
		const decoded = atob(itemsBase64);
		const bytes = new Uint8Array(decoded.length);
		for (let i = 0; i < decoded.length; i++) {
			bytes[i] = decoded.charCodeAt(i);
		}
		const json = new TextDecoder().decode(bytes);
		const parsed = JSON.parse(json) as CitationSource[];
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function safeUrlForTrigger(url: string | undefined): string {
	if (!url || typeof url !== "string" || url.trim() === "") {
		return FALLBACK_DISPLAY_URL;
	}
	try {
		new URL(url);
		return url;
	} catch {
		return FALLBACK_DISPLAY_URL;
	}
}

function stableCitationKey(
	sources: CitationSource[],
	itemsBase64: string | undefined,
	scalarId: string | undefined
): string {
	const candidate =
		scalarId ?? sources[0]?.id ?? sources[0]?.url ?? sources[0]?.title;
	if (candidate) {
		return candidate;
	}
	const content = itemsBase64 ?? JSON.stringify(sources);
	const h = [...content].reduce(
		(acc, char) => acc * 31 + char.charCodeAt(0),
		0
	);
	return `citation-${Math.abs(h).toString(36)}`;
}

export function Citation({
	id,
	url,
	title,
	description,
	items: itemsBase64,
}: {
	id?: string;
	url?: string;
	title?: string;
	description?: string;
	items?: string;
}) {
	const sources: CitationSource[] =
		itemsBase64 && itemsBase64.length > 0
			? parseCitationItems(itemsBase64)
			: [{ description, id, title, url }].filter(
					(s) => s.title || s.url || s.description
				);

	if (sources.length === 0) {
		return null;
	}

	const triggerUrls = sources.map((s) => safeUrlForTrigger(s.url));
	const citationKey = stableCitationKey(sources, itemsBase64, id);

	return (
		<InlineCitation key={citationKey}>
			<InlineCitationCard closeDelay={300} openDelay={0}>
				<InlineCitationCardTrigger sources={triggerUrls} />
				<InlineCitationCardBody>
					<InlineCitationCarousel>
						<InlineCitationCarouselHeader>
							<InlineCitationCarouselPrev />
							<InlineCitationCarouselNext />
							<InlineCitationCarouselIndex />
						</InlineCitationCarouselHeader>
						<InlineCitationCarouselContent>
							{sources.map((source, index) => (
								<InlineCitationCarouselItem
									key={
										source.id ??
										source.url ??
										`source-${index}`
									}
								>
									<InlineCitationSource
										description={source.description}
										title={source.title}
										url={source.url}
									/>
								</InlineCitationCarouselItem>
							))}
						</InlineCitationCarouselContent>
					</InlineCitationCarousel>
				</InlineCitationCardBody>
			</InlineCitationCard>
		</InlineCitation>
	);
}

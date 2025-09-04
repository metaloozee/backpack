"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { useCitations } from "@/lib/hooks/use-citations";
import { Citation } from "./citation";

type CitationProcessorProps = {
	content: string;
};

export function CitationProcessor({ content }: CitationProcessorProps) {
	const { processedContent, citations } = useCitations(content);

	const renderContentWithCitations = (text: string) => {
		const citationRegex = /\[(\d+)\]/g;
		const parts: React.ReactNode[] = [];
		let lastIndex = 0;
		let match: RegExpExecArray | null;

		match = citationRegex.exec(text);
		while (match !== null) {
			if (match.index > lastIndex) {
				parts.push(text.slice(lastIndex, match.index));
			}

			const citationId = Number.parseInt(match[1], 10);
			const citation = citations.find((c) => c.id === citationId);

			if (citation) {
				parts.push(<Citation citation={citation} key={`citation-${citation.id}-${match.index}`} />);
			} else {
				parts.push(match[0]);
			}

			lastIndex = match.index + match[0].length;
			match = citationRegex.exec(text);
		}

		if (lastIndex < text.length) {
			parts.push(text.slice(lastIndex));
		}

		return parts;
	};

	return (
		<TooltipProvider>
			<span>{renderContentWithCitations(processedContent)}</span>
		</TooltipProvider>
	);
}

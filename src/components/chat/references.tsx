"use client";

import { ExternalLinkIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import type { Citation as CitationType } from "@/lib/hooks/use-citations";

type ReferencesProps = {
	citations: CitationType[];
};

export function References({ citations }: ReferencesProps) {
	if (citations.length === 0) {
		return null;
	}

	return (
		<div className="mt-6 pt-4">
			<Separator className="mb-4" />
			<h4 className="mb-3 font-medium text-muted-foreground text-sm">References</h4>
			<div className="space-y-2">
				{citations.map((citation) => (
					<div className="flex items-start gap-2 text-xs" key={citation.id}>
						<span className="w-6 flex-shrink-0 text-muted-foreground">[{citation.id}]</span>
						<div className="flex-1">
							<a
								className="inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400"
								href={citation.url}
								rel="noopener noreferrer"
								target="_blank"
							>
								{citation.title}
								<ExternalLinkIcon className="h-3 w-3" />
							</a>
							<div className="mt-0.5 text-muted-foreground">
								{(() => {
									try {
										return new URL(citation.url).hostname;
									} catch {
										return citation.url;
									}
								})()}
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

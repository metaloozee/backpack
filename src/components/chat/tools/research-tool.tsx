"use client";

import { BrainIcon } from "lucide-react";
import { Loader } from "@/components/ui/loader";

type ResearchToolProps = {
	toolCallId: string;
	input?: {
		query?: string;
	};
	output?: unknown;
};

export function ResearchTool({ input, output }: ResearchToolProps) {
	if (output) {
		return (
			<div className="flex max-w-fit items-center gap-2 rounded-md border bg-muted px-4 py-2 text-xs">
				<BrainIcon className="size-3" />
				Research Plan Generated
			</div>
		);
	}

	return (
		<div className="flex max-w-fit items-center gap-2 rounded-md border bg-muted px-4 py-2 text-xs">
			<Loader size="sm" />
			{input?.query ? `Generating Research Plan for: "${input.query}"` : "Generating Research Plan..."}
		</div>
	);
}

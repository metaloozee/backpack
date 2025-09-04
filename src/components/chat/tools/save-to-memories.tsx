"use client";

import { Brain } from "lucide-react";
import { Loader } from "@/components/ui/loader";

type SaveToMemoriesToolProps = {
	toolCallId: string;
	input?: {
		contents?: string[];
	};
	output?: {
		saved_count: number;
		total_count: number;
	};
};

export function SaveToMemoriesTool({ output }: SaveToMemoriesToolProps) {
	if (output) {
		return (
			<div className="w-full rounded-md border bg-neutral-900 px-4 py-3">
				<div className="flex w-full flex-row items-center gap-2">
					<Brain className="size-3" />
					<span className="truncate text-xs">
						{`Saved ${output?.saved_count ?? 0} of ${output?.total_count ?? 0} memories`}
					</span>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full rounded-md border bg-neutral-900 px-4 py-3">
			<div className="flex w-full flex-row items-center gap-2">
				<Loader size="sm" />
				<span className="text-neutral-400 text-xs">Saving memories...</span>
			</div>
		</div>
	);
}

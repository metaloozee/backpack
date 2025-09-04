"use client";

import { PickaxeIcon } from "lucide-react";
import { Loader } from "@/components/ui/loader";

type ExtractResult = {
	url: string;
	images?: string[];
	content: string;
};

type ExtractToolProps = {
	toolCallId: string;
	input?: {
		urls?: string[];
	};
	output?: ExtractResult[];
};

export function ExtractTool({ toolCallId, input, output }: ExtractToolProps) {
	if (output) {
		return (
			<div className="w-full rounded-md border bg-neutral-900 px-4 py-3">
				<div className="flex w-full flex-col gap-2">
					{output?.map((result) => (
						<div className="flex w-full flex-col gap-2" key={`${toolCallId}-${result.url}`}>
							<div className="flex w-full shrink-0 flex-row items-center justify-start gap-2">
								<PickaxeIcon className="size-3" />
								<span className="truncate text-xs">{result.url}</span>
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="w-full rounded-md border bg-neutral-900 px-4 py-3">
			<div className="flex w-full flex-col gap-2">
				{input?.urls?.map((url) => (
					<div className="flex w-full flex-col gap-2" key={`${toolCallId}-${url}`}>
						<div className="flex w-full shrink-0 flex-row items-center justify-start gap-2">
							<Loader size="sm" />
							<span className="truncate text-neutral-400 text-xs">{url}</span>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

"use client";

import { FileTextIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ArtifactCardProps {
	artifactId: string;
	title: string;
	versionNumber?: number;
	onOpen: (artifactId: string) => void;
}

export function ArtifactCard({
	artifactId,
	title,
	versionNumber,
	onOpen,
}: ArtifactCardProps) {
	return (
		<div className="flex w-full items-center justify-between gap-3 rounded-md border bg-card px-4 py-3 dark:bg-neutral-900">
			<div className="flex min-w-0 items-center gap-3">
				<div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
					<FileTextIcon className="size-4" />
				</div>
				<div className="min-w-0">
					<div className="truncate font-medium text-sm">{title}</div>
					<div className="text-muted-foreground text-xs">
						Text artifact
						{versionNumber ? ` · Version ${versionNumber}` : ""}
					</div>
				</div>
			</div>
			<Button
				onClick={() => {
					onOpen(artifactId);
				}}
				size="sm"
				type="button"
				variant="outline"
			>
				Open
			</Button>
		</div>
	);
}

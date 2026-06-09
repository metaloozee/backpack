"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ArtifactSelectorItem {
	id: string;
	title: string;
}

interface ArtifactSelectorProps {
	artifacts: ArtifactSelectorItem[];
	value: string;
	onValueChange: (artifactId: string) => void;
	className?: string;
}

export function ArtifactSelector({
	artifacts,
	value,
	onValueChange,
	className,
}: ArtifactSelectorProps) {
	if (artifacts.length <= 1) {
		return null;
	}

	return (
		<Select onValueChange={onValueChange} value={value}>
			<SelectTrigger
				className={cn("w-full min-w-0 max-w-64", className)}
				size="sm"
			>
				<SelectValue placeholder="Select artifact" />
			</SelectTrigger>
			<SelectContent>
				{artifacts.map((item) => (
					<SelectItem key={item.id} value={item.id}>
						{item.title}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

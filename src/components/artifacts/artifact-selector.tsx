"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface ArtifactSelectorItem {
	id: string;
	title: string;
}

interface ArtifactSelectorProps {
	artifacts: ArtifactSelectorItem[];
	value: string;
	onValueChange: (artifactId: string) => void;
}

export function ArtifactSelector({
	artifacts,
	value,
	onValueChange,
}: ArtifactSelectorProps) {
	if (artifacts.length <= 1) {
		return null;
	}

	return (
		<Select onValueChange={onValueChange} value={value}>
			<SelectTrigger className="max-w-48" size="sm">
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

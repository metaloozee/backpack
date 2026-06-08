"use client";

import { DownloadIcon, RotateCcwIcon, SaveIcon, XIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Streamdown } from "streamdown";
import { ArtifactVersionDiff } from "@/components/artifacts/artifact-version-diff";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { Artifact, ArtifactVersion } from "@/lib/db/schema/app";
import { streamdownPlugins } from "@/lib/streamdown";
import { cn } from "@/lib/utils";

type ArtifactStatus = "idle" | "streaming";

interface TextArtifactProps {
	artifact: Artifact;
	versions: ArtifactVersion[];
	content: string;
	status: ArtifactStatus;
	onChangeContent: (content: string) => void;
	onSave: (content: string, baseVersionNumber?: number) => Promise<void>;
	onRename: (title: string) => Promise<void>;
	onRestore: (versionId: string) => Promise<void>;
	onClose: () => void;
}

const sanitizeFilename = (value: string): string => {
	const cleaned = value
		.trim()
		.replace(/[^a-zA-Z0-9-_ ]/g, "")
		.replace(/\s+/g, "-")
		.toLowerCase();

	return cleaned || "artifact";
};

const downloadMarkdown = ({
	title,
	content,
}: {
	title: string;
	content: string;
}) => {
	const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = `${sanitizeFilename(title)}.md`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
};

export function TextArtifact({
	artifact,
	versions,
	content,
	status,
	onChangeContent,
	onSave,
	onRename,
	onRestore,
	onClose,
}: TextArtifactProps) {
	const [tab, setTab] = useState("edit");
	const [titleDraft, setTitleDraft] = useState(artifact.title);
	const [isRenaming, setIsRenaming] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [isRestoring, setIsRestoring] = useState(false);
	const sortedVersions = useMemo(
		() => [...versions].sort((a, b) => b.versionNumber - a.versionNumber),
		[versions]
	);
	const latestVersion = sortedVersions[0];
	const previousVersion = sortedVersions[1] ?? latestVersion;
	const [fromVersionId, setFromVersionId] = useState<string | undefined>(
		previousVersion?.id
	);
	const [toVersionId, setToVersionId] = useState<string | undefined>(
		latestVersion?.id
	);
	const isDirty = latestVersion
		? content !== latestVersion.content
		: content.trim().length > 0;
	let versionStatusLabel = "Draft";
	if (status === "streaming") {
		versionStatusLabel = "Streaming";
	} else if (latestVersion) {
		versionStatusLabel = `Version ${latestVersion.versionNumber}`;
	}

	useEffect(() => {
		setTitleDraft(artifact.title);
	}, [artifact.title]);

	useEffect(() => {
		if (!fromVersionId && previousVersion) {
			setFromVersionId(previousVersion.id);
		}
		if (!toVersionId && latestVersion) {
			setToVersionId(latestVersion.id);
		}
	}, [fromVersionId, latestVersion, previousVersion, toVersionId]);

	const fromVersion = sortedVersions.find(
		(item) => item.id === fromVersionId
	);
	const toVersion = sortedVersions.find((item) => item.id === toVersionId);

	const handleSave = async () => {
		setIsSaving(true);
		try {
			await onSave(content, latestVersion?.versionNumber);
		} finally {
			setIsSaving(false);
		}
	};

	const handleRename = async () => {
		const nextTitle = titleDraft.trim();
		if (!nextTitle || nextTitle === artifact.title) {
			setIsRenaming(false);
			setTitleDraft(artifact.title);
			return;
		}

		await onRename(nextTitle);
		setIsRenaming(false);
	};

	const handleRestore = async () => {
		if (!fromVersion) {
			return;
		}
		setIsRestoring(true);
		try {
			await onRestore(fromVersion.id);
		} finally {
			setIsRestoring(false);
		}
	};
	const requestRename = () => {
		handleRename().catch(() => {
			setIsRenaming(false);
			setTitleDraft(artifact.title);
		});
	};
	const requestSave = () => {
		handleSave().catch(() => {
			setIsSaving(false);
		});
	};
	const requestRestore = () => {
		handleRestore().catch(() => {
			setIsRestoring(false);
		});
	};

	return (
		<div className="flex h-full min-h-0 flex-col bg-background">
			<div className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-b px-4">
				<div className="min-w-0 flex-1">
					{isRenaming ? (
						<input
							aria-label="Artifact title"
							className="w-full rounded-md border bg-background px-2 py-1 font-medium text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
							onBlur={requestRename}
							onChange={(event) =>
								setTitleDraft(event.target.value)
							}
							onKeyDown={(event) => {
								if (event.key === "Enter") {
									requestRename();
								}
								if (event.key === "Escape") {
									setIsRenaming(false);
									setTitleDraft(artifact.title);
								}
							}}
							value={titleDraft}
						/>
					) : (
						<button
							className="block max-w-full truncate text-left font-medium text-sm"
							onClick={() => setIsRenaming(true)}
							type="button"
						>
							{artifact.title}
						</button>
					)}
					<div className="text-muted-foreground text-xs">
						{versionStatusLabel}
						{isDirty ? " · Unsaved" : ""}
					</div>
				</div>
				<div className="flex shrink-0 items-center gap-1">
					<CopyButton size="sm" value={content} />
					<Button
						aria-label="Download markdown"
						onClick={() =>
							downloadMarkdown({
								title: artifact.title,
								content,
							})
						}
						size="icon"
						type="button"
						variant="ghost"
					>
						<DownloadIcon className="size-4" />
					</Button>
					<Button
						aria-label="Save artifact"
						disabled={
							!isDirty || isSaving || status === "streaming"
						}
						onClick={requestSave}
						size="icon"
						type="button"
						variant="ghost"
					>
						<SaveIcon className="size-4" />
					</Button>
					<Button
						aria-label="Close artifact"
						onClick={onClose}
						size="icon"
						type="button"
						variant="ghost"
					>
						<XIcon className="size-4" />
					</Button>
				</div>
			</div>

			<Tabs
				className="min-h-0 flex-1 overflow-hidden px-4 pt-3 pb-4"
				onValueChange={setTab}
				value={tab}
			>
				<div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
					<TabsList>
						<TabsTrigger value="edit">Edit</TabsTrigger>
						<TabsTrigger value="preview">Preview</TabsTrigger>
						<TabsTrigger value="diff">Diff</TabsTrigger>
					</TabsList>
					{tab === "diff" && sortedVersions.length > 0 ? (
						<div className="flex flex-wrap items-center gap-2">
							<VersionSelect
								label="From"
								onValueChange={setFromVersionId}
								value={fromVersionId}
								versions={sortedVersions}
							/>
							<VersionSelect
								label="To"
								onValueChange={setToVersionId}
								value={toVersionId}
								versions={sortedVersions}
							/>
							<Button
								disabled={!fromVersion || isRestoring}
								onClick={requestRestore}
								size="sm"
								type="button"
								variant="outline"
							>
								<RotateCcwIcon className="size-3.5" />
								Restore from
							</Button>
						</div>
					) : null}
				</div>

				<TabsContent
					className="mt-3 min-h-0 flex-1 overflow-hidden"
					value="edit"
				>
					<Textarea
						className={cn(
							"h-full min-h-0 resize-none overflow-auto font-mono text-sm leading-6",
							status === "streaming" && "opacity-80"
						)}
						onChange={(event) =>
							onChangeContent(event.target.value)
						}
						value={content}
					/>
				</TabsContent>
				<TabsContent
					className="mt-3 min-h-0 flex-1 overflow-hidden"
					value="preview"
				>
					<div className="h-full min-h-0 overflow-auto overscroll-contain rounded-md border bg-card px-5 py-4 dark:bg-neutral-900">
						<Streamdown plugins={streamdownPlugins}>
							{content}
						</Streamdown>
					</div>
				</TabsContent>
				<TabsContent
					className="mt-3 min-h-0 flex-1 overflow-hidden"
					value="diff"
				>
					{fromVersion && toVersion ? (
						<ArtifactVersionDiff
							fromVersion={fromVersion}
							title={artifact.title}
							toVersion={toVersion}
						/>
					) : (
						<div className="flex h-full min-h-0 items-center justify-center rounded-md border text-muted-foreground text-sm">
							Save at least one version to compare changes.
						</div>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}

function VersionSelect({
	label,
	value,
	versions,
	onValueChange,
}: {
	label: string;
	value?: string;
	versions: ArtifactVersion[];
	onValueChange: (value: string) => void;
}) {
	return (
		<div className="flex items-center gap-2">
			<span className="text-muted-foreground text-xs">{label}</span>
			<Select onValueChange={onValueChange} value={value}>
				<SelectTrigger className="w-32" size="sm">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{versions.map((version) => (
						<SelectItem key={version.id} value={version.id}>
							Version {version.versionNumber}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}

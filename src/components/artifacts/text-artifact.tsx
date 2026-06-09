"use client";

import { useQuery } from "@tanstack/react-query";
import { DownloadIcon, RotateCcwIcon, SaveIcon, XIcon } from "lucide-react";
import { useReducer } from "react";
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
import type { ArtifactVersionSummary } from "@/lib/artifacts/types";
import type { Artifact, ArtifactVersion } from "@/lib/db/schema/app";
import { streamdownPlugins } from "@/lib/streamdown";
import { useTRPC } from "@/lib/trpc/trpc";
import { cn } from "@/lib/utils/cn";

type ArtifactStatus = "idle" | "streaming";

interface TextArtifactState {
	diffSelection: {
		fromVersionId?: string;
		toVersionId?: string;
	};
	isRestoring: boolean;
	isSaving: boolean;
	renameDraft: string | null;
	tab: string;
}

type TextArtifactAction =
	| { type: "setTab"; tab: string }
	| { type: "setRenameDraft"; renameDraft: string | null }
	| { type: "setIsSaving"; isSaving: boolean }
	| { type: "setIsRestoring"; isRestoring: boolean }
	| { type: "setFromVersionId"; fromVersionId: string }
	| { type: "setToVersionId"; toVersionId: string };

const initialTextArtifactState: TextArtifactState = {
	tab: "edit",
	renameDraft: null,
	isSaving: false,
	isRestoring: false,
	diffSelection: {},
};

const textArtifactReducer = (
	state: TextArtifactState,
	action: TextArtifactAction
): TextArtifactState => {
	switch (action.type) {
		case "setTab":
			return { ...state, tab: action.tab };
		case "setRenameDraft":
			return { ...state, renameDraft: action.renameDraft };
		case "setIsSaving":
			return { ...state, isSaving: action.isSaving };
		case "setIsRestoring":
			return { ...state, isRestoring: action.isRestoring };
		case "setFromVersionId":
			return {
				...state,
				diffSelection: {
					...state.diffSelection,
					fromVersionId: action.fromVersionId,
				},
			};
		case "setToVersionId":
			return {
				...state,
				diffSelection: {
					...state.diffSelection,
					toVersionId: action.toVersionId,
				},
			};
		default:
			return state;
	}
};

interface TextArtifactProps {
	artifact: Artifact;
	content: string;
	latestVersion: ArtifactVersion | null;
	onChangeContent: (content: string) => void;
	onClose: () => void;
	onRename: (title: string) => Promise<void>;
	onRestore: (versionId: string) => Promise<void>;
	onSave: (content: string, baseVersionNumber?: number) => Promise<void>;
	status: ArtifactStatus;
	versions: ArtifactVersionSummary[];
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
	latestVersion,
	content,
	status,
	onChangeContent,
	onSave,
	onRename,
	onRestore,
	onClose,
}: TextArtifactProps) {
	const [state, dispatch] = useReducer(
		textArtifactReducer,
		initialTextArtifactState
	);
	const { diffSelection, isRestoring, isSaving, renameDraft, tab } = state;
	const sortedVersions = versions.toSorted(
		(a, b) => b.versionNumber - a.versionNumber
	);
	const previousVersion = sortedVersions[1] ?? latestVersion;
	const fromVersionId = versionExists(
		sortedVersions,
		diffSelection.fromVersionId
	)
		? diffSelection.fromVersionId
		: previousVersion?.id;
	const toVersionId = versionExists(sortedVersions, diffSelection.toVersionId)
		? diffSelection.toVersionId
		: latestVersion?.id;
	const isDirty = latestVersion
		? content !== latestVersion.content
		: content.trim().length > 0;
	const isRenaming = renameDraft !== null;
	const visibleTitleDraft = renameDraft ?? artifact.title;
	const versionStatusLabel = getVersionStatusLabel({
		latestVersion,
		status,
	});

	const fromVersion = sortedVersions.find(
		(item) => item.id === fromVersionId
	);
	const toVersion = sortedVersions.find((item) => item.id === toVersionId);

	const handleSave = async () => {
		dispatch({ type: "setIsSaving", isSaving: true });
		await onSave(content, latestVersion?.versionNumber).finally(() => {
			dispatch({ type: "setIsSaving", isSaving: false });
		});
	};

	const handleRename = async () => {
		const nextTitle = visibleTitleDraft.trim();
		if (!nextTitle || nextTitle === artifact.title) {
			dispatch({ type: "setRenameDraft", renameDraft: null });
			return;
		}

		await onRename(nextTitle);
		dispatch({ type: "setRenameDraft", renameDraft: null });
	};

	const handleRestore = async () => {
		if (!fromVersion) {
			return;
		}
		dispatch({ type: "setIsRestoring", isRestoring: true });
		await onRestore(fromVersion.id).finally(() => {
			dispatch({ type: "setIsRestoring", isRestoring: false });
		});
	};
	const requestRename = () => {
		handleRename().catch(() => {
			dispatch({ type: "setRenameDraft", renameDraft: null });
		});
	};
	const requestSave = () => {
		handleSave().catch(() => {
			dispatch({ type: "setIsSaving", isSaving: false });
		});
	};
	const requestRestore = () => {
		handleRestore().catch(() => {
			dispatch({ type: "setIsRestoring", isRestoring: false });
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
								dispatch({
									type: "setRenameDraft",
									renameDraft: event.target.value,
								})
							}
							onKeyDown={(event) => {
								if (event.key === "Enter") {
									event.preventDefault();
									requestRename();
								}
								if (event.key === "Escape") {
									dispatch({
										type: "setRenameDraft",
										renameDraft: null,
									});
								}
							}}
							value={visibleTitleDraft}
						/>
					) : (
						<button
							className="block max-w-full truncate text-left font-medium text-sm"
							onClick={() =>
								dispatch({
									type: "setRenameDraft",
									renameDraft: artifact.title,
								})
							}
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
				onValueChange={(nextTab) =>
					dispatch({ type: "setTab", tab: nextTab })
				}
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
								onValueChange={(value) =>
									dispatch({
										type: "setFromVersionId",
										fromVersionId: value,
									})
								}
								value={fromVersionId}
								versions={sortedVersions}
							/>
							<VersionSelect
								label="To"
								onValueChange={(value) =>
									dispatch({
										type: "setToVersionId",
										toVersionId: value,
									})
								}
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
					<DiffContent
						artifactId={artifact.id}
						fromVersion={fromVersion}
						isActive={tab === "diff"}
						title={artifact.title}
						toVersion={toVersion}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}

function getVersionStatusLabel({
	latestVersion,
	status,
}: {
	latestVersion: ArtifactVersion | null;
	status: ArtifactStatus;
}): string {
	if (status === "streaming") {
		return "Streaming";
	}
	if (latestVersion) {
		return `Version ${latestVersion.versionNumber}`;
	}
	return "Draft";
}

function DiffContent({
	artifactId,
	fromVersion,
	isActive,
	title,
	toVersion,
}: {
	artifactId: string;
	fromVersion?: ArtifactVersionSummary;
	isActive: boolean;
	title: string;
	toVersion?: ArtifactVersionSummary;
}) {
	const trpc = useTRPC();
	const { data: versionPairData, isError: isVersionPairError } = useQuery({
		...trpc.artifact.getVersionPair.queryOptions({
			artifactId,
			fromVersionId:
				fromVersion?.id ?? "00000000-0000-0000-0000-000000000000",
			toVersionId:
				toVersion?.id ?? "00000000-0000-0000-0000-000000000000",
		}),
		enabled: isActive && Boolean(fromVersion && toVersion),
	});

	if (!(fromVersion && toVersion)) {
		return (
			<div className="flex h-full min-h-0 items-center justify-center rounded-md border text-muted-foreground text-sm">
				Save at least one version to compare changes.
			</div>
		);
	}

	if (!versionPairData) {
		return (
			<div className="flex h-full min-h-0 items-center justify-center rounded-md border text-muted-foreground text-sm">
				{isVersionPairError
					? "Unable to load diff."
					: "Loading diff..."}
			</div>
		);
	}

	return (
		<ArtifactVersionDiff
			fromVersion={versionPairData.fromVersion}
			title={title}
			toVersion={versionPairData.toVersion}
		/>
	);
}

function versionExists(
	versions: ArtifactVersionSummary[],
	versionId?: string
): versionId is string {
	return Boolean(versionId && versions.some((item) => item.id === versionId));
}

function VersionSelect({
	label,
	value,
	versions,
	onValueChange,
}: {
	label: string;
	value?: string;
	versions: ArtifactVersionSummary[];
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

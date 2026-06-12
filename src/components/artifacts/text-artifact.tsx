"use client";

import { useQuery } from "@tanstack/react-query";
import {
	DiffIcon,
	DownloadIcon,
	FilePenLineIcon,
	RotateCcwIcon,
	SaveIcon,
	XIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useReducer } from "react";
import { ArtifactVersionDiff } from "@/components/artifacts/artifact-version-diff";
import { RichTextEditor } from "@/components/artifacts/rich-text-editor";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { ArtifactVersionSummary } from "@/lib/artifacts/types";
import type { Artifact, ArtifactVersion } from "@/lib/db/schema/app";
import {
	contentVariants,
	staggerContainerVariants,
	staggerItemVariants,
} from "@/lib/motion";
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
	view: "diff" | "edit";
}

type TextArtifactAction =
	| { type: "setView"; view: "diff" | "edit" }
	| { type: "setRenameDraft"; renameDraft: string | null }
	| { type: "setIsSaving"; isSaving: boolean }
	| { type: "setIsRestoring"; isRestoring: boolean }
	| { type: "setFromVersionId"; fromVersionId: string }
	| { type: "setToVersionId"; toVersionId: string };

const initialTextArtifactState: TextArtifactState = {
	view: "edit",
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
		case "setView":
			return { ...state, view: action.view };
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
	const { diffSelection, isRestoring, isSaving, renameDraft, view } = state;

	const sortedVersions = useMemo(
		() => versions.toSorted((a, b) => b.versionNumber - a.versionNumber),
		[versions]
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

	const fromVersion = useMemo(
		() => sortedVersions.find((item) => item.id === fromVersionId),
		[sortedVersions, fromVersionId]
	);
	const toVersion = useMemo(
		() => sortedVersions.find((item) => item.id === toVersionId),
		[sortedVersions, toVersionId]
	);

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
		<div className="flex h-full min-h-0 flex-col dark:bg-neutral-900">
			<header className="shrink-0 border-b">
				<div className="flex min-h-14 items-center justify-between gap-3 px-4">
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
								className="block max-w-sm truncate text-left font-medium text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1 -mx-1"
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
						<div
							aria-label="Artifact view"
							className="relative mr-1 flex items-center rounded-md border bg-muted/40 p-0.5"
						>
							<Button
								aria-label="Show editor"
								aria-pressed={view === "edit"}
								className={cn(
									"relative size-8 z-10",
									view === "edit"
										? "text-foreground"
										: "text-muted-foreground hover:text-foreground"
								)}
								onClick={() =>
									dispatch({ type: "setView", view: "edit" })
								}
								size="icon"
								type="button"
								variant="ghost"
							>
								{view === "edit" && (
									<motion.div
										className="absolute inset-0 rounded-sm bg-background shadow-xs z-[-1]"
										layoutId="active-view-indicator"
										transition={{
											type: "spring",
											stiffness: 380,
											damping: 30,
										}}
									/>
								)}
								<FilePenLineIcon
									aria-hidden="true"
									className="size-4 z-10"
								/>
							</Button>
							<Button
								aria-label="Show diff"
								aria-pressed={view === "diff"}
								className={cn(
									"relative size-8 z-10",
									view === "diff"
										? "text-foreground"
										: "text-muted-foreground hover:text-foreground"
								)}
								onClick={() =>
									dispatch({ type: "setView", view: "diff" })
								}
								size="icon"
								type="button"
								variant="ghost"
							>
								{view === "diff" && (
									<motion.div
										className="absolute inset-0 rounded-sm bg-background shadow-xs z-[-1]"
										layoutId="active-view-indicator"
										transition={{
											type: "spring",
											stiffness: 380,
											damping: 30,
										}}
									/>
								)}
								<DiffIcon
									aria-hidden="true"
									className="size-4 z-10"
								/>
							</Button>
						</div>
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
							<DownloadIcon
								aria-hidden="true"
								className="size-4"
							/>
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
							<SaveIcon aria-hidden="true" className="size-4" />
						</Button>
						<Button
							aria-label="Close artifact"
							onClick={onClose}
							size="icon"
							type="button"
							variant="ghost"
						>
							<XIcon aria-hidden="true" className="size-4" />
						</Button>
					</div>
				</div>
				{view === "diff" && sortedVersions.length > 0 ? (
					<motion.div
						animate="visible"
						className="flex flex-wrap items-center gap-2 px-4 pb-3"
						exit="exit"
						initial="hidden"
						variants={staggerContainerVariants}
					>
						<motion.div variants={staggerItemVariants}>
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
						</motion.div>
						<motion.div variants={staggerItemVariants}>
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
						</motion.div>
						<motion.div variants={staggerItemVariants}>
							<Button
								disabled={!fromVersion || isRestoring}
								onClick={requestRestore}
								size="sm"
								type="button"
								variant="outline"
							>
								<RotateCcwIcon
									aria-hidden="true"
									className="size-3.5"
								/>
								Restore from
							</Button>
						</motion.div>
					</motion.div>
				) : null}
			</header>

			<div className="min-h-0 flex-1 overflow-hidden">
				<AnimatePresence mode="wait">
					{view === "edit" ? (
						<motion.div
							animate="visible"
							className="h-full w-full"
							exit="exit"
							initial="hidden"
							key="edit"
							variants={contentVariants}
						>
							<RichTextEditor
								content={content}
								onChangeContent={onChangeContent}
								status={status}
							/>
						</motion.div>
					) : (
						<motion.div
							animate="visible"
							className="h-full w-full"
							exit="exit"
							initial="hidden"
							key={`diff-${fromVersionId}-${toVersionId}`}
							variants={contentVariants}
						>
							<DiffContent
								artifactId={artifact.id}
								fromVersion={fromVersion}
								isActive={view === "diff"}
								title={artifact.title}
								toVersion={toVersion}
							/>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
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
				{isVersionPairError ? "Unable to load diff." : "Loading diff…"}
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
			<span aria-hidden="true" className="text-muted-foreground text-xs">
				{label}
			</span>
			<Select onValueChange={onValueChange} value={value}>
				<SelectTrigger
					aria-label={`${label} version`}
					className="w-32"
					size="sm"
				>
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

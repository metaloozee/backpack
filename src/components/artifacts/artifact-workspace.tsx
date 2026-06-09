"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArtifactSelector } from "@/components/artifacts/artifact-selector";
import { TextArtifact } from "@/components/artifacts/text-artifact";
import { Loader } from "@/components/ui/loader";
import type { ArtifactSnapshot } from "@/lib/artifacts/client-stream-state";
import type { ArtifactVersionSummary } from "@/lib/artifacts/types";
import type { Artifact, ArtifactVersion } from "@/lib/db/schema/app";
import { useTRPC } from "@/lib/trpc/trpc";
import { cn } from "@/lib/utils";
import { Spinner } from "../spinner";

const EMPTY_UUID = "00000000-0000-0000-0000-000000000000";
const UUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface ArtifactWorkspaceProps {
	chatId: string;
	className?: string;
	onClose: () => void;
	onOpenArtifact: (artifactId: string) => void;
	openArtifactId: string | null;
	snapshot?: ArtifactSnapshot;
}

const createSnapshotArtifact = (snapshot: ArtifactSnapshot): Artifact => ({
	id: snapshot.artifactId,
	userId: "",
	chatId: snapshot.chatId,
	kind: snapshot.kind,
	title: snapshot.title,
	createdAt: new Date(),
	updatedAt: new Date(),
});

const createVersionSummary = (
	version: ArtifactVersion
): ArtifactVersionSummary => ({
	id: version.id,
	artifactId: version.artifactId,
	versionNumber: version.versionNumber,
	source: version.source,
	createdAt: version.createdAt,
	messageId: version.messageId,
	restoredFromVersionId: version.restoredFromVersionId,
	contentLength: version.content.length,
});

export function ArtifactWorkspace({
	chatId,
	openArtifactId,
	snapshot,
	onOpenArtifact,
	onClose,
	className,
}: ArtifactWorkspaceProps) {
	const trpc = useTRPC();
	const effectiveChatId =
		snapshot?.chatId && UUID_PATTERN.test(snapshot.chatId)
			? snapshot.chatId
			: chatId;
	const canListArtifacts = Boolean(
		openArtifactId && UUID_PATTERN.test(effectiveChatId)
	);

	const { data: artifactList } = useQuery({
		...trpc.artifact.listByChat.queryOptions({
			chatId: canListArtifacts ? effectiveChatId : EMPTY_UUID,
		}),
		enabled: canListArtifacts,
	});

	const { data: artifactData, isLoading: isArtifactLoading } = useQuery({
		...trpc.artifact.getById.queryOptions({
			artifactId: openArtifactId ?? EMPTY_UUID,
		}),
		enabled: Boolean(openArtifactId),
	});

	if (!openArtifactId) {
		return null;
	}

	const artifact =
		artifactData?.artifact ??
		(snapshot ? createSnapshotArtifact(snapshot) : null);
	const latestVersion = artifactData?.latestVersion ?? null;
	const versions = artifactData?.versions ?? [];
	const artifacts = artifactList ?? [];
	const isStreaming =
		snapshot?.artifactId === openArtifactId &&
		snapshot.status === "streaming";
	const showToolbar = artifacts.length > 1 || isStreaming;

	if (!(artifact || isArtifactLoading)) {
		return (
			<div
				className={cn(
					"flex h-full items-center justify-center",
					className
				)}
			>
				<div className="text-muted-foreground text-sm">
					Artifact not found.
				</div>
			</div>
		);
	}

	return (
		<div
			className={cn(
				"flex h-full min-h-0 flex-col border-l bg-background",
				className
			)}
		>
			{showToolbar ? (
				<div className="flex min-h-12 shrink-0 items-center justify-between gap-2 border-b px-4">
					<div className="min-w-0 flex-1">
						<ArtifactSelector
							artifacts={artifacts}
							onValueChange={onOpenArtifact}
							value={openArtifactId}
						/>
					</div>
					{isStreaming ? <Spinner /> : null}
				</div>
			) : null}

			{artifact ? (
				<ArtifactWorkspaceSession
					artifact={artifact}
					chatId={effectiveChatId}
					key={openArtifactId}
					latestVersion={latestVersion}
					onClose={onClose}
					openArtifactId={openArtifactId}
					snapshot={snapshot}
					versions={versions}
				/>
			) : (
				<div className="flex min-h-0 flex-1 items-center justify-center">
					<Loader />
				</div>
			)}
		</div>
	);
}

function ArtifactWorkspaceSession({
	artifact,
	chatId,
	latestVersion,
	openArtifactId,
	snapshot,
	versions,
	onClose,
}: {
	artifact: Artifact;
	chatId: string;
	latestVersion: ArtifactVersion | null;
	openArtifactId: string;
	snapshot?: ArtifactSnapshot;
	versions: ArtifactVersionSummary[];
	onClose: () => void;
}) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const [draftContent, setDraftContent] = useState<string | null>(null);

	const saveMutation = useMutation(
		trpc.artifact.saveVersion.mutationOptions()
	);
	const renameMutation = useMutation(trpc.artifact.rename.mutationOptions());
	const restoreMutation = useMutation(
		trpc.artifact.restoreVersion.mutationOptions()
	);

	const sourceContent =
		snapshot?.artifactId === openArtifactId
			? snapshot.content
			: (latestVersion?.content ?? "");
	const content = draftContent ?? sourceContent;
	const status =
		snapshot?.artifactId === openArtifactId ? snapshot.status : "idle";

	const artifactQueryKey = trpc.artifact.getById.queryOptions({
		artifactId: openArtifactId,
	}).queryKey;
	const listQueryKey = trpc.artifact.listByChat.queryOptions({
		chatId,
	}).queryKey;

	const invalidateArtifactQueries = async () => {
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: artifactQueryKey }),
			queryClient.invalidateQueries({ queryKey: listQueryKey }),
		]);
	};

	const updateLatestVersionCache = (version: ArtifactVersion) => {
		queryClient.setQueryData(artifactQueryKey, (current) => {
			if (!current) {
				return current;
			}

			const summary = createVersionSummary(version);
			return {
				...current,
				latestVersion: version,
				versions: [
					summary,
					...current.versions.filter(
						(item) => item.id !== summary.id
					),
				],
			};
		});
	};

	const handleSave = async (
		nextContent: string,
		baseVersionNumber?: number
	) => {
		const result = await saveMutation.mutateAsync({
			artifactId: openArtifactId,
			content: nextContent,
			baseVersionNumber,
		});

		updateLatestVersionCache(result.version);
		setDraftContent(null);
		await invalidateArtifactQueries();

		if (result.staleBase) {
			toast.warning("Saved as a new version from a stale base.");
		} else {
			toast.success("Artifact saved.");
		}
	};

	const handleRename = async (title: string) => {
		const updatedArtifact = await renameMutation.mutateAsync({
			artifactId: openArtifactId,
			title,
		});
		queryClient.setQueryData(artifactQueryKey, (current) =>
			current ? { ...current, artifact: updatedArtifact } : current
		);
		await invalidateArtifactQueries();
	};

	const handleRestore = async (versionId: string) => {
		const version = await restoreMutation.mutateAsync({
			artifactId: openArtifactId,
			versionId,
		});
		updateLatestVersionCache(version);
		setDraftContent(null);
		await invalidateArtifactQueries();
		toast.success("Version restored.");
	};

	return (
		<TextArtifact
			artifact={artifact}
			content={content}
			latestVersion={latestVersion}
			onChangeContent={setDraftContent}
			onClose={onClose}
			onRename={handleRename}
			onRestore={handleRestore}
			onSave={handleSave}
			status={status}
			versions={versions}
		/>
	);
}

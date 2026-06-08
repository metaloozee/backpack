"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { TextArtifact } from "@/components/artifacts/text-artifact";
import { Loader } from "@/components/ui/loader";
import type { Artifact, ArtifactVersion } from "@/lib/db/schema/app";
import { useTRPC } from "@/lib/trpc/trpc";
import { cn } from "@/lib/utils";

export interface ArtifactSnapshot {
	artifactId: string;
	chatId: string;
	kind: "text";
	title: string;
	content: string;
	status: "idle" | "streaming";
	versionNumber?: number;
}

interface ArtifactWorkspaceProps {
	chatId: string;
	openArtifactId: string | null;
	snapshot?: ArtifactSnapshot;
	onOpenArtifact: (artifactId: string) => void;
	onClose: () => void;
	className?: string;
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

export function ArtifactWorkspace({
	chatId,
	openArtifactId,
	snapshot,
	onOpenArtifact: _onOpenArtifact,
	onClose,
	className,
}: ArtifactWorkspaceProps) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const [content, setContent] = useState("");
	const [hasLocalEdits, setHasLocalEdits] = useState(false);

	const _listQuery = useQuery({
		...trpc.artifact.listByChat.queryOptions({ chatId }),
		enabled: Boolean(chatId),
	});

	const artifactQuery = useQuery({
		...trpc.artifact.getById.queryOptions({
			artifactId:
				openArtifactId ?? "00000000-0000-0000-0000-000000000000",
		}),
		enabled: Boolean(openArtifactId),
	});

	const saveMutation = useMutation(
		trpc.artifact.saveVersion.mutationOptions()
	);
	const renameMutation = useMutation(trpc.artifact.rename.mutationOptions());
	const restoreMutation = useMutation(
		trpc.artifact.restoreVersion.mutationOptions()
	);

	const artifact =
		artifactQuery.data?.artifact ??
		(snapshot ? createSnapshotArtifact(snapshot) : null);
	const versions = useMemo<ArtifactVersion[]>(
		() => artifactQuery.data?.versions ?? [],
		[artifactQuery.data?.versions]
	);
	const latestVersion = versions[0];

	useEffect(() => {
		if (!openArtifactId) {
			setContent("");
			setHasLocalEdits(false);
			return;
		}

		if (snapshot?.artifactId === openArtifactId) {
			if (!hasLocalEdits) {
				setContent(snapshot.content);
			}
			return;
		}

		if (latestVersion && !hasLocalEdits) {
			setContent(latestVersion.content);
		}
	}, [hasLocalEdits, latestVersion, openArtifactId, snapshot]);

	const invalidateArtifactQueries = async (artifactId: string) => {
		await Promise.all([
			queryClient.invalidateQueries({
				queryKey: trpc.artifact.getById.queryOptions({ artifactId })
					.queryKey,
			}),
			queryClient.invalidateQueries({
				queryKey: trpc.artifact.listByChat.queryOptions({ chatId })
					.queryKey,
			}),
		]);
	};

	const handleSave = async (
		nextContent: string,
		baseVersionNumber?: number
	) => {
		if (!openArtifactId) {
			return;
		}

		const result = await saveMutation.mutateAsync({
			artifactId: openArtifactId,
			content: nextContent,
			baseVersionNumber,
		});

		setHasLocalEdits(false);
		await invalidateArtifactQueries(openArtifactId);

		if (result.staleBase) {
			toast.warning("Saved as a new version from a stale base.");
		} else {
			toast.success("Artifact saved.");
		}
	};

	const handleRename = async (title: string) => {
		if (!openArtifactId) {
			return;
		}
		await renameMutation.mutateAsync({
			artifactId: openArtifactId,
			title,
		});
		await invalidateArtifactQueries(openArtifactId);
	};

	const handleRestore = async (versionId: string) => {
		if (!openArtifactId) {
			return;
		}
		const version = await restoreMutation.mutateAsync({
			artifactId: openArtifactId,
			versionId,
		});
		setContent(version.content);
		setHasLocalEdits(false);
		await invalidateArtifactQueries(openArtifactId);
		toast.success("Version restored.");
	};

	if (!openArtifactId) {
		return null;
	}

	if (!(artifact || artifactQuery.isLoading)) {
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
			{/* <div className="flex min-h-12 shrink-0 items-center justify-between gap-2 border-b px-4">
				<ArtifactSelector
					artifacts={listQuery.data ?? []}
					onValueChange={onOpenArtifact}
					value={openArtifactId}
				/>
				<div className="text-muted-foreground text-xs">
					{snapshot?.artifactId === openArtifactId &&
					snapshot.status === "streaming"
						? "Generating"
						: null}
				</div>
			</div> */}

			{artifact ? (
				<TextArtifact
					artifact={artifact}
					content={content}
					onChangeContent={(nextContent) => {
						setContent(nextContent);
						setHasLocalEdits(true);
					}}
					onClose={onClose}
					onRename={handleRename}
					onRestore={handleRestore}
					onSave={handleSave}
					status={
						snapshot?.artifactId === openArtifactId
							? snapshot.status
							: "idle"
					}
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

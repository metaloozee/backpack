"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRealtimeRunsWithTag } from "@trigger.dev/react-hooks";
import { BookCopyIcon, PlusIcon } from "lucide-react";
import { motion } from "motion/react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { iconVariants } from "@/lib/animations";
import type { Knowledge } from "@/lib/db/schema/app";
import { useTRPC } from "@/lib/trpc/trpc";
import type { processKnowledgeTask } from "@/trigger/knowledge";
import { Spinner } from "../spinner";
import { type KnowledgeRealtimeRun, KnowledgeTable } from "./knowledge-table";

interface KnowledgeDialogProps {
	knowledgeData: Knowledge[];
	spaceId: string;
}

type TriggerRunHandle = {
	id: string;
	publicAccessToken: string;
	taskIdentifier: "process-knowledge";
};

const getKnowledgeIdFromTags = (tags: string[]) => {
	const knowledgeTag = tags.find((tag) => tag.startsWith("knowledge:"));
	return knowledgeTag?.slice("knowledge:".length) ?? null;
};

export function KnowledgeDialog({
	spaceId,
	knowledgeData,
}: KnowledgeDialogProps) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const [triggeredRuns, setTriggeredRuns] = useState<
		Record<string, TriggerRunHandle>
	>({});
	const [isOpen, setIsOpen] = useState(false);

	const realtimeAccessQuery = useQuery({
		...trpc.space.getKnowledgeRealtimeAccess.queryOptions({ spaceId }),
		enabled: isOpen,
		staleTime: 60 * 60 * 1000,
	});
	const realtimeAccessToken = realtimeAccessQuery.data?.accessToken;
	const spaceTag = realtimeAccessQuery.data?.spaceTag ?? "";
	const { runs: taggedRuns } = useRealtimeRunsWithTag<
		typeof processKnowledgeTask
	>(spaceTag, {
		accessToken: realtimeAccessToken,
		createdAt: "1h",
		enabled: Boolean(isOpen && realtimeAccessToken && spaceTag),
	});

	const knowledgeRuns = useMemo<Record<string, KnowledgeRealtimeRun>>(() => {
		const runsByKnowledgeId: Record<string, KnowledgeRealtimeRun> = {};

		for (const [knowledgeId, run] of Object.entries(triggeredRuns)) {
			runsByKnowledgeId[knowledgeId] = {
				accessToken: realtimeAccessToken ?? run.publicAccessToken,
				runId: run.id,
			};
		}

		for (const run of taggedRuns) {
			const knowledgeId = getKnowledgeIdFromTags(run.tags);
			if (!(knowledgeId && realtimeAccessToken)) {
				continue;
			}

			runsByKnowledgeId[knowledgeId] = {
				accessToken: realtimeAccessToken,
				runId: run.id,
			};
		}

		return runsByKnowledgeId;
	}, [realtimeAccessToken, taggedRuns, triggeredRuns]);

	const registerKnowledgeRun = useCallback(
		(knowledgeId: string, run: TriggerRunHandle) => {
			setTriggeredRuns((current) => ({
				...current,
				[knowledgeId]: run,
			}));
		},
		[]
	);

	const webpageKnowledge = knowledgeData.filter(
		(k) => k.knowledgeType === "webpage"
	);
	const pdfKnowledge = knowledgeData.filter((k) => k.knowledgeType === "pdf");
	const [activeTab, setActiveTab] = useQueryState(
		"tab",
		parseAsStringLiteral(["webpage", "pdf"] as const).withDefault("webpage")
	);

	const [url, setUrl] = useState("");
	const webPageMutation = useMutation({
		...trpc.space.saveWebPage.mutationOptions(),
		onSuccess: async () => {
			await queryClient.invalidateQueries(
				trpc.space.getKnowledge.pathFilter()
			);
		},
	});

	const [pdfFiles, setPdfFiles] = useState<File[]>([]);
	const [isUploadingPdf, setIsUploadingPdf] = useState(false);
	const pdfMutation = useMutation({
		...trpc.space.savePdf.mutationOptions(),
		onSuccess: async () => {
			await queryClient.invalidateQueries(
				trpc.space.getKnowledge.pathFilter()
			);
		},
	});

	const MAX_PDF_SIZE_MB = 25;
	const BYTES_PER_KILOBYTE = 1024;
	const KILOBYTES_PER_MEGABYTE = 1024;
	const MAX_PDF_SIZE_BYTES =
		MAX_PDF_SIZE_MB * BYTES_PER_KILOBYTE * KILOBYTES_PER_MEGABYTE;

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();

			if (!url) {
				return toast.error("URL is required");
			}

			try {
				const result = await webPageMutation.mutateAsync({
					spaceId,
					url,
				});
				registerKnowledgeRun(result.knowledgeId, result.run);

				setIsOpen(false);
				setUrl("");
				return toast.success("Queued for processing.");
			} catch (err) {
				toast.error("uh Oh!", { description: (err as Error).message });
			}
		},
		[registerKnowledgeRun, spaceId, url, webPageMutation]
	);

	const handlePdfSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();

			if (pdfFiles.length === 0) {
				return toast.error("Please select at least one PDF");
			}

			const oversizedFiles = pdfFiles.filter(
				(file) => file.size > MAX_PDF_SIZE_BYTES
			);
			if (oversizedFiles.length > 0) {
				return toast.error(`PDFs must be under ${MAX_PDF_SIZE_MB}MB`, {
					description: oversizedFiles
						.map((file) => file.name)
						.join(", "),
				});
			}

			setIsUploadingPdf(true);

			for (const file of pdfFiles) {
				const formData = new FormData();
				formData.append("spaceId", spaceId);
				formData.append("file", file);

				try {
					const result = await pdfMutation.mutateAsync(formData);
					registerKnowledgeRun(result.knowledgeId, result.run);
					toast.success(`${file.name} queued for processing`);
				} catch (err) {
					toast.error(`Failed to queue ${file.name}`, {
						description: (err as Error).message,
					});
				}
			}

			setIsUploadingPdf(false);
			setPdfFiles([]);
			setIsOpen(false);
		},
		[
			MAX_PDF_SIZE_BYTES,
			pdfFiles,
			pdfMutation,
			registerKnowledgeRun,
			spaceId,
		]
	);

	const uploadForm = useMemo(() => {
		if (activeTab === "pdf") {
			return (
				<form
					className="flex h-full w-full items-center justify-center gap-2"
					key="pdf-form"
					onSubmit={handlePdfSubmit}
				>
					<Input
						accept="application/pdf"
						className="flex-1 focus-visible:ring-1"
						disabled={isUploadingPdf}
						multiple
						onChange={(e) => {
							if (e.target.files && e.target.files.length > 0) {
								setPdfFiles(Array.from(e.target.files));
							}
						}}
						required
						type="file"
					/>
					<Button
						disabled={isUploadingPdf}
						type="submit"
						variant={"secondary"}
					>
						{isUploadingPdf ? (
							<Spinner size="sm" />
						) : (
							<>
								<PlusIcon className="size-4" />
								Upload
							</>
						)}
					</Button>
				</form>
			);
		}

		return (
			<form
				className="flex h-full w-full items-center justify-center gap-2"
				key="webpage-form"
				onSubmit={handleSubmit}
			>
				<Input
					className="flex-1 focus-visible:ring-1"
					disabled={webPageMutation.isPending}
					onChange={(e) => setUrl(e.target.value)}
					placeholder="Enter webpage URL"
					required
					type="url"
					value={url}
				/>
				<Button
					disabled={webPageMutation.isPending}
					type="submit"
					variant={"secondary"}
				>
					{webPageMutation.isPending ? (
						<Loader />
					) : (
						<>
							<PlusIcon className="size-4" />
							Upload
						</>
					)}
				</Button>
			</form>
		);
	}, [
		activeTab,
		handlePdfSubmit,
		handleSubmit,
		isUploadingPdf,
		url,
		webPageMutation.isPending,
	]);

	return (
		<Dialog onOpenChange={setIsOpen} open={isOpen}>
			<DialogTrigger asChild>
				<Button size={"sm"} variant="outline">
					<motion.div
						initial="rest"
						variants={iconVariants}
						whileHover="hover"
					>
						<BookCopyIcon className="size-4" />
					</motion.div>
					Knowledge Base
				</Button>
			</DialogTrigger>
			<DialogContent className="flex h-[min(85vh,56rem)] w-full max-w-[min(96vw,72rem)] flex-col bg-background sm:max-w-[min(96vw,72rem)] dark:bg-neutral-950">
				<DialogHeader>
					<DialogTitle>Knowledge Base</DialogTitle>
				</DialogHeader>
				<Tabs
					className="flex w-full min-w-0 flex-1 flex-col"
					onValueChange={(value) =>
						setActiveTab(value as "webpage" | "pdf")
					}
					value={activeTab}
				>
					<TabsList className="grid w-full grid-cols-2 bg-muted dark:bg-black">
						<TabsTrigger value="webpage">Web Pages</TabsTrigger>
						<TabsTrigger value="pdf">PDF Documents</TabsTrigger>
					</TabsList>
					<TabsContent
						className="flex flex-1 flex-col space-y-6 overflow-hidden"
						value="webpage"
					>
						<ScrollArea className="min-h-0 flex-1 pr-2">
							<KnowledgeTable
								knowledgeData={webpageKnowledge}
								knowledgeRuns={knowledgeRuns}
								onKnowledgeRun={registerKnowledgeRun}
								spaceId={spaceId}
							/>
						</ScrollArea>
						<DialogFooter className="w-full min-w-0">
							{uploadForm}
						</DialogFooter>
					</TabsContent>
					<TabsContent
						className="flex flex-1 flex-col space-y-6 overflow-hidden"
						value="pdf"
					>
						<ScrollArea className="min-h-0 flex-1 pr-2">
							<KnowledgeTable
								knowledgeData={pdfKnowledge}
								knowledgeRuns={knowledgeRuns}
								onKnowledgeRun={registerKnowledgeRun}
								spaceId={spaceId}
							/>
						</ScrollArea>
						<DialogFooter className="w-full min-w-0">
							{uploadForm}
						</DialogFooter>
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}

"use client";

import { useMutation } from "@tanstack/react-query";
import { BookCopyIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Knowledge } from "@/lib/db/schema/app";
import { useTRPC } from "@/lib/trpc/trpc";
import { KnowledgeTable } from "./knowledge-table";

type KnowledgeDialogProps = {
	spaceId: string;
	knowledgeData: Knowledge[];
};

export function KnowledgeDialog({ spaceId, knowledgeData }: KnowledgeDialogProps) {
	const trpc = useTRPC();

	const webpageKnowledge = knowledgeData.filter((k) => k.knowledgeType === "webpage");
	const pdfKnowledge = knowledgeData.filter((k) => k.knowledgeType === "pdf");
	const [activeTab, setActiveTab] = useState<"webpage" | "pdf">("webpage");

	const [url, setUrl] = useState("");
	const webPageMutation = useMutation(trpc.space.saveWebPage.mutationOptions());

	const [pdfFiles, setPdfFiles] = useState<File[]>([]);
	const [isUploadingPdf, setIsUploadingPdf] = useState(false);
	const pdfMutation = useMutation(trpc.space.savePdf.mutationOptions());

	const [isOpen, setIsOpen] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!url) {
			return toast.error("URL is required");
		}

		try {
			await webPageMutation.mutateAsync({
				spaceId,
				url,
			});

			setIsOpen(false);
			setUrl("");
			return toast.success("Successfully added into the knowledge.");
		} catch (err) {
			toast.error("uh Oh!", { description: (err as Error).message });
		}
	};

	const renderUploadForm = () => {
		// PDF Upload Form
		if (activeTab === "pdf") {
			const handlePdfSubmit = async (e: React.FormEvent) => {
				e.preventDefault();

				if (pdfFiles.length === 0) {
					return toast.error("Please select at least one PDF");
				}

				setIsUploadingPdf(true);

				/*
				 * Here, I am sequentially uploading each PDF file for its processing.
				 * TODO: Move heavy PDF processing to a real background job queue using Upstash QStash.
				 */

				for (const file of pdfFiles) {
					const formData = new FormData();
					formData.append("spaceId", spaceId);
					formData.append("file", file);

					try {
						await pdfMutation.mutateAsync(formData);
						toast.success(`${file.name} processed`);
					} catch (err) {
						toast.error(`Failed to process ${file.name}`, {
							description: (err as Error).message,
						});
					}
				}

				setIsUploadingPdf(false);
				setPdfFiles([]);
				setIsOpen(false);
			};

			return (
				<form className="flex h-full w-full items-center justify-center gap-2" onSubmit={handlePdfSubmit}>
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
					<Button disabled={isUploadingPdf} type="submit" variant={"secondary"}>
						{isUploadingPdf ? (
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
		}

		// WebPage Upload Form
		return (
			<form className="flex h-full w-full items-center justify-center gap-2" onSubmit={handleSubmit}>
				<Input
					className="flex-1 focus-visible:ring-1"
					disabled={webPageMutation.isPending}
					onChange={(e) => setUrl(e.target.value)}
					placeholder="Enter webpage URL"
					required
					type="url"
					value={url}
				/>
				<Button disabled={webPageMutation.isPending} type="submit" variant={"secondary"}>
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
	};

	return (
		<Dialog onOpenChange={setIsOpen} open={isOpen}>
			<DialogTrigger asChild>
				<Button size={"sm"} variant="outline">
					<BookCopyIcon className="size-4" />
					Knowledge Base
				</Button>
			</DialogTrigger>
			<DialogContent className="min-w-2xl bg-neutral-950">
				<DialogHeader>
					<DialogTitle>Knowledge Base</DialogTitle>
				</DialogHeader>
				<Tabs
					className="w-full"
					defaultValue="webpage"
					onValueChange={(value) => setActiveTab(value as "webpage" | "pdf")}
				>
					<TabsList className="grid w-full grid-cols-2 bg-black">
						<TabsTrigger value="webpage">Web Pages</TabsTrigger>
						<TabsTrigger value="pdf">PDF Documents</TabsTrigger>
					</TabsList>
					<TabsContent className="space-y-6" value="webpage">
						<KnowledgeTable knowledgeData={webpageKnowledge} />
						<DialogFooter className="w-full">{renderUploadForm()}</DialogFooter>
					</TabsContent>
					<TabsContent className="space-y-6" value="pdf">
						<KnowledgeTable knowledgeData={pdfKnowledge} />
						<DialogFooter className="w-full">{renderUploadForm()}</DialogFooter>
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}

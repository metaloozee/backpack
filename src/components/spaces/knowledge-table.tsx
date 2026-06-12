"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { useRealtimeRun, useRealtimeStream } from "@trigger.dev/react-hooks";
import {
	ExternalLinkIcon,
	PencilIcon,
	RefreshCwIcon,
	Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { format } from "timeago.js";
import type { Knowledge } from "@/lib/db/schema/app";
import { useKnowledgeRunsStore } from "@/lib/store/knowledge-runs";
import { useTRPC } from "@/lib/trpc/trpc";
import { cn } from "@/lib/utils/cn";
import type { processKnowledgeTask } from "@/trigger/knowledge";
import { logStream } from "@/trigger/streams";
import { Spinner } from "../spinner";
import { Button } from "../ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../ui/table";

const baseColumns: ColumnDef<Knowledge>[] = [
	{
		accessorKey: "knowledgeName",
		header: "Title",
		cell: ({ row }) => {
			const knowledge = row.original;
			const linkUrl = knowledge.sourceUrl ?? knowledge.knowledgeName;
			const isLink =
				Boolean(knowledge.sourceUrl) ||
				knowledge.knowledgeType === "webpage";
			return (
				<p className="max-w-[22rem] truncate font-medium text-foreground text-sm dark:text-neutral-100">
					{isLink ? (
						<Link
							className="text-foreground underline-offset-4 transition-all duration-300 hover:text-primary hover:underline dark:text-neutral-100 dark:hover:text-neutral-50"
							href={linkUrl}
							rel="noopener noreferrer"
							target="_blank"
						>
							{knowledge.knowledgeName}
						</Link>
					) : (
						<span>{knowledge.knowledgeName}</span>
					)}
				</p>
			);
		},
	},
	{
		accessorKey: "uploadedAt",
		header: "Uploaded",
		cell: ({ row }) => (
			<p className="text-xs">{format(row.getValue("uploadedAt"))}</p>
		),
	},
];

const statusClassMap = {
	pending: "bg-amber-500/10 text-amber-300",
	processing: "bg-blue-500/10 text-blue-300",
	ready: "bg-emerald-500/10 text-emerald-300",
	failed: "bg-rose-500/10 text-rose-300",
} as const;

const statusLabelMap = {
	pending: "Pending",
	processing: "Processing",
	ready: "Ready",
	failed: "Failed",
} as const;

function LiveKnowledgeStatus({
	knowledgeId,
	runId,
	publicAccessToken,
}: {
	knowledgeId: string;
	runId: string;
	publicAccessToken: string;
}) {
	const removeRun = useKnowledgeRunsStore((state) => state.removeRun);
	const queryClient = useQueryClient();
	const trpc = useTRPC();
	const { run, error } = useRealtimeRun<typeof processKnowledgeTask>(runId, {
		accessToken: publicAccessToken,
	});
	const { parts } = useRealtimeStream(logStream, runId, {
		accessToken: publicAccessToken,
		throttleInMs: 200,
	});

	const currentMessage = parts.at(-1);

	useEffect(() => {
		if (run?.status === "COMPLETED" || run?.status === "FAILED" || error) {
			removeRun(knowledgeId);
			queryClient.invalidateQueries(trpc.space.getKnowledge.pathFilter());
		}
	}, [run?.status, error, knowledgeId, removeRun, queryClient, trpc]);

	if (!run && !error) {
		return (
			<span
				className={cn(
					`inline-flex gap-1 w-fit items-center rounded-full px-2 py-0.5 text-xs`,
					statusClassMap.pending
				)}
			>
				<Spinner className="size-3" />
				Starting...
			</span>
		);
	}

	if (error) {
		return (
			<span
				className={cn(
					`inline-flex gap-1 w-fit items-center rounded-full px-2 py-0.5 text-xs`,
					statusClassMap.failed
				)}
			>
				Failed
			</span>
		);
	}

	if (!run) {
		return (
			<span
				className={cn(
					`inline-flex gap-1 w-fit items-center rounded-full px-2 py-0.5 text-xs`,
					statusClassMap.pending
				)}
			>
				No Data Available
			</span>
		);
	}

	return (
		<span
			className={cn(
				`inline-flex gap-1 w-fit items-center rounded-full px-2 py-0.5 text-xs`,
				statusClassMap.processing
			)}
		>
			<Spinner className="size-3" />
			{currentMessage}
		</span>
	);
}

function KnowledgeStatusCell({ knowledge }: { knowledge: Knowledge }) {
	const activeRun = useKnowledgeRunsStore(
		(state) => state.runs[knowledge.id]
	);

	if (activeRun) {
		return (
			<LiveKnowledgeStatus
				knowledgeId={knowledge.id}
				publicAccessToken={activeRun.publicAccessToken}
				runId={activeRun.runId}
			/>
		);
	}

	const status = knowledge.status ?? "pending";
	const statusLabel = statusLabelMap[status] ?? "Pending";
	const statusClass = statusClassMap[status] ?? statusClassMap.pending;

	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full px-2 py-0.5 text-xs",
				statusClass
			)}
			title={knowledge.errorMessage ?? undefined}
		>
			{statusLabel}
		</span>
	);
}

interface RenameKnowledgeDialogProps {
	knowledge: Knowledge | null;
	onOpenChange: (open: boolean) => void;
	open: boolean;
	spaceId: string;
}

function RenameKnowledgeDialog({
	knowledge,
	open,
	onOpenChange,
	spaceId,
}: RenameKnowledgeDialogProps) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const renameMutation = useMutation({
		...trpc.space.renameKnowledge.mutationOptions(),
		onSuccess: async () => {
			await queryClient.invalidateQueries(
				trpc.space.getKnowledge.pathFilter()
			);
			toast.success("Knowledge renamed");
			onOpenChange(false);
		},
		onError: (error) => {
			toast.error(error.message || "Failed to rename knowledge");
		},
	});

	const form = useForm({
		defaultValues: {
			knowledgeName: knowledge?.knowledgeName ?? "",
		},
		onSubmit: ({ value }) => {
			if (!knowledge) {
				return;
			}
			renameMutation.mutate({
				spaceId,
				knowledgeId: knowledge.id,
				knowledgeName: value.knowledgeName,
			});
		},
	});

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Rename file</DialogTitle>
					<DialogDescription>
						Update the display name for this file.
					</DialogDescription>
				</DialogHeader>
				<form
					className="space-y-4"
					onSubmit={(event) => {
						event.preventDefault();
						event.stopPropagation();
						form.handleSubmit();
					}}
				>
					<form.Field
						name="knowledgeName"
						validators={{
							onChange: ({ value }) =>
								!value || value.trim().length === 0
									? "Name is required"
									: "",
						}}
					>
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Name</Label>
								<Input
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(event) =>
										field.handleChange(event.target.value)
									}
									placeholder="Enter a new name"
									value={field.state.value}
								/>
								{field.state.meta.isTouched &&
								field.state.meta.errors.length > 0 ? (
									<p className="text-red-500 text-sm">
										{field.state.meta.errors[0]}
									</p>
								) : null}
							</div>
						)}
					</form.Field>
					<DialogFooter>
						<Button
							onClick={() => onOpenChange(false)}
							type="button"
							variant="outline"
						>
							Cancel
						</Button>
						<form.Subscribe
							selector={(state) => [
								state.canSubmit,
								state.isSubmitting,
							]}
						>
							{([canSubmit, isSubmitting]) => (
								<Button
									disabled={
										!canSubmit ||
										isSubmitting ||
										renameMutation.isPending
									}
									type="submit"
								>
									{isSubmitting || renameMutation.isPending
										? "Saving..."
										: "Save"}
								</Button>
							)}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

interface DeleteKnowledgeDialogProps {
	knowledge: Knowledge | null;
	onOpenChange: (open: boolean) => void;
	open: boolean;
	spaceId: string;
}

function DeleteKnowledgeDialog({
	knowledge,
	open,
	onOpenChange,
	spaceId,
}: DeleteKnowledgeDialogProps) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const deleteMutation = useMutation({
		...trpc.space.deleteKnowledge.mutationOptions(),
		onSuccess: async () => {
			await queryClient.invalidateQueries(
				trpc.space.getKnowledge.pathFilter()
			);
			toast.success("Knowledge deleted");
			onOpenChange(false);
		},
		onError: (error) => {
			toast.error(error.message || "Failed to delete knowledge");
		},
	});

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete file?</DialogTitle>
					<DialogDescription>
						This action is not reversible. The file and its data
						will be permanently removed.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						onClick={() => onOpenChange(false)}
						type="button"
						variant="outline"
					>
						Cancel
					</Button>
					<Button
						disabled={deleteMutation.isPending || !knowledge}
						onClick={() => {
							if (!knowledge) {
								return;
							}
							deleteMutation.mutate({
								spaceId,
								knowledgeId: knowledge.id,
							});
						}}
						type="button"
						variant="destructive"
					>
						{deleteMutation.isPending ? "Deleting..." : "Delete"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
}

export function DataTable<TData, TValue>({
	columns,
	data,
}: DataTableProps<TData, TValue>) {
	"use no memo";

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		initialState: {
			pagination: {
				pageIndex: 0,
				pageSize: 6,
			},
		},
	});

	return (
		<div className="relative h-full min-h-0 w-full overflow-hidden rounded-2xl border border-border bg-card dark:border-neutral-800 dark:bg-neutral-950/80">
			<div className="h-full min-h-0 w-full overflow-x-auto">
				<Table className="min-w-[760px] border-separate border-spacing-0">
					<TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur dark:bg-neutral-950/95">
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow
								className="border-border/70 border-b dark:border-neutral-800/70"
								key={headerGroup.id}
							>
								{headerGroup.headers.map((header) => {
									const isActions =
										header.column.id === "actions";
									return (
										<TableHead
											className={
												"px-4 py-3 font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.22em] dark:text-neutral-400"
											}
											key={header.id}
											style={
												isActions
													? { textAlign: "right" }
													: undefined
											}
										>
											{header.isPlaceholder || isActions
												? null
												: flexRender(
														header.column.columnDef
															.header,
														header.getContext()
													)}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody className="text-foreground dark:text-neutral-200">
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row, index) => (
								<TableRow
									className={
										index % 2 === 0
											? "border-border/70 border-b bg-background transition-colors hover:bg-muted/80 data-[state=selected]:bg-muted dark:border-neutral-800/60 dark:bg-neutral-950/40 dark:data-[state=selected]:bg-neutral-900/70 dark:hover:bg-neutral-900/60"
											: "border-border/70 border-b bg-muted/35 transition-colors hover:bg-muted/80 data-[state=selected]:bg-muted dark:border-neutral-800/60 dark:bg-neutral-950/20 dark:data-[state=selected]:bg-neutral-900/70 dark:hover:bg-neutral-900/60"
									}
									data-state={
										row.getIsSelected() && "selected"
									}
									key={row.id}
								>
									{row.getVisibleCells().map((cell) => {
										const isActions =
											cell.column.id === "actions";
										return (
											<TableCell
												className="px-4 py-3 text-sm"
												key={cell.id}
												style={
													isActions
														? { textAlign: "right" }
														: undefined
												}
											>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext()
												)}
											</TableCell>
										);
									})}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									className="h-28 text-center text-muted-foreground text-sm dark:text-neutral-400"
									colSpan={columns.length}
								>
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<div className="flex items-center justify-between gap-3 border-border border-t px-4 py-3 text-muted-foreground text-xs dark:border-neutral-800/70 dark:text-neutral-400">
				<span className="tabular-nums">
					Page {table.getState().pagination.pageIndex + 1} of{" "}
					{Math.max(table.getPageCount(), 1)}
				</span>
				<div className="flex items-center gap-2">
					<Button
						className="h-8 rounded-lg border border-border bg-background px-3 text-foreground text-xs hover:bg-muted dark:border-neutral-800/70 dark:bg-neutral-900/40 dark:text-neutral-200 dark:hover:bg-neutral-900/70"
						disabled={!table.getCanPreviousPage()}
						onClick={() => table.previousPage()}
						type="button"
						variant="ghost"
					>
						Previous
					</Button>
					<Button
						className="h-8 rounded-lg border border-border bg-background px-3 text-foreground text-xs hover:bg-muted dark:border-neutral-800/70 dark:bg-neutral-900/40 dark:text-neutral-200 dark:hover:bg-neutral-900/70"
						disabled={!table.getCanNextPage()}
						onClick={() => table.nextPage()}
						type="button"
						variant="ghost"
					>
						Next
					</Button>
				</div>
			</div>
		</div>
	);
}

export function KnowledgeTable({
	knowledgeData,
	spaceId,
}: {
	knowledgeData: Knowledge[];
	spaceId: string;
}) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const [renameId, setRenameId] = useQueryState(
		"renameKnowledgeId",
		parseAsString.withDefault("")
	);
	const [deleteId, setDeleteId] = useQueryState(
		"deleteKnowledgeId",
		parseAsString.withDefault("")
	);
	const renameKnowledge =
		knowledgeData.find((item) => item.id === renameId) ?? null;
	const deleteKnowledge =
		knowledgeData.find((item) => item.id === deleteId) ?? null;
	const isRenameOpen = Boolean(renameKnowledge);
	const isDeleteOpen = Boolean(deleteKnowledge);

	const retryMutation = useMutation({
		...trpc.space.retryKnowledge.mutationOptions(),
		onSuccess: async (result) => {
			useKnowledgeRunsStore.getState().addRun(result.knowledgeId, {
				runId: result.run.id,
				publicAccessToken: result.run.publicAccessToken,
			});
			await queryClient.invalidateQueries(
				trpc.space.getKnowledge.pathFilter()
			);
			toast.success("Knowledge retry queued");
		},
		onError: (error) => {
			toast.error(error.message || "Failed to retry knowledge");
		},
	});

	const columns: ColumnDef<Knowledge>[] = [
		baseColumns[0],
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => <KnowledgeStatusCell knowledge={row.original} />,
		},
		...baseColumns.slice(1),
		{
			id: "actions",
			header: "Actions",
			cell: ({ row }) => {
				const knowledge = row.original;
				const linkUrl =
					knowledge.sourceUrl ??
					(knowledge.knowledgeType === "webpage"
						? knowledge.knowledgeName
						: null);
				const hasLink = Boolean(linkUrl);
				const canRetry = knowledge.status === "failed";
				return (
					<div className="flex w-full items-center justify-end gap-2">
						{canRetry ? (
							<Button
								aria-label={`Retry ${knowledge.knowledgeName}`}
								className="h-8 w-8 rounded-lg border border-border/70 bg-background/80 text-foreground shadow-sm transition hover:bg-muted dark:border-neutral-800/70 dark:bg-neutral-900/40 dark:text-neutral-200 dark:hover:border-neutral-700 dark:hover:bg-neutral-900/80"
								disabled={retryMutation.isPending}
								onClick={() => {
									retryMutation.mutate({
										spaceId,
										knowledgeId: knowledge.id,
									});
								}}
								size="icon"
								type="button"
								variant="ghost"
							>
								<RefreshCwIcon className="size-4" />
							</Button>
						) : null}
						<Button
							aria-label={`Open ${knowledge.knowledgeName}`}
							className="h-8 w-8 rounded-lg border border-border/70 bg-background/80 text-foreground shadow-sm transition hover:bg-muted dark:border-neutral-800/70 dark:bg-neutral-900/40 dark:text-neutral-200 dark:hover:border-neutral-700 dark:hover:bg-neutral-900/80"
							disabled={!hasLink}
							onClick={() => {
								if (!linkUrl) {
									return;
								}
								window.open(
									linkUrl,
									"_blank",
									"noopener,noreferrer"
								);
							}}
							size="icon"
							type="button"
							variant="ghost"
						>
							<ExternalLinkIcon className="size-4" />
						</Button>
						<Button
							aria-label={`Rename ${knowledge.knowledgeName}`}
							className="h-8 w-8 rounded-lg border border-border/70 bg-background/80 text-foreground shadow-sm transition hover:bg-muted dark:border-neutral-800/70 dark:bg-neutral-900/40 dark:text-neutral-200 dark:hover:border-neutral-700 dark:hover:bg-neutral-900/80"
							onClick={() => {
								setDeleteId(null);
								setRenameId(knowledge.id);
							}}
							size="icon"
							type="button"
							variant="ghost"
						>
							<PencilIcon className="size-4" />
						</Button>
						<Button
							aria-label={`Delete ${knowledge.knowledgeName}`}
							className="h-8 w-8 rounded-lg"
							onClick={() => {
								setRenameId(null);
								setDeleteId(knowledge.id);
							}}
							size="icon"
							type="button"
							variant="destructive"
						>
							<Trash2Icon className="size-4" />
						</Button>
					</div>
				);
			},
		},
	];

	return (
		<div>
			<DataTable columns={columns} data={knowledgeData} />
			<RenameKnowledgeDialog
				key={renameKnowledge?.id ?? "rename-empty"}
				knowledge={renameKnowledge}
				onOpenChange={(open) => {
					if (!open) {
						setRenameId(null);
					}
				}}
				open={isRenameOpen}
				spaceId={spaceId}
			/>
			<DeleteKnowledgeDialog
				knowledge={deleteKnowledge}
				onOpenChange={(open) => {
					if (!open) {
						setDeleteId(null);
					}
				}}
				open={isDeleteOpen}
				spaceId={spaceId}
			/>
		</div>
	);
}

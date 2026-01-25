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
import {
	ExternalLinkIcon,
	PencilIcon,
	RefreshCwIcon,
	Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";
import { toast } from "sonner";
import { format } from "timeago.js";
import type { Knowledge } from "@/lib/db/schema/app";
import { useTRPC } from "@/lib/trpc/trpc";
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
				<p className="max-w-[22rem] truncate font-medium text-neutral-100 text-sm">
					{isLink ? (
						<Link
							className="text-neutral-100 underline-offset-4 transition-all duration-300 hover:text-neutral-50 hover:underline"
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
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => {
			const status = row.original.status ?? "pending";
			const errorMessage = row.original.errorMessage;
			const statusLabelMap = {
				pending: "Pending",
				processing: "Processing",
				ready: "Ready",
				failed: "Failed",
			} as const;

			const statusClassMap = {
				pending: "bg-amber-500/10 text-amber-300",
				processing: "bg-blue-500/10 text-blue-300",
				ready: "bg-emerald-500/10 text-emerald-300",
				failed: "bg-rose-500/10 text-rose-300",
			} as const;

			const statusLabel = statusLabelMap[status] ?? "Pending";
			const statusClass =
				statusClassMap[status] ?? "bg-amber-500/10 text-amber-300";

			return (
				<span
					className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${statusClass}`}
					title={errorMessage ?? undefined}
				>
					{statusLabel}
				</span>
			);
		},
	},
	{
		accessorKey: "uploadedAt",
		header: "Uploaded",
		cell: ({ row }) => {
			return (
				<p className="text-xs">{format(row.getValue("uploadedAt"))}</p>
			);
		},
	},
];

interface RenameKnowledgeDialogProps {
	knowledge: Knowledge | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
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
	open: boolean;
	onOpenChange: (open: boolean) => void;
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
		<div className="relative h-full min-h-0 w-full overflow-hidden rounded-2xl border border-neutral-800/70 bg-neutral-950/70">
			<div className="h-full min-h-0 w-full overflow-x-auto">
				<Table className="min-w-[760px] border-separate border-spacing-0">
					<TableHeader className="sticky top-0 z-10 bg-neutral-950/95 backdrop-blur">
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow
								className="border-neutral-800/70 border-b"
								key={headerGroup.id}
							>
								{headerGroup.headers.map((header) => {
									const isActions =
										header.column.id === "actions";
									return (
										<TableHead
											className={
												"px-4 py-3 font-semibold text-[11px] text-neutral-400 uppercase tracking-[0.22em]"
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
					<TableBody className="text-neutral-200">
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row, index) => (
								<TableRow
									className={
										index % 2 === 0
											? "border-neutral-800/60 border-b bg-neutral-950/40 transition-colors hover:bg-neutral-900/60 data-[state=selected]:bg-neutral-900/70"
											: "border-neutral-800/60 border-b bg-neutral-950/20 transition-colors hover:bg-neutral-900/60 data-[state=selected]:bg-neutral-900/70"
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
									className="h-28 text-center text-neutral-400 text-sm"
									colSpan={columns.length}
								>
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<div className="flex items-center justify-between gap-3 border-neutral-800/70 border-t px-4 py-3 text-neutral-400 text-xs">
				<span className="tabular-nums">
					Page {table.getState().pagination.pageIndex + 1} of{" "}
					{Math.max(table.getPageCount(), 1)}
				</span>
				<div className="flex items-center gap-2">
					<Button
						className="h-8 rounded-lg border border-neutral-800/70 bg-neutral-900/30 px-3 text-neutral-200 text-xs hover:bg-neutral-900/70"
						disabled={!table.getCanPreviousPage()}
						onClick={() => table.previousPage()}
						type="button"
						variant="ghost"
					>
						Previous
					</Button>
					<Button
						className="h-8 rounded-lg border border-neutral-800/70 bg-neutral-900/30 px-3 text-neutral-200 text-xs hover:bg-neutral-900/70"
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
		onSuccess: async () => {
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
		...baseColumns,
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
								className="h-8 w-8 rounded-lg border border-neutral-800/70 bg-neutral-900/40 text-neutral-200 shadow-sm transition hover:border-neutral-700 hover:bg-neutral-900/80"
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
							className="h-8 w-8 rounded-lg border border-neutral-800/70 bg-neutral-900/40 text-neutral-200 shadow-sm transition hover:border-neutral-700 hover:bg-neutral-900/80"
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
							className="h-8 w-8 rounded-lg border border-neutral-800/70 bg-neutral-900/40 text-neutral-200 shadow-sm transition hover:border-neutral-700 hover:bg-neutral-900/80"
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
							<Trash2Icon className="size-4 text-red-400" />
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

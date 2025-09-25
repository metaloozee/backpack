"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	type ColumnDef,
	type ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
	type VisibilityState,
} from "@tanstack/react-table";
import { CheckIcon, CopyIcon, TrashIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "timeago.js";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Memory } from "@/lib/db/schema/app";
import { useTRPC } from "@/lib/trpc/trpc";

export function DisplayMemories() {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [globalFilter, setGlobalFilter] = useState("");
	const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
	const [copiedId, setCopiedId] = useState<string | null>(null);

	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const { data: memories, isLoading } = useQuery(trpc.memories.getMemories.queryOptions());
	const deleteMemoryMutation = useMutation(
		trpc.memories.deleteMemory.mutationOptions({
			onSuccess: (_, variables) => {
				queryClient.setQueryData(
					trpc.memories.getMemories.queryKey(),
					(oldData: Memory[] | undefined) => oldData?.filter((memory) => memory.id !== variables.id) ?? []
				);
				toast.success("Memory deleted successfully");
				setDeleteDialogOpen((current) => (current === variables.id ? null : current));
			},
			onError: (error) => {
				toast.error("Failed to delete memory", { description: error.message });
				setDeleteDialogOpen(null);
			},
		})
	);

	const columns: ColumnDef<Memory>[] = [
		{
			accessorKey: "content",
			header: () => {
				return <p className="text-xs">CONTENT</p>;
			},
			cell: ({ row }) => (
				<div className="max-w-[400px] whitespace-pre-line break-words">{row.getValue("content")}</div>
			),
			enableGlobalFilter: true,
		},
		{
			accessorKey: "createdAt",
			header: () => {
				return <p className="text-xs">CREATED AT</p>;
			},
			cell: ({ row }) => (
				<div className="capitalize">{row.original.createdAt ? format(row.original.createdAt) : "Never"}</div>
			),
		},
		{
			id: "actions",
			enableHiding: false,
			cell: ({ row }) => {
				const memory = row.original;

				const handleDelete = () => {
					deleteMemoryMutation.mutate({ id: memory.id });
				};

				const handleCopy = async () => {
					try {
						await navigator.clipboard.writeText(memory.content);
						setCopiedId(memory.id);
						toast.success("Memory content copied to clipboard");
						setTimeout(() => setCopiedId(null), 2000);
					} catch {
						toast.error("Failed to copy to clipboard");
					}
				};

				return (
					<div className="flex w-full justify-end space-x-2">
						<Button className="h-8" onClick={handleCopy} size="sm" variant="outline">
							<AnimatePresence initial={false} mode="wait">
								{copiedId === memory.id ? (
									<motion.div
										animate={{ scale: 1, opacity: 1, rotate: 0 }}
										exit={{ scale: 0, opacity: 0, rotate: 180 }}
										initial={{ scale: 0, opacity: 0, rotate: -180 }}
										key="check"
										transition={{ type: "spring", stiffness: 500, damping: 30 }}
									>
										<CheckIcon className="size-3" />
									</motion.div>
								) : (
									<motion.div
										animate={{ scale: 1, opacity: 1, rotate: 0 }}
										exit={{ scale: 0, opacity: 0, rotate: 180 }}
										initial={{ scale: 0, opacity: 0, rotate: -180 }}
										key="copy"
										transition={{ type: "tween", duration: 0.2 }}
									>
										<CopyIcon className="size-3" />
									</motion.div>
								)}
							</AnimatePresence>
						</Button>

						<Dialog
							onOpenChange={(open) => setDeleteDialogOpen(open ? memory.id : null)}
							open={deleteDialogOpen === memory.id}
						>
							<DialogTrigger asChild>
								<Button className="h-8" size="sm" variant="destructive">
									<TrashIcon className="size-3" />
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Delete Memory</DialogTitle>
									<DialogDescription>
										Are you sure you want to delete this memory? This action cannot be undone.
									</DialogDescription>
								</DialogHeader>
								<DialogFooter>
									<Button onClick={() => setDeleteDialogOpen(null)} variant="outline">
										Cancel
									</Button>
									<Button
										disabled={deleteMemoryMutation.isPending}
										onClick={handleDelete}
										variant="destructive"
									>
										{deleteMemoryMutation.isPending ? "Deleting..." : "Delete"}
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					</div>
				);
			},
		},
	];

	const table = useReactTable({
		data: memories ?? [],
		columns,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onGlobalFilterChange: setGlobalFilter,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		getRowId: (row) => row.id,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			globalFilter,
		},
	});

	if (isLoading) {
		return <Loader />;
	}

	return (
		<div className="w-full">
			<div className="flex items-center justify-between pb-2">
				<Input
					className="h-8 max-w-sm"
					onChange={(event) => setGlobalFilter(event.target.value)}
					placeholder="Filter memories..."
					value={globalFilter ?? ""}
				/>
			</div>
			<div className="overflow-hidden rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead key={header.id}>
											{header.isPlaceholder
												? null
												: flexRender(header.column.columnDef.header, header.getContext())}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow data-state={row.getIsSelected() && "selected"} key={row.id}>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell className="h-24 text-center" colSpan={columns.length}>
									No memories found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<div className="flex items-center justify-end space-x-2 py-4">
				<div className="space-x-2">
					<Button
						disabled={!table.getCanPreviousPage()}
						onClick={() => table.previousPage()}
						size="sm"
						variant="outline"
					>
						Previous
					</Button>
					<Button
						disabled={!table.getCanNextPage()}
						onClick={() => table.nextPage()}
						size="sm"
						variant="outline"
					>
						Next
					</Button>
				</div>
			</div>
		</div>
	);
}

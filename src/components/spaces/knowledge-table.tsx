"use client";

import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import Link from "next/link";
import { format } from "timeago.js";
import type { Knowledge } from "@/lib/db/schema/app";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

export const cols: ColumnDef<Knowledge>[] = [
	{
		accessorKey: "knowledgeName",
		header: "Title",
		cell: ({ row }) => {
			return (
				<Link
					className="text-neutral-300 underline-offset-4 transition-all duration-300 hover:underline"
					href={row.getValue("knowledgeName")}
					target="_blank"
				>
					<p className="w-[25vw] truncate">{row.getValue("knowledgeName")}</p>
				</Link>
			);
		},
	},
	{
		accessorKey: "uploadedAt",
		header: "Uploaded",
		cell: ({ row }) => {
			return <p className="text-xs">{format(row.getValue("uploadedAt"))}</p>;
		},
	},
];

type DataTableProps<TData, TValue> = {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
};

export function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<div className="w-full rounded-md border">
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
								No results.
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}

export function KnowledgeTable({ knowledgeData }: { knowledgeData: Knowledge[] }) {
	return (
		<div className="w-full">
			<DataTable columns={cols} data={knowledgeData} />
		</div>
	);
}

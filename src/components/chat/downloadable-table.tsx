"use client";

import { DownloadIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/table";

const CSV_ESCAPE_REGEX = /[",\n]/;

interface DownloadableTableProps {
	children: ReactNode;
	className?: string;
}

export function DownloadableTable({
	children,
	className,
}: DownloadableTableProps) {
	const tableRef = useRef<HTMLDivElement>(null);

	const downloadCSV = () => {
		try {
			const tableElement = tableRef.current?.querySelector("table");
			if (!tableElement) {
				toast.error("Failed to download table");
				return;
			}

			const rows: string[][] = [];

			const headers = Array.from(
				tableElement.querySelectorAll("thead th")
			).map((th) => th.textContent?.trim() || "");
			if (headers.length > 0) {
				rows.push(headers);
			}

			const bodyRows = tableElement.querySelectorAll("tbody tr");
			for (const row of bodyRows) {
				const cells = Array.from(row.querySelectorAll("td")).map(
					(td) => td.textContent?.trim() || ""
				);
				if (cells.length > 0) {
					rows.push(cells);
				}
			}

			const csvContent = rows
				.map((row) =>
					row
						.map((cell) => {
							const escapedCell = cell.replace(/"/g, '""');
							return CSV_ESCAPE_REGEX.test(escapedCell)
								? `"${escapedCell}"`
								: escapedCell;
						})
						.join(",")
				)
				.join("\n");

			const blob = new Blob([csvContent], {
				type: "text/csv;charset=utf-8;",
			});
			const link = document.createElement("a");
			const url = URL.createObjectURL(blob);
			link.setAttribute("href", url);
			link.setAttribute("download", `table-${Date.now()}.csv`);
			link.style.visibility = "hidden";
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);

			toast.success("Table downloaded as CSV");
		} catch {
			toast.error("Failed to download table");
		}
	};

	return (
		<div className="my-6">
			<div className="overflow-hidden rounded-md border">
				<div ref={tableRef}>
					<Table className={className}>{children}</Table>
				</div>
			</div>
			<div className="mt-2 flex justify-end">
				<Button
					className="h-8 gap-1.5 px-3 text-xs"
					onClick={downloadCSV}
					size="sm"
					variant="outline"
				>
					<DownloadIcon className="size-3.5" />
					Download CSV
				</Button>
			</div>
		</div>
	);
}

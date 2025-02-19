'use client';

import { type Knowledge } from '@/lib/db/schema/app';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { format } from 'timeago.js';
import Link from 'next/link';
import { ExternalLinkIcon } from 'lucide-react';

export const columns: ColumnDef<Knowledge>[] = [
    {
        accessorKey: 'knowledgeName',
        header: 'Title',
        cell: ({ row }) => {
            return (
                <Link
                    href={row.getValue('knowledgeName')}
                    target="_blank"
                    className="text-zinc-300 underline-offset-4 hover:underline transition-all duration-300"
                >
                    <p className="truncate w-[25vw]">{row.getValue('knowledgeName')}</p>
                </Link>
            );
        },
    },
    {
        accessorKey: 'uploadedAt',
        header: 'Uploaded',
        cell: ({ row }) => {
            return <p className="text-xs">{format(row.getValue('uploadedAt'))}</p>;
        },
    },
];

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
}

export function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="rounded-md border w-full">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef.header,
                                                  header.getContext()
                                              )}
                                    </TableHead>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                No results.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

export function KnowledgeTable({ knowledgeData }: { knowledgeData: Array<Knowledge> }) {
    return (
        <div className="w-full">
            <DataTable columns={columns} data={knowledgeData} />
        </div>
    );
}

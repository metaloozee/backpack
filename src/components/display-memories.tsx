'use client';

import * as React from 'react';
import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
    VisibilityState,
} from '@tanstack/react-table';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Memory } from '@/lib/db/schema/app';
import { CopyIcon, TrashIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckIcon } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { format } from 'timeago.js';
import { useTRPC } from '@/lib/trpc/trpc';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader } from '@/components/ui/loader';
import { Checkbox } from '@/components/ui/checkbox';

export function DisplayMemories() {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [globalFilter, setGlobalFilter] = React.useState('');
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState<string | null>(null);
    const [copiedId, setCopiedId] = React.useState<string | null>(null);

    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const { data: memories, isLoading } = useQuery(trpc.memories.getMemories.queryOptions());
    const deleteMemoryMutation = useMutation(trpc.memories.deleteMemory.mutationOptions());
    const deleteSelectedMemoriesMutation = useMutation(
        trpc.memories.deleteSelectedMemories.mutationOptions()
    );

    const columns: ColumnDef<Memory>[] = [
        {
            accessorKey: 'content',
            header: ({ column }) => {
                return <p className="text-xs">CONTENT</p>;
            },
            cell: ({ row }) => (
                <div className="max-w-[400px] break-words whitespace-pre-line">
                    {row.getValue('content')}
                </div>
            ),
            enableGlobalFilter: true,
        },
        {
            accessorKey: 'createdAt',
            header: ({ column }) => {
                return <p className="text-xs">CREATED AT</p>;
            },
            cell: ({ row }) => (
                <div className="capitalize">
                    {row.original.createdAt ? format(row.original.createdAt) : 'Never'}
                </div>
            ),
        },
        {
            id: 'actions',
            enableHiding: false,
            cell: ({ row }) => {
                const memory = row.original;

                const handleDelete = () => {
                    deleteMemoryMutation.mutate(
                        { id: memory.id },
                        {
                            onSuccess: () => {
                                toast.success('Memory deleted successfully');
                                setDeleteDialogOpen(null);
                                queryClient.invalidateQueries(
                                    trpc.memories.getMemories.queryOptions()
                                );
                            },
                            onError: () => {
                                toast.error('Failed to delete memory');
                                setDeleteDialogOpen(null);
                            },
                        }
                    );
                };

                const handleCopy = async () => {
                    try {
                        await navigator.clipboard.writeText(memory.content);
                        setCopiedId(memory.id);
                        toast.success('Memory content copied to clipboard');
                        setTimeout(() => setCopiedId(null), 2000);
                    } catch (error) {
                        toast.error('Failed to copy to clipboard');
                    }
                };

                return (
                    <div className="flex w-full space-x-2 justify-end">
                        <Button variant="outline" size="sm" onClick={handleCopy} className="h-8">
                            <AnimatePresence mode="wait" initial={false}>
                                {copiedId === memory.id ? (
                                    <motion.div
                                        key="check"
                                        initial={{ scale: 0, opacity: 0, rotate: -180 }}
                                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                        exit={{ scale: 0, opacity: 0, rotate: 180 }}
                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    >
                                        <CheckIcon className="size-3" />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="copy"
                                        initial={{ scale: 0, opacity: 0, rotate: -180 }}
                                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                        exit={{ scale: 0, opacity: 0, rotate: 180 }}
                                        transition={{ type: 'tween', duration: 0.2 }}
                                    >
                                        <CopyIcon className="size-3" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </Button>

                        <Dialog
                            open={deleteDialogOpen === memory.id}
                            onOpenChange={(open) => setDeleteDialogOpen(open ? memory.id : null)}
                        >
                            <DialogTrigger asChild>
                                <Button variant="destructive" size="sm" className="h-8">
                                    <TrashIcon className="size-3" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Delete Memory</DialogTitle>
                                    <DialogDescription>
                                        Are you sure you want to delete this memory? This action
                                        cannot be undone.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() => setDeleteDialogOpen(null)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleDelete}
                                        disabled={deleteMemoryMutation.isPending}
                                    >
                                        {deleteMemoryMutation.isPending ? 'Deleting...' : 'Delete'}
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

    const selectedRows = table.getSelectedRowModel().rows;
    const selectedMemoryIds = selectedRows.map((row) => row.original.id);

    if (isLoading) return <Loader />;

    return (
        <div className="w-full">
            <div className="flex items-center justify-between pb-2">
                <Input
                    placeholder="Filter memories..."
                    value={globalFilter ?? ''}
                    onChange={(event) => setGlobalFilter(event.target.value)}
                    className="max-w-sm h-8"
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
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && 'selected'}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
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
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}

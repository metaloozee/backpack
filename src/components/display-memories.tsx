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
import { ArrowUpDown, ChevronDown, CopyIcon, MoreHorizontal, TrashIcon } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from './ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { format } from 'timeago.js';
import { useTRPC } from '@/lib/trpc/trpc';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader } from './ui/loader';
import { Checkbox } from './ui/checkbox';

export function DisplayMemories() {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});
    const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = React.useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

    const trpc = useTRPC();

    const { data: memories, isLoading } = useQuery(trpc.memories.getMemories.queryOptions());
    const deleteMemoryMutation = useMutation(trpc.memories.deleteMemory.mutationOptions());
    const deleteSelectedMemoriesMutation = useMutation(
        trpc.memories.deleteSelectedMemories.mutationOptions()
    );

    const columns: ColumnDef<Memory>[] = [
        {
            id: 'select',
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && 'indeterminate')
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select All"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: 'content',
            header: ({ column }) => {
                return <p className="text-xs">CONTENT</p>;
            },
            cell: ({ row }) => (
                <div className="max-w-[500px] truncate">{row.getValue('content')}</div>
            ),
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
                                setDeleteDialogOpen(false);
                            },
                            onError: () => {
                                toast.error('Failed to delete memory');
                                setDeleteDialogOpen(false);
                            },
                        }
                    );
                };

                const handleCopy = () => {
                    navigator.clipboard.writeText(memory.content);
                    toast.success('Memory content copied to clipboard');
                };

                return (
                    <div className="flex w-full space-x-2 justify-end">
                        <Button variant="outline" size="sm" onClick={handleCopy} className="h-8">
                            <CopyIcon className="size-3" />
                        </Button>

                        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
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
                                        onClick={() => setDeleteDialogOpen(false)}
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
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    });

    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedMemoryIds = selectedRows.map((row) => row.original.id);

    const handleBulkDelete = () => {
        deleteSelectedMemoriesMutation.mutate(
            { ids: selectedMemoryIds },
            {
                onSuccess: () => {
                    toast.success(`${selectedRows.length} memories deleted successfully`);
                    table.resetRowSelection();
                    setBulkDeleteDialogOpen(false);
                },
                onError: () => {
                    toast.error('Failed to delete selected memories');
                    setBulkDeleteDialogOpen(false);
                },
            }
        );
    };

    if (isLoading) return <Loader />;

    return (
        <div className="w-full">
            <div className="flex items-center justify-between pb-2">
                <Input
                    placeholder="Filter memories..."
                    value={(table.getColumn('content')?.getFilterValue() as string) ?? ''}
                    onChange={(event) =>
                        table.getColumn('content')?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
                {selectedRows.length > 0 && (
                    <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="secondary">
                                <TrashIcon className="size-4" />
                                Delete {selectedRows.length} row(s)
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Delete Selected Memories</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to delete {selectedRows.length} selected
                                    memories? This action cannot be undone.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setBulkDeleteDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleBulkDelete}
                                    disabled={deleteSelectedMemoriesMutation.isPending}
                                >
                                    {deleteSelectedMemoriesMutation.isPending
                                        ? 'Deleting...'
                                        : 'Delete All'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
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
                <div className="text-muted-foreground flex-1 text-xs">
                    {table.getFilteredSelectedRowModel().rows.length} of{' '}
                    {table.getFilteredRowModel().rows.length} row(s) selected.
                </div>
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

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	ActivityIcon,
	CheckIcon,
	MoreVerticalIcon,
	PencilIcon,
	PlusIcon,
	ServerIcon,
	TrashIcon,
	XIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useTRPC } from "@/lib/trpc/trpc";

interface McpServer {
	id: string;
	name: string;
	url: string;
	hasApiKey: boolean;
	apiKeyLast4?: string | null;
	enabled: boolean;
	lastConnectedAt?: Date | null;
	lastError?: string | null;
}

export function McpServerConfig() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingServer, setEditingServer] = useState<McpServer | null>(null);
	const [pendingDelete, setPendingDelete] = useState<McpServer | null>(null);

	const { data, isLoading } = useQuery(trpc.mcp.getServers.queryOptions());

	const deleteMutation = useMutation(
		trpc.mcp.deleteServer.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.mcp.getServers.queryKey(),
				});
				toast.success("Server deleted");
			},
			onError: (err) => toast.error(`Failed to delete: ${err.message}`),
		})
	);

	const testConnectionMutation = useMutation(
		trpc.mcp.testConnection.mutationOptions({
			onSuccess: (result) => {
				if (result.success) {
					toast.success("Connection successful");
					queryClient.invalidateQueries({
						queryKey: trpc.mcp.getServers.queryKey(),
					});
				} else {
					toast.error(`Connection failed: ${result.error}`);
				}
			},
			onError: (err) => toast.error(`Test failed: ${err.message}`),
		})
	);

	const handleEdit = (server: McpServer) => {
		setEditingServer(server);
		setIsDialogOpen(true);
	};

	const handleDelete = (server: McpServer) => {
		setPendingDelete(server);
	};

	const handleTest = (serverId: string) => {
		toast.info("Testing connection...");
		testConnectionMutation.mutate({ serverId });
	};

	const handleDialogClose = (open: boolean) => {
		setIsDialogOpen(open);
		if (!open) {
			setEditingServer(null);
		}
	};

	const confirmDelete = () => {
		if (!pendingDelete) {
			return;
		}
		deleteMutation.mutate({ serverId: pendingDelete.id });
		setPendingDelete(null);
	};

	const renderStatusBadge = (server: McpServer) => {
		if (server.lastConnectedAt) {
			return (
				<span
					className="flex h-6 w-fit items-center gap-1.5 rounded-full border border-green-500/40 bg-green-500/10 px-2.5 font-medium text-[10px] text-green-400"
					title={`Last connected: ${server.lastConnectedAt.toLocaleString()}`}
				>
					<CheckIcon className="size-3" />
					OK
				</span>
			);
		}

		if (server.lastError) {
			return (
				<span
					className="flex h-6 w-fit items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/10 px-2.5 font-medium text-[10px] text-red-400"
					title={server.lastError}
				>
					<XIcon className="size-3" />
					Error
				</span>
			);
		}

		return (
			<span className="flex h-6 w-fit items-center gap-1.5 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-2.5 font-medium text-[10px] text-yellow-400">
				<ActivityIcon className="size-3" />
				Unknown
			</span>
		);
	};

	const servers = data?.servers ?? [];

	return (
		<div className="flex w-full flex-col gap-6">
			<div className="flex items-center justify-between">
				<div className="flex flex-col gap-1">
					<h2 className="font-medium text-lg">MCP Servers</h2>
					<p className="text-muted-foreground text-xs">
						Manage your Model Context Protocol servers.
					</p>
				</div>
				<Button
					onClick={() => {
						setEditingServer(null);
						setIsDialogOpen(true);
					}}
					size="sm"
				>
					<PlusIcon className="mr-2 size-4" /> Add Server
				</Button>
			</div>
			<Separator className="bg-neutral-800" />

			{isLoading ? (
				<div className="flex h-32 items-center justify-center rounded-md border border-neutral-800 bg-neutral-900/50 text-muted-foreground text-sm">
					Loading servers...
				</div>
			) : null}
			{!isLoading && servers.length === 0 ? (
				<div className="flex h-32 flex-col items-center justify-center gap-3 rounded-md border border-neutral-800 border-dashed bg-neutral-900/20 text-muted-foreground text-sm">
					<div className="flex size-10 items-center justify-center rounded-full bg-neutral-800/50">
						<ServerIcon className="size-5 opacity-50" />
					</div>
					<p>No MCP servers configured</p>
				</div>
			) : null}
			{!isLoading && servers.length > 0 ? (
				<div className="overflow-hidden rounded-md border border-neutral-800 bg-neutral-900 shadow-sm">
					<Table>
						<TableHeader className="bg-neutral-900 hover:bg-neutral-900">
							<TableRow className="border-neutral-800 hover:bg-neutral-900">
								<TableHead>
									<p className="font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
										Name
									</p>
								</TableHead>
								<TableHead>
									<p className="font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
										URL
									</p>
								</TableHead>
								<TableHead className="w-[120px]">
									<p className="font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
										Status
									</p>
								</TableHead>
								<TableHead className="w-[80px] text-right">
									<p className="font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
										Actions
									</p>
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{servers.map((server) => (
								<TableRow
									className="border-neutral-800 transition-colors hover:bg-neutral-800/50"
									key={server.id}
								>
									<TableCell className="font-medium">
										<div className="flex flex-col gap-0.5">
											<span className="text-sm">
												{server.name}
											</span>
											{server.hasApiKey && (
												<span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
													<div className="size-1.5 rounded-full bg-green-500/50" />
													{server.apiKeyLast4
														? `•••• ${server.apiKeyLast4}`
														: "API Key Set"}
												</span>
											)}
										</div>
									</TableCell>
									<TableCell className="font-mono text-muted-foreground text-xs">
										{server.url}
									</TableCell>
									<TableCell>
										{renderStatusBadge(server)}
									</TableCell>
									<TableCell className="text-right">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													className="size-8 text-muted-foreground hover:text-foreground"
													size="icon"
													variant="ghost"
												>
													<MoreVerticalIcon className="size-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem
													onClick={() =>
														handleTest(server.id)
													}
												>
													<ActivityIcon className="mr-2 size-4" />
													Test Connection
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() =>
														handleEdit(server)
													}
												>
													<PencilIcon className="mr-2 size-4" />
													Edit
												</DropdownMenuItem>
												<DropdownMenuItem
													className="text-red-500 focus:text-red-500"
													onClick={() =>
														handleDelete(server)
													}
												>
													<TrashIcon className="mr-2 size-4" />
													Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			) : null}

			<ServerDialog
				initialData={editingServer}
				key={editingServer?.id ?? "new-server"}
				onOpenChange={handleDialogClose}
				open={isDialogOpen}
			/>
			<Dialog
				onOpenChange={(open) => {
					if (!open) {
						setPendingDelete(null);
					}
				}}
				open={Boolean(pendingDelete)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete MCP server</DialogTitle>
						<DialogDescription>
							This will permanently remove the MCP server
							configuration.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							onClick={() => setPendingDelete(null)}
							variant="outline"
						>
							Cancel
						</Button>
						<Button
							disabled={!pendingDelete}
							onClick={confirmDelete}
							variant="destructive"
						>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

function ServerDialog({
	open,
	onOpenChange,
	initialData,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialData: McpServer | null;
}) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const [name, setName] = useState(initialData?.name ?? "");
	const [url, setUrl] = useState(initialData?.url ?? "");
	const [apiKey, setApiKey] = useState("");

	const addMutation = useMutation(
		trpc.mcp.addServer.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.mcp.getServers.queryKey(),
				});
				toast.success("Server added");
				onOpenChange(false);
				resetForm();
			},
			onError: (err) => toast.error(`Failed to add: ${err.message}`),
		})
	);

	const updateMutation = useMutation(
		trpc.mcp.updateServer.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.mcp.getServers.queryKey(),
				});
				toast.success("Server updated");
				onOpenChange(false);
				resetForm();
			},
			onError: (err) => toast.error(`Failed to update: ${err.message}`),
		})
	);

	const resetForm = () => {
		setName("");
		setUrl("");
		setApiKey("");
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (initialData) {
			updateMutation.mutate({
				id: initialData.id,
				name,
				url,
				apiKey: apiKey || undefined,
			});
		} else {
			addMutation.mutate({
				name,
				url,
				apiKey: apiKey || undefined,
			});
		}
	};

	const isPending = addMutation.isPending || updateMutation.isPending;
	let submitLabel = "Add Server";
	if (isPending) {
		submitLabel = "Saving...";
	} else if (initialData) {
		submitLabel = "Update";
	}

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{initialData ? "Edit MCP Server" : "Add MCP Server"}
					</DialogTitle>
					<DialogDescription>
						Configure your Model Context Protocol server connection.
					</DialogDescription>
				</DialogHeader>
				<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
					<div className="flex flex-col gap-2">
						<Label htmlFor="name">Name</Label>
						<Input
							id="name"
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g. My Local Server"
							required
							value={name}
						/>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="url">URL</Label>
						<Input
							id="url"
							onChange={(e) => setUrl(e.target.value)}
							placeholder="http://localhost:8000/mcp"
							required
							type="url"
							value={url}
						/>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="apiKey">
							API Key {initialData && "(Optional)"}
						</Label>
						<Input
							id="apiKey"
							onChange={(e) => setApiKey(e.target.value)}
							placeholder={
								initialData
									? "Leave blank to keep existing key"
									: "Enter API key if required"
							}
							type="password"
							value={apiKey}
						/>
						<p className="text-[10px] text-muted-foreground">
							Stored securely and encrypted.
						</p>
					</div>
					<DialogFooter>
						<Button
							onClick={() => onOpenChange(false)}
							type="button"
							variant="outline"
						>
							Cancel
						</Button>
						<Button disabled={isPending} type="submit">
							{submitLabel}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

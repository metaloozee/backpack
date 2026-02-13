"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	ActivityIcon,
	KeyIcon,
	Loader2Icon,
	PencilIcon,
	PlusIcon,
	TrashIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { getMcpStatus } from "@/lib/mcp/status";
import { useTRPC } from "@/lib/trpc/trpc";
import { Loader } from "./ui/loader";

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
		const status = getMcpStatus({
			lastConnectedAt: server.lastConnectedAt,
			lastError: server.lastError,
			hasApiKey: server.hasApiKey,
		});

		switch (status) {
			case "ready":
				return (
					<Badge
						className="gap-1.5 border-0 bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
						title={
							server.lastConnectedAt
								? `Last connected: ${server.lastConnectedAt.toLocaleString()}`
								: undefined
						}
						variant="secondary"
					>
						<span className="size-1.5 rounded-full bg-emerald-500" />
						Connected
					</Badge>
				);
			case "degraded":
				return (
					<Badge
						className="gap-1.5 border-0 bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
						title={server.lastError ?? "Retry connection"}
						variant="secondary"
					>
						<span className="size-1.5 rounded-full bg-amber-500" />
						Degraded
					</Badge>
				);
			case "failed":
			case "needs_auth":
				return (
					<Badge
						className="gap-1.5 border-0 bg-red-500/15 text-red-700 dark:bg-red-500/20 dark:text-red-300"
						title={server.lastError ?? undefined}
						variant="secondary"
					>
						<span className="size-1.5 rounded-full bg-red-500" />
						{status === "needs_auth" ? "Needs auth" : "Failed"}
					</Badge>
				);
			default:
				return (
					<Badge
						className="gap-1.5 border-0 bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
						variant="secondary"
					>
						<span className="size-1.5 rounded-full bg-amber-500" />
						Unknown
					</Badge>
				);
		}
	};

	const servers = data?.servers ?? [];

	return (
		<div className="flex w-full flex-col gap-4">
			<div className="flex w-full flex-row items-end justify-between">
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
					variant={"outline"}
				>
					<PlusIcon className="size-3.5" /> Add Server
				</Button>
			</div>
			<Separator />

			{isLoading ? <Loader /> : null}
			{!isLoading && servers.length === 0 ? (
				<div className="flex h-24 items-center justify-center rounded-md border text-center text-muted-foreground text-sm">
					No servers configured
				</div>
			) : null}
			{!isLoading && servers.length > 0 ? (
				<div className="overflow-hidden rounded-md border">
					<Table>
						<TableHeader>
							<TableRow className="hover:bg-transparent">
								<TableHead>
									<p className="text-xs">Name</p>
								</TableHead>
								<TableHead>
									<p className="text-xs">URL</p>
								</TableHead>
								<TableHead className="w-30">
									<p className="text-xs">Status</p>
								</TableHead>
								<TableHead className="w-37 text-right">
									<p className="text-xs">Actions</p>
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{servers.map((server) => (
								<TableRow key={server.id}>
									<TableCell className="font-medium">
										<span className="flex items-center gap-2 text-sm">
											{server.name}
											{server.hasApiKey && (
												<KeyIcon className="size-3 text-muted-foreground" />
											)}
										</span>
									</TableCell>
									<TableCell className="font-mono text-muted-foreground text-xs">
										{server.url}
									</TableCell>
									<TableCell>
										{renderStatusBadge(server)}
									</TableCell>
									<TableCell className="text-right">
										<div className="flex justify-end space-x-2">
											<Button
												className="h-8"
												onClick={() =>
													handleTest(server.id)
												}
												size="sm"
												variant="outline"
											>
												<ActivityIcon className="size-3" />
											</Button>
											<Button
												className="h-8"
												onClick={() =>
													handleEdit(server)
												}
												size="sm"
												variant="outline"
											>
												<PencilIcon className="size-3" />
											</Button>
											<Dialog
												onOpenChange={(open) =>
													setPendingDelete(
														open ? server : null
													)
												}
												open={
													pendingDelete?.id ===
													server.id
												}
											>
												<DialogTrigger asChild>
													<Button
														className="h-8"
														size="sm"
														variant="destructive"
													>
														<TrashIcon className="size-3" />
													</Button>
												</DialogTrigger>
												<DialogContent>
													<DialogHeader>
														<DialogTitle>
															Delete MCP server
														</DialogTitle>
														<DialogDescription>
															This will
															permanently remove
															the MCP server
															configuration.
														</DialogDescription>
													</DialogHeader>
													<DialogFooter>
														<Button
															onClick={() =>
																setPendingDelete(
																	null
																)
															}
															variant="outline"
														>
															Cancel
														</Button>
														<Button
															disabled={
																!pendingDelete
															}
															onClick={
																confirmDelete
															}
															variant="destructive"
														>
															Delete
														</Button>
													</DialogFooter>
												</DialogContent>
											</Dialog>
										</div>
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

	const testConnectionMutation = useMutation(
		trpc.mcp.testConnection.mutationOptions({
			onSuccess: (result) => {
				queryClient.invalidateQueries({
					queryKey: trpc.mcp.getServers.queryKey(),
				});
				if (!result.success && result.error) {
					toast.error(`Connection failed: ${result.error}`);
				}
			},
			onError: (err) => toast.error(`Test failed: ${err.message}`),
		})
	);

	const addMutation = useMutation(
		trpc.mcp.addServer.mutationOptions({
			onSuccess: (result) => {
				queryClient.invalidateQueries({
					queryKey: trpc.mcp.getServers.queryKey(),
				});
				testConnectionMutation.mutate({ serverId: result.id });
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
	if (initialData) {
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
							{isPending ? (
								<Loader2Icon className="animate-spin" />
							) : (
								submitLabel
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

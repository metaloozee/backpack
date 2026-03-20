import type { inferRouterOutputs } from "@trpc/server";
import { CheckIcon, ServerIcon, TelescopeIcon } from "lucide-react";
import { getMcpServerSubtitle } from "@/components/mode-selector-helpers";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { defaultTools, type ToolsState } from "@/lib/ai/tools";
import { getMcpStatus, isMcpServerDisabled } from "@/lib/mcp/status";
import type { AppRouter } from "@/lib/server/routers/_app";
import { cn } from "@/lib/utils";

export type AskToolsLayout = "drawer" | "dropdown";

type McpServersQuery = inferRouterOutputs<AppRouter>["mcp"]["getServers"];

function toolRowPadding(layout: AskToolsLayout): string {
	return layout === "drawer" ? "py-2.5 pl-3 pr-2" : "p-3";
}

function toolIconGapClass(layout: AskToolsLayout): string {
	return layout === "drawer" ? "gap-2.5 sm:gap-3" : "gap-3";
}

function ToolToggleRow({
	tool,
	layout,
	isChecked,
	setTool,
}: {
	tool: (typeof defaultTools)[number];
	layout: AskToolsLayout;
	isChecked: boolean;
	setTool: (id: string, checked: boolean) => void;
}) {
	const IconComponent = tool.icon;
	const rowPad = toolRowPadding(layout);
	const inner = (
		<>
			<div
				className={cn(
					"flex min-w-0 flex-1 items-center",
					toolIconGapClass(layout)
				)}
			>
				<IconComponent
					className={cn(
						"size-4 text-muted-foreground",
						layout === "drawer" && "shrink-0"
					)}
				/>
				<div className="flex min-w-0 flex-1 flex-col">
					<span className="font-medium text-sm leading-tight">
						{tool.name}
					</span>
					<span
						className={cn(
							"text-muted-foreground text-xs leading-snug",
							layout === "drawer" && "line-clamp-2"
						)}
					>
						{tool.description}
					</span>
				</div>
			</div>
			<Switch
				checked={isChecked}
				className="shrink-0"
				key={`tool-switch-${tool.id}-${isChecked}`}
				onCheckedChange={(checked) => setTool(tool.id, checked)}
			/>
		</>
	);

	if (layout === "dropdown") {
		return (
			<DropdownMenuItem
				className="flex cursor-pointer items-center justify-between p-3 focus:bg-accent dark:focus:bg-neutral-800"
				onClick={(e) => e.preventDefault()}
			>
				{inner}
			</DropdownMenuItem>
		);
	}

	return (
		<div
			className={cn(
				"flex items-center justify-between rounded-md focus-within:bg-accent dark:focus-within:bg-neutral-800",
				rowPad
			)}
		>
			{inner}
		</div>
	);
}

function McpServerRow({
	server,
	layout,
	isChecked,
	disabled,
	subtitle,
	toolCount,
	setMcpServer,
}: {
	server: NonNullable<McpServersQuery["servers"]>[number];
	layout: AskToolsLayout;
	isChecked: boolean;
	disabled: boolean;
	subtitle: string;
	toolCount: number;
	setMcpServer: (id: string, checked: boolean) => void;
}) {
	const rowPad = toolRowPadding(layout);
	const inner = (
		<>
			<div
				className={cn(
					"flex min-w-0 flex-1 items-center",
					toolIconGapClass(layout)
				)}
			>
				<ServerIcon
					className={cn(
						"size-4 text-muted-foreground",
						layout === "drawer" && "shrink-0"
					)}
				/>
				<div className="flex min-w-0 flex-1 flex-col">
					<div className="flex flex-wrap items-center gap-2">
						<span className="font-medium text-sm leading-tight">
							{server.name}
						</span>
						{toolCount > 0 && (
							<Badge
								className="h-4 px-1 text-[10px]"
								variant="secondary"
							>
								{toolCount}
							</Badge>
						)}
					</div>
					<span
						className={cn(
							"text-muted-foreground text-xs leading-snug",
							layout === "drawer" && "line-clamp-1 break-all"
						)}
					>
						{subtitle}
					</span>
				</div>
			</div>
			<Switch
				checked={isChecked}
				className="shrink-0"
				disabled={disabled}
				key={`mcp-switch-${server.id}-${isChecked}`}
				onCheckedChange={(checked) => setMcpServer(server.id, checked)}
			/>
		</>
	);

	if (layout === "dropdown") {
		return (
			<DropdownMenuItem
				className={cn(
					"flex cursor-pointer items-center justify-between p-3 focus:bg-accent dark:focus:bg-neutral-800",
					disabled && "cursor-not-allowed opacity-70"
				)}
				disabled={disabled}
				onClick={(e) => e.preventDefault()}
			>
				{inner}
			</DropdownMenuItem>
		);
	}

	return (
		<div
			className={cn(
				"flex items-center justify-between rounded-md focus-within:bg-accent dark:focus-within:bg-neutral-800",
				rowPad,
				disabled && "opacity-70"
			)}
		>
			{inner}
		</div>
	);
}

export function AskToolsSection({
	layout,
	activeTools,
	setTool,
	mcpServersData,
	activeMcpServers,
	setMcpServer,
}: {
	layout: AskToolsLayout;
	activeTools: ToolsState;
	setTool: (id: string, checked: boolean) => void;
	mcpServersData: McpServersQuery | undefined;
	activeMcpServers: Record<string, boolean>;
	setMcpServer: (id: string, checked: boolean) => void;
}) {
	const servers = mcpServersData?.servers;
	const hasMcp = Boolean(servers && servers.length > 0);

	return (
		<>
			{defaultTools.map((tool) => (
				<ToolToggleRow
					isChecked={activeTools[tool.id]}
					key={tool.id}
					layout={layout}
					setTool={setTool}
					tool={tool}
				/>
			))}

			{hasMcp && servers && (
				<>
					{layout === "drawer" ? (
						<div className="my-2 h-px bg-border dark:bg-neutral-800" />
					) : (
						<DropdownMenuSeparator className="dark:bg-neutral-800" />
					)}
					{layout === "drawer" ? (
						<p className="px-3 py-1.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">
							MCP Servers
						</p>
					) : (
						<DropdownMenuLabel className="px-3 py-2 font-medium text-muted-foreground text-xs">
							MCP Servers
						</DropdownMenuLabel>
					)}
					{servers.map((server) => {
						const isChecked = activeMcpServers[server.id] ?? false;
						const status = getMcpStatus({
							lastConnectedAt: server.lastConnectedAt,
							lastError: server.lastError,
							hasApiKey: server.hasApiKey,
						});
						const disabled = isMcpServerDisabled(status);
						const toolCount =
							server.toolsCache &&
							Array.isArray(server.toolsCache)
								? server.toolsCache.length
								: 0;
						const subtitle = getMcpServerSubtitle(
							status,
							server.url
						);

						return (
							<McpServerRow
								disabled={disabled}
								isChecked={isChecked}
								key={server.id}
								layout={layout}
								server={server}
								setMcpServer={setMcpServer}
								subtitle={subtitle}
								toolCount={toolCount}
							/>
						);
					})}
				</>
			)}
		</>
	);
}

const AGENT_KEYS = ["research"] as const;

export type AgentRowLayout = "drawer" | "dropdown";

function formatAgentLabel(agentKey: string): string {
	return agentKey.charAt(0).toUpperCase() + agentKey.slice(1);
}

export function AgentOptionsList({
	layout,
	activeSelectedAgent,
	onSelect,
}: {
	layout: AgentRowLayout;
	activeSelectedAgent: string | null;
	onSelect: (key: string) => void;
}) {
	const rowPad = layout === "drawer" ? "py-2.5 pl-3 pr-2" : "p-3";
	const gapClass = layout === "drawer" ? "gap-2.5 sm:gap-3" : "gap-3";

	return (
		<>
			{AGENT_KEYS.map((agentKey) => {
				const isSelected = activeSelectedAgent === agentKey;
				const label = formatAgentLabel(agentKey);

				if (layout === "dropdown") {
					return (
						<DropdownMenuItem
							className="flex cursor-pointer items-center justify-between p-3 focus:bg-accent dark:focus:bg-neutral-800"
							key={agentKey}
							onSelect={(e) => {
								e.preventDefault();
								onSelect(agentKey);
							}}
						>
							<div className={cn("flex items-center", gapClass)}>
								<TelescopeIcon className="size-4 text-muted-foreground" />
								<div className="flex flex-col">
									<span className="font-medium text-sm leading-tight">
										{label}
									</span>
									<span className="text-muted-foreground text-xs">
										{label} agent
									</span>
								</div>
							</div>
							{isSelected && (
								<CheckIcon className="size-4 shrink-0 text-primary" />
							)}
						</DropdownMenuItem>
					);
				}

				return (
					<button
						className={cn(
							"flex w-full cursor-pointer items-center justify-between rounded-md text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:hover:bg-neutral-800",
							rowPad
						)}
						key={agentKey}
						onClick={() => onSelect(agentKey)}
						type="button"
					>
						<div className={cn("flex items-center", gapClass)}>
							<TelescopeIcon className="size-4 shrink-0 text-muted-foreground" />
							<div className="flex flex-col">
								<span className="font-medium text-sm leading-tight">
									{label}
								</span>
								<span className="text-muted-foreground text-xs">
									{label} agent
								</span>
							</div>
						</div>
						{isSelected && (
							<CheckIcon className="size-4 shrink-0 text-primary" />
						)}
					</button>
				);
			})}
		</>
	);
}

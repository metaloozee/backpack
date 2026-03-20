"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState } from "react";
import {
	getActivePrefs,
	getAllToolsDisabled,
} from "@/components/mode-selector-helpers";
import {
	AgentOptionsList,
	AskToolsSection,
} from "@/components/mode-selector-rows";
import { ResponsiveSettingsMenuShell } from "@/components/responsive-settings-shell";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { slideVariants, transitions } from "@/lib/animations";
import { useIsMobile } from "@/lib/hooks/use-mobile";
import type { ModeType } from "@/lib/store/slices/mode.slice";
import { usePrefsStore } from "@/lib/store/store";
import { usePrefsHydrated } from "@/lib/store/use-prefs-hydrated";
import { useTRPC } from "@/lib/trpc/trpc";
import { cn } from "@/lib/utils";

const modeTypes = [
	{ value: "ask", label: "Ask", disabled: false },
	{ value: "agent", label: "Agent", disabled: false },
] as const;

const drawerSurface =
	"border-border bg-popover dark:border-neutral-800 dark:bg-neutral-950";

export function ModeSelector({
	initialMcpServers,
	initialMode,
	initialSelectedAgent,
	initialTools,
}: {
	initialMcpServers?: Record<string, boolean>;
	initialMode?: string;
	initialSelectedAgent?: string;
	initialTools?: Record<string, boolean>;
}) {
	const isMobile = useIsMobile();
	const [askDrawerOpen, setAskDrawerOpen] = useState(false);
	const [agentDrawerOpen, setAgentDrawerOpen] = useState(false);
	const hasHydrated = usePrefsHydrated();
	const mode = usePrefsStore((s) => s.mode);
	const setMode = usePrefsStore((s) => s.setMode);
	const selectedAgent = usePrefsStore((s) => s.selectedAgent);
	const setSelectedAgent = usePrefsStore((s) => s.setSelectedAgent);
	const tools = usePrefsStore((s) => s.tools);
	const setTool = usePrefsStore((s) => s.setTool);
	const setAllTools = usePrefsStore((s) => s.setAllTools);
	const resetTools = usePrefsStore((s) => s.resetTools);
	const mcpServers = usePrefsStore((s) => s.mcpServers);
	const setMcpServer = usePrefsStore((s) => s.setMcpServer);

	const { activeMode, activeSelectedAgent, activeTools, activeMcpServers } =
		getActivePrefs({
			hasHydrated,
			initialMcpServers,
			initialMode,
			initialSelectedAgent,
			initialTools,
			mode,
			mcpServers,
			selectedAgent,
			tools,
		});

	const trpc = useTRPC();
	const { data: mcpServersData } = useQuery(
		trpc.mcp.getServers.queryOptions(undefined, {
			enabled: activeMode === "ask",
		})
	);

	const handleModeChange = (value: string) => {
		const newMode = value as ModeType;
		if (newMode === activeMode) {
			return;
		}

		setAskDrawerOpen(false);
		setAgentDrawerOpen(false);
		setMode(newMode);

		if (newMode === "agent") {
			setAllTools(getAllToolsDisabled() as typeof tools);
		} else {
			resetTools();
		}
	};

	const handleAgentSelect = (agentKey: string) => {
		const newAgent = activeSelectedAgent === agentKey ? null : agentKey;
		setSelectedAgent(newAgent);
		if (isMobile) {
			setAgentDrawerOpen(false);
		}
	};

	const askToolsSharedProps = {
		activeMcpServers,
		activeTools,
		mcpServersData,
		setMcpServer,
		setTool,
	};

	return (
		<motion.div
			className="flex flex-row items-center justify-start gap-2"
			layout
			transition={transitions.smooth}
		>
			<motion.div
				animate="visible"
				className="flex items-center"
				initial="hidden"
				transition={transitions.smooth}
				variants={slideVariants.up}
			>
				<Tabs onValueChange={handleModeChange} value={activeMode}>
					<TabsList className="bg-muted dark:bg-neutral-950">
						{modeTypes.map((m) => (
							<TabsTrigger
								className="text-xs"
								disabled={m.disabled}
								key={m.value}
								value={m.value}
							>
								{m.label}
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>

				{activeMode === "ask" && (
					<ResponsiveSettingsMenuShell
						desktopTriggerAriaLabel="Ask mode options"
						drawerBodyClassName="max-h-[55vh] overflow-y-auto overscroll-contain px-1 pt-1 pb-[max(1rem,var(--safe-area-bottom))]"
						drawerContentClassName={cn(
							"max-h-[min(78vh,560px)]",
							drawerSurface
						)}
						drawerOpen={askDrawerOpen}
						drawerTitle="Tools & MCP"
						dropdownContentClassName={cn("w-xs", drawerSurface)}
						dropdownTooltip="Configure Tools"
						isMobile={isMobile}
						mobileExpanded={askDrawerOpen}
						mobileTriggerAriaLabel="Configure tools"
						onDrawerOpenChange={setAskDrawerOpen}
					>
						<AskToolsSection
							{...askToolsSharedProps}
							layout={isMobile ? "drawer" : "dropdown"}
						/>
					</ResponsiveSettingsMenuShell>
				)}

				{activeMode === "agent" && (
					<ResponsiveSettingsMenuShell
						desktopTriggerAriaLabel="Agent mode options"
						drawerBodyClassName="px-1 pt-1 pb-[max(1rem,var(--safe-area-bottom))]"
						drawerContentClassName={cn(
							"max-h-[50vh]",
							drawerSurface
						)}
						drawerDescription="Choose an agent profile for this conversation."
						drawerOpen={agentDrawerOpen}
						drawerTitle="Agent"
						dropdownContentClassName={cn("w-xs", drawerSurface)}
						dropdownTooltip="Select Agent"
						isMobile={isMobile}
						mobileExpanded={agentDrawerOpen}
						mobileTriggerAriaLabel="Agent mode options"
						onDrawerOpenChange={setAgentDrawerOpen}
					>
						<AgentOptionsList
							activeSelectedAgent={activeSelectedAgent}
							layout={isMobile ? "drawer" : "dropdown"}
							onSelect={handleAgentSelect}
						/>
					</ResponsiveSettingsMenuShell>
				)}
			</motion.div>
		</motion.div>
	);
}

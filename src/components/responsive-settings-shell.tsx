"use client";

import { Settings2Icon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

export const modeSettingsTriggerClass =
	"ml-1 h-7 w-7 shrink-0 rounded-sm border-0 bg-transparent p-0 hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:hover:bg-neutral-800";

interface ResponsiveSettingsMenuShellProps {
	children: ReactNode;
	desktopTriggerAriaLabel: string;
	drawerBodyClassName: string;
	drawerContentClassName: string;
	drawerDescription?: ReactNode;
	drawerFooter?: ReactNode;
	drawerOpen: boolean;
	drawerTitle: ReactNode;
	dropdownContentClassName: string;
	dropdownTooltip: string;
	isMobile: boolean;
	mobileExpanded: boolean;
	mobileTriggerAriaLabel: string;
	onDrawerOpenChange: (open: boolean) => void;
}

export function ResponsiveSettingsMenuShell({
	isMobile,
	drawerOpen,
	onDrawerOpenChange,
	mobileExpanded,
	mobileTriggerAriaLabel,
	desktopTriggerAriaLabel,
	dropdownTooltip,
	drawerContentClassName,
	drawerTitle,
	drawerDescription,
	drawerBodyClassName,
	drawerFooter,
	dropdownContentClassName,
	children,
}: ResponsiveSettingsMenuShellProps) {
	if (isMobile) {
		return (
			<Drawer
				direction="bottom"
				onOpenChange={onDrawerOpenChange}
				open={drawerOpen}
				shouldScaleBackground={false}
			>
				<DrawerTrigger asChild>
					<Button
						aria-expanded={mobileExpanded}
						aria-label={mobileTriggerAriaLabel}
						className={modeSettingsTriggerClass}
						size="icon"
						type="button"
						variant="ghost"
					>
						<Settings2Icon className="size-3.5" />
					</Button>
				</DrawerTrigger>
				<DrawerContent className={drawerContentClassName}>
					<DrawerHeader className="space-y-1 px-4 pt-2 pb-3 text-left">
						<DrawerTitle className="font-semibold text-base tracking-tight">
							{drawerTitle}
						</DrawerTitle>
						{drawerDescription ? (
							<DrawerDescription className="text-left text-muted-foreground text-xs">
								{drawerDescription}
							</DrawerDescription>
						) : null}
					</DrawerHeader>
					<div className={drawerBodyClassName}>{children}</div>
					{drawerFooter}
				</DrawerContent>
			</Drawer>
		);
	}

	return (
		<DropdownMenu>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<DropdownMenuTrigger asChild>
							<Button
								aria-label={desktopTriggerAriaLabel}
								className={modeSettingsTriggerClass}
								size="icon"
								type="button"
								variant="ghost"
							>
								<Settings2Icon className="size-3.5" />
							</Button>
						</DropdownMenuTrigger>
					</TooltipTrigger>
					<TooltipContent>
						<p>{dropdownTooltip}</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
			<DropdownMenuContent
				align="start"
				className={dropdownContentClassName}
			>
				{children}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

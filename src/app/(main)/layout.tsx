import type { Metadata } from "next";
import { MobileHeader } from "@/components/mobile-header";
import { AppSidebar } from "@/components/sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { MobileHeaderProvider } from "@/lib/mobile-header-context";

export const metadata: Metadata = {
	title: "Backpack",
	description: "Backpack - Your intelligent AI chat assistant",
};

export default function MainLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<SidebarProvider defaultOpen={false}>
			<AppSidebar />
			<SidebarInset>
				<MobileHeaderProvider>
					<div className="flex h-dvh flex-col">
						<MobileHeader />
						<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
							{children}
						</div>
					</div>
				</MobileHeaderProvider>
			</SidebarInset>
		</SidebarProvider>
	);
}

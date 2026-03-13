import type { Metadata } from "next";
import { MobileHeader } from "@/components/mobile-header";
import { AppSidebar } from "@/components/sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

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
				<MobileHeader />
				{children}
			</SidebarInset>
		</SidebarProvider>
	);
}

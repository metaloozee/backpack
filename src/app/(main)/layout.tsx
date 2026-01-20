import type { Metadata } from "next";
import { AppSidebar } from "@/components/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

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
			<div className="w-full">{children}</div>
		</SidebarProvider>
	);
}

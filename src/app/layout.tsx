import "./globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { DataStreamProvider } from "@/components/data-stream-provider";
import { Devtools } from "@/components/devtools";
import { MotionProvider } from "@/components/motion-provider";
import { StoreHydration } from "@/components/store-hydration";
import { ThemeColorMeta } from "@/components/theme-color-meta";
// import { ReactScan } from "@/components/react-scan";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import TrpcProvider from "@/lib/trpc/client";
import { cn } from "@/lib/utils/cn";

const geistSans = Geist({
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Backpack",
	description: "Backpack - Your intelligent AI chat assistant",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<TrpcProvider>
			<html
				data-scroll-behavior="smooth"
				lang="en"
				suppressHydrationWarning
			>
				<body
					className={cn(
						"bg-background font-sans antialiased",
						geistSans.className
					)}
					suppressHydrationWarning
				>
					<StoreHydration />
					<NuqsAdapter>
						<DataStreamProvider>
							<MotionProvider>
								<ThemeProvider
									attribute="class"
									defaultTheme="system"
									disableTransitionOnChange
									enableSystem
								>
									<ThemeColorMeta />
									{/* <ReactScan /> */}
									<Devtools />
									<Toaster position="top-center" richColors />
									<main id="main-content">{children}</main>
								</ThemeProvider>
							</MotionProvider>
						</DataStreamProvider>
					</NuqsAdapter>
				</body>
			</html>
		</TrpcProvider>
	);
}

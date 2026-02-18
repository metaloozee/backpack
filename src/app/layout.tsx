import "./globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { DataStreamProvider } from "@/components/data-stream-provider";
import { Devtools } from "@/components/devtools";
import { MotionProvider } from "@/components/motion-provider";
// import { ReactScan } from "@/components/react-scan";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import TrpcProvider from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

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
			<html lang="en" suppressHydrationWarning>
				<head>
					<meta content="#000000" name="theme-color" />
				</head>
				<body
					className={cn(
						"bg-background font-sans antialiased",
						geistSans.className
					)}
					suppressHydrationWarning
				>
					<a
						className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
						href="#main-content"
					>
						Skip to content
					</a>
					<NuqsAdapter>
						<DataStreamProvider>
							<MotionProvider>
								<ThemeProvider
									attribute="class"
									defaultTheme="system"
									disableTransitionOnChange
									enableSystem
								>
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

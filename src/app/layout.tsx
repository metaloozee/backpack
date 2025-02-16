import './globals.css';

import type { Metadata } from 'next';
import { Ubuntu } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/sonner';
import { cookies } from 'next/headers';

import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/Sidebar';
import TrpcProvider from '@/lib/trpc/Provider';

const ubuntu = Ubuntu({
    weight: ['300', '400', '500', '700'],
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'Backpack',
    description: 'Generated by create next app',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <TrpcProvider cookies={''}>
            <html lang="en" suppressHydrationWarning>
                <body
                    className={cn('bg-background antialiased font-sans', ubuntu.className)}
                    suppressHydrationWarning
                >
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <Toaster richColors position="top-center" />
                        {children}
                    </ThemeProvider>
                </body>
            </html>
        </TrpcProvider>
    );
}

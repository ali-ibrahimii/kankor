"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useState } from "react";
import { Toaster } from "sonner";
import { PushMessageListener } from "@/components/blocks/notifications/push-message-listener";
import { PWAProvider } from "@/components/blocks/pwa/pwa-provider";
import { DirectionProvider } from "@/components/ui/direction";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/providers/auth.provider";
import { ThemeProvider } from "@/providers/theme.provider";

export const Providers = ({
	children,
	dir,
}: React.PropsWithChildren<{ dir: "rtl" | "ltr" }>) => {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						// Course/deck/quiz data changes rarely — a 5-minute
						// stale window stops every route change from re-fetching
						// the same catalogue rows (see docs/performance.md).
						staleTime: 5 * 60 * 1000,
						// Keep inactive queries around for 10 minutes so the
						// back button and in-app navigation render instantly
						// from cache instead of showing a loading skeleton.
						gcTime: 10 * 60 * 1000,
						// Refetching on every window focus costs a round-trip
						// to Supabase and visibly janks the UI on mobile, where
						// the app is switched to constantly.
						refetchOnWindowFocus: false,
						// Retrying three times with exponential backoff turns a
						// brief network blip into a multi-second spinner.
						retry: 1,
						retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
					},
				},
			})
	);

	return (
		<JotaiProvider>
			<QueryClientProvider client={queryClient}>
				<NuqsAdapter>
					<ThemeProvider defaultTheme="light">
						<DirectionProvider dir={dir}>
							<TooltipProvider>
								<PWAProvider>
									<AuthProvider>
										{children}
										<PushMessageListener />
									</AuthProvider>
								</PWAProvider>
							</TooltipProvider>
						</DirectionProvider>
						<Toaster className="font-sans" position="top-center" richColors />
					</ThemeProvider>
				</NuqsAdapter>
			</QueryClientProvider>
		</JotaiProvider>
	);
};

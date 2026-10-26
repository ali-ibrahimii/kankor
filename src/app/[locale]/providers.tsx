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
						staleTime: 30 * 1000,
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

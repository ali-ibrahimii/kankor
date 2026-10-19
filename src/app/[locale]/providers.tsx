"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";
import { PushMessageListener } from "@/components/blocks/notifications/push-message-listener";
import { PWAProvider } from "@/components/blocks/pwa/pwa-provider";
import { DirectionProvider } from "@/components/ui/direction";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/providers/auth.provider";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 30 * 1000,
		},
	},
});
export const Providers = ({
	children,
	dir,
}: React.PropsWithChildren<{ dir: "rtl" | "ltr" }>) => {
	return (
		<JotaiProvider>
			<QueryClientProvider client={queryClient}>
				<NuqsAdapter>
					<ThemeProvider
						attribute="class"
						defaultTheme="light"
						enableSystem
						disableTransitionOnChange
					>
						<DirectionProvider dir={dir}>
							<TooltipProvider>
								<PWAProvider>
									<AuthProvider>{children}</AuthProvider>
									<PushMessageListener />
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

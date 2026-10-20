import type { ReactNode } from "react";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

/**
 * Sticky top bar shared by every dashboard — sidebar trigger on the start
 * side, extra widgets (locale switcher, notification bell…) on the end side.
 */
export function DashboardTopbar({
	actions,
	pageTitle,
}: {
	/** Widgets pinned to the end of the bar. */
	actions?: ReactNode;
	/** Optional page/section title next to the trigger. */
	pageTitle?: ReactNode;
}) {
	return (
		<header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-border/70 bg-background/85 px-4 backdrop-blur-xl">
			<SidebarTrigger className="-ms-1" />
			<Separator orientation="vertical" className="h-4" />
			{pageTitle ? (
				<h1 className="truncate text-base font-bold text-foreground">
					{pageTitle}
				</h1>
			) : null}
			<div className="ms-auto flex items-center gap-1.5">{actions}</div>
		</header>
	);
}

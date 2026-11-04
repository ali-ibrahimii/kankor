import { Suspense } from "react";
import type { CurrentUser } from "@/lib/auth/types";
import { AppSidebar } from "./app-sidebar";
import type { MenuGroup } from "./types";

type Props = {
	menus: MenuGroup[];
	header?: React.ReactNode;
	user?: CurrentUser;
	footer?: React.ReactNode;
	/** Extra classes forwarded to the underlying `Sidebar` (theme overrides). */
	className?: string;
};

/**
 * Renders the dashboard sidebar behind a Suspense boundary.
 *
 * `AppSidebar` reads the URL query string (`useSearchParams`) to decide which
 * nav entry is active. Next.js treats `useSearchParams` as a client-side
 * bailout: during static prerendering it must be wrapped in a Suspense
 * boundary, or the build fails with
 * "useSearchParams() should be wrapped in a suspense boundary".
 *
 * The `SidebarProvider` deliberately stays *outside* this component (in each
 * dashboard layout): the sidebar markup consumes the provider's React
 * context, and a context provider cannot be introduced from inside the
 * suspended subtree the same way a plain parent can.
 *
 * The fallback mirrors the collapsed rail so the layout does not jump when
 * the real sidebar streams in.
 */
export function DashboardSidebar({
	menus,
	header,
	user,
	footer,
	className,
}: Props) {
	return (
		<Suspense
			fallback={
				<div
					aria-hidden="true"
					className="hidden w-(--sidebar-width) shrink-0 border-e border-sidebar-border bg-sidebar md:block"
				/>
			}
		>
			<AppSidebar
				menus={menus}
				header={header}
				user={user}
				footer={footer}
				className={className}
			/>
		</Suspense>
	);
}

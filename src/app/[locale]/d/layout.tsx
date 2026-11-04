/**
 * Dashboard routes are inherently session-bound: they read the user's
 * profile, memberships, notifications and wallet, and they render URL-synced
 * list state (`nuqs` → `useSearchParams`).
 *
 * Marking the whole segment dynamic is deliberate:
 *
 * 1. It keeps `useSearchParams` from being treated as a static-prerender
 *    bailout. Without this, a route whose content reads the query string
 *    fails the production build with "useSearchParams() should be wrapped in
 *    a suspense boundary" — and because the dashboard chrome *does* read the
 *    query string (active nav item), every dashboard page would need its own
 *    Suspense boundary.
 * 2. It matches reality — a dashboard is never the same for two visitors, so
 *    there is nothing to prerender or cache.
 */
export const dynamic = "force-dynamic";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}

import { Suspense } from "react";

type Props = {
	children: React.ReactNode;
	/**
	 * Optional skeleton rendered while the URL-synced subtree streams in.
	 * Keep it structurally close to the real content to avoid layout shift.
	 */
	fallback?: React.ReactNode;
};

/**
 * Suspense boundary for components whose state lives in the URL query string
 * (`nuqs` → `useSearchParams`).
 *
 * Next.js treats `useSearchParams` as a client-side bailout: during
 * prerendering, the component tree up to the closest `<Suspense>` boundary is
 * rendered on the client instead. A statically prerendered route that calls
 * `useSearchParams` *without* such a boundary fails the production build with
 * "useSearchParams() should be wrapped in a suspense boundary".
 *
 * Wrapping the boundary here — once — keeps every catalog/list page buildable
 * and lets the surrounding page shell (headings, filters chrome) stay
 * server-rendered.
 */
export function UrlStateBoundary({ children, fallback }: Props) {
	return <Suspense fallback={fallback ?? null}>{children}</Suspense>;
}

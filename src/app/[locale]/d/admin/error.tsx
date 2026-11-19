"use client";

import { SegmentErrorView } from "@/components/widgets/segment-error-view";

export default function AdminDashboardError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<SegmentErrorView
			error={error}
			reset={reset}
			backHref="/d/admin"
			useDashboardLabel
			scope="admin"
		/>
	);
}

import { SegmentNotFoundView } from "@/components/widgets/segment-not-found-view";

export default function AdminDashboardNotFound() {
	return <SegmentNotFoundView backHref="/d/admin" useDashboardLabel />;
}

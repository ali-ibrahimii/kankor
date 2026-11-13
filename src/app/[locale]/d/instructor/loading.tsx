import { Skeleton } from "@/components/ui/skeleton";

// Segment-level fallback: every instructor page is dynamic, so this shows
// while the server layout + page resolve.
export default function InstructorLoading() {
	return (
		<div className="flex flex-1 flex-col gap-6 p-6">
			<div className="space-y-2">
				<Skeleton className="h-7 w-56" />
				<Skeleton className="h-4 w-80" />
			</div>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<Skeleton className="h-28 rounded-xl" />
				<Skeleton className="h-28 rounded-xl" />
				<Skeleton className="h-28 rounded-xl" />
				<Skeleton className="h-28 rounded-xl" />
				<Skeleton className="h-28 rounded-xl" />
				<Skeleton className="h-28 rounded-xl" />
			</div>
		</div>
	);
}

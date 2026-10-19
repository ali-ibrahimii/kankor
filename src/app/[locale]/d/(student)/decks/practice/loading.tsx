import { Skeleton } from "@/components/ui/skeleton";

export default function PracticeLoading() {
	return (
		<div className="space-y-6 p-6">
			<div className="flex items-center justify-between gap-4">
				<div className="space-y-2">
					<Skeleton className="h-6 w-44" />
					<Skeleton className="h-4 w-64" />
				</div>
				<div className="flex items-center gap-2">
					<Skeleton className="h-9 w-56" />
					<Skeleton className="h-9 w-28" />
				</div>
			</div>
			<div className="mx-auto w-full max-w-2xl space-y-6">
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-80 w-full rounded-xl" />
				<div className="flex gap-2">
					<Skeleton className="h-12 flex-1" />
					<Skeleton className="h-12 flex-1" />
					<Skeleton className="h-12 flex-1" />
					<Skeleton className="h-12 flex-1" />
				</div>
			</div>
		</div>
	);
}

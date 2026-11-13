import { Skeleton } from "@/components/ui/skeleton";

export default function InstructorStudentsLoading() {
	return (
		<div className="flex flex-1 flex-col gap-6 p-6">
			<div className="space-y-2">
				<Skeleton className="h-7 w-48" />
				<Skeleton className="h-4 w-72" />
			</div>
			<div className="flex gap-3">
				<Skeleton className="h-9 w-full max-w-sm" />
				<Skeleton className="h-9 w-[220px]" />
			</div>
			<div className="space-y-2 rounded-xl border p-4">
				<Skeleton className="h-9 w-full" />
				<Skeleton className="h-9 w-full" />
				<Skeleton className="h-9 w-full" />
				<Skeleton className="h-9 w-full" />
				<Skeleton className="h-9 w-full" />
			</div>
		</div>
	);
}

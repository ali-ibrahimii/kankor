import { PublicQuizCardSkeleton } from "@/components/blocks/quizzes/public-quiz-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function QuizzesLoading() {
	return (
		<div className="min-h-screen bg-[#f9faff] dark:bg-[#141b2c]">
			{/* Hero Skeleton */}
			<div className="mx-auto max-w-[1320px] px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
				<div className="rounded-[26px] border border-white/10 bg-[#0f1a2c] px-5 py-10 sm:rounded-[34px] sm:px-10 sm:py-12 lg:px-14 lg:py-14">
					<div className="grid items-center gap-9 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-12">
						<div className="space-y-4">
							<Skeleton className="h-7 w-48 rounded-full bg-white/10" />
							<Skeleton className="h-11 w-full max-w-lg rounded-2xl bg-white/12" />
							<Skeleton className="h-11 w-4/5 max-w-md rounded-2xl bg-white/10" />
							<Skeleton className="h-5 w-full max-w-md rounded-lg bg-white/8" />
							<Skeleton className="mt-2 h-12 w-full max-w-xl rounded-2xl bg-white/10" />
							<div className="flex gap-3 pt-1">
								<Skeleton className="h-11 w-36 rounded-2xl bg-white/15" />
								<Skeleton className="h-11 w-44 rounded-2xl bg-white/10" />
							</div>
						</div>
						<Skeleton className="h-72 w-full rounded-[22px] bg-white/8" />
					</div>
				</div>
			</div>

			{/* Filter Toolbar & Card Grid Skeleton */}
			<div className="mx-auto flex max-w-[1320px] flex-col gap-6 px-4 pt-8 pb-20 sm:px-6 sm:pt-10 lg:px-8">
				<div className="soft-card flex flex-wrap items-center justify-between gap-3 border-[#e5e8f3] bg-white p-4 dark:border-white/10 dark:bg-[#1b2438]">
					<div className="flex gap-2">
						<Skeleton className="h-8 w-24 rounded-full" />
						<Skeleton className="h-8 w-20 rounded-full" />
						<Skeleton className="h-8 w-24 rounded-full" />
					</div>
					<div className="flex gap-2">
						<Skeleton className="h-8 w-24 rounded-xl" />
						<Skeleton className="h-8 w-28 rounded-xl" />
					</div>
				</div>

				<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{Array.from({ length: 8 }).map((_, i) => (
						<PublicQuizCardSkeleton key={i} />
					))}
				</div>
			</div>
		</div>
	);
}

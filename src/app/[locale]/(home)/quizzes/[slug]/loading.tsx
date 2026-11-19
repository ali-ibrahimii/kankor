import { Skeleton } from "@/components/ui/skeleton";

export default function QuizDetailLoading() {
	return (
		<div className="min-h-screen bg-[#f9faff] dark:bg-[#141b2c]">
			<div className="border-b border-[#e9eaf2] bg-white/80 dark:border-white/10 dark:bg-[#1b2438]">
				<div className="mx-auto max-w-[1320px] px-4 py-4 sm:px-6 lg:px-8">
					<Skeleton className="h-4 w-56 rounded-md" />
				</div>
			</div>

			<div className="mx-auto max-w-[1320px] space-y-8 px-4 pt-7 pb-24 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between">
					<Skeleton className="h-9 w-36 rounded-xl" />
					<Skeleton className="size-9 rounded-xl" />
				</div>

				<div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_370px] lg:gap-10">
					<div className="space-y-6">
						<div className="rounded-[28px] bg-[#0f1a2c] p-6 sm:p-10">
							<Skeleton className="h-6 w-36 rounded-full bg-white/12" />
							<Skeleton className="mt-5 h-10 w-4/5 rounded-xl bg-white/15" />
							<Skeleton className="mt-3 h-5 w-full max-w-xl rounded-lg bg-white/10" />
							<div className="mt-7 grid gap-3 sm:grid-cols-3">
								<Skeleton className="h-20 rounded-2xl bg-white/8" />
								<Skeleton className="h-20 rounded-2xl bg-white/8" />
								<Skeleton className="h-20 rounded-2xl bg-white/8" />
							</div>
						</div>

						<div className="soft-card space-y-3 border-[#e5e8f3] bg-white p-6 sm:p-8 dark:border-white/10 dark:bg-[#1b2438]">
							<Skeleton className="h-7 w-44 rounded-lg" />
							<Skeleton className="h-4 w-full rounded-md" />
							<Skeleton className="h-4 w-3/4 rounded-md" />
						</div>
					</div>

					<div className="soft-card space-y-5 border-[#e5e8f3] bg-white p-6 sm:p-7 dark:border-white/10 dark:bg-[#1b2438]">
						<div className="flex items-center justify-between">
							<Skeleton className="h-6 w-28 rounded-full" />
							<Skeleton className="h-6 w-16 rounded-md" />
						</div>
						<Skeleton className="h-5 w-48 rounded-md" />
						<div className="space-y-3 py-2">
							<Skeleton className="h-8 w-full rounded-lg" />
							<Skeleton className="h-8 w-full rounded-lg" />
							<Skeleton className="h-8 w-full rounded-lg" />
						</div>
						<Skeleton className="h-12 w-full rounded-2xl" />
					</div>
				</div>
			</div>
		</div>
	);
}

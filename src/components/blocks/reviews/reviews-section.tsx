"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Link, usePathname } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import {
	type ReviewTarget,
	useDeleteReview,
	useMyReview,
	useReviewBreakdown,
	useReviews,
	useSubmitReview,
} from "./queries";
import { ReviewForm, type ReviewFormValues } from "./review-form";
import { ReviewListItem } from "./review-list-item";
import { StarRating } from "./star-rating";

export type ReviewsSectionProps = {
	target: ReviewTarget;
	averageRating: number | null;
	totalReviews: number;
	userId: string | undefined;
	/** Whether the signed-in user has access (enrollment) to leave a review. */
	canReview: boolean;
	className?: string;
};

// Loads its data only once the section actually scrolls into view, so the
// review list never competes with the initial course/deck page render.
function useLazyLoad<T extends HTMLElement>() {
	const ref = React.useRef<T>(null);
	const [visible, setVisible] = React.useState(false);

	React.useEffect(() => {
		if (visible || !ref.current) return;
		const node = ref.current;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) setVisible(true);
			},
			{ rootMargin: "200px" }
		);
		observer.observe(node);
		return () => observer.disconnect();
	}, [visible]);

	return { ref, visible };
}

export function ReviewsSection({
	target,
	averageRating,
	totalReviews,
	userId,
	canReview,
	className,
}: ReviewsSectionProps) {
	const t = useTranslations("reviews");
	const router = useRouter();
	const pathname = usePathname();
	const { ref, visible } = useLazyLoad<HTMLDivElement>();
	const [isWriting, setIsWriting] = React.useState(false);

	const breakdownQuery = useReviewBreakdown(target, visible);
	const reviewsQuery = useReviews(target, visible);
	const myReviewQuery = useMyReview(target, userId);
	const submitMutation = useSubmitReview(target);
	const deleteMutation = useDeleteReview(target);

	const reviews = reviewsQuery.data?.pages.flat() ?? [];
	const breakdown = breakdownQuery.data ?? [];
	const maxCount = Math.max(1, ...breakdown.map((b) => b.count));

	async function handleSubmit(values: ReviewFormValues) {
		try {
			await submitMutation.mutateAsync(values);
			toast.success(t("submitSuccess"));
			setIsWriting(false);
			// course.average_rating / total_reviews are cached columns rendered
			// server-side, so refresh the route to pick up the new aggregate.
			router.refresh();
		} catch {
			toast.error(t("submitFailed"));
		}
	}

	async function handleDelete(reviewId: string) {
		try {
			await deleteMutation.mutateAsync(reviewId);
			toast.success(t("deleteSuccess"));
			router.refresh();
		} catch {
			toast.error(t("deleteFailed"));
		}
	}

	return (
		<section ref={ref} className={cn("space-y-6", className)}>
			<h2 className="text-xl font-semibold tracking-tight">
				{t("title", { count: totalReviews })}
			</h2>

			{/* Rating summary */}
			{totalReviews > 0 && averageRating != null && (
				<div className="grid gap-6 rounded-2xl border bg-card p-5 sm:grid-cols-[auto_1fr]">
					<div className="flex flex-col items-center justify-center gap-1 sm:pe-6 sm:border-e">
						<span className="text-4xl font-bold tabular-nums">
							{averageRating.toFixed(1)}
						</span>
						<StarRating value={averageRating} />
						<span className="text-xs text-muted-foreground">
							{t("basedOn", { count: totalReviews })}
						</span>
					</div>
					<div className="space-y-1.5">
						{!visible || breakdownQuery.isLoading
							? [5, 4, 3, 2, 1].map((i) => (
									<Skeleton key={i} className="h-4 w-full" />
								))
							: [...breakdown]
									.sort((a, b) => b.rating - a.rating)
									.map((row) => (
										<div
											key={row.rating}
											className="flex items-center gap-2 text-xs"
										>
											<span className="w-3 shrink-0 text-muted-foreground">
												{row.rating}
											</span>
											<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
												<div
													className="h-full rounded-full bg-amber-400"
													style={{
														width: `${(row.count / maxCount) * 100}%`,
													}}
												/>
											</div>
											<span className="w-6 shrink-0 text-end tabular-nums text-muted-foreground">
												{row.count}
											</span>
										</div>
									))}
					</div>
				</div>
			)}

			{/* Write / edit review — always shown so it's discoverable, with the
			    right nudge for signed-out or not-yet-enrolled visitors. */}
			<div>
				{!userId ? (
					<div className="flex items-center justify-between rounded-2xl border border-dashed p-4">
						<span className="text-sm text-muted-foreground">
							{t("signInPrompt")}
						</span>
						<Button asChild variant="outline" size="sm">
							<Link href={routes.auth.login.page({ next: pathname })}>
								{t("signIn")}
							</Link>
						</Button>
					</div>
				) : !canReview ? (
					<div className="rounded-2xl border border-dashed p-4">
						<span className="text-sm text-muted-foreground">
							{t("enrollPrompt")}
						</span>
					</div>
				) : myReviewQuery.data ? (
					isWriting ? (
						<ReviewForm
							initialValues={{
								rating: myReviewQuery.data.rating,
								comment: myReviewQuery.data.comment ?? "",
							}}
							isSubmitting={submitMutation.isPending}
							onSubmit={handleSubmit}
							onCancel={() => setIsWriting(false)}
						/>
					) : (
						<div className="flex items-center justify-between rounded-2xl border bg-card p-4">
							<div className="flex items-center gap-3">
								<StarRating value={myReviewQuery.data.rating} />
								<span className="text-sm text-muted-foreground">
									{t("youReviewedThis")}
								</span>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setIsWriting(true)}
							>
								{t("editReview")}
							</Button>
						</div>
					)
				) : isWriting ? (
					<ReviewForm
						isSubmitting={submitMutation.isPending}
						onSubmit={handleSubmit}
						onCancel={() => setIsWriting(false)}
					/>
				) : (
					<Button variant="outline" onClick={() => setIsWriting(true)}>
						{t("writeReview")}
					</Button>
				)}
			</div>

			{/* Review list */}
			<div>
				{!visible || reviewsQuery.isLoading ? (
					<div className="space-y-5">
						{[1, 2, 3].map((i) => (
							<div key={i} className="flex gap-3 py-2">
								<Skeleton className="size-8 shrink-0 rounded-full" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-4 w-full" />
								</div>
							</div>
						))}
					</div>
				) : reviews.length === 0 ? (
					<p className="py-6 text-center text-sm text-muted-foreground">
						{t("noReviewsYet")}
					</p>
				) : (
					<div>
						{reviews.map((review) => (
							<ReviewListItem
								key={review.id}
								review={review}
								isOwn={review.user_id === userId}
								onDelete={
									review.user_id === userId
										? () => handleDelete(review.id)
										: undefined
								}
								isDeleting={deleteMutation.isPending}
							/>
						))}
					</div>
				)}

				{reviewsQuery.hasNextPage && (
					<div className="mt-4 flex justify-center">
						<Button
							variant="outline"
							size="sm"
							onClick={() => reviewsQuery.fetchNextPage()}
							disabled={reviewsQuery.isFetchingNextPage}
						>
							{reviewsQuery.isFetchingNextPage && (
								<Spinner className="size-4" />
							)}
							{t("loadMore")}
						</Button>
					</div>
				)}
			</div>
		</section>
	);
}

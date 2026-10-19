"use client";

import {
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { ReviewBreakdownItem, ReviewItem } from "@/types/queries.types";

export type ReviewTargetType = "course" | "deck";

export type ReviewTarget = {
	type: ReviewTargetType;
	id: string;
};

const PAGE_SIZE = 5;

function targetArgs(target: ReviewTarget) {
	return {
		p_course_id: target.type === "course" ? target.id : undefined,
		p_deck_id: target.type === "deck" ? target.id : undefined,
	};
}

export function reviewsQueryKey(target: ReviewTarget) {
	return ["reviews", target.type, target.id] as const;
}

export function useReviews(target: ReviewTarget, enabled: boolean) {
	return useInfiniteQuery({
		queryKey: reviewsQueryKey(target),
		queryFn: async ({ pageParam }) => {
			const client = createClient();
			const { data, error } = await client.rpc("get_reviews", {
				...targetArgs(target),
				p_limit: PAGE_SIZE,
				p_offset: pageParam,
			});
			if (error) throw error;
			return (data ?? []) as ReviewItem[];
		},
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages) => {
			const total = lastPage[0]?.total_count ?? 0;
			const loaded = allPages.reduce((sum, page) => sum + page.length, 0);
			return loaded < total ? loaded : undefined;
		},
		enabled,
	});
}

export function useReviewBreakdown(target: ReviewTarget, enabled: boolean) {
	return useQuery({
		queryKey: ["review-breakdown", target.type, target.id],
		queryFn: async () => {
			const client = createClient();
			const { data, error } = await client.rpc(
				"get_review_breakdown",
				targetArgs(target)
			);
			if (error) throw error;
			return (data ?? []) as ReviewBreakdownItem[];
		},
		enabled,
	});
}

export function useMyReview(target: ReviewTarget, userId: string | undefined) {
	return useQuery({
		queryKey: ["my-review", target.type, target.id, userId],
		queryFn: async () => {
			const client = createClient();
			const column = target.type === "course" ? "course_id" : "deck_id";
			const { data, error } = await client
				.from("reviews")
				.select("id, rating, title, comment")
				.eq("user_id", userId!)
				.eq(column, target.id)
				.maybeSingle();
			if (error) throw error;
			return data;
		},
		enabled: !!userId,
	});
}

export type SubmitReviewInput = {
	rating: number;
	title?: string;
	comment?: string;
};

export function useSubmitReview(target: ReviewTarget) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: SubmitReviewInput) => {
			const client = createClient();
			const { data, error } = await client
				.rpc("submit_review", {
					...targetArgs(target),
					p_rating: input.rating,
					p_title: input.title,
					p_comment: input.comment,
				})
				.single();
			if (error) throw error;
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: reviewsQueryKey(target) });
			queryClient.invalidateQueries({
				queryKey: ["review-breakdown", target.type, target.id],
			});
			queryClient.invalidateQueries({
				queryKey: ["my-review", target.type, target.id],
			});
		},
	});
}

export function useDeleteReview(target: ReviewTarget) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (reviewId: string) => {
			const client = createClient();
			const { error } = await client
				.from("reviews")
				.delete()
				.eq("id", reviewId);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: reviewsQueryKey(target) });
			queryClient.invalidateQueries({
				queryKey: ["review-breakdown", target.type, target.id],
			});
			queryClient.invalidateQueries({
				queryKey: ["my-review", target.type, target.id],
			});
		},
	});
}

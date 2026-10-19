"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
	DiscussionPostItem,
	DiscussionThreadItem,
} from "@/types/discussion.types";

export function useThreadDetail(threadId: string) {
	const supabase = createClient();
	const queryClient = useQueryClient();

	// Record thread view on client mount
	useEffect(() => {
		if (!threadId) return;
		const clientHash = `view_${threadId}_${Math.random().toString(36).substring(2, 9)}`;
		supabase.rpc("record_thread_view", {
			p_thread_id: threadId,
			p_client_hash: clientHash,
		});
	}, [threadId, supabase]);

	// Fetch thread details & author
	const threadQuery = useQuery({
		queryKey: ["discussion_thread", threadId],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("discussion_threads")
				.select(`
          *,
          profiles!user_id(id, full_name, avatar_url, role)
        `)
				.eq("id", threadId)
				.single();

			if (error) throw error;

			// Fetch user specific interaction states (bookmark, subscription, vote)
			const {
				data: { user },
			} = await supabase.auth.getUser();

			let is_bookmarked = false;
			let is_subscribed = false;
			let user_vote = 0;

			if (user) {
				const [bookmarkRes, subRes, voteRes] = await Promise.all([
					supabase
						.from("discussion_bookmarks")
						.select("id")
						.eq("user_id", user.id)
						.eq("thread_id", threadId)
						.maybeSingle(),
					supabase
						.from("discussion_subscriptions")
						.select("id")
						.eq("user_id", user.id)
						.eq("thread_id", threadId)
						.maybeSingle(),
					supabase
						.from("discussion_votes")
						.select("vote")
						.eq("user_id", user.id)
						.eq("target_type", "thread")
						.eq("target_id", threadId)
						.maybeSingle(),
				]);

				is_bookmarked = !!bookmarkRes.data;
				is_subscribed = !!subRes.data;
				user_vote = voteRes.data?.vote || 0;
			}

			// Fetch tags
			const { data: tagLinks } = await supabase
				.from("discussion_thread_tags")
				.select("discussion_tags(*)")
				.eq("thread_id", threadId);

			const tags_list = (tagLinks || [])
				.map((tl: any) => tl.discussion_tags)
				.filter(Boolean);

			const item: DiscussionThreadItem = {
				...data,
				author: (data as any).profiles,
				tags_list,
				is_bookmarked,
				is_subscribed,
				user_vote,
			};

			return item;
		},
		enabled: Boolean(threadId),
	});

	// Fetch posts & build 2-level hierarchy tree
	const postsQuery = useQuery({
		queryKey: ["discussion_posts", threadId],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("discussion_posts")
				.select(`
          *,
          profiles!user_id(id, full_name, avatar_url, role),
          discussion_attachments(*)
        `)
				.eq("thread_id", threadId)
				.is("deleted_at", null)
				.order("created_at", { ascending: true });

			if (error) throw error;

			const {
				data: { user },
			} = await supabase.auth.getUser();

			let userVotesMap: Record<string, number> = {};
			if (user) {
				const postIds = (data || []).map((p) => p.id);
				if (postIds.length > 0) {
					const { data: votes } = await supabase
						.from("discussion_votes")
						.select("target_id, vote")
						.eq("user_id", user.id)
						.eq("target_type", "post")
						.in("target_id", postIds);

					(votes || []).forEach((v) => {
						userVotesMap[v.target_id] = v.vote;
					});
				}
			}

			// Raw items mapping
			const itemsMap = new Map<string, DiscussionPostItem>();
			const rootPosts: DiscussionPostItem[] = [];

			(data || []).forEach((p: any) => {
				const item: DiscussionPostItem = {
					...p,
					author: p.profiles,
					attachments: p.discussion_attachments || [],
					user_vote: userVotesMap[p.id] || 0,
					replies: [],
				};
				itemsMap.set(p.id, item);
			});

			// Build 2-level nesting tree
			itemsMap.forEach((item) => {
				if (!item.parent_post_id) {
					rootPosts.push(item);
				} else {
					const parentItem = itemsMap.get(item.parent_post_id);
					if (parentItem) {
						parentItem.replies = parentItem.replies || [];
						parentItem.replies.push(item);
					} else {
						// Orphan fallback to root
						rootPosts.push(item);
					}
				}
			});

			return rootPosts;
		},
		enabled: Boolean(threadId),
	});

	const invalidate = () => {
		queryClient.invalidateQueries({
			queryKey: ["discussion_thread", threadId],
		});
		queryClient.invalidateQueries({ queryKey: ["discussion_posts", threadId] });
	};

	return {
		thread: threadQuery.data,
		isLoadingThread: threadQuery.isLoading,
		posts: postsQuery.data || [],
		isLoadingPosts: postsQuery.isLoading,
		invalidate,
	};
}

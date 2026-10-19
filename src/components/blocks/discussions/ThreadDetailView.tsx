"use client";

import {
	Bell,
	Bookmark,
	CheckCircle2,
	CornerDownRight,
	MessageSquare,
	MoreVertical,
	ShieldCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useThreadDetail } from "@/hooks/discussions/use-thread-detail";
import {
	markAcceptedSolutionAction,
	toggleBookmarkAction,
	toggleSubscriptionAction,
} from "@/lib/actions/discussions";
import type { DiscussionPostItem } from "@/types/discussion.types";
import { PinnedBadge, StatusBadge, TypeBadge } from "./DiscussionBadges";
import { ReactionPicker } from "./ReactionPicker";
import { ReplyEditor } from "./ReplyEditor";
import { VoteButtons } from "./VoteButtons";

interface ThreadDetailViewProps {
	threadId: string;
	publicView?: boolean;
}

export function ThreadDetailView({
	threadId,
	publicView = false,
}: ThreadDetailViewProps) {
	const t = useTranslations("discussions");
	const { thread, isLoadingThread, posts, isLoadingPosts, invalidate } =
		useThreadDetail(threadId);

	const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
	const [isBookmarkPending, setIsBookmarkPending] = useState(false);
	const [isSubPending, setIsSubPending] = useState(false);

	if (isLoadingThread) {
		return (
			<div className="space-y-4 p-4">
				<Skeleton className="h-8 w-3/4" />
				<Skeleton className="h-24 w-full" />
				<Skeleton className="h-40 w-full" />
			</div>
		);
	}

	if (!thread) {
		return (
			<div className="p-8 text-center text-muted-foreground border rounded-lg my-4">
				{t("thread_not_found")}
			</div>
		);
	}

	const handleBookmarkToggle = async () => {
		if (publicView || isBookmarkPending) return;
		setIsBookmarkPending(true);
		try {
			await toggleBookmarkAction(thread.id);
			invalidate();
		} finally {
			setIsBookmarkPending(false);
		}
	};

	const handleSubToggle = async () => {
		if (publicView || isSubPending) return;
		setIsSubPending(true);
		try {
			await toggleSubscriptionAction(thread.id);
			invalidate();
		} finally {
			setIsSubPending(false);
		}
	};

	const handleAcceptSolution = async (postId: string) => {
		try {
			await markAcceptedSolutionAction(postId);
			invalidate();
		} catch (err: any) {
			alert(err.message || t("errors.solution_failed"));
		}
	};

	const authorName = thread.is_anonymous
		? t("anonymous")
		: thread.author?.full_name || t("author_default");

	const initials = authorName
		.split(" ")
		.map((n) => n[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();

	return (
		<div className="space-y-6 max-w-4xl mx-auto py-4">
			{/* Main Thread Card */}
			<Card className="border-2 shadow-sm">
				<CardContent className="p-6 space-y-4">
					{/* Top Bar Badges & Actions */}
					<div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b">
						<div className="flex flex-wrap items-center gap-2">
							{thread.is_pinned && <PinnedBadge />}
							<TypeBadge type={thread.type} />
							<StatusBadge status={thread.status} />
						</div>

						{!publicView && (
							<div className="flex items-center gap-1">
								<Button
									variant={thread.is_bookmarked ? "secondary" : "outline"}
									size="sm"
									className="h-8 gap-1.5 text-xs"
									onClick={handleBookmarkToggle}
									disabled={isBookmarkPending}
								>
									<Bookmark className="w-3.5 h-3.5 fill-current" />
									{thread.is_bookmarked ? t("bookmarked") : t("bookmark")}
								</Button>

								<Button
									variant={thread.is_subscribed ? "secondary" : "outline"}
									size="sm"
									className="h-8 gap-1.5 text-xs"
									onClick={handleSubToggle}
									disabled={isSubPending}
								>
									<Bell className="w-3.5 h-3.5" />
									{thread.is_subscribed ? t("subscribed") : t("subscribe")}
								</Button>
							</div>
						)}
					</div>

					{/* Title */}
					<h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
						{thread.title}
					</h1>

					{/* Author Header */}
					<div className="flex items-center gap-3">
						<Avatar className="w-9 h-9">
							<AvatarImage src={thread.author?.avatar_url || undefined} />
							<AvatarFallback>{initials}</AvatarFallback>
						</Avatar>
						<div>
							<div className="font-semibold text-sm flex items-center gap-2">
								<span>{authorName}</span>
								{thread.author?.role === "instructor" && (
									<Badge
										variant="secondary"
										className="text-[10px] py-0 bg-indigo-100 text-indigo-800"
									>
										<ShieldCheck className="w-3 h-3 me-0.5" />
										{t("roles.instructor")}
									</Badge>
								)}
							</div>
							<div className="text-xs text-muted-foreground">
								{new Date(thread.created_at).toLocaleString()}
							</div>
						</div>
					</div>

					{/* Thread Main Content */}
					<div className="prose prose-sm dark:prose-invert max-w-none py-2 whitespace-pre-wrap leading-relaxed">
						{thread.content}
					</div>

					{/* Bottom Bar: Votes & Reactions */}
					<div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t">
						<VoteButtons
							target_type="thread"
							target_id={thread.id}
							initialScore={thread.vote_count || 0}
							initialUserVote={thread.user_vote || 0}
							disabled={publicView}
						/>

						<ReactionPicker
							target_type="thread"
							target_id={thread.id}
							reactionsSummary={thread.reactions_summary}
							userReactions={thread.user_reactions}
							disabled={publicView}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Main Thread Reply Form */}
			{!publicView && !thread.is_locked && (
				<div className="space-y-2">
					<h3 className="text-sm font-semibold flex items-center gap-2">
						<MessageSquare className="w-4 h-4" />
						{t("leave_reply")}
					</h3>
					<ReplyEditor thread_id={thread.id} onSuccess={invalidate} />
				</div>
			)}

			{/* Replies Hierarchy */}
			<div className="space-y-4 pt-4">
				<h2 className="text-lg font-bold flex items-center justify-between border-b pb-2">
					<span>{t("replies_count_title", { count: posts.length })}</span>
				</h2>

				{isLoadingPosts ? (
					<div className="space-y-3">
						<Skeleton className="h-20 w-full" />
						<Skeleton className="h-20 w-full" />
					</div>
				) : posts.length === 0 ? (
					<div className="p-6 text-center text-muted-foreground border rounded-lg">
						{t("no_replies_yet")}
					</div>
				) : (
					<div className="space-y-4">
						{posts.map((post) => (
							<PostItemRow
								key={post.id}
								post={post}
								threadId={thread.id}
								publicView={publicView}
								onAcceptSolution={() => handleAcceptSolution(post.id)}
								onReplySuccess={invalidate}
								activeReplyId={activeReplyId}
								setActiveReplyId={setActiveReplyId}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

function PostItemRow({
	post,
	threadId,
	publicView,
	onAcceptSolution,
	onReplySuccess,
	activeReplyId,
	setActiveReplyId,
}: {
	post: DiscussionPostItem;
	threadId: string;
	publicView: boolean;
	onAcceptSolution: () => void;
	onReplySuccess: () => void;
	activeReplyId: string | null;
	setActiveReplyId: (id: string | null) => void;
}) {
	const t = useTranslations("discussions");
	const authorName = post.is_anonymous
		? t("anonymous")
		: post.author?.full_name || t("author_default");

	return (
		<div className="space-y-3">
			{/* Primary Reply (Level 1) */}
			<Card
				className={
					post.is_solution
						? "border-2 border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10"
						: ""
				}
			>
				<CardContent className="p-4 space-y-3">
					{post.is_solution && (
						<div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 p-2 rounded-md">
							<CheckCircle2 className="w-4 h-4" />
							{t("accepted_solution_title")}
						</div>
					)}

					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Avatar className="w-7 h-7">
								<AvatarImage src={post.author?.avatar_url || undefined} />
								<AvatarFallback className="text-[10px]">
									{authorName[0]}
								</AvatarFallback>
							</Avatar>
							<div className="text-xs font-semibold">{authorName}</div>
							<span className="text-[11px] text-muted-foreground">
								{new Date(post.created_at).toLocaleString()}
							</span>
						</div>

						{!publicView && !post.is_solution && (
							<Button
								variant="outline"
								size="sm"
								className="h-7 text-xs gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
								onClick={onAcceptSolution}
							>
								<CheckCircle2 className="w-3.5 h-3.5" />
								{t("mark_as_solution")}
							</Button>
						)}
					</div>

					<div className="text-sm prose prose-sm dark:prose-invert whitespace-pre-wrap">
						{post.content}
					</div>

					<div className="flex items-center justify-between pt-2 border-t">
						<VoteButtons
							target_type="post"
							target_id={post.id}
							initialScore={post.vote_count || 0}
							initialUserVote={post.user_vote || 0}
							disabled={publicView}
						/>

						{!publicView && (
							<Button
								variant="ghost"
								size="sm"
								className="h-7 text-xs gap-1"
								onClick={() =>
									setActiveReplyId(activeReplyId === post.id ? null : post.id)
								}
							>
								<CornerDownRight className="w-3.5 h-3.5" />
								{t("reply")}
							</Button>
						)}
					</div>

					{/* Level 2 Inline Reply Box */}
					{activeReplyId === post.id && (
						<div className="pt-2">
							<ReplyEditor
								thread_id={threadId}
								parent_post_id={post.id}
								onSuccess={() => {
									setActiveReplyId(null);
									onReplySuccess();
								}}
								onCancel={() => setActiveReplyId(null)}
								autoFocus
							/>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Nested Replies (Level 2) */}
			{post.replies && post.replies.length > 0 && (
				<div className="ms-6 border-s-2 ps-4 space-y-3">
					{post.replies.map((nested) => {
						const nestedAuthor = nested.is_anonymous
							? t("anonymous")
							: nested.author?.full_name || t("author_default");

						return (
							<Card key={nested.id} className="bg-muted/30">
								<CardContent className="p-3 space-y-2">
									<div className="flex items-center gap-2">
										<Avatar className="w-6 h-6">
											<AvatarImage
												src={nested.author?.avatar_url || undefined}
											/>
											<AvatarFallback className="text-[9px]">
												{nestedAuthor[0]}
											</AvatarFallback>
										</Avatar>
										<span className="text-xs font-semibold">
											{nestedAuthor}
										</span>
										<span className="text-[10px] text-muted-foreground">
											{new Date(nested.created_at).toLocaleString()}
										</span>
									</div>

									<div className="text-xs leading-relaxed whitespace-pre-wrap">
										{nested.content}
									</div>

									<div className="pt-1">
										<VoteButtons
											target_type="post"
											target_id={nested.id}
											initialScore={nested.vote_count || 0}
											initialUserVote={nested.user_vote || 0}
											disabled={publicView}
										/>
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}
		</div>
	);
}

"use client";

import { Clock, Eye, MessageSquare, UserCheck } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { routes } from "@/lib/routes";
import type { DiscussionThreadItem } from "@/types/discussion.types";
import { PinnedBadge, StatusBadge, TypeBadge } from "./DiscussionBadges";
import { VoteButtons } from "./VoteButtons";

interface ThreadCardProps {
	thread: DiscussionThreadItem;
	publicView?: boolean;
}

export function ThreadCard({ thread, publicView = false }: ThreadCardProps) {
	const t = useTranslations("discussions");

	const authorName = thread.is_anonymous
		? t("anonymous")
		: thread.author?.full_name || t("author_default");

	const initials = authorName
		.split(" ")
		.map((n) => n[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();

	const formattedDate = new Date(
		thread.last_activity_at || thread.created_at
	).toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});

	const resourceSlug = (thread as any).resource_slug || thread.resource_id;
	const href = routes.d.courses.slug.page({ slug: resourceSlug });

	return (
		<Card className="transition-all hover:shadow-md hover:border-primary/30 group">
			<CardContent className="p-4 flex gap-4">
				{/* Vote Column */}
				<div className="flex flex-col items-center justify-start pt-1">
					<VoteButtons
						target_type="thread"
						target_id={thread.id}
						initialScore={thread.vote_count || 0}
						initialUserVote={thread.user_vote || 0}
						disabled={publicView}
					/>
				</div>

				{/* Body Column */}
				<div className="flex-1 min-w-0 space-y-2">
					{/* Header Badges */}
					<div className="flex flex-wrap items-center gap-1.5 text-xs">
						{thread.is_pinned && <PinnedBadge />}
						<TypeBadge type={thread.type} />
						<StatusBadge status={thread.status} />
						{thread.is_instructor_only && (
							<Badge
								variant="outline"
								className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 border-indigo-200"
							>
								<UserCheck className="w-3 h-3 me-1" />
								{t("badges.instructor_only")}
							</Badge>
						)}
					</div>

					{/* Title */}
					<Link
						href={href}
						className="block group-hover:text-primary transition-colors"
					>
						<h3 className="text-base font-semibold line-clamp-1 leading-snug">
							{thread.title}
						</h3>
					</Link>

					{/* Content Excerpt */}
					<p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
						{thread.content}
					</p>

					{/* Footer Metadata */}
					<div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-xs text-muted-foreground">
						{/* Author */}
						<div className="flex items-center gap-2">
							<Avatar className="w-5 h-5">
								<AvatarImage src={thread.author?.avatar_url || undefined} />
								<AvatarFallback className="text-[10px]">
									{initials}
								</AvatarFallback>
							</Avatar>
							<span className="font-medium text-foreground">{authorName}</span>
							<span>•</span>
							<span className="flex items-center gap-1">
								<Clock className="w-3 h-3" />
								{formattedDate}
							</span>
						</div>

						{/* Counters */}
						<div className="flex items-center gap-3">
							<span className="flex items-center gap-1">
								<MessageSquare className="w-3.5 h-3.5" />
								{thread.reply_count || 0} {t("replies")}
							</span>
							<span className="flex items-center gap-1">
								<Eye className="w-3.5 h-3.5" />
								{thread.views_count || 0} {t("views")}
							</span>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

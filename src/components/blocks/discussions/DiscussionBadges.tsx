"use client";

import {
	AlertCircle,
	CheckCircle2,
	Flag,
	HelpCircle,
	Lock,
	MessageSquare,
	Pin,
	Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type {
	DiscussionThreadStatus,
	DiscussionThreadType,
} from "@/types/discussion.types";

export function StatusBadge({ status }: { status: DiscussionThreadStatus }) {
	const t = useTranslations("discussions");

	switch (status) {
		case "solved":
			return (
				<Badge
					variant="outline"
					className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 gap-1 font-medium"
				>
					<CheckCircle2 className="w-3.5 h-3.5" />
					{t("status.solved")}
				</Badge>
			);
		case "answered":
			return (
				<Badge
					variant="outline"
					className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800 gap-1 font-medium"
				>
					<MessageSquare className="w-3.5 h-3.5" />
					{t("status.answered")}
				</Badge>
			);
		case "closed":
			return (
				<Badge
					variant="outline"
					className="bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 gap-1 font-medium"
				>
					<Lock className="w-3.5 h-3.5" />
					{t("status.closed")}
				</Badge>
			);
		default:
			return (
				<Badge
					variant="outline"
					className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800 gap-1 font-medium"
				>
					<HelpCircle className="w-3.5 h-3.5" />
					{t("status.open")}
				</Badge>
			);
	}
}

export function TypeBadge({ type }: { type: DiscussionThreadType }) {
	const t = useTranslations("discussions");

	switch (type) {
		case "question":
			return (
				<Badge
					variant="secondary"
					className="bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 gap-1"
				>
					<HelpCircle className="w-3 h-3" />
					{t("types.question")}
				</Badge>
			);
		case "tip":
			return (
				<Badge
					variant="secondary"
					className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 gap-1"
				>
					<Sparkles className="w-3 h-3" />
					{t("types.tip")}
				</Badge>
			);
		case "announcement":
			return (
				<Badge
					variant="secondary"
					className="bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 gap-1 font-semibold"
				>
					<AlertCircle className="w-3 h-3" />
					{t("types.announcement")}
				</Badge>
			);
		case "report_mistake":
			return (
				<Badge
					variant="secondary"
					className="bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 gap-1"
				>
					<Flag className="w-3 h-3" />
					{t("types.report_mistake")}
				</Badge>
			);
		default:
			return (
				<Badge
					variant="secondary"
					className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 gap-1"
				>
					<MessageSquare className="w-3 h-3" />
					{t("types.discussion")}
				</Badge>
			);
	}
}

export function PinnedBadge() {
	const t = useTranslations("discussions");
	return (
		<Badge
			variant="default"
			className="bg-amber-500 text-white gap-1 font-medium"
		>
			<Pin className="w-3 h-3 fill-current" />
			{t("badges.pinned")}
		</Badge>
	);
}

export function LockedBadge() {
	const t = useTranslations("discussions");
	return (
		<Badge variant="outline" className="text-muted-foreground gap-1">
			<Lock className="w-3 h-3" />
			{t("badges.locked")}
		</Badge>
	);
}

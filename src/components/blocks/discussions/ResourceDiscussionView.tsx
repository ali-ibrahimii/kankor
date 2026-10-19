"use client";

import {
	AlertCircle,
	MessageSquare,
	Search,
	SlidersHorizontal,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useDiscussionThreads } from "@/hooks/discussions/use-discussion-threads";
import type {
	DiscussionResourceType,
	DiscussionThreadItem,
} from "@/types/discussion.types";
import { CreateThreadModal } from "./CreateThreadModal";
import { ThreadCard } from "./ThreadCard";

interface ResourceDiscussionViewProps {
	resource_type: DiscussionResourceType;
	resource_id: string;
	publicView?: boolean;
	canCreate?: boolean;
}

export function ResourceDiscussionView({
	resource_type,
	resource_id,
	publicView = false,
	canCreate = true,
}: ResourceDiscussionViewProps) {
	const t = useTranslations("discussions");

	const {
		data: threadsData,
		isLoading,
		isError,
		setSearch,
		setFilter,
		setSort,
		refetch,
		state,
	} = useDiscussionThreads({
		resource_type,
		resource_id,
		initialPageSize: 15,
	});

	const rawData = (threadsData as any)?.data ?? threadsData;
	const threads = (Array.isArray(rawData)
		? rawData
		: []) as unknown as DiscussionThreadItem[];

	return (
		<div className="space-y-6">
			{/* Header Controls & Search */}
			<div className="flex flex-wrap items-center justify-between gap-4 bg-muted/40 p-4 rounded-xl border">
				{/* Search */}
				<div className="relative flex-1 min-w-[240px]">
					<Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder={t("search_placeholder")}
						className="ps-9 bg-background"
						value={state.search || ""}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</div>

				{/* Filters & Sort */}
				<div className="flex items-center gap-2">
					{/* Status Filter */}
					<Select
						onValueChange={(val) => {
							if (val === "all") {
								setFilter({
									field: "status" as any,
									operator: "eq" as any,
									value: undefined as any,
								});
							} else {
								setFilter({
									field: "status" as any,
									operator: "eq" as any,
									value: val as any,
								});
							}
						}}
					>
						<SelectTrigger className="w-[130px] bg-background">
							<SelectValue placeholder={t("filters.status")} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">{t("filters.all_statuses")}</SelectItem>
							<SelectItem value="open">{t("status.open")}</SelectItem>
							<SelectItem value="answered">{t("status.answered")}</SelectItem>
							<SelectItem value="solved">{t("status.solved")}</SelectItem>
						</SelectContent>
					</Select>

					{/* New Thread Button */}
					{!publicView && canCreate && (
						<CreateThreadModal
							resource_type={resource_type}
							resource_id={resource_id}
							onSuccess={refetch}
						/>
					)}
				</div>
			</div>

			{/* Main Threads List */}
			{isLoading ? (
				<div className="space-y-3">
					<Skeleton className="h-28 w-full rounded-xl" />
					<Skeleton className="h-28 w-full rounded-xl" />
					<Skeleton className="h-28 w-full rounded-xl" />
				</div>
			) : isError ? (
				<div className="p-8 text-center bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 rounded-xl border border-rose-200">
					<AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-80" />
					<p className="font-semibold text-sm">{t("errors.fetch_failed")}</p>
					<Button
						variant="outline"
						size="sm"
						className="mt-3"
						onClick={() => refetch()}
					>
						{t("retry")}
					</Button>
				</div>
			) : threads.length === 0 ? (
				<div className="p-12 text-center border-2 border-dashed rounded-xl space-y-3">
					<MessageSquare className="w-10 h-10 mx-auto text-muted-foreground/60" />
					<h3 className="font-bold text-base">{t("empty.title")}</h3>
					<p className="text-sm text-muted-foreground max-w-sm mx-auto">
						{publicView
							? t("empty.public_subtitle")
							: t("empty.dashboard_subtitle")}
					</p>
					{!publicView && canCreate && (
						<div className="pt-2">
							<CreateThreadModal
								resource_type={resource_type}
								resource_id={resource_id}
								onSuccess={refetch}
							/>
						</div>
					)}
				</div>
			) : (
				<div className="space-y-3">
					{threads.map((thread) => (
						<ThreadCard
							key={thread.id}
							thread={thread}
							publicView={publicView}
						/>
					))}
				</div>
			)}
		</div>
	);
}

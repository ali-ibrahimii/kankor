"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	BookOpen,
	ClipboardList,
	ExternalLink,
	GraduationCap,
	Layers,
	X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { TableRow } from "@/types/db.types";

export type BookmarkDetail = TableRow<"bookmark_details">;

const ITEM_TYPE_ICON = {
	course: GraduationCap,
	deck: Layers,
	library: BookOpen,
	quiz: ClipboardList,
} as const;

function resolveHref(bookmark: BookmarkDetail): string | null {
	const slug = bookmark.slug ?? bookmark.item_id;
	if (!slug) return null;

	switch (bookmark.item_type) {
		case "course":
			return routes.courses.slug.page({ slug });
		case "deck":
			return routes.decks.slug.page({ slug });
		case "library":
			return routes.libraries.slug.page({ slug });
		case "quiz":
			return routes.quizzes.slug.page({ slug });
		default:
			return null;
	}
}

export type BookmarkCardProps = {
	bookmark: BookmarkDetail;
	className?: string;
};

export function BookmarkCard({ bookmark, className }: BookmarkCardProps) {
	const t = useTranslations("bookmarks");
	const queryClient = useQueryClient();
	const href = resolveHref(bookmark);
	const Icon =
		bookmark.item_type && bookmark.item_type in ITEM_TYPE_ICON
			? ITEM_TYPE_ICON[bookmark.item_type as keyof typeof ITEM_TYPE_ICON]
			: BookOpen;

	const removeMutation = useMutation({
		mutationFn: async () => {
			const client = createClient();
			const { error } = await client
				.from("bookmarks")
				.delete()
				.eq("id", bookmark.id!);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["bookmark_details"] });
			queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
			toast.success(t("bookmarkRemoved"));
		},
		onError: () => {
			toast.error(t("removeFailed"));
		},
	});

	return (
		<Card
			className={cn(
				"group/card flex h-full flex-col overflow-hidden",
				className
			)}
		>
			<CardContent className="flex flex-1 flex-col gap-4 p-4">
				<div className="flex items-start gap-3">
					<div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
						<Icon />
					</div>
					<div className="min-w-0 flex-1">
						<h3 className="line-clamp-2 text-sm font-semibold leading-snug">
							{bookmark.title ?? t("untitled")}
						</h3>
						{bookmark.description && (
							<p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
								{bookmark.description}
							</p>
						)}
					</div>
				</div>

				{bookmark.item_type && (
					<Badge variant="outline" className="w-fit gap-1 font-normal">
						{t(`type_${bookmark.item_type}` as any)}
					</Badge>
				)}
			</CardContent>

			<CardFooter className="gap-2 p-4 pt-0">
				<Button asChild size="sm" className="flex-1" disabled={!href}>
					<Link href={href ?? "#"}>
						<ExternalLink />
						{t("open")}
					</Link>
				</Button>
				<Button
					size="icon-sm"
					variant="outline"
					disabled={removeMutation.isPending}
					onClick={() => removeMutation.mutate()}
					aria-label={t("remove")}
				>
					<X />
				</Button>
			</CardFooter>
		</Card>
	);
}

export function BookmarkCardSkeleton() {
	return (
		<Card className="overflow-hidden">
			<CardContent className="flex flex-col gap-4 p-4">
				<div className="flex items-start gap-3">
					<Skeleton className="size-11 rounded-lg" />
					<div className="flex flex-1 flex-col gap-2">
						<Skeleton className="h-4 w-4/5" />
						<Skeleton className="h-3 w-1/2" />
					</div>
				</div>
				<Skeleton className="h-6 w-20 rounded-full" />
			</CardContent>
			<CardFooter className="gap-2 p-4 pt-0">
				<Skeleton className="h-8 flex-1" />
				<Skeleton className="size-8" />
			</CardFooter>
		</Card>
	);
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useAuthProfile } from "@/providers/auth.provider";

// Only the item types that currently have a bookmark toggle in the UI —
// a subset of the broader `bookmarkable_item_type` DB enum.
export type BookmarkableItemType = "course" | "deck" | "library" | "quiz";

export type BookmarkButtonProps = {
	itemType: BookmarkableItemType;
	itemId: string;
	className?: string;
};

// Renders nothing when signed out — bookmarks are a per-user feature, so
// there's nothing useful a disabled button could do for an anonymous visitor.
export function BookmarkButton({
	itemType,
	itemId,
	className,
}: BookmarkButtonProps) {
	const t = useTranslations("bookmarks");
	const profile = useAuthProfile();
	const queryClient = useQueryClient();
	const userId = profile?.id;

	const queryKey = ["bookmarks", itemType, itemId, userId];

	const { data: bookmark, isLoading } = useQuery({
		queryKey,
		queryFn: async () => {
			const client = createClient();
			const { data, error } = await client
				.from("bookmarks")
				.select("id")
				.eq("user_id", userId!)
				.eq("item_type", itemType)
				.eq("item_id", itemId)
				.maybeSingle();
			if (error) throw error;
			return data;
		},
		enabled: !!userId,
	});

	const isBookmarked = !!bookmark;

	const toggleMutation = useMutation({
		mutationFn: async () => {
			const client = createClient();
			if (bookmark) {
				const { error } = await client
					.from("bookmarks")
					.delete()
					.eq("id", bookmark.id);
				if (error) throw error;
				return false;
			}
			const { error } = await client.from("bookmarks").insert({
				user_id: userId!,
				item_type: itemType,
				item_id: itemId,
			});
			if (error) throw error;
			return true;
		},
		onSuccess: (added) => {
			queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
			toast.success(added ? t("bookmarkAdded") : t("bookmarkRemoved"));
		},
		onError: () => {
			toast.error(t("bookmarkFailed"));
		},
	});

	if (!userId) return null;

	return (
		<Button
			variant="outline"
			size="sm"
			className={cn("gap-1.5", className)}
			disabled={isLoading || toggleMutation.isPending}
			onClick={() => toggleMutation.mutate()}
			aria-pressed={isBookmarked}
		>
			<Bookmark
				className={cn("size-4", isBookmarked && "fill-current text-primary")}
			/>
			{isBookmarked ? t("bookmarked") : t("bookmark")}
		</Button>
	);
}

"use client";

import {
	BookOpenIcon,
	GlobeIcon,
	LockIcon,
	MoreHorizontalIcon,
	PencilIcon,
	Trash2Icon,
	UsersIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DeckMeta = {
	id: string;
	slug: string | null;
	name: string;
	description: string | null;
	visibility: "public" | "private" | "classmate";
	algorithm: "fsrs" | "sm2" | "leitner";
	user_id: string | null;
	creation: "built-in" | "custom";
	created_at: string;
	updated_at: string;
	is_free?: boolean;
	price_credits?: number;
	flashcards: { count: number }[];
};

// ─── Visibility icon ──────────────────────────────────────────────────────────

function VisIcon({ v }: { v: DeckMeta["visibility"] }) {
	if (v === "public") return <GlobeIcon className="size-3" />;
	if (v === "classmate") return <UsersIcon className="size-3" />;
	return <LockIcon className="size-3" />;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DeckCardProps {
	deck: DeckMeta;
	/** Omit when the viewer doesn't own the deck — hides the edit affordances. */
	editHref?: string;
	onDeleted?: (id: string) => void;
	/** Show the deck owner's user_id (admin view) */
	showOwner?: boolean;
	/** Extra action rendered at the end of the footer (e.g. a Study button) */
	action?: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DeckCard({
	deck,
	editHref,
	onDeleted,
	showOwner = false,
	action,
}: DeckCardProps) {
	const t = useTranslations("flashcardBuilder");
	const [isDeleting, setIsDeleting] = React.useState(false);
	const cardCount = deck.flashcards?.[0]?.count ?? 0;

	async function handleDelete() {
		if (!window.confirm(t("card.deleteDescription"))) return;
		setIsDeleting(true);
		try {
			const client = createClient();
			const { error } = await client.from("decks").delete().eq("id", deck.id);
			if (error) throw error;
			toast.success(t("list.deckDeleted"));
			onDeleted?.(deck.id);
		} catch {
			toast.error(t("list.deleteFailed"));
		} finally {
			setIsDeleting(false);
		}
	}

	return (
		<Card size="sm" className="flex flex-col transition-shadow hover:shadow-md">
			<CardHeader className="flex-row items-start justify-between gap-2">
				<div className="min-w-0 flex-1">
					{editHref ? (
						<Link
							href={editHref}
							className="line-clamp-2 text-sm font-semibold leading-snug hover:underline"
						>
							{deck.name}
						</Link>
					) : (
						<p className="line-clamp-2 text-sm font-semibold leading-snug">
							{deck.name}
						</p>
					)}
					{deck.description && (
						<p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
							{deck.description}
						</p>
					)}
				</div>

				{/* Actions menu — omitted entirely when there's nothing to do */}
				{(editHref || onDeleted) && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon-sm"
								className="shrink-0"
								aria-label={t("common.actions")}
							>
								<MoreHorizontalIcon className="size-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{editHref && (
								<DropdownMenuItem asChild>
									<Link href={editHref} className="flex items-center gap-2">
										<PencilIcon className="size-3.5" />
										{t("common.edit")}
									</Link>
								</DropdownMenuItem>
							)}
							{onDeleted && (
								<>
									{editHref && <DropdownMenuSeparator />}
									<DropdownMenuItem
										variant="destructive"
										disabled={isDeleting}
										onClick={handleDelete}
										className="flex items-center gap-2"
									>
										<Trash2Icon className="size-3.5" />
										{t("common.delete")}
									</DropdownMenuItem>
								</>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</CardHeader>

			<CardContent className="flex flex-wrap gap-1.5">
				<Badge variant="outline" className="gap-1 text-xs">
					<VisIcon v={deck.visibility} />
					{t(`visibility.${deck.visibility}`)}
				</Badge>
				<Badge variant="secondary" className="text-xs">
					{t(`algorithm.${deck.algorithm}`)}
				</Badge>
				{deck.is_free === false && (
					<Badge className="bg-[#1461B8] text-xs text-white">
						{t("list.priceCredits", { count: deck.price_credits ?? 0 })}
					</Badge>
				)}
			</CardContent>

			<CardFooter className="mt-auto border-t pt-3 text-xs text-muted-foreground flex items-center justify-between">
				<span className="flex items-center gap-1">
					<BookOpenIcon className="size-3" />
					{t("list.cardCount", { count: cardCount })}
				</span>
				{showOwner && deck.user_id && (
					<span className="truncate max-w-24 text-xs text-muted-foreground">
						{deck.user_id.slice(0, 8)}…
					</span>
				)}
				{action}
			</CardFooter>
		</Card>
	);
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function DeckCardSkeleton() {
	return (
		<Card size="sm">
			<CardHeader>
				<Skeleton className="h-4 w-3/4" />
				<Skeleton className="mt-1 h-3 w-1/2" />
			</CardHeader>
			<CardContent className="flex gap-1.5">
				<Skeleton className="h-5 w-16 rounded-full" />
				<Skeleton className="h-5 w-12 rounded-full" />
			</CardContent>
			<CardFooter className="border-t pt-3">
				<Skeleton className="h-3 w-20" />
			</CardFooter>
		</Card>
	);
}

"use client";

import { Download, ExternalLink, Star } from "lucide-react";
import { useTranslations } from "next-intl";

import {
	EntityCardArt,
	EntityCardBadge,
	EntityCardBody,
	EntityCardShell,
	ratingFromSeed,
	toneFromString,
} from "@/components/blocks/shared/entity-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import type { LibraryBook } from "./types";

export type LibraryCardProps = {
	book: LibraryBook & {
		cover_image_url?: string | null;
		rating?: number;
		rating_count?: number;
	};
	href?: string;
	className?: string;
	showDownloadBnt?: boolean;
};

/**
 * Catalog card for a library book — clean cover with top-corner user rating,
 * zero icon clutter over the photograph, and compact action bar.
 */
export function LibraryCard({
	book,
	href,
	className,
	showDownloadBnt,
}: LibraryCardProps) {
	const t = useTranslations("libraries");
	const title = book.title;
	const targetHref =
		href ?? routes.libraries.slug.page({ slug: book.slug ?? book.id });
	const isSchoolTextbook = Boolean(
		book.grade_id || book.book_id || book.grades
	);
	const fallbackStats = ratingFromSeed(book.id);
	const score =
		book.rating != null ? book.rating.toFixed(1) : fallbackStats.score;
	const votes = book.rating_count ?? fallbackStats.votes;

	return (
		<EntityCardShell
			href={targetHref}
			className={className}
			footer={
				<div className="flex gap-2 border-t border-border/70 p-3">
					<Button asChild size="sm" className="h-8 flex-1 text-xs">
						<Link href={targetHref}>
							<ExternalLink className="size-3.5" />
							{t("open")}
						</Link>
					</Button>
					{showDownloadBnt && (
						<Button asChild size="icon-sm" variant="outline">
							<a
								href={book.uri}
								download
								aria-label={t("downloadBook", { title })}
							>
								<Download />
							</a>
						</Button>
					)}
				</div>
			}
		>
			<EntityCardArt
				tone={toneFromString(book.id)}
				imageSrc={book.cover_image_url}
				imageAlt={`${title} ${book.subjects?.name ?? ""}`}
				kind={isSchoolTextbook ? "schoolBook" : "generalBook"}
				seed={book.id}
				topEnd={
					<span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
						<Star className="size-3 fill-amber-400 text-amber-400" />
						<span>{score}</span>
						<span className="text-white/70">({votes})</span>
					</span>
				}
			/>
			<EntityCardBody
				title={title}
				description={book.desc}
				badges={
					<>
						{book.grades?.name && (
							<EntityCardBadge>{book.grades.name}</EntityCardBadge>
						)}
						{book.subjects?.name && (
							<EntityCardBadge>{book.subjects.name}</EntityCardBadge>
						)}
						{book.books?.name && (
							<EntityCardBadge>{book.books.name}</EntityCardBadge>
						)}
					</>
				}
			/>
		</EntityCardShell>
	);
}

export function LibraryCardSkeleton() {
	return (
		<div className="soft-card flex h-full flex-col overflow-hidden">
			<Skeleton className="h-36 w-full rounded-none" />
			<div className="flex flex-1 flex-col gap-2.5 p-4">
				<Skeleton className="h-4 w-4/5" />
				<Skeleton className="h-3 w-full" />
				<div className="mt-auto flex gap-1.5">
					<Skeleton className="h-5 w-16 rounded-full" />
					<Skeleton className="h-5 w-20 rounded-full" />
				</div>
			</div>
			<div className="flex gap-2 border-t border-border/70 p-3">
				<Skeleton className="h-8 flex-1" />
			</div>
		</div>
	);
}

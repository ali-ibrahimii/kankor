"use client";

import {
	BookOpen,
	Download,
	ExternalLink,
	GraduationCap,
	Tag,
} from "lucide-react";
import { useTranslations } from "next-intl";

import {
	EntityCardArt,
	EntityCardBadge,
	EntityCardBody,
	EntityCardShell,
	toneFromString,
} from "@/components/blocks/shared/entity-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import type { LibraryBook } from "./types";

export type LibraryCardProps = {
	book: LibraryBook;
	className?: string;
	showDownloadBnt?: boolean;
};

/**
 * Catalog card for a library book — Coursera-style art header + category
 * badges and open/download actions.
 */
export function LibraryCard({
	book,
	className,
	showDownloadBnt,
}: LibraryCardProps) {
	const t = useTranslations("libraries");
	const title = book.title;

	return (
		<EntityCardShell
			href={routes.libraries.slug.page({ slug: book.slug ?? book.id })}
			className={className}
			footer={
				<div className="flex gap-2 border-t border-border/70 p-4">
					<Button asChild size="sm" className="flex-1">
						<Link
							href={routes.libraries.slug.page({ slug: book.slug ?? book.id })}
						>
							<ExternalLink />
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
				icon={BookOpen}
				tone={toneFromString(book.id)}
				label={book.categories?.name ?? t("title")}
			/>
			<EntityCardBody
				title={title}
				description={book.desc}
				badges={
					<>
						{book.grades?.name && (
							<EntityCardBadge>
								<GraduationCap className="size-3" />
								{book.grades.name}
							</EntityCardBadge>
						)}
						{book.subjects?.name && (
							<EntityCardBadge>
								<Tag className="size-3" />
								{book.subjects.name}
							</EntityCardBadge>
						)}
						{book.books?.name && (
							<EntityCardBadge>
								<BookOpen className="size-3" />
								{book.books.name}
							</EntityCardBadge>
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
			<div className="flex flex-1 flex-col gap-3 p-5">
				<Skeleton className="h-5 w-4/5" />
				<Skeleton className="h-3 w-full" />
				<Skeleton className="h-3 w-1/2" />
				<div className="mt-auto flex gap-1.5">
					<Skeleton className="h-6 w-20 rounded-full" />
					<Skeleton className="h-6 w-24 rounded-full" />
				</div>
			</div>
			<div className="flex gap-2 border-t border-border/70 p-4">
				<Skeleton className="h-8 flex-1" />
				<Skeleton className="h-8 w-8" />
			</div>
		</div>
	);
}

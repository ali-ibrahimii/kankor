"use client";

import {
	BookOpen,
	Download,
	ExternalLink,
	GraduationCap,
	Tag,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { LibraryBook } from "./types";

export type LibraryCardProps = {
	book: LibraryBook;
	className?: string;
	showDownloadBnt?: boolean;
};

export function LibraryCard({
	book,
	className,
	showDownloadBnt,
}: LibraryCardProps) {
	const t = useTranslations("libraries");
	const title = book.title;

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
						<BookOpen />
					</div>
					<div className="min-w-0 flex-1">
						<h3 className="line-clamp-2 text-sm font-semibold leading-snug">
							{title}
						</h3>
						{book.desc && (
							<p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
								{book.desc}
							</p>
						)}
					</div>
				</div>

				<div className="mt-auto flex flex-wrap gap-1.5">
					{book.categories?.name && (
						<Badge variant="secondary" className="gap-1 font-normal">
							<Tag />
							{book.categories.name}
						</Badge>
					)}
					{book.grades?.name && (
						<Badge variant="outline" className="gap-1 font-normal">
							<GraduationCap />
							{book.grades.name}
						</Badge>
					)}
					{book.subjects?.name && (
						<Badge variant="outline" className="gap-1 font-normal">
							<Tag />
							{book.subjects.name}
						</Badge>
					)}
					{book.books?.name && (
						<Badge variant="outline" className="gap-1 font-normal">
							<BookOpen />
							{book.books.name}
						</Badge>
					)}
				</div>
			</CardContent>

			<CardFooter className="gap-2 p-4 pt-0">
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
			</CardFooter>
		</Card>
	);
}

export function LibraryCardSkeleton() {
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
				<div className="flex gap-1.5">
					<Skeleton className="h-6 w-20 rounded-full" />
					<Skeleton className="h-6 w-24 rounded-full" />
				</div>
			</CardContent>
			<CardFooter className="gap-2 p-4 pt-0">
				<Skeleton className="h-8 flex-1" />
				<Skeleton className="size-8" />
			</CardFooter>
		</Card>
	);
}

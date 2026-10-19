import { BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { cn } from "@/lib/utils";
import { CourseCardSkeleton } from "./course-card";

// ─── CourseGrid ───────────────────────────────────────────────────────────────

export function CourseGrid({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
				className
			)}
		>
			{children}
		</div>
	);
}

// ─── CourseGridSkeleton ───────────────────────────────────────────────────────

export function CourseGridSkeleton({ count = 8 }: { count?: number }) {
	return (
		<CourseGrid>
			{Array.from({ length: count }).map((_, i) => (
				<CourseCardSkeleton key={i} />
			))}
		</CourseGrid>
	);
}

// ─── CourseGridEmpty ──────────────────────────────────────────────────────────

export function CourseGridEmpty({
	title,
	description,
	action,
	className,
}: {
	title?: string;
	description?: string;
	action?: React.ReactNode;
	className?: string;
}) {
	const t = useTranslations("courses");

	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 py-20 text-center",
				className
			)}
		>
			<div className="flex size-12 items-center justify-center rounded-full bg-muted">
				<BookOpen className="size-5 text-muted-foreground" />
			</div>
			<div>
				<p className="text-sm font-medium">{title ?? t("noCoursesFound")}</p>
				<p className="mt-1 text-xs text-muted-foreground">
					{description ?? t("noCoursesDescription")}
				</p>
			</div>
			{action && <div className="mt-2">{action}</div>}
		</div>
	);
}

// ─── CoursePagination ─────────────────────────────────────────────────────────

export function CoursePagination({
	page,
	pageSize,
	total,
	onPageChange,
	className,
}: {
	page: number;
	pageSize: number;
	total: number | null;
	onPageChange: (page: number) => void;
	className?: string;
}) {
	const t = useTranslations("courses");

	if (!total || total <= pageSize) return null;

	const totalPages = Math.ceil(total / pageSize);
	const from = (page - 1) * pageSize + 1;
	const to = Math.min(page * pageSize, total);

	return (
		<div className={cn("flex items-center justify-between text-sm", className)}>
			<span className="text-muted-foreground">
				{t("showing", { from, to, total })}
			</span>

			<div className="flex items-center gap-1">
				<button
					onClick={() => onPageChange(page - 1)}
					disabled={page <= 1}
					className="rounded-md border px-3 py-1 text-xs hover:bg-muted disabled:opacity-40"
				>
					{t("previous")}
				</button>
				<span className="px-2 text-xs text-muted-foreground">
					{page} / {totalPages}
				</span>
				<button
					onClick={() => onPageChange(page + 1)}
					disabled={page >= totalPages}
					className="rounded-md border px-3 py-1 text-xs hover:bg-muted disabled:opacity-40"
				>
					{t("next")}
				</button>
			</div>
		</div>
	);
}

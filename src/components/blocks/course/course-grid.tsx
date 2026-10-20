"use client";

import {
	ArrowLeft,
	ArrowRight,
	BookOpen,
	ChevronLeft,
	ChevronRight,
	SearchX,
	Sparkles,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";

import { cn } from "@/lib/utils";
import { CourseCardSkeleton } from "./course-card";

// ============================================================
// COURSE GRID
// ============================================================

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
				"grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
				className
			)}
		>
			{children}
		</div>
	);
}

// ============================================================
// GRID SKELETON
// ============================================================

export function CourseGridSkeleton({ count = 8 }: { count?: number }) {
	return (
		<CourseGrid>
			{Array.from({
				length: Math.max(0, count),
			}).map((_, index) => (
				<CourseCardSkeleton key={index} />
			))}
		</CourseGrid>
	);
}

// ============================================================
// EMPTY STATE
// ============================================================

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
				"relative isolate flex min-h-[360px] flex-col items-center justify-center overflow-hidden rounded-[28px] border border-dashed border-[#ded9f1] bg-white px-6 py-14 text-center shadow-sm dark:border-violet-500/20 dark:bg-[#1c263b]",
				className
			)}
		>
			{/* BACKGROUND DECORATION */}

			<div
				aria-hidden="true"
				className="pointer-events-none absolute -end-20 -top-24 size-72 rounded-full bg-violet-100/60 blur-3xl dark:bg-violet-500/5"
			/>

			<div
				aria-hidden="true"
				className="pointer-events-none absolute -start-20 -bottom-24 size-72 rounded-full bg-emerald-100/50 blur-3xl dark:bg-emerald-500/5"
			/>

			{/* ICON */}

			<div className="relative mb-6">
				<div className="absolute inset-0 scale-150 rounded-full bg-violet-100/60 blur-xl dark:bg-violet-500/10" />

				<div className="relative flex size-24 items-center justify-center rounded-[30px] border border-violet-100 bg-gradient-to-br from-[#f1ecff] to-[#e4dcff] text-[#694bd2] shadow-[0_15px_35px_-18px_rgba(105,75,210,.45)] dark:border-violet-500/20 dark:from-violet-500/20 dark:to-violet-500/10 dark:text-violet-300">
					<BookOpen className="size-10" />

					<span className="absolute -end-3 -top-3 flex size-9 items-center justify-center rounded-2xl border-4 border-white bg-[#b7f486] text-[#26344b] shadow-sm dark:border-[#1c263b]">
						<SearchX className="size-4" />
					</span>
				</div>
			</div>

			{/* CONTENT */}

			<div className="relative max-w-md">
				<h3 className="text-lg font-extrabold tracking-tight text-[#19243b] dark:text-slate-100 sm:text-xl">
					{title ?? t("noCoursesFound")}
				</h3>

				<p className="mx-auto mt-3 max-w-sm text-xs leading-7 text-slate-500 dark:text-slate-400 sm:text-sm">
					{description ?? t("noCoursesDescription")}
				</p>
			</div>

			{/* ACTION */}

			{action && (
				<div className="relative mt-7 flex items-center justify-center">
					{action}
				</div>
			)}

			{/* DECORATION */}

			<div className="pointer-events-none absolute bottom-5 end-6 text-violet-200 dark:text-violet-500/20">
				<Sparkles className="size-6" />
			</div>
		</div>
	);
}

// ============================================================
// PAGINATION
// ============================================================

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
	const locale = useLocale();

	if (total == null || total <= 0 || pageSize <= 0 || total <= pageSize) {
		return null;
	}

	const totalPages = Math.ceil(total / pageSize);

	const currentPage = Math.max(1, Math.min(page, totalPages));

	const from = (currentPage - 1) * pageSize + 1;

	const to = Math.min(currentPage * pageSize, total);

	const isFirstPage = currentPage <= 1;
	const isLastPage = currentPage >= totalPages;

	const formatNumber = (value: number) =>
		new Intl.NumberFormat(locale).format(value);

	return (
		<div
			className={cn(
				"flex flex-col items-center justify-between gap-4 rounded-[20px] border border-[#e9eaf2] bg-white px-5 py-4 shadow-sm dark:border-white/10 dark:bg-[#1c263b] sm:flex-row",
				className
			)}
		>
			{/* RESULTS INFORMATION */}

			<div className="flex items-center gap-3">
				<div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f1edff] text-[#694bd2] dark:bg-violet-500/10 dark:text-violet-300">
					<BookOpen className="size-5" />
				</div>

				<div>
					<p className="text-xs font-semibold text-[#27344d] dark:text-slate-200">
						{t("showing", {
							from,
							to,
							total,
						})}
					</p>

					<p className="mt-1 text-[11px] text-slate-400">
						{formatNumber(currentPage)}
						{" / "}
						{formatNumber(totalPages)}
					</p>
				</div>
			</div>

			{/* PAGINATION CONTROLS */}

			<div className="flex items-center gap-2">
				<button
					type="button"
					onClick={() => onPageChange(currentPage - 1)}
					disabled={isFirstPage}
					className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#e9eaf2] bg-white px-3 text-xs font-bold text-[#27344d] transition-all hover:border-violet-200 hover:bg-violet-50 hover:text-[#694bd2] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
				>
					<ChevronLeft className="size-4 rtl:hidden" />
					<ChevronRight className="hidden size-4 rtl:block" />

					{t("previous")}
				</button>

				<div className="flex h-10 min-w-[70px] items-center justify-center rounded-xl bg-[#f1edff] px-3 text-xs font-extrabold text-[#694bd2] dark:bg-violet-500/15 dark:text-violet-300">
					{formatNumber(currentPage)}
					<span className="mx-1.5 opacity-40">/</span>
					{formatNumber(totalPages)}
				</div>

				<button
					type="button"
					onClick={() => onPageChange(currentPage + 1)}
					disabled={isLastPage}
					className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#694bd2] px-3 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#593bc1] disabled:cursor-not-allowed disabled:opacity-40"
				>
					{t("next")}

					<ChevronRight className="size-4 rtl:hidden" />
					<ChevronLeft className="hidden size-4 rtl:block" />
				</button>
			</div>
		</div>
	);
}

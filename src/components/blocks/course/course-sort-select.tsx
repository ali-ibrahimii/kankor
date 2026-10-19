"use client";

import { ArrowUpDown } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { Sort } from "@/hooks/filter/types";

// ─── Sort options ─────────────────────────────────────────────────────────────

export type CourseSortValue = "newest" | "oldest" | "titleAsc";

const SORT_MAP: Record<CourseSortValue, Sort<"courses">> = {
	newest: { field: "created_at", direction: "desc" },
	oldest: { field: "created_at", direction: "asc" },
	titleAsc: { field: "title", direction: "asc" },
};

export function sortToValue(sort?: Sort<"courses">[]): CourseSortValue {
	const first = sort?.[0];
	if (!first) return "newest";
	if (first.field === "title") return "titleAsc";
	return first.direction === "asc" ? "oldest" : "newest";
}

export function valueToSort(value: CourseSortValue): Sort<"courses">[] {
	return [SORT_MAP[value]];
}

// ─── CourseSortSelect ─────────────────────────────────────────────────────────

export type CourseSortSelectProps = {
	value: CourseSortValue;
	onChange: (value: CourseSortValue) => void;
	className?: string;
};

export function CourseSortSelect({
	value,
	onChange,
	className,
}: CourseSortSelectProps) {
	const t = useTranslations("courses");

	return (
		<Select value={value} onValueChange={(v) => onChange(v as CourseSortValue)}>
			<SelectTrigger size="sm" className={className} aria-label={t("sortBy")}>
				<ArrowUpDown className="size-3.5 text-muted-foreground" />
				<SelectValue placeholder={t("sortBy")} />
			</SelectTrigger>
			<SelectContent align="end">
				<SelectItem value="newest">{t("sort_newest")}</SelectItem>
				<SelectItem value="oldest">{t("sort_oldest")}</SelectItem>
				<SelectItem value="titleAsc">{t("sort_titleAsc")}</SelectItem>
			</SelectContent>
		</Select>
	);
}

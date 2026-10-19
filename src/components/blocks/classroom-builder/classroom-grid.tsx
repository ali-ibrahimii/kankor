"use client";

import { SchoolIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { ClassroomCardSkeleton } from "./classroom-card";

// ─── Grid ─────────────────────────────────────────────────────────────────────

export function ClassroomGrid({ children }: { children: React.ReactNode }) {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{children}
		</div>
	);
}

// ─── Empty state ──────────────────────────────────────────────────────────────

export function ClassroomGridEmpty({ action }: { action?: React.ReactNode }) {
	const t = useTranslations("classroomBuilder");
	return (
		<div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
			<div className="flex size-16 items-center justify-center rounded-full bg-muted">
				<SchoolIcon className="size-8 text-muted-foreground" />
			</div>
			<div>
				<p className="font-medium">{t("list.emptyTitle")}</p>
				<p className="mt-1 text-sm text-muted-foreground">
					{t("list.emptyDescription")}
				</p>
			</div>
			{action}
		</div>
	);
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function ClassroomGridSkeleton({ count = 6 }: { count?: number }) {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{Array.from({ length: count }, (_, i) => (
				<ClassroomCardSkeleton key={i} />
			))}
		</div>
	);
}

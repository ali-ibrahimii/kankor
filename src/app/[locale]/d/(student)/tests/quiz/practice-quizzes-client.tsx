"use client";

import {
	ArrowRight,
	CheckCircle2,
	Clock,
	Compass,
	FileText,
	ListChecks,
	Search,
	Target,
	X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

export interface PracticeQuizItem {
	id: string;
	slug: string | null;
	title: string;
	description: string | null;
	subject_name: string | null;
	time_limit_minutes: number | null;
	passing_score_percentage: number | null;
	is_free: boolean;
	price_credits: number;
}

type FilterMode = "all" | "free" | "timed";

export function PracticeQuizzesClient({
	quizzes,
}: {
	quizzes: PracticeQuizItem[];
}) {
	const t = useTranslations("dashboard.student.practiceQuizzes");
	const [mode, setMode] = React.useState<FilterMode>("all");
	const [search, setSearch] = React.useState("");

	const filtered = React.useMemo(() => {
		const q = search.trim().toLowerCase();
		return quizzes.filter((item) => {
			if (mode === "free" && !(item.is_free || item.price_credits <= 0)) {
				return false;
			}
			if (mode === "timed" && item.time_limit_minutes == null) {
				return false;
			}
			if (!q) return true;
			return (
				item.title.toLowerCase().includes(q) ||
				(item.description ?? "").toLowerCase().includes(q) ||
				(item.subject_name ?? "").toLowerCase().includes(q)
			);
		});
	}, [mode, quizzes, search]);

	const hasFilters = mode !== "all" || search.trim().length > 0;

	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-8 sm:px-8">
			<header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div className="space-y-1.5">
					<h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
						{t("title")}
					</h1>
					<p className="text-sm text-muted-foreground">{t("description")}</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<Button
						asChild
						variant="outline"
						size="sm"
						className="rounded-full text-xs"
					>
						<Link href="/d/tests/kankor">
							<Compass className="size-3.5" />
							{t("kankorLink")}
						</Link>
					</Button>
					<Button
						asChild
						variant="outline"
						size="sm"
						className="rounded-full text-xs"
					>
						<Link href={routes.d.tests.passed.page()}>
							<CheckCircle2 className="size-3.5" />
							{t("passedLink")}
						</Link>
					</Button>
					<Button
						asChild
						variant="outline"
						size="sm"
						className="rounded-full text-xs"
					>
						<Link href={routes.d.tests.registered.page()}>
							<ListChecks className="size-3.5" />
							{t("registeredLink")}
						</Link>
					</Button>
				</div>
			</header>

			{/* Search + mode tabs */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="relative w-full sm:max-w-sm">
					<Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder={t("searchPlaceholder")}
						className="rounded-full ps-9 pe-9"
					/>
					{search ? (
						<button
							type="button"
							onClick={() => setSearch("")}
							aria-label={t("clearFilters")}
							className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
						>
							<X className="size-4" />
						</button>
					) : null}
				</div>

				<div className="inline-flex self-start rounded-full border border-border bg-card p-1 sm:self-auto">
					{(
						[
							["all", t("filterAll")],
							["free", t("filterFree")],
							["timed", t("filterTimed")],
						] as const
					).map(([value, label]) => (
						<button
							key={value}
							type="button"
							onClick={() => setMode(value)}
							className={cn(
								"rounded-full px-3.5 py-1 text-xs font-semibold transition-colors",
								mode === value
									? "bg-primary text-primary-foreground"
									: "text-muted-foreground hover:text-foreground"
							)}
						>
							{label}
						</button>
					))}
				</div>
			</div>

			{filtered.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed bg-card/70 px-6 py-16 text-center">
					<FileText className="size-10 text-primary/45" />
					<h2 className="text-base font-bold text-foreground">
						{t("emptyTitle")}
					</h2>
					<p className="max-w-md text-sm text-muted-foreground">
						{t("emptySubtitle")}
					</p>
					{hasFilters ? (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => {
								setMode("all");
								setSearch("");
							}}
							className="mt-1 rounded-full"
						>
							{t("clearFilters")}
						</Button>
					) : (
						<Button asChild size="sm" className="mt-1 rounded-full px-5">
							<Link href="/d/tests/kankor">
								{t("kankorLink")}
								<ArrowRight className="size-3.5 rtl:rotate-180" />
							</Link>
						</Button>
					)}
				</div>
			) : (
				<div className="grid gap-4 sm:grid-cols-2">
					{filtered.map((quiz) => {
						const href = routes.quizzes.slug.page({
							slug: quiz.slug ?? quiz.id,
						});
						return (
							<article
								key={quiz.id}
								className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md"
							>
								<div className="space-y-2.5">
									<div className="flex flex-wrap items-center justify-between gap-2">
										{quiz.subject_name ? (
											<Badge variant="secondary" className="text-xs">
												{quiz.subject_name}
											</Badge>
										) : (
											<span />
										)}
										<span className="text-xs font-semibold text-primary">
											{quiz.is_free || quiz.price_credits <= 0
												? t("free")
												: t("credits", { count: quiz.price_credits })}
										</span>
									</div>

									<h2 className="line-clamp-2 text-base font-bold leading-snug text-foreground">
										{quiz.title}
									</h2>

									{quiz.description ? (
										<p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
											{quiz.description}
										</p>
									) : null}
								</div>

								<div className="mt-5 flex items-center justify-between gap-3 border-t border-border/60 pt-3.5">
									<div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
										<span className="inline-flex items-center gap-1">
											<Clock className="size-3.5" />
											{quiz.time_limit_minutes != null
												? t("timeLimit", { count: quiz.time_limit_minutes })
												: t("untimed")}
										</span>
										{quiz.passing_score_percentage != null ? (
											<span className="inline-flex items-center gap-1">
												<Target className="size-3.5" />
												{t("passingScore", {
													score: quiz.passing_score_percentage,
												})}
											</span>
										) : null}
									</div>

									<Button asChild size="sm" className="rounded-full px-4">
										<Link href={href}>
											{t("startQuiz")}
											<ArrowRight className="size-3.5 rtl:rotate-180" />
										</Link>
									</Button>
								</div>
							</article>
						);
					})}
				</div>
			)}
		</div>
	);
}

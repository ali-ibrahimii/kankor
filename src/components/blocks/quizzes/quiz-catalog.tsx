"use client";

import {
	AlertCircle,
	ArrowLeft,
	ArrowRight,
	ArrowUpDown,
	Award,
	BookOpen,
	Check,
	CheckCircle2,
	ClipboardCheck,
	Clock,
	Layers3,
	RotateCcw,
	Search,
	Sparkles,
	Target,
	X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQueryFilters } from "@/hooks/filter/filter.hooks";
import type { Locale } from "@/i18n";
import { Link } from "@/i18n/navigation";
import { isRtl } from "@/i18n/routing";
import { isSupabaseConfigured } from "@/lib/env/client-env";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { PublicQuizCard, PublicQuizCardSkeleton } from "./public-quiz-card";
import { publicQuizzesQueryFn } from "./public-quiz-query";
import type { PublicQuiz } from "./types";

export type QuizCatalogFallbackEntry = {
	quiz: PublicQuiz & {
		exam_zone?: string;
		rating?: number;
		rating_count?: number;
	};
	href: string;
};

type QuickFilter = "all" | "free" | "timed";
type SortChoice = "newest" | "shortest" | "longest";

const SORT_MAP: Record<
	SortChoice,
	{ field: "created_at" | "time_limit_minutes"; direction: "asc" | "desc" }
> = {
	newest: { field: "created_at", direction: "desc" },
	shortest: { field: "time_limit_minutes", direction: "asc" },
	longest: { field: "time_limit_minutes", direction: "desc" },
};

function deriveSortChoice(
	sort?: { field: string; direction: "asc" | "desc" }[]
): SortChoice {
	const primary = sort?.[0];
	if (primary?.field === "time_limit_minutes") {
		return primary.direction === "asc" ? "shortest" : "longest";
	}
	return "newest";
}

export function QuizCatalog({
	initialData,
	fallbackItems = [],
	showHero = false,
	useLiveBackend = isSupabaseConfigured,
}: {
	initialData?: { data: PublicQuiz[] | null; count: number | null };
	fallbackItems?: QuizCatalogFallbackEntry[];
	showHero?: boolean;
	useLiveBackend?: boolean;
} = {}) {
	const t = useTranslations("quizzes");
	const locale = useLocale();
	const rtl = isRtl(locale as Locale);
	const Arrow = rtl ? ArrowLeft : ArrowRight;
	const numFmt = React.useMemo(() => new Intl.NumberFormat(locale), [locale]);

	const useFallbackMode = !useLiveBackend && fallbackItems.length > 0;

	const quizzesQuery = useQueryFilters<"quizzes", PublicQuiz[]>({
		table: "quizzes",
		queryFn: publicQuizzesQueryFn,
		initialData,
		enabled: useLiveBackend,
		initialState: {
			name: "public-quizzes",
			sort: [{ field: "created_at", direction: "desc" }],
			pagination: { page: 1, pageSize: 12 },
		},
	});

	const {
		state,
		setSearch,
		setFilter,
		removeFilter,
		setSort,
		setPagination,
		reset,
	} = quizzesQuery;

	// Local state for search input & offline fallback mode
	const [searchValue, setSearchValue] = React.useState(state.search ?? "");
	const [localFilter, setLocalFilter] = React.useState<QuickFilter>("all");
	const [localSort, setLocalSort] = React.useState<SortChoice>("newest");

	React.useEffect(() => {
		if (!useFallbackMode) {
			setSearchValue(state.search ?? "");
		}
	}, [state.search, useFallbackMode]);

	// Active filter & sort across live / fallback modes
	const liveFree =
		state.filters?.find((f) => f.field === "is_free")?.value === true;
	const liveTimed = state.filters?.some(
		(f) => f.field === "time_limit_minutes"
	);
	const activeFilter: QuickFilter = useFallbackMode
		? localFilter
		: liveFree
			? "free"
			: liveTimed
				? "timed"
				: "all";

	const activeSort: SortChoice = useFallbackMode
		? localSort
		: deriveSortChoice(
				state.sort as { field: string; direction: "asc" | "desc" }[] | undefined
			);

	function handleSearchChange(next: string) {
		setSearchValue(next);
		if (!useFallbackMode) {
			setSearch(next);
		}
	}

	function handleFilterSelect(next: QuickFilter) {
		if (useFallbackMode) {
			setLocalFilter(next);
			return;
		}
		removeFilter(["is_free", "time_limit_minutes"]);
		if (next === "free") {
			setFilter({ field: "is_free", operator: "eq", value: true });
		} else if (next === "timed") {
			setFilter({ field: "time_limit_minutes", operator: "gt", value: 0 });
		}
	}

	function handleSortSelect(next: SortChoice) {
		if (useFallbackMode) {
			setLocalSort(next);
			return;
		}
		setSort(SORT_MAP[next]);
	}

	function handleResetAll() {
		setSearchValue("");
		if (useFallbackMode) {
			setLocalFilter("all");
			setLocalSort("newest");
			return;
		}
		reset();
	}

	// Filtered fallback entries for unconfigured preview environments
	const filteredFallback = React.useMemo(() => {
		if (!useFallbackMode) return [];
		const q = searchValue.trim().toLowerCase();
		const list = fallbackItems.filter(({ quiz }) => {
			if (localFilter === "free" && !quiz.is_free) return false;
			if (
				localFilter === "timed" &&
				(quiz.time_limit_minutes == null || quiz.time_limit_minutes <= 0)
			) {
				return false;
			}
			if (!q) return true;
			const haystack =
				`${quiz.title} ${quiz.description ?? ""} ${quiz.exam_zone ?? ""}`.toLowerCase();
			return haystack.includes(q);
		});

		if (localSort === "shortest") {
			return [...list].sort(
				(a, b) =>
					(a.quiz.time_limit_minutes ?? Number.MAX_SAFE_INTEGER) -
					(b.quiz.time_limit_minutes ?? Number.MAX_SAFE_INTEGER)
			);
		}
		if (localSort === "longest") {
			return [...list].sort(
				(a, b) =>
					(b.quiz.time_limit_minutes ?? 0) - (a.quiz.time_limit_minutes ?? 0)
			);
		}
		return list;
	}, [useFallbackMode, fallbackItems, searchValue, localFilter, localSort]);

	const liveQuizzes = (quizzesQuery.data?.data ?? []) as PublicQuiz[];
	const liveTotal = (quizzesQuery.data?.count ?? null) as number | null;
	const page = state.pagination?.page ?? 1;
	const pageSize = state.pagination?.pageSize ?? 12;

	const displayedEntries: QuizCatalogFallbackEntry[] = useFallbackMode
		? filteredFallback
		: liveQuizzes.map((quiz) => ({
				quiz,
				href: routes.quizzes.slug.page({ slug: quiz.slug ?? quiz.id }),
			}));

	const totalCount = useFallbackMode
		? filteredFallback.length
		: (liveTotal ?? liveQuizzes.length);

	const hasActiveFilters =
		searchValue.trim().length > 0 ||
		activeFilter !== "all" ||
		activeSort !== "newest";

	const isLoadingInitial =
		useLiveBackend && quizzesQuery.isFetching && liveQuizzes.length === 0;
	const isError = useLiveBackend && quizzesQuery.isError;

	const totalPages =
		!useFallbackMode && liveTotal && liveTotal > pageSize
			? Math.ceil(liveTotal / pageSize)
			: 1;
	const rangeFrom = (page - 1) * pageSize + 1;
	const rangeTo = liveTotal ? Math.min(page * pageSize, liveTotal) : 0;

	const filterTabs: {
		id: QuickFilter;
		label: string;
		icon?: React.ComponentType<{ className?: string }>;
	}[] = [
		{ id: "all", label: t("hub.filters.all") },
		{ id: "free", label: t("hub.filters.free"), icon: Sparkles },
		{ id: "timed", label: t("hub.filters.timed"), icon: Clock },
	];

	const sortOptions: { id: SortChoice; label: string }[] = [
		{ id: "newest", label: t("hub.filters.sortNewest") },
		{ id: "shortest", label: t("hub.filters.sortShortest") },
		{ id: "longest", label: t("hub.filters.sortLongest") },
	];

	const heroChips = [
		t("hub.chipTimed"),
		t("hub.chipScored"),
		t("hub.chipSubjects"),
	];

	return (
		<div className="flex flex-col">
			{/* Signature Contained Deep-Navy Hero (matches Home, Courses & About) */}
			{showHero && (
				<section className="mx-auto w-full max-w-[1320px] px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
					<div className="relative isolate overflow-hidden rounded-[26px] border border-white/10 bg-[#0f1a2c] bg-[radial-gradient(circle_at_6%_112%,rgba(94,207,173,.22),transparent_36%),radial-gradient(circle_at_88%_-10%,rgba(137,100,255,.36),transparent_42%),linear-gradient(125deg,#0f1a2c_4%,#16223a_58%,#20223f_100%)] px-5 py-8 text-white shadow-[0_34px_80px_-46px_rgba(14,19,49,.7)] sm:rounded-[34px] sm:px-10 sm:py-12 lg:px-14 lg:py-14">
						<div
							aria-hidden="true"
							className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(rgba(255,255,255,.13)_0.7px,transparent_0.7px)] bg-size-[24px_24px]"
						/>
						<div
							aria-hidden="true"
							className="pointer-events-none absolute -end-20 -bottom-28 -z-10 size-80 rounded-full border-[44px] border-white/[.03]"
						/>

						<div className="grid items-center gap-9 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-12">
							{/* Start Column: Title, Integrated Search & Actions */}
							<div>
								<span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.07] px-3.5 py-1.5 text-xs font-bold text-white/90 backdrop-blur">
									<ClipboardCheck className="size-4 text-[#b7f486]" />
									<span>{t("hub.badge")}</span>
								</span>

								<h1 className="mt-5 max-w-xl text-[1.9rem] font-black leading-[1.38] tracking-tight text-white sm:text-[2.55rem] lg:text-[2.95rem]">
									{t.rich("hub.heroTitle", {
										accent: (chunks) => (
											<span className="bg-linear-to-l from-[#b7f486] via-[#7ce5d1] to-[#b8a4ff] bg-clip-text text-transparent">
												{chunks}
											</span>
										),
									})}
								</h1>

								<p className="mt-3.5 max-w-xl text-sm leading-8 text-white/70 sm:text-[15px]">
									{t("description")}
								</p>

								{/* Integrated Hero Search Input (matches SchoolHubView) */}
								<div className="relative mt-6 max-w-xl">
									<Search
										aria-hidden="true"
										className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-white/45"
									/>
									<Input
										type="search"
										value={searchValue}
										onChange={(e) => handleSearchChange(e.target.value)}
										placeholder={t("searchPlaceholder")}
										className="h-12 rounded-2xl border-white/15 bg-white/[.07] ps-11 pe-12 text-sm text-white placeholder:text-white/45 focus-visible:border-[#b7f486]/55 focus-visible:ring-[#b7f486]/20"
									/>
									{searchValue && (
										<button
											type="button"
											aria-label={t("clearSearch")}
											onClick={() => handleSearchChange("")}
											className="absolute end-2.5 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-xl bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
										>
											<X className="size-3.5" />
										</button>
									)}
								</div>

								{/* Dual CTAs */}
								<div className="mt-4 flex flex-wrap items-center gap-3">
									<a
										href="#quiz-catalog"
										className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#b7f486] px-5 py-2.5 text-sm font-extrabold text-[#17233a] shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-[#c9f8a2]"
									>
										<span>{t("hub.browseCta")}</span>
										<Arrow className="size-4" />
									</a>

									<Link
										href={routes.auth.signup.page({ type: "instructor" })}
										className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/[.07] px-5 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:border-white/35 hover:bg-white/[.13]"
									>
										<Sparkles className="size-4 text-[#b7f486]" />
										<span>{t("hub.hostCta")}</span>
									</Link>
								</div>

								{/* Trust Pills */}
								<ul className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-white/70">
									{heroChips.map((chip) => (
										<li key={chip} className="inline-flex items-center gap-1.5">
											<span className="inline-flex size-4 items-center justify-center rounded-full bg-[#b7f486]/15 text-[#b7f486]">
												<Check className="size-2.5 stroke-[3]" />
											</span>
											<span>{chip}</span>
										</li>
									))}
								</ul>
							</div>

							{/* End Column: Exam Simulation Window */}
							<div className="relative mx-auto w-full max-w-[470px] lg:max-w-none">
								<div className="hero-window overflow-hidden">
									<div className="hero-window-top">
										<div className="flex items-center gap-2.5">
											<div
												className="flex items-center gap-1.5"
												aria-hidden="true"
											>
												<span className="size-2.5 rounded-full bg-white/20" />
												<span className="size-2.5 rounded-full bg-white/20" />
												<span className="size-2.5 rounded-full bg-[#b7f486]/75" />
											</div>
											<span className="text-[11px] font-semibold text-white/55">
												{t("hub.panel.eyebrow")}
											</span>
										</div>

										<span className="inline-flex items-center gap-1.5 rounded-full border border-[#b7f486]/25 bg-[#b7f486]/12 px-2.5 py-1 text-[11px] font-bold text-[#b7f486]">
											<Clock className="size-3.5" />
											{t("hub.panel.timerValue")}
										</span>
									</div>

									<div className="p-5 sm:p-6">
										<p className="text-base font-extrabold text-white sm:text-lg">
											{t("hub.panel.title")}
										</p>

										{/* Answered Progress */}
										<div className="mt-4 rounded-2xl border border-white/10 bg-white/[.045] p-4">
											<div className="flex items-center justify-between text-xs">
												<span className="font-semibold text-white/80">
													{t("hub.panel.progressLabel")}
												</span>
												<span className="font-black text-[#b7f486]">
													{t("hub.panel.progressValue")}
												</span>
											</div>
											<div
												aria-hidden="true"
												className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10"
											>
												<div className="h-full w-3/4 rounded-full bg-linear-to-r from-[#b7f486] via-[#7ce5d1] to-[#a58cff]" />
											</div>
										</div>

										{/* Metric Pair */}
										<div className="mt-3 grid grid-cols-2 gap-3">
											<div className="rounded-2xl border border-white/10 bg-white/[.04] p-3.5">
												<div className="flex items-center gap-2 text-white/60">
													<span className="flex size-7 items-center justify-center rounded-lg bg-[#a58cff]/20 text-[#c9bcff]">
														<Clock className="size-3.5" />
													</span>
													<span className="truncate text-[11px] font-medium">
														{t("hub.panel.statDurationLabel")}
													</span>
												</div>
												<p className="mt-2.5 text-sm font-black text-white sm:text-base">
													{t("hub.panel.statDurationValue")}
												</p>
											</div>

											<div className="rounded-2xl border border-white/10 bg-white/[.04] p-3.5">
												<div className="flex items-center gap-2 text-white/60">
													<span className="flex size-7 items-center justify-center rounded-lg bg-[#7ce5d1]/20 text-[#7ce5d1]">
														<Target className="size-3.5" />
													</span>
													<span className="truncate text-[11px] font-medium">
														{t("hub.panel.statPassLabel")}
													</span>
												</div>
												<p className="mt-2.5 text-sm font-black text-white sm:text-base">
													{t("hub.panel.statPassValue")}
												</p>
											</div>
										</div>

										{/* Instant Evaluation Strip */}
										<div className="mt-3 flex items-center gap-3.5 rounded-2xl border border-[#b7f486]/20 bg-[#b7f486]/[.07] p-3.5">
											<span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#b7f486] text-[#17233a] shadow-xs">
												<Award className="size-5" />
											</span>
											<div className="min-w-0 flex-1">
												<p className="truncate text-xs font-extrabold text-white sm:text-sm">
													{t("hub.panel.resultTitle")}
												</p>
												<p className="mt-0.5 truncate text-[11px] text-white/60">
													{t("hub.panel.resultDesc")}
												</p>
											</div>
											<span className="hidden shrink-0 items-center gap-1 rounded-full border border-[#b7f486]/30 bg-[#b7f486]/12 px-2.5 py-1 text-[10px] font-bold text-[#b7f486] sm:inline-flex">
												<CheckCircle2 className="size-3" />
												{t("hub.panel.verifiedBadge")}
											</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>
			)}

			{/* Catalog Toolbar + Results Grid */}
			<section
				id="quiz-catalog"
				className={cn(
					"scroll-mt-28 flex flex-col gap-6",
					showHero &&
						"mx-auto w-full max-w-[1320px] px-4 pt-8 pb-16 sm:px-6 sm:pt-10 lg:px-8 lg:pb-20"
				)}
			>
				{/* Filter, Search (when embedded without hero) & Sort Toolbar */}
				<div className="soft-card flex flex-col gap-3.5 border-[#e5e8f3] bg-white p-3.5 sm:p-4 dark:border-white/10 dark:bg-[#1b2438]">
					{!showHero && (
						<div className="relative">
							<Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
							<Input
								type="search"
								value={searchValue}
								onChange={(e) => handleSearchChange(e.target.value)}
								placeholder={t("searchPlaceholder")}
								className="h-11 rounded-2xl border-slate-200 bg-slate-50/70 ps-10 pe-10 dark:border-white/10 dark:bg-[#141b2c]"
							/>
							{searchValue && (
								<Button
									variant="ghost"
									size="icon-sm"
									className="absolute end-1.5 top-1/2 -translate-y-1/2 rounded-xl"
									aria-label={t("clearSearch")}
									onClick={() => handleSearchChange("")}
								>
									<X className="size-3.5" />
								</Button>
							)}
						</div>
					)}

					<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
						{/* Filter Chips + Live Count */}
						<div className="flex flex-wrap items-center gap-1.5">
							{filterTabs.map(({ id, label, icon: Icon }) => {
								const selected = activeFilter === id;
								return (
									<button
										key={id}
										type="button"
										aria-pressed={selected}
										onClick={() => handleFilterSelect(id)}
										className={cn(
											"inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
											selected
												? "bg-primary text-primary-foreground shadow-xs shadow-primary/25"
												: "bg-slate-100/80 text-slate-600 hover:bg-primary/8 hover:text-[#19243b] dark:bg-white/[.06] dark:text-slate-300 dark:hover:bg-white/[.12] dark:hover:text-white"
										)}
									>
										{Icon && <Icon className="size-3.5" />}
										<span>{label}</span>
									</button>
								);
							})}

							{!isLoadingInitial && !isError && (
								<span className="ms-1 inline-flex items-center rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-500 dark:border-white/10 dark:bg-[#141b2c] dark:text-slate-400">
									{t("hub.filters.count", { count: totalCount })}
								</span>
							)}
						</div>

						{/* Sort Pills + Reset */}
						<div className="flex flex-wrap items-center gap-1.5">
							<span
								aria-hidden="true"
								className="me-1 hidden size-8 items-center justify-center rounded-xl bg-slate-100/80 text-slate-500 sm:inline-flex dark:bg-white/[.06] dark:text-slate-400"
							>
								<ArrowUpDown className="size-3.5" />
							</span>

							{sortOptions.map((option) => {
								const selected = activeSort === option.id;
								return (
									<button
										key={option.id}
										type="button"
										aria-pressed={selected}
										onClick={() => handleSortSelect(option.id)}
										className={cn(
											"rounded-xl px-3 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
											selected
												? "border border-primary/25 bg-primary/10 text-primary dark:border-violet-400/35 dark:bg-violet-400/15 dark:text-violet-200"
												: "border border-transparent text-slate-500 hover:bg-slate-100/80 hover:text-[#19243b] dark:text-slate-400 dark:hover:bg-white/[.06] dark:hover:text-slate-100"
										)}
									>
										{option.label}
									</button>
								);
							})}

							{hasActiveFilters && (
								<button
									type="button"
									onClick={handleResetAll}
									className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-primary/35 hover:text-primary dark:border-white/12 dark:bg-[#141b2c] dark:text-slate-300 dark:hover:text-violet-200"
								>
									<RotateCcw className="size-3" />
									<span>{t("hub.filters.reset")}</span>
								</button>
							)}
						</div>
					</div>
				</div>

				{/* Error / Skeleton / Empty / Cards */}
				{isError ? (
					<div className="soft-card flex flex-col items-center justify-center border-[#e5e8f3] bg-white px-6 py-16 text-center dark:border-white/10 dark:bg-[#1b2438]">
						<div className="flex size-14 items-center justify-center rounded-[20px] bg-[#ffeddf] text-[#c87949] dark:bg-amber-400/15 dark:text-amber-200">
							<AlertCircle className="size-6" />
						</div>
						<h2 className="mt-5 text-lg font-extrabold text-[#19243b] sm:text-xl dark:text-slate-100">
							{t("loadError")}
						</h2>
						<p className="mt-2 max-w-md text-sm leading-7 text-slate-500 dark:text-slate-400">
							{t("loadErrorDescription")}
						</p>
						<button
							type="button"
							onClick={() => quizzesQuery.refetch()}
							className="button-primary mt-6"
						>
							<RotateCcw className="size-4" />
							<span>{t("tryAgain")}</span>
						</button>
					</div>
				) : isLoadingInitial ? (
					<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{Array.from({ length: 8 }).map((_, i) => (
							<PublicQuizCardSkeleton key={i} />
						))}
					</div>
				) : displayedEntries.length === 0 ? (
					<div className="soft-card flex flex-col items-center justify-center border-[#e5e8f3] bg-white px-6 py-16 text-center sm:px-10 sm:py-20 dark:border-white/10 dark:bg-[#1b2438]">
						<div className="flex size-14 items-center justify-center rounded-[20px] bg-[#eee8ff] text-[#6b4dd7] dark:bg-violet-400/15 dark:text-violet-200">
							{hasActiveFilters ? (
								<Search className="size-6" />
							) : (
								<ClipboardCheck className="size-6" />
							)}
						</div>

						<h2 className="mt-5 text-xl font-extrabold text-[#19243b] sm:text-2xl dark:text-slate-100">
							{hasActiveFilters
								? t("hub.emptyFilteredTitle")
								: t("noQuizzesFound")}
						</h2>

						<p className="mx-auto mt-2.5 max-w-lg text-sm leading-7 text-slate-500 dark:text-slate-400">
							{hasActiveFilters
								? t("hub.emptyFilteredDesc")
								: t("hub.emptyCatalogDesc")}
						</p>

						<div className="mt-7 flex flex-wrap items-center justify-center gap-3">
							{hasActiveFilters ? (
								<button
									type="button"
									onClick={handleResetAll}
									className="button-primary"
								>
									<RotateCcw className="size-4" />
									<span>{t("hub.filters.reset")}</span>
								</button>
							) : (
								<>
									<Link href={routes.courses.page()} className="button-primary">
										<BookOpen className="size-4" />
										<span>{t("hub.exploreCourses")}</span>
										<Arrow className="size-4" />
									</Link>
									<Link href={routes.decks.page()} className="button-secondary">
										<Layers3 className="size-4" />
										<span>{t("hub.exploreDecks")}</span>
									</Link>
								</>
							)}
						</div>
					</div>
				) : (
					<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{displayedEntries.map(({ quiz, href }) => (
							<PublicQuizCard key={quiz.id} quiz={quiz} href={href} />
						))}
					</div>
				)}

				{/* Pagination Footer */}
				{totalPages > 1 && liveTotal != null && (
					<div className="soft-card flex flex-col items-center justify-between gap-3 border-[#e5e8f3] bg-white px-5 py-3.5 text-sm sm:flex-row dark:border-white/10 dark:bg-[#1b2438]">
						<span className="text-xs font-medium text-slate-500 dark:text-slate-400">
							{t("showing", {
								from: rangeFrom,
								to: rangeTo,
								total: liveTotal,
							})}
						</span>

						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								className="rounded-xl font-bold"
								onClick={() => setPagination({ page: page - 1 })}
								disabled={page <= 1}
							>
								{t("previous")}
							</Button>

							<span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-extrabold text-[#19243b] dark:bg-white/[.06] dark:text-slate-200">
								{numFmt.format(page)} / {numFmt.format(totalPages)}
							</span>

							<Button
								variant="outline"
								size="sm"
								className="rounded-xl font-bold"
								onClick={() => setPagination({ page: page + 1 })}
								disabled={page >= totalPages}
							>
								{t("next")}
							</Button>
						</div>
					</div>
				)}
			</section>
		</div>
	);
}

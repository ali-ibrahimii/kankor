import {
	ArrowRight,
	Bookmark,
	BookOpen,
	Calendar,
	CheckCircle2,
	Compass,
	Feather,
	GraduationCap,
	Layers,
	Library,
	Play,
	Plus,
	RotateCcw,
	Sparkles,
	Wallet,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { StudentDashboardOverview } from "@/types/queries.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysUntilKankor(now = new Date()): number {
	// Kankor is typically held in mid-Hamal (early April) in Afghanistan.
	const year = now.getMonth() >= 3 ? now.getFullYear() + 1 : now.getFullYear();
	const kankor = new Date(year, 3, 15);
	return Math.max(
		1,
		Math.ceil((kankor.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
	);
}

function resolveDateLocale(locale: string): string {
	if (locale === "en") return "en-US";
	if (locale === "ps") return "ps-AF";
	return "fa-AF";
}

function getFirstName(fullName?: string | null): string | null {
	const cleaned = fullName?.trim();
	if (!cleaned) return null;
	const [first] = cleaned.split(/\s+/);
	return first || null;
}

interface RhythmDay {
	key: string;
	date: Date;
	count: number;
	isToday: boolean;
}

function buildFourteenDayRhythm(
	raw: StudentDashboardOverview["study_activity"] | undefined,
	now = new Date()
): RhythmDay[] {
	const today = new Date(now);
	today.setHours(0, 0, 0, 0);

	if (raw && raw.length > 0) {
		const slice = raw.slice(-14);
		return slice.map((point, index) => {
			const parsed = new Date(point.date);
			const validDate = Number.isNaN(parsed.getTime()) ? today : parsed;
			return {
				key: `${point.date}-${index}`,
				date: validDate,
				count: Math.max(0, point.count ?? 0),
				isToday: index === slice.length - 1,
			};
		});
	}

	return Array.from({ length: 14 }, (_, index) => {
		const date = new Date(today);
		date.setDate(today.getDate() - (13 - index));
		return {
			key: date.toISOString().slice(0, 10),
			date,
			count: 0,
			isToday: index === 13,
		};
	});
}

function stoneToneClass(count: number, maxCount: number, isToday: boolean) {
	if (count <= 0) {
		return cn(
			"bg-stone-200/75 dark:bg-muted/70",
			isToday &&
				"ring-2 ring-primary/45 ring-offset-2 ring-offset-card bg-primary/10"
		);
	}
	const ratio = maxCount > 0 ? count / maxCount : 0;
	const fill =
		ratio >= 0.72
			? "bg-gradient-to-br from-[#725bff] to-[#36c6ab] shadow-xs shadow-primary/20"
			: ratio >= 0.38
				? "bg-[#36c6ab]/75 dark:bg-[#36c6ab]/65"
				: "bg-[#36c6ab]/38 dark:bg-[#36c6ab]/32";
	return cn(
		fill,
		isToday && "ring-2 ring-primary/50 ring-offset-2 ring-offset-card"
	);
}

// ─── View ─────────────────────────────────────────────────────────────────────

export interface StudentOverviewProps {
	overview: StudentDashboardOverview | null;
	userName?: string | null;
}

/**
 * Learner-first personal study desk shared by `/d` (fed by the
 * `get_student_dashboard_overview` RPC) and `/demo?role=student` (mock data).
 *
 * Intentionally avoids dashboard KPI grids and analytics charts in favor of a
 * calm reading room: an open course bookmark, a stacked flashcard box with a
 * 14-day pebble rhythm, a quiet study shelf, and a two-page notebook spread.
 */
export async function StudentOverview({
	overview,
	userName,
}: StudentOverviewProps) {
	const [t, locale] = await Promise.all([
		getTranslations("overview.student"),
		getLocale(),
	]);

	const now = new Date();
	const dateLocale = resolveDateLocale(locale);
	const numberFormat = new Intl.NumberFormat(dateLocale);
	const fullDateFormat = new Intl.DateTimeFormat(dateLocale, {
		weekday: "long",
		month: "long",
		day: "numeric",
	});
	const shortDateFormat = new Intl.DateTimeFormat(dateLocale, {
		month: "short",
		day: "numeric",
	});

	const daysLeft = getDaysUntilKankor(now);
	const firstName = getFirstName(userName);

	const enrolledCount = overview?.enrolled_courses_count ?? 0;
	const cardsDue = overview?.cards_due_today ?? 0;
	const testsCompleted = overview?.tests_completed_count ?? 0;
	const testsPassed = overview?.tests_passed_count ?? 0;
	const bookmarksCount = overview?.bookmarks_count ?? 0;
	const creditBalance = overview?.credit_balance ?? 0;
	const notesCount = overview?.notes_count ?? 0;

	const continueLearning = overview?.continue_learning ?? null;
	const progressPercent = Math.min(
		100,
		Math.max(0, Math.round(continueLearning?.progress_percentage ?? 0))
	);
	const recentQuizAttempts = overview?.recent_quiz_attempts ?? [];
	const recentNotes = overview?.recent_notes ?? [];

	const rhythmDays = buildFourteenDayRhythm(overview?.study_activity, now);
	const activeDays = rhythmDays.filter((d) => d.count > 0).length;
	const totalReviewed = rhythmDays.reduce((sum, d) => sum + d.count, 0);
	const maxDayCount = rhythmDays.reduce((max, d) => Math.max(max, d.count), 0);

	const greetingSubtitle =
		cardsDue > 0
			? t("studySpace.subtitleDue", { count: cardsDue })
			: continueLearning
				? t("studySpace.subtitleCourse")
				: t("studySpace.subtitleFresh");

	const firstSteps = [
		{
			step: "01",
			title: t("studySpace.stepCourseTitle"),
			hint: t("studySpace.stepCourseHint"),
			href: routes.d.courses.page(),
			icon: GraduationCap,
			tint: "bg-[#725bff]/10 text-[#6248f5] dark:bg-[#725bff]/20 dark:text-[#b4a8ff]",
		},
		{
			step: "02",
			title: t("studySpace.stepCardsTitle"),
			hint: t("studySpace.stepCardsHint"),
			href: routes.d.decks.page(),
			icon: Layers,
			tint: "bg-[#36c6ab]/14 text-[#16856f] dark:bg-[#36c6ab]/20 dark:text-[#6ee7cf]",
		},
		{
			step: "03",
			title: t("studySpace.stepTestTitle"),
			hint: t("studySpace.stepTestHint"),
			href: "/d/tests/kankor",
			icon: Compass,
			tint: "bg-amber-500/12 text-amber-700 dark:bg-amber-400/18 dark:text-amber-300",
		},
	];

	const shelfItems = [
		{
			title: t("studySpace.shelfCourses"),
			meta:
				enrolledCount > 0
					? t("studySpace.shelfCoursesCount", { count: enrolledCount })
					: t("studySpace.shelfCoursesEmpty"),
			href:
				enrolledCount > 0 ? routes.d.myCourses.page() : routes.d.courses.page(),
			icon: BookOpen,
			accent: "text-[#6248f5] dark:text-[#a89bff]",
		},
		{
			title: t("studySpace.shelfPractice"),
			meta:
				testsCompleted > 0
					? t("studySpace.shelfPracticeCount", {
							passed: numberFormat.format(testsPassed),
							total: numberFormat.format(testsCompleted),
						})
					: t("studySpace.shelfPracticeEmpty"),
			href: "/d/tests/quiz",
			icon: Compass,
			accent: "text-[#16856f] dark:text-[#5eead4]",
		},
		{
			title: t("studySpace.shelfLibrary"),
			meta: t("studySpace.shelfLibraryHint"),
			href: routes.d.library.page(),
			icon: Library,
			accent: "text-amber-700 dark:text-amber-300",
		},
		{
			title: t("studySpace.shelfBookmarks"),
			meta:
				bookmarksCount > 0
					? t("studySpace.shelfBookmarksCount", {
							count: numberFormat.format(bookmarksCount),
						})
					: t("studySpace.shelfBookmarksEmpty"),
			href: routes.d.bookmarks.page(),
			icon: Bookmark,
			accent: "text-rose-600 dark:text-rose-400",
		},
		{
			title: t("studySpace.shelfWallet"),
			meta:
				creditBalance > 0
					? t("studySpace.shelfWalletCount", {
							count: numberFormat.format(creditBalance),
						})
					: t("studySpace.shelfWalletEmpty"),
			href: routes.d.wallet.page(),
			icon: Wallet,
			accent: "text-sky-700 dark:text-sky-300",
		},
	];

	return (
		<div className="relative flex-1 overflow-hidden bg-[#faf8f4] dark:bg-background">
			{/* Soft morning ambient wash */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_65%_75%_at_20%_0%,rgba(114,91,255,0.09),transparent_70%),radial-gradient(ellipse_55%_65%_at_85%_5%,rgba(54,198,171,0.10),transparent_70%)] dark:bg-[radial-gradient(ellipse_65%_75%_at_20%_0%,rgba(114,91,255,0.14),transparent_70%),radial-gradient(ellipse_55%_65%_at_85%_5%,rgba(54,198,171,0.10),transparent_70%)]"
			/>

			<div className="relative mx-auto flex w-full max-w-5xl flex-col gap-10 px-5 py-8 sm:px-8 sm:py-11">
				{/* ── 1. Warm greeting & tear-off Kankor calendar leaf ─────────────── */}
				<header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
					<div className="max-w-xl space-y-2.5">
						<p className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
							<span>{fullDateFormat.format(now)}</span>
							<span
								aria-hidden="true"
								className="size-1 rounded-full bg-primary/45"
							/>
							<span className="text-primary/85 dark:text-primary">
								{t("studySpace.eyebrow")}
							</span>
						</p>
						<h1 className="text-3xl font-black tracking-tight text-foreground sm:text-[2.25rem] sm:leading-[1.2]">
							{firstName
								? t("studySpace.greetingNamed", { name: firstName })
								: t("studySpace.greetingDefault")}
						</h1>
						<p className="text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
							{greetingSubtitle}
						</p>
					</div>

					{/* Tactile Kankor calendar leaf */}
					<Link
						href="/d/tests/kankor"
						className="group relative flex shrink-0 items-center gap-4 self-start overflow-hidden rounded-2xl border border-stone-200/90 bg-white/90 px-4 py-3.5 shadow-[0_10px_28px_-18px_rgba(24,24,48,0.22)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_16px_34px_-18px_rgba(114,91,255,0.28)] md:self-auto dark:border-border/80 dark:bg-card/85"
					>
						<span
							aria-hidden="true"
							className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#725bff] via-[#5e8ef7] to-[#36c6ab]"
						/>
						<div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
							<Calendar className="size-5" />
						</div>
						<div className="min-w-0">
							<p className="text-[11px] font-medium text-muted-foreground">
								{t("studySpace.kankorLabel")}
							</p>
							<p className="mt-0.5 text-lg font-extrabold tracking-tight text-foreground tabular-nums">
								{t("studySpace.kankorDays", {
									count: numberFormat.format(daysLeft),
								})}
							</p>
							<span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
								{t("studySpace.kankorAction")}
								<ArrowRight className="size-3 transition-transform duration-200 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
							</span>
						</div>
					</Link>
				</header>

				{/* ── 2. The Study Desk: open book + stacked memory card box ───────── */}
				<section className="grid gap-6 lg:grid-cols-12 lg:items-stretch">
					{/* Open book / primary focus */}
					<div className="relative flex flex-col justify-between overflow-hidden rounded-[1.75rem] border border-stone-200/90 bg-white p-6 shadow-[0_20px_48px_-30px_rgba(23,23,46,0.2)] sm:p-8 lg:col-span-7 dark:border-border/80 dark:bg-card">
						{/* Physical tucked bookmark ribbon */}
						<div
							aria-hidden="true"
							className="pointer-events-none absolute end-7 top-0 h-11 w-6 rounded-b-md bg-gradient-to-b from-[#725bff] to-[#5d46e8] opacity-90 shadow-sm"
							style={{
								clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 76%, 0 100%)",
							}}
						/>

						{continueLearning ? (
							<>
								<div className="space-y-4 pe-10">
									<span className="inline-flex items-center gap-2 text-xs font-semibold text-primary">
										<BookOpen className="size-4" />
										{t("studySpace.currentBookLabel")}
									</span>
									<h2 className="text-xl font-extrabold leading-snug tracking-tight text-foreground sm:text-2xl">
										{continueLearning.course_title}
									</h2>
								</div>

								<div className="mt-8 space-y-6">
									<div className="space-y-2.5">
										<div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
											<span>
												{t("studySpace.progressCaption", {
													percent: numberFormat.format(progressPercent),
												})}
											</span>
											<span className="font-bold text-foreground tabular-nums">
												{numberFormat.format(progressPercent)}%
											</span>
										</div>
										<div
											role="progressbar"
											aria-valuenow={progressPercent}
											aria-valuemin={0}
											aria-valuemax={100}
											aria-label={continueLearning.course_title}
											className="h-2.5 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-muted"
										>
											<div
												className="h-full rounded-full bg-gradient-to-r from-[#725bff] to-[#36c6ab] transition-all duration-500"
												style={{ width: `${progressPercent}%` }}
											/>
										</div>
									</div>

									<div className="flex flex-wrap items-center gap-3 pt-1">
										<Button
											asChild
											className="rounded-full bg-[#725bff] px-6 text-white shadow-md shadow-[#725bff]/25 hover:bg-[#6248f5]"
										>
											<Link
												href={routes.d.myCourses.slug.page({
													slug: continueLearning.course_slug,
												})}
											>
												<Play className="size-4 fill-current" />
												{t("studySpace.resumeReading")}
											</Link>
										</Button>

										<Link
											href={
												enrolledCount > 0
													? routes.d.myCourses.page()
													: routes.d.courses.page()
											}
											className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-stone-100 hover:text-foreground dark:hover:bg-muted"
										>
											{enrolledCount > 0
												? t("studySpace.seeMyCourses", {
														count: numberFormat.format(enrolledCount),
													})
												: t("studySpace.seeAllCourses")}
											<ArrowRight className="size-3.5 rtl:rotate-180" />
										</Link>
									</div>
								</div>
							</>
						) : (
							<div className="flex h-full flex-col justify-between gap-6">
								<div className="space-y-2 pe-10">
									<span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
										<Sparkles className="size-3.5" />
										{t("studySpace.firstStepsLabel")}
									</span>
									<h2 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
										{t("studySpace.firstStepsTitle")}
									</h2>
									<p className="text-sm leading-relaxed text-muted-foreground">
										{t("studySpace.firstStepsCopy")}
									</p>
								</div>

								<div className="divide-y divide-stone-200/75 dark:divide-border/70">
									{firstSteps.map((item) => {
										const Icon = item.icon;
										return (
											<Link
												key={item.step}
												href={item.href}
												className="group flex items-center gap-3.5 py-3.5 first:pt-1 last:pb-0"
											>
												<span
													className={cn(
														"flex size-10 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105",
														item.tint
													)}
												>
													<Icon className="size-5" />
												</span>
												<div className="min-w-0 flex-1">
													<p className="text-sm font-bold text-foreground transition-colors group-hover:text-primary">
														{item.title}
													</p>
													<p className="mt-0.5 text-xs text-muted-foreground">
														{item.hint}
													</p>
												</div>
												<ArrowRight className="size-4 shrink-0 text-muted-foreground/60 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
											</Link>
										);
									})}
								</div>
							</div>
						)}
					</div>

					{/* Stacked index-card box + 14-day study rhythm */}
					<div className="relative lg:col-span-5">
						{/* Subtle stacked index-card edge underneath */}
						<div
							aria-hidden="true"
							className="pointer-events-none absolute inset-x-3 -bottom-2 top-3 rounded-[1.75rem] border border-stone-200/75 bg-stone-100/80 dark:border-border/50 dark:bg-muted/35"
						/>

						<div className="relative flex h-full flex-col justify-between rounded-[1.75rem] border border-stone-200/90 bg-[#fffdf9] p-6 shadow-[0_18px_44px_-30px_rgba(23,23,46,0.18)] sm:p-7 dark:border-border/80 dark:bg-card">
							<div className="space-y-3.5">
								<span className="inline-flex items-center gap-2 text-xs font-semibold text-[#16856f] dark:text-[#5eead4]">
									<Layers className="size-4" />
									{t("studySpace.memoryLabel")}
								</span>

								<h2 className="text-lg font-extrabold tracking-tight text-foreground sm:text-xl">
									{cardsDue > 0
										? t("studySpace.dueTitle", { count: cardsDue })
										: t("studySpace.caughtUpTitle")}
								</h2>

								<p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
									{cardsDue > 0
										? t("studySpace.dueBody")
										: t("studySpace.caughtUpBody")}
								</p>

								<div className="flex flex-wrap items-center gap-2.5 pt-1">
									<Button
										asChild
										size="sm"
										className="rounded-full bg-[#198f78] px-5 text-white hover:bg-[#147965] dark:bg-[#36c6ab] dark:text-slate-950 dark:hover:bg-[#4cd3b9]"
									>
										<Link href={routes.d.decks.practice.page()}>
											{t("studySpace.startReview")}
										</Link>
									</Button>
									<Button
										asChild
										size="sm"
										variant="ghost"
										className="rounded-full text-xs text-muted-foreground hover:text-foreground"
									>
										<Link href={routes.d.decks.page()}>
											{t("studySpace.exploreDecks")}
										</Link>
									</Button>
								</div>
							</div>

							{/* Perforated divider + 14-day pebble rhythm */}
							<div className="mt-6 border-t border-dashed border-stone-200 pt-5 dark:border-border/75">
								<div className="flex items-center justify-between gap-2 text-[11px] font-medium text-muted-foreground">
									<span>{t("studySpace.rhythmLabel")}</span>
									<span>
										{activeDays > 0
											? t("studySpace.rhythmActive", {
													days: activeDays,
													cards: numberFormat.format(totalReviewed),
												})
											: null}
									</span>
								</div>

								<ul
									aria-label={t("studySpace.rhythmLabel")}
									className="mt-3 grid grid-cols-7 gap-2"
								>
									{rhythmDays.map((day) => {
										const label = t("studySpace.rhythmDayTooltip", {
											date: shortDateFormat.format(day.date),
											count: day.count,
										});
										return (
											<li
												key={day.key}
												title={label}
												aria-label={label}
												className={cn(
													"h-6 rounded-lg transition-transform duration-150 hover:scale-105",
													stoneToneClass(day.count, maxDayCount, day.isToday)
												)}
											/>
										);
									})}
								</ul>

								<div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground/80">
									{activeDays > 0 ? (
										<>
											<span>{t("studySpace.rhythmEarlier")}</span>
											<span className="font-semibold text-foreground/80">
												{t("studySpace.rhythmToday")}
											</span>
										</>
									) : (
										<span>{t("studySpace.rhythmEmpty")}</span>
									)}
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* ── 3. Quiet Study Shelf (bookmarks, zero KPI boxes) ─────────────── */}
				<section aria-label={t("studySpace.shelfLabel")} className="space-y-4">
					<div className="flex items-center gap-3">
						<h2 className="text-xs font-semibold text-muted-foreground">
							{t("studySpace.shelfLabel")}
						</h2>
						<div
							aria-hidden="true"
							className="h-px flex-1 bg-stone-200/80 dark:bg-border/70"
						/>
					</div>

					<div className="flex flex-wrap gap-2.5">
						{shelfItems.map((item) => {
							const Icon = item.icon;
							return (
								<Link
									key={item.title}
									href={item.href}
									className="group inline-flex min-w-[10.5rem] flex-1 items-center gap-3 rounded-2xl border border-stone-200/80 bg-white/80 px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white hover:shadow-sm dark:border-border/70 dark:bg-card/65 dark:hover:bg-card"
								>
									<Icon
										className={cn(
											"size-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
											item.accent
										)}
									/>
									<span className="min-w-0">
										<span className="block truncate text-sm font-bold text-foreground">
											{item.title}
										</span>
										<span className="block truncate text-[11px] text-muted-foreground">
											{item.meta}
										</span>
									</span>
								</Link>
							);
						})}
					</div>
				</section>

				{/* ── 4. Two-page Journal Spread: Notebook & Practice Reflections ──── */}
				<section className="grid gap-6 lg:grid-cols-2">
					{/* Lined notebook page */}
					<div className="relative flex flex-col overflow-hidden rounded-[1.75rem] border border-stone-200/90 bg-[#fffef9] p-6 sm:p-7 dark:border-border/80 dark:bg-card">
						<div className="flex items-center justify-between gap-3">
							<div className="flex items-center gap-2.5">
								<Feather className="size-4 text-primary" />
								<h2 className="text-base font-extrabold text-foreground">
									{t("studySpace.notebookTitle")}
								</h2>
								{notesCount > 0 ? (
									<span className="text-xs text-muted-foreground">
										· {t("studySpace.notebookCount", { count: notesCount })}
									</span>
								) : null}
							</div>

							<Link
								href="/d/notes"
								className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
							>
								<Plus className="size-3.5" />
								{recentNotes.length > 0
									? t("studySpace.openNotebook")
									: t("studySpace.writeNote")}
							</Link>
						</div>

						<div className="mt-5 flex-1 border-s-2 border-rose-300/45 ps-4 dark:border-primary/25">
							{recentNotes.length === 0 ? (
								<div className="flex h-full flex-col justify-center gap-2 py-6">
									<p className="text-sm font-bold text-foreground">
										{t("studySpace.notebookEmptyTitle")}
									</p>
									<p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
										{t("studySpace.notebookEmptyCopy")}
									</p>
									<div className="pt-2">
										<Link
											href="/d/notes"
											className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
										>
											{t("studySpace.writeNote")}
											<ArrowRight className="size-3.5 rtl:rotate-180" />
										</Link>
									</div>
								</div>
							) : (
								<ul className="divide-y divide-dashed divide-stone-200/90 dark:divide-border/70">
									{recentNotes.map((note) => {
										const parsedDate = new Date(note.created_at);
										const formattedDate = Number.isNaN(parsedDate.getTime())
											? ""
											: shortDateFormat.format(parsedDate);
										return (
											<li key={note.id}>
												<Link
													href="/d/notes"
													className="group flex items-baseline justify-between gap-3 py-3 transition-colors first:pt-1 last:pb-1"
												>
													<span className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
														{note.title?.trim() || t("studySpace.untitledNote")}
													</span>
													<span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
														{formattedDate}
													</span>
												</Link>
											</li>
										);
									})}
								</ul>
							)}
						</div>
					</div>

					{/* Practice reflection log */}
					<div className="flex flex-col rounded-[1.75rem] border border-stone-200/90 bg-white p-6 sm:p-7 dark:border-border/80 dark:bg-card">
						<div className="flex items-center justify-between gap-3">
							<h2 className="text-base font-extrabold text-foreground">
								{t("studySpace.reflectionsTitle")}
							</h2>

							<Link
								href="/d/tests/quiz"
								className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-stone-100 hover:text-foreground dark:hover:bg-muted"
							>
								{t("studySpace.exploreQuizzes")}
								<ArrowRight className="size-3.5 rtl:rotate-180" />
							</Link>
						</div>

						<div className="mt-5 flex-1">
							{recentQuizAttempts.length === 0 ? (
								<div className="flex h-full flex-col justify-center gap-2 rounded-2xl bg-stone-50/90 p-5 dark:bg-muted/35">
									<p className="text-sm font-bold text-foreground">
										{t("studySpace.reflectionsEmptyTitle")}
									</p>
									<p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
										{t("studySpace.reflectionsEmptyCopy")}
									</p>
									<div className="pt-2">
										<Link
											href="/d/tests/quiz"
											className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
										>
											{t("studySpace.startFirstQuiz")}
											<ArrowRight className="size-3.5 rtl:rotate-180" />
										</Link>
									</div>
								</div>
							) : (
								<ul className="divide-y divide-stone-100 dark:divide-border/65">
									{recentQuizAttempts.map((quiz) => {
										const parsedDate = new Date(quiz.completed_at);
										const formattedDate = Number.isNaN(parsedDate.getTime())
											? ""
											: shortDateFormat.format(parsedDate);
										const score = quiz.score ?? 0;
										const maxScore = quiz.max_score_possible ?? 0;
										return (
											<li
												key={quiz.id}
												className="flex items-center gap-3.5 py-3 first:pt-1 last:pb-1"
											>
												<span
													className={cn(
														"flex size-8 shrink-0 items-center justify-center rounded-full",
														quiz.passed
															? "bg-[#36c6ab]/15 text-[#16856f] dark:bg-[#36c6ab]/20 dark:text-[#5eead4]"
															: "bg-amber-500/12 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300"
													)}
												>
													{quiz.passed ? (
														<CheckCircle2 className="size-4" />
													) : (
														<RotateCcw className="size-3.5" />
													)}
												</span>

												<div className="min-w-0 flex-1">
													<p className="truncate text-sm font-semibold text-foreground">
														{quiz.quiz_title}
													</p>
													<p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
														{maxScore > 0
															? `${numberFormat.format(score)} / ${numberFormat.format(maxScore)}`
															: numberFormat.format(score)}
														{formattedDate ? ` · ${formattedDate}` : ""}
													</p>
												</div>

												<span
													className={cn(
														"shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
														quiz.passed
															? "bg-[#36c6ab]/12 text-[#16856f] dark:bg-[#36c6ab]/18 dark:text-[#6ee7cf]"
															: "bg-amber-500/10 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300"
													)}
												>
													{quiz.passed
														? t("passed")
														: t("studySpace.needsReview")}
												</span>
											</li>
										);
									})}
								</ul>
							)}
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}

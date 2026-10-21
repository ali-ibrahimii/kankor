"use client";

import {
	Award,
	BookOpen,
	Code2,
	Compass,
	Cpu,
	HeartHandshake,
	KeyRound,
	Laptop,
	Layers,
	Radio,
	RotateCcw,
	Search,
	Server,
	SlidersHorizontal,
	Sparkles,
	Users,
	X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

import {
	HubSkillCourseCard,
	HubTechCourseCard,
	LearningPathCard,
	LiveClassPhotoCard,
} from "./school-hub-cards";
import type {
	HubCourseItem,
	HubTrackId,
	OrganizerKind,
	SchoolHubData,
} from "./school-hub-data";

type ActiveTab = "all" | "live" | HubTrackId;
type LevelFilter = "all" | "beginner" | "intermediate" | "advanced";
type SortOption = "recommended" | "popular" | "rating";

export function SchoolHubView({
	data,
	initialQuery = "",
}: {
	data: SchoolHubData;
	initialQuery?: string;
}) {
	const t = useTranslations("schoolHub");

	const [search, setSearch] = useState(initialQuery);
	const [activeTab, setActiveTab] = useState<ActiveTab>("all");
	const [organizerFilter, setOrganizerFilter] = useState<"all" | OrganizerKind>(
		"all"
	);
	const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
	const [onlyFree, setOnlyFree] = useState(false);
	const [sortBy, setSortBy] = useState<SortOption>("recommended");
	const [joinCodeOpen, setJoinCodeOpen] = useState(false);
	const [inviteCode, setInviteCode] = useState("");

	const spotlightSession = data.liveSessions[0];

	const normalizedQuery = search.trim().toLowerCase();

	const filteredLiveSessions = useMemo(() => {
		return data.liveSessions.filter((session) => {
			if (
				activeTab !== "all" &&
				activeTab !== "live" &&
				session.track !== activeTab
			) {
				return false;
			}
			if (
				organizerFilter !== "all" &&
				session.organizerKind !== organizerFilter
			) {
				return false;
			}
			if (onlyFree && !session.isFree) {
				return false;
			}
			if (!normalizedQuery) return true;
			const haystack =
				`${session.title} ${session.topic} ${session.organizerName} ${session.teacherName} ${session.joinCode}`.toLowerCase();
			return haystack.includes(normalizedQuery);
		});
	}, [
		data.liveSessions,
		activeTab,
		organizerFilter,
		onlyFree,
		normalizedQuery,
	]);

	const filteredCourses = useMemo(() => {
		const list = data.courses.filter((course) => {
			if (activeTab === "live") return false;
			if (activeTab !== "all" && course.track !== activeTab) return false;
			if (
				levelFilter !== "all" &&
				course.level !== levelFilter &&
				course.level !== "all_levels"
			) {
				return false;
			}
			if (onlyFree && !course.isFree) return false;
			if (!normalizedQuery) return true;
			const haystack =
				`${course.title} ${course.subtitle} ${course.categoryLabel} ${course.instructorName} ${course.tags.join(" ")}`.toLowerCase();
			return haystack.includes(normalizedQuery);
		});

		if (sortBy === "popular") {
			return [...list].sort((a, b) => b.votes - a.votes);
		}
		if (sortBy === "rating") {
			return [...list].sort((a, b) => b.rating - a.rating || b.votes - a.votes);
		}
		return list;
	}, [data.courses, activeTab, levelFilter, onlyFree, normalizedQuery, sortBy]);

	const coursesByTrack = useMemo(() => {
		const map: Record<HubTrackId, HubCourseItem[]> = {
			frontend: [],
			backend: [],
			languages: [],
			technical: [],
			life: [],
			school: [],
		};
		for (const c of filteredCourses) {
			map[c.track].push(c);
		}
		return map;
	}, [filteredCourses]);

	const totalResults = filteredLiveSessions.length + filteredCourses.length;
	const hasAnyFilter =
		normalizedQuery.length > 0 ||
		activeTab !== "all" ||
		organizerFilter !== "all" ||
		levelFilter !== "all" ||
		onlyFree;

	const resetAll = () => {
		setSearch("");
		setActiveTab("all");
		setOrganizerFilter("all");
		setLevelFilter("all");
		setOnlyFree(false);
		setSortBy("recommended");
	};

	const trackTabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
		{ id: "all", label: t("tabAll"), icon: <Layers className="size-3.5" /> },
		{
			id: "live",
			label: t("tabLive"),
			icon: <Radio className="size-3.5 text-rose-500" />,
		},
		{
			id: "frontend",
			label: t("tabFrontend"),
			icon: <Laptop className="size-3.5" />,
		},
		{
			id: "backend",
			label: t("tabBackend"),
			icon: <Server className="size-3.5" />,
		},
		{
			id: "languages",
			label: t("tabLanguages"),
			icon: <Code2 className="size-3.5" />,
		},
		{
			id: "technical",
			label: t("tabTechnical"),
			icon: <Cpu className="size-3.5" />,
		},
		{
			id: "life",
			label: t("tabLife"),
			icon: <HeartHandshake className="size-3.5" />,
		},
		{
			id: "school",
			label: t("tabSchool"),
			icon: <BookOpen className="size-3.5" />,
		},
	];

	const courseSections: {
		id: HubTrackId;
		badge: string;
		title: string;
		subtitle: string;
		variant: "tech" | "skill";
		surfaceClass: string;
	}[] = [
		{
			id: "frontend",
			badge: t("frontendBadge"),
			title: t("frontendTitle"),
			subtitle: t("frontendSubtitle"),
			variant: "tech",
			surfaceClass: "bg-background",
		},
		{
			id: "backend",
			badge: t("backendBadge"),
			title: t("backendTitle"),
			subtitle: t("backendSubtitle"),
			variant: "tech",
			surfaceClass: "bg-muted/25 border-y border-border/55",
		},
		{
			id: "languages",
			badge: t("languagesBadge"),
			title: t("languagesTitle"),
			subtitle: t("languagesSubtitle"),
			variant: "tech",
			surfaceClass: "bg-background",
		},
		{
			id: "technical",
			badge: t("technicalBadge"),
			title: t("technicalTitle"),
			subtitle: t("technicalSubtitle"),
			variant: "skill",
			surfaceClass: "bg-muted/25 border-y border-border/55",
		},
		{
			id: "life",
			badge: t("lifeBadge"),
			title: t("lifeTitle"),
			subtitle: t("lifeSubtitle"),
			variant: "skill",
			surfaceClass: "bg-background",
		},
		{
			id: "school",
			badge: t("schoolBadge"),
			title: t("schoolTitle"),
			subtitle: t("schoolSubtitle"),
			variant: "skill",
			surfaceClass: "bg-muted/25 border-t border-border/55",
		},
	];

	return (
		<div className="flex flex-col">
			{/* ════════════════════════════════════════════════════════════════
			    SINGLE UNIFIED HERO (Replaces the broken double-hero layout)
			   ════════════════════════════════════════════════════════════════ */}
			<section className="relative overflow-hidden border-b border-border/65 bg-gradient-to-b from-primary/[0.06] via-background to-background py-10 sm:py-14">
				<div
					aria-hidden="true"
					className="pointer-events-none absolute -top-28 start-1/3 h-80 w-80 rounded-full bg-primary/10 blur-3xl"
				/>
				<div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="grid items-center gap-8 lg:grid-cols-12">
						{/* Hero Main Copy + Search + Quick Actions */}
						<div className="space-y-5 lg:col-span-7">
							<span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/8 px-3.5 py-1 text-xs font-semibold text-primary">
								<Sparkles className="size-3.5" aria-hidden="true" />
								{t("heroBadge")}
							</span>

							<h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-4xl sm:leading-[1.2]">
								{t("heroTitle")}
							</h1>

							<p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
								{t("heroSubtitle")}
							</p>

							{/* Integrated Live Search Input */}
							<div className="relative max-w-2xl">
								<Search
									className="pointer-events-none absolute top-1/2 start-3.5 size-4 -translate-y-1/2 text-muted-foreground"
									aria-hidden="true"
								/>
								<Input
									type="search"
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									placeholder={t("searchPlaceholder")}
									className="h-12 rounded-2xl border-border/80 bg-background ps-10 pe-20 text-sm shadow-xs"
								/>
								{search && (
									<button
										type="button"
										onClick={() => setSearch("")}
										className="absolute top-1/2 end-3 inline-flex -translate-y-1/2 items-center gap-1 rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted/80"
									>
										<X className="size-3" />
										{t("searchClear")}
									</button>
								)}
							</div>

							{/* Hero Quick Action Buttons */}
							<div className="flex flex-wrap items-center gap-3 pt-0.5">
								<Button
									type="button"
									size="default"
									className="rounded-xl bg-rose-600 text-white hover:bg-rose-700"
									onClick={() => {
										setActiveTab("all");
										document
											.getElementById("live-classes-section")
											?.scrollIntoView({ behavior: "smooth" });
									}}
								>
									<Radio className="size-4" aria-hidden="true" />
									{t("joinLiveBtn")}
								</Button>

								<Button
									type="button"
									variant="outline"
									size="default"
									className="rounded-xl"
									onClick={() => setJoinCodeOpen(true)}
								>
									<KeyRound className="size-4 text-primary" />
									{t("joinWithCodeBtn")}
								</Button>
							</div>

							{/* Compact Key Figures */}
							<dl className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
								<div className="rounded-xl border border-border/65 bg-card/85 px-3.5 py-2.5">
									<dd className="text-lg font-extrabold text-foreground tabular-nums">
										{data.liveSessions.length}+
									</dd>
									<dt className="text-[11px] text-muted-foreground">
										{t("statLiveLabel")}
									</dt>
								</div>
								<div className="rounded-xl border border-border/65 bg-card/85 px-3.5 py-2.5">
									<dd className="text-lg font-extrabold text-foreground tabular-nums">
										{data.courses.length}+
									</dd>
									<dt className="text-[11px] text-muted-foreground">
										{t("statCoursesLabel")}
									</dt>
								</div>
								<div className="rounded-xl border border-border/65 bg-card/85 px-3.5 py-2.5">
									<dd className="text-lg font-extrabold text-foreground tabular-nums">
										6
									</dd>
									<dt className="text-[11px] text-muted-foreground">
										{t("statTracksLabel")}
									</dt>
								</div>
								<div className="rounded-xl border border-border/65 bg-card/85 px-3.5 py-2.5">
									<dd className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
										100%
									</dd>
									<dt className="text-[11px] text-muted-foreground">
										{t("statFreeLabel")}
									</dt>
								</div>
							</dl>
						</div>

						{/* Hero End Column: Featured Live Classroom Photo Spotlight */}
						{spotlightSession && (
							<div className="lg:col-span-5">
								<div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-lg">
									<div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
										<Image
											src={spotlightSession.imageSrc}
											alt={spotlightSession.title}
											fill
											priority
											sizes="(max-width: 1024px) 100vw, 460px"
											className="object-cover"
										/>
										<div
											aria-hidden="true"
											className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/35"
										/>
										<span className="absolute top-3 start-3 inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
											<span className="size-2 animate-pulse rounded-full bg-white" />
											{t("spotlightLiveTag")}
										</span>
										<span className="absolute top-3 end-3 rounded-full bg-black/70 px-2.5 py-1 font-mono text-xs font-semibold text-white backdrop-blur-md">
											{t("classCodeLabel", {
												code: spotlightSession.joinCode,
											})}
										</span>
										<div className="absolute inset-x-3.5 bottom-3 text-white">
											<p className="text-xs font-medium text-white/85">
												{spotlightSession.organizerName}
											</p>
											<h2 className="mt-0.5 line-clamp-2 text-base font-bold leading-snug sm:text-lg">
												{spotlightSession.title}
											</h2>
										</div>
									</div>

									<div className="space-y-3 p-4">
										<div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
											<span className="font-semibold text-foreground">
												{spotlightSession.teacherName}
											</span>
											<span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
												<Users className="size-3.5" />
												{t("spotlightSeatText", {
													enrolled: spotlightSession.enrolledCount,
													capacity: spotlightSession.capacity,
												})}
											</span>
										</div>

										<Link
											href={spotlightSession.href}
											className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
										>
											<Radio className="size-4" />
											{t("spotlightEnterBtn")}
										</Link>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</section>

			{/* ════════════════════════════════════════════════════════════════
			    STICKY MULTI-DOMAIN FILTER & SORT CONTROL BAR
			   ════════════════════════════════════════════════════════════════ */}
			<div className="sticky top-16 z-30 border-b border-border/70 bg-background/92 backdrop-blur-md">
				<div className="mx-auto max-w-7xl space-y-2.5 px-4 py-3 sm:px-6 lg:px-8">
					{/* Category Tabs */}
					<div
						role="tablist"
						aria-label={t("tabsLabel")}
						className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
					>
						{trackTabs.map((tab) => {
							const active = activeTab === tab.id;
							return (
								<button
									key={tab.id}
									type="button"
									role="tab"
									aria-selected={active}
									onClick={() => setActiveTab(tab.id)}
									className={cn(
										"inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all",
										active
											? "bg-primary text-primary-foreground shadow-xs"
											: "border border-border/75 bg-card text-foreground/80 hover:border-primary/40 hover:text-foreground"
									)}
								>
									{tab.icon}
									{tab.label}
								</button>
							);
						})}
					</div>

					{/* Secondary Filter Row: Level, Free Toggle, Sort & Active Result Count */}
					<div className="flex flex-wrap items-center justify-between gap-2 text-xs">
						<div className="flex flex-wrap items-center gap-1.5">
							<SlidersHorizontal
								className="size-3.5 text-muted-foreground"
								aria-hidden="true"
							/>
							{(
								[
									["all", t("levelAll")],
									["beginner", t("levelBeginner")],
									["intermediate", t("levelIntermediate")],
									["advanced", t("levelAdvanced")],
								] as const
							).map(([id, label]) => (
								<button
									key={id}
									type="button"
									onClick={() => setLevelFilter(id)}
									className={cn(
										"rounded-lg px-2.5 py-1 font-medium transition-colors",
										levelFilter === id
											? "bg-secondary font-semibold text-foreground"
											: "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
									)}
								>
									{label}
								</button>
							))}

							<span className="mx-1 h-3.5 w-px bg-border" aria-hidden="true" />

							<button
								type="button"
								onClick={() => setOnlyFree((prev) => !prev)}
								className={cn(
									"rounded-lg border px-2.5 py-1 font-medium transition-colors",
									onlyFree
										? "border-emerald-600/50 bg-emerald-500/10 font-semibold text-emerald-700 dark:text-emerald-400"
										: "border-border/70 text-muted-foreground hover:text-foreground"
								)}
							>
								{t("onlyFreeLabel")}
							</button>
						</div>

						<div className="flex items-center gap-2">
							<span className="text-muted-foreground tabular-nums">
								{t("resultsCount", { count: totalResults })}
							</span>
							<select
								aria-label={t("sortRecommended")}
								value={sortBy}
								onChange={(e) => setSortBy(e.target.value as SortOption)}
								className="rounded-lg border border-border/75 bg-card px-2.5 py-1 text-xs font-medium text-foreground focus:outline-none"
							>
								<option value="recommended">{t("sortRecommended")}</option>
								<option value="popular">{t("sortPopular")}</option>
								<option value="rating">{t("sortRating")}</option>
							</select>
							{hasAnyFilter && (
								<button
									type="button"
									onClick={resetAll}
									className="inline-flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 font-medium text-foreground hover:bg-muted/80"
								>
									<RotateCcw className="size-3" />
									{t("searchClear")}
								</button>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Empty Search State */}
			{totalResults === 0 && (
				<section className="mx-auto max-w-xl px-4 py-16 text-center">
					<div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
						<Search className="size-5" />
					</div>
					<h2 className="text-lg font-bold text-foreground">
						{t("emptyTitle")}
					</h2>
					<p className="mt-1 text-sm text-muted-foreground">{t("emptyDesc")}</p>
					<Button type="button" onClick={resetAll} className="mt-5 rounded-xl">
						{t("resetFilters")}
					</Button>
				</section>
			)}

			{/* ════════════════════════════════════════════════════════════════
			    SECTION 1 — PHOTO-RICH LIVE ONLINE CLASSES
			    (Hosted by Universities, Schools, and Teachers)
			   ════════════════════════════════════════════════════════════════ */}
			{filteredLiveSessions.length > 0 && (
				<section
					id="live-classes-section"
					className="scroll-mt-32 border-b border-border/60 bg-gradient-to-b from-rose-500/[0.03] to-background py-12"
				>
					<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
						<div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
							<div>
								<span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-700 dark:text-rose-400">
									<Radio className="size-3.5" aria-hidden="true" />
									{t("liveBadge")}
								</span>
								<h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
									{t("liveTitle")}
								</h2>
								<p className="mt-1 max-w-2xl text-sm text-muted-foreground">
									{t("liveSubtitle")}
								</p>
							</div>

							{/* Host Institution Filter Pills */}
							<div className="flex flex-wrap items-center gap-1.5">
								{(
									[
										["all", t("hostAll")],
										["university", t("hostUniversity")],
										["school", t("hostSchool")],
										["teacher", t("hostTeacher")],
									] as const
								).map(([id, label]) => (
									<button
										key={id}
										type="button"
										onClick={() => setOrganizerFilter(id)}
										className={cn(
											"rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
											organizerFilter === id
												? "bg-foreground text-background"
												: "border border-border/75 bg-card text-muted-foreground hover:text-foreground"
										)}
									>
										{label}
									</button>
								))}
							</div>
						</div>

						<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
							{filteredLiveSessions.map((session) => (
								<LiveClassPhotoCard key={session.id} item={session} />
							))}
						</div>
					</div>
				</section>
			)}

			{/* ════════════════════════════════════════════════════════════════
			    SECTION 2 — GUIDED STEP-BY-STEP LEARNING PATHS
			   ════════════════════════════════════════════════════════════════ */}
			{activeTab === "all" && !normalizedQuery && (
				<section className="border-b border-border/60 bg-muted/20 py-11">
					<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
						<div className="mb-6">
							<span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
								<Compass className="size-3.5" aria-hidden="true" />
								{t("pathsBadge")}
							</span>
							<h2 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
								{t("pathsTitle")}
							</h2>
							<p className="mt-1 text-sm text-muted-foreground">
								{t("pathsSubtitle")}
							</p>
						</div>

						<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
							{data.learningPaths.map((path) => (
								<LearningPathCard
									key={path.id}
									path={path}
									onSelectTrack={() => setActiveTab(path.track)}
								/>
							))}
						</div>
					</div>
				</section>
			)}

			{/* ════════════════════════════════════════════════════════════════
			    SECTIONS 3–8 — ALL COURSE TRACKS
			    Front-end · Back-end · Programming Languages · Technical Skills
			    Life Skills · School Curriculum & Kankor
			   ════════════════════════════════════════════════════════════════ */}
			{courseSections.map((section) => {
				const items = coursesByTrack[section.id];
				if (items.length === 0) return null;

				return (
					<section
						key={section.id}
						id={`track-${section.id}`}
						className={cn("scroll-mt-32 py-11", section.surfaceClass)}
					>
						<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
							<div className="mb-6">
								<span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card px-3 py-1 text-xs font-semibold text-primary">
									{section.badge}
								</span>
								<h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
									{section.title}
								</h2>
								<p className="mt-1 max-w-2xl text-sm text-muted-foreground">
									{section.subtitle}
								</p>
							</div>

							<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
								{items.map((course) =>
									section.variant === "tech" ? (
										<HubTechCourseCard key={course.id} item={course} />
									) : (
										<HubSkillCourseCard key={course.id} item={course} />
									)
								)}
							</div>
						</div>
					</section>
				);
			})}

			{/* ════════════════════════════════════════════════════════════════
			    SECTION 9 — FOR TEACHERS, SCHOOLS & UNIVERSITIES + CERTIFICATE VERIFY
			   ════════════════════════════════════════════════════════════════ */}
			<section className="border-t border-border/65 bg-gradient-to-br from-primary/[0.07] via-background to-emerald-500/[0.06] py-12">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="flex flex-col items-start justify-between gap-6 rounded-3xl border border-border/80 bg-card p-6 shadow-sm sm:p-8 lg:flex-row lg:items-center">
						<div className="max-w-2xl space-y-2">
							<span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
								<Sparkles className="size-3.5" aria-hidden="true" />
								{t("hostCtaBadge")}
							</span>
							<h2 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
								{t("hostCtaTitle")}
							</h2>
							<p className="text-sm leading-relaxed text-muted-foreground">
								{t("hostCtaDesc")}
							</p>
						</div>

						<div className="flex flex-wrap items-center gap-3">
							<Button asChild size="lg" className="rounded-xl">
								<Link href={routes.auth.signup.page({ type: "teacher" })}>
									{t("hostCtaPrimary")}
								</Link>
							</Button>
							<Button
								asChild
								variant="outline"
								size="lg"
								className="rounded-xl"
							>
								<Link href={routes.verify.page()}>
									<Award className="size-4 text-primary" />
									{t("hostCtaSecondary")}
								</Link>
							</Button>
						</div>
					</div>
				</div>
			</section>

			{/* Join Classroom with Code Dialog */}
			<Dialog open={joinCodeOpen} onOpenChange={setJoinCodeOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>{t("joinDialogTitle")}</DialogTitle>
						<DialogDescription>{t("joinDialogDesc")}</DialogDescription>
					</DialogHeader>
					<div className="py-2">
						<Input
							value={inviteCode}
							onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
							placeholder={t("joinDialogPlaceholder")}
							className="h-11 text-center font-mono text-base tracking-widest uppercase"
						/>
					</div>
					<DialogFooter className="gap-2 sm:justify-end">
						<Button
							type="button"
							variant="outline"
							onClick={() => setJoinCodeOpen(false)}
						>
							{t("joinDialogCancel")}
						</Button>
						<Button asChild>
							<Link href={routes.d.classrooms.page()}>
								{t("joinDialogAction")}
							</Link>
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

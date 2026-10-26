"use client";

import {
	Award,
	BookOpen,
	Code2,
	Compass,
	Cpu,
	HeartHandshake,
	Laptop,
	Layers,
	RotateCcw,
	Search,
	Server,
	SlidersHorizontal,
	Sparkles,
	X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

import { FeaturedCoursesCarousel } from "./featured-courses-carousel";
import {
	HubSkillCourseCard,
	HubTechCourseCard,
	LearningPathCard,
} from "./school-hub-cards";
import type {
	HubCourseItem,
	HubTrackId,
	LearningPathItem,
	SchoolHubData,
} from "./school-hub-data";

type ActiveTab = "all" | HubTrackId;
type LevelFilter = "all" | "beginner" | "intermediate" | "advanced";
type SortOption = "recommended" | "popular" | "rating";

const PATH_COURSE_ORDER: Record<string, string[][]> = {
	"path-frontend": [
		["html", "css", "responsive"],
		["ui/ux", "figma", "design system"],
		["react", "next.js"],
		["testing", "performance", "pwa"],
	],
	"path-backend": [
		["linux", "git", "docker"],
		["node.js", "django", "fastapi", "python"],
		["postgres", "sql", "database", "دیتابیس"],
		["auth", "security", "امنیت"],
	],
	"path-programming": [
		["python", "پایتون"],
		["javascript", "typescript", "جاوااسکریپت"],
		["c++", "algorithm", "الگوریتم"],
		["flutter", "dart", "mobile"],
	],
	"path-career-life": [
		["ai", "هوش مصنوعی"],
		["excel", "اکسل"],
		["graphic", "figma", "گرافیک"],
		["freelanc", "فریلنس"],
		["time", "زمان"],
		["speaking", "فن بیان"],
		["financial", "finance", "سواد مالی"],
		["critical", "تفکر نقاد"],
	],
	"path-life-skills": [
		["time", "زمان"],
		["speaking", "فن بیان"],
		["financial", "finance", "سواد مالی"],
		["critical", "تفکر نقاد"],
	],
	"path-school-curriculum": [
		["math", "ریاضی"],
		["physics", "فزیک"],
		["chemistry", "کیمیا"],
		["biology", "بیولوژی"],
	],
};

function getCoursesForPath(
	path: LearningPathItem,
	courses: HubCourseItem[]
): HubCourseItem[] {
	const courseById = new Map(courses.map((course) => [course.id, course]));
	const orderedCourses = path.courseIds
		.map((courseId) => courseById.get(courseId))
		.filter((course): course is HubCourseItem => Boolean(course));

	if (orderedCourses.length === path.courseIds.length) return orderedCourses;

	const relevantTracks =
		path.id === "path-career-life"
			? new Set<HubTrackId>(["technical", "life"])
			: new Set<HubTrackId>([path.track]);
	const orderHints = PATH_COURSE_ORDER[path.id] ?? [];

	return courses
		.filter((course) => relevantTracks.has(course.track))
		.sort((a, b) => {
			const getRank = (course: HubCourseItem) => {
				const searchable =
					`${course.id} ${course.title} ${course.subtitle} ${course.categoryLabel} ${course.tags.join(" ")}`.toLowerCase();
				const rank = orderHints.findIndex((hints) =>
					hints.some((hint) => searchable.includes(hint.toLowerCase()))
				);
				return rank === -1 ? orderHints.length : rank;
			};
			return getRank(a) - getRank(b) || a.title.localeCompare(b.title);
		})
		.slice(0, path.coursesCount);
}
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
	const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
	const [onlyFree, setOnlyFree] = useState(false);
	const [sortBy, setSortBy] = useState<SortOption>("recommended");
	const [selectedPathId, setSelectedPathId] = useState<string | null>(null);

	const normalizedQuery = search.trim().toLowerCase();
	const featuredCourses = useMemo(() => {
		const curated = data.courses.filter((course) => course.isFeatured);
		if (curated.length > 0) return curated;
		return [...data.courses]
			.sort((a, b) => b.rating - a.rating || b.votes - a.votes)
			.slice(0, 6);
	}, [data.courses]);

	const filteredCourses = useMemo(() => {
		const list = data.courses.filter((course) => {
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
		for (const course of filteredCourses) {
			map[course.track].push(course);
		}
		return map;
	}, [filteredCourses]);

	const totalResults = filteredCourses.length;
	const hasAnyFilter =
		normalizedQuery.length > 0 ||
		activeTab !== "all" ||
		levelFilter !== "all" ||
		onlyFree;

	const selectedPath = data.learningPaths.find(
		(path) => path.id === selectedPathId
	);
	const selectedPathCourses = useMemo(
		() => (selectedPath ? getCoursesForPath(selectedPath, data.courses) : []),
		[selectedPath, data.courses]
	);

	useEffect(() => {
		if (!selectedPath) return;
		document
			.getElementById("path-course-sequence")
			?.scrollIntoView?.({ behavior: "smooth", block: "start" });
	}, [selectedPath]);

	const resetAll = () => {
		setSearch("");
		setActiveTab("all");
		setLevelFilter("all");
		setOnlyFree(false);
		setSortBy("recommended");
		setSelectedPathId(null);
	};

	const trackTabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
		{ id: "all", label: t("tabAll"), icon: <Layers className="size-3.5" /> },
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
			    HERO — dark panel with search, quick actions and featured course
			   ════════════════════════════════════════════════════════════════ */}
			<section className="px-4 pb-2 pt-4 sm:px-6 sm:pt-6 lg:px-8">
				<div className="relative isolate mx-auto max-w-[1320px] overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_8%_112%,rgba(94,207,173,.18),transparent_34%),radial-gradient(circle_at_92%_-8%,rgba(137,100,255,.34),transparent_40%),linear-gradient(125deg,#101a2c_4%,#17233a_58%,#222340_100%)] px-5 py-10 text-white shadow-[0_32px_74px_-42px_rgba(14,19,49,.65)] sm:rounded-[34px] sm:px-9 sm:py-12 lg:px-12">
					<div
						aria-hidden="true"
						className="pointer-events-none absolute inset-0 opacity-[.14] [background-image:radial-gradient(rgba(255,255,255,.6)_.7px,transparent_.7px)] [background-size:24px_24px]"
					/>

					<div className="relative z-10 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,.85fr)] lg:gap-12">
						<div>
							<span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.07] px-3.5 py-1.5 text-[11px] font-bold text-white/80 backdrop-blur-sm">
								<Sparkles
									className="size-3.5 text-[#b7f486]"
									aria-hidden="true"
								/>
								{t("heroBadge")}
							</span>

							<h1 className="mt-5 max-w-[560px] text-[1.9rem] font-black leading-[1.35] tracking-tight sm:text-[2.5rem] lg:text-[2.8rem]">
								{t("heroTitle")}
							</h1>

							<p className="mt-4 max-w-[520px] text-sm leading-7 text-white/60 sm:text-[15px]">
								{t("heroSubtitle")}
							</p>

							<div className="relative mt-7 max-w-[520px]">
								<Search
									className="pointer-events-none absolute top-1/2 start-4 size-4 -translate-y-1/2 text-white/40"
									aria-hidden="true"
								/>
								<Input
									type="search"
									value={search}
									onChange={(e) => {
										setSearch(e.target.value);
										if (e.target.value) setSelectedPathId(null);
									}}
									placeholder={t("searchPlaceholder")}
									className="h-12 rounded-2xl border-white/15 bg-white/[.07] ps-11 pe-24 text-sm text-white placeholder:text-white/40 focus-visible:border-[#b7f486]/50 focus-visible:ring-[#b7f486]/20"
								/>
								{search ? (
									<button
										type="button"
										onClick={() => setSearch("")}
										className="absolute top-1/2 end-2.5 inline-flex -translate-y-1/2 items-center gap-1 rounded-xl bg-white/10 px-2.5 py-1.5 text-[11px] font-bold text-white/80 transition hover:bg-white/20"
									>
										<X className="size-3" />
										{t("searchClear")}
									</button>
								) : null}
							</div>

							<div className="mt-4 flex flex-wrap items-center gap-2.5">
								<button
									type="button"
									onClick={() => {
										setActiveTab("all");
										setSearch("");
										setSelectedPathId(null);
										document
											.getElementById("course-catalog")
											?.scrollIntoView({ behavior: "smooth" });
									}}
									className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#b7f486] px-5 text-sm font-black text-[#17233a] shadow-lg shadow-black/20 transition hover:bg-[#c9f8a2]"
								>
									<BookOpen className="size-4" aria-hidden="true" />
									{t("browseCoursesBtn")}
								</button>

								<Link
									href={routes.auth.signup.page({ type: "instructor" })}
									className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/20 bg-white/[.07] px-5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/[.16]"
								>
									<Sparkles
										className="size-4 text-[#b7f486]"
										aria-hidden="true"
									/>
									{t("publishCourseBtn")}
								</Link>
							</div>

							<dl className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
								{[
									{
										value: featuredCourses.length,
										label: t("statFeaturedLabel"),
									},
									{ value: data.courses.length, label: t("statCoursesLabel") },
									{
										value: data.learningPaths.length,
										label: t("statTracksLabel"),
									},
									{
										value: data.courses.filter((course) => course.isFree)
											.length,
										label: t("statFreeLabel"),
										accent: true,
									},
								].map((stat) => (
									<div key={stat.label} className="flex items-baseline gap-2">
										<dd
											className={cn(
												"text-xl font-black tabular-nums",
												stat.accent ? "text-[#b7f486]" : "text-white"
											)}
										>
											{stat.value}
										</dd>
										<dt className="text-[11px] font-medium text-white/50">
											{stat.label}
										</dt>
									</div>
								))}
							</dl>
						</div>

						<div className="lg:justify-self-end">
							<FeaturedCoursesCarousel courses={featuredCourses} />
						</div>
					</div>
				</div>
			</section>

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
			    SECTION 2 — GUIDED STEP-BY-STEP LEARNING PATHS
			   ════════════════════════════════════════════════════════════════ */}
			{activeTab === "all" && !normalizedQuery && (
				<section
					id="course-catalog"
					className="scroll-mt-28 border-b border-border/60 bg-muted/20 py-11"
				>
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

						<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
							{data.learningPaths.map((path) => (
								<LearningPathCard
									key={path.id}
									path={path}
									selected={selectedPathId === path.id}
									onSelectPath={() =>
										setSelectedPathId((current) =>
											current === path.id ? null : path.id
										)
									}
								/>
							))}
						</div>

						{selectedPath && (
							<section
								id="path-course-sequence"
								aria-labelledby="path-course-sequence-title"
								className="mt-7 scroll-mt-28 rounded-3xl border border-border/70 bg-background p-4 shadow-sm sm:p-6"
							>
								<div className="mb-5 flex flex-wrap items-start justify-between gap-3">
									<div>
										<span className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
											<Compass className="size-3.5" aria-hidden="true" />
											{t("pathSequenceEyebrow")}
										</span>
										<h3
											id="path-course-sequence-title"
											className="mt-2 text-lg font-extrabold tracking-tight text-foreground"
										>
											{selectedPath.title}
										</h3>
										<p className="mt-1 max-w-2xl text-sm text-muted-foreground">
											{t("pathSequenceSubtitle")}
										</p>
									</div>
									<button
										type="button"
										onClick={() => setSelectedPathId(null)}
										className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-card px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
									>
										<X className="size-3.5" aria-hidden="true" />
										{t("pathCloseBtn")}
									</button>
								</div>
								<ol className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
									{selectedPathCourses.map((course, index) => {
										const courseSection = courseSections.find(
											(item) => item.id === course.track
										);
										return (
											<li key={course.id} className="min-w-0">
												<div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1 text-xs font-bold text-primary">
													<span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
														{index + 1}
													</span>
													{t("pathStepLabel", { number: index + 1 })}
												</div>
												{courseSection?.variant === "tech" ? (
													<HubTechCourseCard item={course} />
												) : (
													<HubSkillCourseCard item={course} />
												)}
											</li>
										);
									})}
								</ol>
							</section>
						)}
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
							<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
								<Link href={routes.auth.signup.page({ type: "instructor" })}>
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
		</div>
	);
}

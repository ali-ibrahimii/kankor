"use client";

import {
	ArrowLeft,
	ArrowRight,
	BookOpen,
	BookOpenCheck,
	GraduationCap,
	Layers3,
	LibraryBig,
	School,
	Sparkles,
	Users,
	Zap,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";

import { useQueryFilters } from "@/hooks/filter/filter.hooks";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

import type { CourseMeta } from "./course-card";
import { CatalogCourseCard } from "./course-card";
import { CourseFilters } from "./course-filters";

import {
	CourseGrid,
	CourseGridEmpty,
	CourseGridSkeleton,
	CoursePagination,
} from "./course-grid";

import {
	CourseSortSelect,
	sortToValue,
	valueToSort,
} from "./course-sort-select";

import { publishedCoursesQueryFn } from "./public-course-query";

// ============================================================
// TYPES
// ============================================================

type CourseWithGrade = CourseMeta & {
	grade_id?: string | null;
	grade?: {
		id: string;
		name: string;
	} | null;
};

type CatalogCategory = "all" | "school" | "skills";

type CourseGroup = {
	id: string;
	title: string;
	courses: CourseWithGrade[];
	type: "grade" | "skills";
};

// ============================================================
// STYLE
// ============================================================

const TAB_BASE =
	"inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-bold transition-all duration-200";

const TAB_ACTIVE = "bg-[#694bd2] text-white shadow-lg shadow-violet-500/20";

const TAB_INACTIVE =
	"bg-white text-slate-600 hover:bg-[#f1edff] hover:text-[#694bd2] dark:bg-white/5 dark:text-slate-300 dark:hover:bg-violet-500/15";

// ============================================================
// GROUP COURSES
// ============================================================

function groupCourses(courses: CourseWithGrade[]): CourseGroup[] {
	const gradeGroups = new Map<string, CourseGroup>();

	const skills: CourseWithGrade[] = [];

	for (const course of courses) {
		const gradeId = course.grade?.id ?? course.grade_id;

		if (!gradeId) {
			skills.push(course);
			continue;
		}

		const existing = gradeGroups.get(gradeId);

		if (existing) {
			existing.courses.push(course);
			continue;
		}

		gradeGroups.set(gradeId, {
			id: gradeId,
			title: course.grade?.name ?? gradeId,
			courses: [course],
			type: "grade",
		});
	}

	const groups = Array.from(gradeGroups.values());

	groups.sort((a, b) =>
		a.title.localeCompare(b.title, "fa", {
			numeric: true,
		})
	);

	if (skills.length > 0) {
		groups.push({
			id: "skills",
			title: "مهارت‌ها و آموزش‌های تخصصی",
			courses: skills,
			type: "skills",
		});
	}

	return groups;
}

// ============================================================
// CATEGORY TAB
// ============================================================

function CategoryTab({
	active,
	icon: Icon,
	label,
	count,
	onClick,
}: {
	active: boolean;
	icon: React.ElementType;
	label: string;
	count?: number;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-pressed={active}
			className={cn(TAB_BASE, active ? TAB_ACTIVE : TAB_INACTIVE)}
		>
			<Icon className="size-4" />

			<span>{label}</span>

			{count !== undefined && (
				<span
					className={cn(
						"rounded-lg px-2 py-0.5 text-[10px] font-extrabold",
						active
							? "bg-white/20 text-white"
							: "bg-[#f1edff] text-[#694bd2] dark:bg-white/10 dark:text-violet-300"
					)}
				>
					{count}
				</span>
			)}
		</button>
	);
}

// ============================================================
// GROUP HEADER
// ============================================================

function GroupHeader({ group }: { group: CourseGroup }) {
	const isSkills = group.type === "skills";

	return (
		<div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
			<div className="flex items-center gap-4">
				<div
					className={cn(
						"flex size-14 shrink-0 items-center justify-center rounded-[20px]",
						isSkills
							? "bg-[#e1f7eb] text-[#248565] dark:bg-emerald-500/10 dark:text-emerald-300"
							: "bg-[#eee8ff] text-[#694bd2] dark:bg-violet-500/10 dark:text-violet-300"
					)}
				>
					{isSkills ? (
						<Zap className="size-7" />
					) : (
						<GraduationCap className="size-7" />
					)}
				</div>

				<div>
					<div className="mb-1 flex items-center gap-2">
						<span
							className={cn(
								"size-2 rounded-full",
								isSkills ? "bg-emerald-500" : "bg-violet-500"
							)}
						/>

						<span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
							{isSkills ? "آموزش‌های تخصصی" : "دروس مکتب"}
						</span>
					</div>

					<h2 className="text-lg font-extrabold tracking-tight text-[#19243b] dark:text-slate-100 sm:text-xl">
						{group.title}
					</h2>

					<p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">
						{group.courses.length} کورس آموزشی
					</p>
				</div>
			</div>

			<div className="inline-flex self-start items-center gap-2 rounded-full border border-[#eceaf3] bg-white px-4 py-2 text-[11px] font-bold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
				<BookOpen className="size-3.5 text-[#694bd2]" />
				{group.courses.length} کورس
			</div>
		</div>
	);
}

// ============================================================
// COURSE GROUP SECTION
// ============================================================

function CourseGroupSection({ group }: { group: CourseGroup }) {
	return (
		<section className="relative">
			<GroupHeader group={group} />

			<CourseGrid>
				{group.courses.map((course) => (
					<CatalogCourseCard
						key={course.id}
						course={course}
						href={routes.courses.slug.page({
							slug: course.slug ?? course.id,
						})}
					/>
				))}
			</CourseGrid>
		</section>
	);
}

// ============================================================
// CATALOG HERO
// ============================================================

function CatalogHero({ total }: { total: number | null }) {
	return (
		<div className="relative isolate overflow-hidden rounded-[30px] bg-[radial-gradient(circle_at_90%_0%,rgba(137,100,255,.35),transparent_42%),radial-gradient(circle_at_5%_100%,rgba(94,207,173,.18),transparent_35%),linear-gradient(125deg,#101a2c,#192640_60%,#252541)] px-6 py-10 text-white shadow-[0_28px_65px_-40px_rgba(17,24,55,.65)] sm:px-10 sm:py-12 lg:px-14">
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 opacity-[.12] [background-image:radial-gradient(white_.7px,transparent_.7px)] [background-size:22px_22px]"
			/>

			<div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1fr_auto]">
				<div className="max-w-2xl">
					<span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-[11px] font-bold text-[#b7f486]">
						<Sparkles className="size-4" />
						کتابخانه آموزشی
					</span>

					<h1 className="mt-6 text-[2rem] font-extrabold leading-[1.5] tracking-tight sm:text-[2.7rem]">
						هر مهارتی که می‌خواهی،
						<br />
						<span className="bg-gradient-to-l from-[#b7f486] via-[#7ce5d1] to-[#b8a4ff] bg-clip-text text-transparent">
							از همین‌جا یاد بگیر
						</span>
					</h1>

					<p className="mt-4 max-w-xl text-sm leading-8 text-white/65">
						از درس‌های مکتب تا برنامه‌نویسی و مهارت‌های تخصصی؛ کورس مورد علاقه‌ات را
						پیدا کن و مسیر یادگیری خود را شروع کن.
					</p>

					<div className="mt-7 flex flex-wrap gap-3">
						<div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.07] px-4 py-2.5 text-xs font-bold">
							<BookOpenCheck className="size-4 text-[#b7f486]" />
							{total ?? "—"} کورس آموزشی
						</div>

						<div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.07] px-4 py-2.5 text-xs font-bold">
							<School className="size-4 text-[#b7f486]" />
							آموزش مکتب
						</div>

						<div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.07] px-4 py-2.5 text-xs font-bold">
							<Zap className="size-4 text-[#b7f486]" />
							مهارت‌های تخصصی
						</div>
					</div>
				</div>

				<div className="hidden lg:block">
					<div className="relative flex size-52 items-center justify-center">
						<div className="absolute inset-0 rounded-full border border-white/10" />

						<div className="absolute inset-6 rounded-full border border-white/10" />

						<div className="absolute inset-12 rounded-full bg-[#b7f486]/10 blur-xl" />

						<div className="relative flex size-28 items-center justify-center rounded-[35px] border border-white/15 bg-white/10 shadow-2xl backdrop-blur-md">
							<LibraryBig className="size-14 text-[#b7f486]" />
						</div>

						<span className="absolute -end-2 top-5 flex size-12 items-center justify-center rounded-2xl bg-[#b7f486] text-[#19243b] shadow-xl">
							<GraduationCap className="size-6" />
						</span>

						<span className="absolute -start-2 bottom-5 flex size-12 items-center justify-center rounded-2xl bg-[#a58cff] text-white shadow-xl">
							<Zap className="size-6" />
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}

// ============================================================
// PUBLIC COURSE CATALOG
// ============================================================

export function PublicCourseCatalog({
	initialData,
}: {
	initialData?: {
		data: CourseMeta[] | null;
		count: number | null;
	};
} = {}) {
	const t = useTranslations("courses");
	const locale = useLocale();

	const [category, setCategory] = React.useState<CatalogCategory>("all");

	const [selectedGroup, setSelectedGroup] = React.useState<string>("all");

	const coursesQuery = useQueryFilters<"courses", CourseMeta[]>({
		table: "courses",

		queryFn: publishedCoursesQueryFn,

		initialData,

		initialState: {
			name: "public-courses",

			sort: [
				{
					field: "created_at",
					direction: "desc",
				},
			],

			pagination: {
				page: 1,
				pageSize: 12,
			},
		},
	});

	const queryData = coursesQuery.data as
		| {
				data?: CourseMeta[] | null;
				count?: number | null;
		  }
		| undefined;

	const courses = React.useMemo(
		() => (queryData?.data ?? []) as CourseWithGrade[],
		[queryData?.data]
	);

	const total = queryData?.count ?? null;

	const page = coursesQuery.state.pagination?.page ?? 1;

	const pageSize = coursesQuery.state.pagination?.pageSize ?? 12;

	const sortValue = sortToValue(coursesQuery.state.sort);

	// ========================================================
	// GROUPING
	// ========================================================

	const groups = React.useMemo(() => groupCourses(courses), [courses]);

	const schoolGroups = React.useMemo(
		() => groups.filter((group) => group.type === "grade"),
		[groups]
	);

	const skillGroups = React.useMemo(
		() => groups.filter((group) => group.type === "skills"),
		[groups]
	);

	const schoolCount = schoolGroups.reduce(
		(sum, group) => sum + group.courses.length,
		0
	);

	const skillsCount = skillGroups.reduce(
		(sum, group) => sum + group.courses.length,
		0
	);

	// ========================================================
	// CATEGORY FILTER
	// ========================================================

	const categoryGroups = React.useMemo(() => {
		switch (category) {
			case "school":
				return schoolGroups;

			case "skills":
				return skillGroups;

			default:
				return groups;
		}
	}, [category, groups, schoolGroups, skillGroups]);

	const visibleGroups = React.useMemo(() => {
		if (selectedGroup === "all") {
			return categoryGroups;
		}

		return categoryGroups.filter((group) => group.id === selectedGroup);
	}, [categoryGroups, selectedGroup]);

	const visibleCourses = visibleGroups.reduce(
		(sum, group) => sum + group.courses.length,
		0
	);

	// ========================================================
	// EVENTS
	// ========================================================

	const handleCategoryChange = (nextCategory: CatalogCategory) => {
		setCategory(nextCategory);
		setSelectedGroup("all");
	};

	return (
		<div className="flex flex-col gap-8 pb-12">
			{/* HERO */}

			<CatalogHero total={total} />

			{/* FILTER CONTAINER */}

			<div className="rounded-[26px] border border-[#e9eaf2] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#1c263b] sm:p-6">
				<div className="mb-5 flex items-center gap-3">
					<div className="flex size-11 items-center justify-center rounded-2xl bg-[#eee8ff] text-[#694bd2] dark:bg-violet-500/10 dark:text-violet-300">
						<Layers3 className="size-5" />
					</div>

					<div>
						<h2 className="text-sm font-extrabold text-[#19243b] dark:text-slate-100">
							جستجو و کشف کورس‌ها
						</h2>

						<p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
							کورس مورد علاقه‌ات را با فیلترهای پیشرفته پیدا کن
						</p>
					</div>
				</div>

				<div className="flex flex-col gap-3 sm:flex-row sm:items-start">
					<CourseFilters
						className="flex-1"
						queryState={coursesQuery}
						options={{
							showLevel: true,
							showLanguage: true,
							showSubject: true,
							showGrade: true,
							showBook: true,
							showPricing: true,
						}}
					/>

					<CourseSortSelect
						value={sortValue}
						onChange={(value) =>
							coursesQuery.setState((prev) => ({
								...prev,
								sort: valueToSort(value),
							}))
						}
					/>
				</div>
			</div>

			{/* CATEGORY NAVIGATION */}

			<div className="space-y-5">
				<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
					<div>
						<span className="text-[11px] font-extrabold text-[#694bd2] dark:text-violet-300">
							دسته‌بندی آموزشی
						</span>

						<h2 className="mt-2 text-xl font-extrabold text-[#19243b] dark:text-slate-100 sm:text-2xl">
							چه چیزی می‌خواهی یاد بگیری؟
						</h2>

						<p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-400">
							از میان درس‌های مکتب و آموزش‌های تخصصی انتخاب کن.
						</p>
					</div>

					<div className="inline-flex self-start items-center gap-2 rounded-xl bg-[#f1edff] px-3 py-2 text-xs font-bold text-[#694bd2] dark:bg-violet-500/10 dark:text-violet-300">
						<BookOpen className="size-4" />
						{visibleCourses} کورس در این صفحه
					</div>
				</div>

				{/* MAIN CATEGORY TABS */}

				<div className="flex flex-wrap gap-2 rounded-[22px] border border-[#e9eaf2] bg-[#f8f8fc] p-2 dark:border-white/10 dark:bg-white/[.03]">
					<CategoryTab
						active={category === "all"}
						icon={LibraryBig}
						label="همه کورس‌ها"
						count={courses.length}
						onClick={() => handleCategoryChange("all")}
					/>

					<CategoryTab
						active={category === "school"}
						icon={School}
						label="درس‌های مکتب"
						count={schoolCount}
						onClick={() => handleCategoryChange("school")}
					/>

					<CategoryTab
						active={category === "skills"}
						icon={Zap}
						label="مهارت‌های تخصصی"
						count={skillsCount}
						onClick={() => handleCategoryChange("skills")}
					/>
				</div>

				{/* GRADE FILTER */}

				{category !== "skills" && schoolGroups.length > 0 && (
					<div className="flex flex-wrap items-center gap-2">
						<button
							type="button"
							onClick={() => setSelectedGroup("all")}
							className={cn(
								"rounded-xl border px-4 py-2.5 text-xs font-bold transition-all",
								selectedGroup === "all"
									? "border-[#694bd2] bg-[#694bd2] text-white"
									: "border-[#e9eaf2] bg-white text-slate-600 hover:border-violet-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
							)}
						>
							همه صنف‌ها
						</button>

						{schoolGroups.map((group) => (
							<button
								key={group.id}
								type="button"
								onClick={() => setSelectedGroup(group.id)}
								className={cn(
									"inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all",
									selectedGroup === group.id
										? "border-[#694bd2] bg-[#694bd2] text-white shadow-md shadow-violet-500/15"
										: "border-[#e9eaf2] bg-white text-slate-600 hover:border-violet-300 hover:text-[#694bd2] dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
								)}
							>
								<GraduationCap className="size-3.5" />

								{group.title}
							</button>
						))}
					</div>
				)}
			</div>

			{/* RESULTS */}

			<div
				className={cn(
					"space-y-12 transition-opacity duration-200",
					coursesQuery.isFetching && courses.length > 0 && "opacity-60"
				)}
			>
				{coursesQuery.isError ? (
					<CourseGridEmpty
						title={t("loadError")}
						description={t("loadErrorDescription")}
					/>
				) : coursesQuery.isFetching && courses.length === 0 ? (
					<CourseGridSkeleton count={pageSize} />
				) : courses.length === 0 ? (
					<CourseGridEmpty
						title={t("noCoursesFound")}
						description={t("noCoursesDescription")}
					/>
				) : visibleGroups.length === 0 ? (
					<CourseGridEmpty
						title="کورسی در این دسته پیدا نشد"
						description="دسته‌بندی دیگری را انتخاب کن یا فیلترهای جستجو را تغییر بده."
					/>
				) : (
					visibleGroups.map((group) => (
						<CourseGroupSection key={group.id} group={group} />
					))
				)}
			</div>

			{/* PAGINATION */}

			<CoursePagination
				page={page}
				pageSize={pageSize}
				total={total}
				onPageChange={(nextPage) => {
					coursesQuery.setPagination({
						page: nextPage,
					});

					setSelectedGroup("all");
				}}
			/>
		</div>
	);
}

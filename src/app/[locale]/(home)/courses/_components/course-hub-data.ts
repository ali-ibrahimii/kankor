import { CARD_IMAGES } from "@/components/blocks/shared/card-images";
import type { Locale } from "@/i18n";
import { serverEnv } from "@/lib/env/server-env";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

export type HubTrackId =
	| "math"
	| "science"
	| "languages"
	| "social"
	| "exam"
	| "school";

export const HUB_TRACKS: readonly HubTrackId[] = [
	"math",
	"science",
	"languages",
	"social",
	"exam",
	"school",
];

export type HubCourseItem = {
	id: string;
	title: string;
	subtitle: string;
	track: HubTrackId;
	categoryLabel: string;
	subLabel: string;
	instructorName: string;
	level: "beginner" | "intermediate" | "advanced" | "all_levels";
	isFree: boolean;
	isFeatured: boolean;
	priceCredits: number;
	lessonsCount: number;
	durationHours: number;
	projectsOrExercises?: string;
	tags: string[];
	rating: number;
	votes: number;
	imageSrc: string;
	href: string;
};

export type LearningPathItem = {
	id: string;
	track: HubTrackId;
	title: string;
	subtitle: string;
	steps: string[];
	courseIds: string[];
	coursesCount: number;
	durationLabel: string;
	accent: "violet" | "sky" | "amber" | "emerald";
};

export type SchoolHubData = {
	courses: HubCourseItem[];
	learningPaths: LearningPathItem[];
};

/** Text the catalog needs, read from the `content` namespace of each locale. */
type ContentCourse = {
	title: string;
	subtitle: string;
	subject: string;
	grade: string;
	instructor: string;
};

type ContentPath = {
	title: string;
	subtitle: string;
	duration: string;
	steps: string[];
};

type SchoolHubContent = {
	courses: Record<string, ContentCourse>;
	paths: Record<string, ContentPath>;
	labels: { course: string; allLevels: string; team: string };
};

type CoverKey = keyof typeof CARD_IMAGES;

/** Numbers, levels and covers stay in code; every word lives in src/messages. */
type CourseMeta = {
	track: HubTrackId;
	level: HubCourseItem["level"];
	isFree: boolean;
	credits: number;
	lessons: number;
	hours: number;
	rating: number;
	votes: number;
	image: CoverKey;
	featured?: boolean;
	extraKeywords?: string[];
};

const COURSE_META: Record<string, CourseMeta> = {
	"mth-calculus-12": {
		track: "math",
		level: "all_levels",
		isFree: true,
		credits: 0,
		lessons: 42,
		hours: 18,
		rating: 4.9,
		votes: 1840,
		image: "math",
		featured: true,
		extraKeywords: ["limits", "derivative", "integral"],
	},
	"mth-algebra-geometry": {
		track: "math",
		level: "intermediate",
		isFree: false,
		credits: 18,
		lessons: 36,
		hours: 16,
		rating: 4.8,
		votes: 1260,
		image: "math",
		extraKeywords: ["algebra", "geometry"],
	},
	"mth-trigonometry": {
		track: "math",
		level: "advanced",
		isFree: false,
		credits: 12,
		lessons: 22,
		hours: 9,
		rating: 4.7,
		votes: 860,
		image: "math",
		extraKeywords: ["trigonometry"],
	},
	"sci-physics-mechanics": {
		track: "science",
		level: "all_levels",
		isFree: true,
		credits: 0,
		lessons: 36,
		hours: 15,
		rating: 4.8,
		votes: 1490,
		image: "physics",
		featured: true,
		extraKeywords: ["mechanics", "motion", "newton"],
	},
	"sci-physics-electricity": {
		track: "science",
		level: "intermediate",
		isFree: false,
		credits: 16,
		lessons: 30,
		hours: 13,
		rating: 4.7,
		votes: 940,
		image: "physics",
		extraKeywords: ["electricity", "magnetism", "circuits"],
	},
	"sci-chem-organic": {
		track: "science",
		level: "advanced",
		isFree: false,
		credits: 16,
		lessons: 34,
		hours: 14,
		rating: 4.8,
		votes: 1120,
		image: "chemistry",
		extraKeywords: ["organic", "hydrocarbons"],
	},
	"sci-chem-general": {
		track: "science",
		level: "beginner",
		isFree: false,
		credits: 14,
		lessons: 28,
		hours: 12,
		rating: 4.6,
		votes: 780,
		image: "chemistry",
		extraKeywords: ["stoichiometry", "solutions"],
	},
	"sci-biology-cell-genetics": {
		track: "science",
		level: "all_levels",
		isFree: true,
		credits: 0,
		lessons: 30,
		hours: 12,
		rating: 4.9,
		votes: 1610,
		image: "biology",
		featured: true,
		extraKeywords: ["genetics", "cell", "mendel"],
	},
	"sci-biology-human": {
		track: "science",
		level: "intermediate",
		isFree: false,
		credits: 15,
		lessons: 26,
		hours: 11,
		rating: 4.7,
		votes: 890,
		image: "biology",
		extraKeywords: ["anatomy", "physiology"],
	},
	"lng-dari-grammar": {
		track: "languages",
		level: "all_levels",
		isFree: false,
		credits: 12,
		lessons: 24,
		hours: 10,
		rating: 4.7,
		votes: 1050,
		image: "languages",
		extraKeywords: ["dari", "grammar"],
	},
	"lng-pashto-grammar": {
		track: "languages",
		level: "all_levels",
		isFree: false,
		credits: 12,
		lessons: 24,
		hours: 10,
		rating: 4.6,
		votes: 920,
		image: "languages",
		extraKeywords: ["pashto", "syntax"],
	},
	"lng-english-kankor": {
		track: "languages",
		level: "beginner",
		isFree: true,
		credits: 0,
		lessons: 28,
		hours: 11,
		rating: 4.8,
		votes: 1340,
		image: "languages",
		featured: true,
		extraKeywords: ["english", "grammar", "reading"],
	},
	"soc-history": {
		track: "social",
		level: "all_levels",
		isFree: false,
		credits: 12,
		lessons: 26,
		hours: 10,
		rating: 4.6,
		votes: 760,
		image: "humanities",
		extraKeywords: ["history"],
	},
	"soc-geography": {
		track: "social",
		level: "beginner",
		isFree: false,
		credits: 10,
		lessons: 22,
		hours: 9,
		rating: 4.5,
		votes: 640,
		image: "humanities",
		extraKeywords: ["geography"],
	},
	"soc-economics": {
		track: "social",
		level: "intermediate",
		isFree: false,
		credits: 10,
		lessons: 20,
		hours: 8,
		rating: 4.5,
		votes: 520,
		image: "humanities",
		extraKeywords: ["economics", "civics"],
	},
	"soc-islamic": {
		track: "social",
		level: "all_levels",
		isFree: true,
		credits: 0,
		lessons: 32,
		hours: 12,
		rating: 4.8,
		votes: 1180,
		image: "humanities",
		extraKeywords: ["islamic studies", "fiqh"],
	},
	"exm-techniques": {
		track: "exam",
		level: "all_levels",
		isFree: true,
		credits: 0,
		lessons: 18,
		hours: 7,
		rating: 4.9,
		votes: 2150,
		image: "kankorExam",
		featured: true,
		extraKeywords: ["test technique", "time management"],
	},
	"exm-past-papers": {
		track: "exam",
		level: "advanced",
		isFree: false,
		credits: 20,
		lessons: 40,
		hours: 16,
		rating: 4.8,
		votes: 980,
		image: "kankorExam",
		extraKeywords: ["past papers", "analysis"],
	},
	"exm-mock-exam": {
		track: "exam",
		level: "advanced",
		isFree: true,
		credits: 0,
		lessons: 8,
		hours: 12,
		rating: 4.9,
		votes: 1420,
		image: "kankorExam",
		featured: true,
		extraKeywords: ["mock exam", "omr"],
	},
	"sch-grade-12": {
		track: "school",
		level: "all_levels",
		isFree: false,
		credits: 30,
		lessons: 68,
		hours: 34,
		rating: 4.9,
		votes: 1240,
		image: "schoolBooks",
		extraKeywords: ["grade 12", "package"],
	},
	"sch-grade-11": {
		track: "school",
		level: "all_levels",
		isFree: false,
		credits: 26,
		lessons: 60,
		hours: 30,
		rating: 4.8,
		votes: 890,
		image: "schoolBooks",
		extraKeywords: ["grade 11", "package"],
	},
};

type PathMeta = {
	track: HubTrackId;
	courseIds: string[];
	coursesCount: number;
	accent: LearningPathItem["accent"];
};

const PATH_META: Record<string, PathMeta> = {
	"path-math-foundation": {
		track: "math",
		courseIds: ["mth-algebra-geometry", "mth-trigonometry", "mth-calculus-12"],
		coursesCount: 3,
		accent: "violet",
	},
	"path-medical": {
		track: "science",
		courseIds: [
			"sci-biology-cell-genetics",
			"sci-biology-human",
			"sci-chem-organic",
		],
		coursesCount: 3,
		accent: "emerald",
	},
	"path-engineering": {
		track: "science",
		courseIds: [
			"sci-physics-mechanics",
			"sci-physics-electricity",
			"mth-algebra-geometry",
		],
		coursesCount: 3,
		accent: "sky",
	},
	"path-humanities": {
		track: "social",
		courseIds: ["soc-history", "soc-geography", "soc-economics"],
		coursesCount: 3,
		accent: "amber",
	},
	"path-kankor-100": {
		track: "exam",
		courseIds: ["exm-techniques", "exm-past-papers", "exm-mock-exam"],
		coursesCount: 3,
		accent: "violet",
	},
	"path-grade-12": {
		track: "school",
		courseIds: ["sch-grade-11", "sch-grade-12", "exm-mock-exam"],
		coursesCount: 3,
		accent: "emerald",
	},
};

async function loadContent(locale: Locale): Promise<SchoolHubContent> {
	const messages = (await import(`../../../../../messages/${locale}.json`))
		.default;
	return (messages as { content: { schoolHub: SchoolHubContent } }).content
		.schoolHub;
}

function buildFallbackCourses(content: SchoolHubContent): HubCourseItem[] {
	const signupHref = routes.auth.signup.page({ type: "student" });

	return Object.entries(COURSE_META)
		.map(([id, meta]): HubCourseItem | null => {
			const copy = content.courses[id];
			if (!copy) return null;

			return {
				id,
				title: copy.title,
				subtitle: copy.subtitle,
				track: meta.track,
				categoryLabel: copy.subject,
				subLabel: copy.grade,
				instructorName: copy.instructor,
				level: meta.level,
				isFree: meta.isFree,
				isFeatured: Boolean(meta.featured),
				priceCredits: meta.credits,
				lessonsCount: meta.lessons,
				durationHours: meta.hours,
				tags: [copy.subject, copy.grade, ...(meta.extraKeywords ?? [])],
				rating: meta.rating,
				votes: meta.votes,
				imageSrc: CARD_IMAGES[meta.image],
				href: signupHref,
			};
		})
		.filter((course): course is HubCourseItem => course !== null);
}

function buildFallbackPaths(content: SchoolHubContent): LearningPathItem[] {
	return Object.entries(PATH_META)
		.map(([id, meta]): LearningPathItem | null => {
			const copy = content.paths[id];
			if (!copy) return null;

			return {
				id,
				track: meta.track,
				title: copy.title,
				subtitle: copy.subtitle,
				steps: copy.steps,
				courseIds: meta.courseIds,
				coursesCount: meta.coursesCount,
				durationLabel: copy.duration,
				accent: meta.accent,
			};
		})
		.filter((path): path is LearningPathItem => path !== null);
}

const TRACK_MATCHERS: { track: HubTrackId; pattern: RegExp }[] = [
	{
		track: "math",
		pattern:
			/ریاضی|ریاضي|جبر|الجبر|هندسه|مثلثات|لمت|مشتق|انتگرال|انتیگرال|math|algebra|geometry|trigonometr|limit|derivativ|integral/i,
	},
	{
		track: "science",
		pattern:
			/فزیک|کیمیا|بیولوژ|علوم طبیعی|طبیعي علوم|physics|chemistr|biolog|mechanic|electric|magnet/i,
	},
	{
		track: "languages",
		pattern:
			/دری|دري|پشتو|پښتو|انگلیس|انګلیس|ادبیات|ژبه|دستور|گرامر|dari|pashto|english|literature|grammar|reading/i,
	},
	{
		track: "social",
		pattern:
			/تاریخ|جغراف|اقتصاد|مدنی|اسلامی|history|geograph|econom|islam|civic/i,
	},
	{
		track: "exam",
		pattern:
			/کانکور|كانکور|تست|ټیسټ|آزمون|ازموینه|آمادگی|چمتووالی|kankor|exam|test|mock|omr|practice/i,
	},
];

function inferTrackFromTitle(
	title: string,
	gradeId: string | null | undefined
): HubTrackId {
	for (const { track, pattern } of TRACK_MATCHERS) {
		if (pattern.test(title)) return track;
	}
	if (gradeId) return "school";
	return "exam";
}

function isPlaceholderSupabase(): boolean {
	const url = serverEnv.supabase.url;
	return (
		!url || url.includes("demo.invalid") || url.includes("example.invalid")
	);
}

/**
 * Loads only publicly published courses and their curated learning paths.
 * All learner-facing wording comes from `content.schoolHub` in src/messages.
 */
export async function getSchoolHubData(locale: Locale): Promise<SchoolHubData> {
	const content = await loadContent(locale);
	const fallbackCourses = buildFallbackCourses(content);
	const learningPaths = buildFallbackPaths(content);

	if (isPlaceholderSupabase()) {
		return { courses: fallbackCourses, learningPaths };
	}

	try {
		const supabase = await createClient();
		const { data } = await supabase
			.from("courses")
			.select(
				"id, slug, title, subtitle, cover_image_url, level, is_free, price_credits, estimated_duration_hours, average_rating, total_reviews, grade_id, instructor_id, grade:grades(id, name), subject:subjects(name), instructor:profiles!courses_instructor_id_fkey(full_name, role)"
			)
			.eq("is_published", true)
			.eq("visibility", "public")
			.order("created_at", { ascending: false })
			.limit(24);

		const eligibleRows = (data ?? []).filter((row) => {
			const instructor = Array.isArray(row.instructor)
				? row.instructor[0]
				: row.instructor;
			return (
				!row.instructor_id ||
				instructor?.role === "instructor" ||
				instructor?.role === "admin"
			);
		});

		const publishedCourses: HubCourseItem[] = eligibleRows.map((row) => {
			const subject = Array.isArray(row.subject) ? row.subject[0] : row.subject;
			const grade = Array.isArray(row.grade) ? row.grade[0] : row.grade;
			const instructor = Array.isArray(row.instructor)
				? row.instructor[0]
				: row.instructor;
			const track = inferTrackFromTitle(row.title, row.grade_id);

			return {
				id: row.id,
				title: row.title,
				subtitle: row.subtitle ?? "",
				track,
				isFeatured: false,
				categoryLabel: subject?.name ?? content.labels.course,
				subLabel: grade?.name ?? content.labels.allLevels,
				instructorName:
					row.instructor_id && instructor?.role === "instructor"
						? (instructor.full_name ?? content.labels.team)
						: content.labels.team,
				level: row.level ?? "all_levels",
				isFree: Boolean(row.is_free),
				priceCredits: row.price_credits ?? 0,
				lessonsCount: 24,
				durationHours: row.estimated_duration_hours ?? 12,
				tags: [subject?.name, grade?.name].filter((value): value is string =>
					Boolean(value)
				),
				rating:
					row.average_rating && row.average_rating > 0
						? row.average_rating
						: 4.9,
				votes: row.total_reviews > 0 ? row.total_reviews : 0,
				imageSrc: row.cover_image_url ?? "",
				href: routes.courses.slug.page({ slug: row.slug ?? row.id }),
			};
		});

		if (publishedCourses.length === 0) {
			return { courses: fallbackCourses, learningPaths };
		}

		const featuredCourseIds = new Set(
			[...publishedCourses]
				.sort((a, b) => b.rating - a.rating || b.votes - a.votes)
				.slice(0, Math.min(6, publishedCourses.length))
				.map((course) => course.id)
		);

		return {
			courses: publishedCourses.map((course) => ({
				...course,
				isFeatured: featuredCourseIds.has(course.id),
			})),
			learningPaths,
		};
	} catch {
		return { courses: fallbackCourses, learningPaths };
	}
}

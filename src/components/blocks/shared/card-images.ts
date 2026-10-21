import { resolveCoverSrc } from "@/components/blocks/course/cover.utils";

export const CARD_IMAGES = {
	math: "/images/cards/subject-math.jpg",
	physics: "/images/cards/subject-physics.jpg",
	chemistry: "/images/cards/subject-chemistry.jpg",
	biology: "/images/cards/subject-biology.jpg",
	humanities: "/images/cards/subject-humanities.jpg",
	languages: "/images/cards/subject-languages.jpg",
	flashcards: "/images/cards/flashcards-study.jpg",
	schoolBooks: "/images/cards/school-books.jpg",
	generalLibrary: "/images/cards/general-library.jpg",
	kankorExam: "/images/cards/kankor-exam.jpg",
	university: "/images/cards/partner-university.jpg",
	school: "/images/cards/partner-school.jpg",
	frontend: "/images/cards/dev-frontend.jpg",
	backend: "/images/cards/dev-backend.jpg",
	programming: "/images/cards/dev-programming.jpg",
	technicalSkills: "/images/cards/skills-technical.jpg",
	lifeSkills: "/images/cards/skills-life.jpg",
	liveClassroom: "/images/cards/live-classroom.jpg",
} as const;

export type EntityCardKind =
	| "course"
	| "deck"
	| "schoolBook"
	| "generalBook"
	| "quiz"
	| "university"
	| "school"
	| "liveClass";

const COURSE_POOL = [
	CARD_IMAGES.math,
	CARD_IMAGES.frontend,
	CARD_IMAGES.physics,
	CARD_IMAGES.programming,
	CARD_IMAGES.chemistry,
	CARD_IMAGES.biology,
	CARD_IMAGES.technicalSkills,
	CARD_IMAGES.lifeSkills,
] as const;

const DECK_POOL = [
	CARD_IMAGES.flashcards,
	CARD_IMAGES.languages,
	CARD_IMAGES.math,
	CARD_IMAGES.biology,
] as const;

const SCHOOL_BOOK_POOL = [
	CARD_IMAGES.schoolBooks,
	CARD_IMAGES.math,
	CARD_IMAGES.physics,
	CARD_IMAGES.chemistry,
	CARD_IMAGES.biology,
	CARD_IMAGES.humanities,
] as const;

const GENERAL_BOOK_POOL = [
	CARD_IMAGES.generalLibrary,
	CARD_IMAGES.languages,
	CARD_IMAGES.humanities,
	CARD_IMAGES.schoolBooks,
] as const;

const QUIZ_POOL = [
	CARD_IMAGES.kankorExam,
	CARD_IMAGES.math,
	CARD_IMAGES.physics,
	CARD_IMAGES.chemistry,
] as const;

function hashPick<T>(pool: readonly T[], seed: string): T {
	let hash = 0;
	for (let i = 0; i < seed.length; i++) {
		hash = (hash * 31 + seed.charCodeAt(i)) | 0;
	}
	return pool[Math.abs(hash) % pool.length];
}

/**
 * Resolves a real cover photograph for any catalog card.
 * Respects explicit `customSrc` when valid and allowed by `next/image`, and
 * otherwise selects a topic-appropriate editorial cover photograph.
 */
export function resolveEntityCardImage({
	customSrc,
	text,
	kind = "course",
	seed,
}: {
	customSrc?: string | null;
	text?: string | null;
	kind?: EntityCardKind;
	seed?: string;
}): string {
	const explicit = resolveCoverSrc(customSrc);
	if (explicit) return explicit;

	const normalized = (text ?? "").toLowerCase();

	if (
		/فرانت|frontend|front-end|react|next\.js|html|css|tailwind|رابط کاربری|ui\/ux/.test(
			normalized
		)
	) {
		return CARD_IMAGES.frontend;
	}
	if (
		/بک‌اند|بک اند|backend|back-end|node|django|fastapi|sql|postgres|docker|سرور|دیتابیس/.test(
			normalized
		)
	) {
		return CARD_IMAGES.backend;
	}
	if (
		/پایتون|python|javascript|جاوا|c\+\+|flutter|برنامه‌نویسی|برنامه نویسی|الگوریتم|کدنویسی|coding/.test(
			normalized
		)
	) {
		return CARD_IMAGES.programming;
	}
	if (
		/فنی|گرافیک|اکسل|excel|figma|شبکه|network|فریلنس|هوش مصنوعی|ai/.test(
			normalized
		)
	) {
		return CARD_IMAGES.technicalSkills;
	}
	if (
		/مهارت‌های زندگی|مهارت زندگی|فن بیان|مدیریت زمان|سواد مالی|ارتباط|تمرکز|life skill/.test(
			normalized
		)
	) {
		return CARD_IMAGES.lifeSkills;
	}
	if (
		/ریاضی|رياضيات|math|mathematics|حساب|الجبر|هندسه|مثلثات|احصائیه/.test(
			normalized
		)
	) {
		return CARD_IMAGES.math;
	}
	if (/فزیک|فيزيا|physics|میخانیک|برق|نور|مقناطیس/.test(normalized)) {
		return CARD_IMAGES.physics;
	}
	if (/کیمیا|كيمياء|chemistry|عضوی|غیرعضوی|اتم|عنصر/.test(normalized)) {
		return CARD_IMAGES.chemistry;
	}
	if (
		/بیولوژی|بيولوجي|بیولوژي|biology|طب|جنتیک|حجره|گیاه|حیوان/.test(normalized)
	) {
		return CARD_IMAGES.biology;
	}
	if (
		/تاریخ|جغرافیه|اجتماعی|مدنی|ثقافت|تفسیر|عقاید|history|geography/.test(
			normalized
		)
	) {
		return CARD_IMAGES.humanities;
	}
	if (
		/دری|پشتو|پښتو|انگلیسی|عربی|ادبیات|زبان|نگارش|dari|pashto|english|arabic/.test(
			normalized
		)
	) {
		return CARD_IMAGES.languages;
	}

	const key = seed ?? text ?? "";

	switch (kind) {
		case "liveClass":
			return CARD_IMAGES.liveClassroom;
		case "deck":
			return key ? hashPick(DECK_POOL, key) : CARD_IMAGES.flashcards;
		case "schoolBook":
			return key ? hashPick(SCHOOL_BOOK_POOL, key) : CARD_IMAGES.schoolBooks;
		case "generalBook":
			return key
				? hashPick(GENERAL_BOOK_POOL, key)
				: CARD_IMAGES.generalLibrary;
		case "quiz":
			return key ? hashPick(QUIZ_POOL, key) : CARD_IMAGES.kankorExam;
		case "university":
			return CARD_IMAGES.university;
		case "school":
			return CARD_IMAGES.school;
		default:
			return key ? hashPick(COURSE_POOL, key) : CARD_IMAGES.math;
	}
}

"use client";

import { ArrowLeft, ArrowRight, Star } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import type { CourseMeta } from "@/components/blocks/course/course-card";
import type { PublicDeck } from "@/components/blocks/decks/public-deck-card";
import type { LibraryBook } from "@/components/blocks/libraries/types";
import type { PublicQuiz } from "@/components/blocks/quizzes/types";
import { resolveEntityCardImage } from "@/components/blocks/shared/card-images";
import { ratingFromSeed } from "@/components/blocks/shared/entity-card";
import { Link } from "@/i18n/navigation";
import { isRtl } from "@/i18n/routing";

// ─── 1. Video Lesson / School Course Card (Compact 16:9 EdTech Style) ──────

export function HomeCourseCard({
	course,
	href,
}: {
	course: CourseMeta;
	href: string;
}) {
	const t = useTranslations("courses");
	const locale = useLocale();
	const Arrow = isRtl(locale) ? ArrowLeft : ArrowRight;

	const coverSrc = resolveEntityCardImage({
		customSrc: course.cover_image_url,
		text: `${course.subject?.name ?? ""} ${course.title}`,
		kind: "course",
		seed: course.id,
	});

	const fallbackStats = ratingFromSeed(course.id);
	const rating =
		course.average_rating > 0
			? course.average_rating.toFixed(1)
			: fallbackStats.score;
	const votes = course.total_enrollments ?? fallbackStats.votes;

	return (
		<Link
			href={href}
			className="group flex h-full w-[282px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[#e7e8f3] bg-white shadow-[0_8px_24px_-14px_rgba(25,36,59,.14)] transition duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_18px_36px_-18px_rgba(105,75,210,.28)] sm:w-[298px] dark:border-white/10 dark:bg-[#1b2438]"
		>
			<div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900">
				<Image
					src={coverSrc}
					alt={course.title}
					fill
					sizes="(max-width: 640px) 85vw, 300px"
					className="object-cover transition-transform duration-700 group-hover:scale-105"
				/>
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/25"
				/>

				{course.is_free && (
					<span className="absolute start-2.5 top-2.5 rounded-full bg-[#b7f486] px-2.5 py-0.5 text-[10px] font-extrabold text-[#17233a] shadow-sm">
						{t("free")}
					</span>
				)}

				<span className="absolute end-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
					<Star className="size-3 fill-amber-400 text-amber-400" />
					<span>{rating}</span>
					<span className="text-white/70">({votes})</span>
				</span>
			</div>

			<div className="flex flex-1 flex-col p-3.5">
				<div className="flex items-center gap-1.5 text-[11px] font-bold text-primary">
					{course.subject?.name && <span>{course.subject.name}</span>}
					{course.subject?.name && course.grade?.name && (
						<span className="text-muted-foreground/50">•</span>
					)}
					{course.grade?.name && (
						<span className="font-semibold text-muted-foreground">
							{course.grade.name}
						</span>
					)}
				</div>

				<h3 className="mt-1 line-clamp-2 text-[14px] font-extrabold leading-5 text-[#19243b] transition-colors group-hover:text-primary dark:text-slate-100">
					{course.title}
				</h3>

				{course.instructor?.full_name && (
					<p className="mt-1.5 truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
						{course.instructor.full_name}
					</p>
				)}

				<div className="mt-auto mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] dark:border-white/10">
					<span className="text-slate-500 dark:text-slate-400">
						{course.total_lessons != null &&
							t("lessons", { count: course.total_lessons })}
						{course.estimated_duration_hours != null &&
							` · ${t("duration", { hours: course.estimated_duration_hours })}`}
					</span>
					<span className="inline-flex items-center gap-1 font-extrabold text-primary">
						{t("view")}
						<Arrow className="size-3.5 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
					</span>
				</div>
			</div>
		</Link>
	);
}

// ─── 2. Official School Textbook Card (Horizontal Book-Spine Layout) ───────

export function HomeSchoolBookCard({
	book,
	href,
}: {
	book: LibraryBook & {
		cover_image_url?: string | null;
		rating?: number;
		rating_count?: number;
	};
	href: string;
}) {
	const t = useTranslations("libraries");
	const locale = useLocale();
	const Arrow = isRtl(locale) ? ArrowLeft : ArrowRight;

	const coverSrc = resolveEntityCardImage({
		customSrc: book.cover_image_url,
		text: `${book.subjects?.name ?? ""} ${book.title}`,
		kind: "schoolBook",
		seed: book.id,
	});
	const stats = ratingFromSeed(book.id);
	const rating = book.rating != null ? book.rating.toFixed(1) : stats.score;

	return (
		<Link
			href={href}
			className="group flex h-[164px] w-[312px] shrink-0 snap-start overflow-hidden rounded-2xl border border-[#e5e8f4] bg-white shadow-[0_8px_22px_-14px_rgba(25,36,59,.14)] transition duration-300 hover:-translate-y-0.5 hover:border-blue-400/50 hover:shadow-[0_16px_32px_-18px_rgba(37,99,235,.24)] sm:w-[340px] dark:border-white/10 dark:bg-[#1b2438]"
		>
			{/* Book Cover Spine */}
			<div className="relative h-full w-[112px] shrink-0 overflow-hidden bg-slate-900 sm:w-[118px]">
				<Image
					src={coverSrc}
					alt={book.title}
					fill
					sizes="120px"
					className="object-cover transition-transform duration-700 group-hover:scale-105"
				/>
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-y-0 end-0 w-3 bg-gradient-to-l from-black/30 to-transparent"
				/>
				<span className="absolute start-2 top-2 inline-flex items-center gap-0.5 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
					<Star className="size-2.5 fill-amber-400 text-amber-400" />
					<span>{rating}</span>
				</span>
			</div>

			{/* Book Details */}
			<div className="flex min-w-0 flex-1 flex-col justify-between p-3.5">
				<div>
					<div className="flex flex-wrap items-center gap-1.5 text-[10.5px] font-bold text-blue-600 dark:text-blue-400">
						{book.subjects?.name && <span>{book.subjects.name}</span>}
						{book.subjects?.name && book.grades?.name && <span>·</span>}
						{book.grades?.name && (
							<span className="text-slate-500 dark:text-slate-400">
								{book.grades.name}
							</span>
						)}
					</div>

					<h3 className="mt-1 line-clamp-2 text-[13.5px] font-extrabold leading-5 text-[#19243b] transition-colors group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400">
						{book.title}
					</h3>

					{book.desc && (
						<p className="mt-1 line-clamp-2 text-[11px] leading-4.5 text-slate-500 dark:text-slate-400">
							{book.desc}
						</p>
					)}
				</div>

				<div className="flex items-center justify-end pt-1 text-[11px] font-extrabold text-blue-600 dark:text-blue-400">
					<span className="inline-flex items-center gap-1">
						{t("open")}
						<Arrow className="size-3.5 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
					</span>
				</div>
			</div>
		</Link>
	);
}

// ─── 3. General Books & Guides Card (Full-Bleed Editorial Overlay Style) ───

export function HomeGeneralBookCard({
	book,
	href,
}: {
	book: LibraryBook & {
		cover_image_url?: string | null;
		rating?: number;
		rating_count?: number;
	};
	href: string;
}) {
	const t = useTranslations("libraries");
	const locale = useLocale();
	const Arrow = isRtl(locale) ? ArrowLeft : ArrowRight;

	const coverSrc = resolveEntityCardImage({
		customSrc: book.cover_image_url,
		text: `${book.subjects?.name ?? ""} ${book.title}`,
		kind: "generalBook",
		seed: book.id,
	});
	const stats = ratingFromSeed(book.id);
	const rating = book.rating != null ? book.rating.toFixed(1) : stats.score;
	const votes = book.rating_count ?? stats.votes;

	return (
		<Link
			href={href}
			className="group relative flex h-[278px] w-[248px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-3xl border border-black/5 bg-slate-900 p-4 text-white shadow-[0_14px_30px_-16px_rgba(15,23,42,.45)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_40px_-16px_rgba(15,23,42,.6)] sm:w-[262px]"
		>
			<Image
				src={coverSrc}
				alt={book.title}
				fill
				sizes="(max-width: 640px) 80vw, 265px"
				className="object-cover transition-transform duration-700 group-hover:scale-108"
			/>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0d1526]/95 via-[#0d1526]/55 to-black/20"
			/>

			{/* Top Row: Clean User Rating */}
			<div className="relative z-10 flex items-center justify-between gap-2">
				{book.categories?.name ? (
					<span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold text-white/95 backdrop-blur-md">
						{book.categories.name}
					</span>
				) : (
					<span />
				)}
				<span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
					<Star className="size-3 fill-amber-400 text-amber-400" />
					<span>{rating}</span>
					<span className="text-white/70">({votes})</span>
				</span>
			</div>

			{/* Bottom Editorial Copy */}
			<div className="relative z-10">
				<h3 className="line-clamp-2 text-[14.5px] font-extrabold leading-5.5 text-white">
					{book.title}
				</h3>
				{book.desc && (
					<p className="mt-1.5 line-clamp-2 text-[11px] leading-4.5 text-white/75">
						{book.desc}
					</p>
				)}
				<div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#b7f486]">
					<span>{t("open")}</span>
					<Arrow className="size-3.5 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
				</div>
			</div>
		</Link>
	);
}

// ─── 4. Smart Flashcard Deck Card (Layered Deck + Exact Corner/Footer Spec) ─

export function HomeFlashcardDeckCard({
	deck,
	href,
}: {
	deck: PublicDeck;
	href: string;
}) {
	const t = useTranslations("decks");
	const locale = useLocale();
	const Arrow = isRtl(locale) ? ArrowLeft : ArrowRight;

	const coverSrc = resolveEntityCardImage({
		customSrc: deck.cover_image_url,
		text: deck.name,
		kind: "deck",
		seed: deck.id,
	});
	const stats = ratingFromSeed(deck.id);
	const rating = deck.rating != null ? deck.rating.toFixed(1) : stats.score;
	const votes = deck.rating_count ?? stats.votes;

	return (
		<div className="relative w-[278px] shrink-0 snap-start pb-1.5 sm:w-[294px]">
			{/* Physical Stacked Flashcard Layer Effect */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-x-3 bottom-0 h-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/8 dark:border-emerald-400/15 dark:bg-emerald-400/10"
			/>

			<Link
				href={href}
				className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#e3ece8] bg-white shadow-[0_8px_22px_-14px_rgba(16,45,35,.15)] transition duration-300 hover:-translate-y-1 hover:border-emerald-500/40 sm:w-full dark:border-white/10 dark:bg-[#1b2438]"
			>
				{/* Clean Image: Top-Start Free Tag + Top-End Vote Stats, Zero Floating Icons */}
				<div className="relative h-34 w-full overflow-hidden bg-slate-900">
					<Image
						src={coverSrc}
						alt={deck.name}
						fill
						sizes="(max-width: 640px) 85vw, 295px"
						className="object-cover transition-transform duration-700 group-hover:scale-105"
					/>
					<div
						aria-hidden="true"
						className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/25"
					/>

					{deck.is_free && (
						<span className="absolute start-2.5 top-2.5 rounded-full bg-[#b7f486] px-2.5 py-0.5 text-[10px] font-extrabold text-[#17233a] shadow-sm">
							{t("free")}
						</span>
					)}

					<span className="absolute end-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
						<Star className="size-3 fill-amber-400 text-amber-400" />
						<span>{rating}</span>
						<span className="text-white/75">({votes})</span>
					</span>
				</div>

				{/* Compact Body */}
				<div className="flex flex-1 flex-col p-3.5">
					<h3 className="line-clamp-2 text-[14px] font-extrabold leading-5 text-[#19243b] transition-colors group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-400">
						{deck.name}
					</h3>
					{deck.description && (
						<p className="mt-1 line-clamp-2 text-[11px] leading-4.5 text-slate-500 dark:text-slate-400">
							{deck.description}
						</p>
					)}
				</div>

				{/* Footer: [Card Count] — [Flashcard Category] — [Practice Now] */}
				<div className="flex items-center justify-between gap-1.5 border-t border-slate-100 bg-slate-50/70 px-3.5 py-2.5 text-[11px] dark:border-white/10 dark:bg-white/[.03]">
					<span className="shrink-0 font-bold text-slate-600 dark:text-slate-300">
						{deck.card_count != null
							? t("cardCount", { count: deck.card_count })
							: t("title")}
					</span>

					{deck.category && (
						<span className="truncate rounded-full bg-emerald-500/12 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300">
							{deck.category}
						</span>
					)}

					<span className="inline-flex shrink-0 items-center gap-1 font-extrabold text-primary">
						{t("practiceNow")}
						<Arrow className="size-3 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
					</span>
				</div>
			</Link>
		</div>
	);
}

// ─── 5. Kankor Exam Form Card (Official Structured Exam Ticket Style) ──────

export function HomeKankorFormCard({
	quiz,
	href,
}: {
	quiz: PublicQuiz & {
		cover_image_url?: string | null;
		question_count?: number;
		exam_zone?: string;
		rating?: number;
		rating_count?: number;
	};
	href: string;
}) {
	const t = useTranslations("quizzes");
	const locale = useLocale();
	const Arrow = isRtl(locale) ? ArrowLeft : ArrowRight;

	const coverSrc = resolveEntityCardImage({
		customSrc: quiz.cover_image_url,
		text: quiz.title,
		kind: "quiz",
		seed: quiz.id,
	});
	const stats = ratingFromSeed(quiz.id);
	const rating = quiz.rating != null ? quiz.rating.toFixed(1) : stats.score;
	const votes = quiz.rating_count ?? stats.votes;

	return (
		<Link
			href={href}
			className="group flex h-full w-[282px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[#ebe6dd] bg-white shadow-[0_8px_22px_-14px_rgba(35,28,15,.14)] transition duration-300 hover:-translate-y-1 hover:border-amber-500/45 sm:w-[298px] dark:border-white/10 dark:bg-[#1b2438]"
		>
			<div className="h-1 w-full bg-gradient-to-l from-amber-500 via-orange-500 to-violet-600" />

			<div className="relative h-30 w-full overflow-hidden bg-slate-900">
				<Image
					src={coverSrc}
					alt={quiz.title}
					fill
					sizes="(max-width: 640px) 85vw, 300px"
					className="object-cover transition-transform duration-700 group-hover:scale-105"
				/>
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/25"
				/>

				{quiz.exam_zone && (
					<span className="absolute start-2.5 top-2.5 rounded-full bg-white/92 px-2.5 py-0.5 text-[10px] font-extrabold text-[#19243b] shadow-xs">
						{quiz.exam_zone}
					</span>
				)}

				<span className="absolute end-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
					<Star className="size-3 fill-amber-400 text-amber-400" />
					<span>{rating}</span>
					<span className="text-white/70">({votes})</span>
				</span>
			</div>

			<div className="flex flex-1 flex-col p-3.5">
				<h3 className="line-clamp-2 text-[14px] font-extrabold leading-5 text-[#19243b] transition-colors group-hover:text-amber-600 dark:text-slate-100 dark:group-hover:text-amber-400">
					{quiz.title}
				</h3>

				{quiz.description && (
					<p className="mt-1 line-clamp-2 text-[11px] leading-4.5 text-slate-500 dark:text-slate-400">
						{quiz.description}
					</p>
				)}

				<div className="mt-auto pt-3">
					<div className="flex items-center justify-between rounded-xl bg-amber-500/8 px-3 py-2 text-[11px] font-bold text-slate-700 dark:bg-amber-400/10 dark:text-slate-200">
						<span>
							{quiz.time_limit_minutes != null
								? t("timeLimitMinutes", { count: quiz.time_limit_minutes })
								: t("title")}
						</span>
						<span className="inline-flex items-center gap-1 font-extrabold text-amber-700 dark:text-amber-300">
							{t("view")}
							<Arrow className="size-3.5 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
						</span>
					</div>
				</div>
			</div>
		</Link>
	);
}

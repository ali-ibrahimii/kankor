import {
	ArrowLeft,
	ArrowRight,
	BookOpen,
	CheckCircle2,
	Clock3,
	GraduationCap,
	Layers3,
	MessageCircle,
	Sparkles,
	Star,
	Target,
} from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import CourseDetailClient from "@/app/[locale]/d/(student)/courses/[slug]/course-detail-client";

import { resolveCoverSrc } from "@/components/blocks/course";
import { PublicDeckCard } from "@/components/blocks/decks/public-deck-card";
import { ResourceDiscussionView } from "@/components/blocks/discussions/ResourceDiscussionView";
import { LibraryCard } from "@/components/blocks/libraries/library-card";
import { PublicQuizCard } from "@/components/blocks/quizzes/public-quiz-card";
import { ReviewsSection } from "@/components/blocks/reviews";

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { buildEntityMetadata } from "@/features/seo";
import { Link } from "@/i18n/navigation";
import { serverEnv } from "@/lib/env/server-env";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { decodeSlugParam } from "@/lib/utils";

import type { BaseParams } from "@/types/common.types";
import type { CourseDetail } from "@/types/queries.types";

export const revalidate = 86400;

// ============================================================
// METADATA
// ============================================================

export async function generateMetadata({
	params,
}: {
	params: Promise<BaseParams & { slug: string }>;
}) {
	const { slug, locale } = await params;

	const supabase = await createClient();

	const { data: course, error } = await supabase
		.from("courses")
		.select(
			"id, slug, title, subtitle, description, seo_title, seo_description, cover_image_url, learning_objectives"
		)
		.eq("slug", decodeSlugParam(slug))
		.eq("is_published", true)
		.single();

	if (!course || error) return {};

	const t = await getTranslations({
		locale,
		namespace: "courses",
	});

	return buildEntityMetadata({
		seoTitle: course.seo_title,
		seoDescription: course.seo_description,
		fallbackTitle: `${course.title} | ${t("title")}`,
		fallbackDescription:
			course.description || course.subtitle || t("description"),
		path: routes.courses.slug.page({
			slug: course.slug ?? course.id,
		}),
		locale,
		coverImage: resolveCoverSrc(course.cover_image_url),
		keywords: course.learning_objectives,
	});
}

// ============================================================
// PAGE
// ============================================================

export default async function CourseDetailPage({
	params,
}: {
	params: Promise<BaseParams & { slug: string }>;
}) {
	const { slug, locale } = await params;

	setRequestLocale(locale);

	const supabase = await createClient();

	const { data } = await supabase.auth.getClaims();

	const userId = data?.claims.sub;

	const { data: course, error } = await supabase
		.rpc("get_course_details", {
			p_course_slug: decodeSlugParam(slug),
		})
		.single();

	if (!course || error || !course.is_published) {
		notFound();
	}

	const s = await getTranslations({
		locale,
		namespace: "seo",
	});

	const baseUrl = serverEnv.app.address.replace(/\/$/, "");

	// ========================================================
	// RELATED RESOURCES
	// ========================================================

	const bookId = course.book?.id;
	const subjectId = course.subject?.id;
	const gradeId = course.grade?.id;

	const schoolId = course.school_id;

	const selectedDeckIds = course.related_decks_ids || [];

	const selectedQuizIds = course.related_quizzes_ids || [];

	const selectedBookIds = course.related_libraries_ids || [];

	const [relatedDecksRes, relatedQuizzesRes, relatedBooksRes] =
		await Promise.all([
			supabase.rpc("get_related_decks", {
				p_related_ids: selectedDeckIds,
				p_book_id: bookId || undefined,
				p_subject_id: subjectId || undefined,
				p_grade_id: gradeId || undefined,
				p_school_id: schoolId || undefined,
				p_limit: 3,
			}),

			supabase.rpc("get_related_quizzes", {
				p_related_ids: selectedQuizIds,
				p_book_id: bookId || undefined,
				p_subject_id: subjectId || undefined,
				p_grade_id: gradeId || undefined,
				p_school_id: schoolId || undefined,
				p_limit: 3,
			}),

			supabase.rpc("get_related_libraries", {
				p_related_ids: selectedBookIds,
				p_book_id: bookId || undefined,
				p_subject_id: subjectId || undefined,
				p_grade_id: gradeId || undefined,
				p_school_id: schoolId || undefined,
				p_limit: 3,
			}),
		]);

	const relatedDecks = relatedDecksRes.data || [];
	const relatedQuizzes = relatedQuizzesRes.data || [];
	const relatedBooks = relatedBooksRes.data || [];

	const hasRelatedResources =
		relatedDecks.length > 0 ||
		relatedQuizzes.length > 0 ||
		relatedBooks.length > 0;

	// ========================================================
	// JSON-LD COURSE
	// ========================================================

	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "Course",
		name: course.title,
		description: course.description || course.subtitle || undefined,
		inLanguage: course.language,
		image: resolveCoverSrc(course.cover_image_url) || undefined,
		provider: {
			"@type": "Organization",
			name: "Abzar Kankor",
			url: baseUrl,
		},
		offers: course.is_free
			? {
					"@type": "Offer",
					price: "0",
					priceCurrency: "USD",
				}
			: course.price != null
				? {
						"@type": "Offer",
						price: course.price,
						priceCurrency: course.currency ?? "USD",
					}
				: undefined,
	};

	// ========================================================
	// JSON-LD BREADCRUMB
	// ========================================================

	const breadcrumbJsonLd = {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: [
			{
				"@type": "ListItem",
				position: 1,
				name: s("home"),
				item: `${baseUrl}/${locale}`,
			},
			{
				"@type": "ListItem",
				position: 2,
				name: s("courses"),
				item: `${baseUrl}/${locale}/courses`,
			},
			{
				"@type": "ListItem",
				position: 3,
				name: course.title,
				item: `${baseUrl}/${locale}/courses/${course.slug ?? course.id}`,
			},
		],
	};

	// ========================================================
	// FAQ JSON-LD
	// ========================================================

	const faqQuestions = [];

	if (course.prerequisites && course.prerequisites.length > 0) {
		faqQuestions.push({
			"@type": "Question",
			name: s("faqPrerequisites"),
			acceptedAnswer: {
				"@type": "Answer",
				text: course.prerequisites.join(", "),
			},
		});
	}

	if (course.learning_objectives && course.learning_objectives.length > 0) {
		faqQuestions.push({
			"@type": "Question",
			name: s("faqObjectives"),
			acceptedAnswer: {
				"@type": "Answer",
				text: course.learning_objectives.join(", "),
			},
		});
	}

	const faqJsonLd =
		faqQuestions.length > 0
			? {
					"@context": "https://schema.org",
					"@type": "FAQPage",
					mainEntity: faqQuestions,
				}
			: null;

	// ========================================================
	// PAGE CONTENT
	// ========================================================

	return (
		<div className="min-h-screen bg-[#f9faff] text-[#19243b] dark:bg-[#141b2c] dark:text-slate-100">
			{/* SEO */}

			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
				}}
			/>

			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c"),
				}}
			/>

			{faqJsonLd && (
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{
						__html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c"),
					}}
				/>
			)}

			{/* ================================================= */}
			{/* BREADCRUMB */}
			{/* ================================================= */}

			<div className="border-b border-[#e9eaf2] bg-white/80 dark:border-white/10 dark:bg-[#1b2438]">
				<div className="mx-auto max-w-[1320px] px-4 py-5 sm:px-6 lg:px-8">
					<Breadcrumb>
						<BreadcrumbList className="flex flex-wrap items-center gap-2 text-xs">
							<BreadcrumbItem>
								<BreadcrumbLink asChild>
									<Link
										href={routes.home.page()}
										className="font-medium text-slate-500 transition-colors hover:text-[#694bd2] dark:text-slate-400"
									>
										{s("home")}
									</Link>
								</BreadcrumbLink>
							</BreadcrumbItem>

							<BreadcrumbSeparator />

							<BreadcrumbItem>
								<BreadcrumbLink asChild>
									<Link
										href={routes.courses.page()}
										className="font-medium text-slate-500 transition-colors hover:text-[#694bd2] dark:text-slate-400"
									>
										{s("courses")}
									</Link>
								</BreadcrumbLink>
							</BreadcrumbItem>

							<BreadcrumbSeparator />

							<BreadcrumbItem>
								<BreadcrumbPage className="max-w-[220px] truncate font-bold text-[#694bd2] dark:text-violet-300 sm:max-w-md">
									{course.title}
								</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>
			</div>

			{/* ================================================= */}
			{/* MAIN CONTENT */}
			{/* ================================================= */}

			<main className="mx-auto max-w-[1320px] space-y-16 px-4 pb-24 pt-8 sm:px-6 lg:px-8">
				{/* COURSE DETAILS */}

				<section>
					<CourseDetailClient
						courseId={course.id}
						userId={userId}
						course={course as CourseDetail}
					/>
				</section>

				{/* ================================================= */}
				{/* LEARNING OBJECTIVES AND PREREQUISITES */}
				{/* ================================================= */}

				{!course.description &&
					(course.learning_objectives?.length > 0 ||
						course.prerequisites?.length > 0) && (
						<section className="space-y-7">
							<div className="flex items-center gap-4">
								<div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#eee8ff] text-[#694bd2] dark:bg-violet-500/15 dark:text-violet-300">
									<Target className="size-6" />
								</div>

								<div>
									<h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
										{s("faqObjectives")}
									</h2>

									<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
										{course.title}
									</p>
								</div>
							</div>

							<div className="grid gap-5 md:grid-cols-2">
								{/* OBJECTIVES */}

								{course.learning_objectives &&
									course.learning_objectives.length > 0 && (
										<div className="relative overflow-hidden rounded-[24px] border border-[#e8e5f5] bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#1c263b] sm:p-7">
											<div className="absolute -end-10 -top-10 size-32 rounded-full bg-violet-100/60 blur-2xl dark:bg-violet-500/10" />

											<div className="relative">
												<div className="mb-6 flex items-center gap-3">
													<span className="flex size-11 items-center justify-center rounded-2xl bg-[#eee8ff] text-[#694bd2] dark:bg-violet-500/15 dark:text-violet-300">
														<Target className="size-5" />
													</span>

													<h3 className="text-base font-extrabold">
														{s("faqObjectives")}
													</h3>
												</div>

												<ul className="space-y-4">
													{course.learning_objectives.map(
														(objective, index) => (
															<li
																key={index}
																className="flex items-start gap-3"
															>
																<span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
																	<CheckCircle2 className="size-4" />
																</span>

																<span className="text-sm leading-7 text-slate-600 dark:text-slate-300">
																	{objective}
																</span>
															</li>
														)
													)}
												</ul>
											</div>
										</div>
									)}

								{/* PREREQUISITES */}

								{course.prerequisites && course.prerequisites.length > 0 && (
									<div className="relative overflow-hidden rounded-[24px] border border-[#e8e5f5] bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#1c263b] sm:p-7">
										<div className="absolute -end-10 -top-10 size-32 rounded-full bg-emerald-100/60 blur-2xl dark:bg-emerald-500/10" />

										<div className="relative">
											<div className="mb-6 flex items-center gap-3">
												<span className="flex size-11 items-center justify-center rounded-2xl bg-[#e1f7eb] text-[#248565] dark:bg-emerald-500/10 dark:text-emerald-300">
													<BookOpen className="size-5" />
												</span>

												<h3 className="text-base font-extrabold">
													{s("faqPrerequisites")}
												</h3>
											</div>

											<ul className="space-y-4">
												{course.prerequisites.map((prerequisite, index) => (
													<li key={index} className="flex items-start gap-3">
														<span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#e1f7eb] text-[#248565] dark:bg-emerald-500/10 dark:text-emerald-300">
															<CheckCircle2 className="size-4" />
														</span>

														<span className="text-sm leading-7 text-slate-600 dark:text-slate-300">
															{prerequisite}
														</span>
													</li>
												))}
											</ul>
										</div>
									</div>
								)}
							</div>
						</section>
					)}

				{/* ================================================= */}
				{/* RELATED RESOURCES */}
				{/* ================================================= */}

				{hasRelatedResources && (
					<section className="space-y-7">
						<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
							<div className="flex items-center gap-4">
								<span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#eee8ff] text-[#694bd2] dark:bg-violet-500/15 dark:text-violet-300">
									<Layers3 className="size-6" />
								</span>

								<div>
									<h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
										{s("relatedResources")}
									</h2>

									<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
										{course.title}
									</p>
								</div>
							</div>

							<span className="inline-flex self-start items-center gap-2 rounded-full border border-[#e9eaf2] bg-white px-4 py-2 text-xs font-bold text-[#694bd2] dark:border-white/10 dark:bg-white/5 dark:text-violet-300">
								<BookOpen className="size-4" />

								{relatedDecks.length +
									relatedQuizzes.length +
									relatedBooks.length}
							</span>
						</div>

						<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
							{relatedDecks.map((deck) => (
								<PublicDeckCard key={deck.id} deck={deck} />
							))}

							{relatedQuizzes.map((quiz) => (
								<PublicQuizCard key={quiz.id} quiz={quiz} />
							))}

							{relatedBooks.map((book) => (
								<LibraryCard key={book.id} book={book as any} />
							))}
						</div>
					</section>
				)}

				{/* ================================================= */}
				{/* REVIEWS */}
				{/* ================================================= */}

				<section className="space-y-7">
					<div className="flex items-center gap-4">
						<span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#fff4dc] text-[#d99421] dark:bg-amber-500/10 dark:text-amber-300">
							<Star className="size-6" />
						</span>

						<div>
							<h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
								{/* ReviewsSection has its own translated heading */}
								{s("courses")}
							</h2>

							<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
								{course.title}
							</p>
						</div>
					</div>

					<div className="rounded-[26px] border border-[#e9eaf2] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1c263b] sm:p-7">
						<ReviewsSection
							target={{
								type: "course",
								id: course.id,
							}}
							averageRating={course.average_rating}
							totalReviews={course.total_reviews}
							userId={userId}
							canReview={!!course.enrollment}
						/>
					</div>
				</section>

				{/* ================================================= */}
				{/* DISCUSSIONS */}
				{/* ================================================= */}

				<section className="space-y-7">
					<div className="flex items-center gap-4">
						<span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#e1f7eb] text-[#248565] dark:bg-emerald-500/10 dark:text-emerald-300">
							<MessageCircle className="size-6" />
						</span>

						<div>
							<h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
								{s("discussions", {
									defaultValue: "Course Discussions",
								})}
							</h2>

							<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
								{course.title}
							</p>
						</div>
					</div>

					<div className="rounded-[26px] border border-[#e9eaf2] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1c263b] sm:p-7">
						<ResourceDiscussionView
							resource_type="course"
							resource_id={course.id}
							publicView={true}
						/>
					</div>
				</section>
			</main>
		</div>
	);
}

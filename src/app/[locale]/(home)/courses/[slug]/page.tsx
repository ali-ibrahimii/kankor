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
import { BaseParams } from "@/types/common.types";
import { CourseDetail } from "@/types/queries.types";

export const revalidate = 86400;

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

	const t = await getTranslations({ locale, namespace: "courses" });

	return buildEntityMetadata({
		seoTitle: course.seo_title,
		seoDescription: course.seo_description,
		fallbackTitle: `${course.title} | ${t("title")}`,
		fallbackDescription:
			course.description || course.subtitle || t("description"),
		path: routes.courses.slug.page({ slug: course.slug ?? course.id }),
		locale,
		coverImage: resolveCoverSrc(course.cover_image_url),
		keywords: course.learning_objectives,
	});
}

export default async function CourseDetailPage({
	params,
}: {
	params: Promise<BaseParams & { slug: string }>;
}) {
	const supabase = await createClient();
	const { data } = await supabase.auth.getClaims();
	const userId = data?.claims.sub;
	const { slug, locale } = await params;
	setRequestLocale(locale);

	const { data: course, error } = await supabase
		.rpc("get_course_details", {
			p_course_slug: decodeSlugParam(slug),
		})
		.single();

	if (!course || error || !course.is_published) {
		notFound();
	}

	const s = await getTranslations({ locale, namespace: "seo" });
	const baseUrl = serverEnv.app.address.replace(/\/$/, "");

	// Fetch related resources in parallel
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

	// JSON-LD Course Schema
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
			? { "@type": "Offer", price: "0", priceCurrency: "USD" }
			: course.price != null
				? {
						"@type": "Offer",
						price: course.price,
						priceCurrency: course.currency ?? "USD",
					}
				: undefined,
	};

	// JSON-LD Breadcrumb Schema
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

	// Construct dynamic FAQ schema if objectives/prerequisites exist
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

	return (
		<div className="mx-auto max-w-7xl px-4 py-8 mt-12 sm:px-6 lg:px-8">
			{/* JSON-LD scripts for SEO */}
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
			/>
			{faqJsonLd && (
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
				/>
			)}

			{/* Visual Breadcrumbs */}
			<Breadcrumb className="mb-6">
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink asChild>
							<Link href={routes.home.page()}>{s("home")}</Link>
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink asChild>
							<Link href={routes.courses.page()}>{s("courses")}</Link>
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage>{course.title}</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			<CourseDetailClient
				courseId={course.id}
				userId={userId}
				course={course as CourseDetail}
			/>

			{/* Fallback Educational Content for Thin description */}
			{!course.description && (
				<div className="mt-12 grid grid-cols-1 gap-8 border-t border-slate-100 pt-10 md:grid-cols-2">
					{course.learning_objectives &&
						course.learning_objectives.length > 0 && (
							<div className="rounded-xl border border-slate-100 bg-slate-50/50 p-6">
								<h3 className="text-base font-semibold text-slate-900 mb-3">
									{s("faqObjectives")}
								</h3>
								<ul className="list-disc list-inside text-sm text-slate-600 space-y-1.5">
									{course.learning_objectives.map((obj, i) => (
										<li key={i}>{obj}</li>
									))}
								</ul>
							</div>
						)}
					{course.prerequisites && course.prerequisites.length > 0 && (
						<div className="rounded-xl border border-slate-100 bg-slate-50/50 p-6">
							<h3 className="text-base font-semibold text-slate-900 mb-3">
								{s("faqPrerequisites")}
							</h3>
							<ul className="list-disc list-inside text-sm text-slate-600 space-y-1.5">
								{course.prerequisites.map((prereq, i) => (
									<li key={i}>{prereq}</li>
								))}
							</ul>
						</div>
					)}
				</div>
			)}

			{/* Related resources section */}
			{(relatedDecks.length > 0 ||
				relatedQuizzes.length > 0 ||
				relatedBooks.length > 0) && (
				<div className="mt-16 border-t border-slate-200/80 pt-10">
					<h2 className="text-xl font-bold tracking-tight text-slate-900 mb-6">
						{s("relatedResources")}
					</h2>
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
				</div>
			)}

			{/* Reviews Section — below related resources, above discussions */}
			<div className="mt-16 border-t border-slate-200/80 pt-10">
				<ReviewsSection
					target={{ type: "course", id: course.id }}
					averageRating={course.average_rating}
					totalReviews={course.total_reviews}
					userId={userId}
					canReview={!!course.enrollment}
				/>
			</div>

			{/* Course Public Read-Only Discussions Section */}
			<div className="mt-16 border-t border-slate-200/80 pt-10">
				<h2 className="text-xl font-bold tracking-tight text-slate-900 mb-6">
					{s("discussions", { defaultValue: "Course Discussions" })}
				</h2>
				<ResourceDiscussionView
					resource_type="course"
					resource_id={course.id}
					publicView={true}
				/>
			</div>
		</div>
	);
}

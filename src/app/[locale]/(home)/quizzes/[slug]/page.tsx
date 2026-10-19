import { ArrowLeft, ClipboardList, Clock, Repeat, Target } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BookmarkButton } from "@/components/blocks/bookmarks";
import { CatalogCourseCard } from "@/components/blocks/course";
import { PublicDeckCard } from "@/components/blocks/decks/public-deck-card";
import { ResourceDiscussionView } from "@/components/blocks/discussions/ResourceDiscussionView";
import { Badge } from "@/components/ui/badge";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildEntityMetadata } from "@/features/seo";
import { Link } from "@/i18n/navigation";
import { serverEnv } from "@/lib/env/server-env";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { decodeSlugParam } from "@/lib/utils";
import { BaseParams } from "@/types/common.types";
import { QuizDetail } from "@/types/queries.types";
import { QuizDetailActions } from "./_components/quiz-detail-actions";

export const revalidate = 86400;

async function fetchPublicQuiz(rawSlug: string) {
	const slug = decodeSlugParam(rawSlug);
	const client = await createClient();
	const { data, error } = await client
		.rpc("get_quiz_details", { p_quiz_slug: slug })
		.single();

	if (error || !data || data.visibility !== "public") return null;
	return data as QuizDetail;
}

export async function generateMetadata({
	params,
}: {
	params: Promise<BaseParams & { slug: string }>;
}) {
	const { slug, locale } = await params;
	const quiz = await fetchPublicQuiz(slug);
	if (!quiz) return {};

	const t = await getTranslations({ locale, namespace: "quizzes" });

	return buildEntityMetadata({
		seoTitle: quiz.seo_title,
		seoDescription: quiz.seo_description,
		fallbackTitle: `${quiz.title} | ${t("title")}`,
		fallbackDescription: quiz.description || t("description"),
		path: routes.quizzes.slug.page({ slug: quiz.slug ?? quiz.id }),
		locale,
	});
}

export default async function QuizDetailPage({
	params,
}: {
	params: Promise<BaseParams & { slug: string }>;
}) {
	const { slug, locale } = await params;
	setRequestLocale(locale);

	const quiz = await fetchPublicQuiz(slug);
	if (!quiz) {
		notFound();
	}

	const supabase = await createClient();
	const t = await getTranslations({ locale, namespace: "quizzes" });
	const s = await getTranslations({ locale, namespace: "seo" });
	const baseUrl = serverEnv.app.address.replace(/\/$/, "");

	const schoolId = quiz.school_id;
	const selectedCourseIds = quiz.related_courses_ids || [];
	const selectedDeckIds = quiz.related_decks_ids || [];

	const [relatedCoursesRes, relatedDecksRes] = await Promise.all([
		supabase.rpc("get_related_courses", {
			p_related_ids: selectedCourseIds,
			p_school_id: schoolId || undefined,
			p_limit: 3,
		}),
		supabase.rpc("get_related_decks", {
			p_related_ids: selectedDeckIds,
			p_school_id: schoolId || undefined,
			p_limit: 3,
		}),
	]);

	const relatedCourses = relatedCoursesRes.data || [];
	const relatedDecks = relatedDecksRes.data || [];

	// JSON-LD Quiz Schema
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "Quiz",
		name: quiz.title,
		description: quiz.description || undefined,
		timeRequired:
			quiz.time_limit_minutes != null
				? `PT${quiz.time_limit_minutes}M`
				: undefined,
		publisher: {
			"@type": "Organization",
			name: "Abzar Kankor",
			url: baseUrl,
		},
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
				name: s("quizzes"),
				item: `${baseUrl}/${locale}/quizzes`,
			},
			{
				"@type": "ListItem",
				position: 3,
				name: quiz.title,
				item: `${baseUrl}/${locale}/quizzes/${quiz.slug ?? quiz.id}`,
			},
		],
	};

	return (
		<div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8 mt-12">
			{/* JSON-LD scripts for SEO */}
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
			/>

			{/* Visual Breadcrumbs */}
			<Breadcrumb className="mb-2">
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink asChild>
							<Link href={routes.home.page()}>{s("home")}</Link>
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink asChild>
							<Link href={routes.quizzes.page()}>{s("quizzes")}</Link>
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage>{quiz.title}</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			<div className="flex items-center justify-between gap-2">
				<Button
					asChild
					variant="ghost"
					size="sm"
					className="gap-2 text-muted-foreground hover:text-foreground"
				>
					<Link href={routes.quizzes.page()}>
						<ArrowLeft className="size-4 rtl:rotate-180" />
						{t("backToList")}
					</Link>
				</Button>
				<BookmarkButton itemType="quiz" itemId={quiz.id} />
			</div>

			<Card className="border-slate-200/80 shadow-md bg-white">
				<CardContent className="flex flex-col gap-6 p-6">
					<div className="flex items-start gap-3">
						<div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
							<ClipboardList className="size-6" />
						</div>
						<div className="min-w-0 flex-1">
							<h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
								{quiz.title}
							</h1>
							{quiz.description && (
								<p className="mt-2 text-sm leading-relaxed text-slate-600">
									{quiz.description}
								</p>
							)}
						</div>
					</div>

					{quiz.instructions && (
						<div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
							<h2 className="mb-1.5 text-sm font-semibold text-slate-900">
								{t("instructions")}
							</h2>
							<p className="text-sm leading-relaxed text-slate-600">
								{quiz.instructions}
							</p>
						</div>
					)}

					<div className="flex flex-wrap gap-1.5 border-t border-slate-100 pt-4">
						{quiz.time_limit_minutes != null && (
							<Badge variant="outline" className="gap-1 font-normal">
								<Clock className="size-3" />
								{t("timeLimitMinutes", { count: quiz.time_limit_minutes })}
							</Badge>
						)}
						{quiz.passing_score_percentage != null && (
							<Badge variant="outline" className="gap-1 font-normal">
								<Target className="size-3" />
								{t("passingScore", { percent: quiz.passing_score_percentage })}
							</Badge>
						)}
						{quiz.max_attempts != null && (
							<Badge variant="outline" className="gap-1 font-normal">
								<Repeat className="size-3" />
								{t("maxAttempts", { count: quiz.max_attempts })}
							</Badge>
						)}
						{quiz.is_free ? (
							<Badge
								variant="outline"
								className="gap-1 font-normal border-emerald-200 text-emerald-700"
							>
								{t("free")}
							</Badge>
						) : (
							<Badge className="gap-1 font-normal bg-[#1461B8] text-white">
								{t("priceCredits", { count: quiz.price_credits ?? 0 })}
							</Badge>
						)}
					</div>

					<div className="border-t border-slate-100 pt-4">
						<QuizDetailActions quiz={quiz} />
					</div>
				</CardContent>
			</Card>

			{/* Detailed study criteria context for thin pages */}
			<div className="rounded-xl border border-slate-100 bg-slate-50/50 p-6 flex flex-col gap-3">
				<h3 className="text-base font-semibold text-slate-900">
					{s("passingCriteria")}
				</h3>
				<p className="text-sm text-slate-600 leading-relaxed">
					{s("passingCriteriaText", {
						percent: quiz.passing_score_percentage ?? 50,
						count: quiz.max_attempts ?? 1,
					})}
					{quiz.time_limit_minutes != null && (
						<> {s("timeLimitText", { count: quiz.time_limit_minutes })}</>
					)}
				</p>
			</div>

			{/* Related resources section */}
			{(relatedCourses.length > 0 || relatedDecks.length > 0) && (
				<div className="mt-12 border-t border-slate-200/80 pt-10">
					<h2 className="text-xl font-bold tracking-tight text-slate-900 mb-6">
						{s("relatedResources")}
					</h2>
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{relatedCourses.map((course) => (
							<CatalogCourseCard
								key={course.id}
								course={course as any}
								href={routes.courses.slug.page({
									slug: course.slug ?? course.id,
								})}
							/>
						))}
						{relatedDecks.map((deck) => (
							<PublicDeckCard key={deck.id} deck={deck} />
						))}
					</div>
				</div>
			)}

			{/* Quiz Public Read-Only Discussions Section */}
			<div className="mt-12 border-t border-slate-200/80 pt-10">
				<h2 className="text-xl font-bold tracking-tight text-slate-900 mb-6">
					{s("discussions", { defaultValue: "Quiz Discussions" })}
				</h2>
				<ResourceDiscussionView
					resource_type="quiz"
					resource_id={quiz.id}
					publicView={true}
				/>
			</div>
		</div>
	);
}

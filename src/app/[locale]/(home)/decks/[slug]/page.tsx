import { ArrowLeft, Layers, Sparkles, SquareStack } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BookmarkButton } from "@/components/blocks/bookmarks";
import { CatalogCourseCard } from "@/components/blocks/course";
import { ResourceDiscussionView } from "@/components/blocks/discussions/ResourceDiscussionView";
import { LibraryCard } from "@/components/blocks/libraries/library-card";
import { ReviewsSection, StarRating } from "@/components/blocks/reviews";
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
import { DeckDetail } from "@/types/queries.types";
import { DeckDetailActions } from "./_components/deck-detail-actions";

export const revalidate = 86400;

async function fetchPublicDeck(rawSlug: string) {
	const slug = decodeSlugParam(rawSlug);
	const client = await createClient();
	const { data, error } = await client
		.rpc("get_deck_details", { p_deck_slug: slug })
		.single();

	if (error || !data || data.visibility !== "public") return null;
	return data as DeckDetail;
}

export async function generateMetadata({
	params,
}: {
	params: Promise<BaseParams & { slug: string }>;
}) {
	const { slug, locale } = await params;
	const deck = await fetchPublicDeck(slug);
	if (!deck) return {};

	const t = await getTranslations({ locale, namespace: "decks" });

	return buildEntityMetadata({
		seoTitle: deck.seo_title,
		seoDescription: deck.seo_description,
		fallbackTitle: `${deck.name} | ${t("title")}`,
		fallbackDescription: deck.description || t("description"),
		path: routes.decks.slug.page({ slug: deck.slug ?? deck.id }),
		locale,
	});
}

export default async function DeckDetailPage({
	params,
}: {
	params: Promise<BaseParams & { slug: string }>;
}) {
	const { slug, locale } = await params;
	setRequestLocale(locale);

	const deck = await fetchPublicDeck(slug);
	if (!deck) {
		notFound();
	}

	const supabase = await createClient();
	const { data: claims } = await supabase.auth.getClaims();
	const userId = claims?.claims.sub;

	const t = await getTranslations({ locale, namespace: "decks" });
	const s = await getTranslations({ locale, namespace: "seo" });
	const baseUrl = serverEnv.app.address.replace(/\/$/, "");

	// Fetch related resources (Courses and Books sharing the same book_id or manually selected)
	const bookId = deck.book?.id;

	const selectedCourseIds = deck.related_courses_ids || [];
	const selectedBookIds = deck.related_libraries_ids || [];

	const [relatedCoursesRes, relatedBooksRes] = await Promise.all([
		supabase.rpc("get_related_courses", {
			p_related_ids: selectedCourseIds,
			p_book_id: bookId || undefined,
			p_limit: 3,
		}),
		supabase.rpc("get_related_libraries", {
			p_related_ids: selectedBookIds,
			p_book_id: bookId || undefined,
			p_limit: 3,
		}),
	]);

	const relatedCourses = relatedCoursesRes.data || [];
	const relatedBooks = relatedBooksRes.data || [];

	// JSON-LD LearningResource Schema
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "LearningResource",
		name: deck.name,
		description: deck.description || undefined,
		learningResourceType: "Flashcard deck",
		isAccessibleForFree: deck.is_free,
		educationalLevel: deck.book?.name || undefined,
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
				name: s("decks"),
				item: `${baseUrl}/${locale}/decks`,
			},
			{
				"@type": "ListItem",
				position: 3,
				name: deck.name,
				item: `${baseUrl}/${locale}/decks/${deck.slug ?? deck.id}`,
			},
		],
	};

	// Construct dynamic FAQ schema for deck studies
	const faqQuestions = [
		{
			"@type": "Question",
			name: s("faqStudy"),
			acceptedAnswer: {
				"@type": "Answer",
				text: s("faqStudyAnswer"),
			},
		},
	];

	const faqJsonLd = {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		mainEntity: faqQuestions,
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
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
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
							<Link href={routes.decks.page()}>{s("decks")}</Link>
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage>{deck.name}</BreadcrumbPage>
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
					<Link href={routes.decks.page()}>
						<ArrowLeft className="size-4 rtl:rotate-180" />
						{t("backToHome")}
					</Link>
				</Button>
				<BookmarkButton itemType="deck" itemId={deck.id} />
			</div>

			<Card className="border-slate-200/80 shadow-md bg-white">
				<CardContent className="flex flex-col gap-6 p-6">
					<div className="flex items-start gap-3">
						<div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
							<Layers className="size-6" />
						</div>
						<div className="min-w-0 flex-1">
							<h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
								{deck.name}
							</h1>
							{deck.average_rating != null && deck.average_rating > 0 && (
								<div className="mt-1.5 flex items-center gap-2 text-sm">
									<StarRating value={deck.average_rating} size="sm" />
									<span className="font-semibold text-amber-600">
										{deck.average_rating.toFixed(1)}
									</span>
									{deck.total_reviews > 0 && (
										<span className="text-slate-500">
											({deck.total_reviews.toLocaleString()})
										</span>
									)}
								</div>
							)}
							{deck.description && (
								<p className="mt-2 text-sm leading-relaxed text-slate-600">
									{deck.description}
								</p>
							)}
						</div>
					</div>

					<div className="flex flex-wrap gap-1.5 border-t border-slate-100 pt-4">
						<Badge className="gap-1 font-normal">
							<SquareStack className="size-3" />
							{t("cardCount", { count: deck.total_flashcards })}
						</Badge>
						<Badge variant="outline" className="gap-1 font-normal">
							{t(`algorithm.${deck.algorithm}` as any)}
						</Badge>
						{deck.is_free ? (
							<Badge
								variant="outline"
								className="gap-1 font-normal border-emerald-200 text-emerald-700"
							>
								<Sparkles className="size-3" />
								{t("free")}
							</Badge>
						) : (
							<Badge className="gap-1 font-normal bg-[#1461B8] text-white">
								{t("priceCredits", { count: deck.price_credits ?? 0 })}
							</Badge>
						)}
						{deck.book?.name && (
							<Badge variant="outline" className="gap-1 font-normal">
								{deck.book.name}
							</Badge>
						)}
					</div>

					<div className="border-t border-slate-100 pt-4">
						<DeckDetailActions deck={deck} isEnrolled={!!deck.enrollment} />
					</div>
				</CardContent>
			</Card>

			{/* Fallback FAQ Section */}
			<div className="rounded-xl border border-slate-100 bg-slate-50/50 p-6">
				<h3 className="text-base font-semibold text-slate-900 mb-2">
					{s("faqStudy")}
				</h3>
				<p className="text-sm text-slate-600 leading-relaxed">
					{s("faqStudyAnswer")}
				</p>
			</div>

			{/* Related resources section */}
			{(relatedCourses.length > 0 || relatedBooks.length > 0) && (
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
						{relatedBooks.map((book) => (
							<LibraryCard key={book.id} book={book as any} />
						))}
					</div>
				</div>
			)}

			{/* Reviews Section — below related resources, above discussions */}
			<div className="mt-12 border-t border-slate-200/80 pt-10">
				<ReviewsSection
					target={{ type: "deck", id: deck.id }}
					averageRating={deck.average_rating}
					totalReviews={deck.total_reviews}
					userId={userId}
					canReview={!!deck.enrollment}
				/>
			</div>

			{/* Deck Public Read-Only Discussions Section */}
			<div className="mt-12 border-t border-slate-200/80 pt-10">
				<h2 className="text-xl font-bold tracking-tight text-slate-900 mb-6">
					{s("discussions", { defaultValue: "Deck Discussions" })}
				</h2>
				<ResourceDiscussionView
					resource_type="deck"
					resource_id={deck.id}
					publicView={true}
				/>
			</div>
		</div>
	);
}

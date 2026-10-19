import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CatalogCourseCard } from "@/components/blocks/course";
import { PublicDeckCard } from "@/components/blocks/decks/public-deck-card";
import { ResourceDiscussionView } from "@/components/blocks/discussions/ResourceDiscussionView";
import { LibraryDetailView } from "@/components/blocks/libraries";
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
import { LibraryDetail } from "@/types/queries.types";

export const revalidate = 86400;

async function fetchLibraryBook(rawSlug: string) {
	const slug = decodeSlugParam(rawSlug);
	const client = await createClient();
	const { data, error } = await client
		.rpc("get_library_details", { p_library_slug: slug })
		.single();

	if (error || !data) return null;
	return data as LibraryDetail;
}

// SEO Metadata Generation
export async function generateMetadata({
	params,
}: {
	params: Promise<BaseParams & { slug: string }>;
}) {
	const { slug, locale } = await params;
	const book = await fetchLibraryBook(slug);
	if (!book) return {};

	const t = await getTranslations({ locale, namespace: "libraries" });

	return buildEntityMetadata({
		seoTitle: book.seo_title,
		seoDescription: book.seo_description,
		fallbackTitle: `${book.title} | ${t("title")}`,
		fallbackDescription: book.desc || t("description"),
		path: routes.libraries.slug.page({ slug: book.slug ?? book.id }),
		locale,
	});
}

export default async function LibraryDetailPage({
	params,
}: {
	params: Promise<BaseParams & { slug: string }>;
}) {
	const { slug, locale } = await params;
	setRequestLocale(locale);

	const book = await fetchLibraryBook(slug);
	if (!book) {
		notFound();
	}

	const supabase = await createClient();
	const t = await getTranslations({ locale, namespace: "libraries" });
	const s = await getTranslations({ locale, namespace: "seo" });
	const baseUrl = serverEnv.app.address.replace(/\/$/, "");

	// Fetch related resources (Courses and Decks matching book_id/subject_id or manually selected)
	const bookId = book.book?.id;
	const subjectId = book.subject?.id;
	const gradeId = book.grade?.id;

	const selectedCourseIds = book.related_courses_ids || [];
	const selectedDeckIds = book.related_decks_ids || [];

	const [relatedCoursesRes, relatedDecksRes] = await Promise.all([
		supabase.rpc("get_related_courses", {
			p_related_ids: selectedCourseIds,
			p_book_id: bookId || undefined,
			p_subject_id: subjectId || undefined,
			p_grade_id: gradeId || undefined,
			p_limit: 3,
		}),
		supabase.rpc("get_related_decks", {
			p_related_ids: selectedDeckIds,
			p_book_id: bookId || undefined,
			p_subject_id: subjectId || undefined,
			p_grade_id: gradeId || undefined,
			p_limit: 3,
		}),
	]);

	const relatedCourses = relatedCoursesRes.data || [];
	const relatedDecks = relatedDecksRes.data || [];

	// JSON-LD Book Schema
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "Book",
		name: book.title,
		description: book.desc,
		inLanguage: locale,
		dateModified: book.updated_at,
		dateCreated: book.created_at,
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
				name: s("libraries"),
				item: `${baseUrl}/${locale}/libraries`,
			},
			{
				"@type": "ListItem",
				position: 3,
				name: book.title,
				item: `${baseUrl}/${locale}/libraries/${book.slug ?? book.id}`,
			},
		],
	};

	return (
		<div className="mx-auto max-w-7xl px-4 py-8 mt-12 sm:px-6 lg:px-8">
			{/* JSON-LD for SEO */}
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
			/>

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
							<Link href={routes.libraries.page()}>{s("libraries")}</Link>
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage>{book.title}</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			<LibraryDetailView
				book={book}
				backHref={routes.libraries.page()}
				backLabel={t("backToList")}
			/>

			{/* Related resources section */}
			{(relatedCourses.length > 0 || relatedDecks.length > 0) && (
				<div className="mt-16 border-t border-slate-200/80 pt-10">
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

			{/* Library Public Read-Only Discussions Section */}
			<div className="mt-16 border-t border-slate-200/80 pt-10">
				<h2 className="text-xl font-bold tracking-tight text-slate-900 mb-6">
					{s("discussions", { defaultValue: "Book Discussions" })}
				</h2>
				<ResourceDiscussionView
					resource_type="library"
					resource_id={book.id}
					publicView={true}
				/>
			</div>
		</div>
	);
}

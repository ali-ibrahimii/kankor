import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LibraryDetailView } from "@/components/blocks/libraries";
import { buildEntityMetadata } from "@/features/seo";
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
		path: routes.d.library.slug.page({ slug: book.slug ?? book.id }),
		locale,
	});
}

export default async function StudentLibraryDetailPage({
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

	const t = await getTranslations({ locale, namespace: "libraries" });

	// JSON-LD structured data for SEO
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "Book",
		name: book.title,
		description: book.desc,
		inLanguage: locale,
		dateModified: book.updated_at,
		dateCreated: book.created_at,
	};

	return (
		<>
			{/* JSON-LD for SEO */}
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			<LibraryDetailView
				book={book}
				backHref={routes.d.library.page()}
				backLabel={t("backToList")}
			/>
		</>
	);
}

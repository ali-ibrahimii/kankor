import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LibraryDetailView } from "@/components/blocks/libraries";
import { createClient } from "@/lib/supabase/server";
import { decodeSlugParam } from "@/lib/utils";
import type { BaseParams } from "@/types/common.types";
import type { LibraryDetail } from "@/types/queries.types";
import { AdminLibraryTabs } from "./tabs-container";

export const revalidate = 0; // Admin page should not cache / be static, it needs fresh updates

async function fetchLibraryBook(rawSlug: string) {
	const slug = decodeSlugParam(rawSlug);
	const client = await createClient();
	const { data, error } = await client
		.rpc("get_library_details", { p_library_slug: slug })
		.single();

	if (error || !data) return null;
	return data as LibraryDetail;
}

export default async function AdminLibraryDetailPage({
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

	const previewElement = (
		<LibraryDetailView
			book={book}
			backHref="/d/admin/libraries"
			backLabel={t("backToList")}
		/>
	);

	return <AdminLibraryTabs book={book} previewElement={previewElement} />;
}

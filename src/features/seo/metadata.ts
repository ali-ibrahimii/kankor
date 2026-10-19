import type { Metadata } from "next";
import { locales } from "@/i18n";

export type BuildEntityMetadataArgs = {
	/** Row's `seo_title` column — takes priority when present. */
	seoTitle?: string | null;
	/** Row's `seo_description` column — takes priority when present. */
	seoDescription?: string | null;
	/** Used when `seoTitle` is empty. Should already include any branding suffix. */
	fallbackTitle: string;
	/** Used when `seoDescription` is empty. */
	fallbackDescription?: string | null;
	/** Unlocalized pathname, e.g. `/courses/my-slug`. */
	path: string;
	locale: string;
	/** Dynamic cover image URL for OG/Twitter sharing. */
	coverImage?: string | null;
	/** Keywords list specific to the resource. */
	keywords?: string[] | null;
};

const ogLocaleMap: Record<string, string> = {
	en: "en_US",
	fa: "fa_IR",
	ps: "ps_AF",
};

/**
 * Builds page metadata for a public entity detail page (course/deck/library/quiz),
 * applying the `seo_title`/`seo_description` columns with a fallback to the
 * entity's own title/name + description whenever the SEO columns are empty.
 * Configures localized hreflang alternates, OpenGraph/Twitter cards, and indexing flags.
 */
export function buildEntityMetadata({
	seoTitle,
	seoDescription,
	fallbackTitle,
	fallbackDescription,
	path,
	locale,
	coverImage,
	keywords,
}: BuildEntityMetadataArgs): Metadata {
	const title = seoTitle?.trim() || fallbackTitle;
	const description =
		seoDescription?.trim() || fallbackDescription || undefined;
	const canonical = `/${locale}${path}`;
	const ogLocale = ogLocaleMap[locale] ?? "en_US";

	// Generate localized alternate links for all supported languages
	const languages: Record<string, string> = {};
	for (const l of locales) {
		languages[l] = `/${l}${path}`;
	}
	languages["x-default"] = `/fa${path}`; // Dari/Persian (fa) is the default locale

	const imageSrc = coverImage || "/og-image.png";

	return {
		title,
		description,
		keywords: keywords || undefined,
		alternates: {
			canonical,
			languages,
		},
		openGraph: {
			title,
			description,
			type: "article",
			url: canonical,
			locale: ogLocale,
			images: [
				{
					url: imageSrc,
					alt: title,
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
			images: [imageSrc],
		},
		robots: {
			index: true,
			follow: true,
			googleBot: {
				index: true,
				follow: true,
				"max-video-preview": -1,
				"max-image-preview": "large",
				"max-snippet": -1,
			},
		},
	};
}

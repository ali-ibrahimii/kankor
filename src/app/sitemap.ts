import type { MetadataRoute } from "next";
import { locales } from "@/i18n";
import { serverEnv } from "@/lib/env/server-env";
import { createClient } from "@/lib/supabase/server";

export async function generateSitemaps() {
	return [
		{ id: "static" },
		{ id: "courses" },
		{ id: "decks" },
		{ id: "libraries" },
		{ id: "quizzes" },
	];
}

export default async function sitemap(props: {
	id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
	const id = await props.id;
	const baseUrl = serverEnv.app.address.replace(/\/$/, "");
	const supabase = await createClient();
	const sitemapEntries: MetadataRoute.Sitemap = [];

	// Helper to add dynamic entries
	const addDynamicEntries = (
		items: { slug: string | null; updated_at?: string | null }[],
		pathPrefix: string,
		priority: number
	) => {
		for (const item of items) {
			if (!item.slug) continue;
			const path = `${pathPrefix}/${item.slug}`;

			for (const locale of locales) {
				const localizedUrl = `${baseUrl}/${locale}${path}`;
				const languages: Record<string, string> = {};
				for (const l of locales) {
					languages[l] = `${baseUrl}/${l}${path}`;
				}
				languages["x-default"] = `${baseUrl}/fa${path}`;

				sitemapEntries.push({
					url: localizedUrl,
					lastModified: item.updated_at
						? new Date(item.updated_at)
						: new Date(),
					changeFrequency: "weekly",
					priority,
					alternates: {
						languages,
					},
				});
			}
		}
	};

	switch (id) {
		case "static": {
			const staticRoutes = [
				"",
				"/privacy-policy",
				"/terms-of-use",
				"/delete-account",
				"/courses",
				"/decks",
				"/libraries",
				"/quizzes",
				"/verify",
			];

			for (const route of staticRoutes) {
				for (const locale of locales) {
					const localizedUrl = `${baseUrl}/${locale}${route}`;
					const languages: Record<string, string> = {};
					for (const l of locales) {
						languages[l] = `${baseUrl}/${l}${route}`;
					}
					languages["x-default"] = `${baseUrl}/fa${route}`;

					sitemapEntries.push({
						url: localizedUrl,
						lastModified: new Date(),
						changeFrequency: route === "" ? "daily" : "weekly",
						priority: route === "" ? 1.0 : 0.7,
						alternates: {
							languages,
						},
					});
				}
			}
			break;
		}

		case "courses": {
			const { data: courses } = await supabase
				.from("courses")
				.select("slug, updated_at")
				.eq("is_published", true);
			if (courses) {
				addDynamicEntries(courses, "/courses", 0.6);
			}
			break;
		}

		case "decks": {
			const { data: decks } = await supabase
				.from("decks")
				.select("slug, updated_at")
				.eq("visibility", "public");
			if (decks) {
				addDynamicEntries(decks, "/decks", 0.5);
			}
			break;
		}

		case "libraries": {
			const { data: libraries } = await supabase
				.from("libraries")
				.select("slug, updated_at");
			if (libraries) {
				addDynamicEntries(libraries, "/libraries", 0.5);
			}
			break;
		}

		case "quizzes": {
			const { data: quizzes } = await supabase
				.from("quizzes")
				.select("slug, updated_at")
				.eq("visibility", "public");
			if (quizzes) {
				addDynamicEntries(quizzes, "/quizzes", 0.5);
			}
			break;
		}
	}

	return sitemapEntries;
}

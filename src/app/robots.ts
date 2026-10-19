import type { MetadataRoute } from "next";
import { serverEnv } from "@/lib/env/server-env";

export default function robots(): MetadataRoute.Robots {
	const baseUrl = serverEnv.app.address.replace(/\/$/, "");

	return {
		rules: {
			userAgent: "*",
			allow: "/",
			disallow: [
				"/*/d/", // Disallow localized dashboard routes (e.g. /fa/d/...)
				"/d/", // Disallow dashboard root if visited directly
				"/*/auth/", // Disallow auth routes (signup, login redirects, magic links, etc.)
				"/auth/",
				"/*/watch/", // Disallow internal watch pages
				"/watch/",
				"/*/api/", // Disallow api calls
				"/api/",
			],
		},
		sitemap: [
			`${baseUrl}/sitemap/static.xml`,
			`${baseUrl}/sitemap/courses.xml`,
			`${baseUrl}/sitemap/decks.xml`,
			`${baseUrl}/sitemap/libraries.xml`,
			`${baseUrl}/sitemap/quizzes.xml`,
		],
	};
}

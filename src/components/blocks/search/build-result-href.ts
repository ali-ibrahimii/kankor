import { routes } from "@/lib/routes";

export type SearchResultType = "course" | "library" | "deck" | "quiz";

export function buildResultHref(resultType: SearchResultType, slug: string) {
	switch (resultType) {
		case "course":
			return routes.courses.slug.page({ slug });
		case "library":
			return routes.libraries.slug.page({ slug });
		case "deck":
			return routes.decks.slug.page({ slug });
		case "quiz":
			return routes.quizzes.slug.page({ slug });
	}
}

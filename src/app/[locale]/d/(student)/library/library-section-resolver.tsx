"use client";

import { useSearchParams } from "next/navigation";
import {
	LibraryCatalog,
	type LibrarySection,
} from "@/components/blocks/libraries";

const VALID_SECTIONS: LibrarySection[] = ["fields", "studies", "more"];

/**
 * Reads `?section=` from the URL to pick the library's initial category
 * filter.
 *
 * It has to be a separate client component: `useSearchParams` opts a
 * component out of static prerendering, so it must live *below* a Suspense
 * boundary for the route to build.
 */
export function LibrarySectionResolver() {
	const searchParams = useSearchParams();

	const rawSection = searchParams.get("section");
	const section = VALID_SECTIONS.includes(rawSection as LibrarySection)
		? (rawSection as LibrarySection)
		: undefined;

	return <LibraryCatalog fixedCategoryFilter={section} />;
}

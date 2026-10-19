"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import {
	LibraryCatalog,
	type LibrarySection,
} from "@/components/blocks/libraries";

const VALID_SECTIONS: LibrarySection[] = ["fields", "studies", "more"];

export default function StudentLibraryPage() {
	const t = useTranslations("libraries");
	const searchParams = useSearchParams();

	const rawSection = searchParams.get("section");
	const section = VALID_SECTIONS.includes(rawSection as LibrarySection)
		? (rawSection as LibrarySection)
		: undefined;

	return (
		<div className="flex flex-col gap-6 p-6">
			<div>
				<h1 className="text-xl font-bold">{t("title")}</h1>
				<p className="mt-0.5 text-sm text-muted-foreground">
					{t("description")}
				</p>
			</div>

			<LibraryCatalog fixedCategoryFilter={section} />
		</div>
	);
}

import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FlashcardBuilder } from "@/components/blocks/flashcard-builder";
import { loadDeckWithFlashcards } from "@/components/blocks/flashcard-builder/actions";
import { decodeSlugParam } from "@/lib/utils";

export default async function StudentDeckBuilderPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug: rawSlug } = await params;
	const slug = decodeSlugParam(rawSlug);

	const result = await loadDeckWithFlashcards(slug);
	if (!result.success || !result.data.isOwner) notFound();

	const { deck, flashcards } = result.data;

	return (
		<FlashcardBuilder
			deckId={deck.id}
			initialDeck={deck}
			initialFlashcards={flashcards}
			basePath="/d"
		/>
	);
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug: rawSlug } = await params;
	const slug = decodeSlugParam(rawSlug);
	const t = await getTranslations("flashcardBuilder");
	const result = await loadDeckWithFlashcards(slug);
	const name =
		result.success && result.data.isOwner ? result.data.deck.name : "";
	return {
		title: name ? `${t("meta.editDeck")} — ${name}` : t("meta.newDeck"),
	};
}

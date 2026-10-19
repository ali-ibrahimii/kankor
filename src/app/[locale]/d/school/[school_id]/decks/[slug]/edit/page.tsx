import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FlashcardBuilder } from "@/components/blocks/flashcard-builder";
import { loadDeckWithFlashcards } from "@/components/blocks/flashcard-builder/actions";

export default async function SchoolDeckBuilderPage({
	params,
}: {
	params: Promise<{ school_id: string; slug: string }>;
}) {
	const { school_id, slug } = await params;

	const result = await loadDeckWithFlashcards(slug);
	if (!result.success) notFound();

	const { deck, flashcards } = result.data;

	return (
		<FlashcardBuilder
			deckId={deck.id}
			initialDeck={deck}
			initialFlashcards={flashcards}
			basePath={`/d/school/${school_id}`}
		/>
	);
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ school_id: string; slug: string }>;
}) {
	const { slug } = await params;
	const t = await getTranslations("flashcardBuilder");
	const result = await loadDeckWithFlashcards(slug);
	const name = result.success ? result.data.deck.name : "";
	return {
		title: name ? `${t("meta.editDeck")} — ${name}` : t("meta.newDeck"),
	};
}

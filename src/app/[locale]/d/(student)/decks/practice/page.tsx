import { getTranslations } from "next-intl/server";
import { PracticePageBlock } from "@/components/blocks/spaced-repitation";
import {
	getActiveLearningDecks,
	getStudySession,
} from "@/components/blocks/spaced-repitation/queries";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata() {
	const t = await getTranslations("spacedRepetition.meta");
	return { title: t("title") };
}

interface PracticePageProps {
	searchParams: Promise<{ deck?: string | string[] }>;
}

export default async function PracticePage({
	searchParams,
}: PracticePageProps) {
	const [{ deck }, supabase] = await Promise.all([
		searchParams,
		createClient(),
	]);

	const { data: claims } = await supabase.auth.getClaims();
	const userId = claims?.claims?.sub;
	if (!userId) {
		return (
			<PracticePageBlock
				activeDecks={[]}
				selectedDeckId={null}
				session={null}
			/>
		);
	}

	const activeDecks = await getActiveLearningDecks(userId);

	// ?deck=… wins when it points at an enrolled deck; otherwise fall back to
	// the most recently enrolled one.
	const requestedDeckId = Array.isArray(deck) ? deck[0] : deck;
	const selectedDeckId =
		activeDecks.find((d) => d.deckId === requestedDeckId)?.deckId ??
		activeDecks[0]?.deckId ??
		null;

	const session = selectedDeckId
		? await getStudySession(userId, selectedDeckId)
		: null;

	return (
		<PracticePageBlock
			activeDecks={activeDecks}
			selectedDeckId={selectedDeckId}
			session={session}
		/>
	);
}

import { getTranslations } from "next-intl/server";
import { EnrolledDeckCard } from "@/components/blocks/spaced-repitation";
import { getActiveLearningDecks } from "@/components/blocks/spaced-repitation/queries";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { routes } from "@/lib/routes";

export default async function MyDecksPage() {
	const [t, user] = await Promise.all([
		getTranslations("spacedRepetition"),
		getCurrentUser(),
	]);

	const decks = user ? await getActiveLearningDecks(user.id) : [];

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div>
				<h1 className="text-xl font-bold">{t("myDecks.title")}</h1>
				{decks.length > 0 && (
					<p className="mt-0.5 text-sm text-muted-foreground">
						{t("myDecks.deckCount", { count: decks.length })}
					</p>
				)}
			</div>

			{/* Grid */}
			{decks.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 py-20 text-center">
					<p className="text-sm font-medium">{t("empty.title")}</p>
					<p className="text-xs text-muted-foreground">{t("empty.subtitle")}</p>
					<Button asChild size="sm" variant="outline" className="mt-2">
						<Link href={routes.d.decks.page()}>{t("empty.action")}</Link>
					</Button>
				</div>
			) : (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{decks.map((deck) => (
						<EnrolledDeckCard key={deck.deckId} deck={deck} />
					))}
				</div>
			)}
		</div>
	);
}

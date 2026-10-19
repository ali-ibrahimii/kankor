"use client";

import { Provider, useAtomValue, useSetAtom } from "jotai";
import {
	ArrowLeftIcon,
	BookOpenIcon,
	GlobeIcon,
	LockIcon,
	PlusIcon,
	Settings2Icon,
	UsersIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DeckEditSheet } from "./deck-edit-sheet";
import { FlashcardCard } from "./flashcard-card";
import { FlashcardDialog } from "./flashcard-dialog";
import {
	addFlashcardAtom,
	deckAtom,
	flashcardsAtom,
	initFlashcardBuilderAtom,
	removeFlashcardAtom,
	updateFlashcardAtom,
} from "./store";
import type { DeckDetails, DraftFlashcard } from "./types";

// ─── Visibility icon helper ───────────────────────────────────────────────────

function VisibilityIcon({
	visibility,
}: {
	visibility: DeckDetails["visibility"];
}) {
	if (visibility === "public") return <GlobeIcon className="size-3" />;
	if (visibility === "classmate") return <UsersIcon className="size-3" />;
	return <LockIcon className="size-3" />;
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
	const t = useTranslations("flashcardBuilder");
	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
			<div className="flex size-16 items-center justify-center rounded-full bg-muted">
				<BookOpenIcon className="size-8 text-muted-foreground" />
			</div>
			<div>
				<p className="font-medium">{t("builder.emptyTitle")}</p>
				<p className="mt-1 text-sm text-muted-foreground">
					{t("builder.emptyDescription")}
				</p>
			</div>
			<Button onClick={onAdd}>
				<PlusIcon className="size-4 me-1.5" />
				{t("builder.addFirst")}
			</Button>
		</div>
	);
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface FlashcardBuilderProps {
	deckId: string;
	initialDeck: DeckDetails;
	initialFlashcards: DraftFlashcard[];
	/** Route prefix for back navigation, e.g. "/d/instructor" */
	basePath: string;
}

// ─── Inner builder (inside Jotai Provider) ────────────────────────────────────

function FlashcardBuilderInner({ basePath }: { basePath: string }) {
	const t = useTranslations("flashcardBuilder");
	const router = useRouter();

	const deck = useAtomValue(deckAtom);
	const flashcards = useAtomValue(flashcardsAtom);
	const addFlashcard = useSetAtom(addFlashcardAtom);
	const updateFlashcard = useSetAtom(updateFlashcardAtom);
	const removeFlashcard = useSetAtom(removeFlashcardAtom);

	const [sheetOpen, setSheetOpen] = React.useState(false);
	const [dialogOpen, setDialogOpen] = React.useState(false);
	const [editingCard, setEditingCard] = React.useState<
		DraftFlashcard | undefined
	>(undefined);

	function openAddDialog() {
		setEditingCard(undefined);
		setDialogOpen(true);
	}

	function openEditDialog(flashcard: DraftFlashcard) {
		setEditingCard(flashcard);
		setDialogOpen(true);
	}

	function handleSaved(saved: DraftFlashcard) {
		if (editingCard) {
			updateFlashcard({ id: saved.id, patch: saved });
		} else {
			addFlashcard(saved);
		}
	}

	return (
		<div className="flex h-screen flex-col overflow-hidden">
			{/* Header */}
			<header className="flex shrink-0 items-center gap-3 border-b px-4 py-2.5">
				<Button
					variant="ghost"
					size="icon"
					className="size-8"
					onClick={() => router.push(`${basePath}/decks`)}
					aria-label={t("header.back")}
				>
					<ArrowLeftIcon className="size-4" />
				</Button>

				<Separator orientation="vertical" className="h-5" />

				<div className="flex-1 min-w-0">
					<h1 className="truncate text-sm font-semibold">{deck.name}</h1>
				</div>

				<div className="flex items-center gap-2">
					<Badge variant="outline" className="gap-1 text-xs">
						<VisibilityIcon visibility={deck.visibility} />
						{t(`visibility.${deck.visibility}`)}
					</Badge>
					<Badge variant="secondary" className="text-xs">
						{t(`algorithm.${deck.algorithm}`)}
					</Badge>
				</div>

				<Separator orientation="vertical" className="h-5" />

				<Button
					variant="outline"
					size="sm"
					onClick={() => setSheetOpen(true)}
					aria-label={t("header.settings")}
				>
					<Settings2Icon className="size-4 me-1.5" />
					{t("header.settings")}
				</Button>

				<Button size="sm" onClick={openAddDialog}>
					<PlusIcon className="size-4 me-1.5" />
					{t("header.addCard")}
				</Button>
			</header>

			{/* Card count sub-header */}
			<div className="shrink-0 border-b bg-muted/30 px-6 py-2 text-xs text-muted-foreground">
				{t("builder.cardCount", { count: flashcards.length })}
			</div>

			{/* Content */}
			<main className="flex-1 overflow-y-auto p-6">
				{flashcards.length === 0 ? (
					<EmptyState onAdd={openAddDialog} />
				) : (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{flashcards.map((fc) => (
							<FlashcardCard
								key={fc.id}
								flashcard={fc}
								onEdit={openEditDialog}
								onDeleted={removeFlashcard}
							/>
						))}

						{/* Add card button */}
						<button
							type="button"
							onClick={openAddDialog}
							className="flex min-h-32 items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							<span className="flex flex-col items-center gap-2">
								<PlusIcon className="size-6" />
								{t("builder.addCard")}
							</span>
						</button>
					</div>
				)}
			</main>

			{/* Deck edit sheet */}
			<DeckEditSheet open={sheetOpen} onOpenChange={setSheetOpen} />

			{/* Flashcard add/edit dialog */}
			<FlashcardDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				deckId={deck.id}
				flashcard={editingCard}
				onSaved={handleSaved}
			/>
		</div>
	);
}

// ─── Root wrapper (provides Jotai store) ─────────────────────────────────────

export function FlashcardBuilder({
	deckId,
	initialDeck,
	initialFlashcards,
	basePath,
}: FlashcardBuilderProps) {
	return (
		<Provider>
			<FlashcardBuilderInit
				deckId={deckId}
				initialDeck={initialDeck}
				initialFlashcards={initialFlashcards}
				basePath={basePath}
			/>
		</Provider>
	);
}

// ─── Initializer (inside Provider) ───────────────────────────────────────────

function FlashcardBuilderInit({
	deckId,
	initialDeck,
	initialFlashcards,
	basePath,
}: FlashcardBuilderProps) {
	const initBuilder = useSetAtom(initFlashcardBuilderAtom);
	const [ready, setReady] = React.useState(false);

	React.useEffect(() => {
		initBuilder({ deck: initialDeck, flashcards: initialFlashcards });
		setReady(true);
	}, [deckId]); // eslint-disable-line react-hooks/exhaustive-deps

	if (!ready) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
			</div>
		);
	}

	return <FlashcardBuilderInner basePath={basePath} />;
}

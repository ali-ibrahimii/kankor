"use client";

import { CardNavigation } from "./card-navigation";
import { FlipCard } from "./flip-card";
import { GradeButtons } from "./grade-buttons";
import { useKeyboardShortcuts, useStudySession } from "./hooks";
import { AllCaughtUp, SessionComplete } from "./session-states";
import { SessionStats } from "./session-stats";
import type { StudySession } from "./types";

export interface StudyAreaProps {
	session: StudySession;
}

/** The study loop: stats, flipping card, grade buttons, and navigation. */
export function StudyArea({ session }: StudyAreaProps) {
	const study = useStudySession(session);

	useKeyboardShortcuts({
		enabled: study.hasCards && !study.isComplete,
		isFlipped: study.isFlipped,
		onFlip: study.flip,
		onGrade: study.grade,
		onPrev: study.goPrev,
		onNext: study.goNext,
	});

	if (!study.hasCards) {
		return <AllCaughtUp />;
	}

	if (study.isComplete) {
		return (
			<SessionComplete
				stats={study.stats}
				reviewedCount={study.progress.done}
			/>
		);
	}

	const current = study.current;
	if (!current) return null;

	return (
		<div className="flex flex-col gap-6">
			<SessionStats progress={study.progress} remaining={study.remaining} />

			<FlipCard
				key={current.queueId}
				flashcard={current.card.flashcard}
				status={current.card.scheduling.status}
				isFlipped={study.isFlipped}
				onFlip={study.flip}
				gradedAs={current.grade}
			/>

			{/* Quality buttons only make sense once the answer is visible. */}
			{study.isFlipped && current.grade === null && (
				<GradeButtons
					previews={study.previews}
					disabled={study.isSubmitting}
					onGrade={study.grade}
				/>
			)}

			<CardNavigation
				canGoPrev={study.canGoPrev}
				canGoNext={study.canGoNext}
				onPrev={study.goPrev}
				onNext={study.goNext}
			/>
		</div>
	);
}

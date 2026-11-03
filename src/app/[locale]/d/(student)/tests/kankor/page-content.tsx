"use client";

import { useMessages } from "next-intl";
import * as React from "react";
import { KankorExam } from "./_components/kankor-exam";
import { buildKankorExam } from "./_data/kankor-exam";

export function KankorExamPageContent() {
	const messages = useMessages() as {
		content?: { kankorExam?: { questions?: unknown } };
	};

	const exam = React.useMemo(
		() => buildKankorExam(messages.content?.kankorExam?.questions),
		[messages]
	);

	if (exam.questions.length === 0) {
		return (
			<div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-muted-foreground">
				—
			</div>
		);
	}

	return <KankorExam exam={exam} />;
}

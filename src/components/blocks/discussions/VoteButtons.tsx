"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { voteDiscussionAction } from "@/lib/actions/discussions";
import { cn } from "@/lib/utils";

interface VoteButtonsProps {
	target_type: "thread" | "post";
	target_id: string;
	initialScore: number;
	initialUserVote?: number;
	className?: string;
	disabled?: boolean;
}

export function VoteButtons({
	target_type,
	target_id,
	initialScore,
	initialUserVote = 0,
	className,
	disabled = false,
}: VoteButtonsProps) {
	const [score, setScore] = useState(initialScore);
	const [userVote, setUserVote] = useState<number>(initialUserVote);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleVote = async (desiredVote: 1 | -1) => {
		if (disabled || isSubmitting) return;

		const prevVote = userVote;
		const prevScore = score;

		let newVote: 1 | -1 | 0 = desiredVote;
		let newScore = score;

		if (prevVote === desiredVote) {
			// Toggle off
			newVote = 0;
			newScore = score - desiredVote;
		} else if (prevVote === 0) {
			newScore = score + desiredVote;
		} else {
			// Switch direction (+1 to -1 or vice versa)
			newScore = score + desiredVote * 2;
		}

		setUserVote(newVote);
		setScore(newScore);
		setIsSubmitting(true);

		try {
			const res: any = await voteDiscussionAction(
				target_type,
				target_id,
				desiredVote
			);
			if (typeof res?.score === "number") {
				setScore(res.score);
			}
		} catch {
			// Revert optimistic updates on error
			setUserVote(prevVote);
			setScore(prevScore);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div
			className={cn(
				"inline-flex items-center gap-1 bg-muted/60 dark:bg-muted/30 rounded-lg p-1",
				className
			)}
		>
			<Button
				variant="ghost"
				size="icon"
				className={cn(
					"h-7 w-7 rounded-md text-muted-foreground transition-colors hover:text-foreground",
					userVote === 1 &&
						"bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 hover:bg-emerald-200"
				)}
				onClick={() => handleVote(1)}
				disabled={disabled || isSubmitting}
				aria-label="Upvote"
			>
				<ThumbsUp className="w-3.5 h-3.5 fill-current" />
			</Button>

			<span
				className={cn(
					"text-xs font-semibold px-1 min-w-[20px] text-center",
					score > 0 && "text-emerald-600 dark:text-emerald-400",
					score < 0 && "text-rose-600 dark:text-rose-400"
				)}
			>
				{score}
			</span>

			<Button
				variant="ghost"
				size="icon"
				className={cn(
					"h-7 w-7 rounded-md text-muted-foreground transition-colors hover:text-foreground",
					userVote === -1 &&
						"bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 hover:bg-rose-200"
				)}
				onClick={() => handleVote(-1)}
				disabled={disabled || isSubmitting}
				aria-label="Downvote"
			>
				<ThumbsDown className="w-3.5 h-3.5 fill-current" />
			</Button>
		</div>
	);
}

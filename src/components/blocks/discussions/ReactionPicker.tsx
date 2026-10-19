"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toggleReactionAction } from "@/lib/actions/discussions";
import type { DiscussionReactionEmoji } from "@/types/discussion.types";

const EMOJI_LIST: DiscussionReactionEmoji[] = [
	"👍",
	"❤️",
	"😂",
	"😮",
	"🎉",
	"🤔",
];

interface ReactionPickerProps {
	target_type: "thread" | "post";
	target_id: string;
	reactionsSummary?: Record<string, number>;
	userReactions?: string[];
	disabled?: boolean;
}

export function ReactionPicker({
	target_type,
	target_id,
	reactionsSummary = {},
	userReactions = [],
	disabled = false,
}: ReactionPickerProps) {
	const [summary, setSummary] =
		useState<Record<string, number>>(reactionsSummary);
	const [userActive, setUserActive] = useState<string[]>(userReactions);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleToggle = async (emoji: DiscussionReactionEmoji) => {
		if (disabled || isSubmitting) return;

		const isActive = userActive.includes(emoji);
		const newActive = isActive
			? userActive.filter((e) => e !== emoji)
			: [...userActive, emoji];

		const count = summary[emoji] || 0;
		const newSummary = {
			...summary,
			[emoji]: isActive ? Math.max(0, count - 1) : count + 1,
		};

		setUserActive(newActive);
		setSummary(newSummary);
		setIsSubmitting(true);

		try {
			await toggleReactionAction(target_type, target_id, emoji);
		} catch {
			// Revert state on error
			setUserActive(userActive);
			setSummary(summary);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="flex flex-wrap items-center gap-1">
			{EMOJI_LIST.map((emoji) => {
				const count = summary[emoji] || 0;
				const isActive = userActive.includes(emoji);

				if (count === 0 && !isActive) return null;

				return (
					<Button
						key={emoji}
						variant={isActive ? "secondary" : "outline"}
						size="sm"
						className="h-7 px-2 text-xs gap-1 rounded-full border shadow-2xs"
						onClick={() => handleToggle(emoji)}
						disabled={disabled || isSubmitting}
					>
						<span>{emoji}</span>
						{count > 0 && (
							<span className="font-semibold text-[11px]">{count}</span>
						)}
					</Button>
				);
			})}

			<div className="flex items-center gap-0.5">
				{EMOJI_LIST.map((emoji) => {
					if ((summary[emoji] || 0) > 0 || userActive.includes(emoji))
						return null;

					return (
						<Button
							key={emoji}
							variant="ghost"
							size="icon"
							className="h-7 w-7 rounded-full text-xs opacity-60 hover:opacity-100 hover:bg-muted"
							onClick={() => handleToggle(emoji)}
							disabled={disabled || isSubmitting}
							title={`React with ${emoji}`}
						>
							{emoji}
						</Button>
					);
				})}
			</div>
		</div>
	);
}

"use client";

import { useReducedMotion, type Variants } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

export const ABOUT_TONES = {
	violet: {
		icon: "bg-[#eee8ff] text-[#6b4dd7] dark:bg-violet-400/15 dark:text-violet-200",
		badge:
			"border-[#dfd5ff] bg-[#f4f0ff] text-[#5e41c7] dark:border-violet-400/25 dark:bg-violet-400/12 dark:text-violet-200",
		bar: "from-[#6b4dd7] to-[#9b82ff]",
		dot: "bg-[#6b4dd7] dark:bg-violet-300",
		banner:
			"from-[#f2edff] via-[#f7f4ff] to-[#eef5ff] dark:from-violet-500/15 dark:via-[#1f2942] dark:to-sky-500/10",
	},
	mint: {
		icon: "bg-[#e1f6ec] text-[#258263] dark:bg-emerald-400/15 dark:text-emerald-200",
		badge:
			"border-[#c7eedc] bg-[#eaf9f1] text-[#1f7558] dark:border-emerald-400/25 dark:bg-emerald-400/12 dark:text-emerald-200",
		bar: "from-[#258263] to-[#5ecfad]",
		dot: "bg-[#258263] dark:bg-emerald-300",
		banner:
			"from-[#e6f8ef] via-[#f2fbf6] to-[#edf6ff] dark:from-emerald-500/15 dark:via-[#1f2942] dark:to-teal-500/10",
	},
	sky: {
		icon: "bg-[#e6f1ff] text-[#3a79c2] dark:bg-sky-400/15 dark:text-sky-200",
		badge:
			"border-[#cde2ff] bg-[#eef5ff] text-[#2f6cb3] dark:border-sky-400/25 dark:bg-sky-400/12 dark:text-sky-200",
		bar: "from-[#3a79c2] to-[#68a8f0]",
		dot: "bg-[#3a79c2] dark:bg-sky-300",
		banner:
			"from-[#e8f2ff] via-[#f3f8ff] to-[#f1eeff] dark:from-sky-500/15 dark:via-[#1f2942] dark:to-violet-500/10",
	},
	peach: {
		icon: "bg-[#ffeddf] text-[#c87949] dark:bg-amber-400/15 dark:text-amber-200",
		badge:
			"border-[#ffd9bd] bg-[#fff4eb] text-[#b56839] dark:border-amber-400/25 dark:bg-amber-400/12 dark:text-amber-200",
		bar: "from-[#c87949] to-[#eba06c]",
		dot: "bg-[#c87949] dark:bg-amber-300",
		banner:
			"from-[#fff0e3] via-[#fff7f0] to-[#f4efff] dark:from-amber-500/15 dark:via-[#1f2942] dark:to-violet-500/10",
	},
} as const;

export type AboutToneKey = keyof typeof ABOUT_TONES;

export const ABOUT_TONE_CYCLE: readonly AboutToneKey[] = [
	"violet",
	"mint",
	"sky",
	"peach",
];

export function useAboutMotion() {
	const reduceMotion = useReducedMotion();
	const duration = reduceMotion ? 0.01 : 0.5;
	const transition = { duration, ease };

	const section: Variants = {
		hidden: { opacity: 0, y: reduceMotion ? 0 : 20 },
		show: {
			opacity: 1,
			y: 0,
			transition,
		},
	};

	const stagger: Variants = {
		hidden: {},
		show: {
			transition: {
				staggerChildren: reduceMotion ? 0 : 0.07,
				delayChildren: reduceMotion ? 0 : 0.03,
			},
		},
	};

	const item: Variants = {
		hidden: { opacity: 0, y: reduceMotion ? 0 : 14 },
		show: {
			opacity: 1,
			y: 0,
			transition,
		},
	};

	const card: Variants = {
		hidden: {
			opacity: 0,
			y: reduceMotion ? 0 : 14,
			scale: reduceMotion ? 1 : 0.985,
		},
		show: {
			opacity: 1,
			y: 0,
			scale: 1,
			transition,
		},
	};

	return {
		reduceMotion,
		section,
		stagger,
		item,
		card,
		viewport: { once: true, amount: 0.08 },
	} as const;
}

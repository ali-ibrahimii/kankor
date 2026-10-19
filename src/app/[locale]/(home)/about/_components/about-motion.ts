"use client";

import { useReducedMotion, type Variants } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

export function useAboutMotion() {
	const reduceMotion = useReducedMotion();
	const duration = reduceMotion ? 0.01 : 0.55;
	const transition = { duration, ease };

	const section: Variants = {
		hidden: { opacity: 0, y: reduceMotion ? 0 : 24 },
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
				staggerChildren: reduceMotion ? 0 : 0.09,
				delayChildren: reduceMotion ? 0 : 0.04,
			},
		},
	};

	const item: Variants = {
		hidden: { opacity: 0, y: reduceMotion ? 0 : 18 },
		show: {
			opacity: 1,
			y: 0,
			transition,
		},
	};

	const card: Variants = {
		hidden: {
			opacity: 0,
			y: reduceMotion ? 0 : 16,
			scale: reduceMotion ? 1 : 0.98,
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
		viewport: { once: true, amount: 0.24 },
	} as const;
}

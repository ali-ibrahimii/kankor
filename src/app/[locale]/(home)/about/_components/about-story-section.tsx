"use client";

import { motion } from "framer-motion";
import { Flag, Rocket, Sparkles, Users2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useAboutMotion } from "./about-motion";

type StoryItem = {
	year: string;
	title: string;
	description: string;
};

const icons = [Flag, Rocket, Users2, Sparkles] as const;

const tones = [
	"bg-[#eee8ff] text-[#6b4dd7] dark:bg-violet-400/15 dark:text-violet-200",
	"bg-[#e1f6ec] text-[#258263] dark:bg-emerald-400/15 dark:text-emerald-200",
	"bg-[#e6f1ff] text-[#3a79c2] dark:bg-sky-400/15 dark:text-sky-200",
	"bg-[#ffeddf] text-[#c87949] dark:bg-amber-400/15 dark:text-amber-200",
] as const;

export function AboutStorySection() {
	const t = useTranslations("aboutUs");
	const aboutMotion = useAboutMotion();
	const raw = t.raw("story.items");
	const items = Array.isArray(raw) ? (raw as StoryItem[]) : [];

	return (
		<motion.section
			id="story"
			className="mx-auto max-w-[1160px] px-4 pt-20 sm:px-6 sm:pt-24"
			variants={aboutMotion.section}
			initial="hidden"
			whileInView="show"
			viewport={aboutMotion.viewport}
		>
			<div className="mx-auto max-w-2xl text-center">
				<span className="section-kicker">
					<Flag className="size-3.5" />

					{t("story.badge")}
				</span>

				<h2 className="section-title text-center">{t("story.title")}</h2>

				<p className="section-copy mx-auto text-center">
					{t("story.subtitle")}
				</p>
			</div>

			<motion.ol
				variants={aboutMotion.stagger}
				initial="hidden"
				whileInView="show"
				viewport={aboutMotion.viewport}
				className="relative mt-12 grid gap-4 lg:grid-cols-4 lg:gap-5"
			>
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-x-8 top-11 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent lg:block"
				/>

				{items.map((item, index) => {
					const Icon = icons[index % icons.length];
					return (
						<motion.li
							key={item.title}
							variants={aboutMotion.card}
							className="soft-card card-hover relative flex flex-col p-5"
						>
							<div className="flex items-center justify-between gap-2">
								<span
									className={cn(
										"flex size-11 items-center justify-center rounded-2xl",
										tones[index % tones.length]
									)}
								>
									<Icon className="size-5" />
								</span>

								<span className="rounded-full border border-border/80 bg-muted/50 px-3 py-1 text-[11px] font-black text-foreground/70">
									{item.year}
								</span>
							</div>

							<h3 className="mt-5 text-base font-extrabold text-foreground">
								{item.title}
							</h3>

							<p className="mt-2 text-xs leading-6 text-muted-foreground">
								{item.description}
							</p>
						</motion.li>
					);
				})}
			</motion.ol>
		</motion.section>
	);
}

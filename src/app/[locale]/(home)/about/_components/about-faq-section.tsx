"use client";

import { motion } from "framer-motion";
import { HelpCircle, Mail, MessageCircleQuestion } from "lucide-react";
import { useTranslations } from "next-intl";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "@/i18n/navigation";
import { useAboutMotion } from "./about-motion";

type FaqItem = { question: string; answer: string };

export function AboutFaqSection() {
	const t = useTranslations("aboutUs");
	const aboutMotion = useAboutMotion();
	const raw = t.raw("faq.items");
	const items = Array.isArray(raw) ? (raw as FaqItem[]) : [];

	return (
		<motion.section
			id="faq"
			className="relative overflow-hidden py-20 sm:py-24"
			variants={aboutMotion.section}
			initial="hidden"
			whileInView="show"
			viewport={aboutMotion.viewport}
		>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(106,75,212,0.08),transparent_32%),radial-gradient(circle_at_82%_90%,rgba(37,130,99,0.08),transparent_34%)]"
			/>

			<div className="relative mx-auto grid max-w-[1160px] gap-10 px-4 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:gap-14">
				<motion.div
					variants={aboutMotion.item}
					className="lg:sticky lg:top-28 lg:self-start"
				>
					<span className="section-kicker">
						<MessageCircleQuestion className="size-3.5" />

						{t("faq.badge")}
					</span>

					<h2 className="section-title">{t("faq.title")}</h2>

					<p className="section-copy">{t("faq.subtitle")}</p>

					<div className="mt-7 rounded-3xl border border-border/80 bg-card p-5 shadow-[0_18px_45px_-34px_rgba(31,41,75,0.45)]">
						<span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
							<HelpCircle className="size-5" />
						</span>

						<p className="mt-4 text-sm font-extrabold text-foreground">
							{t("faq.moreTitle")}
						</p>

						<Link
							href="#contact"
							className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground transition hover:opacity-90"
						>
							<Mail className="size-3.5" />

							{t("faq.moreCta")}
						</Link>
					</div>
				</motion.div>

				<motion.div variants={aboutMotion.card}>
					<Accordion
						type="single"
						collapsible
						className="overflow-hidden rounded-[26px] border border-border/80 bg-card px-2 shadow-[0_24px_60px_-42px_rgba(31,41,75,0.5)] sm:px-4"
					>
						{items.map((item, index) => (
							<AccordionItem
								key={item.question}
								value={`faq-${index}`}
								className="border-border/70 px-2 sm:px-3"
							>
								<AccordionTrigger className="py-5 text-start text-sm font-extrabold text-foreground hover:no-underline">
									<span className="flex items-start gap-3">
										<span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[11px] font-black text-primary">
											{index + 1}
										</span>

										<span className="leading-6">{item.question}</span>
									</span>
								</AccordionTrigger>

								<AccordionContent className="pb-5 ps-9 text-xs leading-7 text-muted-foreground">
									{item.answer}
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
				</motion.div>
			</div>
		</motion.section>
	);
}

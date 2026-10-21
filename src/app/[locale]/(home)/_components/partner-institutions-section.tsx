"use client";

import { ArrowLeft, ArrowRight, Star } from "lucide-react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { resolveEntityCardImage } from "@/components/blocks/shared/card-images";
import { ratingFromSeed } from "@/components/blocks/shared/entity-card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { isRtl } from "@/i18n/routing";
import { routes } from "@/lib/routes";

export type PartnerInstitution = {
	id: string;
	name: string;
	kind: "university" | "school";
	province: string;
	summary: string;
	collaborationTag: string;
	studentsLabel: string;
	imageSrc: string;
	href?: string;
};

export type PartnerInstitutionsSectionProps = {
	institutions: PartnerInstitution[];
	labels: {
		title: string;
		subtitle: string;
		ctaTitle: string;
		ctaSubtitle: string;
		ctaButton: string;
	};
};

export function PartnerInstitutionsSection({
	institutions,
	labels,
}: PartnerInstitutionsSectionProps) {
	const locale = useLocale();
	const rtl = isRtl(locale);
	const Arrow = rtl ? ArrowLeft : ArrowRight;

	return (
		<section
			id="partners"
			data-testid="home-section-partners"
			className="scroll-mt-24 border-y border-[#e9eaf2] bg-white/75 py-10 sm:py-14 dark:border-white/10 dark:bg-[#1b2438]/65"
		>
			<div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
				{/* Clean Section Header — No Category Tabs or Arrow Buttons Above Cards */}
				<div className="mb-5 max-w-2xl">
					<h2 className="text-lg font-black tracking-tight text-[#19243b] sm:text-2xl dark:text-slate-100">
						{labels.title}
					</h2>
					<p className="mt-1 text-xs leading-5.5 text-slate-500 sm:text-[13px] dark:text-slate-400">
						{labels.subtitle}
					</p>
				</div>

				{/* Horizontal Campus Cards — Distinct Institutional Design */}
				<div
					data-testid="home-row-partners"
					className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pt-1 pb-3 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:-mx-2 lg:px-2 [&::-webkit-scrollbar]:hidden"
				>
					{institutions.map((item) => {
						const coverSrc = resolveEntityCardImage({
							customSrc: item.imageSrc,
							kind: item.kind === "university" ? "university" : "school",
							seed: item.id,
						});
						const stats = ratingFromSeed(item.id);

						return (
							<Link
								key={item.id}
								href={item.href ?? routes.search.page({ q: item.name })}
								className="group flex w-[264px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[#e5e8f3] bg-white shadow-[0_8px_22px_-14px_rgba(25,36,59,.13)] transition duration-300 hover:-translate-y-0.5 hover:border-primary/35 sm:w-[278px] dark:border-white/10 dark:bg-[#1b2438]"
							>
								<div className="relative h-28 w-full overflow-hidden bg-slate-900">
									<Image
										src={coverSrc}
										alt={item.name}
										fill
										sizes="(max-width: 640px) 80vw, 280px"
										className="object-cover transition-transform duration-700 group-hover:scale-105"
									/>
									<div
										aria-hidden="true"
										className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/20"
									/>
									<span className="absolute end-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
										<Star className="size-2.5 fill-amber-400 text-amber-400" />
										<span>{stats.score}</span>
									</span>
								</div>

								<div className="flex flex-1 flex-col p-3.5">
									<h3 className="line-clamp-1 text-[14px] font-extrabold text-[#19243b] transition-colors group-hover:text-primary dark:text-slate-100">
										{item.name}
									</h3>

									<p className="mt-1 line-clamp-2 text-[11px] leading-4.5 text-slate-500 dark:text-slate-400">
										{item.summary}
									</p>

									<div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-2.5 mt-3 text-[11px] dark:border-white/10">
										<span className="font-bold text-slate-600 dark:text-slate-300">
											{item.province}
										</span>
										<span className="text-slate-400">{item.studentsLabel}</span>
									</div>
								</div>
							</Link>
						);
					})}
				</div>

				{/* Institutional Collaboration Banner */}
				<div className="relative mt-7 overflow-hidden rounded-[26px] bg-[radial-gradient(circle_at_100%_0%,rgba(183,244,134,.24),transparent_42%),linear-gradient(135deg,#17233a,#292747)] p-5 text-white shadow-lg sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-7">
					<div className="max-w-2xl">
						<h3 className="text-base font-extrabold tracking-tight sm:text-lg">
							{labels.ctaTitle}
						</h3>
						<p className="mt-1 text-xs leading-5.5 text-white/75 sm:text-sm">
							{labels.ctaSubtitle}
						</p>
					</div>
					<div className="mt-4 shrink-0 sm:mt-0">
						<Button
							asChild
							size="lg"
							className="h-10 rounded-xl bg-[#b7f486] px-5 text-xs font-extrabold text-[#17233a] shadow-md hover:bg-[#c5f89c]"
						>
							<Link href={routes.auth.signup.page()}>
								{labels.ctaButton}
								<Arrow className="size-4" />
							</Link>
						</Button>
					</div>
				</div>
			</div>
		</section>
	);
}

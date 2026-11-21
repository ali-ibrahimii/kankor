"use client";

import { ArrowLeft, ArrowRight, Star } from "lucide-react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { resolveEntityCardImage } from "@/components/blocks/shared/card-images";
import { ratingFromSeed } from "@/components/blocks/shared/entity-card";
import { Button } from "@/components/ui/button";
import { EduleArrowDoodle } from "@/components/widgets/edule-sprites";
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
			className="scroll-mt-24 border-y border-[#e8eeea] bg-[#faf6ee] py-10 sm:py-14 dark:border-white/10 dark:bg-[#3b2621]/65"
		>
			<div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
				{/* Clean Section Header — No Category Tabs or Arrow Buttons Above Cards */}
				<div className="mb-5 max-w-2xl">
					<h2 className="relative inline-block text-lg font-black tracking-tight text-[#3b2621] sm:text-2xl dark:text-slate-100">
						{labels.title}

						<span
							aria-hidden="true"
							className="absolute -bottom-1.5 start-0 h-[3px] w-14 rounded-full bg-edule-green/80"
						/>
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
								className="group flex w-[264px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[#e8eeea] bg-white shadow-[0_8px_22px_-14px_rgba(25,36,59,.13)] transition duration-300 hover:-translate-y-0.5 hover:border-primary/35 sm:w-[278px] dark:border-white/10 dark:bg-[#3b2621]"
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
									<h3 className="line-clamp-1 text-[14px] font-extrabold text-[#3b2621] transition-colors group-hover:text-primary dark:text-slate-100">
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

				{/* Institutional Collaboration Banner — EduLe mint instructor card */}
				<div className="relative mt-7 overflow-hidden rounded-[26px] bg-[#faf6ee] p-5 text-white shadow-lg sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-7 dark:bg-[#251c19]">
					<div className="max-w-2xl">
						<h3 className="text-base font-extrabold tracking-tight text-[#3b2621] sm:text-lg dark:text-slate-100">
							{labels.ctaTitle}
						</h3>

						<p className="mt-1 text-xs leading-5.5 text-slate-600 sm:text-sm dark:text-slate-400">
							{labels.ctaSubtitle}
						</p>
					</div>

					<div className="mt-4 flex shrink-0 items-center gap-6 sm:mt-0">
						<EduleArrowDoodle className="hidden text-[#02656b] xl:block rtl:-scale-x-100" />

						<Button
							asChild
							size="lg"
							className="h-10 rounded-xl bg-edule-green px-5 text-xs font-extrabold text-white shadow-md shadow-emerald-600/25 hover:bg-edule-green/90"
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

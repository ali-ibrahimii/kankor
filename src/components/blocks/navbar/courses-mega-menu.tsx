"use client";

import {
	ArrowDown,
	ArrowRight,
	BookOpen,
	Check,
	GraduationCap,
	Sparkles,
} from "lucide-react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { isRtl } from "@/i18n/routing";
import { routes } from "@/lib/routes";

export function CoursesMegaMenu({
	label,
	eyebrow,
	title,
	description,
	allLabel,
	subjectsLabel,
	paths,
	cardTitle,
	cardText,
}: {
	label: string;
	eyebrow: string;
	title: string;
	description: string;
	allLabel: string;
	subjectsLabel: string;
	paths: string[];
	cardTitle: string;
	cardText: string;
}) {
	const locale = useLocale();
	const rtl = isRtl(locale);
	const Arrow = rtl ? ArrowDown : ArrowRight;
	return (
		<div className="group relative">
			<Link
				href={routes.courses.page()}
				className="inline-flex items-center gap-1.5 rounded-xl px-2 py-2 text-[13px] font-semibold text-slate-600 transition hover:bg-[#f5f2ff] hover:text-[#684bd0] xl:px-3 group-hover:bg-[#f5f2ff] group-hover:text-[#684bd0] group-focus-within:bg-[#f5f2ff] group-focus-within:text-[#684bd0]"
				aria-haspopup="true"
			>
				{label}
				<ArrowDown className="size-3.5 transition-transform group-hover:rotate-180 group-focus-within:rotate-180" />
			</Link>
			<div className="invisible absolute start-1/2 top-full z-[60] w-[min(680px,calc(100vw-32px))] -translate-x-1/2 translate-y-2 pt-3 opacity-0 transition duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 ltr:-translate-x-1/2 rtl:translate-x-1/2">
				<div className="grid overflow-hidden rounded-[26px] border border-slate-200/80 bg-white p-2 shadow-[0_28px_90px_-35px_rgba(27,31,73,.45)] sm:grid-cols-[1.05fr_.95fr]">
					<div className="p-5 sm:p-6">
						<p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide text-violet-600">
							<Sparkles className="size-3.5" />
							{eyebrow}
						</p>
						<h2 className="mt-3 text-xl font-extrabold leading-snug text-[#19243b]">
							{title}
						</h2>
						<p className="mt-2 max-w-sm text-xs leading-6 text-slate-500">
							{description}
						</p>
						<div className="mt-5 flex items-center gap-2 text-[11px] font-bold text-slate-500">
							<GraduationCap className="size-4 text-emerald-600" />
							{subjectsLabel}
						</div>
						<div className="mt-3 grid grid-cols-2 gap-2">
							{paths.map((path) => (
								<Link
									key={path}
									href={routes.courses.page()}
									className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
								>
									<span className="flex size-6 items-center justify-center rounded-lg bg-white text-violet-600 shadow-sm">
										<BookOpen className="size-3.5" />
									</span>
									{path}
								</Link>
							))}
						</div>
						<Link
							href={routes.courses.page()}
							className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#684bd0] px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#5639bc]"
						>
							{allLabel}
							<Arrow className="size-4" />
						</Link>
					</div>
					<div className="relative m-1 flex flex-col justify-between overflow-hidden rounded-[21px] bg-[radial-gradient(circle_at_100%_0%,rgba(183,244,134,.3),transparent_38%),linear-gradient(145deg,#17233a,#292747)] p-5 text-white sm:p-6">
						<div className="absolute -end-10 -top-12 size-40 rounded-full border-[26px] border-white/[.06]" />
						<div className="relative">
							<span className="flex size-11 items-center justify-center rounded-2xl bg-[#b7f486] text-[#17233a]">
								<Sparkles className="size-5" />
							</span>
							<h3 className="mt-5 text-lg font-extrabold">{cardTitle}</h3>
							<p className="mt-2 text-xs leading-6 text-white/65">{cardText}</p>
						</div>
						<div className="relative mt-7 space-y-2.5 text-[11px] font-semibold text-white/80">
							<span className="flex items-center gap-2">
								<Check className="size-4 text-[#b7f486]" />
								{paths[0]}
							</span>
							<span className="flex items-center gap-2">
								<Check className="size-4 text-[#b7f486]" />
								{paths[1]}
							</span>
							<span className="flex items-center gap-2">
								<Check className="size-4 text-[#b7f486]" />
								{paths[2]}
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

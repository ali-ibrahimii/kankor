"use client";

import {
	ArrowLeft,
	ArrowRight,
	Award,
	BookOpen,
	ChevronDown,
	ClipboardList,
	Compass,
	GraduationCap,
	Layers,
	Library,
	School,
	Sparkles,
} from "lucide-react";
import { useLocale } from "next-intl";
import { useIsPathActive } from "@/hooks/route-hooks";
import { Link } from "@/i18n/navigation";
import { isRtl } from "@/i18n/routing";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

export type SchoolMegaMenuItem = {
	key:
		| "courses"
		| "schoolBooks"
		| "library"
		| "kankorForms"
		| "flashcards"
		| "roadmap";
	title: string;
	description: string;
	href: string;
};

const ITEM_META = {
	courses: {
		icon: GraduationCap,
		tint: "bg-violet-500/12 text-violet-600 dark:text-violet-300",
	},
	schoolBooks: {
		icon: BookOpen,
		tint: "bg-blue-500/12 text-blue-600 dark:text-blue-300",
	},
	library: {
		icon: Library,
		tint: "bg-sky-500/12 text-sky-600 dark:text-sky-300",
	},
	kankorForms: {
		icon: ClipboardList,
		tint: "bg-amber-500/12 text-amber-600 dark:text-amber-300",
	},
	flashcards: {
		icon: Layers,
		tint: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300",
	},
	roadmap: {
		icon: Compass,
		tint: "bg-rose-500/12 text-rose-600 dark:text-rose-300",
	},
} as const;

export function CoursesMegaMenu({
	label,
	eyebrow,
	title,
	description,
	allLabel,
	subjectsLabel,
	gradesLabel,
	paths,
	grades,
	items,
	cardTitle,
	cardText,
	verifyLabel,
	classroomsLabel,
}: {
	label: string;
	eyebrow: string;
	title: string;
	description: string;
	allLabel: string;
	subjectsLabel: string;
	gradesLabel: string;
	paths: string[];
	grades: string[];
	items: SchoolMegaMenuItem[];
	cardTitle: string;
	cardText: string;
	verifyLabel: string;
	classroomsLabel: string;
}) {
	const locale = useLocale();
	const rtl = isRtl(locale);
	const Arrow = rtl ? ArrowLeft : ArrowRight;
	const isActive = useIsPathActive();
	const menuActive =
		isActive(routes.courses.page()) ||
		items.some((item) => isActive(item.href.split("?")[0]));

	return (
		<div className="group relative" data-testid="school-mega-menu">
			<Link
				href={routes.courses.page()}
				className={cn(
					"inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-bold transition-colors duration-200",
					menuActive
						? "bg-primary/10 text-primary"
						: "text-muted-foreground hover:bg-primary/5 hover:text-primary group-hover:bg-primary/10 group-hover:text-primary group-focus-within:bg-primary/10 group-focus-within:text-primary"
				)}
				aria-haspopup="true"
			>
				{label}
				<ChevronDown className="size-3.5 transition-transform duration-200 group-hover:rotate-180 group-focus-within:rotate-180" />
			</Link>

			<div
				data-testid="school-mega-menu-panel"
				className="invisible absolute start-0 top-full z-[60] w-[min(780px,calc(100vw-32px))] translate-y-2 pt-3 opacity-0 transition duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100"
			>
				<div className="grid overflow-hidden rounded-[28px] border border-border/80 bg-popover p-2 text-popover-foreground shadow-[0_28px_90px_-30px_rgba(19,25,58,.45)] sm:grid-cols-[1.3fr_.9fr]">
					{/* Left / Start: Complete School & Kankor Links Grid */}
					<div className="p-4 sm:p-5">
						<div className="flex items-center justify-between gap-2 px-1">
							<p className="flex items-center gap-2 text-[11px] font-extrabold tracking-wide text-primary">
								<Sparkles className="size-3.5" />
								{eyebrow}
							</p>
							<Link
								href={routes.courses.page()}
								className="inline-flex items-center gap-1 text-[11px] font-extrabold text-primary hover:underline"
							>
								{allLabel}
								<Arrow className="size-3.5" />
							</Link>
						</div>

						<h2 className="mt-2 px-1 text-base font-black text-foreground">
							{title}
						</h2>
						<p className="mt-1 px-1 text-xs leading-5 text-muted-foreground">
							{description}
						</p>

						<div className="mt-4 grid gap-2 sm:grid-cols-2">
							{items.map((item) => {
								const meta = ITEM_META[item.key];
								const Icon = meta.icon;
								return (
									<Link
										key={item.key}
										href={item.href}
										className="group/item flex items-start gap-3 rounded-2xl border border-border/60 bg-muted/30 p-3 transition hover:border-primary/35 hover:bg-primary/5"
									>
										<span
											className={cn(
												"flex size-9 shrink-0 items-center justify-center rounded-xl transition-transform group-hover/item:scale-105",
												meta.tint
											)}
										>
											<Icon className="size-4" />
										</span>
										<span className="min-w-0 flex-1">
											<strong className="block truncate text-xs font-extrabold text-foreground group-hover/item:text-primary">
												{item.title}
											</strong>
											<span className="mt-0.5 line-clamp-1 block text-[11px] leading-4 text-muted-foreground">
												{item.description}
											</span>
										</span>
									</Link>
								);
							})}
						</div>
					</div>

					{/* Right / End: Grades, Subjects & Quick Access */}
					<div className="relative m-1 flex flex-col justify-between overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_100%_0%,rgba(183,244,134,.28),transparent_42%),linear-gradient(145deg,#17233a,#292747)] p-5 text-white">
						<div
							aria-hidden="true"
							className="pointer-events-none absolute -end-10 -top-12 size-40 rounded-full border-[26px] border-white/[.06]"
						/>

						<div className="relative">
							<span className="flex size-10 items-center justify-center rounded-2xl bg-[#b7f486] text-[#17233a]">
								<GraduationCap className="size-5" />
							</span>
							<h3 className="mt-4 text-base font-extrabold">{cardTitle}</h3>
							<p className="mt-1.5 text-xs leading-5 text-white/70">
								{cardText}
							</p>

							<p className="mt-4 text-[11px] font-bold text-[#b7f486]">
								{gradesLabel}
							</p>
							<div className="mt-2 flex flex-wrap gap-1.5">
								{grades.map((grade) => (
									<Link
										key={grade}
										href={routes.search.page({ q: grade })}
										className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold text-white transition hover:border-[#b7f486]/60 hover:bg-[#b7f486] hover:text-[#17233a]"
									>
										{grade}
									</Link>
								))}
							</div>

							<p className="mt-4 text-[11px] font-bold text-white/70">
								{subjectsLabel}
							</p>
							<div className="mt-2 flex flex-wrap gap-1.5">
								{paths.map((subject) => (
									<Link
										key={subject}
										href={routes.search.page({ q: subject })}
										className="rounded-full border border-white/10 bg-white/[.07] px-2.5 py-1 text-[11px] font-semibold text-white/85 transition hover:bg-white/20 hover:text-white"
									>
										{subject}
									</Link>
								))}
							</div>
						</div>

						<div className="relative mt-5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3.5 text-[11px] font-bold">
							<Link
								href={routes.verify.page()}
								className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-white/90 transition hover:bg-white/20"
							>
								<Award className="size-3.5 text-[#b7f486]" />
								{verifyLabel}
							</Link>
							<Link
								href={routes.d.classrooms.page()}
								className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-white/90 transition hover:bg-white/20"
							>
								<School className="size-3.5 text-[#b7f486]" />
								{classroomsLabel}
							</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

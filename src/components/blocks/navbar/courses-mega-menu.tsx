"use client";

import {
	ArrowLeft,
	ArrowRight,
	BookOpen,
	ChevronDown,
	ClipboardList,
	Compass,
	GraduationCap,
	Layers,
	Library,
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

/**
 * Compact hover menu for the "School" nav item: a short, borderless list of
 * destinations with a single footer link — no promo panel, chips or grids.
 */
export function CoursesMegaMenu({
	label,
	items,
	allLabel,
	verifyLabel,
	classroomsLabel,
}: {
	label: string;
	items: SchoolMegaMenuItem[];
	allLabel: string;
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
				className="invisible absolute start-0 top-full z-[60] w-[min(258px,calc(100vw-32px))] translate-y-1.5 pt-2.5 opacity-0 transition duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100"
			>
				<div className="overflow-hidden rounded-2xl border border-border/70 bg-popover p-1 text-popover-foreground shadow-[0_18px_45px_-26px_rgba(19,25,58,.5)]">
					{items.map((item) => {
						const meta = ITEM_META[item.key];
						const Icon = meta.icon;

						return (
							<Link
								key={item.key}
								href={item.href}
								title={item.description}
								className="flex items-center gap-2.5 rounded-xl px-2 py-2 text-[12px] font-semibold text-foreground/85 transition-colors hover:bg-muted/70 hover:text-foreground"
							>
								<span
									className={cn(
										"flex size-7 shrink-0 items-center justify-center rounded-lg",
										meta.tint
									)}
								>
									<Icon className="size-3.5" />
								</span>

								<span className="truncate">{item.title}</span>
							</Link>
						);
					})}

					<div className="mt-1 border-t border-border/60 pt-1">
						<Link
							href={routes.courses.page()}
							className="flex items-center justify-between rounded-xl px-2 py-2 text-[11px] font-extrabold text-primary transition-colors hover:bg-primary/5"
						>
							{allLabel}

							<Arrow className="size-3.5" />
						</Link>

						<Link
							href={routes.verify.page()}
							className="flex items-center rounded-xl px-2 py-1.5 text-[10px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
						>
							{verifyLabel}
						</Link>

						<Link
							href={routes.d.classrooms.page()}
							className="flex items-center rounded-xl px-2 py-1.5 pt-0 text-[10px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
						>
							{classroomsLabel}
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}

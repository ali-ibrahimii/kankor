import type { LucideIcon } from "lucide-react";
import { BookOpen, Sparkles } from "lucide-react";

/** Shared by the public library and flashcard catalogs, not dashboard pages. */
export function CatalogHero({
	badge,
	title,
	description,
	chips,
	icon: Icon = BookOpen,
}: {
	badge: string;
	title: string;
	description: string;
	chips: string[];
	icon?: LucideIcon;
}) {
	return (
		<section className="public-catalog-hero relative isolate mb-3 overflow-hidden rounded-[18px] px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
			<div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]">
				<div className="max-w-2xl">
					<span className="inline-flex items-center gap-2 text-xs font-bold text-primary">
						<Sparkles className="size-4" aria-hidden="true" />
						{badge}
					</span>
					<h1 className="mt-4 text-3xl font-extrabold leading-[1.5] text-foreground sm:text-4xl lg:text-[2.7rem]">
						{title}
					</h1>
					<p className="mt-4 max-w-xl text-sm leading-8 text-muted-foreground">
						{description}
					</p>
					<ul className="mt-6 flex flex-wrap gap-2">
						{chips.map((chip) => (
							<li
								key={chip}
								className="rounded-lg border border-primary/15 bg-card/60 px-4 py-2 text-xs font-semibold text-primary"
							>
								{chip}
							</li>
						))}
					</ul>
				</div>
				<div
					className="catalog-hero-symbol relative mx-auto hidden size-44 items-center justify-center rounded-full md:flex lg:size-52"
					aria-hidden="true"
				>
					<Icon className="size-20 stroke-[1.2] lg:size-24" />
					<span className="absolute -end-3 top-3 size-7 rounded-full bg-primary" />
					<span className="absolute -start-2 bottom-4 size-4 rounded-full bg-foreground" />
				</div>
			</div>
		</section>
	);
}

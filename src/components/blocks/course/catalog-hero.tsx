import type { LucideIcon } from "lucide-react";
import { ArrowDown, BookOpen, Sparkles } from "lucide-react";

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
		<section className="relative isolate mb-3 overflow-hidden rounded-[30px] bg-[radial-gradient(circle_at_88%_0%,rgba(183,244,134,.2),transparent_28%),radial-gradient(circle_at_0%_100%,rgba(139,119,255,.25),transparent_35%),linear-gradient(125deg,#111c31,#292746)] p-6 text-white shadow-[0_26px_70px_-38px_rgba(17,28,49,.65)] sm:p-9 lg:p-11">
			<div
				aria-hidden="true"
				className="pointer-events-none absolute -end-12 -top-16 size-56 rounded-full border-[35px] border-white/[.05]"
			/>
			<div className="relative grid items-center gap-8 lg:grid-cols-[1fr_.8fr]">
				<div className="max-w-2xl">
					<span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.08] px-3 py-1.5 text-[11px] font-bold text-[#c7f59f]">
						<Sparkles className="size-3.5" />
						{badge}
					</span>
					<h1 className="mt-4 text-3xl font-black leading-[1.45] sm:text-4xl lg:text-[2.7rem]">
						{title}
					</h1>
					<p className="mt-3 max-w-xl text-sm leading-7 text-white/65">
						{description}
					</p>
					<div className="mt-5 flex flex-wrap gap-2">
						{chips.map((chip) => (
							<span
								key={chip}
								className="rounded-full border border-white/10 bg-white/[.07] px-3 py-1.5 text-[11px] font-semibold text-white/75"
							>
								{chip}
							</span>
						))}
					</div>
				</div>
				<div className="relative mx-auto w-full max-w-[390px] rounded-[25px] border border-white/15 bg-[#0d172b]/70 p-4 shadow-2xl backdrop-blur-md sm:p-5">
					<div className="flex items-center justify-between border-b border-white/10 pb-3">
						<span className="flex items-center gap-2 text-xs font-bold text-white/85">
							<span className="flex size-8 items-center justify-center rounded-xl bg-[#b7f486]/15 text-[#b7f486]">
								<Icon className="size-4" />
							</span>
							{badge}
						</span>
						<span className="rounded-full bg-white/10 p-2 text-white/60">
							<ArrowDown className="size-3.5" />
						</span>
					</div>
					<div className="mt-4 rounded-[18px] bg-gradient-to-br from-[#e9e2ff] to-[#d8f5e8] p-4 text-[#202943] shadow-lg">
						<span className="text-[10px] font-bold uppercase tracking-wide text-violet-700">
							{chips[0]}
						</span>
						<p className="mt-2 text-lg font-extrabold leading-snug">{title}</p>
						<div className="mt-4 flex items-center justify-between text-[10px] font-semibold text-slate-600">
							<span>{chips[1] || description}</span>
							<span className="flex size-7 items-center justify-center rounded-full bg-white/80 text-violet-700">
								<Icon className="size-3.5" />
							</span>
						</div>
					</div>
					<div className="mt-3 grid grid-cols-2 gap-2">
						{chips.slice(0, 2).map((chip, index) => (
							<div
								key={chip}
								className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.05] px-3 py-2 text-[10px] font-semibold text-white/65"
							>
								<span
									className={`size-2 rounded-full ${index === 0 ? "bg-[#b7f486]" : "bg-violet-300"}`}
								/>
								{chip}
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}

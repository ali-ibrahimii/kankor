import type { LucideIcon } from "lucide-react";
import { BookOpen } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Coursera-style entity cards — shared building blocks used by the course,
 * deck, quiz and library cards so every catalog looks and feels identical:
 *
 *   ┌─────────────────────────┐
 *   │  subject-art gradient   │  ← EntityCardArt (icon tile + chips)
 *   ├─────────────────────────┤
 *   │  title / description    │  ← EntityCardBody
 *   │  meta row · price · CTA │  ← EntityCardFooter
 *   └─────────────────────────┘
 *
 * The whole card lifts on hover (`card-hover`) and the title turns primary.
 */

// ─── Art palette ───────────────────────────────────────────────────────────

export type ArtTone =
	| "violet"
	| "blue"
	| "cyan"
	| "emerald"
	| "yellow"
	| "orange"
	| "rose";

export const artTones: Record<
	ArtTone,
	{ start: string; end: string; icon: string }
> = {
	violet: { start: "#ded2ff", end: "#f0e9ff", icon: "#7c5cda" },
	blue: { start: "#c8d8ff", end: "#e6eaff", icon: "#4f62db" },
	cyan: { start: "#c4f0ee", end: "#e4f8fa", icon: "#219c9c" },
	emerald: { start: "#c5efd9", end: "#e8f8ee", icon: "#258c62" },
	yellow: { start: "#f8e6ad", end: "#fbf5d9", icon: "#b88923" },
	orange: { start: "#ffd7c2", end: "#fff0e6", icon: "#d57a4a" },
	rose: { start: "#ffd2dd", end: "#ffecf1", icon: "#c2496e" },
};

/** Deterministic tone from a stable string (entity id / slug / subject). */
export function toneFromString(value: string): ArtTone {
	const tones = Object.keys(artTones) as ArtTone[];
	let hash = 0;
	for (let i = 0; i < value.length; i++) {
		hash = (hash * 31 + value.charCodeAt(i)) | 0;
	}
	return tones[Math.abs(hash) % tones.length];
}

// ─── Shell ─────────────────────────────────────────────────────────────────

export function EntityCardShell({
	href,
	className,
	footer,
	children,
}: {
	href: string;
	className?: string;
	/** Action bar rendered *below* the linked area (open/download buttons). */
	footer?: ReactNode;
	children: ReactNode;
}) {
	return (
		<article
			className={cn(
				"soft-card card-hover flex h-full flex-col overflow-hidden",
				className
			)}
		>
			<Link href={href} className="flex flex-1 flex-col">
				{children}
			</Link>
			{footer}
		</article>
	);
}

// ─── Art header ────────────────────────────────────────────────────────────

export function EntityCardArt({
	icon: Icon = BookOpen,
	tone = "violet",
	label,
	startAdornment,
	endAdornment,
	bottomAdornment,
}: {
	icon?: LucideIcon;
	tone?: ArtTone;
	/** Small glass chip in the top-end corner (category, level…). */
	label?: ReactNode;
	startAdornment?: ReactNode;
	endAdornment?: ReactNode;
	/** Chip pinned to the bottom-start (e.g. "enrolled"). */
	bottomAdornment?: ReactNode;
}) {
	const art = artTones[tone];
	return (
		<div
			className="subject-art relative flex h-36 shrink-0 items-center justify-between overflow-hidden px-5"
			style={
				{
					"--art-start": art.start,
					"--art-end": art.end,
					"--art-icon": art.icon,
				} as CSSProperties
			}
		>
			{/* decorative bubbles */}
			<div className="absolute -left-9 -top-12 size-40 rounded-full border border-white/55" />
			<div className="absolute -bottom-10 right-8 size-28 rounded-full bg-white/25 blur-xl" />

			<div className="flex items-center gap-2">
				<span className="art-icon art-icon-on-art relative flex size-16 items-center justify-center rounded-[1.4rem] border border-white/60 bg-white/65 shadow-lg shadow-slate-700/10 backdrop-blur-md transition duration-300 group-hover:-rotate-6 group-hover:scale-105">
					<Icon size={30} strokeWidth={1.65} />
				</span>
				{startAdornment}
			</div>

			<div className="flex items-center gap-2">
				{endAdornment}
				{label ? <span className="art-chip">{label}</span> : null}
			</div>

			{bottomAdornment ? (
				<div className="absolute bottom-3 left-4">{bottomAdornment}</div>
			) : null}
		</div>
	);
}

// ─── Body ──────────────────────────────────────────────────────────────────

export function EntityCardBody({
	title,
	description,
	byline,
	badges,
	actions,
}: {
	title: ReactNode;
	description?: ReactNode;
	/** Instructor/author line rendered under the title. */
	byline?: ReactNode;
	/** Small status badges (free, card count, duration…). */
	badges?: ReactNode;
	/** Primary action row rendered at the bottom of the body. */
	actions?: ReactNode;
}) {
	return (
		<div className="flex flex-1 flex-col p-5">
			<h3 className="text-lg font-black leading-7 tracking-tight text-foreground transition-colors group-hover:text-primary line-clamp-2">
				{title}
			</h3>
			{description ? (
				<p className="mt-1.5 line-clamp-2 min-h-11 text-xs leading-6 text-muted-foreground">
					{description}
				</p>
			) : null}
			{byline ? <div className="mt-3">{byline}</div> : null}
			{badges ? (
				<div className="mt-3 flex flex-wrap items-center gap-1.5">{badges}</div>
			) : null}
			{actions ? <div className="mt-auto pt-4">{actions}</div> : null}
		</div>
	);
}

// ─── Footer / meta ─────────────────────────────────────────────────────────

export function EntityCardFooter({
	meta,
	price,
	cta,
}: {
	/** Meta items (lessons, time, students…). */
	meta?: ReactNode;
	/** Price / "free" label. */
	price?: ReactNode;
	/** "Start learning →" style call to action. */
	cta?: ReactNode;
}) {
	return (
		<div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-border/70 px-5 pb-4 pt-3 text-[11px] font-bold text-muted-foreground">
			{meta}
			{(price || cta) && (
				<div className="ms-auto flex items-center gap-3">
					{price ? (
						<span className="text-sm font-black text-emerald-600 dark:text-emerald-300">
							{price}
						</span>
					) : null}
					{cta ? (
						<span className="inline-flex items-center gap-1 text-xs font-black text-primary transition-transform group-hover:-translate-x-1">
							{cta}
						</span>
					) : null}
				</div>
			)}
		</div>
	);
}

/** A single meta cell — icon + label. */
export function EntityCardMetaItem({
	icon: Icon,
	children,
}: {
	icon: LucideIcon;
	children: ReactNode;
}) {
	return (
		<span className="inline-flex items-center gap-1">
			<Icon size={13} className="text-muted-foreground/80" />
			{children}
		</span>
	);
}

/** Small pill for status ("free", "N cards", "25 min"). */
export function EntityCardBadge({
	children,
	tone = "muted",
}: {
	children: ReactNode;
	tone?: "muted" | "success" | "primary";
}) {
	const tones = {
		muted: "bg-muted text-muted-foreground",
		success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
		primary: "bg-primary/10 text-primary",
	} as const;
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black",
				tones[tone]
			)}
		>
			{children}
		</span>
	);
}

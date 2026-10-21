"use client";

import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import {
	type EntityCardKind,
	resolveEntityCardImage,
} from "@/components/blocks/shared/card-images";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type ArtTone = "violet" | "blue" | "emerald" | "amber" | "rose" | "sky";

export const artTones: Record<ArtTone, string> = {
	violet: "from-violet-600 via-purple-600 to-indigo-700",
	blue: "from-blue-600 via-indigo-600 to-slate-800",
	emerald: "from-emerald-600 via-teal-600 to-cyan-800",
	amber: "from-amber-500 via-orange-600 to-rose-700",
	rose: "from-rose-600 via-pink-600 to-purple-800",
	sky: "from-sky-500 via-blue-600 to-indigo-800",
};

export function toneFromString(value: string): ArtTone {
	const tones = Object.keys(artTones) as ArtTone[];
	let hash = 0;
	for (let i = 0; i < value.length; i++) {
		hash = (hash * 31 + value.charCodeAt(i)) | 0;
	}
	return tones[Math.abs(hash) % tones.length];
}

export function ratingFromSeed(seed: string): {
	score: string;
	votes: number;
} {
	let hash = 0;
	for (let i = 0; i < seed.length; i++) {
		hash = (hash * 31 + seed.charCodeAt(i)) | 0;
	}
	const scores = ["4.9", "4.8", "4.7", "4.9", "4.8"] as const;
	const n = Math.abs(hash);
	return {
		score: scores[n % scores.length],
		votes: 120 + (n % 420),
	};
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
	footer?: ReactNode;
	children: ReactNode;
}) {
	return (
		<article
			className={cn(
				"group soft-card card-hover flex h-full flex-col overflow-hidden",
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

// ─── Art header (clean cover image + subtle top-corner badges, zero floating icons) ─

export function EntityCardArt({
	tone,
	label,
	badge,
	topStart,
	topEnd,
	imageSrc,
	imageAlt,
	kind = "course",
	seed,
}: {
	icon?: LucideIcon;
	tone: ArtTone;
	label?: string | null;
	badge?: ReactNode;
	topStart?: ReactNode;
	topEnd?: ReactNode;
	imageSrc?: string | null;
	imageAlt?: string;
	kind?: EntityCardKind;
	seed?: string;
}) {
	const resolvedSrc = resolveEntityCardImage({
		customSrc: imageSrc,
		text: `${label ?? ""} ${imageAlt ?? ""}`,
		kind,
		seed,
	});

	return (
		<div
			className={cn(
				"relative h-36 w-full shrink-0 overflow-hidden bg-gradient-to-br",
				artTones[tone]
			)}
		>
			<Image
				src={resolvedSrc}
				alt={imageAlt || label || ""}
				fill
				sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 310px"
				className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
			/>

			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/25"
			/>

			{topStart && <div className="absolute start-3 top-3">{topStart}</div>}
			{(topEnd ?? badge) && (
				<div className="absolute end-3 top-3">{topEnd ?? badge}</div>
			)}
		</div>
	);
}

// ─── Body ──────────────────────────────────────────────────────────────────

export function EntityCardBody({
	eyebrow,
	title,
	description,
	badges,
}: {
	eyebrow?: ReactNode;
	title: string;
	description?: string | null;
	badges?: ReactNode;
}) {
	return (
		<div className="flex flex-1 flex-col gap-1.5 p-4">
			{eyebrow && (
				<span className="text-[11px] font-bold tracking-wide text-primary">
					{eyebrow}
				</span>
			)}

			<h3 className="line-clamp-2 text-[14.5px] font-extrabold leading-snug text-foreground transition-colors group-hover:text-primary">
				{title}
			</h3>

			{description && (
				<p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
					{description}
				</p>
			)}

			{badges && (
				<div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
					{badges}
				</div>
			)}
		</div>
	);
}

// ─── Badges ────────────────────────────────────────────────────────────────

export function EntityCardBadge({
	children,
	tone = "neutral",
	className,
}: {
	children: ReactNode;
	tone?: "neutral" | "success";
	className?: string;
}) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
				tone === "success"
					? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
					: "bg-muted text-muted-foreground",
				className
			)}
		>
			{children}
		</span>
	);
}

// ─── Footer ────────────────────────────────────────────────────────────────

export function EntityCardFooter({
	meta,
	price,
	cta,
}: {
	meta?: ReactNode;
	price?: ReactNode;
	cta: ReactNode;
}) {
	return (
		<div className="mt-auto flex items-center justify-between gap-2 border-t border-border/70 px-4 py-2.5 text-xs">
			<div className="flex min-w-0 items-center gap-3 text-muted-foreground">
				{meta}
			</div>

			<div className="flex shrink-0 items-center gap-2">
				{price != null && (
					<span className="font-bold text-primary">{price}</span>
				)}
				<span className="inline-flex items-center gap-1 font-bold text-primary transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5">
					{cta}
				</span>
			</div>
		</div>
	);
}

export function EntityCardMetaItem({
	icon: Icon,
	children,
}: {
	icon: LucideIcon;
	children: ReactNode;
}) {
	return (
		<span className="inline-flex items-center gap-1 text-[11px]">
			<Icon className="size-3.5 shrink-0 opacity-70" />
			<span className="truncate">{children}</span>
		</span>
	);
}

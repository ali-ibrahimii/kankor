import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Hand-drawn green swoosh arrow from the EduLe template skin.
 * Pure decoration — rendered inline next to hero/CTA copy.
 */
export function EduleArrowDoodle({
	className,
	...props
}: SVGProps<SVGSVGElement>) {
	return (
		<svg
			viewBox="0 0 60 40"
			fill="none"
			aria-hidden="true"
			{...props}
			className={cn("edule-arrow-doodle", className)}
		>
			<path
				d="M4 31 C 13 33.5, 29 32.5, 40 25 C 45 21.4, 48.5 15.5, 48.8 10.5"
				stroke="currentColor"
				strokeWidth="2.4"
				strokeLinecap="round"
			/>
			<path
				d="M44.4 15.8 L 48.9 9.4 L 52.9 16.6"
				stroke="currentColor"
				strokeWidth="2.4"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

/**
 * Golden diagonal dash cluster (difyuzel stitch) sprinkled around
 * the EduLe template hero. Dashes radiate outward from the centre.
 */
const STITCH_DASHES = Array.from({ length: 10 }, (_, index) => {
	const angle = (index / 10) * Math.PI * 2 - Math.PI / 2;
	const inner = 5.5;
	const outer = inner + 3.4;
	const cos = Math.cos(angle);
	const sin = Math.sin(angle);
	return {
		x1: 18 + inner * cos,
		y1: 14 + inner * sin,
		x2: 18 + outer * cos,
		y2: 14 + outer * sin,
	};
});

export function EduleStitch({ className, ...props }: SVGProps<SVGSVGElement>) {
	return (
		<svg
			viewBox="0 0 36 28"
			fill="none"
			aria-hidden="true"
			{...props}
			className={cn("edule-stitch", className)}
		>
			{STITCH_DASHES.map((dash) => (
				<line
					key={`${dash.x1}-${dash.y1}`}
					x1={dash.x1}
					y1={dash.y1}
					x2={dash.x2}
					y2={dash.y2}
					stroke="currentColor"
					strokeWidth="1.7"
					strokeLinecap="round"
				/>
			))}
		</svg>
	);
}

/**
 * Social icons (lucide-react no longer ships brand glyphs).
 * Stroke-based, lucide-style, drawn inline.
 */

export function FacebookIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			{...props}
		>
			<path d="M14.5 21v-6.6h2.5l.6-3h-3.1V9.6c0-.9.3-1.6 1.7-1.6h1.5V5.3c-.6-.1-1.5-.2-2.4-.2-2.4 0-4 1.4-4 4.1v2.2H8.7v3h2.6V21" />
		</svg>
	);
}

export function TwitterIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			{...props}
		>
			<path d="M18.2 3.5h2.9l-6.4 7.3 7.5 9.7h-5.9l-4.6-6-5.2 6H3.6l6.8-7.8L3.2 3.5h6l4.1 5.5 4.9-5.5Z" />
		</svg>
	);
}

export function YoutubeIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			{...props}
		>
			<rect x="2.8" y="5.2" width="18.4" height="13.6" rx="3.6" />
			<path d="m10.2 9.4 4.8 2.6-4.8 2.6v-5.2Z" fill="currentColor" />
		</svg>
	);
}

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			{...props}
		>
			<rect x="3" y="3" width="18" height="18" rx="5.2" />
			<circle cx="12" cy="12" r="4.1" />
			<circle cx="17.1" cy="6.9" r="0.9" fill="currentColor" />
		</svg>
	);
}

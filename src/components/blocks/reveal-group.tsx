"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Scroll-triggered reveal container. Replaces framer-motion's
 * whileInView/staggerChildren pattern with a single IntersectionObserver
 * and CSS transitions (`.reveal-item` in globals.css), so pages using it
 * don't need to ship the framer-motion runtime.
 */
export function RevealGroup({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setVisible(true);
					observer.disconnect();
				}
			},
			{ rootMargin: "0px 0px -80px 0px", threshold: 0.1 }
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	return (
		<div
			ref={ref}
			className={cn("reveal-group", visible && "is-visible", className)}
		>
			{children}
		</div>
	);
}

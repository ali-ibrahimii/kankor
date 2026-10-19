import { useEffect, useState } from "react";

const BREAKPOINTS = {
	base: 0,
	sm: 640,
	md: 768,
	lg: 1024,
	xl: 1280,
	"2xl": 1536,
} as const;

type Breakpoint = keyof typeof BREAKPOINTS;

export function useBreakpoint(breakpoint: Breakpoint) {
	const [matches, setMatches] = useState(false);

	useEffect(() => {
		const media = window.matchMedia(
			`(min-width: ${BREAKPOINTS[breakpoint]}px)`
		);

		const update = () => setMatches(media.matches);

		update();
		media.addEventListener("change", update);

		return () => media.removeEventListener("change", update);
	}, [breakpoint]);

	return matches;
}

export function useTwBreakpoint() {
	const [breakpoint, setBreakpoint] = useState<Breakpoint>("base");

	useEffect(() => {
		const update = () => {
			const width = window.innerWidth;

			if (width >= BREAKPOINTS["2xl"]) setBreakpoint("2xl");
			else if (width >= BREAKPOINTS.xl) setBreakpoint("xl");
			else if (width >= BREAKPOINTS.lg) setBreakpoint("lg");
			else if (width >= BREAKPOINTS.md) setBreakpoint("md");
			else if (width >= BREAKPOINTS.sm) setBreakpoint("sm");
			else setBreakpoint("base");
		};

		update();
		window.addEventListener("resize", update);

		return () => window.removeEventListener("resize", update);
	}, []);

	return breakpoint;
}

const ORDER: Breakpoint[] = ["base", "sm", "md", "lg", "xl", "2xl"];

export function useResponsive<T>(
	values: Partial<Record<Breakpoint, T>>
): T | undefined {
	const breakpoint = useTwBreakpoint();

	const currentIndex = ORDER.indexOf(breakpoint);

	for (let i = currentIndex; i >= 0; i--) {
		const value = values[ORDER[i]];

		if (value !== undefined) {
			return value;
		}
	}

	return undefined;
}

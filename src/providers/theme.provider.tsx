"use client";

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useLayoutEffect,
	useMemo,
	useState,
} from "react";
import {
	DARK_MEDIA_QUERY,
	isTheme,
	type ResolvedTheme,
	THEME_STORAGE_KEY,
	THEMES,
	type Theme,
} from "./theme.constants";

// On the server a layout effect would only trigger React's SSR warning, so it
// degrades to useEffect there (it runs on the client either way).
const useIsomorphicLayoutEffect =
	typeof window === "undefined" ? useEffect : useLayoutEffect;

type ThemeContextValue = {
	/** Stored preference: light, dark or system. */
	theme: Theme;
	/** The theme actually applied to <html>. */
	resolvedTheme: ResolvedTheme;
	setTheme: (theme: Theme) => void;
	themes: Theme[];
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): Theme | null {
	try {
		const stored = localStorage.getItem(THEME_STORAGE_KEY);
		return isTheme(stored) ? stored : null;
	} catch {
		return null;
	}
}

function supportsMediaQuery() {
	return (
		typeof window !== "undefined" && typeof window.matchMedia === "function"
	);
}

function systemTheme(): ResolvedTheme {
	return supportsMediaQuery() && window.matchMedia(DARK_MEDIA_QUERY).matches
		? "dark"
		: "light";
}

function applyTheme(resolved: ResolvedTheme) {
	const root = document.documentElement;
	root.classList.remove("light", "dark");
	root.classList.add(resolved);
	root.style.colorScheme = resolved;
}

/**
 * Small, dependency-free theme provider.
 *
 * No inline bootstrap script is used: React 19 warns ("Encountered a script tag
 * while rendering React component") for any <script> a component renders, and a
 * cookie-based server read would force every page to render dynamically. The
 * stored preference is therefore applied in a layout effect, which runs before
 * the hydrated tree is painted.
 */
export function ThemeProvider({
	children,
	defaultTheme = "light",
}: {
	children: ReactNode;
	defaultTheme?: Theme;
}) {
	const [theme, setThemeState] = useState<Theme>(defaultTheme);
	const [system, setSystem] = useState<ResolvedTheme>("light");
	const [ready, setReady] = useState(false);

	// Adopt the stored preference as early as the client allows.
	useIsomorphicLayoutEffect(() => {
		const stored = readStoredTheme();
		if (stored) setThemeState(stored);
		setSystem(systemTheme());
		setReady(true);
	}, []);

	// Follow the OS setting while "system" is selected.
	useEffect(() => {
		if (!supportsMediaQuery()) return;

		const query = window.matchMedia(DARK_MEDIA_QUERY);
		const onChange = () => setSystem(query.matches ? "dark" : "light");
		query.addEventListener("change", onChange);
		return () => query.removeEventListener("change", onChange);
	}, []);

	// Keep other tabs in sync.
	useEffect(() => {
		const onStorage = (event: StorageEvent) => {
			if (event.key !== THEME_STORAGE_KEY) return;
			setThemeState(isTheme(event.newValue) ? event.newValue : defaultTheme);
		};
		window.addEventListener("storage", onStorage);
		return () => window.removeEventListener("storage", onStorage);
	}, [defaultTheme]);

	const resolvedTheme: ResolvedTheme = theme === "system" ? system : theme;

	// Reflect the resolved theme on <html> as early as possible.
	useIsomorphicLayoutEffect(() => {
		if (!ready) return;
		applyTheme(resolvedTheme);
	}, [ready, resolvedTheme]);

	const setTheme = useCallback((next: Theme) => {
		setThemeState(next);
		try {
			localStorage.setItem(THEME_STORAGE_KEY, next);
		} catch {
			// Storage can be unavailable (private mode); the UI still updates.
		}
	}, []);

	const value = useMemo(
		() => ({ theme, resolvedTheme, setTheme, themes: THEMES }),
		[theme, resolvedTheme, setTheme]
	);

	return (
		<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error("useTheme must be used inside a ThemeProvider");
	}
	return context;
}

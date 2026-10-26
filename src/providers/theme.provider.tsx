"use client";

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import {
	type ResolvedTheme,
	THEME_STORAGE_KEY,
	THEMES,
	type Theme,
} from "./theme-script";

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
		return stored === "light" || stored === "dark" || stored === "system"
			? stored
			: null;
	} catch {
		return null;
	}
}

const DARK_QUERY = "(prefers-color-scheme: dark)";

function supportsMediaQuery() {
	return (
		typeof window !== "undefined" && typeof window.matchMedia === "function"
	);
}

function systemTheme(): ResolvedTheme {
	return supportsMediaQuery() && window.matchMedia(DARK_QUERY).matches
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
 * `next-themes` renders an inline <script> from a client component, which
 * React 19 reports in development as "Encountered a script tag while rendering
 * React component". Here the pre-paint script is rendered once by the server
 * layout (`themeInitScript`) and this provider only syncs state with it.
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

	// Adopt the preference the pre-paint script already used.
	useEffect(() => {
		const stored = readStoredTheme();
		if (stored) setThemeState(stored);
		setSystem(systemTheme());
		setReady(true);
	}, []);

	// Follow the OS setting while "system" is selected.
	useEffect(() => {
		if (!supportsMediaQuery()) return;

		const query = window.matchMedia(DARK_QUERY);
		const onChange = () => setSystem(query.matches ? "dark" : "light");
		query.addEventListener("change", onChange);
		return () => query.removeEventListener("change", onChange);
	}, []);

	// Keep other tabs in sync.
	useEffect(() => {
		const onStorage = (event: StorageEvent) => {
			if (event.key !== THEME_STORAGE_KEY) return;
			const next = event.newValue;
			setThemeState(
				next === "light" || next === "dark" || next === "system"
					? next
					: defaultTheme
			);
		};
		window.addEventListener("storage", onStorage);
		return () => window.removeEventListener("storage", onStorage);
	}, [defaultTheme]);

	const resolvedTheme: ResolvedTheme = theme === "system" ? system : theme;

	// Skip the first pass: the server-rendered script already painted it.
	useEffect(() => {
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

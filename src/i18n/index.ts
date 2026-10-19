export const locales = ["fa", "ps", "en"] as const;
export const defaultLocale = "fa";
export type Locale = (typeof locales)[number];

export function normalizedLocale(locale: string): Locale {
	return locales.includes(locale as Locale)
		? (locale as Locale)
		: defaultLocale;
}

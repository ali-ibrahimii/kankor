import { defineRouting } from "next-intl/routing";
import { type Locale, locales } from ".";

export const routing = defineRouting({
	locales,
	defaultLocale: "fa",
	// Always show the locale in the URL (/fa/..., /en/..., /ps/...), including
	// the default — keeps links shareable/deep-linkable across languages.
	localePrefix: "always",
});

const rtlLocales: Locale[] = ["fa", "ps"];

export function isRtl(locale: string): boolean {
	return rtlLocales.includes(locale as Locale);
}

export function dirOf(locale: string): "rtl" | "ltr" {
	return isRtl(locale) ? "rtl" : "ltr";
}

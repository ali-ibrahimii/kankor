import { getRequestConfig } from "next-intl/server";

import type { Locale } from "./";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
	const requested = await requestLocale;
	const locale = (routing.locales as readonly string[]).includes(
		requested as Locale
	)
		? (requested as Locale)
		: routing.defaultLocale;

	return {
		locale,
		messages: (await import(`../messages/${locale}.json`)).default,
	};
});

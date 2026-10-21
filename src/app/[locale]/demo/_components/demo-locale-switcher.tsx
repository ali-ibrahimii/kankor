"use client";

import { Globe } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { type Locale, locales } from "@/i18n";
import { usePathname, useRouter } from "@/i18n/navigation";

/**
 * Locale switcher for the demo — keeps the current query string (i.e. the
 * selected role) when moving between fa / ps / en, unlike the app's switcher
 * which only navigates to the pathname.
 */
export function DemoLocaleSwitcher() {
	const locale = useLocale();
	const t = useTranslations("landing");
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	function changeLocale(nextLocale: string) {
		if (!nextLocale || nextLocale === locale) return;
		const query = searchParams.toString();
		router.replace(query ? `${pathname}?${query}` : pathname, {
			locale: nextLocale as Locale,
		});
	}

	return (
		<Select value={locale} onValueChange={changeLocale}>
			<SelectTrigger
				aria-label={t("locales.fa")}
				className="h-9 w-fit gap-1.5 rounded-xl border-border/70"
			>
				<Globe className="size-3.5 text-muted-foreground" />
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{locales.map((item) => (
					<SelectItem key={item} value={item}>
						{t(`locales.${item}`)}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

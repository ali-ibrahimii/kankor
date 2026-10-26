"use client";

import { Globe2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { useResponsive } from "@/hooks/use-breakpoint";
import { Locale, locales } from "@/i18n";
import { usePathname, useRouter } from "@/i18n/navigation";
import { updateProfile } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";
import { useIsAuthenticated } from "@/providers/auth.provider";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";

type Props = {
	type?: "select" | "group";
	responsive?: boolean;
};

export function LocaleSwitcher({
	type: requestedType = "select",
	responsive = true,
}: Props) {
	const locale = useLocale();
	const t = useTranslations("landing");
	const router = useRouter();
	const pathname = usePathname();
	const isAuthenticated = useIsAuthenticated();
	const type = useResponsive({
		md: requestedType,
		base: responsive ? "select" : requestedType,
	});

	async function updateLocale(nextLocale: string) {
		if (!nextLocale || nextLocale === locale) return;
		router.replace(pathname, { locale: nextLocale });
		if (isAuthenticated) {
			await updateProfile({ locale: nextLocale as Locale });
		}
	}

	if (type === "group") {
		return (
			<div className="inline-flex h-10 items-center gap-1 rounded-2xl border border-border/75 bg-background/85 p-1 shadow-sm backdrop-blur-sm">
				<Globe2
					className="ms-1 size-4 shrink-0 text-muted-foreground"
					aria-hidden="true"
				/>
				<div
					role="group"
					aria-label={t("localeSwitcherLabel")}
					className="flex h-full items-center gap-0.5"
				>
					{locales.map((itemLocale) => {
						const active = locale === itemLocale;
						return (
							<button
								key={itemLocale}
								type="button"
								aria-label={t(`locales.${itemLocale}`)}
								aria-pressed={active}
								title={t(`locales.${itemLocale}`)}
								onClick={() => void updateLocale(itemLocale)}
								className={cn(
									"inline-flex h-full min-w-9 items-center justify-center rounded-xl px-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
									active
										? "bg-primary text-primary-foreground shadow-sm"
										: "text-muted-foreground hover:bg-muted hover:text-foreground"
								)}
							>
								<span className="hidden whitespace-nowrap sm:inline">
									{t(`locales.${itemLocale}`)}
								</span>
								<span
									data-testid="mobile-locale-code"
									className="uppercase sm:hidden"
								>
									{itemLocale.toUpperCase()}
								</span>
							</button>
						);
					})}
				</div>
			</div>
		);
	}

	return (
		<Select
			value={locale}
			onValueChange={(nextLocale) => void updateLocale(nextLocale)}
		>
			<SelectTrigger
				aria-label={t("localeSwitcherLabel")}
				className="h-10 w-fit min-w-[138px] gap-2 rounded-xl border-border/75 bg-background/85 px-3 shadow-sm backdrop-blur-sm transition-colors hover:border-primary/35 hover:bg-background"
			>
				<Globe2 className="size-4 shrink-0 text-primary" aria-hidden="true" />
				<span className="hidden sm:inline">
					<SelectValue />
				</span>
				<span
					data-testid="mobile-locale-code"
					className="inline text-xs font-semibold uppercase sm:hidden"
				>
					{locale.toUpperCase()}
				</span>
			</SelectTrigger>
			<SelectContent align="end" className="min-w-[180px] rounded-xl p-1.5">
				{locales.map((itemLocale) => (
					<SelectItem
						key={itemLocale}
						value={itemLocale}
						className="cursor-pointer rounded-lg py-2.5"
					>
						<span className="font-medium">{t(`locales.${itemLocale}`)}</span>
						<span className="ms-auto text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
							{itemLocale}
						</span>
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

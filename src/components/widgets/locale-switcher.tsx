"use client";

import { Check, ChevronDown, Globe2, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";

import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Locale, locales } from "@/i18n";
import { usePathname, useRouter } from "@/i18n/navigation";
import { updateProfile } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";
import { useIsAuthenticated } from "@/providers/auth.provider";

type Props = {
	/** Visual density. `compact` keeps only the language code in the trigger. */
	size?: "default" | "compact";
	className?: string;
};

const localeMeta: Record<string, { code: string; tint: string }> = {
	fa: {
		code: "در",
		tint: "from-[#8c6aff] to-[#6246be]",
	},
	ps: {
		code: "پښ",
		tint: "from-[#31c6a8] to-[#1f8a76]",
	},
	en: {
		code: "EN",
		tint: "from-[#4f8ef7] to-[#2f63c8]",
	},
};

function useLanguageNames(uiLocale: string) {
	return useMemo(() => {
		const names: Record<string, string> = {};
		try {
			const display = new Intl.DisplayNames([uiLocale], {
				type: "language",
			});
			for (const itemLocale of locales) {
				names[itemLocale] = display.of(itemLocale) ?? itemLocale;
			}
		} catch {
			for (const itemLocale of locales) {
				names[itemLocale] = itemLocale;
			}
		}
		return names;
	}, [uiLocale]);
}

/**
 * Language switcher — a compact glass pill that opens a polished language
 * menu. Replaces the old cramped segmented control that overflowed the
 * navbar (Pashto was clipped) and the native-select fallback.
 */
export function LocaleSwitcher({ size = "default", className }: Props) {
	const locale = useLocale();
	const t = useTranslations("landing");
	const router = useRouter();
	const pathname = usePathname();
	const isAuthenticated = useIsAuthenticated();
	const [open, setOpen] = useState(false);
	const [pending, startTransition] = useTransition();
	const languageNames = useLanguageNames(locale);

	function selectLocale(nextLocale: string) {
		setOpen(false);
		if (!nextLocale || nextLocale === locale) return;

		startTransition(() => {
			router.replace(pathname, { locale: nextLocale });
		});

		if (isAuthenticated) {
			void updateProfile({ locale: nextLocale as Locale });
		}
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					type="button"
					aria-label={`${t("localeSwitcherLabel")}: ${t(`locales.${locale}`)}`}
					aria-haspopup="listbox"
					aria-expanded={open}
					className={cn(
						"group relative inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-border/70 bg-card/70 py-1 ps-1.5 pe-2.5 text-xs font-bold text-foreground shadow-[0_6px_20px_-14px_rgba(25,36,59,0.6)] backdrop-blur-md transition-colors duration-200",
						"hover:border-primary/35 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
						open && "border-primary/40 bg-card",
						size === "compact" && "gap-1.5 pe-2",
						className
					)}
				>
					<span className="relative flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#b7f486] via-[#7ce5d1] to-[#b8a4ff] text-[#16213a] shadow-inner">
						{pending ? (
							<Loader2 className="size-3.5 animate-spin" />
						) : (
							<Globe2 className="size-3.5" aria-hidden="true" />
						)}
					</span>

					{size === "compact" ? (
						<span className="text-[11px] font-black uppercase tracking-wide text-foreground/85">
							{locale}
						</span>
					) : (
						<span className="flex max-w-24 flex-col items-start leading-none">
							<span className="truncate text-xs font-extrabold text-foreground">
								{t(`locales.${locale}`)}
							</span>
							<span className="mt-1 hidden truncate text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:block">
								{languageNames[locale]}
							</span>
						</span>
					)}

					<ChevronDown
						aria-hidden="true"
						className={cn(
							"size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:text-foreground",
							open && "rotate-180"
						)}
					/>
				</button>
			</PopoverTrigger>

			<PopoverContent
				align="end"
				sideOffset={10}
				className="w-[262px] gap-0 overflow-hidden rounded-2xl border border-border/70 bg-popover/95 p-0 shadow-[0_24px_60px_-24px_rgba(20,28,54,0.45)] backdrop-blur-xl"
			>
				<div className="flex items-center gap-2 border-b border-border/60 bg-muted/40 px-4 py-3">
					<span className="flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
						<Globe2 className="size-3.5" aria-hidden="true" />
					</span>
					<p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
						{t("localeSwitcherLabel")}
					</p>
				</div>

				<div
					role="listbox"
					aria-label={t("localeSwitcherLabel")}
					className="p-1.5"
				>
					{locales.map((itemLocale) => {
						const active = itemLocale === locale;
						const meta = localeMeta[itemLocale];
						return (
							// biome-ignore lint/a11y/useSemanticElements: options must be interactive buttons
							<button
								key={itemLocale}
								type="button"
								role="option"
								aria-selected={active}
								aria-label={t(`locales.${itemLocale}`)}
								onClick={() => selectLocale(itemLocale)}
								className={cn(
									"flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-start transition-colors duration-150",
									active
										? "bg-primary/8 ring-1 ring-inset ring-primary/15"
										: "hover:bg-muted/70"
								)}
							>
								<span
									className={cn(
										"flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[11px] font-black text-white shadow-sm",
										meta?.tint ?? "from-slate-500 to-slate-700"
									)}
								>
									{meta?.code ?? itemLocale.toUpperCase()}
								</span>

								<span className="flex min-w-0 flex-1 flex-col">
									<span className="truncate text-[13px] font-extrabold text-foreground">
										{t(`locales.${itemLocale}`)}
									</span>
									<span className="mt-0.5 truncate text-[10px] font-semibold text-muted-foreground">
										{languageNames[itemLocale]}
									</span>
								</span>

								<span
									className={cn(
										"flex size-5 shrink-0 items-center justify-center rounded-full transition-colors",
										active
											? "bg-primary text-primary-foreground"
											: "border border-border/80 text-transparent"
									)}
								>
									<Check
										className="size-3"
										strokeWidth={3}
										aria-hidden="true"
									/>
								</span>
							</button>
						);
					})}
				</div>
			</PopoverContent>
		</Popover>
	);
}

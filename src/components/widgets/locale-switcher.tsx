"use client";

import { Check, ChevronDown, Globe2, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";

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
	/** `compact` shows only the locale code — used on small screens. */
	size?: "default" | "compact";
	className?: string;
};

/**
 * Minimal language switch: a quiet pill that opens a short list of languages.
 */
export function LocaleSwitcher({ size = "default", className }: Props) {
	const locale = useLocale();
	const t = useTranslations("landing");
	const router = useRouter();
	const pathname = usePathname();
	const isAuthenticated = useIsAuthenticated();
	const [open, setOpen] = useState(false);
	const [pending, startTransition] = useTransition();

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
						"inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-2.5 text-xs font-semibold text-foreground transition-colors",
						"hover:border-border hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
						open && "border-border bg-card",
						size === "compact" && "px-2",
						className
					)}
				>
					{pending ? (
						<Loader2 className="size-3.5 animate-spin text-muted-foreground" />
					) : (
						<Globe2
							className="size-3.5 text-muted-foreground"
							aria-hidden="true"
						/>
					)}

					{size === "compact" ? (
						<span className="text-[11px] font-bold uppercase">{locale}</span>
					) : (
						<span className="max-w-24 truncate">{t(`locales.${locale}`)}</span>
					)}

					<ChevronDown
						aria-hidden="true"
						className={cn(
							"size-3.5 text-muted-foreground transition-transform duration-200",
							open && "rotate-180"
						)}
					/>
				</button>
			</PopoverTrigger>

			<PopoverContent
				align="end"
				sideOffset={8}
				className="w-[188px] gap-0 overflow-hidden rounded-xl border border-border/70 bg-popover p-1 shadow-[0_16px_40px_-22px_rgba(20,28,54,.45)]"
			>
				<div role="listbox" aria-label={t("localeSwitcherLabel")}>
					{locales.map((itemLocale) => {
						const active = itemLocale === locale;
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
									"flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-start text-xs transition-colors",
									active
										? "font-bold text-primary"
										: "font-medium text-foreground/85 hover:bg-muted/70 hover:text-foreground"
								)}
							>
								<span className="truncate">{t(`locales.${itemLocale}`)}</span>

								{active && (
									<Check
										className="size-3.5 shrink-0 text-primary"
										strokeWidth={3}
										aria-hidden="true"
									/>
								)}
							</button>
						);
					})}
				</div>
			</PopoverContent>
		</Popover>
	);
}

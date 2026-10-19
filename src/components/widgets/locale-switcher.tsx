"use client";
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
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";

type Props = {
	type?: "select" | "group";
	responsive?: boolean;
};

export function LocaleSwitcher({
	type: _type = "select",
	responsive = true,
}: Props) {
	const locale = useLocale();
	const t = useTranslations("landing");
	const router = useRouter();
	const pathname = usePathname();
	const isAuthenticated = useIsAuthenticated();
	const type = useResponsive({
		md: _type,
		base: responsive ? "select" : _type,
	});

	async function updateLocale(nextLocale: string) {
		if (!nextLocale || nextLocale === locale) return;
		router.replace(pathname, { locale: nextLocale });
		if (isAuthenticated) {
			await updateProfile({ locale: nextLocale as Locale });
		}
	}

	if (type === "group")
		return (
			<ToggleGroup
				size={"sm"}
				variant="outline"
				type="single"
				value={locale}
				onValueChange={(val) => {
					if (val) updateLocale(val);
				}}
				className="border p-0.5 h-9"
			>
				{locales.map((l) => (
					<ToggleGroupItem
						key={l}
						value={l}
						aria-label={`Toggle ${l}`}
						className={cn(
							"px-2.5 py-1.5 text-xs font-medium transition-all ring-0 border-0 shadow-none drop-shadow-none h-full",
							locale === l
								? "bg-[#1461B8] text-white shadow-sm"
								: "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
						)}
					>
						<span className="hidden sm:inline">{t(`locales.${l}`)}</span>
						<span
							data-testid="mobile-locale-code"
							className="inline sm:hidden uppercase"
						>
							{l.toUpperCase()}
						</span>
					</ToggleGroupItem>
				))}
			</ToggleGroup>
		);

	return (
		<Select
			value={locale}
			onValueChange={(nextLocale) => {
				updateLocale(nextLocale);
			}}
		>
			<SelectTrigger className="w-fit gap-1">
				<span className="hidden sm:inline-block">
					<SelectValue />
				</span>
				<span
					data-testid="mobile-locale-code"
					className="inline-block sm:hidden uppercase font-medium text-xs"
				>
					{locale.toUpperCase()}
				</span>
			</SelectTrigger>
			<SelectContent>
				{locales.map((locale) => (
					<SelectItem key={locale} value={locale}>
						{t(`locales.${locale}`)}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

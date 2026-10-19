import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/navigation";

// Helper for active route check
export function useIsPathActive(path?: string) {
	const pathname = usePathname();
	const route = path || pathname;
	const locale = useLocale();
	const clearPath = route.replace(new RegExp(`^/${locale}(?=/|$)`), "") || "/";
	return (href: string) =>
		href === "/"
			? clearPath === "/"
			: clearPath === href || clearPath.startsWith(`${href}/`);
}

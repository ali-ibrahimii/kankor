import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/navigation";

// Helper for active route check
export function useIsPathActive(path?: string) {
	const pathname = usePathname();
	const route = path || pathname;
	const locale = useLocale();
	const clearPath = route.replace(`/${locale}`, "") || "/";
	return (href: string) =>
		href === "/" ? clearPath === "/" : clearPath.startsWith(href);
}

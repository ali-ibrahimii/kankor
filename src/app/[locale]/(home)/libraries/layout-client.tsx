"use client";

import { useLocale, useTranslations } from "next-intl";
import { LogoBlueRounded } from "@/components/logos/logos";
import { LocaleSwitcher } from "@/components/widgets/locale-switcher";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { useAuth } from "@/providers/auth.provider";

export function LibraryLayoutClient({
	children,
}: {
	children: React.ReactNode;
}) {
	const { dashboardPath, isAuthenticated } = useAuth();
	const locale = useLocale();
	const t = useTranslations("landing");
	const ta = useTranslations("app");

	const signInUrl = routes.auth.login.page();
	const instructorUrl = routes.auth.signup.page({ type: "instructor" });
	const schoolUrl = routes.auth.signup.page({ type: "school" });

	return (
		<div className="min-h-screen bg-slate-50/50 flex flex-col">
			{/* Header */}
			<header className="sticky top-0 z-50 border-b border-gray-100 bg-white/85 backdrop-blur-md">
				<nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
					<Link href="/" className="flex shrink-0 items-center gap-3">
						<LogoBlueRounded className="size-9 shrink-0" />
						<span className="hidden text-lg font-semibold text-[#1461B8] sm:block">
							{ta("name")}
						</span>
					</Link>

					<div className="flex items-center gap-2">
						<LocaleSwitcher />

						<Link
							href={isAuthenticated ? dashboardPath : signInUrl}
							className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
						>
							{isAuthenticated ? t("header.dashboard") : t("header.signIn")}
						</Link>
					</div>
				</nav>
			</header>

			{/* Main Content */}
			<main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{children}
			</main>

			{/* Footer */}
			<footer className="border-t border-gray-100 bg-white px-4 py-10 sm:px-6 lg:px-8 mt-auto">
				<div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
					<div className="flex items-center gap-3">
						<LogoBlueRounded className="size-8 shrink-0" />
						<span className="text-sm text-gray-400">
							{t("footer.copyright", { year: new Date().getFullYear() })}
						</span>
					</div>
					<div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
						<Link
							href={routes.privacyPolicy.page()}
							className="text-sm text-gray-500 transition-colors hover:text-gray-900"
						>
							{t("footer.privacy")}
						</Link>
						<Link
							href={routes.termsOfUse.page()}
							className="text-sm text-gray-500 transition-colors hover:text-gray-900"
						>
							{t("footer.terms")}
						</Link>
						<span className="hidden h-4 w-px bg-gray-200 sm:block" />
						<Link
							href={instructorUrl}
							className="text-sm text-gray-500 transition-colors hover:text-gray-900"
						>
							{t("footer.instructorSignup")}
						</Link>
						<Link
							href={schoolUrl}
							className="text-sm text-gray-500 transition-colors hover:text-gray-900"
						>
							{t("footer.schoolSignup")}
						</Link>
					</div>
				</div>
			</footer>
		</div>
	);
}

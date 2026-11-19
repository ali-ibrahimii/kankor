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
		<div className="flex min-h-screen flex-col bg-background">
			{/* Header */}
			<header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md">
				<nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
					<Link href="/" className="flex shrink-0 items-center gap-3">
						<LogoBlueRounded className="size-9 shrink-0" />
						<span className="hidden text-lg font-semibold text-primary sm:block">
							{ta("name")}
						</span>
					</Link>

					<div className="flex items-center gap-2">
						<LocaleSwitcher />

						<Link
							href={isAuthenticated ? dashboardPath : signInUrl}
							className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
						>
							{isAuthenticated ? t("header.dashboard") : t("header.signIn")}
						</Link>
					</div>
				</nav>
			</header>

			{/* Main Content */}
			<main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
				{children}
			</main>

			{/* Footer */}
			<footer className="mt-auto border-t border-border/70 bg-background px-4 py-10 sm:px-6 lg:px-8">
				<div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
					<div className="flex items-center gap-3">
						<LogoBlueRounded className="size-8 shrink-0" />
						<span className="text-sm text-muted-foreground">
							{t("footer.copyright", { year: new Date().getFullYear() })}
						</span>
					</div>
					<div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
						<Link
							href={routes.privacyPolicy.page()}
							className="text-sm text-muted-foreground transition-colors hover:text-foreground"
						>
							{t("footer.privacy")}
						</Link>
						<Link
							href={routes.termsOfUse.page()}
							className="text-sm text-muted-foreground transition-colors hover:text-foreground"
						>
							{t("footer.terms")}
						</Link>
						<span className="hidden h-4 w-px bg-border sm:block" />
						<Link
							href={instructorUrl}
							className="text-sm text-muted-foreground transition-colors hover:text-foreground"
						>
							{t("footer.instructorSignup")}
						</Link>
						<Link
							href={schoolUrl}
							className="text-sm text-muted-foreground transition-colors hover:text-foreground"
						>
							{t("footer.schoolSignup")}
						</Link>
					</div>
				</div>
			</footer>
		</div>
	);
}

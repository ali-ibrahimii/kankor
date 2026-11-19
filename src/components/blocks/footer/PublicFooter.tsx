import { getTranslations } from "next-intl/server";
import { LogoBlueRounded } from "@/components/logos/logos";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";

export async function PublicFooter() {
	const t = await getTranslations("landing");
	const instructorUrl = routes.auth.signup.page({ type: "instructor" });
	const schoolUrl = routes.auth.signup.page({ type: "school" });

	return (
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
	);
}

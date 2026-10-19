import { getTranslations } from "next-intl/server";
import { LogoBlueRounded } from "@/components/logos/logos";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";

export async function PublicFooter() {
	const t = await getTranslations("landing");
	const instructorUrl = routes.auth.signup.page({ type: "instructor" });
	const schoolUrl = routes.auth.signup.page({ type: "school" });

	return (
		<footer className="border-t border-gray-100 bg-white px-4 py-10 sm:px-6 lg:px-8 mt-auto">
			<div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
				<div className="flex items-center gap-3">
					<LogoBlueRounded className="size-8 shrink-0" />
					<span className="text-sm text-gray-500">
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
	);
}

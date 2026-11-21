import { getTranslations } from "next-intl/server";
import { LogoEdule } from "@/components/logos/logos";
import {
	EduleArrowDoodle,
	FacebookIcon,
	InstagramIcon,
	TwitterIcon,
	YoutubeIcon,
} from "@/components/widgets/edule-sprites";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";

const FOOTER_SOCIAL_LINKS = [
	{
		href: "https://facebook.com/abzarkankor",
		label: "Facebook",
		Icon: FacebookIcon,
	},
	{
		href: "https://twitter.com/abzarkankor",
		label: "Twitter",
		Icon: TwitterIcon,
	},
	{
		href: "https://youtube.com/@abzarkankor",
		label: "YouTube",
		Icon: YoutubeIcon,
	},
	{
		href: "https://instagram.com/abzarkankor",
		label: "Instagram",
		Icon: InstagramIcon,
	},
] as const;

export async function PublicFooter() {
	const t = await getTranslations("landing");
	const app = await getTranslations("app");
	const instructorUrl = routes.auth.signup.page({ type: "instructor" });
	const schoolUrl = routes.auth.signup.page({ type: "school" });

	return (
		<footer className="public-footer mt-auto bg-white pb-8 dark:bg-[#251c19]">
			{/* EduLe instructor CTA card */}
			<div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
				<div className="relative overflow-hidden rounded-[26px] bg-[#faf6ee] px-6 py-10 sm:px-12 dark:bg-[#251c19]">
					<div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
						<div className="max-w-xl">
							<p className="text-sm font-bold text-emerald-900/70 dark:text-emerald-300/80">
								{t("footer.tagline")}
							</p>

							<h2 className="mt-3 text-[1.45rem] font-black leading-[1.6] text-[#3b2621] sm:text-2xl dark:text-slate-100">
								{t.rich("footer.joinHeading", {
									accent: (chunks) => (
										<span className="relative inline-block text-[#02656b] dark:text-emerald-400">
											{chunks}

											<span
												aria-hidden="true"
												className="absolute inset-x-0 -bottom-1 h-[3px] rounded-full bg-[#02656b]/55 dark:bg-emerald-400/50"
											/>
										</span>
									),
								})}
							</h2>
						</div>

						<div className="flex items-center gap-6">
							<EduleArrowDoodle className="hidden lg:block rtl:-scale-x-100" />

							<Link
								href={instructorUrl}
								className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-edule-green px-7 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-edule-green/90"
							>
								{t("footer.joinButton")}
							</Link>
						</div>
					</div>
				</div>
			</div>

			<div className="footer-links mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
				<div className="footer-brand">
					<div className="flex items-center gap-3">
						<LogoEdule className="public-logo size-11" />
						<h3 className="mb-0! text-xl">{app("name")}</h3>
					</div>
					<p className="mt-5 max-w-sm text-sm leading-8 text-muted-foreground">
						{t("design.footerDescription")}
					</p>
				</div>
				<div>
					<h3>{t("design.explore")}</h3>
					<Link href={routes.courses.page()}>{t("header.school")}</Link>
					<Link href={routes.libraries.page()}>
						{t("schoolMenu.items.library.title")}
					</Link>
					<Link href={routes.decks.page()}>{t("header.decks")}</Link>
					<Link href={routes.quizzes.page()}>{t("header.quizzes")}</Link>
				</div>
				<div>
					<h3>{t("design.community")}</h3>
					<Link href={routes.about.page()}>{t("header.aboutUs")}</Link>
					<Link href={instructorUrl}>{t("footer.instructorSignup")}</Link>
					<Link href={schoolUrl}>{t("footer.schoolSignup")}</Link>
					<Link href={routes.verify.page()}>{t("schoolMenu.verify")}</Link>
				</div>
			</div>

			{/* Copyright + legal + social row */}
			<div className="mx-auto mt-8 max-w-[1320px] px-4 sm:px-6 lg:px-8">
				<div className="flex flex-col items-center justify-between gap-4 border-t border-border/70 pt-6 sm:flex-row">
					<div className="flex items-center gap-3">
						<LogoEdule className="public-logo size-8 shrink-0" />

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

						<span className="hidden h-4 w-px bg-border sm:block" />

						<div className="flex items-center gap-1">
							{FOOTER_SOCIAL_LINKS.map(({ href, label, Icon }) => (
								<a
									key={label}
									href={href}
									target="_blank"
									rel="noopener noreferrer"
									aria-label={label}
									className="flex size-7 items-center justify-center rounded-full text-emerald-800 transition-colors hover:bg-emerald-600/10 hover:text-emerald-600 dark:text-emerald-300 dark:hover:bg-emerald-400/10"
								>
									<Icon className="size-4" />
								</a>
							))}
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
}

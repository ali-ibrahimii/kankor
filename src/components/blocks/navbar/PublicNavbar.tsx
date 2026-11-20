import { ArrowRight, Mail, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import {
	CoursesMegaMenu,
	type SchoolMegaMenuItem,
} from "@/components/blocks/navbar/courses-mega-menu";
import { GlobalSearch } from "@/components/blocks/navbar/global-search";
import { LogoEdule } from "@/components/logos/logos";
import {
	FacebookIcon,
	InstagramIcon,
	TwitterIcon,
	YoutubeIcon,
} from "@/components/widgets/edule-sprites";
import { LocaleSwitcher } from "@/components/widgets/locale-switcher";
import { ThemeSwitcher } from "@/components/widgets/theme-switcher";
import { serializeQuery } from "@/hooks/filter/filter.utils";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import {
	DesktopNavLink,
	MobileNavSheet,
	NavbarScrollWrapper,
	PublicNavbarAuthButton,
	PublicNavbarSignupButton,
	type ResolvedNavLink,
} from "./public-navbar-client";

const GENERAL_BOOKS_CATEGORY_ID = "9e062cba-47c7-4491-a51b-a894348103e8";

const SOCIAL_LINKS = [
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

export async function PublicNavbar() {
	const t = await getTranslations("landing");
	const ta = await getTranslations("app");
	const schoolMenu = await getTranslations("landing.schoolMenu");

	const generalBooksHref = routes.libraries.page({
		filters: new URLSearchParams(
			serializeQuery<"libraries">({
				filters: [
					{
						field: "category_id",
						operator: "eq",
						value: GENERAL_BOOKS_CATEGORY_ID,
					},
				],
			})
		).toString(),
	});

	const schoolMenuItems: SchoolMegaMenuItem[] = [
		{
			key: "courses",
			title: schoolMenu("items.courses.title"),
			description: schoolMenu("items.courses.description"),
			href: routes.courses.page(),
		},
		{
			key: "schoolBooks",
			title: schoolMenu("items.schoolBooks.title"),
			description: schoolMenu("items.schoolBooks.description"),
			href: routes.libraries.page(),
		},
		{
			key: "library",
			title: schoolMenu("items.library.title"),
			description: schoolMenu("items.library.description"),
			href: generalBooksHref,
		},
		{
			key: "kankorForms",
			title: schoolMenu("items.kankorForms.title"),
			description: schoolMenu("items.kankorForms.description"),
			href: routes.quizzes.page(),
		},
		{
			key: "flashcards",
			title: schoolMenu("items.flashcards.title"),
			description: schoolMenu("items.flashcards.description"),
			href: routes.decks.page(),
		},
		{
			key: "roadmap",
			title: schoolMenu("items.roadmap.title"),
			description: schoolMenu("items.roadmap.description"),
			href: "/roadmap",
		},
	];

	const navLinks: ResolvedNavLink[] = [
		{
			href: routes.courses.page(),
			label: t("header.school"),
			children: [
				{
					href: routes.courses.page(),
					label: schoolMenu("items.courses.title"),
				},
				{
					href: routes.libraries.page(),
					label: schoolMenu("items.schoolBooks.title"),
				},
				{
					href: generalBooksHref,
					label: schoolMenu("items.library.title"),
				},
				{
					href: routes.quizzes.page(),
					label: schoolMenu("items.kankorForms.title"),
				},
				{
					href: routes.decks.page(),
					label: schoolMenu("items.flashcards.title"),
				},
				{
					href: "/roadmap",
					label: schoolMenu("items.roadmap.title"),
				},
				{
					href: routes.verify.page(),
					label: schoolMenu("verify"),
				},
			],
		},
		{ href: routes.decks.page(), label: t("header.decks") },
		{ href: routes.quizzes.page(), label: t("header.quizzes") },
		{ href: routes.about.page(), label: t("header.aboutUs") },
		{ href: "/roadmap", label: t("header.roadmap") },
	];

	return (
		<div className="flex flex-col">
			{/* EduLe announcement strip */}
			<div className="hidden border-b border-emerald-900/15 bg-[#dff0e4] lg:block dark:border-white/10 dark:bg-[#12241b]">
				<div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-3 py-1.5 sm:px-6 lg:px-8">
					<p className="flex min-w-0 items-center gap-2 text-[11px] font-medium text-emerald-950/85 dark:text-emerald-100/80">
						<span className="truncate">{t("topbar.promo")}</span>

						<Link
							href={routes.about.page()}
							className="inline-flex shrink-0 items-center gap-1 font-bold text-emerald-800 underline decoration-emerald-700/40 underline-offset-4 transition-colors hover:text-emerald-600 dark:text-emerald-300 dark:hover:text-emerald-200"
						>
							{t("topbar.promoLink")}

							<ArrowRight className="size-3 rtl:-scale-x-100" />
						</Link>
					</p>

					<div className="flex shrink-0 items-center gap-4 text-[11px] font-medium text-emerald-950/85 dark:text-emerald-100/80">
						<a
							href="tel:+989012235586"
							className="inline-flex items-center gap-1.5 transition-colors hover:text-emerald-700 dark:hover:text-emerald-300"
						>
							<Phone className="size-3" />

							<span dir="ltr">{t("topbar.phone")}</span>
						</a>

						<span className="h-3 w-px bg-emerald-900/20 dark:bg-white/15" />

						<a
							href={`mailto:${t("topbar.email")}`}
							className="inline-flex items-center gap-1.5 transition-colors hover:text-emerald-700 dark:hover:text-emerald-300"
						>
							<Mail className="size-3" />

							<span dir="ltr">{t("topbar.email")}</span>
						</a>

						<span className="h-3 w-px bg-emerald-900/20 dark:bg-white/15" />

						<div className="flex items-center gap-0.5">
							{SOCIAL_LINKS.map(({ href, label, Icon }) => (
								<a
									key={label}
									href={href}
									target="_blank"
									rel="noopener noreferrer"
									aria-label={label}
									className="flex size-6 items-center justify-center rounded-full text-emerald-950/80 transition-colors hover:bg-emerald-700/10 hover:text-emerald-700 dark:text-emerald-100/70 dark:hover:bg-white/10 dark:hover:text-emerald-200"
								>
									<Icon className="size-3.5" />
								</a>
							))}
						</div>
					</div>
				</div>
			</div>

			<NavbarScrollWrapper>
				{/* Brand Logo — EduLe book mark */}
				<Link
					href={routes.home.page()}
					aria-label={ta("name")}
					className="flex min-w-0 shrink-0 items-center gap-2.5 sm:gap-3"
				>
					<LogoEdule className="size-9 shrink-0 transition-transform hover:-rotate-3 sm:size-11" />

					<div className="flex min-w-0 flex-col">
						<span className="truncate font-edule text-sm font-black tracking-tight text-foreground sm:text-base">
							{ta("name")}
						</span>

						<span className="hidden text-[10px] font-medium text-muted-foreground sm:block">
							{t("showcase.modulesLabel")}
						</span>
					</div>
				</Link>

				{/* Desktop Navigation */}
				<div className="hidden items-center gap-1 lg:flex">
					{navLinks.slice(0, -1).map((link) =>
						link.href === routes.courses.page() ? (
							<CoursesMegaMenu
								key={link.href}
								label={link.label}
								allLabel={schoolMenu("all")}
								items={schoolMenuItems}
								verifyLabel={schoolMenu("verify")}
								classroomsLabel={schoolMenu("classrooms")}
							/>
						) : (
							<DesktopNavLink key={link.href} href={link.href}>
								{link.label}
							</DesktopNavLink>
						)
					)}
				</div>

				{/* End Section — Mobile-responsive controls with zero hydration mismatch */}
				<div className="flex shrink-0 items-center gap-1 sm:gap-2">
					<GlobalSearch />
					<LocaleSwitcher size="compact" className="md:hidden" />
					<LocaleSwitcher className="hidden md:inline-flex" />
					<ThemeSwitcher label={t("header.themeToggle")} />

					<PublicNavbarAuthButton
						signInLabel={t("header.signIn")}
						dashboardLabel={t("header.dashboard")}
					/>

					<PublicNavbarSignupButton signUpLabel={t("user.signUp")} />

					<MobileNavSheet
						navLinks={navLinks}
						brandName={ta("name")}
						signInLabel={t("header.signIn")}
						dashboardLabel={t("header.dashboard")}
						openMenuLabel={t("header.openMenu")}
						closeMenuLabel={t("header.closeMenu")}
					/>
				</div>
			</NavbarScrollWrapper>
		</div>
	);
}

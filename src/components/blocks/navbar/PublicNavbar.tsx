import { GraduationCap, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { CoursesMegaMenu } from "@/components/blocks/navbar/courses-mega-menu";
import { GlobalSearch } from "@/components/blocks/navbar/global-search";
import { LocaleSwitcher } from "@/components/widgets/locale-switcher";
import { ThemeSwitcher } from "@/components/widgets/theme-switcher";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import {
	DesktopNavLink,
	MobileNavSheet,
	NavbarScrollWrapper,
	PublicNavbarAuthButton,
} from "./public-navbar-client";

export async function PublicNavbar() {
	const t = await getTranslations("landing");
	const ta = await getTranslations("app");
	const courseMenu = await getTranslations("landing.coursesMenu");

	const navLinks = [
		{ href: routes.courses.page(), label: t("header.courses") },
		{ href: routes.decks.page(), label: t("header.decks") },
		{ href: routes.libraries.page(), label: t("header.libraries") },
		{ href: routes.quizzes.page(), label: t("header.quizzes") },
		{ href: routes.about.page(), label: t("header.aboutUs") },
		{ href: "/roadmap", label: t("header.roadmap") },
		{ href: routes.demo.page(), label: t("header.demo") },
	];

	return (
		<NavbarScrollWrapper>
			{/* Logo */}
			<Link
				href="/"
				aria-label={ta("name")}
				className="flex shrink-0 items-center gap-3"
			>
				<div className="flex size-10 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,#725bff,#343a6d)] text-[#b7f486] shadow-sm shadow-violet-300/50">
					<GraduationCap className="size-6" />
				</div>
				<div className="hidden flex-col sm:flex">
					<span className="text-base font-extrabold tracking-tight text-[#19243b]">
						{ta("name")}
					</span>
					<span className="text-[9px] font-semibold text-slate-400">
						{t("showcase.modulesLabel")}
					</span>
				</div>
			</Link>

			{/* Desktop Navigation */}
			<div className="hidden items-center gap-2 lg:flex">
				<div className="hidden items-center px-[4px] py-1 lg:flex">
					{navLinks.slice(0, -1).map((link) =>
						link.href === routes.courses.page() ? (
							<CoursesMegaMenu
								key={link.href}
								label={link.label}
								eyebrow={courseMenu("eyebrow")}
								title={courseMenu("title")}
								description={courseMenu("description")}
								allLabel={courseMenu("all")}
								subjectsLabel={courseMenu("subjects")}
								paths={courseMenu.raw("paths") as string[]}
								cardTitle={courseMenu("cardTitle")}
								cardText={courseMenu("cardText")}
							/>
						) : (
							<DesktopNavLink key={link.href} href={link.href}>
								{link.label}
							</DesktopNavLink>
						)
					)}
				</div>
			</div>

			{/* Right Section */}
			<div className="flex items-center w-full md:w-auto gap-2">
				<GlobalSearch classes={{ container: "grow md:grow-0" }} />
				<LocaleSwitcher type="group" />
				<ThemeSwitcher label={t("header.themeToggle")} />
				<Link
					href={routes.demo.page()}
					className="hidden items-center gap-1.5 rounded-xl bg-[#eee9ff] px-3.5 py-2.5 text-xs font-extrabold text-[#6545c9] transition hover:bg-[#e4daff] xl:inline-flex"
				>
					<Sparkles className="size-3.5" />
					{t("header.demo")}
				</Link>

				<PublicNavbarAuthButton
					signInLabel={t("header.signIn")}
					dashboardLabel={t("header.dashboard")}
				/>

				<MobileNavSheet
					navLinks={navLinks}
					brandName={ta("name")}
					signInLabel={t("header.signIn")}
				/>
			</div>
		</NavbarScrollWrapper>
	);
}

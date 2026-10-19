import { getTranslations } from "next-intl/server";
import { GlobalSearch } from "@/components/blocks/navbar/global-search";
import { LogoBlueRounded } from "@/components/logos/logos";
import { LocaleSwitcher } from "@/components/widgets/locale-switcher";
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

	const navLinks = [
		{ href: routes.courses.page(), label: t("header.courses") },
		{ href: routes.decks.page(), label: t("header.decks") },
		{ href: routes.libraries.page(), label: t("header.libraries") },
		{ href: routes.quizzes.page(), label: t("header.quizzes") },
		{ href: routes.about.page(), label: t("header.aboutUs") },
	];

	return (
		<NavbarScrollWrapper>
			{/* Logo */}
			<Link
				href="/"
				aria-label={ta("name")}
				className="flex shrink-0 items-center gap-3"
			>
				<div className="flex size-10 items-center justify-center">
					<LogoBlueRounded className="size-8 shrink-0" />
				</div>
				<div className="hidden flex-col sm:flex">
					<span className="text-lg font-semibold tracking-tight text-slate-900">
						{ta("name")}
					</span>
					<span className="text-[6px] font-semibold uppercase tracking-[0.32em] text-slate-500">
						Educational Platform
					</span>
				</div>
			</Link>

			{/* Desktop Navigation */}
			<div className="hidden items-center gap-2 lg:flex">
				<div className="hidden items-center px-[4px] py-1 lg:flex">
					{navLinks.map((link) => (
						<DesktopNavLink key={link.href} href={link.href}>
							{link.label}
						</DesktopNavLink>
					))}
				</div>
			</div>

			{/* Right Section */}
			<div className="flex items-center w-full md:w-auto gap-2">
				<GlobalSearch classes={{ container: "grow md:grow-0" }} />
				<LocaleSwitcher type="group" />

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

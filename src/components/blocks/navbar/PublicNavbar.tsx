import { GraduationCap } from "lucide-react";
import { getTranslations } from "next-intl/server";
import {
	CoursesMegaMenu,
	type SchoolMegaMenuItem,
} from "@/components/blocks/navbar/courses-mega-menu";
import { GlobalSearch } from "@/components/blocks/navbar/global-search";
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
	type ResolvedNavLink,
} from "./public-navbar-client";

const GENERAL_BOOKS_CATEGORY_ID = "9e062cba-47c7-4491-a51b-a894348103e8";

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
		<NavbarScrollWrapper>
			{/* Brand Logo */}
			<Link
				href={routes.home.page()}
				aria-label={ta("name")}
				className="flex min-w-0 shrink-0 items-center gap-2.5 sm:gap-3"
			>
				<div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#725bff] via-[#735fe7] to-[#36c6ab] text-white shadow-lg shadow-primary/25 transition-transform hover:-rotate-3 hover:scale-105 sm:size-11">
					<GraduationCap className="size-5 sm:size-6" />
				</div>
				<div className="flex min-w-0 flex-col">
					<span className="truncate text-sm font-black tracking-tight text-foreground sm:text-base">
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
							eyebrow={schoolMenu("eyebrow")}
							title={schoolMenu("title")}
							description={schoolMenu("description")}
							allLabel={schoolMenu("all")}
							subjectsLabel={schoolMenu("subjects")}
							gradesLabel={schoolMenu("gradesLabel")}
							paths={schoolMenu.raw("paths") as string[]}
							grades={schoolMenu.raw("grades") as string[]}
							items={schoolMenuItems}
							cardTitle={schoolMenu("cardTitle")}
							cardText={schoolMenu("cardText")}
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
				<div className="hidden md:block">
					<LocaleSwitcher type="group" responsive={false} />
				</div>
				<div className="md:hidden">
					<LocaleSwitcher type="select" responsive={false} />
				</div>
				<ThemeSwitcher label={t("header.themeToggle")} />

				<PublicNavbarAuthButton
					signInLabel={t("header.signIn")}
					dashboardLabel={t("header.dashboard")}
				/>

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
	);
}

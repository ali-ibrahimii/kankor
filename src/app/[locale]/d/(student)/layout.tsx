import {
	Award,
	Bell,
	Bookmark,
	BookOpen,
	Brain,
	FileText,
	GraduationCap,
	Home,
	Library,
	School,
	StickyNote,
	Wallet,
	Zap,
} from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import * as React from "react";
import {
	getUnreadNotificationCount,
	NotificationBell,
} from "@/components/blocks/notifications";
import { AppSidebar } from "@/components/blocks/sidebar/app-sidebar";
import type { MenuGroup, MenuParent } from "@/components/blocks/sidebar/types";
import { LogoBlueRounded } from "@/components/logos/logos";
import { Separator } from "@/components/ui/separator";
import {
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { LocaleSwitcher } from "@/components/widgets/locale-switcher";
import { getCurrentUser } from "@/lib/auth/session";
import { routes } from "@/lib/routes";

export default async function DashboardLayout({
	children,
	params,
}: React.PropsWithChildren<{ params: Promise<{ locale: string }> }>) {
	const { locale } = await params;
	const [t, ta, user] = await Promise.all([
		getTranslations("dashboard.student"),
		getTranslations("app"),
		getCurrentUser(),
	]);
	const unreadCount = user ? await getUnreadNotificationCount(user.id) : 0;

	const menus: MenuGroup[] = [
		{
			order: 0,
			menus: [
				{ label: t("overview"), href: "/d", icon: <Home />, exact: true },
				{
					label: t("courses"),
					href: "/d/courses",
					icon: <GraduationCap />,
					type: "collapsible",
					menus: [
						{ label: t("allCourses"), href: "/d/courses", exact: true },
						{ label: t("myCourses"), href: "/d/my-courses" },
					],
				} as MenuParent,
				{
					label: t("classrooms"),
					href: routes.d.classrooms.page(),
					icon: <School />,
				},
				{
					label: t("certificates"),
					href: routes.d.certificates.page(),
					icon: <Award />,
				},
				{
					label: t("flashcards"),
					href: "#",
					icon: <Zap />,
					type: "collapsible",
					menus: [
						{
							label: t("practice"),
							href: routes.d.decks.practice.page(),
							icon: <Brain />,
						},
						{ label: t("decks"), href: "/d/decks", icon: <BookOpen /> },
						{ label: t("myDecks"), href: routes.d.myDecks.page() },
					],
				},
				{
					label: t("tests"),
					href: "/d/tests",
					icon: <FileText />,
					type: "collapsible",
					menus: [
						{ label: t("testTypes.kankor"), href: "/d/tests/kankor" },
						{ label: t("testTypes.subject"), href: "/d/tests/subject" },
						{ label: t("testTypes.quiz"), href: "/d/tests/quiz" },
						{
							label: t("testTypes.passed"),
							href: routes.d.tests.passed.page(),
						},
						{
							label: t("testTypes.registered"),
							href: routes.d.tests.registered.page(),
						},
					],
				} as MenuParent,
				{
					label: t("library"),
					href: "/d/library",
					icon: <Library />,
					type: "collapsible",
					menus: [
						{
							label: t("librarySections.fields"),
							href: "/d/library?section=fields",
						},
						{
							label: t("librarySections.studies"),
							href: "/d/library?section=studies",
						},
						{
							label: t("librarySections.more"),
							href: "/d/library?section=more",
						},
					],
				} as MenuParent,
			],
		},
		{
			order: 1,
			label: t("personal"),
			menus: [
				{ label: t("notes"), href: "/d/notes", icon: <StickyNote /> },
				{
					label: t("bookmarks"),
					href: routes.d.bookmarks.page(),
					icon: <Bookmark />,
				},
				{
					label: t("notifications"),
					href: routes.d.notifications.page(),
					icon: <Bell />,
					notifications: unreadCount,
				},
				{
					label: t("wallet"),
					href: routes.d.wallet.page(),
					icon: <Wallet />,
				},
			],
		},
	];

	const header = (
		<SidebarMenu>
			<SidebarMenuItem>
				<SidebarMenuButton
					asChild
					size="lg"
					className="group/header hover:bg-muted rounded-2xl px-2 py-2.5 transition"
				>
					<Link
						href={routes.home.page(undefined, { locale })}
						className="flex items-center gap-3"
					>
						<span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#725bff] via-[#735fe7] to-[#36c6ab] text-white shadow-lg shadow-primary/20 group-data-[state=collapsed]:size-8 group-data-[state=collapsed]:rounded-xl">
							<LogoBlueRounded className="size-6 shrink-0 group-data-[state=collapsed]:size-5" />
							<span className="absolute -bottom-2 -left-1 size-5 rounded-full bg-[#b7f486]/30 blur-md" />
						</span>
						<span className="grid flex-1 text-start leading-tight group-data-[state=collapsed]:hidden">
							<span className="truncate text-[13px] font-black tracking-tight">
								{ta("name")}
							</span>
							<span className="truncate text-[10px] font-medium text-muted-foreground">
								{t("personal")}
							</span>
						</span>
					</Link>
				</SidebarMenuButton>
			</SidebarMenuItem>
		</SidebarMenu>
	);

	return (
		<SidebarProvider>
			<AppSidebar menus={menus} header={header} user={user ?? undefined} />
			<SidebarInset className="bg-[#f8f9fc] dark:bg-background">
				<header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-border/70 bg-background/80 px-4 backdrop-blur-2xl supports-backdrop-filter:bg-background/60">
					<SidebarTrigger className="-ms-1 rounded-xl" />
					<Separator orientation="vertical" className="mx-2 h-4" />
					<div className="hidden text-xs font-black text-muted-foreground sm:block">
						{t("overview")}
					</div>
					<div className="ms-auto flex items-center gap-1.5">
						<LocaleSwitcher responsive={false} />
						<NotificationBell
							notificationsHref={routes.d.notifications.page()}
						/>
					</div>
				</header>
				<div className="flex flex-1 flex-col bg-muted/10 p-3 sm:p-4 lg:p-6">
					{children}
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}

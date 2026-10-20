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
import { getTranslations } from "next-intl/server";
import * as React from "react";
import {
	getUnreadNotificationCount,
	NotificationBell,
} from "@/components/blocks/notifications";
import { AppSidebar } from "@/components/blocks/sidebar/app-sidebar";
import { DashboardTopbar } from "@/components/blocks/sidebar/dashboard-topbar";
import { SidebarBrand } from "@/components/blocks/sidebar/sidebar-brand";
import type { MenuGroup, MenuParent } from "@/components/blocks/sidebar/types";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
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

	return (
		<SidebarProvider>
			<AppSidebar
				menus={menus}
				header={<SidebarBrand name={ta("name")} />}
				user={user ?? undefined}
			/>
			<SidebarInset>
				<DashboardTopbar
					actions={
						<>
							<LocaleSwitcher responsive={false} />
							<NotificationBell
								notificationsHref={routes.d.notifications.page()}
							/>
						</>
					}
				/>
				<div className="flex flex-1 flex-col bg-muted/20">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	);
}

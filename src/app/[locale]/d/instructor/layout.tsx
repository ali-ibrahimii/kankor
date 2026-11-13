import {
	BarChart3,
	Bell,
	BookOpen,
	FileText,
	LayoutDashboard,
	SchoolIcon,
	Settings,
	TicketPercent,
	UserCircle,
	Users,
	Wallet,
	Zap,
} from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import * as React from "react";
import {
	getUnreadNotificationCount,
	NotificationBell,
} from "@/components/blocks/notifications";
import { DashboardSidebar } from "@/components/blocks/sidebar/dashboard-sidebar";
import { DashboardTopbar } from "@/components/blocks/sidebar/dashboard-topbar";
import { SidebarBrand } from "@/components/blocks/sidebar/sidebar-brand";
import type { MenuGroup, MenuParent } from "@/components/blocks/sidebar/types";
import {
	SidebarInset,
	SidebarMenu,
	SidebarMenuItem,
	SidebarProvider,
} from "@/components/ui/sidebar";
import { LocaleSwitcher } from "@/components/widgets/locale-switcher";
import { getCurrentUser } from "@/lib/auth/session";
import { routes } from "@/lib/routes";
import { NewCourseButton } from "./_components/new-course-button";

export default async function InstructorLayout({
	children,
	params,
}: React.PropsWithChildren<{ params: Promise<{ locale: string }> }>) {
	const { locale } = await params;
	const base = routes.d.instructor.page();

	const [t, ta, user] = await Promise.all([
		getTranslations("dashboard.instructor"),
		getTranslations("app"),
		getCurrentUser(),
	]);

	if (!user) redirect(routes.auth.login.page(undefined, { locale }));

	// Instructor accounts are approved manually by an admin. Until the account
	// is verified (`instructor_status === "active"`), keep them out of the
	// dashboard and show the pending-review page instead.
	if (user.instructor_status !== "active") {
		redirect(
			routes.verificationPending.page({ type: "instructor" }, { locale })
		);
	}

	const unreadCount = await getUnreadNotificationCount(user.id);

	const menus: MenuGroup[] = [
		{
			order: 0,
			menus: [
				{
					label: t("overview"),
					href: base,
					icon: <LayoutDashboard />,
					exact: true,
				},
				{
					label: t("myCourses"),
					href: routes.d.instructor.courses.page(),
					icon: <BookOpen />,
					type: "collapsible",
					menus: [
						{
							label: t("courses.published"),
							href: routes.d.instructor.courses.page({ status: "published" }),
						},
						{
							label: t("courses.drafts"),
							href: routes.d.instructor.courses.page({ status: "draft" }),
						},
					],
				} as MenuParent,
				{
					label: t("decks"),
					href: routes.d.instructor.decks.page(),
					icon: <Zap />,
				},
				{
					label: t("quizBuilder"),
					href: routes.d.instructor.quizzes.page(),
					icon: <FileText />,
				},
				{
					label: t("classrooms"),
					href: routes.d.instructor.classrooms.page(),
					icon: <SchoolIcon />,
				},
				{
					label: t("students"),
					href: routes.d.instructor.students.page(),
					icon: <Users />,
				},
			],
		},
		{
			order: 1,
			label: t("reports"),
			menus: [
				{
					label: t("analytics"),
					href: routes.d.instructor.analytics.page(),
					icon: <BarChart3 />,
				},
				{
					label: t("earnings"),
					href: routes.d.instructor.earnings.page(),
					icon: <Wallet />,
				},
				{
					label: t("discounts"),
					href: routes.d.instructor.discounts.page(),
					icon: <TicketPercent />,
				},
			],
		},
		{
			order: 2,
			menus: [
				{
					label: t("settings"),
					href: routes.d.instructor.settings.page(),
					icon: <Settings />,
				},
				{
					label: t("account"),
					href: routes.d.instructor.account.page(),
					icon: <UserCircle />,
				},
				{
					label: t("notifications"),
					href: routes.d.instructor.notifications.page(),
					icon: <Bell />,
					notifications: unreadCount,
				},
			],
		},
	];

	const header = (
		<>
			<SidebarBrand name={ta("name")} href={base} subtitle={t("roleLabel")} />
			<SidebarMenu>
				<SidebarMenuItem>
					<NewCourseButton label={t("newCourse")} />
				</SidebarMenuItem>
			</SidebarMenu>
		</>
	);

	return (
		<SidebarProvider>
			<DashboardSidebar
				menus={menus}
				header={header}
				user={user ?? undefined}
			/>
			<SidebarInset>
				<DashboardTopbar
					actions={
						<>
							<LocaleSwitcher />
							<NotificationBell
								notificationsHref={routes.d.instructor.notifications.page()}
							/>
						</>
					}
				/>
				<div className="flex flex-1 flex-col bg-muted/20">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	);
}

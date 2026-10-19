import {
	BarChart3,
	Bell,
	BookOpen,
	FileText,
	LayoutDashboard,
	SchoolIcon,
	Settings,
	TicketPercent,
	Users,
	Wallet,
	Zap,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
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
					href: `${base}/courses`,
					icon: <BookOpen />,
					type: "collapsible",
					menus: [
						{
							label: t("courses.published"),
							href: `${base}/courses?status=published`,
						},
						{
							label: t("courses.drafts"),
							href: `${base}/courses?status=draft`,
						},
						{
							label: t("courses.archived"),
							href: `${base}/courses?status=archived`,
						},
					],
				} as MenuParent,
				{
					label: t("decks"),
					href: `${base}/decks`,
					icon: <Zap />,
				},
				{
					label: t("quizBuilder"),
					href: `${base}/quizzes`,
					icon: <FileText />,
				},
				{
					label: t("classrooms"),
					href: `${base}/classrooms`,
					icon: <SchoolIcon />,
				},
				{ label: t("students"), href: `${base}/students`, icon: <Users /> },
			],
		},
		{
			order: 1,
			label: t("reports"),
			menus: [
				{
					label: t("analytics"),
					href: `${base}/analytics`,
					icon: <BarChart3 />,
				},
				{ label: t("earnings"), href: `${base}/earnings`, icon: <Wallet /> },
				{
					label: t("discounts"),
					href: `${base}/discounts`,
					icon: <TicketPercent />,
				},
			],
		},
		{
			order: 2,
			menus: [
				{ label: t("settings"), href: `${base}/settings`, icon: <Settings /> },
				{
					label: t("notifications"),
					href: `${base}/notifications`,
					icon: <Bell />,
					notifications: unreadCount,
				},
			],
		},
	];

	const header = (
		<>
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton asChild size="lg">
						<Link href={base}>
							<LogoBlueRounded className="size-7 shrink-0" />
							<div className="flex flex-col leading-none text-base font-semibold group-data-[state=collapsed]:w-0 group-data-[state=collapsed]:opacity-0 transition-all duration-150">
								<span className="text-sm font-semibold">{ta("name")}</span>
								<span className="text-[10px] text-muted-foreground">
									{t("roleLabel")}
								</span>
							</div>
						</Link>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
			<SidebarMenu>
				<SidebarMenuItem>
					<NewCourseButton label={t("newCourse")} />
				</SidebarMenuItem>
			</SidebarMenu>
		</>
	);

	return (
		<SidebarProvider>
			<AppSidebar menus={menus} header={header} user={user ?? undefined} />
			<SidebarInset>
				<header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
					<SidebarTrigger className="-ms-1" />
					<Separator orientation="vertical" className="h-4" />
					<div className="ms-auto flex items-center gap-1.5">
						<LocaleSwitcher responsive={false} />
						<NotificationBell notificationsHref={`${base}/notifications`} />
					</div>
				</header>
				<div className="flex flex-1 flex-col bg-muted/20">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	);
}

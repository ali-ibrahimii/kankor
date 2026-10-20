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
import { Link } from "@/i18n/navigation";
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
		<SidebarMenu>
			<SidebarMenuItem>
				<SidebarMenuButton
					asChild
					size="lg"
					className="group/header hover:bg-muted rounded-2xl px-2 py-2.5 transition"
				>
					<Link href={base} className="flex items-center gap-3">
						<span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#725bff] via-[#735fe7] to-[#36c6ab] text-white shadow-lg shadow-primary/20 group-data-[state=collapsed]:size-8 group-data-[state=collapsed]:rounded-xl">
							<LogoBlueRounded className="size-6 shrink-0 group-data-[state=collapsed]:size-5" />
							<span className="absolute -bottom-2 -left-1 size-5 rounded-full bg-[#b7f486]/30 blur-md" />
						</span>
						<span className="grid flex-1 text-start leading-tight group-data-[state=collapsed]:hidden">
							<span className="truncate text-[13px] font-black tracking-tight">
								{ta("name")}
							</span>
							<span className="truncate text-[10px] font-medium text-muted-foreground">
								{t("roleLabel")}
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
					<SidebarTrigger className="-ms-1" />
					<Separator orientation="vertical" className="h-4" />
					<div className="ms-auto flex items-center gap-1.5">
						<LocaleSwitcher responsive={false} />
						<NotificationBell notificationsHref={`${base}/notifications`} />
					</div>
				</header>
				<div className="flex flex-1 flex-col bg-muted/10 p-3 sm:p-4 lg:p-6">
					{children}
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}

import {
	Bell,
	BookOpen,
	Building2,
	FileText,
	GraduationCap,
	Handshake,
	LayoutDashboard,
	Library,
	MapPin,
	Settings,
	ShieldCheck,
	TicketPercent,
	University,
	Users,
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

export default async function AdminLayout({
	children,
	params,
}: React.PropsWithChildren<{ params: Promise<{ locale: string }> }>) {
	const { locale } = await params;
	const base = `/d/admin`;
	const localizedBase = `/${locale}/d/admin`;

	const [t, user] = await Promise.all([
		getTranslations("dashboard.admin"),
		getCurrentUser(),
	]);
	const unreadCount = user ? await getUnreadNotificationCount(user.id) : 0;

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
			],
		},
		{
			order: 1,
			label: t("users.label"),
			menus: [
				{
					label: t("users.allUsers"),
					href: `${base}/users`,
					icon: <Users />,
					type: "collapsible",
					menus: [
						{ label: t("users.students"), href: `${base}/users/students` },
						{
							label: t("users.instructors"),
							href: `${base}/users/instructors`,
						},
						{ label: t("users.staff"), href: `${base}/users/staff` },
					],
				} as MenuParent,
				{
					label: t("users.schools"),
					href: `${base}/schools`,
					icon: <Building2 />,
				},
				{
					label: t("users.agencies"),
					href: `${base}/agencies`,
					icon: <Handshake />,
				},
			],
		},
		{
			order: 2,
			label: t("content.label"),
			menus: [
				{
					label: t("content.courses"),
					href: `${base}/courses`,
					icon: <GraduationCap />,
				},
				{
					label: t("content.flashcards"),
					href: `${base}/flashcards`,
					icon: <Zap />,
					type: "collapsible",
					menus: [
						{ label: t("content.decks"), href: `${base}/decks` },
						{ label: t("content.cards"), href: `${base}/flashcards/cards` },
					],
				} as MenuParent,
				{
					label: t("content.tests"),
					href: `${base}/quizzes`,
					icon: <FileText />,
				},
				{
					label: t("content.library"),
					href: `${base}/libraries`,
					icon: <Library />,
				},
				{
					label: t("content.discounts"),
					href: `${base}/discounts`,
					icon: <TicketPercent />,
				},
			],
		},
		{
			order: 3,
			label: t("kankor.label"),
			menus: [
				{
					label: t("kankor.forms"),
					href: `${base}/kankor/forms`,
					icon: <BookOpen />,
				},
				{
					label: t("kankor.universities"),
					href: `${base}/kankor/universities`,
					icon: <University />,
					type: "collapsible",
					menus: [
						{ label: t("kankor.faculties"), href: `${base}/kankor/faculties` },
						{
							label: t("kankor.departments"),
							href: `${base}/kankor/departments`,
						},
						{ label: t("kankor.codes"), href: `${base}/kankor/codes` },
					],
				} as MenuParent,
			],
		},
		{
			order: 4,
			label: t("platform.label"),
			menus: [
				{
					label: t("platform.grades"),
					href: `${base}/grades`,
					icon: <BookOpen />,
				},
				{
					label: t("platform.provinces"),
					href: `${base}/provinces`,
					icon: <MapPin />,
				},
				{
					label: t("platform.settings"),
					href: `${base}/settings`,
					icon: <Settings />,
				},
				{
					label: t("notifications"),
					href: `${base}/notifications`,
					icon: <Bell />,
					notifications: unreadCount,
				},
			],
		},
	];

	return (
		<SidebarProvider>
			<AppSidebar
				menus={menus}
				header={
					<SidebarBrand
						name="Abzar Kankor"
						href={localizedBase}
						subtitle={
							<span className="inline-flex items-center gap-1">
								<ShieldCheck className="size-3" />
								{t("roleLabel")}
							</span>
						}
					/>
				}
				user={user ?? undefined}
				className="text-sidebar-foreground [--sidebar:oklch(0.13_0.04_237)] [--sidebar-foreground:oklch(0.92_0.01_237)] [--sidebar-accent:oklch(0.21_0.04_237)] [--sidebar-accent-foreground:oklch(0.97_0.01_237)] [--sidebar-border:oklch(1_0_0/0.08)] [--sidebar-primary:oklch(0.67_0.18_250)] [--sidebar-primary-foreground:oklch(0.97_0.01_250)] [--sidebar-muted-foreground:oklch(0.65_0.02_237)]"
			/>
			<SidebarInset>
				<DashboardTopbar
					actions={
						<>
							<LocaleSwitcher responsive={false} />
							<NotificationBell notificationsHref={`${base}/notifications`} />
						</>
					}
				/>
				<div className="flex flex-1 flex-col bg-muted/20">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	);
}

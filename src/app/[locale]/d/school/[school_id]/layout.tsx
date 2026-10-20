import {
	BarChart3,
	Bell,
	BookOpenCheck,
	Building2,
	FileText,
	LayoutDashboard,
	Settings,
	TicketPercent,
	UserCheck,
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
import { SchoolHeaderClient } from "@/components/blocks/school/school-header-client";
import { AppSidebar } from "@/components/blocks/sidebar/app-sidebar";
import type { MenuGroup } from "@/components/blocks/sidebar/types";
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
import { createClient } from "@/lib/supabase/server";
import { BaseParams } from "@/types/common.types";

type Props = React.PropsWithChildren<{
	params: Promise<BaseParams & { school_id: string }>;
}>;

export default async function SchoolLayout({ children, params }: Props) {
	const { school_id, locale } = await params;
	const base = `/d/school/${school_id}`;
	const localizedBase = `/${locale}/d/school/${school_id}`;

	const supabase = await createClient();
	const [t, user, { data: school }] = await Promise.all([
		getTranslations("dashboard.school"),
		getCurrentUser(),
		supabase.from("schools").select("status").eq("id", school_id).maybeSingle(),
	]);

	// Schools are approved manually by an admin. Until the school is verified
	// (`status === "active"`), keep its members out of the dashboard and show
	// the pending-review page instead.
	if (school?.status !== "active") {
		redirect(routes.verificationPending.page({ type: "school" }, { locale }));
	}

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
				{
					label: t("members.label"),
					href: `${base}/members`,
					icon: <Users />,
				},
				{ label: t("decks"), href: `${base}/decks`, icon: <Zap /> },
				{ label: t("quizzes"), href: `${base}/quizzes`, icon: <FileText /> },
				{
					label: t("results"),
					href: `${base}/results`,
					icon: <BookOpenCheck />,
				},
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
				{
					label: t("attendance"),
					href: `${base}/attendance`,
					icon: <UserCheck />,
				},
				{
					label: t("earnings"),
					href: `${base}/earnings`,
					icon: <Wallet />,
				},
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
		<SchoolHeaderClient
			schoolId={school_id}
			userId={user?.id ?? ""}
			locale={locale}
		/>
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

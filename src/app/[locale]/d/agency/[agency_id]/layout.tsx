import {
	AlertTriangle,
	Bell,
	BookOpen,
	Building2,
	CreditCard,
	FileText,
	GraduationCap,
	LayoutDashboard,
	ReceiptText,
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
import type { MenuGroup } from "@/components/blocks/sidebar/types";
import { Separator } from "@/components/ui/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { LocaleSwitcher } from "@/components/widgets/locale-switcher";
import { getCurrentUser } from "@/lib/auth/session";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import type { BaseParams } from "@/types/common.types";

type Props = React.PropsWithChildren<{
	params: Promise<BaseParams & { agency_id: string }>;
}>;

export default async function AgencyLayout({ children, params }: Props) {
	const { agency_id, locale } = await params;
	const base = `/d/agency/${agency_id}`;

	const supabase = await createClient();
	const [t, user, { data: agency }, { data: grants }] = await Promise.all([
		getTranslations("dashboard.agency"),
		getCurrentUser(),
		// RLS: only members (and super admins) can read the agency row, so a
		// non-member gets null here and is bounced to the generic dashboard.
		supabase
			.from("agencies")
			.select("id, name, status")
			.eq("id", agency_id)
			.maybeSingle(),
		supabase
			.from("agency_grants")
			.select("permission")
			.eq("agency_id", agency_id),
	]);

	if (!user || !agency) {
		redirect(routes.d.page(undefined, { locale }));
	}

	const membership = user.agencyMemberships.find(
		(m) => m.agency_id === agency_id
	);
	if (!membership) {
		redirect(routes.d.page(undefined, { locale }));
	}

	const permissions = new Set((grants ?? []).map((g) => g.permission));
	const canManageMembers =
		membership.role === "owner" || membership.role === "admin";
	const unreadCount = await getUnreadNotificationCount(user.id);

	const menus: MenuGroup[] = [
		{
			order: 0,
			menus: [
				{
					label: t("nav.overview"),
					href: base,
					icon: <LayoutDashboard />,
					exact: true,
				},
				...(permissions.has("students.charge")
					? [
							{
								label: t("nav.chargeStudent"),
								href: `${base}/charge`,
								icon: <CreditCard />,
							},
						]
					: []),
				{
					label: t("nav.transactions"),
					href: `${base}/transactions`,
					icon: <ReceiptText />,
				},
				{
					label: t("nav.settlements"),
					href: `${base}/settlements`,
					icon: <Wallet />,
				},
				{
					label: t("nav.disputes"),
					href: `${base}/disputes`,
					icon: <AlertTriangle />,
				},
				...(permissions.has("schools.suspend") ||
				permissions.has("schools.manage")
					? [
							{
								label: t("nav.schools"),
								href: `${base}/schools`,
								icon: <Building2 />,
							},
						]
					: []),
				...(permissions.has("instructors.suspend")
					? [
							{
								label: t("nav.instructors"),
								href: `${base}/instructors`,
								icon: <GraduationCap />,
							},
						]
					: []),
				...(permissions.has("courses.manage_own")
					? [
							{
								label: t("nav.courses"),
								href: `${base}/courses`,
								icon: <BookOpen />,
							},
						]
					: []),
				...(permissions.has("decks.manage_own")
					? [
							{
								label: t("nav.decks"),
								href: `${base}/decks`,
								icon: <Zap />,
							},
						]
					: []),
				...(permissions.has("quizzes.manage_own")
					? [
							{
								label: t("nav.quizzes"),
								href: `${base}/quizzes`,
								icon: <FileText />,
							},
						]
					: []),
				...(canManageMembers
					? [
							{
								label: t("nav.members"),
								href: `${base}/members`,
								icon: <Users />,
							},
						]
					: []),
			],
		},
		{
			order: 1,
			menus: [
				{
					label: t("nav.notifications"),
					href: `${base}/notifications`,
					icon: <Bell />,
					notifications: unreadCount,
				},
			],
		},
	];

	const header = (
		<div className="flex min-w-0 items-center gap-2 px-2 py-1.5">
			<span className="truncate font-semibold">{agency.name}</span>
		</div>
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

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

	const header = (
		<SidebarMenu>
			<SidebarMenuItem>
				<SidebarMenuButton
					asChild
					size="lg"
					className="group/header hover:bg-muted rounded-2xl px-2 py-2.5 transition"
				>
					<Link href={localizedBase} className="flex items-center gap-3">
						<span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#725bff] via-[#735fe7] to-[#36c6ab] text-white shadow-lg shadow-primary/20 group-data-[state=collapsed]:size-8 group-data-[state=collapsed]:rounded-xl">
							<LogoBlueRounded className="size-6 shrink-0 group-data-[state=collapsed]:size-5" />
							<span className="absolute -bottom-2 -left-1 size-5 rounded-full bg-[#b7f486]/30 blur-md" />
						</span>
						<span className="grid flex-1 text-start leading-tight group-data-[state=collapsed]:hidden">
							<span className="truncate text-[13px] font-black tracking-tight">
								Abzar Kankor
							</span>
							<span className="flex items-center gap-1 truncate text-[10px] font-medium text-muted-foreground">
								<ShieldCheck className="size-3" />
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

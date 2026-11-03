import {
	Award,
	BookOpen,
	Building2,
	Compass,
	GraduationCap,
	Home,
	Info,
	LayoutDashboard,
	Library,
	type LucideIcon,
	School,
	Settings,
	Sparkles,
	UserCog,
	Users,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { AdminOverview } from "@/components/blocks/dashboard-overview/admin-overview";
import { InstructorOverview } from "@/components/blocks/dashboard-overview/instructor-overview";
import { SchoolOverview } from "@/components/blocks/dashboard-overview/school-overview";
import { StudentOverview } from "@/components/blocks/dashboard-overview/student-overview";
import { AppSidebar } from "@/components/blocks/sidebar/app-sidebar";
import { DashboardTopbar } from "@/components/blocks/sidebar/dashboard-topbar";
import { SidebarBrand } from "@/components/blocks/sidebar/sidebar-brand";
import type { MenuGroup } from "@/components/blocks/sidebar/types";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ThemeSwitcher } from "@/components/widgets/theme-switcher";
import { Link } from "@/i18n/navigation";
import {
	type DemoRole,
	demoAdminOverview,
	demoInstructorOverview,
	demoProfiles,
	demoRoleMessageKey,
	demoSchoolOverview,
	demoStudentOverview,
} from "@/lib/demo/mock-dashboard";
import { routes } from "@/lib/routes";
import { DemoLocaleSwitcher } from "./demo-locale-switcher";
import { DemoRoleSwitcher } from "./demo-role-switcher";
import { DemoUserCard } from "./demo-user-card";

type DemoNavKey =
	| "overview"
	| "people"
	| "members"
	| "schools"
	| "courses"
	| "myCourses"
	| "explore"
	| "classrooms"
	| "students"
	| "certificates"
	| "settings";

const navByRole: Record<DemoRole, { key: DemoNavKey; icon: LucideIcon }[]> = {
	student: [
		{ key: "overview", icon: LayoutDashboard },
		{ key: "explore", icon: Compass },
		{ key: "myCourses", icon: BookOpen },
		{ key: "classrooms", icon: School },
		{ key: "certificates", icon: Award },
		{ key: "settings", icon: Settings },
	],
	instructor: [
		{ key: "overview", icon: LayoutDashboard },
		{ key: "courses", icon: Library },
		{ key: "myCourses", icon: BookOpen },
		{ key: "classrooms", icon: School },
		{ key: "students", icon: GraduationCap },
		{ key: "certificates", icon: Award },
	],
	school: [
		{ key: "overview", icon: LayoutDashboard },
		{ key: "members", icon: UserCog },
		{ key: "courses", icon: BookOpen },
		{ key: "students", icon: GraduationCap },
		{ key: "certificates", icon: Award },
		{ key: "settings", icon: Settings },
	],
	admin: [
		{ key: "overview", icon: LayoutDashboard },
		{ key: "people", icon: Users },
		{ key: "schools", icon: Building2 },
		{ key: "courses", icon: BookOpen },
		{ key: "certificates", icon: Award },
		{ key: "settings", icon: Settings },
	],
};

const overviewByRole = {
	student: demoStudentOverview,
	instructor: demoInstructorOverview,
	school: demoSchoolOverview,
	admin: demoAdminOverview,
} as const;

/**
 * Public, read-only dashboard preview. It renders the same overview views the
 * authenticated dashboards use, but every number comes from
 * `@/lib/demo/mock-dashboard` and navigation is deliberately inert.
 */
export async function DemoShell({ role }: { role: DemoRole }) {
	const [tDemo, tLanding] = await Promise.all([
		getTranslations("demo"),
		getTranslations("landing"),
	]);

	const menus: MenuGroup[] = [
		{
			menus: navByRole[role].map((item) => ({
				label: tDemo(`nav.${item.key}`),
				icon: <item.icon />,
				href: item.key === "overview" ? routes.demo.page({ role }) : undefined,
				exact: true,
			})),
		},
	];

	const profile = demoProfiles[role];

	return (
		<SidebarProvider>
			<AppSidebar
				menus={menus}
				header={
					<SidebarBrand
						name={tDemo("workspace")}
						subtitle={tDemo(`roles.${demoRoleMessageKey[role]}`)}
						href={routes.demo.page({ role })}
					/>
				}
				footer={
					<DemoUserCard
						name={profile.full_name}
						email={profile.email}
						roleLabel={tDemo(`roles.${demoRoleMessageKey[role]}`)}
						hint={tDemo("sampleData")}
					/>
				}
			/>
			<SidebarInset>
				<DashboardTopbar
					actions={
						<>
							<span className="hidden items-center gap-1.5 rounded-full border border-amber-300/60 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 sm:inline-flex dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300">
								<Sparkles className="size-3" />
								{tDemo("demoBadge")}
							</span>
							<Suspense
								fallback={
									<div className="h-9 w-20 animate-pulse rounded-xl bg-muted" />
								}
							>
								<DemoLocaleSwitcher />
							</Suspense>
							<ThemeSwitcher label={tLanding("header.themeToggle")} />
							<Button
								asChild
								variant="ghost"
								size="icon"
								className="size-9 shrink-0 rounded-xl"
							>
								<Link
									href={routes.home.page()}
									aria-label={tDemo("backToSite")}
								>
									<Home className="size-4" />
								</Link>
							</Button>
						</>
					}
				/>
				<div className="flex flex-1 flex-col bg-muted/20">
					<div className="flex items-start gap-2 border-b border-amber-200/70 bg-amber-50/80 px-4 py-2 text-[11px] leading-5 text-amber-900 sm:items-center sm:px-6 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
						<Info className="mt-0.5 size-3.5 shrink-0 sm:mt-0" />
						<p className="min-w-0 flex-1">{tDemo("previewNotice")}</p>
						<Link
							href={routes.home.page()}
							className="hidden shrink-0 font-semibold hover:underline sm:block"
						>
							{tDemo("backToSite")}
						</Link>
					</div>

					<div className="px-6 pt-6">
						<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
							<div className="min-w-0">
								<p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
									<span>{tDemo("sampleData")}</span>
									<span aria-hidden="true">·</span>
									<span>{tDemo("workspaceCaption")}</span>
								</p>
								<h1 className="mt-1.5 text-xl font-bold text-foreground sm:text-2xl">
									{tDemo("pageTitle")}
								</h1>
								<p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
									{tDemo(`overview.subtitles.${demoRoleMessageKey[role]}`)}
								</p>
							</div>
							<div className="shrink-0">
								<DemoRoleSwitcher role={role} />
							</div>
						</div>
					</div>

					{role === "student" ? (
						<StudentOverview overview={overviewByRole.student} />
					) : null}
					{role === "instructor" ? (
						<InstructorOverview overview={overviewByRole.instructor} />
					) : null}
					{role === "school" ? (
						<SchoolOverview overview={overviewByRole.school} />
					) : null}
					{role === "admin" ? (
						<AdminOverview overview={overviewByRole.admin} />
					) : null}
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}

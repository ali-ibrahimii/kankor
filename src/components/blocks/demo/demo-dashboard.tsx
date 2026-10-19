"use client";

import {
	Award,
	BookOpen,
	Building2,
	ChevronLeft,
	Compass,
	GraduationCap,
	LayoutDashboard,
	type LucideIcon,
	Menu,
	School,
	Settings2,
	ShieldCheck,
	Sparkles,
	Users,
	X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
	NativeSelect,
	NativeSelectOption,
} from "@/components/ui/native-select";
import { LocaleSwitcher } from "@/components/widgets/locale-switcher";
import { Link } from "@/i18n/navigation";
import type { DemoRole } from "@/lib/demo/types";
import { routes } from "@/lib/routes";
import { DemoCertificates } from "./certificates-panel";
import { DemoClassrooms } from "./classrooms-panel";
import { DemoCourses } from "./courses-panel";
import { DemoProvider, type DemoSection, useDemo } from "./demo-context";
import { DemoAvatar } from "./demo-ui";
import { DemoOverview } from "./overview-panel";
import { DemoPeople } from "./people-panel";
import { DemoSettings } from "./settings-panel";

const navigation: Record<DemoRole, { id: DemoSection; icon: LucideIcon }[]> = {
	admin: [
		{ id: "overview", icon: LayoutDashboard },
		{ id: "people", icon: Users },
		{ id: "schools", icon: Building2 },
		{ id: "courses", icon: BookOpen },
		{ id: "classrooms", icon: School },
		{ id: "certificates", icon: Award },
		{ id: "settings", icon: Settings2 },
	],
	teacher: [
		{ id: "overview", icon: LayoutDashboard },
		{ id: "courses", icon: BookOpen },
		{ id: "classrooms", icon: School },
		{ id: "students", icon: Users },
		{ id: "certificates", icon: Award },
		{ id: "settings", icon: Settings2 },
	],
	school: [
		{ id: "overview", icon: LayoutDashboard },
		{ id: "members", icon: Users },
		{ id: "courses", icon: BookOpen },
		{ id: "classrooms", icon: School },
		{ id: "certificates", icon: Award },
		{ id: "settings", icon: Settings2 },
	],
	student: [
		{ id: "overview", icon: LayoutDashboard },
		{ id: "myCourses", icon: BookOpen },
		{ id: "explore", icon: Compass },
		{ id: "classrooms", icon: School },
		{ id: "certificates", icon: Award },
		{ id: "settings", icon: Settings2 },
	],
};

function DemoNav({ onNavigate }: { onNavigate?: () => void }) {
	const t = useTranslations("demo");
	const { state, actor, section, setSection } = useDemo();
	const links = navigation[actor.role];
	return (
		<div className="flex h-full flex-col">
			<Link
				href={routes.home.page()}
				className="flex items-center gap-3 px-5 py-6"
				onClick={onNavigate}
			>
				<span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-500 text-white shadow-lg shadow-violet-500/20">
					<GraduationCap className="size-6" />
				</span>
				<span className="min-w-0">
					<span className="block truncate text-base font-extrabold text-[#1b263c]">
						{state.settings.siteName}
					</span>
					<span className="block text-[11px] font-semibold text-slate-400">
						{t("workspace")}
					</span>
				</span>
			</Link>
			<div className="mx-4 rounded-[22px] bg-[radial-gradient(circle_at_0%_100%,#354674_0%,transparent_52%),linear-gradient(130deg,#17233a,#242645)] p-4 text-white shadow-xl shadow-indigo-950/10">
				<div className="flex items-center gap-3">
					<DemoAvatar user={actor} size="lg" />
					<div className="min-w-0">
						<p className="truncate text-sm font-bold">{actor.name}</p>
						<p className="mt-1 truncate text-[11px] text-white/50">
							{actor.email}
						</p>
					</div>
				</div>
				<span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-[#c9f899]">
					<span className="size-1.5 rounded-full bg-[#b7f486]" />
					{t(`roles.${actor.role}`)}
				</span>
			</div>
			<p className="px-6 pb-2 pt-8 text-[10px] font-bold tracking-[.18em] text-slate-400">
				{t("navigation")}
			</p>
			<nav aria-label={t("navigation")} className="flex-1 space-y-1 px-3">
				{links.map(({ id, icon: Icon }) => (
					<button
						type="button"
						key={id}
						aria-current={section === id ? "page" : undefined}
						onClick={() => {
							setSection(id);
							onNavigate?.();
						}}
						className={`demo-nav-item ${section === id ? "demo-nav-item--active" : ""}`}
					>
						<Icon className="size-[18px]" />
						{t(`nav.${id}`)}
					</button>
				))}
			</nav>
			<div className="border-t border-slate-100 p-4">
				<Link
					href={routes.home.page()}
					className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-violet-700"
				>
					<ChevronLeft className="size-4 rtl:rotate-0 ltr:rotate-180" />
					{t("backToSite")}
				</Link>
			</div>
		</div>
	);
}

function DemoApp({ invitation }: { invitation?: string }) {
	const t = useTranslations("demo");
	const locale = useLocale();
	const {
		state,
		ready,
		actor,
		section,
		chooseRole,
		chooseAccount,
		setSection,
	} = useDemo();
	const [mobileOpen, setMobileOpen] = React.useState(false);
	const current = navigation[actor.role].some((item) => item.id === section)
		? section
		: "overview";
	const accounts = state.users.filter(
		(person) => person.role === actor.role && person.status === "active"
	);

	return (
		<div className="demo-surface min-h-screen">
			<div className="mx-auto flex min-h-screen max-w-[1600px]">
				<aside className="hidden w-[264px] shrink-0 border-e border-slate-200/80 bg-white xl:block">
					<div className="sticky top-0 h-screen overflow-y-auto">
						<DemoNav />
					</div>
				</aside>
				<div className="min-w-0 flex-1">
					<header className="sticky top-0 z-30 flex min-h-[76px] items-center gap-3 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-7">
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="xl:hidden"
							aria-label={t("openMenu")}
							aria-expanded={mobileOpen}
							onClick={() => setMobileOpen(true)}
						>
							<Menu className="size-5" />
						</Button>
						<div className="min-w-0 flex-1">
							<p className="truncate text-sm font-extrabold text-[#1d2941]">
								{t(`nav.${current}`)}
							</p>
							<p className="hidden text-xs text-slate-400 sm:block">
								{t("workspaceCaption")}
							</p>
						</div>
						<div className="hidden items-center gap-2 lg:flex">
							<span className="size-2 rounded-full bg-emerald-400" />
							<span className="text-xs font-semibold text-slate-500">
								{t("demoBadge")}
							</span>
						</div>
						<LocaleSwitcher responsive={false} />
						<div className="h-7 w-px bg-slate-200" />
						<label className="sr-only" htmlFor="demo-role">
							{t("roleSwitcher")}
						</label>
						<NativeSelect
							size="sm"
							className="max-w-36 sm:max-w-44"
							id="demo-role"
							aria-label={t("roleSwitcher")}
							value={actor.role}
							disabled={!ready}
							onChange={(event) => chooseRole(event.target.value as DemoRole)}
						>
							{(["admin", "teacher", "student", "school"] as const).map(
								(role) => (
									<NativeSelectOption key={role} value={role}>
										{t(`roles.${role}`)}
									</NativeSelectOption>
								)
							)}
						</NativeSelect>
					</header>
					<main className="mx-auto max-w-[1250px] px-4 pb-20 pt-7 sm:px-8 sm:pt-9">
						<div className="mb-7 flex flex-col gap-3 rounded-2xl border border-violet-100 bg-[#f0ecff] px-4 py-3 text-[#4e428b] sm:flex-row sm:items-center sm:justify-between sm:px-5">
							<div className="flex items-start gap-2.5">
								<Sparkles className="mt-0.5 size-4 shrink-0" />
								<p className="text-xs font-medium leading-6">
									<strong className="font-extrabold">{t("demoBadge")}</strong>
									<span className="mx-1.5">·</span>
									{t("localNotice")}
								</p>
							</div>
							<div className="flex items-center gap-2">
								<span className="hidden text-xs sm:inline">
									{t("accountSwitcher")}
								</span>
								<NativeSelect
									size="sm"
									className="w-full max-w-52 sm:w-auto"
									aria-label={t("accountSwitcher")}
									value={actor.id}
									disabled={!ready}
									onChange={(event) => {
										chooseAccount(event.target.value);
										setSection("overview");
									}}
								>
									{accounts.map((account) => (
										<NativeSelectOption key={account.id} value={account.id}>
											{account.name}
										</NativeSelectOption>
									))}
								</NativeSelect>
							</div>
						</div>
						{current === "overview" && <DemoOverview />}
						{(current === "people" ||
							current === "members" ||
							current === "students" ||
							current === "schools") && <DemoPeople mode={current} />}
						{(current === "courses" ||
							current === "myCourses" ||
							current === "explore") && <DemoCourses mode={current} />}
						{current === "classrooms" && (
							<DemoClassrooms invitation={invitation} locale={locale} />
						)}
						{current === "certificates" && <DemoCertificates />}
						{current === "settings" && <DemoSettings />}
					</main>
				</div>
			</div>
			{mobileOpen && (
				<div
					className="fixed inset-0 z-50 flex bg-slate-950/35 xl:hidden"
					role="presentation"
					onClick={() => setMobileOpen(false)}
				>
					<aside
						className="h-full w-[min(310px,85vw)] overflow-y-auto bg-white shadow-2xl"
						role="dialog"
						aria-modal="true"
						aria-label={t("navigation")}
						onClick={(event) => event.stopPropagation()}
					>
						<div className="absolute top-5 end-4 z-10">
							<Button
								type="button"
								variant="ghost"
								size="icon"
								aria-label={t("closeMenu")}
								onClick={() => setMobileOpen(false)}
							>
								<X className="size-5" />
							</Button>
						</div>
						<DemoNav onNavigate={() => setMobileOpen(false)} />
					</aside>
				</div>
			)}
		</div>
	);
}

/** Standalone public demo: role switching here never grants access to /d. */
export function DemoDashboard({ invitation }: { invitation?: string }) {
	return (
		<DemoProvider invitation={invitation}>
			<DemoApp invitation={invitation} />
		</DemoProvider>
	);
}

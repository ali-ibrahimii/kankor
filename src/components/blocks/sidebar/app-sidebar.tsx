"use client";

import { ChevronRight, Compass, PanelRightIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import * as React from "react";
import { NavUser } from "@/components/blocks/sidebar/nav-user";
import type {
	Menu,
	MenuGroup,
	MenuParent,
} from "@/components/blocks/sidebar/types";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	SidebarSeparator,
} from "@/components/ui/sidebar";
import { Link, usePathname } from "@/i18n/navigation";
import { dirOf, isRtl } from "@/i18n/routing";
import { CurrentUser } from "@/lib/auth/types";
import { cn } from "@/lib/utils";
import { getInitial } from "@/utils/str.util";

function isMenuParent(item: Menu | MenuParent): item is MenuParent {
	return "type" in item;
}

function useIsItemActive() {
	const pathname = usePathname();
	const searchParams = useSearchParams();

	return React.useCallback(
		(item: Menu) => {
			if (item.isActive !== undefined) return item.isActive;
			if (!item.href) return false;

			const [hrefPath, hrefQuery] = item.href.split("?");

			const pathMatches = item.exact
				? pathname === hrefPath
				: pathname === hrefPath || pathname.startsWith(hrefPath + "/");

			if (!pathMatches) return false;

			if (hrefQuery) {
				if (!searchParams) return false;
				const expectedParams = new URLSearchParams(hrefQuery);
				for (const [key, value] of expectedParams.entries()) {
					if (searchParams.get(key) !== value) {
						return false;
					}
				}
			}

			return true;
		},
		[pathname, searchParams]
	);
}

function NotificationBadge({ count }: { count: number }) {
	return (
		<span className="ms-auto flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground group-data-[collapsible=icon]:hidden">
			{count}
		</span>
	);
}

// abzar-style menu button classes
const menuButtonBase =
	"!h-auto !min-h-11 w-full !gap-2.5 !rounded-xl !px-3 !py-2 !text-xs !font-black !transition-all !duration-200 group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!p-2";
const activeButton = "!bg-primary/10 !text-primary hover:!bg-primary/10";
const inactiveButton =
	"!text-muted-foreground hover:!bg-muted hover:!text-foreground";

function PlainMenuItem({ item }: { item: Menu }) {
	const isItemActive = useIsItemActive();
	const active = isItemActive(item);
	return (
		<SidebarMenuItem>
			{item.href ? (
				<SidebarMenuButton
					asChild
					isActive={active}
					tooltip={typeof item.label === "string" ? item.label : undefined}
					className={cn(menuButtonBase, active ? activeButton : inactiveButton)}
				>
					<Link href={item.href}>
						{item.icon ? (
							<span className="shrink-0 [&>svg]:size-[16px]">{item.icon}</span>
						) : null}
						<span className="truncate group-data-[collapsible=icon]:hidden">
							{item.label}
						</span>
						{!!item.notifications && (
							<NotificationBadge count={item.notifications} />
						)}
					</Link>
				</SidebarMenuButton>
			) : (
				<SidebarMenuButton
					isActive={active}
					className={cn(menuButtonBase, active ? activeButton : inactiveButton)}
				>
					{item.icon ? (
						<span className="shrink-0 [&>svg]:size-[16px]">{item.icon}</span>
					) : null}
					<span className="truncate group-data-[collapsible=icon]:hidden">
						{item.label}
					</span>
					{!!item.notifications && (
						<NotificationBadge count={item.notifications} />
					)}
				</SidebarMenuButton>
			)}
		</SidebarMenuItem>
	);
}

function CollapsibleMenuParent({ item }: { item: MenuParent }) {
	const isItemActive = useIsItemActive();
	const parentActive = isItemActive(item);
	const anyChildActive = item.menus.some((sub) => isItemActive(sub));
	const isCollapsibleActive = parentActive || anyChildActive;
	const [open, setOpen] = React.useState(parentActive || anyChildActive);

	React.useEffect(() => {
		if (parentActive || anyChildActive) setOpen(true);
	}, [parentActive, anyChildActive]);

	return (
		<SidebarMenuItem>
			<SidebarMenuButton
				isActive={isCollapsibleActive}
				tooltip={typeof item.label === "string" ? item.label : undefined}
				onClick={() => setOpen((o) => !o)}
				className={cn(
					menuButtonBase,
					isCollapsibleActive ? activeButton : inactiveButton
				)}
			>
				{item.icon ? (
					<span className="shrink-0 [&>svg]:size-[16px]">{item.icon}</span>
				) : null}
				<span className="truncate group-data-[collapsible=icon]:hidden">
					{item.label}
				</span>
				<ChevronRight
					className={cn(
						"ms-auto size-4 shrink-0 transition-transform duration-200 group-data-[collapsible=icon]:hidden",
						open && "rotate-90 rtl:-rotate-90"
					)}
				/>
			</SidebarMenuButton>
			{open && (
				<SidebarMenuSub className="mx-3 mt-1 gap-0.5 border-s border-border/60 px-2 py-1 group-data-[collapsible=icon]:hidden">
					{item.menus.map((sub, i) => {
						const subActive = isItemActive(sub);
						return (
							<SidebarMenuSubItem key={i}>
								{sub.href ? (
									<SidebarMenuSubButton
										asChild
										isActive={subActive}
										className={cn(
											"!h-8 !rounded-lg !px-2.5 !text-[11px] !font-bold transition",
											subActive
												? "!bg-primary/10 !text-primary"
												: "!text-muted-foreground hover:!bg-muted hover:!text-foreground"
										)}
									>
										<Link href={sub.href} className="flex items-center gap-2">
											{sub.icon ? (
												<span className="shrink-0 [&>svg]:size-3.5">
													{sub.icon}
												</span>
											) : null}
											<span>{sub.label}</span>
										</Link>
									</SidebarMenuSubButton>
								) : (
									<SidebarMenuSubButton
										isActive={subActive}
										className={cn(
											"!h-8 !rounded-lg !px-2.5 !text-[11px] !font-bold",
											subActive
												? "!bg-primary/10 !text-primary"
												: "!text-muted-foreground hover:!bg-muted hover:!text-foreground"
										)}
									>
										{sub.label}
									</SidebarMenuSubButton>
								)}
							</SidebarMenuSubItem>
						);
					})}
				</SidebarMenuSub>
			)}
		</SidebarMenuItem>
	);
}

function DropdownMenuParent({ item }: { item: MenuParent }) {
	const isItemActive = useIsItemActive();
	const anyChildActive = item.menus.some((sub) => isItemActive(sub));
	const parentActive = isItemActive(item) || anyChildActive;

	return (
		<SidebarMenuItem>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<SidebarMenuButton
						isActive={parentActive}
						className={cn(
							menuButtonBase,
							parentActive ? activeButton : inactiveButton
						)}
					>
						{item.icon ? (
							<span className="shrink-0 [&>svg]:size-[16px]">{item.icon}</span>
						) : null}
						<span className="truncate group-data-[collapsible=icon]:hidden">
							{item.label}
						</span>
						<ChevronRight className="ms-auto size-4 shrink-0 group-data-[collapsible=icon]:hidden" />
					</SidebarMenuButton>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					side="right"
					align="start"
					className="min-w-44 rounded-2xl p-1"
				>
					{item.menus.map((sub, i) => {
						const subActive = isItemActive(sub);
						return sub.href ? (
							<DropdownMenuItem
								key={i}
								asChild
								className={cn(
									"rounded-xl text-xs font-bold",
									subActive && "bg-primary/10 text-primary"
								)}
							>
								<Link href={sub.href} className="flex items-center gap-2">
									{sub.icon}
									{sub.label}
								</Link>
							</DropdownMenuItem>
						) : (
							<DropdownMenuItem
								key={i}
								className={cn(
									"rounded-xl text-xs font-bold",
									subActive && "bg-primary/10 text-primary"
								)}
							>
								{sub.label}
							</DropdownMenuItem>
						);
					})}
				</DropdownMenuContent>
			</DropdownMenu>
		</SidebarMenuItem>
	);
}

// \"sidebar\" type
function SidebarMenuParent({ item }: { item: MenuParent }) {
	const isItemActive = useIsItemActive();
	const parentActive = isItemActive(item);
	const anyChildActive = item.menus.some((sub) => isItemActive(sub));
	const isMenuParentActive = parentActive || anyChildActive;
	const [open, setOpen] = React.useState(parentActive || anyChildActive);

	return (
		<SidebarMenuItem>
			<SidebarMenuButton
				isActive={isMenuParentActive}
				onClick={() => setOpen((o) => !o)}
				className={cn(
					menuButtonBase,
					isMenuParentActive ? activeButton : inactiveButton
				)}
			>
				{item.icon ? (
					<span className="shrink-0 [&>svg]:size-[16px]">{item.icon}</span>
				) : null}
				<span className="truncate group-data-[collapsible=icon]:hidden">
					{item.label}
				</span>
				<PanelRightIcon
					className={cn(
						"ms-auto size-4 shrink-0 text-sidebar-foreground/40 transition-opacity group-data-[collapsible=icon]:hidden",
						open && "opacity-100 text-primary"
					)}
				/>
			</SidebarMenuButton>
			{open && (
				<SidebarMenuSub className="mx-3 mt-1 gap-0.5 border-s border-border/60 px-2 py-1 group-data-[collapsible=icon]:hidden">
					{item.menus.map((sub, i) => {
						const subActive = isItemActive(sub);
						return (
							<SidebarMenuSubItem key={i}>
								{sub.href ? (
									<SidebarMenuSubButton
										asChild
										isActive={subActive}
										className={cn(
											"!h-8 !rounded-lg !px-2.5 !text-[11px] !font-bold",
											subActive
												? "!bg-primary/10 !text-primary"
												: "!text-muted-foreground hover:!bg-muted hover:!text-foreground"
										)}
									>
										<Link href={sub.href}>{sub.label}</Link>
									</SidebarMenuSubButton>
								) : (
									<SidebarMenuSubButton
										isActive={subActive}
										className={cn(
											"!h-8 !rounded-lg !px-2.5 !text-[11px] !font-bold",
											subActive
												? "!bg-primary/10 !text-primary"
												: "!text-muted-foreground hover:!bg-muted hover:!text-foreground"
										)}
									>
										{sub.label}
									</SidebarMenuSubButton>
								)}
							</SidebarMenuSubItem>
						);
					})}
				</SidebarMenuSub>
			)}
		</SidebarMenuItem>
	);
}

function MenuGroupSection({ group }: { group: MenuGroup }) {
	return (
		<SidebarGroup className="p-0">
			{group.label && (
				<SidebarGroupLabel className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground/70 group-data-[collapsible=icon]:hidden">
					{group.label}
				</SidebarGroupLabel>
			)}
			<SidebarGroupContent>
				<SidebarMenu className="gap-1">
					{group.menus.map((item, i) => {
						if (!isMenuParent(item))
							return <PlainMenuItem key={i} item={item} />;
						if (item.type === "dropdown")
							return <DropdownMenuParent key={i} item={item} />;
						if (item.type === "sidebar")
							return <SidebarMenuParent key={i} item={item} />;
						return <CollapsibleMenuParent key={i} item={item} />;
					})}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}

function DashboardUserCard({ user }: { user: CurrentUser }) {
	const locale = useLocale();
	const isFa =
		locale === "fa" ||
		locale === "fa-AF" ||
		locale === "fa-IR" ||
		locale === "ps";
	return (
		<div className="group-data-[collapsible=icon]:hidden">
			<div className="rounded-2xl bg-gradient-to-br from-[#17233a] to-[#222340] p-4 text-white shadow-lg">
				<div className="flex items-start justify-between gap-3">
					<span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#725bff] to-[#36c6ab] text-base font-black text-white shadow-md">
						{getInitial(user.full_name) || "?"}
					</span>
					<span className="inline-flex rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black text-[#b7f486]">
						{user.role === "student"
							? isFa
								? "شاگرد"
								: "Student"
							: user.role === "instructor"
								? isFa
									? "استاد"
									: "Instructor"
								: user.role === "admin"
									? isFa
										? "مدیر"
										: "Admin"
									: user.role}
					</span>
				</div>
				<p className="mt-3 truncate text-sm font-black leading-tight">
					{user.full_name ?? (isFa ? "کاربر" : "User")}
				</p>
				<p
					className="mt-1 truncate text-[11px] font-medium text-white/60"
					dir="ltr"
				>
					{user.email}
				</p>
			</div>
			{/* collapsed avatar - shown only when collapsed */}
			<div className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:py-2">
				<span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#725bff] to-[#36c6ab] text-xs font-black text-white">
					{getInitial(user.full_name) || "?"}
				</span>
			</div>
		</div>
	);
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
	menus: MenuGroup[];
	header?: React.ReactNode;
	user?: CurrentUser;
};

export function AppSidebar({ menus, header, user, ...props }: AppSidebarProps) {
	const locale = useLocale();
	const defaultSide = isRtl(locale) ? "right" : "left";
	const defaultDir = dirOf(locale);
	const sorted = [...menus].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
	const isFa =
		locale === "fa" ||
		locale === "fa-AF" ||
		locale === "fa-IR" ||
		locale === "ps";

	return (
		<Sidebar
			collapsible="icon"
			side={defaultSide}
			dir={defaultDir}
			variant="floating"
			className="border-0 bg-transparent"
			{...props}
		>
			{header && <SidebarHeader className="p-3 pb-2">{header}</SidebarHeader>}
			<SidebarContent className="gap-3 overflow-x-hidden p-3 pt-0">
				{user && <DashboardUserCard user={user} />}

				{sorted.map((group, i) => (
					<React.Fragment key={i}>
						{i > 0 && <SidebarSeparator className="mx-0 bg-border/60" />}
						<MenuGroupSection group={group} />
					</React.Fragment>
				))}

				{/* Back to site - abzar style */}
				<div className="mt-1 border-t border-border/60 pt-3 group-data-[collapsible=icon]:hidden">
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton
								asChild
								className={cn(
									menuButtonBase,
									"!text-muted-foreground hover:!bg-muted hover:!text-foreground"
								)}
							>
								<Link href={`/${locale}`} className="flex items-center gap-2.5">
									<Compass size={16} className="shrink-0" />
									<span className="text-[11px] font-bold">
										{isFa ? "بازگشت به سایت" : "Back to site"}
									</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</div>

				{/* collapsed back icon */}
				<div className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
					<SidebarMenuButton
						asChild
						className={cn(menuButtonBase, inactiveButton)}
					>
						<Link href={`/${locale}`} aria-label="Back to site">
							<Compass size={16} />
						</Link>
					</SidebarMenuButton>
				</div>
			</SidebarContent>
			{user && (
				<SidebarFooter className="p-3 pt-0">
					<NavUser user={user} />
				</SidebarFooter>
			)}
		</Sidebar>
	);
}

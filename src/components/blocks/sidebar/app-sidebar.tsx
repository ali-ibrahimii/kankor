"use client";

import { ChevronRight, PanelRightIcon } from "lucide-react";
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
		<span className="ms-auto flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
			{count}
		</span>
	);
}

function PlainMenuItem({ item }: { item: Menu }) {
	const isItemActive = useIsItemActive();
	const active = isItemActive(item);
	return (
		<SidebarMenuItem>
			{item.href ? (
				<SidebarMenuButton asChild isActive={active}>
					<Link href={item.href}>
						{item.icon}
						<span>{item.label}</span>
						{!!item.notifications && (
							<NotificationBadge count={item.notifications} />
						)}
					</Link>
				</SidebarMenuButton>
			) : (
				<SidebarMenuButton isActive={active}>
					{item.icon}
					<span>{item.label}</span>
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

	return (
		<SidebarMenuItem>
			<SidebarMenuButton
				isActive={isCollapsibleActive}
				onClick={() => setOpen((o) => !o)}
			>
				{item.icon}
				<span>{item.label}</span>
				<ChevronRight
					className={cn(
						"ms-auto size-4 shrink-0 transition-transform duration-200",
						open && "rotate-90"
					)}
				/>
			</SidebarMenuButton>
			{open && (
				<SidebarMenuSub>
					{item.menus.map((sub, i) => {
						const subActive = isItemActive(sub);
						return (
							<SidebarMenuSubItem key={i}>
								{sub.href ? (
									<SidebarMenuSubButton asChild isActive={subActive}>
										<Link href={sub.href}>{sub.label}</Link>
									</SidebarMenuSubButton>
								) : (
									<SidebarMenuSubButton isActive={subActive}>
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
					<SidebarMenuButton isActive={parentActive}>
						{item.icon}
						<span>{item.label}</span>
						<ChevronRight className="ms-auto size-4 shrink-0" />
					</SidebarMenuButton>
				</DropdownMenuTrigger>
				<DropdownMenuContent side="right" align="start" className="min-w-40">
					{item.menus.map((sub, i) => {
						const subActive = isItemActive(sub);
						return sub.href ? (
							<DropdownMenuItem
								key={i}
								asChild
								className={cn(subActive && "bg-accent text-accent-foreground")}
							>
								<Link href={sub.href}>{sub.label}</Link>
							</DropdownMenuItem>
						) : (
							<DropdownMenuItem
								key={i}
								className={cn(subActive && "bg-accent text-accent-foreground")}
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

// "sidebar" type: indicates this item's children live in a secondary sidebar panel.
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
			>
				{item.icon}
				<span>{item.label}</span>
				<PanelRightIcon
					className={cn(
						"ms-auto size-4 shrink-0 text-sidebar-foreground/40 transition-opacity",
						open && "opacity-100"
					)}
				/>
			</SidebarMenuButton>
			{open && (
				<SidebarMenuSub>
					{item.menus.map((sub, i) => {
						const subActive = isItemActive(sub);
						return (
							<SidebarMenuSubItem key={i}>
								{sub.href ? (
									<SidebarMenuSubButton asChild isActive={subActive}>
										<Link href={sub.href}>{sub.label}</Link>
									</SidebarMenuSubButton>
								) : (
									<SidebarMenuSubButton isActive={subActive}>
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
		<SidebarGroup>
			{group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
			<SidebarGroupContent>
				<SidebarMenu>
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

	return (
		<Sidebar collapsible="icon" side={defaultSide} dir={defaultDir} {...props}>
			{header && <SidebarHeader>{header}</SidebarHeader>}
			<SidebarContent>
				{sorted.map((group, i) => (
					<React.Fragment key={i}>
						{i > 0 && <SidebarSeparator />}
						<MenuGroupSection group={group} />
					</React.Fragment>
				))}
			</SidebarContent>
			{user && (
				<SidebarFooter>
					<NavUser user={user} />
				</SidebarFooter>
			)}
		</Sidebar>
	);
}

"use client";

import {
	CircleUserRoundIcon,
	EllipsisVerticalIcon,
	LogOutIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "@/i18n/navigation";
import { isRtl } from "@/i18n/routing";
import { CurrentUser } from "@/lib/auth/types";
import { routes } from "@/lib/routes";
import { getInitial } from "@/utils/str.util";

export function NavUser({ user }: { user: CurrentUser | null }) {
	const router = useRouter();
	const locale = useLocale();
	const t = useTranslations("nav");
	const { isMobile } = useSidebar();
	const menuSide = isMobile ? "bottom" : isRtl(locale) ? "left" : "right";

	async function logout() {
		fetch(routes.api.auth.signout.route(), { method: "POST" }).then((res) => {
			if (res.ok) router.replace(routes.auth.login.page());
		});
	}

	if (!user)
		return <NavUserSkeleton logout={logout} logoutLabel={t("logOut")} />;
	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<Avatar className="h-8 w-8 rounded-lg grayscale">
								<AvatarImage
									src={user.avatar_url ?? ""}
									alt={user.full_name ?? ""}
								/>
								<AvatarFallback className="rounded-lg">
									{getInitial(user.full_name)}
								</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-start text-sm leading-tight">
								<span className="truncate font-medium">{user.full_name}</span>
								<span className="truncate text-xs text-muted-foreground">
									{user.email}
								</span>
							</div>
							<EllipsisVerticalIcon className="ms-auto size-4" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
						side={menuSide}
						align="end"
						sideOffset={4}
					>
						<DropdownMenuLabel className="p-0 font-normal">
							<div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
								<Avatar className="h-8 w-8 rounded-lg">
									{user.avatar_url && (
										<AvatarImage
											src={user.avatar_url}
											alt={user.full_name ?? ""}
										/>
									)}
									<AvatarFallback className="rounded-lg">
										{getInitial(user.full_name)}
									</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-start text-sm leading-tight">
									<span className="truncate font-medium">{user.full_name}</span>
									<span className="truncate text-xs text-muted-foreground">
										{user.email}
									</span>
								</div>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem
								onClick={() => {
									const managedSchool = user.schoolMemberships?.find(
										(m) => m.role === "owner" || m.role === "admin"
									);
									if (user.role === "instructor") {
										router.push(routes.d.instructor.account.page());
									} else if (managedSchool) {
										router.push(
											routes.d.school.account.page({
												school_id:
													user.active_school_id || managedSchool.school_id,
											})
										);
									} else if (user.role === "admin") {
										router.push("/d/admin/settings");
									} else {
										router.push(routes.d.account.page());
									}
								}}
							>
								<CircleUserRoundIcon />
								{t("account")}
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={logout}>
							<LogOutIcon />
							{t("logOut")}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}

export function NavUserSkeleton({
	logout,
	logoutLabel,
}: {
	logout: () => Promise<void>;
	logoutLabel?: string;
}) {
	const { isMobile } = useSidebar();
	const locale = useLocale();
	const t = useTranslations("nav");
	const menuSide = isMobile ? "bottom" : isRtl(locale) ? "left" : "right";
	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<Avatar className="h-8 w-8 rounded-lg grayscale">
								<AvatarFallback className="rounded-lg">
									<Skeleton className="size-2" />
								</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-start text-sm leading-tight gap-2">
								<span className="truncate font-medium">
									<Skeleton className="w-8/12 h-3" />
								</span>
								<span className="truncate text-xs text-muted-foreground">
									<Skeleton className="w-full h-3" />
								</span>
							</div>
							<EllipsisVerticalIcon className="ms-auto size-4" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
						side={menuSide}
						align="end"
						sideOffset={4}
					>
						<DropdownMenuItem onClick={logout}>
							<LogOutIcon />
							{logoutLabel ?? t("logOut")}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}

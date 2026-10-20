"use client";

import {
	CircleUserRoundIcon,
	EllipsisVerticalIcon,
	LogOutIcon,
} from "lucide-react";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { useRouter } from "@/i18n/navigation";
import { CurrentUser } from "@/lib/auth/types";
import { routes } from "@/lib/routes";
import { getInitial } from "@/utils/str.util";

export function NavUser({ user }: { user: CurrentUser | null }) {
	const router = useRouter();
	const { isMobile } = useSidebar();

	async function logout() {
		fetch(routes.api.auth.signout.route(), { method: "POST" }).then((res) => {
			if (res.ok) router.replace(routes.auth.login.page());
		});
	}

	if (!user) return <NavUserSkeleton logout={logout} />;
	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="rounded-2xl border border-border/60 bg-muted/40 px-2.5 py-2.5 transition hover:bg-muted data-[state=open]:bg-muted data-[state=open]:text-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-2"
						>
							<Avatar className="h-8 w-8 rounded-xl shadow-sm">
								<AvatarImage
									src={user.avatar_url ?? ""}
									alt={user.full_name ?? ""}
								/>
								<AvatarFallback className="rounded-xl bg-gradient-to-br from-[#725bff] to-[#36c6ab] text-xs font-black text-white">
									{getInitial(user.full_name)}
								</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-start text-sm leading-tight group-data-[collapsible=icon]:hidden">
								<span className="truncate text-xs font-black">
									{user.full_name}
								</span>
								<span className="truncate text-[11px] font-medium text-muted-foreground">
									{user.email}
								</span>
							</div>
							<EllipsisVerticalIcon className="ms-auto size-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-2xl p-1.5"
						side={isMobile ? "bottom" : "right"}
						align="end"
						sideOffset={8}
					>
						<DropdownMenuLabel className="p-0 font-normal">
							<div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-[#17233a] to-[#222340] p-3 text-white">
								<Avatar className="h-9 w-9 rounded-xl border border-white/10">
									{user.avatar_url && (
										<AvatarImage
											src={user.avatar_url}
											alt={user.full_name ?? ""}
										/>
									)}
									<AvatarFallback className="rounded-xl bg-gradient-to-br from-[#725bff] to-[#36c6ab] text-xs font-black text-white">
										{getInitial(user.full_name)}
									</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-start text-sm leading-tight">
									<span className="truncate text-xs font-black text-white">
										{user.full_name}
									</span>
									<span
										className="truncate text-[11px] text-white/60"
										dir="ltr"
									>
										{user.email}
									</span>
								</div>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator className="my-1.5 bg-border/60" />
						<DropdownMenuGroup>
							<DropdownMenuItem
								className="rounded-xl py-2.5 text-xs font-bold focus:bg-muted"
								onClick={() => {
									if (user.role === "instructor") {
										router.push(routes.d.instructor.account.page());
									} else if (
										user.active_school_id ||
										user.school_id ||
										(user.schoolMemberships &&
											user.schoolMemberships.length > 0)
									) {
										const schoolId =
											user.active_school_id ||
											user.school_id ||
											user.schoolMemberships[0].school_id;
										router.push(
											routes.d.school.account.page({ school_id: schoolId })
										);
									} else {
										router.push(routes.d.account.page());
									}
								}}
							>
								<CircleUserRoundIcon className="size-4" />
								حساب کاربری
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator className="my-1.5 bg-border/60" />
						<DropdownMenuItem
							onClick={logout}
							className="rounded-xl py-2.5 text-xs font-bold text-destructive focus:bg-destructive/10 focus:text-destructive"
						>
							<LogOutIcon className="size-4" />
							خروج
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}

export function NavUserSkeleton({ logout }: { logout: () => Promise<void> }) {
	const isMobile = useIsMobile();
	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="rounded-2xl border border-border/60 bg-muted/40 data-[state=open]:bg-muted"
						>
							<Avatar className="h-8 w-8 rounded-xl">
								<AvatarFallback className="rounded-xl">
									<Skeleton className="size-4 rounded-md" />
								</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-start text-sm leading-tight gap-2">
								<span className="truncate font-medium">
									<Skeleton className="w-8/12 h-3 rounded-full" />
								</span>
								<span className="truncate text-xs">
									<Skeleton className="w-full h-3 rounded-full" />
								</span>
							</div>
							<EllipsisVerticalIcon className="ms-auto size-4" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-2xl"
						side={isMobile ? "bottom" : "right"}
						align="end"
						sideOffset={4}
					>
						<DropdownMenuItem onClick={logout} className="rounded-xl">
							<LogOutIcon /> خروج
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}

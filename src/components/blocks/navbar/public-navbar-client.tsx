"use client";

import { LogIn, Menu } from "lucide-react";
import { useLocale } from "next-intl";
import { memo, ReactNode, useEffect, useState } from "react";
import { LogoBlueRounded } from "@/components/logos/logos";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { useIsPathActive } from "@/hooks/route-hooks";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth.provider";
import { getInitial } from "@/utils/str.util";

const NavbarScroll = ({ children }: { children: ReactNode }) => {
	const [scrolled, setScrolled] = useState(false);
	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 10);
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);
	return (
		<header className="fixed top-1.5 z-50 px-3 w-full transition-all duration-300 lg:px-4 bg-transparent">
			<nav
				className={cn(
					"flex justify-between mx-auto max-w-7xl rounded-xl border py-1.5 lg:py-2.5 border-slate-200/80 bg-white/80 px-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-lg transition-all duration-300 lg:px-3.5 gap-2",
					scrolled &&
						"border-slate-200/70 bg-white/70 shadow-[0_20px_60px_rgba(15,23,42,0.12)]"
				)}
			>
				{children}
			</nav>
		</header>
	);
};

export const NavbarScrollWrapper = memo(NavbarScroll);

export function DesktopNavLink({
	href,
	children,
}: {
	href: string;
	children: ReactNode;
}) {
	const isActive = useIsPathActive();
	const active = isActive(href);
	return (
		<Link
			href={href}
			className={cn(
				"rounded-full px-2 xl:px-4 py-2 text-sm font-medium transition-all duration-200",
				active
					? "bg-white text-[#0f4f9d] shadow-sm ring-1 ring-slate-200"
					: "text-slate-600 hover:bg-white hover:text-slate-950"
			)}
		>
			{children}
		</Link>
	);
}

export function PublicNavbarAuthButton({
	signInLabel,
	dashboardLabel,
}: {
	signInLabel: string;
	dashboardLabel: string;
}) {
	const { isAuthenticated, dashboardPath, profile } = useAuth();
	const signInUrl = routes.auth.login.page();
	return (
		<Link
			href={isAuthenticated ? dashboardPath : signInUrl}
			className={buttonVariants({
				variant: isAuthenticated ? "ghost" : "default",
				class: cn(
					"hidden border rounded-full! text-sm font-medium  transition-colors",
					{
						"rounded-md border-gray-800 bg-slate-900 px-4 py-2 hover:bg-gray-800 text-gray-200":
							!isAuthenticated,
						"px-0!": isAuthenticated,
					}
				),
			})}
		>
			{isAuthenticated ? (
				<Avatar>
					<AvatarImage
						src={profile?.avatar_url || ""}
						alt={profile?.full_name ?? "User Profile"}
					/>
					<AvatarFallback className="text-foreground">
						{" "}
						{getInitial(profile?.full_name)}
					</AvatarFallback>
				</Avatar>
			) : (
				signInLabel
			)}
		</Link>
	);
}

interface ResolvedNavLink {
	href: string;
	label: string;
	icon?: ReactNode;
	children?: { href: string; label: string; icon?: ReactNode }[];
}

function MobileAccordion({
	link,
	active,
	onClose,
	isRtl,
}: {
	link: ResolvedNavLink;
	active: boolean;
	onClose: () => void;
	isRtl: boolean;
}) {
	const isActive = useIsPathActive();

	return (
		<Accordion type="single" collapsible className="w-full border-none">
			<AccordionItem value={link.href} className="border-none">
				<AccordionTrigger
					className={cn(
						"flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:no-underline [&[data-state=open]>svg]:rotate-180",
						active
							? "bg-[#1461B8]/5 text-[#1461B8]"
							: "text-gray-700 hover:bg-gray-50"
					)}
				>
					<span className="flex items-center gap-2.5">
						{link.icon}
						{link.label}
					</span>
				</AccordionTrigger>
				<AccordionContent>
					<div className={cn("space-y-0.5 pt-1 pb-2", isRtl ? "pr-4" : "pl-4")}>
						{link.children!.map((child) => (
							<Link
								key={child.href}
								href={child.href}
								onClick={onClose}
								className={cn(
									"flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
									isActive(child.href)
										? "bg-[#1461B8]/5 font-medium text-[#1461B8]"
										: "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
								)}
							>
								{child.icon}
								{child.label}
							</Link>
						))}
					</div>
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	);
}

export function MobileNavSheet({
	navLinks,
	brandName,
	signInLabel,
}: {
	navLinks: ResolvedNavLink[];
	brandName: string;
	signInLabel: string;
}) {
	const [open, setOpen] = useState(false);
	const locale = useLocale();
	const isRtl = locale === "fa" || locale === "ar" || locale === "ps";
	const isActive = useIsPathActive();
	const signInUrl = routes.auth.login.page();

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="md:hidden size-9"
					aria-label="Open Menu"
				>
					<Menu className="size-5" />
				</Button>
			</SheetTrigger>
			<SheetContent
				showCloseButton={false}
				className="w-[320px] p-0 flex flex-col gap-0 border-none bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,0.97))] backdrop-blur-xl"
			>
				<SheetHeader className="border-b border-slate-200/80 py-3.5 text-left bg-white/80 backdrop-blur-xl">
					<SheetTitle className="sr-only">Menu</SheetTitle>
					<div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-[linear-gradient(135deg,rgba(20,97,184,0.08),rgba(14,165,233,0.08))] px-3 py-2.5">
						<Link
							href="/"
							onClick={() => setOpen(false)}
							className="flex items-center gap-2.5"
						>
							<div className="flex size-9 items-center justify-center rounded-2xl bg-white/80 ring-1 ring-inset ring-sky-500/10">
								<LogoBlueRounded className="size-7" />
							</div>
							<div className="flex flex-col">
								<span className="text-base font-semibold tracking-tight text-slate-900">
									{brandName}
								</span>
							</div>
						</Link>
					</div>
				</SheetHeader>

				<div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
					<div className="space-y-0.5">
						{navLinks.map((link) => {
							const active = isActive(link.href);
							if (link.children && link.children.length > 0) {
								return (
									<MobileAccordion
										key={link.href}
										link={link}
										active={active}
										onClose={() => setOpen(false)}
										isRtl={isRtl}
									/>
								);
							}
							return (
								<Link
									key={link.href}
									href={link.href}
									onClick={() => setOpen(false)}
									className={cn(
										"flex items-center gap-2.5 rounded-[18px] px-3 py-[11px] text-sm font-medium transition-all duration-200",
										active
											? "bg-[linear-gradient(135deg,rgba(20,97,184,0.1),rgba(14,165,233,0.12))] text-[#1461B8] shadow-sm"
											: "text-slate-700 hover:bg-slate-50"
									)}
								>
									{link.icon}
									{link.label}
								</Link>
							);
						})}
					</div>
				</div>

				<div className="space-y-2 border-t border-slate-200/80 bg-white/90 p-4 backdrop-blur-xl">
					<Link
						href={signInUrl}
						onClick={() => setOpen(false)}
						className="flex w-full items-center justify-center gap-2 rounded-[18px] bg-[linear-gradient(135deg,#1461B8,#0ea5e9)] py-3 text-sm font-semibold text-white shadow-sm shadow-sky-500/20 transition-all hover:-translate-y-0.5 hover:shadow-md"
					>
						<LogIn className="size-4" />
						{signInLabel}
					</Link>
				</div>
			</SheetContent>
		</Sheet>
	);
}

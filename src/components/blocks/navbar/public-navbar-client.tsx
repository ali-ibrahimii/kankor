"use client";

import { LogIn, Menu } from "lucide-react";
import { useLocale } from "next-intl";
import { memo, type ReactNode, useEffect, useState } from "react";
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

/**
 * Public-site navbar — Coursera-style sticky header.
 *
 * All colors come from the design tokens (primary/foreground/muted…) so the
 * light and dark themes stay in sync; no hardcoded hex here.
 */

const NavbarScroll = ({ children }: { children: ReactNode }) => {
	const [scrolled, setScrolled] = useState(false);
	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 10);
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);
	return (
		<header className="site-header">
			<nav
				className={cn(
					"mx-auto flex min-h-[64px] max-w-7xl items-center justify-between gap-2 px-4 transition-all duration-300 sm:px-6 lg:min-h-[82px] lg:px-8",
					scrolled && "min-h-[60px] lg:min-h-[72px]"
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
				"rounded-xl px-3 py-2 text-[13px] font-bold transition-colors duration-200",
				active
					? "bg-primary/10 text-primary"
					: "text-muted-foreground hover:bg-primary/5 hover:text-primary"
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
					"hidden border-none text-xs font-bold transition-colors md:inline-flex",
					{
						"button-primary": !isAuthenticated,
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
						"flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-sm font-bold transition-colors hover:no-underline [&[data-state=open]>svg]:rotate-180",
						active
							? "bg-primary/10 text-primary"
							: "text-foreground hover:bg-primary/5 hover:text-primary"
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
									"flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors",
									isActive(child.href)
										? "bg-primary/10 font-bold text-primary"
										: "text-muted-foreground hover:bg-primary/5 hover:text-primary"
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
					className="size-9 md:hidden"
					aria-label="Open Menu"
				>
					<Menu className="size-5" />
				</Button>
			</SheetTrigger>
			<SheetContent
				showCloseButton={false}
				className="flex w-[320px] flex-col gap-0 border-border/70 bg-background p-0"
			>
				<SheetHeader className="border-b border-border/70 py-3.5 text-start">
					<SheetTitle className="sr-only">Menu</SheetTitle>
					<div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-primary/5 px-3 py-2.5">
						<Link
							href="/"
							onClick={() => setOpen(false)}
							className="flex items-center gap-2.5"
						>
							<div className="flex size-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#725bff] via-[#735fe7] to-[#36c6ab] text-white shadow-lg shadow-primary/25">
								<LogoBlueRounded className="size-6" />
							</div>
							<span className="text-base font-black tracking-tight text-foreground">
								{brandName}
							</span>
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
										"flex items-center gap-2.5 rounded-2xl px-3 py-[11px] text-sm font-bold transition-all duration-200",
										active
											? "bg-primary/10 text-primary"
											: "text-foreground hover:bg-primary/5 hover:text-primary"
									)}
								>
									{link.icon}
									{link.label}
								</Link>
							);
						})}
					</div>
				</div>

				<div className="space-y-2 border-t border-border/70 p-4">
					<Link
						href={signInUrl}
						onClick={() => setOpen(false)}
						className="button-primary w-full"
					>
						<LogIn className="size-4" />
						{signInLabel}
					</Link>
				</div>
			</SheetContent>
		</Sheet>
	);
}

"use client";

import { Menu, X } from "lucide-react";
import { useLocale } from "next-intl";
import { memo, type ReactNode, useEffect, useState } from "react";
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
import { isRtl } from "@/i18n/routing";
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
		<header className="site-header">
			<nav
				className={cn(
					"mx-auto flex min-h-[62px] max-w-7xl items-center justify-between gap-2 px-3 transition-all duration-300 sm:px-6 lg:min-h-[82px] lg:px-8",
					scrolled && "min-h-[58px] lg:min-h-[72px]"
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
			aria-label={isAuthenticated ? dashboardLabel : signInLabel}
			className={buttonVariants({
				variant: isAuthenticated ? "ghost" : "default",
				class: cn(
					"hidden border-none text-xs font-bold transition-colors lg:inline-flex",
					{
						"button-primary min-h-10 px-4 py-2": !isAuthenticated,
						"px-0!": isAuthenticated,
					}
				),
			})}
		>
			{isAuthenticated ? (
				<Avatar>
					<AvatarImage
						src={profile?.avatar_url || ""}
						alt={profile?.full_name ?? dashboardLabel}
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

export interface ResolvedNavLink {
	href: string;
	label: string;
	children?: { href: string; label: string }[];
}

function MobileAccordion({
	link,
	active,
	onClose,
}: {
	link: ResolvedNavLink;
	active: boolean;
	onClose: () => void;
}) {
	const isActive = useIsPathActive();

	return (
		<Accordion
			type="single"
			collapsible
			defaultValue={link.href}
			className="w-full border-none"
		>
			<AccordionItem value={link.href} className="border-none">
				<AccordionTrigger
					className={cn(
						"flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-bold transition-colors hover:no-underline [&[data-state=open]>svg]:rotate-180",
						active
							? "text-primary"
							: "text-foreground hover:bg-muted/60 hover:text-primary"
					)}
				>
					<span>{link.label}</span>
				</AccordionTrigger>
				<AccordionContent>
					<div className="ms-3 space-y-0.5 border-s border-border/80 ps-3 pt-1 pb-2">
						{link.children?.map((child) => (
							<Link
								key={child.label}
								href={child.href}
								onClick={onClose}
								className={cn(
									"block rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
									isActive(child.href.split("?")[0])
										? "bg-primary/8 font-bold text-primary"
										: "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
								)}
							>
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
	dashboardLabel,
	openMenuLabel,
	closeMenuLabel,
}: {
	navLinks: ResolvedNavLink[];
	brandName: string;
	signInLabel: string;
	dashboardLabel: string;
	openMenuLabel: string;
	closeMenuLabel: string;
}) {
	const [open, setOpen] = useState(false);
	const locale = useLocale();
	const rtl = isRtl(locale);
	const isActive = useIsPathActive();
	const { isAuthenticated, dashboardPath } = useAuth();
	const signInUrl = routes.auth.login.page();

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="size-9 shrink-0 rounded-xl lg:hidden"
					aria-label={openMenuLabel}
				>
					<Menu className="size-5" />
				</Button>
			</SheetTrigger>
			<SheetContent
				side={rtl ? "right" : "left"}
				showCloseButton={false}
				className="flex w-[min(300px,86vw)] flex-col gap-0 border-border/60 bg-background p-0 shadow-2xl"
			>
				<SheetHeader className="border-b border-border/60 px-5 py-4 text-start">
					<SheetTitle className="sr-only">{openMenuLabel}</SheetTitle>
					<div className="flex items-center justify-between gap-2">
						<Link
							href={routes.home.page()}
							onClick={() => setOpen(false)}
							className="truncate text-base font-black tracking-tight text-foreground"
						>
							{brandName}
						</Link>

						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={() => setOpen(false)}
							aria-label={closeMenuLabel}
							className="size-8 shrink-0 rounded-lg text-muted-foreground hover:text-foreground"
						>
							<X className="size-4" />
						</Button>
					</div>
				</SheetHeader>

				<nav className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
					<div className="space-y-1">
						{navLinks.map((link) => {
							const active = isActive(link.href);
							if (link.children && link.children.length > 0) {
								return (
									<MobileAccordion
										key={link.href}
										link={link}
										active={active}
										onClose={() => setOpen(false)}
									/>
								);
							}
							return (
								<Link
									key={link.href}
									href={link.href}
									onClick={() => setOpen(false)}
									className={cn(
										"block rounded-xl px-3 py-2.5 text-sm font-bold transition-colors",
										active
											? "bg-primary/8 text-primary"
											: "text-foreground hover:bg-muted/60 hover:text-primary"
									)}
								>
									{link.label}
								</Link>
							);
						})}
					</div>
				</nav>

				<div className="border-t border-border/60 p-4">
					<Link
						href={isAuthenticated ? dashboardPath : signInUrl}
						onClick={() => setOpen(false)}
						className="button-primary h-10 w-full rounded-xl text-xs font-bold"
					>
						{isAuthenticated ? dashboardLabel : signInLabel}
					</Link>
				</div>
			</SheetContent>
		</Sheet>
	);
}

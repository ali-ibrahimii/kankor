import { GraduationCap } from "lucide-react";
import type { ReactNode } from "react";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";

/**
 * Brand lockup shown at the top of every dashboard sidebar — gradient tile +
 * product name (and an optional role subtitle), identical across student /
 * instructor / school / agency / admin dashboards.
 */
export function SidebarBrand({
	name,
	subtitle,
	href,
}: {
	name: string;
	/** Small role line under the name (e.g. "Instructor", "Super admin"). */
	subtitle?: ReactNode;
	/** Override the home link (admin links to their dashboard root). */
	href?: string;
}) {
	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<SidebarMenuButton asChild size="lg">
					<Link href={href ?? routes.home.page()}>
						<span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#725bff] via-[#735fe7] to-[#36c6ab] text-white shadow-lg shadow-primary/25">
							<GraduationCap className="size-5" />
						</span>
						<span className="flex flex-col leading-none transition-all duration-150 group-data-[state=collapsed]:w-0 group-data-[state=collapsed]:opacity-0">
							<span className="text-sm font-black tracking-tight">{name}</span>
							{subtitle ? (
								<span className="text-[10px] font-bold text-muted-foreground">
									{subtitle}
								</span>
							) : null}
						</span>
					</Link>
				</SidebarMenuButton>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}

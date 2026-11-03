import { GraduationCap, Presentation, School, ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import {
	type DemoRole,
	demoRoleMessageKey,
	demoRoles,
} from "@/lib/demo/mock-dashboard";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

const roleIcons: Record<DemoRole, ReactNode> = {
	student: <GraduationCap className="size-4" />,
	instructor: <Presentation className="size-4" />,
	school: <School className="size-4" />,
	admin: <ShieldCheck className="size-4" />,
};

/**
 * Segmented role picker for the public demo — each role renders the matching
 * real dashboard overview (student, instructor, school, platform admin).
 */
export async function DemoRoleSwitcher({ role }: { role: DemoRole }) {
	const t = await getTranslations("demo");

	return (
		<div
			role="group"
			aria-label={t("roleSwitcher")}
			className="inline-flex flex-wrap items-center gap-1 rounded-2xl border border-border/70 bg-muted/40 p-1"
		>
			{demoRoles.map((item) => {
				const active = item === role;
				return (
					<Link
						key={item}
						href={routes.demo.page({ role: item })}
						aria-current={active ? "page" : undefined}
						className={cn(
							"inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
							active
								? "bg-background text-foreground shadow-sm ring-1 ring-border/70"
								: "text-muted-foreground hover:bg-background/60 hover:text-foreground"
						)}
					>
						{roleIcons[item]}
						{t(`roles.${demoRoleMessageKey[item]}`)}
					</Link>
				);
			})}
		</div>
	);
}

"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import { AccountStatusBadge } from "./account-status-badge";
import { StatusActionsMenu, type StatusEntity } from "./status-actions-menu";

/**
 * Shared header for admin detail pages (instructor & school): back link,
 * avatar, title/subtitle, status badge, and the status actions menu.
 * Server pages render it with plain serializable props; after a status
 * change it refreshes the route so server-fetched data stays in sync.
 */
export function EntityDetailHeader({
	entity,
	title,
	subtitle,
	avatarUrl,
	backHref,
	backLabel,
}: {
	entity: StatusEntity;
	title: string;
	subtitle?: string | null;
	avatarUrl?: string | null;
	backHref: string;
	backLabel: string;
}) {
	const t = useTranslations("admin.common");
	const router = useRouter();

	return (
		<div className="space-y-4">
			<Button asChild variant="ghost" size="sm" className="-ms-2">
				<Link href={backHref}>
					<ArrowLeft className="size-4 rtl:rotate-180" />
					{backLabel}
				</Link>
			</Button>

			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<Avatar className="size-12">
						<AvatarImage src={avatarUrl ?? undefined} />
						<AvatarFallback className="text-sm">
							{title.slice(0, 2).toUpperCase()}
						</AvatarFallback>
					</Avatar>
					<div className="min-w-0">
						<div className="flex items-center gap-2">
							<h1 className="truncate text-xl font-bold">{title}</h1>
							<AccountStatusBadge status={entity.status} />
						</div>
						{subtitle && (
							<p className="mt-0.5 truncate text-sm text-muted-foreground">
								{subtitle}
							</p>
						)}
					</div>
				</div>

				<div className="flex items-center gap-2">
					<span className="text-sm text-muted-foreground">{t("actions")}</span>
					<StatusActionsMenu
						entity={entity}
						onChanged={() => router.refresh()}
					/>
				</div>
			</div>
		</div>
	);
}

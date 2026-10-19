"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { type AccountStatus, statusBadgeVariant } from "./status.utils";

export function AccountStatusBadge({
	status,
}: {
	status: AccountStatus | null;
}) {
	const t = useTranslations("admin.status");
	const effective = status ?? "pending";

	return <Badge variant={statusBadgeVariant(effective)}>{t(effective)}</Badge>;
}

"use client";

import { ArrowLeft, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { AccountStatusBadge, ConfirmDialog } from "@/components/blocks/admin";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Link, useRouter } from "@/i18n/navigation";
import type { Tables } from "@/lib/supabase/database.types";
import {
	type AgencyUpsertValues,
	setAgencyStatus,
	updateAgency,
} from "./actions";
import { AgencyForm } from "./agency-form";

/**
 * Admin agency detail header: back link, name, status badge, edit dialog,
 * and suspend/reactivate (suspension instantly freezes all agency actions).
 */
export function AgencyDetailHeader({
	agency,
	backHref,
}: {
	agency: Tables<"agencies">;
	backHref: string;
}) {
	const t = useTranslations("admin.agencies.detail");
	const router = useRouter();
	const [editOpen, setEditOpen] = React.useState(false);
	const [confirmSuspend, setConfirmSuspend] = React.useState(false);

	const suspended = agency.status === "suspended";

	async function handleUpdate(values: AgencyUpsertValues) {
		const result = await updateAgency(agency.id, values);
		if (!result.success) {
			toast.error(result.error);
			return;
		}
		toast.success(t("updated"));
		setEditOpen(false);
		router.refresh();
	}

	async function handleStatusToggle() {
		const result = await setAgencyStatus(
			agency.id,
			suspended ? "active" : "suspended"
		);
		if (!result.success) toast.error(result.error);
		else {
			toast.success(suspended ? t("reactivated") : t("suspended"));
			router.refresh();
		}
		setConfirmSuspend(false);
	}

	return (
		<div className="space-y-4">
			<Button asChild variant="ghost" size="sm" className="-ms-2">
				<Link href={backHref}>
					<ArrowLeft className="size-4 rtl:rotate-180" />
					{t("back")}
				</Link>
			</Button>

			<div className="flex flex-wrap items-center gap-3">
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<h1 className="truncate text-xl font-bold">{agency.name}</h1>
						<AccountStatusBadge status={agency.status} />
					</div>
					<p className="mt-0.5 text-sm text-muted-foreground">
						{t("commission", {
							percent: (agency.commission_rate * 100).toFixed(1),
						})}
						{" · "}
						{t("liabilityLimit", {
							limit: agency.liability_limit.toLocaleString(),
						})}
					</p>
				</div>

				<Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
					<Pencil className="size-4" />
					{t("edit")}
				</Button>
				<Button
					variant={suspended ? "default" : "destructive"}
					size="sm"
					onClick={() =>
						suspended ? handleStatusToggle() : setConfirmSuspend(true)
					}
				>
					{suspended ? t("reactivate") : t("suspend")}
				</Button>
			</div>

			<Dialog open={editOpen} onOpenChange={setEditOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("editTitle")}</DialogTitle>
					</DialogHeader>
					<AgencyForm
						initialValues={agency}
						onSubmit={handleUpdate}
						onCancel={() => setEditOpen(false)}
					/>
				</DialogContent>
			</Dialog>

			<ConfirmDialog
				open={confirmSuspend}
				onOpenChange={setConfirmSuspend}
				title={t("suspendTitle")}
				description={t("suspendDescription", { name: agency.name })}
				onConfirm={handleStatusToggle}
			/>
		</div>
	);
}

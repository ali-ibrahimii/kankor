"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useSupabase } from "@/hooks/use-supabase";
import type { Database, Json } from "@/lib/supabase/database.types";
import { removeAgencyGrant, upsertAgencyGrant } from "./actions";
import { EntityScopePicker } from "./entity-scope-picker";
import {
	type AgencyPermission,
	PERMISSION_CATALOG,
	PROVINCE_SCOPABLE,
} from "./permissions";

type AgencyGrantScope = Database["public"]["Enums"]["agency_grant_scope"];

/**
 * Super-admin grant editor: one row per catalog permission with an
 * enable checkbox and a scope selector (deny by default — no row, no grant).
 */
export function AgencyGrantsEditor({ agencyId }: { agencyId: string }) {
	const t = useTranslations("admin.agencies.grants");
	const queryClient = useQueryClient();

	const grantsQuery = useSupabase({
		table: "agency_grants",
		selectColumns: "id, agency_id, permission, scope_type, scope",
		state: {
			filters: [{ field: "agency_id", operator: "eq", value: agencyId }],
		},
	});
	const grants = grantsQuery.data?.data ?? [];
	const isLoading = grantsQuery.isLoading;

	const provincesQuery = useSupabase({
		table: "provinces",
		selectColumns: "id, name",
		staleTime: Infinity,
	});
	const provinces = provincesQuery.data?.data ?? [];

	const grantByPermission = new Map(grants.map((g) => [g.permission, g]));

	function invalidate() {
		queryClient.invalidateQueries({ queryKey: ["agency_grants"] });
	}

	async function handleToggle(permission: AgencyPermission, enabled: boolean) {
		const result = enabled
			? await upsertAgencyGrant({
					agency_id: agencyId,
					permission,
					scope_type: "global",
					scope: null,
				})
			: await removeAgencyGrant(agencyId, permission);

		if (!result.success) {
			toast.error(result.error);
			return;
		}
		toast.success(enabled ? t("granted") : t("revoked"));
		invalidate();
	}

	async function handleScopeTypeChange(
		permission: AgencyPermission,
		scopeType: AgencyGrantScope
	) {
		const result = await upsertAgencyGrant({
			agency_id: agencyId,
			permission,
			scope_type: scopeType,
			scope:
				scopeType === "global"
					? null
					: scopeType === "province"
						? { province_ids: [] }
						: { entity_ids: [] },
		});
		if (!result.success) {
			toast.error(result.error);
			return;
		}
		invalidate();
	}

	async function handleProvinceToggle(
		permission: AgencyPermission,
		provinceId: string,
		checked: boolean
	) {
		const grant = grantByPermission.get(permission);
		const scope = grant?.scope as { province_ids?: string[] } | null;
		const current = scope?.province_ids ?? [];
		const next = checked
			? [...current, provinceId]
			: current.filter((id) => id !== provinceId);

		const result = await upsertAgencyGrant({
			agency_id: agencyId,
			permission,
			scope_type: "province",
			scope: { province_ids: next } as Json,
		});
		if (!result.success) {
			toast.error(result.error);
			return;
		}
		invalidate();
	}

	async function handleEntityToggle(
		permission: AgencyPermission,
		entityId: string,
		label: string,
		checked: boolean
	) {
		const grant = grantByPermission.get(permission);
		const scope = grant?.scope as {
			entity_ids?: string[];
			entity_labels?: Record<string, string>;
		} | null;
		const current = scope?.entity_ids ?? [];
		const labels = { ...(scope?.entity_labels ?? {}) };
		let next: string[];
		if (checked) {
			next = [...current, entityId];
			labels[entityId] = label;
		} else {
			next = current.filter((id) => id !== entityId);
			delete labels[entityId];
		}

		const result = await upsertAgencyGrant({
			agency_id: agencyId,
			permission,
			scope_type: "entities",
			// entity_labels is display-only metadata; authorization reads
			// exclusively entity_ids (see agency_has_permission).
			scope: { entity_ids: next, entity_labels: labels } as Json,
		});
		if (!result.success) {
			toast.error(result.error);
			return;
		}
		invalidate();
	}

	if (isLoading) {
		return <div className="h-40 animate-pulse rounded-lg border bg-muted/40" />;
	}

	return (
		<div className="divide-y rounded-lg border">
			{PERMISSION_CATALOG.map((permission) => {
				const grant = grantByPermission.get(permission);
				const enabled = Boolean(grant);
				const scopeType = grant?.scope_type ?? "global";
				const scope = grant?.scope as {
					province_ids?: string[];
					entity_ids?: string[];
					entity_labels?: Record<string, string>;
				} | null;
				const selectedProvinces = scope?.province_ids ?? [];
				const selectedEntities = scope?.entity_ids ?? [];
				const entityLabels = scope?.entity_labels ?? {};

				return (
					<div key={permission} className="space-y-3 p-4">
						<div className="flex flex-wrap items-center gap-3">
							<Label className="flex cursor-pointer items-center gap-2">
								<Checkbox
									checked={enabled}
									onCheckedChange={(checked) =>
										handleToggle(permission, checked === true)
									}
								/>
								<span className="font-medium">
									{t(`permissions.${permission}` as never)}
								</span>
							</Label>
							<Badge variant="outline" className="font-mono text-xs">
								{permission}
							</Badge>

							{enabled && (
								<Select
									value={scopeType}
									onValueChange={(value) =>
										handleScopeTypeChange(permission, value as AgencyGrantScope)
									}
								>
									<SelectTrigger className="ms-auto w-40">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="global">{t("scope.global")}</SelectItem>
										{PROVINCE_SCOPABLE.includes(permission) && (
											<SelectItem value="province">
												{t("scope.province")}
											</SelectItem>
										)}
										<SelectItem value="entities">
											{t("scope.entities")}
										</SelectItem>
									</SelectContent>
								</Select>
							)}
						</div>

						{enabled && scopeType === "province" && (
							<div className="flex flex-wrap gap-x-4 gap-y-2 ps-6">
								{provinces.map((province) => (
									<Label
										key={province.id}
										className="flex cursor-pointer items-center gap-1.5 text-sm"
									>
										<Checkbox
											checked={selectedProvinces.includes(province.id)}
											onCheckedChange={(checked) =>
												handleProvinceToggle(
													permission,
													province.id,
													checked === true
												)
											}
										/>
										{province.name}
									</Label>
								))}
							</div>
						)}

						{enabled && scopeType === "entities" && (
							<div className="ps-6">
								<EntityScopePicker
									permission={permission}
									selectedIds={selectedEntities}
									selectedLabels={entityLabels}
									onToggle={(id, label, checked) =>
										handleEntityToggle(permission, id, label, checked)
									}
								/>
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}

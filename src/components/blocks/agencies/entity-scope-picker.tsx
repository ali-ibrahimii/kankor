"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryFilters } from "@/hooks/filter/filter.hooks";
import type { AgencyPermission } from "./permissions";

/** Which admin view feeds the entity picker for a given permission. */
function entitySource(
	permission: AgencyPermission
): "schools" | "instructors" | null {
	if (permission === "schools.suspend" || permission === "schools.manage")
		return "schools";
	if (permission === "instructors.suspend") return "instructors";
	return null;
}

/**
 * Super-admin picker for entity-scoped grants: search schools or
 * instructors (via the admin views) and toggle their ids in the grant's
 * scope.entity_ids list. Selected entities stay pinned above the results.
 */
export function EntityScopePicker({
	permission,
	selectedIds,
	selectedLabels,
	onToggle,
}: {
	permission: AgencyPermission;
	selectedIds: string[];
	/** id → display label cache so selections stay readable across searches. */
	selectedLabels: Record<string, string>;
	onToggle: (id: string, label: string, checked: boolean) => void;
}) {
	const t = useTranslations("admin.agencies.grants.entityPicker");
	const source = entitySource(permission);

	const schoolsQuery = useQueryFilters<"admin_schools_view">({
		table: "admin_schools_view",
		selectColumns: "id, name, admin_email",
		searchColumns: ["name", "admin_email"],
		initialState: {
			name: `grant-schools-${permission}`,
			pagination: { page: 1, pageSize: 8 },
			sort: [{ field: "name", direction: "asc" }],
		},
		enabled: source === "schools",
	});

	const instructorsQuery = useQueryFilters<"admin_instructors_view">({
		table: "admin_instructors_view",
		selectColumns: "id, full_name, email",
		searchColumns: ["full_name", "email"],
		initialState: {
			name: `grant-instructors-${permission}`,
			pagination: { page: 1, pageSize: 8 },
			sort: [{ field: "full_name", direction: "asc" }],
		},
		enabled: source === "instructors",
	});

	if (!source) {
		return <p className="text-sm text-muted-foreground">{t("unsupported")}</p>;
	}

	const query = source === "schools" ? schoolsQuery : instructorsQuery;
	const options = (query.data?.data ?? []).map((row) =>
		"name" in row
			? { id: row.id ?? "", label: row.name ?? "", sub: row.admin_email }
			: { id: row.id ?? "", label: row.full_name ?? "", sub: row.email }
	);

	return (
		<div className="space-y-2">
			{selectedIds.length > 0 && (
				<div className="flex flex-wrap gap-x-4 gap-y-1">
					{selectedIds.map((id) => (
						<Label
							key={id}
							className="flex cursor-pointer items-center gap-1.5 text-sm font-medium"
						>
							<Checkbox
								checked
								onCheckedChange={() =>
									onToggle(id, selectedLabels[id] ?? id, false)
								}
							/>
							{selectedLabels[id] ?? id}
						</Label>
					))}
				</div>
			)}

			<Input
				value={query.state.search ?? ""}
				onChange={(e) => query.setSearch(e.target.value)}
				placeholder={t(
					source === "schools" ? "searchSchools" : "searchInstructors"
				)}
				className="max-w-sm"
			/>

			<div className="flex flex-wrap gap-x-4 gap-y-1">
				{options
					.filter((option) => !selectedIds.includes(option.id))
					.map((option) => (
						<Label
							key={option.id}
							className="flex cursor-pointer items-center gap-1.5 text-sm"
						>
							<Checkbox
								checked={false}
								onCheckedChange={(checked) =>
									onToggle(option.id, option.label, checked === true)
								}
							/>
							<span>
								{option.label}
								{option.sub && (
									<span className="ms-1 text-xs text-muted-foreground">
										({option.sub})
									</span>
								)}
							</span>
						</Label>
					))}
				{!query.isFetching && options.length === 0 && (
					<p className="text-sm text-muted-foreground">{t("noResults")}</p>
				)}
			</div>
		</div>
	);
}

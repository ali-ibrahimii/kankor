"use client";

import { useTranslations } from "next-intl";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { AccountStatus } from "./status.utils";

export type StatusFilterValue = AccountStatus | "all";

/**
 * Single-select toggle group used to quickly filter admin lists by
 * account status (all / pending / active / …). Reused by both the
 * instructors and schools pages.
 */
export function StatusFilterToggle({
	value,
	onValueChange,
	statuses = ["pending", "active", "suspended", "disabled", "rejected"],
}: {
	value: StatusFilterValue;
	onValueChange: (value: StatusFilterValue) => void;
	statuses?: AccountStatus[];
}) {
	const t = useTranslations("admin.status");
	const tCommon = useTranslations("admin.common");

	return (
		<ToggleGroup
			type="single"
			variant="outline"
			size="sm"
			spacing={0}
			value={value}
			onValueChange={(next) => {
				// Radix clears the value when the active item is re-clicked —
				// keep the current selection instead of an empty filter state.
				if (next) onValueChange(next as StatusFilterValue);
			}}
		>
			<ToggleGroupItem value="all">{tCommon("all")}</ToggleGroupItem>
			{statuses.map((status) => (
				<ToggleGroupItem key={status} value={status}>
					{t(status)}
				</ToggleGroupItem>
			))}
		</ToggleGroup>
	);
}

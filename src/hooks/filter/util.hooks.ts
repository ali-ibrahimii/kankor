import { useMemo } from "react";
import type { ColumnName, TableName } from "@/types/db.types";
import { useQueryStateWithUrl } from "./filter.hooks";
import type { Filter } from "./types";

export function useFilters<
	T extends TableName,
	K extends ColumnName<T> = ColumnName<T>,
>(field: K): Filter<T>[] {
	const [state] = useQueryStateWithUrl<T>();
	return useMemo(
		() =>
			(state.filters?.filter((f) => f.field === field) ?? []) as Filter<T>[],
		[state.filters, field]
	);
}

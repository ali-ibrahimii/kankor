"use client";

import { useQuery } from "@tanstack/react-query";
import { defaultQueryFn } from "@/hooks/filter/query-state-mapping";
import type { QueryState } from "@/hooks/filter/types";
import { createClient } from "@/lib/supabase/client";
import type { TableRow, TableViewName } from "@/types/db.types";

const supabase = createClient();

type Options<T extends TableViewName> = {
	table: T;
	selectColumns?: string;
	state?: QueryState<T>;
	searchColumns?: (keyof TableRow<T>)[];
	single?: boolean;
	staleTime?: number;
	gcTime?: number;
};

export function useSupabase<T extends TableViewName, R = TableRow<T>[]>({
	searchColumns,
	selectColumns,
	table,
	state,
	single,
	staleTime,
	gcTime,
}: Options<T>) {
	return useQuery({
		queryKey: [table],
		queryFn: () =>
			defaultQueryFn<T, R>(selectColumns, searchColumns)(
				supabase,
				table,
				state,
				single
			),
		staleTime,
		gcTime,
	});
}

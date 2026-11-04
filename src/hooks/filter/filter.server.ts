import { isSupabaseServerConfigured } from "@/lib/env/server-env";
import { createClient } from "@/lib/supabase/server";
import type { TableRow, TableViewName } from "@/types/db.types";
import { deserializeQuery } from "./filter.utils";
import { defaultQueryFn } from "./query-state-mapping";
import type { QueryFn, QueryState } from "./types";

export interface GetServerQueryFilterOptions<
	T extends TableViewName,
	TResult = TableRow<T>[],
> {
	name: string;
	queryFn?: QueryFn<T, TResult>;
	selectColumns?: string;
	searchColumns?: (keyof TableRow<T>)[] | string[];
	defaultSort?: QueryState<T>["sort"];
	defaultPagination?: QueryState<T>["pagination"];
}

/**
 * Helper to fetch initial query filter data on the server for SSR hydration.
 */
export async function getQueryFilterData<
	T extends TableViewName,
	TResult = TableRow<T>[],
>(
	searchParams:
		| Promise<{ [key: string]: string | string[] | undefined }>
		| { [key: string]: string | string[] | undefined },
	table: T,
	options: GetServerQueryFilterOptions<T, TResult>
) {
	const sp = await searchParams;
	const filtersStr = typeof sp.filters === "string" ? sp.filters : undefined;
	const urlState = filtersStr
		? deserializeQuery<T>(new URLSearchParams(filtersStr))
		: {};

	const initialState: QueryState<T> = {
		name: options.name,
		sort: options.defaultSort ?? [
			{ field: "created_at" as any, direction: "desc" },
		],
		pagination: options.defaultPagination ?? { page: 1, pageSize: 12 },
		...urlState,
	};

	const fn =
		options.queryFn ??
		defaultQueryFn<T, TResult>(
			options.selectColumns,
			options.searchColumns as (keyof TableRow<T>)[] | undefined
		);

	// No Supabase project configured (missing credentials, or the inert
	// demo.invalid placeholder). Querying it would block until the request
	// timeout, adding ~10s to every catalog page for a result that cannot
	// exist. Return the empty shape instead and let the client hydrate it
	// once a real backend is configured.
	if (!isSupabaseServerConfigured) {
		return { data: null, count: null };
	}

	const supabase = await createClient();

	return (await fn(supabase, table, initialState, false)) as {
		data: TResult | null;
		count: number | null;
	};
}

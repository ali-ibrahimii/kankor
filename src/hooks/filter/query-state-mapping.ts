import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import type { TableRow, TableViewName } from "@/types/db.types";
import type { Filter, Pagination, QueryFn, Sort } from "./types";

type OperatorFn = (query: any, field: string, value: any) => any;

const operatorMap: Record<string, OperatorFn> = {
	eq: (q, f, v) => q.eq(f, v),
	neq: (q, f, v) => q.neq(f, v),
	gt: (q, f, v) => q.gt(f, v),
	gte: (q, f, v) => q.gte(f, v),
	lt: (q, f, v) => q.lt(f, v),
	lte: (q, f, v) => q.lte(f, v),
	"not.is": (q, f, v) => q.not(f, "is", v),

	like: (q, f, v) => q.like(f, `%${v}%`),
	ilike: (q, f, v) => q.ilike(f, `%${v}%`),

	in: (q, f, v) => q.in(f, v),
	is: (q, f, v) => q.is(f, v),

	contains: (q, f, v) => q.contains(f, v),
};

export function applySort<T extends TableViewName>(
	query: any,
	sort?: Sort<T>[]
) {
	if (!sort) return query;

	return sort?.reduce((q, sort) => {
		return q.order(sort.field as string, {
			ascending: sort.direction === "asc",
		});
	}, query);
}

function applyFilter<T extends TableViewName>(query: any, filter: Filter<T>) {
	const fn = operatorMap[filter.operator];

	if (!fn) {
		throw new Error(`Unsupported operator: ${filter.operator}`);
	}

	return fn(query, filter.field as string, filter.value);
}

export function applyPagination(query: any, pagination?: Pagination) {
	if (!pagination) return query;

	const from = (pagination.page - 1) * pagination.pageSize;
	const to = from + pagination.pageSize - 1;

	return query.range(from, to);
}

export function applySearch<T extends TableViewName>(
	query: any,
	search: string | undefined,
	columns: (keyof TableRow<T>)[]
) {
	if (!search) return query;

	const pattern = columns
		.map((col) => `${String(col)}.ilike.%${search}%`)
		.join(",");

	return query.or(pattern);
}

export function applyFilters<T extends TableViewName>(
	query: any,
	filters: Filter<T>[]
) {
	return filters.reduce((q, filter) => {
		return applyFilter(q, filter);
	}, query);
}

export function defaultQueryFn<T extends TableViewName, R = TableRow<T>[]>(
	selectColumns?: string,
	searchColumns?: (keyof TableRow<T>)[]
): QueryFn<T, R> {
	return async (client, table, state, single) => {
		let query = client.from(table as any).select(selectColumns ?? "*", {
			count: "exact",
		});

		// filters
		if (state?.filters?.length) {
			query = applyFilters(query, state?.filters);
		}

		// search
		if (state?.search && searchColumns?.length) {
			query = applySearch(query, state?.search, searchColumns);
		}

		// sort
		if (state?.sort) {
			query = applySort(query, state?.sort);
		}
		if (state?.limit) {
			query = query.limit(state.limit);
		}

		// pagination
		query = applyPagination(query, state?.pagination);

		return single
			? await query.single()
			: ((await query) as PostgrestSingleResponse<R>);
	};
}

/**
 * Wraps `defaultQueryFn` with filters that are ALWAYS applied, regardless of
 * what's in `state.filters` — i.e. not sourced from (or overridable through)
 * the nuqs-synced `filters` URL param. Use this for dashboard lists that must
 * be scoped to the current owner (e.g. `instructor_id`/`user_id`/`school_id`)
 * where RLS alone is too permissive (e.g. "anyone can read published
 * courses") to enforce that scope — a user editing the URL's `filters` query
 * param can't widen the result set beyond `fixedFilters`, since PostgREST ANDs
 * every filter on the same column together rather than letting a later one
 * override an earlier one.
 */
export function scopedQueryFn<T extends TableViewName, R = TableRow<T>[]>(
	selectColumns: string | undefined,
	searchColumns: (keyof TableRow<T>)[] | undefined,
	fixedFilters: Filter<T>[]
): QueryFn<T, R> {
	return (client, table, state, single) =>
		defaultQueryFn<T, R>(selectColumns, searchColumns)(
			client,
			table,
			{
				...state,
				filters: [...fixedFilters, ...(state?.filters ?? [])],
			},
			single
		);
}

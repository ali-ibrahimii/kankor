import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDebounce, useMemoizedFn } from "ahooks";

import { useQueryState } from "nuqs";
import { useEffect, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ColumnName, TableRow, TableViewName } from "@/types/db.types";
import { deserializeQuery, serializeQuery } from "./filter.utils";
import type {
	MutableInsert,
	MutableUpdate,
	UseQueryFiltersOptions,
} from "./hooks.types";
import { defaultQueryFn } from "./query-state-mapping";
import type { Filter, Pagination, QueryState, Sort } from "./types";

export function useQueryStateWithUrl<T extends TableViewName>(
	initialState: QueryState<T> = {}
) {
	// pseudo (nuqs)
	// Explicit type argument: with `TableViewName` now spanning tables *and*
	// views, letting nuqs infer its generic from `parse`'s return type made
	// TypeScript fall back to the plain-string overload (which rejects
	// `defaultValue`) instead of the parser overload.
	const [state, setState] = useQueryState<QueryState<T>>("filters", {
		defaultValue: initialState,
		parse: (value) => deserializeQuery(new URLSearchParams(value)),
		serialize: (state) => new URLSearchParams(serializeQuery(state)).toString(),
	});

	return [state, setState] as const;
}

export function useQueryUrl<T extends TableViewName>(
	state: QueryState<T> = {}
) {
	// URL-synced state
	const [urlState, setState] = useQueryStateWithUrl<T>(state);

	// --- state helpers ---
	const addFilter = useMemoizedFn((filter: Filter<T>) => {
		setState((prev) => {
			const newState = {
				...prev,
				filters: [...(prev.filters ?? []), filter],
			};
			if (newState.pagination) {
				newState.pagination.page = 1;
			}
			return newState;
		});
	});

	const setFilter = useMemoizedFn((filter: Filter<T>) => {
		setState((prev) => {
			const newState = {
				...prev,
				filters: [
					...(prev.filters?.filter((f) => f.field !== filter.field) ?? []),
					filter,
				],
			};

			if (newState.pagination) {
				newState.pagination.page = 1;
			}

			return newState;
		});
	});

	const removeFilter = useMemoizedFn(
		(field: ColumnName<T> | ColumnName<T>[]) => {
			const fields = Array.isArray(field) ? field : [field];

			setState((prev) => ({
				...prev,
				filters: prev.filters?.filter((f) => !fields.includes(f.field)),
			}));
		}
	);

	const removeFilterFromIndex = useMemoizedFn((index: number) => {
		setState((prev) => ({
			...prev,
			filters: prev.filters?.filter((_, i) => i !== index),
		}));
	});

	const removeSort = useMemoizedFn((index: number) => {
		setState((prev) => ({
			...prev,
			sort: prev.sort?.filter((_, i) => i !== index),
		}));
	});

	const setSort = useMemoizedFn((sort: Sort<T>) => {
		setState((prev) => {
			const newState = {
				...prev,
				sort: [
					...(prev.sort ?? []).filter((s) => s.field !== sort.field),
					sort,
				],
			};

			if (newState.pagination) {
				newState.pagination.page = 1;
			}

			return newState;
		});
	});

	const setPagination = useMemoizedFn(
		(pagination: Omit<Pagination, "pageSize"> & { pageSize?: number }) => {
			setState((prev) => ({
				...prev,
				pagination: {
					page: pagination.page,
					pageSize: pagination.pageSize || prev.pagination?.pageSize || 20,
				},
			}));
		}
	);

	const setSearch = useMemoizedFn((search: string) => {
		setState((prev) => {
			const newState = {
				...prev,
				search,
			};
			if (newState.pagination) {
				newState.pagination.page = 1;
			}

			return newState;
		});
	});

	const reset = useMemoizedFn(() => {
		setState(() => state);
	});

	useEffect(() => {
		if (urlState.name && state.name && urlState.name !== state.name) {
			reset();
		}
	}, [urlState.name, state.name, reset]);

	return {
		state: urlState,
		setState,
		addFilter,
		setFilter,
		removeFilter,
		removeFilterFromIndex,
		setSort,
		removeSort,
		setPagination,
		setSearch,
		reset,
	};
}

export function useQueryFilters<
	T extends TableViewName,
	TResult = TableRow<T>[],
>(options: UseQueryFiltersOptions<T, TResult>) {
	const {
		table,
		initialState = {
			name: table,
		},

		queryFn,
		selectColumns,
		searchColumns,

		enabled = true,
		staleTime,
		gcTime,
	} = options;

	const client = useMemo(
		() => options.client ?? createClient(),
		[options.client]
	);
	const initialStateRef = useRef(initialState);
	const queryClient = useQueryClient();

	const givenName = useMemo(
		() => initialStateRef.current.name || table,
		[table]
	);

	const defaultState = useMemo(
		() => ({ ...initialStateRef.current, name: givenName }),
		[givenName]
	);

	// URL-synced state
	const queryUrl = useQueryUrl<T>(defaultState);

	const debouncedSearch = useDebounce(queryUrl.state.search, { wait: 500 });

	const queryKey = useMemo(
		() => [table, { ...queryUrl.state, search: debouncedSearch }],
		[table, queryUrl.state, debouncedSearch]
	);

	// choose query function
	const finalQueryFn = useMemo(() => {
		return queryFn ?? defaultQueryFn<T, TResult>(selectColumns, searchColumns);
	}, [queryFn, selectColumns, searchColumns]);

	const queryResult = useQuery({
		queryKey,
		queryFn: () =>
			finalQueryFn(client, table, {
				...queryUrl.state,
				search: debouncedSearch,
			}),
		enabled,
		staleTime,
		gcTime,
		initialData: options.initialData,
		placeholderData: (prev) => prev,
	});

	const deleteAnItem = useMemoizedFn(async (id: string | number) => {
		const res = await client
			.from(table as any)
			.delete()
			.eq("id", id);
		queryClient.invalidateQueries({ queryKey: [table] });
		return res;
	});

	const updateAnItem = useMemoizedFn(
		async (id: string | number, data: MutableUpdate<T>) => {
			const res = await client
				.from(table as any)
				.update(data)
				.eq("id", id);
			queryClient.invalidateQueries({ queryKey: [table] });
			return res;
		}
	);

	const createAnItem = useMemoizedFn(async (data: MutableInsert<T>) => {
		const res = await client
			.from(table as any)
			.insert(data)
			.select()
			.single();
		queryClient.invalidateQueries({ queryKey: [table] });
		return res;
	});

	return {
		...queryResult,

		deleteAnItem,
		updateAnItem,
		createAnItem,

		...queryUrl,
	};
}

export type UseQueryFilters<
	T extends TableViewName,
	TResult = TableRow<T>[],
> = ReturnType<typeof useQueryFilters<T, TResult>>;

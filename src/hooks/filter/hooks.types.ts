import type { SupabaseClient } from "@supabase/supabase-js";
import type {
	Database,
	TablesInsert,
	TablesUpdate,
} from "@/lib/supabase/database.types";
import type { TableName, TableRow, TableViewName } from "@/types/db.types";
import type { QueryFn, QueryState } from "./types";

// `TablesInsert`/`TablesUpdate` are only defined for real tables — a view
// (e.g. `bookmark_details`) can't be inserted/updated directly, so those
// helpers resolve to `never` for it rather than failing to typecheck.
export type MutableInsert<T extends TableViewName> = T extends TableName
	? TablesInsert<T>
	: never;

export type MutableUpdate<T extends TableViewName> = T extends TableName
	? TablesUpdate<T>
	: never;

export type UseQueryFiltersOptions<
	T extends TableViewName,
	TResult = TableRow<T>[],
> = {
	table: T;
	client?: SupabaseClient<Database>;

	initialState?: Partial<QueryState<T>>;

	// override query behavior
	queryFn?: QueryFn<T, TResult>;

	// default builder config
	selectColumns?: string;
	searchColumns?: (keyof TableRow<T>)[];

	enabled?: boolean;
	staleTime?: number;
	gcTime?: number;
	initialData?: { data: TResult | null; count: number | null };
};

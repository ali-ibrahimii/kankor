import type {
	PostgrestSingleResponse,
	SupabaseClient,
} from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { ColumnName, TableRow, TableViewName } from "@/types/db.types";

export type BaseOperators = "eq" | "neq" | "in" | "is";

export type StringOperators = "like" | "ilike";

export type NumberOperators = "gt" | "gte" | "lt" | "lte";

export type DateOperators = NumberOperators;

export type ArrayOperators = "contains";

export type OperatorsForType<T> = T extends string
	? BaseOperators | StringOperators
	: T extends number
		? BaseOperators | NumberOperators
		: T extends boolean
			? BaseOperators
			: T extends unknown[]
				? BaseOperators | ArrayOperators
				: T extends null
					? BaseOperators
					: BaseOperators;

export type Filter<
	T extends TableViewName,
	K extends ColumnName<T> = ColumnName<T>,
> = {
	field: K;
	operator: OperatorsForType<TableRow<T>[K]>;
	value: TableRow<T>[K];
};

export type FilterStrict<T extends TableViewName> = {
	[K in ColumnName<T>]: {
		field: K;
		operator: OperatorsForType<TableRow<T>[K]>;
		value: TableRow<T>[K];
	};
}[ColumnName<T>];

export type Sort<T extends TableViewName> = {
	field: ColumnName<T>;
	direction: "asc" | "desc";
};

export type Pagination = {
	page: number;
	pageSize: number;
};

export type QueryState<T extends TableViewName> = {
	/**
	 * the name of this filter. This is used to prevent from using a wrong filter in a page.
	 */
	name?: string | T;
	filters?: Filter<T>[];
	sort?: Sort<T>[];
	pagination?: Pagination;
	limit?: number;
	search?: string;
};

export type FilterGroup<T extends TableViewName> =
	| {
			type: "and";
			filters: (Filter<T> | FilterGroup<T>)[];
	  }
	| {
			type: "or";
			filters: (Filter<T> | FilterGroup<T>)[];
	  };

export type QueryStateAdvanced<T extends TableViewName> = {
	where?: FilterGroup<T>;
	sort?: Sort<T>;
	pagination?: Pagination;
};

export type FieldMeta<T extends TableViewName> = {
	[K in ColumnName<T>]?: {
		label?: string;
		type?: "string" | "number" | "date" | "boolean";
		operators?: OperatorsForType<TableRow<T>[K]>[];
	};
};

export type RawFilter = {
	field: string;
	operator: string;
	value: unknown;
};

export type QueryBuilderInput<T extends TableViewName> = QueryState<T>;

export type QueryFn<T extends TableViewName, R = TableRow<T>[]> = (
	client: SupabaseClient<Database>,
	table: T,
	state?: QueryState<T>,
	single?: boolean
) => Promise<PostgrestSingleResponse<R>>;

import type { Database } from "@/lib/supabase/database.types";

export type TableName = keyof Database["public"]["Tables"];
export type ViewName = keyof Database["public"]["Views"];
export type TableViewName = TableName | ViewName;

export type TableRow<T extends TableViewName> =
	T extends keyof Database["public"]["Tables"]
		? Database["public"]["Tables"][T]["Row"]
		: T extends keyof Database["public"]["Views"]
			? Database["public"]["Views"][T]["Row"]
			: never;

export type ColumnName<T extends TableViewName> = keyof TableRow<T>;

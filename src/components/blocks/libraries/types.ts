import type { Tables } from "@/lib/supabase/database.types";

export type LibraryRelation = {
	id: string;
	name: string;
};

export type LibraryBook = Tables<"libraries"> & {
	books?: (LibraryRelation & { full_name?: string | null }) | null;
	categories?: (LibraryRelation & { slug?: string | null }) | null;
	grades?: LibraryRelation | null;
	subjects?: LibraryRelation | null;
};

export type LibraryFilterOption = {
	id: string;
	name: string;
};

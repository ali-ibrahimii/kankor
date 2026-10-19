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

export const BOOK_SELECT =
	"id, slug, title, desc, uri, file_path, book_id, category_id, grade_id, subject_id, created_at, updated_at, books ( id, name, full_name ), categories ( id, name, slug ), grades ( id, name ), subjects ( id, name )";

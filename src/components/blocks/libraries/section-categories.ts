/**
 * The student dashboard's Library sidebar splits books into three sections.
 * "fields" and "studies" map to real child categories under the "library"
 * parent category (id `13a4c038-4518-4096-820e-302d4c362201`); "more" is
 * everything else under that parent (mainly "generals", plus uncategorized
 * rows) — there's no dedicated category row for it.
 */
export type LibrarySection = "fields" | "studies" | "more";

export const FIELDS_CATEGORY_ID = "3fa6e782-7102-4823-8ae9-d31d1599f02d";
export const STUDIES_CATEGORY_ID = "48838524-7374-4331-8903-2cd954055d4b";

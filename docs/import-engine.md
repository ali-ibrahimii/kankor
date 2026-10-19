# Generic Data Import Engine

This document describes the reusable import engine that lets any page bulk-import
rows into any Supabase table through a single `<ImportDialog table="..." />`
component.

---

## 1. Goals

- **Generic**: the dialog only knows a table name. It has no knowledge of
  quizzes, schools, or any other domain concept.
- **Schema-driven**: destination columns, types, and required/optional status
  come from generated metadata, not hand-maintained config.
- **Multi-source**: CSV, Excel (`.xlsx`), Google Sheets (public link), and
  PDF tables (best-effort) all normalize into the same shape before mapping.
- **Extensible by composition**: adding a new import source or swapping the
  persistence layer means adding one file, not touching the dialog.

---

## 2. Flow

```
Upload  →  Map fields  →  Preview  →  Import
```

1. **Upload** — drag & drop, browse, or paste a Google Sheets URL. The
   matching parser (`parsers/`) turns the source into a normalized
   `ParsedFile` (`{ headers: string[], rows: ParsedRow[], warnings: string[] }`).
2. **Map fields** — destination columns come from the generated table schema.
   Source headers are auto-matched by name (`services/column-matcher.ts`);
   the user can override the mapping, ignore a column, or set a default value.
3. **Preview** — the first 10 rows are transformed and validated against the
   destination schema (`services/transformers.ts`, `services/row-mapper.ts`).
   Rows with validation issues are highlighted and are skipped (not blocked)
   on import.
4. **Import** — valid rows are inserted in batches through an injected
   `ImportTarget`. A batch that fails as a unit is retried row-by-row so one
   bad row doesn't sink the rest. The dialog reports a final
   inserted/skipped/failed summary.

---

## 3. Folder structure

```
scripts/
  generate-tables-metadata.js   # Task 1: database.types.ts -> generated schema metadata

src/lib/generated/
  table-schema.ts                # generated output (never hand-edit)

src/app/api/import/google-sheet/
  route.ts                       # server-side CSV proxy for public Google Sheets (avoids CORS)

src/features/import/
  types/            # ParsedFile, FieldMapping, PreviewRow, ImportRunSummary, ...
  parsers/          # csv.parser.ts, xlsx.parser.ts, pdf.parser.ts, google-sheets.parser.ts, index.ts (registry)
  services/         # column-matcher, transformers, row-mapper, import-target (+ Supabase implementation), import.actions (server action)
  hooks/            # use-table-schema, use-file-parser, use-column-mapping, use-import-preview, use-run-import
  components/
    import-dialog.tsx  # composes the four steps; the only "public" component
    steps/              # upload-step, mapping-step, preview-step, result-step
  index.ts          # public exports: ImportDialog, ImportTarget, ImportRunSummary

src/components/ui/
  stepper.tsx   # generic step indicator (no import-specific logic)
  dropzone.tsx  # generic drag & drop file picker (no import-specific logic)
```

This mirrors the project's existing `components/blocks/<feature>` convention:
`components/` own business logic, `hooks/` package reusable behavior, and the
two new `components/ui` primitives are pure and reusable outside this feature.

---

## 4. Regenerating the schema metadata

`src/lib/generated/table-schema.ts` is generated from
`src/lib/supabase/database.types.ts` — never hand-edit either file.

```bash
pnpm gen:table-schema     # regenerate metadata only
pnpm gen:types            # regenerate database.types.ts, then chains gen:table-schema automatically
```

The script (`scripts/generate-tables-metadata.js`) parses `database.types.ts`
with the TypeScript compiler API (not regex) and, for every table/view, emits
per-column:

- `type` — the raw TypeScript type text (e.g. `"string"`, `"number"`, an enum union)
- `dataType` — a normalized category (`string | number | boolean | json | enum | array | unknown`) used for auto-mapping, validation, and value coercion
- `nullable` — whether the Row type includes `| null`
- `optional` — whether the Insert type marks the column optional (`field?:`), i.e. it's nullable, has a DB default, or is generated
- `enumValues` — present when `dataType` is `"enum"`, resolved from the `Enums` section

## 5. Adding import support for another table

Nothing to build. Anywhere you already have a page with a table's data:

```tsx
import { ImportDialog } from "@/features/import";

<ImportDialog
  table="courses"
  open={open}
  onOpenChange={setOpen}
  onComplete={(summary) => {
    if (summary.insertedCount > 0) router.refresh();
  }}
/>
```

`table` is typed as `ImportableTableName` (generated from `TABLE_SCHEMA`), so
passing an unknown or misspelled table name is a compile error. If the table
you need isn't showing up, regenerate the schema (`pnpm gen:table-schema`) —
the generator only includes tables/views that actually have columns.

See `src/components/blocks/quiz-builder/quizzes-view.tsx` for a full example
(instructor and school quiz pages both render this same component and share
one Import button).

---

## 6. Extending the engine

### Add a new import source (e.g. JSON)

Implement `ImportSourceParser` (`src/features/import/types/source.types.ts`)
and register it in `src/features/import/parsers/index.ts`:

```ts
export const jsonParser: ImportSourceParser = {
  extensions: ["json"],
  mimeTypes: ["application/json"],
  async parse(file) {
    /* return { headers, rows, warnings } */
  },
};
```

Nothing else changes — `getParserForFile` and the upload step pick it up
automatically via `FILE_PARSERS`.

### Replace direct Supabase inserts with a future bulk API

The import step never calls Supabase directly. It depends on the
`ImportTarget` interface:

```ts
interface ImportTarget {
  insertBatch(table: string, rows: ImportableRow[]): Promise<ImportBatchOutcome>;
}
```

`supabaseImportTarget` (the default) inserts via a server action
(`services/import.actions.ts`), validating the table name against the
generated schema allowlist before touching the database. To swap in a
different bulk-import API later, implement `ImportTarget` and pass it in:

```tsx
<ImportDialog table="quizzes" importTarget={myQueueBasedImportTarget} ... />
```

---

## 7. Supported sources — notes and caveats

- **CSV** — parsed with `papaparse`. Headers are trimmed; malformed rows
  surface as warnings on the upload step.
- **Excel (`.xlsx`/`.xls`)** — parsed with `exceljs`. The first sheet's first
  row is treated as headers; fully empty rows are skipped.
- **Google Sheets** — the sheet must be shared as "Anyone with the link". The
  URL is proxied server-side (`/api/import/google-sheet`) to Google's CSV
  export endpoint and parsed with the same CSV parser (direct browser fetches
  are blocked by CORS).
- **PDF tables** — best-effort. Text is extracted with `pdfjs-dist` and
  reconstructed into rows/columns by clustering text position (Y for rows, X
  for columns using the header row's positions). Works well for simple, ruled
  tables; always double-check the mapping and preview before importing.

---

## 8. Tests

- Unit/integration (Vitest): parsers, column matching, value transforms/validation,
  row mapping, the schema generator, and a full upload → mapping → preview →
  import walkthrough of `ImportDialog` with a stub `ImportTarget`
  (`src/features/import/**/*.test.ts(x)`, `scripts/generate-tables-metadata.test.js`).
- E2E (Playwright): `e2e/import/import-quizzes.spec.ts` logs in as a seeded
  instructor, uploads a CSV through the real Import button on the instructor
  quizzes page, and walks the dialog to completion.

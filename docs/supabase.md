# Supabase Integration & Data Fetching

This document outlines the Supabase backend configuration, Client/Server client access, Row Level Security (RLS), and custom data-fetching hooks.

---

## 1. Supabase Clients

Depending on the context, choose the correct method to instantiate the Supabase client:

- **Client Components**: Use `createClient` from `@/lib/supabase/client` (runs on browser).
- **Server Components / Server Actions**: Use the server client options initialized via `@supabase/ssr` (e.g. `createClient` in server files).

---

## 2. Row Level Security (RLS)

All database tables have Row Level Security (RLS) enabled.
- **Rules**:
  1. Frontend code should never assume permissions.
  2. Database queries will automatically scope results to the authenticated user's organization, school, or role based on backend policy.
  3. Ensure database operations handle permission denials gracefully.

---

## 3. Data Fetching Hooks (React Query + URL Sync)

For client-side components, data fetching should be handled using React Query. The project provides two custom hooks:

### 1. `useSupabase` (Simple Fetching)
- **File**: `src/hooks/use-supabase.ts`
- **Use Case**: Simple fetching of records that does not require sorting, filtering, or pagination in the URL.
- **Example**:
  ```tsx
  import { useSupabase } from "@/hooks/use-supabase";
  
  export function DecksList() {
    const { data: decks, isLoading } = useSupabase({
      table: "decks",
      selectColumns: "id, name, description", // optional columns filter
    });
  
    if (isLoading) return <div>Loading...</div>;
    return (
      <ul>
        {decks?.map((d) => <li key={d.id}>{d.name}</li>)}
      </ul>
    );
  }
  ```

### 2. `useQueryFilters` (Complex Listing / URL Sync)
- **File**: `src/hooks/filter/filter.hooks.ts`
- **Use Case**: Paginated, sortable, filterable, or searchable listings.
- **Features**: Automatically synchronizes query state (filters, sorting, pagination, search term) into a URL query parameter named `filters` using `nuqs`. This preserves lists/views even after browser reload.
- **It also exports mutation helpers**: `createAnItem`, `updateAnItem`, `deleteAnItem` which automatically invalidate the query keys.
- **Example**:
  ```tsx
  import { useQueryFilters } from "@/hooks/filter/filter.hooks";
  
  export function CoursesTable() {
    const {
      data: courses,
      isLoading,
      state,               // current QueryState
      setSearch,           // debounce-handles search terms
      setPagination,       // controls pages/pageSize
      setFilter,           // adds field filters
      createAnItem,        // insert helper
      updateAnItem,        // update helper
      deleteAnItem,        // delete helper
    } = useQueryFilters({
      table: "courses",
      selectColumns: "id, title, grade_level",
      searchColumns: ["title"], // columns included in query searches
      initialState: {
        pagination: { page: 1, pageSize: 10 },
      },
    });
  
    return (
      <div>
        <input 
          placeholder="Search courses..." 
          defaultValue={state.search || ""} 
          onChange={(e) => setSearch(e.target.value)} 
        />
        
        {isLoading ? (
          <div>Loading courses...</div>
        ) : (
          <table>
            <tbody>
              {courses?.map((c) => (
                <tr key={c.id}>
                  <td>{c.title}</td>
                  <td>Grade {c.grade_level}</td>
                  <td>
                    <button onClick={() => deleteAnItem(c.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
  
        <button onClick={() => setPagination({ page: (state.pagination?.page || 1) + 1 })}>
          Next Page
        </button>
      </div>
    );
  }
  ```

---

## 4. Local Migrations & Typings

If you make database changes:
- **Migration scripts**: Save database modifications under `./supabase/migrations/` in SQL format.
- **Regenerate types**: After editing or applying migrations locally via the Supabase CLI, regenerate database definitions using:
  ```bash
  pnpm gen:types
  ```
  This command refreshes the file `src/lib/supabase/database.types.ts`, synchronizing your TypeScript interface with the database.

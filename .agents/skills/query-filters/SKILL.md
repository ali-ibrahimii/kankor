---
name: query-filters
description: "Use when fetching data from Supabase, rendering lists, tables, grids, search features, filtering, sorting, pagination, or using the custom hooks useQueryFilters or useSupabase."
---

# Query Filters & Data Fetching

This skill guides AI agents on standard client-side data fetching and synchronization with URL parameters in the Abzar Kankor codebase.

---

## 1. Simple Data Fetching (`useSupabase`)

For simple, non-paginated, non-filterable database queries:
- Hook: Use `useSupabase` from `@/hooks/use-supabase`.
- Under the Hood: Integrates React Query `useQuery` cache and the Supabase JS client.
- Signature:
  ```typescript
  export function useSupabase<T extends TableViewName, R = TableRow<T>[]>({
    table: T;
    selectColumns?: string;
    state?: QueryState<T>;
    searchColumns?: (keyof TableRow<T>)[];
    single?: boolean;
    staleTime?: number;
    gcTime?: number;
  })
  ```
- **Example Usage**:
  ```tsx
  import { useSupabase } from "@/hooks/use-supabase";

  export function BookList() {
    const { data: books, isLoading, error } = useSupabase({
      table: "books",
      selectColumns: "id, title, author, file_url",
    });

    if (isLoading) return <BookListSkeleton />;
    if (error) return <div>Failed to load books.</div>;

    return (
      <ul>
        {books?.map((book) => (
          <li key={book.id}>{book.title}</li>
        ))}
      </ul>
    );
  }
  ```

---

## 2. Advanced Listing, Sorting, Pagination, and Search (`useQueryFilters`)

For complex listing tables, dashboards, and searchable grids:
- **Hook**: Use `useQueryFilters` from `@/hooks/filter/filter.hooks`.
- **Under the Hood**: Uses `nuqs` (URL query state) and React Query to serialize parameters inside the `filters` URL search query string. Reloading preserves the current search, page, filters, and sort index.
- **Example Usage**:
  ```tsx
  import { useQueryFilters } from "@/hooks/filter/filter.hooks";

  export function CoursesDashboard() {
    const {
      data: courses,
      isLoading,
      state,               // current QueryState
      setSearch,           // input search handler (debounced automatically)
      setPagination,       // page controller
      setFilter,           // apply dynamic filters
      deleteAnItem,        // delete helper with auto cache invalidation
    } = useQueryFilters({
      table: "courses",
      selectColumns: "id, title, description, instructor_id",
      searchColumns: ["title", "description"],
      initialState: {
        pagination: { page: 1, pageSize: 12 },
      },
    });

    return (
      <div>
        <input
          placeholder="Search..."
          defaultValue={state.search || ""}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={() => setFilter({ field: "instructor_id", operator: "eq", value: "some-uuid" })}>
          Filter by Instructor
        </button>

        {isLoading ? (
          <CoursesGridSkeleton />
        ) : (
          <div>
            {courses?.map((course) => (
              <div key={course.id}>
                <h3>{course.title}</h3>
                <button onClick={() => deleteAnItem(course.id)}>Remove</button>
              </div>
            ))}
          </div>
        )}

        <button onClick={() => setPagination({ page: (state.pagination?.page || 1) + 1 })}>
          Next Page
        </button>
      </div>
    );
  }
  ```

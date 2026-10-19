# Abzar Kankor — Comprehensive User Flows

This document enumerates every major user journey in the Abzar Kankor web app, at a level of
detail suitable for manual QA and for writing Playwright E2E tests. Every flow lists the exact
route, the elements on the page (buttons, inputs, selects, dialogs, links), the actions a user
can take on them, validation rules, and the resulting state changes / navigations.

Routes below are given as locale-relative paths (the app always runs under a `[locale]` segment:
`/fa`, `/ps`, or `/en` — `fa`/`ps` render right-to-left). Route helpers referenced (`routes.x.y.page()`)
live in `src/lib/routes.ts` — use these in Playwright specs instead of hardcoded strings so tests
stay correct if paths change; regenerate with `pnpm gen:routes` if a route seems missing.

---

## 0. Conventions used throughout this document

- **Auth redirect-back**: Any page-level login gate appends `?next=<original-path>` to the login
  redirect. On successful login the app pushes `next` if present, otherwise the role's dashboard
  home (via `getDashboardPath()`). **This is inconsistently wired** — some CTAs (e.g. certain
  enroll buttons) redirect to login without setting `next`, dropping the user back at their
  dashboard instead of the page they came from. Treat `next`-preservation as a per-flow thing to
  verify, not a platform-wide guarantee.
- **Filter/sort/search/pagination state**: All catalog pages (`/courses`, `/decks`, `/libraries`,
  `/quizzes`, `/d/bookmarks`, dashboard equivalents) use a shared `useQueryFilters` hook (nuqs)
  that serializes **all** filter state into a single `?filters=` URL query value (not one query
  param per field). Do not assert on individual query params like `?search=` or `?page=` in tests
  — assert on rendered results or decode the `filters` blob. Multiple filter changes triggered
  synchronously in one handler (e.g. a "Clear All" button) are collapsed into a single `setState`
  call by convention — if a new filter control is added without following this pattern, earlier
  setters in the same handler get silently dropped (last write wins).
- **Delete confirmation is NOT uniform** across the app — four different patterns exist and each
  must be tested differently:
  1. Styled Radix `AlertDialog` (`role="alertdialog"`, Cancel/Delete buttons).
  2. Plain unstyled `Dialog` (`role="dialog"`) used for a few builder sub-entities.
  3. Native browser `window.confirm()` — requires a Playwright `page.on('dialog', ...)` handler;
     no DOM to assert on.
  4. **No confirmation at all** — many nested deletes (a single lesson, a single content block, a
     single classroom resource) delete instantly on icon-button click.
- **Credits/commerce model**: courses, decks, and quizzes each have `is_free` and `price_credits`.
  Non-free items go through a `purchase_item` RPC (course/deck) that debits the buyer's
  `credit_balance` and credits the seller (instructor/school). A `DiscountCodeField` widget
  (present on paid enroll/purchase dialogs) calls `validate_discount_code` RPC before purchase to
  reduce the price. Admins can also directly grant/charge credits to a student account.
- **Toast-only vs inline validation**: most auth/profile/dialog forms use TanStack Form with
  Zod `onBlur` validators and render inline `FieldError` text under the field. A minority of flows
  (flashcard answer rows, quiz question editors, several "New X" creation dialogs) validate only
  on submit and surface errors via a `sonner` toast instead of inline text — do not assume every
  form has an inline error assertion target.
- **Role routing guard**: `src/proxy.ts` → `updateSession()` in `src/lib/supabase/middleware.ts`
  guards every `/{locale}/d/*` and `/{locale}/auth/*` path: signed-out users hitting `/d/*` are
  redirected to login (with `next`); signed-in users hitting the wrong role's dashboard root are
  redirected to their own dashboard via `getDashboardPath()`.

---

## 1. Public Site

### 1.1 Home page — `/`
- Header: logo (→ home), primary nav links (Courses, Decks, Libraries, Quizzes, About), locale
  switcher (fa/ps/en), theme/RTL follows locale, **Login** button, **Sign Up** button (or, if
  signed in, an avatar/user menu with a **Dashboard** link and **Sign Out**).
- Hero section CTA buttons (e.g. "Browse Courses", "Start Learning") linking into the public
  catalogs.
- Feature/module preview sections (School, Flashcards, Tests, Library) each with a "View All" /
  "Explore" link into the corresponding public catalog.
- Footer: links to `/about`, `/privacy-policy`, `/terms-of-use`, `/delete-account`, social links,
  language switcher duplicate.
- **Test**: verify header/footer links resolve, locale switcher changes `[locale]` segment and
  flips `dir="rtl"`/`dir="ltr"` on `<html>`, signed-in vs signed-out header states.

### 1.2 About — `/about`
- Static content page. Verify it renders per-locale copy, no interactive elements beyond nav.

### 1.3 Search — `/search`
- Global search page/tabs across entity types (courses/decks/libraries/quizzes). Search input,
  per-tab result grids reusing each catalog's card components. Empty-state and loading-skeleton
  per tab.
- **Test**: type a query, assert results per tab; empty query / no-results state; switching tabs
  preserves the query.

### 1.4 Certificate verification — `/verify/[code]`
- Public, no-auth page. Displays a certificate lookup result (student name, course, completion
  date, "Valid" badge) or a "not found" state if `code` doesn't resolve via `verify_certificate`
  RPC.
- **Test**: valid code → certificate details render; invalid/garbage code → not-found state, no
  server error leaked.

### 1.5 Legal pages
- `/privacy-policy`, `/terms-of-use` — static content, linked from every auth form's footer
  ("By continuing you agree to the Terms and Privacy Policy" with inline links) and the site
  footer.
- `/delete-account` — account-deletion request page/flow (static instructions or a request form
  depending on current implementation — verify whether it's a form that emails the user or a
  document with instructions before scripting a destructive test against it).

### 1.6 Watch (external/shared video) — `/watch/u/[id]`
- Standalone video-watch page (outside the `/d` dashboard chrome), used for shareable/public
  lesson or preview links. Verify it renders a player and handles an invalid `id` gracefully
  (not-found, not a crash).

---

## 2. Authentication (`/auth/*`)

All auth pages share the same `Card` shell (title, subtitle, form, footer link to the sibling
auth page) plus a bottom "By continuing, you agree to the **Terms of Use** and **Privacy
Policy**" line with real links to `routes.termsOfUse.page()` / `routes.privacyPolicy.page()`.

### 2.1 Login — `/auth/login`
Fields/elements on `LoginForm`:
1. **"Continue with Google" button** (outline, full width, Google "G" icon) — calls
   `supabase.auth.signInWithOAuth({ provider: "google" })`, redirecting to
   `/api/auth/callback?next=<preserved next param>` if a `?next=` was present on the login page
   itself. Button shows a disabled/loading state (`googleLoading`) while the OAuth handshake
   starts.
2. Divider ("or").
3. **Email** text field (`type=email`, `autoComplete=email`) — `onBlur` Zod `z.email()` validator,
   inline error if invalid.
4. **Password** field (`type=password`, `autoComplete=current-password`) — `onBlur` required
   validator; its label row also contains a **"Forgot password?" link** that navigates to
   `/auth/forgot-password`, **pre-filling the `email` query param** with whatever the user has
   typed so far in the email field (only if non-empty).
5. Server-side error banner (`Alert variant="destructive"`) appears above the submit button if
   `loginAction` returns a generic error.
6. **Submit button** ("Log in") — disabled/loading while pending via TanStack Form's submit
   state.
7. Footer: "Don't have an account? **Sign up**" link → `/auth/signup`.

Behavior:
- On submit, calls `loginAction(values)` (server action). If it fails with
  `code === "email_not_confirmed"`, the form **redirects to `/auth/confirm-email?email=<email>`**
  instead of showing an inline error — test this branch explicitly (wrong-password vs
  unconfirmed-email are different UX paths).
- On any other error, shows the error string in the destructive `Alert` (no field-level error).
- On success: fetches the current user, computes `getDashboardPath(user, locale)`, and pushes
  `nextPath || dashPath` — i.e. if the page was reached via `?next=/some/path`, that takes
  priority over the role's default dashboard.
- An `errorCode`/`errorMsg` query param on page load (e.g. bounced back from an OAuth callback
  failure) triggers a `sonner` toast on mount (after a `setTimeout(..., 500)` — a fixed delay, not
  event-driven, so a Playwright wait for the toast should poll rather than assume immediate
  visibility).

### 2.2 Sign up — `/auth/signup?type=student|instructor|school`
`SignupForm` renders one of three variants based on the `type` query param (default `student`);
switching variant is also possible **client-side** via link/buttons without a full navigation.
- **Top-of-page "Register as" switcher**: buttons for the two account types *not* currently
  selected (e.g. on the student form, "Register as Instructor" / "Register as School" links) —
  desktop: absolutely positioned top corner; mobile: below the form. Clicking swaps the local
  `type` state (title/subtitle/submit label/success text all change) **without changing the URL**
  — note this for E2E: the `?type=` query param does not update when switching client-side.
- **Full name** text field — required, `autoComplete=name`.
- **Email** field — `z.email()` onBlur.
- **Province** — a searchable **Combobox** (`ComboboxField`) populated live from the `provinces`
  table (`select id, name order by name`), with a "clear" affordance (`showClear`) and an
  "No provinces found" empty state. Not validated as required in the schema shown.
- **School-only extra fields** (rendered only when `type === "school"`): **School name** and
  **School address** text fields, both required.
- **Password** field — `onBlur` validator requiring length ≥ 8 **and** at least one uppercase
  letter **and** at least one digit (regex `[A-Z]` + `[0-9]`); shows a role-specific password-hint
  description under the field.
- **Confirm password** field — re-validates on every `password` change (`onBlurListenTo`); shows
  "required" if empty, "passwords do not match" if it diverges from `password`.
- Server error `Alert` (translated via `t(serverError)` — the server action returns an i18n key,
  not raw text).
- **Submit button** — label varies by type (e.g. "Create Student Account").
- Footer: "Already have an account? **Log in**" link.
- **On success**: form is replaced entirely by a success `Card` ("Account created — verify your
  email") — no redirect. Test both the instructor/school/student variants' distinct success copy.
- **Test matrix**: submit each of the 3 `type` variants; verify school-only fields appear only for
  `type=school`; verify password strength rule (`Abc12345` passes, `abcdefgh` and `12345678`
  fail); verify confirm-password live mismatch/match toggling; verify duplicate-email server
  error surfaces as a translated string, not a raw error code.

### 2.3 Forgot password — `/auth/forgot-password?email=<prefilled>`
- Single **Email** field, prefilled from `?email=` if present (this is how the login page's
  "Forgot password?" link hands off the typed email).
- **Submit button** ("Send reset link") calls `forgotPasswordAction`.
- On success, the form is replaced by a success `Card` (generic "check your email" copy) — note
  this **does not confirm or deny whether the email exists** (standard enumeration-safe pattern);
  do not write a test asserting different behavior for known vs unknown emails at the UI layer.
- Footer link back to `/auth/login`.

### 2.4 Reset password — `/auth/reset-password`
(Reached via the emailed reset link, which authenticates a recovery session server-side before
this page renders — cannot be reached fresh without a valid recovery token/session.)
- **New password** field — same strength rule as signup (≥8 chars, 1 uppercase, 1 digit).
- **Confirm password** field.
- Client-side pre-submit check: if `password !== confirmPassword`, blocks submission and shows the
  mismatch error in the `Alert` (this duplicate check happens in `onSubmit`, in addition to the
  field-level validators).
- **Submit button is `disabled`** whenever `password` is empty or the two fields don't match
  (a `form.Subscribe`-gated disabled state, not just a validator) — Playwright should assert the
  button's `disabled` attribute directly rather than only click-and-check-for-error.
- On success: success `Card` with a "Go to Login" link; no auto-redirect.

### 2.5 Confirm email — `/auth/confirm-email?email=<prefilled>`
- Reached automatically from Login when `email_not_confirmed` is returned, or manually.
- Single **Email** field, prefilled from the query param.
- **Submit button** ("Resend confirmation email") calls `resendConfirmationEmailAction`.
- On success: success `Card`, generic "check your email" copy, no auto-redirect.
- Footer link back to `/auth/login`.

### 2.6 Cross-cutting auth test scenarios
- Deep-link to any `/d/*` route while signed out → redirected to `/auth/login?next=<that route>`;
  after successful login, lands back on the original route (verify this explicitly per role,
  since some CTAs elsewhere don't set `next` — see §0).
- Deep-link to `/d/instructor/*` as a signed-in **student** → redirected by the proxy guard to the
  student dashboard root, not a 403 page. Repeat for each role × each other role's dashboard root.
- Google OAuth button: verify redirect URL construction includes `next` when present (can be
  asserted via network/route interception rather than completing a real Google login in E2E).

---

## 3. Public Catalogs & Detail Pages

Four parallel catalog/detail pairs exist at the top level (signed-out accessible) and are mirrored
(mostly) inside the student dashboard. All catalogs share: a search input, filter controls, a sort
select, a responsive grid of cards with a loading-skeleton state and an empty state, and
pagination.

### 3.1 Courses catalog — `/courses`
- **Search** input (debounced, feeds the shared `filters` query state).
- **Filters** (`CourseFilters`): level toggle, language toggle, and — where enabled via `options`
  — Subject / Grade / Book **Select** dropdowns, where Book options cascade based on the selected
  Subject+Grade (changing Subject/Grade resets Book choices). Filter popover is scroll-capped
  for long option lists. A **"Clear all"** control removes every active filter/chip in one atomic
  update (see §0 nuqs-batching note).
- **Sort select** (`CourseSortSelect`): Newest / Oldest / Title (A–Z).
- **Course cards** (`CatalogCourseCard`): cover image, title, instructor name, level/language
  badges, price-or-"Free" badge, a **"View" button/link** → `/courses/[slug]`.
- **Pagination** control at the bottom (`CoursePagination`).
- Empty state when filters produce zero results; skeleton grid while loading.
- **Test**: apply each filter type individually and combined; verify the "published only" scope
  is enforced without appearing as a removable chip (it's baked into the query, not URL state);
  verify sort changes card order; verify pagination changes the visible page without losing
  active filters.

### 3.2 Course detail — `/courses/[slug]`
- Hero (`CourseHero`): cover image, title, instructor, description, level/language/price badges,
  and a primary CTA button whose label/behavior depends on auth + enrollment state:
  - Signed out → **"Enroll"/"Get Started"** button that redirects to login (verify whether `next`
    is preserved here — this is one of the flows flagged as possibly missing it).
  - Signed in, not enrolled, free course → enroll button calls `enroll_user_in_course` RPC
    directly, then redirects into the learning page.
  - Signed in, not enrolled, paid course → opens an **enroll/purchase dialog** with a
    **Discount code field** (validates via `validate_discount_code` RPC) and a **Confirm
    Purchase** button that calls `purchase_item`, debiting `credit_balance`; insufficient-credit
    state disables/blocks purchase with an inline message.
  - Signed in, already enrolled → button becomes **"Continue Learning" / "Resume"**, linking to
    `/d/my-courses/[slug]` (optionally with `?lesson=` pointing at the next pending lesson).
- **`BookmarkButton`** (heart/bookmark icon) — toggles a `bookmarks` row for this course;
  renders **nothing at all** (not disabled) when signed out — a Playwright selector should assert
  absence, not disabled state, for the signed-out case.
- **`CourseModuleList`**: collapsible accordion of modules → lessons, each lesson row showing
  type icon (video/text/audio/pdf/external), duration, and a lock icon for lessons gated behind
  enrollment (only previewable lessons are openable pre-enrollment).
- **Test matrix**: signed-out enroll redirect; signed-in free enroll; signed-in paid enroll with
  valid discount code; paid enroll with invalid/expired discount code (inline error, no charge);
  paid enroll with insufficient credits; already-enrolled state shows Resume, not Enroll;
  bookmark toggle on/off persists across reload.

### 3.3 Decks catalog — `/decks` and Deck detail — `/decks/[slug]`
Mirrors the courses flow structurally:
- Catalog: search, filters (subject/level, and a **"classmate"-visibility** filter chip — note
  this chip currently can never surface results for a signed-in user browsing decks owned by
  someone else, since the underlying query only matches `user_id = me OR visibility = public`;
  don't be surprised if selecting "classmate" always yields empty/near-empty results — that's a
  known gap, not a test bug), sort, cards, pagination.
- Detail page: `get_deck_details` RPC, `BookmarkButton` (`itemType="deck"`), enroll/purchase CTA
  identical in shape to courses (free → `enrollInDeck` action directly; paid → discount-code +
  `purchase_item` dialog), then redirect into `/d/decks/practice?deck=<id>` on enroll.
- Signed-out enroll → login redirect (verify `next` handling per §0).

### 3.4 Libraries catalog — `/libraries` and Library detail — `/libraries/[slug]`
- Catalog: search + category filters, cards, pagination. No enroll/purchase concept — libraries
  are documents/resources, not enrollable courses/decks.
- Detail (`LibraryDetailView`, shared between the public route and the dashboard `/d/library/[slug]`
  route): title, description, cover, a **download/open** action for the underlying file (may
  require `getAssetSignedUrl` for gated files), `BookmarkButton` (`itemType="library"`).

### 3.5 Quizzes catalog — `/quizzes` and Quiz detail — `/quizzes/[slug]`
- Catalog: same search/filter/sort/pagination/card pattern.
- Detail page (`get_quiz_details` RPC, **`revalidate = 86400`** — statically cached for a day,
  relevant if a test just changed quiz settings and expects to see them reflected immediately on
  the public page):
  - Back-to-list button/link, `BookmarkButton` (`itemType="quiz"`).
  - Info card: icon, title, description, optional **Instructions** block, and a badge row —
    time limit (if set), passing score % (if set), max attempts (if set), and either a **Free**
    badge or a **`priceCredits`** badge.
  - **`QuizDetailActions`** — the actual CTA area (register/start/purchase button; exact
    label/state depends on auth + registration/attempt history — verify signed-out → login
    redirect, signed-in free → register or start immediately, signed-in paid → discount-code +
    `purchase_item` dialog, and an already-attempted state respecting `max_attempts`).
  - The RPC **intentionally excludes** `entrance_code` and question content from this public
    payload (enforced server-side, not just hidden in the UI, per an explicit code comment) — a
    security-relevant invariant worth a regression test: confirm the network response for
    `get_quiz_details` never contains `entrance_code` or question bodies for a signed-out/non-owner
    caller.

### 3.6 Shared cross-catalog scenarios
- Bookmark toggle from any of the 4 detail pages → item appears in `/d/bookmarks` (student
  dashboard) with correct type/title/thumbnail resolved via the `bookmark_details` view.
- Non-ASCII (Persian/Dari/Pashto) slugs: detail pages defensively `decodeURIComponent` the slug
  param before querying — a slug containing Persian text should resolve reliably; this was a
  previously-flaky area (intermittent 404s on first load) that is now guarded, worth a
  regression test per entity type (course/deck/library/quiz) with a real Persian-titled fixture.

---

## 4. Student Dashboard (`/d`)

Auth-gated (redirects to `/auth/login?next=/d/...` if signed out); role-gated to `student`.
Shared chrome: `AppSidebar` with groups — Overview, Courses (collapsible: All Courses / My
Courses), Flashcards (collapsible: Practice / Decks / My Decks), Tests (collapsible: Kankor /
Subject / Quiz / Passed / Registered), Library (dropdown: Fields / Studies / More), Personal
(Notes, Bookmarks), plus a footer `NavUser` menu (avatar, name/email, **Wallet** link, **Sign
out**).

### 4.1 Overview — `/d`
- Summary cards / widgets from `get_student_dashboard_overview` RPC: enrolled courses count,
  active decks / due-cards count, recent activity, continue-learning shortcuts. Each widget's
  "View all" / "Continue" link should route via `routes.d.*` helpers — spot-check these actually
  land on the right page (the dashboard-architecture audit found some hardcoded `/d/...` strings
  had drifted from real routes in the past).

### 4.2 Courses
- **All Courses — `/d/courses`**: same `CourseFilters`/grid/pagination as the public catalog, but
  scoped `is_published=true` via a fixed query (not a removable filter chip). Card CTA → course
  detail at `/d/courses/[slug]` (dashboard-scoped detail, separate from the public `/courses/[slug]`
  route but functionally identical: `get_course_details`, enroll/purchase dialog, bookmark).
- **My Courses — `/d/my-courses`**: enrolled courses only (`enrollments ⋈ courses`), each card
  showing progress % and a **"Learn"** button → `/d/my-courses/[slug]`.
- **Learning page — `/d/my-courses/[slug]`**: `LessonSidebar` (collapsible module/lesson
  accordion; on mobile the sidebar slides in/out via a toggle button; on desktop it's always
  visible, with an RTL-specific off-canvas transform quirk worth a visual regression check in
  RTL locales) + `ContentPlayer` (renders video/text/audio/pdf/external content blocks depending
  on the active lesson's block types). `?lesson=<lesson_id>` query param can force a specific
  lesson; otherwise the page auto-resolves to the next pending (incomplete) lesson. A **"Mark
  complete" / "Next lesson"** action calls `complete_lesson_for_user` RPC then auto-advances to
  the next pending lesson. The legacy route `/d/courses/[slug]/learn/[lesson_id]` still exists and
  server-redirects into `/d/my-courses/[slug]?lesson=...` — test that old bookmarked/shared links
  still resolve.
- **Test matrix**: enroll from catalog → appears in My Courses; open Learn → lands on first
  incomplete lesson; complete a lesson → progress % increases, auto-advances; complete final
  lesson → enrollment reaches 100% and a certificate becomes claimable (see Certificates below).

### 4.3 Flashcards / Decks
- **Decks — `/d/decks`**: browse/enroll page (`listEnrollableDecks` action), same filter pattern
  as public decks catalog, plus the known "classmate" filter gap noted in §3.3. Each card has a
  **"Study"** action in the footer once enrolled (added specifically to support the practice
  entry point from this list).
- **My Decks — `/d/my-decks`**: read-only list of enrolled decks (`getActiveLearningDecks()`),
  mirrors My Courses. No edit affordance for students — practice happens on the dedicated
  Practice page.
- **Practice — `/d/decks/practice?deck=<deck_id>`**: the actual spaced-repetition study session.
  - Deck switcher (if multiple decks enrolled) — switching **navigates** (full server round-trip
    via the `?deck=` param) rather than client-swapping state, because the review queue is
    rebuilt server-side per deck.
  - Flashcard **question** display, a **"Show answer" / flip** action, then **grade buttons**:
    Again / Hard / Good / Easy (Anki-style), each showing a computed next-interval preview label
    before the user picks one. Grading calls `reviewCard` action (authoritative server-side
    scheduling per the deck's configured algorithm — FSRS-4.5, SM2, or Leitner).
  - Session queue ordering: learning cards → review cards → new cards (capped by the deck's
    daily new-card limit, editable via **"Daily limit"** control calling `updateDailyLimit`).
  - Empty-queue / "all done for today" end-of-session state.
  - **Test matrix**: grading "Again" re-queues the same card later in the same session (not just
    the next day); grading "Easy" on a new card sets a materially longer interval than "Hard";
    daily new-card limit actually caps how many *new* (never-seen) cards appear, independent of
    due reviews; switching deck via the selector triggers a full navigation (assert on URL change
    + queue reset, not just in-place state).

### 4.4 Tests
- **Passed — `/d/tests/passed`** and **Registered — `/d/tests/registered`**: read from
  `quiz_attempts` / `quiz_registrations` respectively. Note: as of last inspection nothing in the
  codebase writes to `quiz_attempts` (not even the instructor OMR grading pipeline), so **Passed
  Quizzes will legitimately always render empty** in the current build — don't treat an empty
  Passed list as a test failure; treat a *non-empty* one as a signal something changed upstream
  worth investigating.
- **Kankor / Subject / Quiz** sidebar entries (`/d/tests/kankor`, `/d/tests/subject`,
  `/d/tests/quiz`) are **known dead links (404 stubs)** — do not write passing E2E tests against
  them; if writing a regression test, assert the 404/stub state explicitly so a future real
  implementation is what breaks the test, not silence.

### 4.5 Library — `/d/library?section=fields|studies|more`
- Reuses the public `LibraryDetailView`/catalog components with a `fixedCategoryFilter` prop set
  per sidebar entry, mapping to real category UUIDs (`fields`, `studies`) or an "everything else
  under the library parent category, including null-category rows" catch-all (`more`). No
  section param / direct `/d/library` visit → unfiltered library catalog scoped to the dashboard
  chrome.
- Detail route: `/d/library/[slug]` — same `LibraryDetailView` as public, bookmark button
  included.
- **Test**: each sidebar sub-link (Fields/Studies/More) yields a disjoint, non-overlapping result
  set; a library row with `category_id IS NULL` appears under "More", not dropped entirely.

### 4.6 Personal — Bookmarks & Notes
- **Bookmarks — `/d/bookmarks`**: search input + an item-type **Select** filter (course / deck /
  library / quiz — the other 5 enum values are DB-only and never appear as bookmarkable in any
  UI, so don't expect them in this filter's option list). Grid of `BookmarkCard`s, each linking
  through to the underlying entity's detail page and offering a **remove-bookmark** action
  (toggling the same `BookmarkButton` used on detail pages).
- **Notes**: sidebar entry exists under "Personal" — verify current implementation state (route
  and functionality) directly against the sidebar config before scripting, as this module may be
  thinner than Bookmarks.

### 4.7 Wallet — `/d/wallet`
- Header: **credit balance** display (`user.credit_balance`, formatted as "N credits").
- `WalletView` tab set:
  - **Ledger** tab — chronological credit debits/credits (`getCreditLedger`).
  - **Purchases** tab — items the student has bought (`getPurchaseHistory`), each row showing
    item title/type, price paid, discount applied (if any), date.
  - **Sales** tab — only meaningfully populated for users who are also sellers (instructors);
    for a pure student account this tab should render an empty state, not an error.
- **Test**: after a paid enroll/purchase elsewhere in the app, the Ledger and Purchases tabs both
  reflect the new transaction and the header balance decreases by the correct (possibly
  discounted) amount.

### 4.8 Certificates
- Reached from a 100%-complete course (My Courses / learning page) via a **"Claim certificate"**
  action calling `claimCertificate`. Resulting certificate should be independently verifiable via
  the public `/verify/[code]` page (§1.4) — a good end-to-end chain to test: complete all lessons
  → claim certificate → copy its code → verify it on the public page signed out.

### 4.9 Profile / account settings
- No dedicated profile/settings page was found under `/d/(student)` at last inspection beyond
  what `NavUser`'s footer menu exposes (avatar/name/email display, Wallet link, Sign out) — if the
  user menu appears to promise "Settings" or "Profile", verify it actually resolves to a real page
  before writing a test against it; it may currently be a dead or missing link (an
  `updateProfile` server action exists in the codebase, but confirm it has a reachable UI entry
  point first).

---

## 5. Instructor Dashboard (`/d/instructor`)

Role-gated to `instructor`. Sidebar: Overview, Courses, Decks, Classrooms, Quizzes, Discounts,
Earnings.

### 5.1 Overview — `/d/instructor`
- `get_instructor_dashboard_overview` RPC-backed widgets: course/deck counts, enrolled-student
  totals, recent earnings, recent classroom activity.

### 5.2 Courses — `/d/instructor/courses`
- List of the instructor's own courses (`InstructorCourseCard` variant — shows publish
  status/toggle, enrolled-student count, edit affordance) + a **"New Course"** button opening
  `NewCourseDialog`.
- **New Course dialog**: Title, Subtitle, Description, Language select, Level select, Price
  (credits) field (with a Free toggle/zero-price convention) → **Create** button calls
  `createCourse` server action → navigates to `/d/instructor/courses/new/[course_id]` (the
  builder).
- **Course Builder — `/d/instructor/courses/new/[course_id]`** (`CourseBuilder`, wraps a Jotai
  provider):
  - Header: course title, **Save** (calls `saveCourseContent`), **Publish/Unpublish** toggle
    (calls `setCoursePublished`), and a **Preview** link out to the live detail page.
  - Left panel (`ModuleLessonTree`): drag-and-drop (`@dnd-kit`) sortable tree of Modules →
    Lessons. Each Module has an **"Add Lesson"** action and a context menu (rename/edit via
    `ModuleDetailDialog`, delete — instant, no confirm, per §0 pattern 4). Each Lesson row has a
    context menu (edit via `LessonDetailDialog` — title/type/previewable-toggle/mandatory-toggle/
    duration, delete instant-no-confirm) and opens that lesson's content in the center panel on
    click.
  - **Module Detail dialog**: title, description, start_page/end_page numeric fields (for
    PDF-range-style modules), Save/Cancel.
  - **Lesson Detail dialog**: title, content type, "previewable" toggle (lets non-enrolled users
    view it), "mandatory" toggle (counts toward completion), duration field.
  - Center panel (`ContentArea`): drag-and-drop sortable list of content blocks for the active
    lesson, an **"Add Block" dropdown** (video / text / audio / pdf / external — each opens a
    type-specific `BlockEditor` field set, e.g. a file/URL field for video, a rich-text area for
    text), and per-block delete.
  - **Test matrix**: create course → builder loads with zero modules (empty state with an
    "Add Module" CTA); add module → add lesson → add ≥2 content blocks → reorder via drag → Save
    → reload page → order persisted; toggle Publish → course now appears in public `/courses`
    catalog and dashboard "All Courses"; toggle Unpublish → disappears from both; delete a lesson
    → instantly removed, no confirmation dialog to handle in the test.

### 5.3 Decks — `/d/instructor/decks`
- List of owned decks + **"New Deck"** button → `NewDeckDialog` (name, description, visibility
  select [public/private/classmate], algorithm select [FSRS/SM2/Leitner] with algorithm-specific
  advanced fields appearing conditionally, daily new-card limit) → `createDeck` action → navigates
  to `/d/instructor/decks/[deck_id]/edit`.
- **Flashcard Builder — `/d/instructor/decks/[deck_id]/edit`**:
  - Header: deck name, a **"Deck settings"** action opening `DeckEditSheet` (slides from the
    trailing edge — right in LTR, left in RTL; re-verify this per-locale in visual tests) with
    the same fields as creation (name/description/visibility/algorithm/daily_limit) →
    `updateDeckDetails`.
  - Responsive card grid of flashcards, each `FlashcardCard` showing question, answer options
    (✓ correct / ✗ wrong marks), an optional fact/hint; **double-click** opens it for editing.
  - **"Add Flashcard"** button opens `FlashcardDialog`: Question field, dynamic **Answers** list
    (add/remove rows via a `useReducer`-backed control, each row a text field + a
    correct/incorrect toggle — must have ≥1 correct and ≥2 total answers to save, enforced via
    toast on submit rather than inline field errors per §0), optional Fact and Hint fields →
    Save calls `addFlashcardToDeck` (create) or `updateFlashcard` (edit) — **saves immediately**,
    no separate "publish" step (unlike the course builder's explicit Save).
  - Each `FlashcardCard` has a delete action behind a confirmation dialog (styled AlertDialog) →
    `deleteFlashcardFromDeck`.
  - **Test matrix**: create deck with each algorithm → verify the algorithm-specific fields shown
    differ per selection (FSRS/SM2/Leitner have distinct advanced-settings shapes); add a
    flashcard with only 1 answer total → blocked with a toast, not saved; add with 2 answers but
    0 marked correct → blocked; edit via double-click → changes persist without a page reload;
    delete flashcard → confirmation dialog must be handled (`getByRole('alertdialog')`), distinct
    from the course builder's instant no-confirm deletes.

### 5.4 Classrooms — `/d/instructor/classrooms`
- List of owned classrooms + **"New Classroom"** action (name, description, grade/subject
  association) → creates and navigates to the edit builder.
- **Classroom Builder — `/d/instructor/classrooms/[classroom_id]/edit`** (`ClassroomBuilder`,
  loaded via `loadClassroomBuilder`, data: classroom, members, resources, materials, folders,
  announcements):
  - **Roster/Members tab**: member list with role (owner/co-teacher/student), a **join code**
    display with a **"Regenerate join code"** button (`regenerateJoinCode` — invalidates the old
    code immediately, worth testing that a stale code stops working), per-member **role change**
    control (`updateMemberRole`) and **remove** action (`removeClassroomMember`).
  - **Resources tab**: add/remove file or link resources (`addClassroomResource` /
    `removeClassroomResource`); a **Materials** sub-area with a **publish/unpublish toggle** per
    material (`toggleMaterialPublished`) — unpublished materials should be invisible to students
    joined via the join code, worth a cross-role test.
  - **Folders**: resources can be organized into folders (`initialFolders`) — verify folder
    create/rename/delete and that moving a resource between folders persists.
  - **Announcements tab**: post/edit/delete announcements visible to classroom members.
  - **Test matrix**: create classroom → join code generated → a second (student) session joins
    via the code → appears in Roster; regenerate code → old code now rejected for a new join
    attempt; toggle a material unpublished → student member's classroom view no longer shows it;
    remove a member → they lose access to the classroom's materials.

### 5.5 Quizzes — `/d/instructor/quizzes`
- List (`QuizzesView`) sourced from: quizzes this instructor owns directly (`user_id` match, e.g.
  standalone OMR/print-only quizzes with no `lesson_id`) **union** quizzes attached to lessons in
  courses this instructor teaches. Each row: title, entrance code, time limit, max attempts,
  passing score, question count, shuffle-questions flag, linked lesson title (if any).
- **"New Quiz"** action → quiz editor, a **slide-over `Sheet`** (not a full page navigation) opened
  from the list — distinct from the Course/Flashcard builders which are full pages.
  - Quiz settings: title, description, instructions, time limit (minutes), passing score %, max
    attempts, shuffle-questions toggle, show-correct-answers-after select, visibility/free-vs-paid
    + price fields, optional lesson attachment.
  - Question editor within the same Sheet: add/edit/delete questions, each with option rows
    (drag-reorderable via `@dnd-kit`), correct-answer marking; validation here is
    **toast-only** (no inline per-field errors) — e.g. saving a question with zero options
    marked correct should toast an error and not persist.
- **Print & Scan (OMR) action** — a separate entry point per quiz (icon/button on the quiz row,
  distinct from opening the settings Sheet) leading to an OMR workflow with **Roster / Print /
  Scans / Results** tabs:
  - **Roster** — the set of students eligible to take the paper exam.
  - **Print** — generates printable OMR answer sheets (per-student, encoding identity + question
    key).
  - **Scans** — upload scanned/photographed answer sheets for processing.
  - **Results** — graded output once scans are processed, with a **lock/unlock** mechanism
    (locking presumably finalizes results against further edits/rescans).
  - Note: at last inspection, nothing in the OMR actions pipeline actually writes to the
    `quiz_attempts` table that the student-facing "Passed Quizzes" page reads from — so a fully
    graded OMR result may **not** surface on the student side even after "Results" shows scores.
    Treat this as a specific integration point to verify rather than assume works end-to-end; if
    it's since been wired up, this note is stale and the Passed-Quizzes empty-state claim in §4.4
    is too.
- **Test matrix**: create quiz via Sheet → appears in list; edit via Sheet re-opens with prior
  values populated; add question with all options unmarked-correct → toast blocks save; reorder
  options via drag → order persists on reopen; Print & Scan roster/print/scans/results tabs each
  load without error even with zero students/zero scans (empty states); lock a result set →
  further edits to that result are blocked/disabled.

### 5.6 Discounts — `/d/instructor/discounts`
- List of discount codes the instructor has created for their own items, a **"New Discount"**
  action (code string, percentage/fixed-amount, applicable-item picker via `listDiscountableItems`
  — courses/decks/quizzes this instructor owns, expiry date, usage-limit field), edit/delete per
  row.
- **Test**: create a code → use it on the corresponding public detail page's discount-code field
  during a paid enroll → price reduces correctly; use it past its expiry or usage limit → rejected
  with an inline error, no charge applied.

### 5.7 Earnings — `/d/instructor/earnings`
- `getSellerEarnings` — total credits earned, a sales table (item, buyer, date, credits, discount
  applied if any). Read-only reporting page; verify totals reconcile with the sum of visible sales
  rows and with the student-side "Purchases" ledger entries for the same transactions.

---

## 6. Admin Dashboard (`/d/admin`)

Role-gated to `admin` (super admin). Dark-navy sidebar theme override. Sidebar: Overview, Courses,
Decks, Libraries, Quizzes, Users (Instructors/Students), Schools, Grades, Provinces, Discounts.

### 6.1 Overview — `/d/admin`
- `get_platform_admin_overview` RPC widgets: platform-wide totals (users by role, courses, decks,
  libraries, quizzes, revenue/credits circulated), likely with recent-activity or
  pending-approval callouts — verify current widget set directly, this area evolves quickly.

### 6.2 Content management — Courses / Decks / Libraries / Quizzes
- `/d/admin/courses`, `/d/admin/decks`, `/d/admin/libraries`, `/d/admin/quizzes` — platform-wide
  lists (not scoped to a single owner), using `AdminCourseCard`/equivalent variants that expose
  moderation-style actions beyond what an instructor sees (e.g. force-unpublish, reassign
  owner, delete regardless of ownership).
- Detail/edit routes mirror the instructor builders: `/d/admin/decks/[deck_id]/edit` reuses the
  same `FlashcardBuilder` with `basePath="/d/admin"`; `/d/admin/courses/[slug]` and
  `/d/admin/libraries/[slug]` / `/d/admin/quizzes/[slug]` are admin-scoped detail/edit views —
  verify each actually passes admin `basePath` through correctly (this is the exact class of bug
  the school dashboard has — see §7) rather than assuming parity with instructor.
- **Test**: as admin, open any instructor's course/deck/quiz and confirm edit/moderate actions
  are available and persist; confirm a student/instructor account cannot reach these `/d/admin/*`
  routes at all (redirected by the role guard, not just UI-hidden).

### 6.3 Users — Instructors / Students
- `/d/admin/users/instructors` and `/d/admin/users/students` — searchable/filterable tables, each
  row linking to a detail page (`/d/admin/users/instructors/[user_id]`,
  `/d/admin/users/students/[user_id]`) showing profile info, owned/enrolled content, and
  admin-only actions — for students this plausibly includes **"Charge Credits"** /
  **grant credits** (per the credits model in §0) and account status controls; for instructors,
  approval/verification-style controls if the platform gates instructor accounts.
- **Test**: locate a known seeded student, adjust credit balance via the admin action, confirm the
  change reflects in that student's own `/d/wallet` balance/ledger.

### 6.4 Schools — `/d/admin/schools` and `/d/admin/schools/[school_id]`
- List of registered schools + detail page (staff roster, associated courses/decks, credit/earnings
  summary at the school level) — this is the admin-side view into the same data a school-role user
  sees at `/d/school/[school_id]` (§7).

### 6.5 Reference data — Grades / Provinces
- `/d/admin/grades` and `/d/admin/provinces` — CRUD tables for reference/lookup data (grade 10/11/12
  labels; the provinces list that feeds the signup form's Province combobox, §2.2). Verify a
  province added/renamed here shows up in the signup form's combobox options (they share the same
  `provinces` table).

### 6.6 Discounts — `/d/admin/discounts`
- Platform-wide discount code management (not scoped to one instructor), same field shape as
  §5.6 but with an owner/item picker spanning all instructors/schools.

---

## 7. School Dashboard (`/d/school/[school_id]`)

Role-gated to school staff, scoped to their own `school_id` (a school user hitting a different
`school_id` in the URL should be denied/redirected, not shown another school's data — explicitly
worth a security-relevant test). Sidebar: Overview, Courses, Decks, Quizzes, Discounts, Earnings —
notably **no Classrooms section**, unlike Instructor.

### 7.1 Overview — `/d/school/[school_id]`
- `get_school_dashboard_overview` RPC — school-scoped totals mirroring the instructor overview
  but aggregated across the school's staff/content rather than a single instructor.

### 7.2 Courses / Decks / Quizzes / Discounts / Earnings
- Structurally identical to the Instructor equivalents (§5.2, 5.3, 5.5, 5.6, 5.7), reusing the
  same builder components with `basePath` swapped to `/d/school/[school_id]`.
- **Known gap to verify before trusting this parity**: the course builder's "New Course" flow is
  wired per-basePath (`NewCourseDialog basePath="..."`) — a prior inspection found at least one
  spot in the school course-builder path where the base path was **hardcoded** rather than
  threaded through from the actual `school_id` route param, which would send a school user's
  "New Course" flow to the wrong builder URL (e.g. an instructor-shaped path instead of
  `/d/school/[school_id]/courses/new/[course_id]`). This may already be fixed — **test it
  explicitly** (create a course as a school user, assert the resulting builder URL contains the
  correct `school_id`) rather than assuming either the bug or its fix.
- **Test matrix**: repeat the full Course Builder, Flashcard Builder, Quiz editor, Discounts, and
  Earnings test matrices from §5 under a school-role session, substituting the school's base
  path; additionally confirm a school account cannot view or edit another school's
  `/d/school/[other_school_id]/...` content by directly navigating to it.

---

## 8. Cross-Cutting Regression Checklist

Use this as a quick pre-release smoke list, separate from the detailed per-flow matrices above.

1. **i18n/RTL**: switch locale to `fa` and `ps` on at least one page from each major section (auth,
   public catalog, each dashboard) — verify `dir="rtl"`, layout mirrors correctly (especially the
   Course Builder's left/center panels and the Flashcard Builder's `DeckEditSheet` slide
   direction), and no untranslated key strings (e.g. raw `courses.title` text) leak through.
2. **Auth redirect-back (`next`)**: systematically test every "requires login" entry point (course
   enroll, deck enroll, quiz register, bookmark button) signed-out → confirm which ones correctly
   return the user to the original page after login and which silently drop to the dashboard home
   instead; this is known to be inconsistent, so a full inventory is more valuable than assuming
   uniform behavior.
3. **Delete confirmation coverage**: for every delete action across the app, note which of the
   4 patterns in §0 it uses — build the Playwright helper accordingly per-flow rather than one
   generic "confirm delete" helper.
4. **Dead/stub links**: `/d/tests/kankor`, `/d/tests/subject`, `/d/tests/quiz` are known stubs;
   any student-dashboard "Notes" link and the account "Settings/Profile" entry should be verified
   for current existence before writing tests against them (§4.6, §4.9).
5. **Credits integrity**: for any paid purchase (course/deck/quiz), assert three things move
   together and reconcile: buyer's `credit_balance` decreases, buyer's Wallet → Purchases row
   appears, seller's Earnings/Sales row appears with the same (possibly discounted) amount.
6. **Role isolation**: a signed-in user of one role cannot reach another role's dashboard root or
   sub-routes (student → `/d/instructor/*`, instructor → `/d/admin/*`, one school's
   `school_id` → another school's `school_id`) — each should redirect via the proxy guard rather
   than 403 or, worse, silently render.
7. **Non-ASCII slugs**: create a course/deck/library/quiz with a Persian/Dari title and confirm its
   public detail page resolves on first load without a 404 (previously flaky area, §3.6).
8. **Filter state via `?filters=`**: for any catalog page, apply 2+ filters plus a sort plus a
   page number, then reload the URL directly — all state should rehydrate from the single
   `filters` query value.

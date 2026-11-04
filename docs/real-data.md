# Real Data Setup — Abzar Kankor

This guide covers how to point the app at a **real Supabase project** and load
real Afghan educational data: universities (دانشگاه‌ها), their faculties,
private schools (مکتب‌ها / لیسه‌ها), and the teacher accounts (استادان) that
publish Kankor-prep content.

---

## 1. The one thing you need first: a Supabase project

The app talks to Supabase for auth, data and file storage. You need a project
and its API keys.

| Where | What |
|---|---|
| Supabase → **Project Settings → API** | `Project URL` → `NEXT_PUBLIC_SUPABASE_URL` |
| Supabase → **Project Settings → API** | `anon` / `publishable` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Supabase → **Project Settings → API** | `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` |

> ⚠️ The `service_role` key bypasses Row Level Security. **Never** commit it
> and never expose it to the browser. It is only used by the seeding script
> (to create Auth users) and by server-side admin actions.

### Fill in `.env`

```bash
cp .env.example .env
```

Then edit `.env`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon / publishable key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
```

`.env` is already in `.gitignore` — it never gets committed.

---

## 2. Push the schema

The database schema lives in `supabase/migrations/`. It is a plain SQL
migration history, so it applies cleanly to a hosted project.

**Option A — Supabase CLI (recommended)**

```bash
# install once: npm i -g supabase
supabase login
supabase link --project-ref <project-ref>
pnpm push:db:production
```

**Option B — Dashboard SQL editor**

1. Open Supabase → **SQL Editor** → **New query**.
2. Open each file in `supabase/migrations/` **in filename order** (the
   timestamp prefix defines the order) and run it.

The migrations create: `profiles`, `schools`, `universities`, `faculties`,
`departments`, `provinces`, `courses`, `decks`, `quizzes`, `libraries`,
`agencies`, `classrooms`, the credit/purchase system, and all the RLS
policies.

### Then regenerate the TypeScript types

```bash
pnpm gen:types
```

This writes `src/lib/supabase/database.types.ts` so the app's types match your
database exactly.

---

## 3. Load the real reference data

The seed script is **idempotent** — running it twice never duplicates a row.

```bash
# reference data only: provinces, universities, faculties, schools
pnpm seed:real-data

# also create the teacher accounts (needs SUPABASE_SERVICE_ROLE_KEY)
pnpm seed:real-data:accounts
```

### What it creates

| Table | Content |
|---|---|
| `provinces` | The 34 Afghan provinces the reference data needs |
| `universities` | 33 real universities / institutes of higher education, each linked to its province |
| `faculties` | The 16 main faculties (گروه‌های آموزشی) |
| `universities_faculties` | Which faculties each university actually offers |
| `schools` | 10 real private high schools (لیسه عالیه …) with province + address |
| `profiles` | One instructor profile per seeded teacher (with `--accounts`) |

### Options

```bash
# only seed the English names for the teacher accounts
pnpm seed:real-data:accounts -- --locale=en

# only the Persian names
pnpm seed:real-data:accounts -- --locale=fa
```

### The seeded teacher accounts

Ten teachers whose material is well known for Kankor preparation — one per
subject area (ریاضی، فزیک، کیمیا، بیولوژی، علوم اجتماعی، شرعیات، ادبیات،
کمپیوتر ساینس، زراعت، انجنیری). Each gets:

- a Supabase Auth account (`email_confirm: true`, so no confirmation step),
- a `profiles` row with `role = 'instructor'` and `instructor_status = 'active'`,
- a display name and bio in **all three** locales (فارسی، پشتو، English).

Default password: `AbzarKankor!2026` — change it before going live:

```bash
# rotate one account's password (Supabase Dashboard → Authentication → Users)
```

---

## 4. Add your own teachers and schools

The seeded list is a starting point, not a limit. Two ways to add more:

### A. Through the app (recommended for real accounts)

Teachers and schools sign themselves up:

- **Teacher** → `/fa/auth/signup` → *Instructor*
- **School** → `/fa/auth/signup` → *School*

Both create a pending account that a super-admin approves from
`/fa/d/admin`. This is the normal path — it keeps email ownership with the
person and gives them control of their own password.

### B. Programmatically (for bulk imports)

Add the person to the `INSTRUCTORS` array in `scripts/seed-real-data.js` and
re-run with `--accounts`:

```js
{
  email: "your.teacher@example.com",
  password: "a-strong-password",
  province: "کابل",
  names: { fa: "استاد ...", ps: "پوهن ...", en: "..." },
  bios: { fa: "...", ps: "...", en: "..." },
  subjects: ["ریاضی", "فزیک"],
}
```

The script is idempotent, so re-running only adds what is missing.

---

## 5. Adding content for a teacher

Once a teacher has an account, sign in as them and create content in the
instructor dashboard (`/fa/d/instructor`):

- **Courses** (`/fa/d/instructor/courses`) — video lessons, modules, quizzes.
- **Decks** (`/fa/d/instructor/decks`) — Leitner flashcard decks.
- **Quizzes** (`/fa/d/instructor/quizzes`) — topic-based practice tests.

Media (video, PDF, audio) is stored in Cloudflare R2. Configure it in `.env`:

```dotenv
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
```

See `docs/cloudflare-images.md` for the bucket CORS setup and the public
image host.

---

## 6. Bulk-importing existing content

The admin panels and quiz builder have a spreadsheet importer
(CSV / XLSX / PDF). It is available at:

- `/fa/d/admin/libraries` — import books
- the quiz builder — import questions

It parses the file in the browser, lets you map columns, previews the result,
and writes it through a server action. No database credentials are needed in
the browser for this.

---

## 7. Verifying the setup

```bash
# 1. the app boots and the schema matches
pnpm gen:types

# 2. the build passes
pnpm build

# 3. the tests pass
pnpm test

# 4. the site responds
pnpm dev
curl -I http://localhost:3000/fa
```

To confirm the app is really talking to your database, sign in with one of the
seeded instructor accounts and check that the instructor dashboard lists its
courses (empty on a fresh project).

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Pages hang for ~10s | Supabase URL is a placeholder or unreachable | Check `NEXT_PUBLIC_SUPABASE_URL`; the app now fails fast instead of hanging |
| `permission denied for table …` | Schema not pushed, or RLS needs a session | `pnpm push:db:production`, then sign in |
| Seeded teachers can't sign in | `SUPABASE_SERVICE_ROLE_KEY` missing | Add it to `.env` and re-run `pnpm seed:real-data:accounts` |
| `duplicate key` during seeding | Should not happen — the seed is idempotent | The script upserts on `id`; report it as a bug |
| Uploads fail | R2 not configured | Fill in the `R2_*` vars and check the bucket CORS rules |

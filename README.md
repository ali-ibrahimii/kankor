# Abzar Kankor

An offline-first educational mobile application for students in Afghanistan, providing comprehensive learning tools including video courses, spaced repetition flashcards, mock exams, and a digital library.

## About

Abzar Kankor is designed to support students throughout their academic journey, from grade-level coursework to university entrance exam preparation. The application operates seamlessly offline, ensuring access to educational content even in areas with limited connectivity.

### Core Modules

1. **School**: Video-based courses aligned with Afghanistan's school curriculum, including PDF presentations and note-taking
2. **Flashcards**: Spaced repetition learning system (Leitner System) with 13,000+ flashcards from school textbooks
3. **Tests**: Practice exams including Mock Kankor tests (university entrance exam simulation) and book-based tests
4. **Library**: Digital library with categorized educational books and resources

## Tech Stack

- **Next.js**: frontend development framework
- **Supabase**: Backend services and authentication
- **ShadCN UI**: UI kit
- **Tailwindcss**: Tailwind CSS 

---

## AI Agents Guidelines

If you are an AI agent working in this workspace, you **must** read and follow the onboarding guide:
- Workspace rules and coding constraints are defined in [.agents/AGENTS.md](file:///Volumes/Projects/abzarkankor/web/.agents/AGENTS.md).
- Reference architecture, naming conventions, coding standards, and component guidelines are detailed in the [docs/](file:///Volumes/Projects/abzarkankor/web/docs/) directory. Read them in the specified order before implementing changes.

---

## Get started

1. Install dependencies

   ```bash
   pnpm install
   ```

2. Configure the environment

   ```bash
   cp .env.example .env
   # fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
   ```

3. Push the database schema

   ```bash
   pnpm push:db:production
   pnpm gen:types
   ```

4. Load real reference data (universities, faculties, schools, teachers)

   ```bash
   pnpm seed:real-data            # reference data
   pnpm seed:real-data:accounts   # + teacher accounts (needs the service-role key)
   ```

   Full walkthrough — including how to add your own teachers and schools — is in
   **[docs/real-data.md](docs/real-data.md)**.

5. Start the app

   ```bash
   pnpm dev
   ```

The app boots without Supabase credentials too: the public site and the
isolated `/demo` dashboard run against local placeholder data, and every
server-side query fails fast instead of hanging.

### Install a package

```bash
pnpm add <package-name>
```

---

## Performance

Landing-page first-load JS is held under 2 MB. Heavy libraries (ExcelJS,
Lexical, pdf.js) are loaded lazily only when a user actually opens the feature
that needs them — see [docs/performance.md](docs/performance.md) for the bundle
budget and the rules to keep it that way.
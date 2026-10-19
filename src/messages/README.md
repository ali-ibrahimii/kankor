# Translation messages

This folder contains the UI copy loaded by `next-intl`. Keep the three locale files in sync:

- `fa.json` — Persian / Dari (default locale)
- `ps.json` — Pashto
- `en.json` — English

## Finding and editing text

Messages are grouped by feature namespace at the top level. For example, public landing-page copy is in `landing`, course UI in `courses`, flashcards in `decks`, and public teacher/school profile copy in `publicProfile`. The catalog hero copy is grouped under `catalogHeroes` by catalog type; the roadmap lives in `roadmap`.

Nested objects mirror the UI: `landing.header.courses` is the public navigation label for Courses, and `courses.detail.visitInstructor` is the call-to-action on the course detail page. When adding a message, add the same key in **all three** locale files. Use the existing locale's writing system and keep interpolation placeholders (for example `{name}`) identical across translations.

## Formatting and validation

Keep JSON valid and use tabs for indentation. The project formatter can validate these files with:

```sh
pnpm exec biome check src/messages
```

Avoid moving or renaming a namespace unless all code references and all locale files are updated together.

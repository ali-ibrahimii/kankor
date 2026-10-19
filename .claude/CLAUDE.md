# Abzar Kankor: Agent Configuration

Welcome agent! Before doing any work, you **must** read the onboarding files in order:
1. **Root Agent Rules**: [AGENTS.md](file:///Volumes/Projects/abzarkankor/web/AGENTS.md)
2. **Project Documentation**: Follow files in the `./docs/` folder in order starting with `project-overview.md`.

---

## Developer Commands

### Development Server
- Start dev server: `pnpm dev`
- Build production version: `pnpm build`

### Quality Control (Format & Lint)
- Run lint/format check & autoturns: `pnpm check`
- Format code: `pnpm format`
- Type compilation check: `pnpm check:type`
- Run all checks: `pnpm verify`

### Testing
- Run Vitest unit & integration tests: `pnpm test`
- Run unit tests in watch mode: `pnpm test:watch`
- Run Playwright E2E tests: `pnpm test:e2e`
- Run Playwright E2E interactive UI: `pnpm test:e2e:ui`

### Database & Helpers
- Generate typescript database types: `pnpm gen:types`
- Regenerate router paths: `pnpm gen:routes`

---


<!-- intent-skills:start -->
## Skill Loading

Before editing files for a substantial task:
- Run `pnpm dlx @tanstack/intent@latest list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `pnpm dlx @tanstack/intent@latest load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->


## Other References:
@./.agents/AGENTS.md
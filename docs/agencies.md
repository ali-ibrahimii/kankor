# Agencies Module — Concept

> Status: **Phases 1–3 implemented** (migrations `20260718000000_agencies_module.sql`, `20260719000000_agency_moderation.sql`, `20260720000000_agency_content.sql`; `/d/admin/agencies`, `/d/agency/[agency_id]`, `src/components/blocks/agencies/`). Decisions confirmed with product owner on 2026-07-13.
>
> Phase 2 notes: agencies can only reverse their *own* suspensions (super-admin suspensions are untouchable); suspension reason + issuing agency are stored on the target (`suspended_by_agency_id` / `instructor_suspended_by_agency_id`); `schools.manage` currently covers whitelisted detail edits via `agency_update_school` — school *membership* management is deferred.
>
> Phase 3 notes: content rows carry a nullable `agency_id`; the creating member stays on `instructor_id`/`user_id` for provenance but sales attribution follows `agency_id` first (new `seller_type` value `'agency'`, `purchases.seller_agency_id`). RESTRICTIVE RLS policies stop anyone from stamping an `agency_id` they don't hold `*.manage_own` for. `*.manage_any` grants allow editing/deleting any content, optionally entity-scoped. Agency revenue share on sales follows the same earnings model as instructors/schools.

Agencies are third-party organizations across Afghanistan that operate on the platform with **strictly defined, deny-by-default permissions**. An agency can only do what a super admin has explicitly granted it — nothing else.

---

## 1. Confirmed Decisions

| Decision | Choice |
|---|---|
| Agency shape | Organization with multiple members (mirrors `school_members` pattern) |
| Permission model | Platform-defined permission catalog; super admin grants a subset per agency; deny by default |
| Scoping | Grants can carry a scope (province / explicit entity list / global) |
| Money flow | **Postpaid**: agency collects cash from students (1 credit = 1 AFN), charges their account; platform tracks total charged as agency liability; agency settles by transferring cash to Abzar Kankor |
| Commission | Platform-paid commission rate per agency, applied against charged volume |

---

## 2. Data Model

### `agencies`
- `id`, `name`, `slug`, `province`, contact fields
- `status`: `active | suspended` — suspension freezes ALL agency actions instantly
- `commission_rate` (numeric, e.g. 0.05)
- `liability_limit` (**required**, not null) — max outstanding unsettled balance; charging blocked when exceeded (caps platform risk). Mandatory for every agency.
- `created_by`, timestamps

### `agency_members`
- `agency_id`, `user_id`, `role: owner | admin | staff`, `status: active | disabled`
- Same shape as `school_members`. Owner/admin manage members; staff only act within grants.
- A user's dashboard access is driven by membership (like school staff), not a new `profiles.role`.

### `agency_grants`
- `agency_id`, `permission` (from catalog below), `scope_type: global | province | entities`, `scope` (jsonb: province code or entity id list), `granted_by`, `granted_at`
- Only super admins can insert/update/delete. **No row = no permission.**

### Permission catalog (initial)
| Permission | Allows |
|---|---|
| `students.charge` | Top up a student account by email. Does **not** include reading student lists or profiles. |
| `schools.suspend` | Suspend/reactivate school accounts (within scope) |
| `instructors.suspend` | Suspend/reactivate instructor accounts (within scope) |
| `schools.manage` | Edit school details, manage school membership (within scope) |
| `courses.manage_own` | Create/edit/publish courses owned by the agency |
| `decks.manage_own` | Same, for flashcard decks |
| `quizzes.manage_own` | Same, for quizzes |
| `courses.manage_any` / `decks.manage_any` / `quizzes.manage_any` | Edit platform/others' resources — separate, higher-trust grants |

Catalog is a Postgres enum/check — adding a capability is a deliberate migration, never ad-hoc.

---

## 3. Money Flow (Postpaid + Settlement)

### Charging a student
RPC `agency_charge_student(student_email, amount_afn)` (SECURITY DEFINER):
1. Verify caller is an **active member** of an **active agency** holding `students.charge`.
2. Verify `outstanding_liability + amount ≤ liability_limit` (if set).
3. Look up student by email; if found, credit their wallet via the existing credit-transaction machinery.
4. Insert an `agency_topups` row: `agency_id`, `member_id` (the actual employee — per-person accountability), `student_id`, `amount`, timestamp.
5. Return only a masked confirmation (e.g. student first name + masked email) — never profile data.

### Liability & settlement
- **Outstanding liability** = Σ topups − Σ settlements (per agency). Visible to both super admin and the agency.
- `agency_settlements`: `agency_id`, `gross_amount`, `commission_amount`, `net_received`, `method` (bank/hawala/cash), `recorded_by` (super admin only), `period`, note.
- Commission applied at settlement: agency owes `charged_volume × (1 − commission_rate)`; both figures stored explicitly on the settlement row.
- **Cadence**: per agency, weekly or monthly — never longer than monthly.
- Reversals/refunds of a top-up: **super admin only**, recorded as compensating ledger entries — agencies can never claw credits back.

### Disputes
Students can dispute a top-up ("I paid 500, got 300"). Disputes go to **both the super admin and the agency**: the agency sees and responds to disputes against its own transactions; the super admin resolves them (against the audit log), with any correction applied as a super-admin ledger adjustment.

### Content sales
When agency-owned courses/decks/quizzes sell, the agency earns revenue share under the **same earnings model as other content creators** (instructors, schools) — separate from the top-up commission.

---

## 4. Enforcement Model (deny by default)

- **No broad table access.** Agency members get RLS read access only to their own agency's rows (`agencies`, `agency_members`, `agency_topups`, `agency_settlements`, `agency_grants` for their agency). Everything else they touch goes through **SECURITY DEFINER RPCs**.
- Every RPC starts with one shared check: `agency_has_permission(auth.uid(), permission, target)` →
  agency `active` **and** member `active` **and** grant exists **and** target is inside the grant's scope. Fail any → error, nothing happens.
- `students.charge` deliberately grants no SELECT on `profiles` — the email-lookup happens inside the RPC (matches the requirement: charge by email, no student list).
- Suspend actions (`schools.suspend`, `instructors.suspend`) set a status with `suspended_by_agency_id` + reason; super admin can always override/reverse.
- Agency-owned resources: `agency_id` ownership column on courses/decks/quizzes; `*.manage_own` RLS policies scope writes to `agency_id = member's agency`.

## 5. Audit

`agency_audit_log` — append-only (no UPDATE/DELETE policies for anyone but service role):
`actor_user_id`, `agency_id`, `permission_used`, `action`, `target_type`, `target_id`, `payload` (jsonb), `created_at`.

Every agency RPC writes a row. Super admin gets a filterable viewer; agencies see their own log (transparency + dispute resolution for cash handling).

---

## 6. Dashboards

**Super admin (`/admin/agencies`)**: agency CRUD + suspend; member management; grant editor (catalog checkboxes + scope picker); liability dashboard (charged / settled / outstanding / vs limit per agency); record settlements; dispute queue (resolve/adjust); audit log viewer.

**Agency (`/agency`)**: membership-gated like the school dashboard. Nav items render only for held grants:
- Charge student (email + amount form, prints/receipts confirmation)
- Transactions & outstanding balance, settlement history, commission earned
- Aggregate stats overview: students charged (count), charged volume over time, commission totals, resource sales — scoped strictly to the agency's own activity
- Disputes against the agency's transactions (view + respond)
- Managed schools/instructors (scoped list + suspend controls) — if granted
- Resources (courses/decks/quizzes) — if granted
- Members (owner/admin only)

---

## 7. Phasing

1. **Phase 1 — Core + money**: `agencies`, `agency_members`, `agency_grants`, `agency_topups`, `agency_settlements`, audit log, `agency_charge_student` RPC, admin agency management, minimal agency dashboard. (The #1 use case: cash top-ups.)
2. **Phase 2 — Moderation**: scoped `schools.*` / `instructors.suspend` grants + UI.
3. **Phase 3 — Content**: agency-owned courses/decks/quizzes with `manage_own` (and later `manage_any`).


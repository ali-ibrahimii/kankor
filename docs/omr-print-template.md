# OMR Print-Sheet Template Geometry

**Authoritative source**: `src/lib/omr/template-geometry.ts` in this repo. The
numbers below are a verbatim mirror of that file, for teams (e.g. the Python
OMR service) that can't import it directly. If the two ever disagree, the
TypeScript file wins — but they must never be allowed to drift; update both
in the same change.

This is the exact, deterministic layout used to render every printed answer
sheet (`src/app/api/omr/print/route.ts`, via `pdf-lib`). Same
`template_version` → byte-identical bubble/fiducial/QR coordinates, regardless
of student name length, question count changes elsewhere, etc. — nothing on
this page reflows based on content.

## Page

- Size: **A4 portrait**, 595.28 × 841.89 pt (1 pt = 1/72 in).
- All coordinates below are given as **points from the top-left of the page**
  ("from-top" convention) for readability. To get a `pdf-lib` y-coordinate
  (bottom-left origin): `y_pdf = 841.89 - y_fromTop`.
- Margin: 36 pt on all sides (content should not be placed inside this margin
  except the fiducials, which intentionally sit partly within it).

## Fiducial markers (perspective/alignment correction)

Four solid black squares, **20 × 20 pt**, one in each corner, used by the OMR
service to detect and correct perspective/rotation from a phone photo before
reading bubbles.

Each square's outer corner is inset **14 pt** from the page edge:

| Corner | Top-left of square (from-top x, y) | pdf-lib bottom-left (x, y) |
|---|---|---|
| Top-left | (14, 14) | (14.00, 807.89) |
| Top-right | (561.28, 14) | (561.28, 807.89) |
| Bottom-left | (14, 807.89) | (14.00, 14.00) |
| Bottom-right | (561.28, 807.89) | (561.28, 14.00) |

(`pdf-lib`'s `drawRectangle(x, y, width, height)` takes the **bottom-left**
corner of the rectangle — use the third column directly, width=height=20.)

## QR code

**80 × 80 pt**, encoding the variant's UUID (`quiz_variants.id`) as a plain
string (no URL wrapper, no extra metadata — just the raw UUID). Positioned
top-right, inset 40 pt from the top and right edges:

- Top-left of QR (from-top): (475.28, 40)
- pdf-lib bottom-left: (475.28, 721.89)

This intentionally does not overlap the top-right fiducial (6 pt clearance
horizontally, well clear vertically).

## Header block (top 100 pt)

All header text is left-aligned at x = 36 (the left margin), except the page
indicator which aligns under the QR code.

| Element | Baseline (from-top y) | Font size | Content |
|---|---|---|---|
| Quiz title | 50 | 14 (bold) | `quizzes.title` |
| Sheet id | 68 | 9 | `Sheet: {first 8 chars of variant_id}-v{template_version}` |
| Student name | 86 | 11 | `Name: {student full_name}` |
| Page indicator (only if the sheet spans >1 page) | 128, x = 475.28 | 8 | `Page {p} of {total}` |

A horizontal divider rule spans the full content width (x = 36 to x = 559.28)
at from-top y = 100, marking the end of the header block.

## Question/bubble grid

- Grid starts at from-top y = 115.
- Each question occupies a **24 pt row band**.
- **27 rows per page** (`ROWS_PER_PAGE`). Quizzes with more than 27 questions
  continue onto additional pages — same fiducials, same QR (same
  `variant_id`), with the page indicator shown. Question *N* (1-indexed
  within the variant's shuffled `question_order`) lands on:
  - `page = floor((N-1) / 27) + 1`
  - `rowOnPage = ((N-1) mod 27) + 1`
- Row number label: x = 45, font size 11, vertically centered in the row
  band (baseline = row center + ~4 pt, matching normal font baseline offset).
- Row center (from-top) for `rowOnPage` r (1-indexed): `115 + (r-1)*24 + 12`.
- Four bubbles per row, options **A, B, C, D** in that fixed left-to-right
  order (this order is `question_options.order_index` 0,1,2,3 — the OMR
  service's `detected_option_index` must use this same 0-indexed mapping).
  Bubble diameter 14 pt (radius 7). Center x per option:

  | Option | Center x (pt) |
  |---|---|
  | A (index 0) | 110 |
  | B (index 1) | 150 |
  | C (index 2) | 190 |
  | D (index 3) | 230 |

  Bubble center y = row center (from-top), converted to pdf-lib the usual way.
  A small option-letter label (font size 7) is printed 9 pt above each bubble
  center, horizontally centered on the bubble.

- Last row on a full page ends at from-top y = 115 + 27×24 = 763, i.e.
  pdf-lib y = 78.89 — comfortably clear (≈45 pt) of the bottom fiducials'
  top edge (pdf-lib y = 34).

## What is intentionally *not* on this sheet

The bubble sheet contains **no question text** — only row numbers and empty
bubbles — so that geometry never depends on content length. Students need a
separately-provided question booklet, printed/displayed in the *same*
per-variant shuffled order, with matching row numbers. **Generating that
booklet is not part of this task** — flagging it here since a bubble sheet is
not usable in isolation without one.

## Worked example

Row 5 of page 1, option C:
- Row center from-top = 115 + (5-1)×24 + 12 = 223 → pdf-lib y = 841.89 - 223 = 618.89
- Option C center x = 190
- Bubble center (pdf-lib): (190, 618.89), radius 7

/**
 * Single source of truth for the OMR bubble-sheet print template geometry.
 *
 * These constants are mirrored, verbatim, in docs/omr-print-template.md for
 * the external Python OMR service team. If you change a value here, update
 * that doc in the same change — the two must never drift, since the Python
 * service locates fiducials/QR/bubbles using these exact numbers.
 *
 * Coordinate system: PDF points (1/72 inch), pdf-lib's bottom-left origin
 * (y increases upward). All "fromTop" constants below are distances down
 * from the top edge of the page, in points, converted to pdf-lib y via
 * `pageHeight - fromTop`.
 */

export const PAGE_WIDTH_PT = 595.28; // A4 portrait
export const PAGE_HEIGHT_PT = 841.89;

export const MARGIN_PT = 36;

export const FIDUCIAL_SIZE_PT = 20;
/** Distance from each page edge to the outer corner of each fiducial square. */
export const FIDUCIAL_INSET_PT = 14;

export const QR_SIZE_PT = 80;
/** Distance from the top and right page edges to the QR code. */
export const QR_INSET_PT = 40;

export const HEADER_TITLE_BASELINE_FROM_TOP = 50;
export const HEADER_TITLE_FONT_SIZE = 14;

export const HEADER_SHEET_ID_BASELINE_FROM_TOP = 68;
export const HEADER_SHEET_ID_FONT_SIZE = 9;

export const HEADER_STUDENT_NAME_BASELINE_FROM_TOP = 86;
export const HEADER_STUDENT_NAME_FONT_SIZE = 11;

export const HEADER_DIVIDER_FROM_TOP = 100;

export const PAGE_INDICATOR_BASELINE_FROM_TOP = 128;
export const PAGE_INDICATOR_FONT_SIZE = 8;

export const GRID_START_FROM_TOP = 115;
export const ROW_HEIGHT_PT = 24;
export const ROWS_PER_PAGE = 27;

export const ROW_NUMBER_X_PT = 45;
export const ROW_NUMBER_FONT_SIZE = 11;

export const BUBBLE_DIAMETER_PT = 14;
export const BUBBLE_RADIUS_PT = BUBBLE_DIAMETER_PT / 2;
/** Bubble center x-coordinates for options A, B, C, D, in that order. */
export const BUBBLE_X_PT: readonly [number, number, number, number] = [
	110, 150, 190, 230,
];
export const BUBBLE_LETTER_FONT_SIZE = 7;
/** Vertical offset (points, upward) from a row's center to the option-letter baseline. */
export const BUBBLE_LETTER_OFFSET_PT = 9;

export function fromTop(y: number): number {
	return PAGE_HEIGHT_PT - y;
}

export const FIDUCIAL_POSITIONS_PDF = {
	topLeft: {
		x: FIDUCIAL_INSET_PT,
		y: fromTop(FIDUCIAL_INSET_PT + FIDUCIAL_SIZE_PT),
	},
	topRight: {
		x: PAGE_WIDTH_PT - FIDUCIAL_INSET_PT - FIDUCIAL_SIZE_PT,
		y: fromTop(FIDUCIAL_INSET_PT + FIDUCIAL_SIZE_PT),
	},
	bottomLeft: { x: FIDUCIAL_INSET_PT, y: FIDUCIAL_INSET_PT },
	bottomRight: {
		x: PAGE_WIDTH_PT - FIDUCIAL_INSET_PT - FIDUCIAL_SIZE_PT,
		y: FIDUCIAL_INSET_PT,
	},
} as const;

export const QR_POSITION_PDF = {
	x: PAGE_WIDTH_PT - QR_INSET_PT - QR_SIZE_PT,
	y: fromTop(QR_INSET_PT + QR_SIZE_PT),
} as const;

/** Row center, in "from top" coordinates, for the given 1-indexed row-on-page (1..ROWS_PER_PAGE). */
export function rowCenterFromTop(rowOnPage: number): number {
	return (
		GRID_START_FROM_TOP + (rowOnPage - 1) * ROW_HEIGHT_PT + ROW_HEIGHT_PT / 2
	);
}

/** Row center, in pdf-lib (bottom-left origin) y coordinates. */
export function rowCenterPdfY(rowOnPage: number): number {
	return fromTop(rowCenterFromTop(rowOnPage));
}

/** How many pages a sheet with `questionCount` questions requires. */
export function pageCountForQuestions(questionCount: number): number {
	return Math.max(1, Math.ceil(questionCount / ROWS_PER_PAGE));
}

/** 1-indexed absolute question number (1..N) -> { page (1-indexed), rowOnPage (1..ROWS_PER_PAGE) }. */
export function locateQuestion(absoluteIndex1Based: number): {
	page: number;
	rowOnPage: number;
} {
	const zero = absoluteIndex1Based - 1;
	const page = Math.floor(zero / ROWS_PER_PAGE) + 1;
	const rowOnPage = (zero % ROWS_PER_PAGE) + 1;
	return { page, rowOnPage };
}

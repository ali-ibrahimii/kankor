import type {
	ImportSourceParser,
	ParsedCellValue,
	ParsedFile,
} from "../types/source.types";

export interface PositionedText {
	text: string;
	x: number;
	y: number;
}

const ROW_TOLERANCE_PX = 4;

export const pdfParser: ImportSourceParser = {
	extensions: ["pdf"],
	mimeTypes: ["application/pdf"],
	async parse(file) {
		// Dynamically imported so the (fairly large) pdf.js bundle is only
		// downloaded when a user actually picks a PDF file.
		const pdfjs = await import("pdfjs-dist");
		pdfjs.GlobalWorkerOptions.workerSrc = new URL(
			"pdfjs-dist/build/pdf.worker.min.mjs",
			import.meta.url
		).toString();

		const buffer = await file.arrayBuffer();
		const document = await pdfjs.getDocument({ data: buffer }).promise;

		const items: PositionedText[] = [];
		for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
			const page = await document.getPage(pageNumber);
			const content = await page.getTextContent();
			for (const item of content.items) {
				if (!("str" in item)) continue;
				const text = item.str.trim();
				if (!text) continue;
				items.push({ text, x: item.transform[4], y: item.transform[5] });
			}
		}

		if (items.length === 0) {
			return {
				headers: [],
				rows: [],
				warnings: ["No extractable text was found in this PDF."],
			};
		}

		return reconstructTable(items);
	},
};

/**
 * Best-effort reconstruction of a tabular structure from positioned text:
 * cluster items into rows by Y coordinate, then bucket each row's items into
 * the columns implied by the header row's X coordinates.
 *
 * This works well for simple, ruled tables and degrades gracefully (extra or
 * misaligned columns) for anything more complex — hence "best effort".
 */
export function reconstructTable(items: PositionedText[]): ParsedFile {
	const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);

	const rowGroups: PositionedText[][] = [];
	for (const item of sorted) {
		const currentRow = rowGroups.at(-1);
		if (currentRow && Math.abs(currentRow[0].y - item.y) <= ROW_TOLERANCE_PX) {
			currentRow.push(item);
		} else {
			rowGroups.push([item]);
		}
	}
	for (const row of rowGroups) row.sort((a, b) => a.x - b.x);

	const [headerItems, ...bodyRowGroups] = rowGroups;
	const columnXs = headerItems.map((item) => item.x);

	const headers = bucketRow(headerItems, columnXs).map((value, index) =>
		value != null ? String(value) : `Column ${index + 1}`
	);

	const rows = bodyRowGroups.map((group) => {
		const values = bucketRow(group, columnXs);
		const record: Record<string, ParsedCellValue> = {};
		headers.forEach((header, index) => {
			record[header] = values[index] ?? null;
		});
		return record;
	});

	return {
		headers,
		rows,
		warnings: [
			"PDF table extraction is best-effort (based on text position) — double-check the mapping and preview before importing.",
		],
	};
}

function bucketRow(
	items: PositionedText[],
	columnXs: number[]
): ParsedCellValue[] {
	const buckets: string[][] = columnXs.map(() => []);

	for (const item of items) {
		let nearestIndex = 0;
		let nearestDistance = Number.POSITIVE_INFINITY;
		columnXs.forEach((x, index) => {
			const distance = Math.abs(x - item.x);
			if (distance < nearestDistance) {
				nearestDistance = distance;
				nearestIndex = index;
			}
		});
		buckets[nearestIndex].push(item.text);
	}

	return buckets.map((cell) => (cell.length > 0 ? cell.join(" ") : null));
}

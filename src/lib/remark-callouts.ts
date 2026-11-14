/**
 * remark plugin: styled callouts («نکته مهم») from marked blockquotes.
 *
 * A blockquote whose first text starts with a bracketed marker becomes a
 * callout of the matching type, and the marker turns into a bold label:
 *
 *   > [نکته مهم] این بخش را حتماً بخوانید
 *   → <blockquote class="callout callout-important">
 *       <p><strong>نکته مهم: </strong>این بخش را حتماً بخوانید</p>
 *
 * Marker → type: `[!important]`, `[important]`, `[مهم]`, `[نکته مهم]`,
 * `[مهمه نکته]` → important; `[!warning]`, `[caution]`, `[اخطار]`, `[هشدار]`
 * → warning; `[!note]`, `[توجه]`, `[یادداشت]` → note; `[!tip]`, `[نکته]` →
 * tip. Any other marker becomes a generic "note" callout labeled verbatim.
 */

/** Minimal mdast node shape — enough for the transform. */
type MdastNode = {
	type: string;
	value?: string;
	children?: MdastNode[];
	data?: {
		hProperties?: Record<string, unknown>;
		[key: string]: unknown;
	};
};

const TYPE_BY_MARKER: Record<string, string> = {
	"!important": "important",
	important: "important",
	"نکته مهم": "important",
	مهم: "important",
	"مهمه نکته": "important",
	"!warning": "warning",
	warning: "warning",
	caution: "warning",
	اخطار: "warning",
	هشدار: "warning",
	"!note": "note",
	note: "note",
	توجه: "note",
	یادداشت: "note",
	"!tip": "tip",
	tip: "tip",
	نکته: "tip",
};

function markerLabel(raw: string): string {
	const trimmed = raw.trim().replace(/^!/, "").trim();
	// Capitalize latin labels ("important" → "Important"); Persian labels are
	// used verbatim.
	if (/^[\x20-\x7E]+$/.test(trimmed)) {
		return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
	}
	return trimmed;
}

function transformCallout(blockquote: MdastNode): void {
	const first = blockquote.children?.[0];
	if (!first || first.type !== "paragraph") return;

	const textNode = first.children?.[0];
	if (
		!textNode ||
		textNode.type !== "text" ||
		typeof textNode.value !== "string"
	) {
		return;
	}

	const match = /^\s*\[([^\]]+)\]\s*/.exec(textNode.value);
	if (!match?.[1]) return;

	const marker = match[1];
	const type = TYPE_BY_MARKER[marker.trim().toLowerCase()] ?? "note";
	const label = markerLabel(marker);

	// Strip the marker from the text node; drop a leading soft-break after it
	// so "> [نکته مهم]\n> متن" keeps "متن" on the label line.
	const rest = textNode.value.slice(match[0].length);
	const tail = first.children?.slice(1) ?? [];
	if (tail[0]?.type === "break") tail.shift();

	const labelSuffix = rest || tail.length > 0 ? ": " : ":";
	const labelNode: MdastNode = {
		type: "strong",
		children: [{ type: "text", value: label + labelSuffix }],
	};

	first.children = rest
		? [labelNode, { type: "text", value: rest }, ...tail]
		: [labelNode, ...tail];

	blockquote.data = {
		...blockquote.data,
		hProperties: {
			...blockquote.data?.hProperties,
			className: ["callout", `callout-${type}`],
		},
	};
}

function walk(node: MdastNode): void {
	if (node.type === "blockquote") transformCallout(node);
	for (const child of node.children ?? []) walk(child);
}

/** remark plugin entry point. */
export function remarkCallouts() {
	return (tree: MdastNode) => walk(tree);
}

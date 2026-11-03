/**
 * Serialises structured data for a `<script type="application/ld+json">` tag.
 *
 * `JSON.stringify` alone is not safe inside an HTML `<script>`: a value that
 * contains `</script>` closes the tag early, and anything after it is parsed as
 * markup — stored XSS from a user-supplied course/deck/library title.
 *
 * Escaping `<`, `>` and `&` as JSON unicode escapes keeps the payload valid JSON
 * for crawlers while making it impossible to terminate the script element.
 * U+2028/U+2029 are escaped too because they are line terminators in JS.
 */
export function safeJsonLd(data: unknown): string {
	return JSON.stringify(data)
		.replace(/</g, "\\u003c")
		.replace(/>/g, "\\u003e")
		.replace(/&/g, "\\u0026")
		.replace(/\u2028/g, "\\u2028")
		.replace(/\u2029/g, "\\u2029");
}

/** Props for the JSON-LD `<script>` tags: `<script {...jsonLdProps(data)} />`. */
export function jsonLdProps(data: unknown): {
	type: "application/ld+json";
	dangerouslySetInnerHTML: { __html: string };
} {
	return {
		type: "application/ld+json",
		dangerouslySetInnerHTML: { __html: safeJsonLd(data) },
	};
}

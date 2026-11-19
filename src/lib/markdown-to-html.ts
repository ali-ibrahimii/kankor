import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { rehypeCodeBlocks } from "./rehype-code-blocks";
import { remarkCallouts } from "./remark-callouts";

/**
 * Sanitizer schema: the default one plus:
 * - `class` on blockquotes restricted to callout classes added by
 *   {@link remarkCallouts}.
 * - `class` on `code` restricted to `language-*` markers from fenced blocks so
 *   {@link rehypeCodeBlocks} can determine the block kind (`code` vs `text`)
 *   and apply syntax highlighting after untrusted markup is stripped.
 */
const sanitizeSchema = {
	...defaultSchema,
	attributes: {
		...defaultSchema.attributes,
		blockquote: [
			...((defaultSchema.attributes?.blockquote ?? []) as Array<
				string | [string, RegExp]
			>),
			["className", /^callout(-[a-z]+)?$/] as [string, RegExp],
		],
		code: [
			...((defaultSchema.attributes?.code ?? []) as Array<
				string | [string, RegExp]
			>),
			["className", /^language-[\w#+-]+$/] as [string, RegExp],
		],
	},
};

/**
 * Renders instructor-authored markdown to sanitized HTML.
 *
 * Supports the full course-authoring kit: headings, bold/italic, ordered and
 * unordered lists, task lists, tables (GFM), typed code & plain-text/tree
 * blocks with syntax highlighting and copy controls, links, blockquotes,
 * «نکته مهم» callouts (see remark-callouts), and single-newline line breaks
 * (so pasted plain-text keeps its line structure).
 */
export async function markdownToHTML(markdown: string) {
	const file = await unified()
		.use(remarkParse) // markdown → mdast
		.use(remarkGfm) // tables, task lists, strikethrough, autolinks
		.use(remarkBreaks) // single newlines → <br> (plain-text friendly)
		.use(remarkCallouts) // > [نکته مهم] … → styled callout blockquotes
		.use(remarkRehype) // mdast → hast
		.use(rehypeSanitize, sanitizeSchema) // drop anything unsafe first
		.use(rehypeCodeBlocks) // wrap <pre><code> with typed header, copy & tokens
		.use(rehypeStringify) // hast → HTML string
		.process(markdown);
	return file;
}

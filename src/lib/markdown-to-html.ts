import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

export async function markdownToHTML(markdown: string) {
	const file = await unified()
		.use(remarkParse) // Convert into markdown AST
		.use(remarkRehype) // Transform to HTML AST
		.use(rehypeSanitize) // Sanitize HTML input
		.use(rehypeStringify) // Convert AST into serialized HTML
		.process(markdown);
	return file;
}

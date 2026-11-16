import { describe, expect, it } from "vitest";
import { markdownToHTML } from "@/lib/markdown-to-html";

async function render(markdown: string): Promise<string> {
	return String(await markdownToHTML(markdown));
}

describe("markdownToHTML — course authoring kit", () => {
	it("renders GFM tables with header and body rows", async () => {
		const html = await render(
			[
				"| فصل | موضوع |",
				"| --- | --- |",
				"| ۱ | HTML مقدماتی |",
				"| ۲ | CSS |",
			].join("\n")
		);
		expect(html).toContain("<table>");
		expect(html).toContain("<th>فصل</th>");
		expect(html).toContain("<td>۱</td>");
		expect(html).toContain("<td>HTML مقدماتی</td>");
	});

	it("renders ordered and unordered lists", async () => {
		const html = await render("1. اول\n2. دوم\n\n- الف\n- ب");
		expect(html).toContain("<ol>");
		expect(html).toContain("<li>اول</li>");
		expect(html).toContain("<ul>");
		expect(html).toContain("<li>الف</li>");
	});

	it("renders task lists and strikethrough", async () => {
		const html = await render("- [x] انجام شد\n- [ ] باقی‌مانده\n\n~~قدیمی~~");
		expect(html).toContain('type="checkbox"');
		expect(html).toContain("<del>قدیمی</del>");
	});

	it("renders code blocks and inline code", async () => {
		const html = await render("```js\nconst a = 1;\n```\n\nمتن `کد` داخلی");
		expect(html).toContain("<pre>");
		expect(html).toContain("const a = 1;");
		expect(html).toContain("<code>کد</code>");
	});

	it("keeps single newlines as line breaks and blank lines as paragraphs", async () => {
		const html = await render("خط اول\nخط دوم\n\nپاراگراف دوم");
		expect(html).toContain("<br>");
		// Two paragraphs exactly — the old whitespace-pre-line double-spacing
		// bug came from newline characters between blocks becoming visible.
		expect(html.match(/<p>/g)?.length).toBe(2);
	});
});

describe("markdownToHTML — نکته مهم callouts", () => {
	it("turns a Persian marker into a styled callout with a bold label", async () => {
		const html = await render("> [نکته مهم] این بخش را حتماً بخوانید");
		expect(html).toContain('class="callout callout-important"');
		expect(html).toContain("<strong>نکته مهم: </strong>");
		expect(html).toContain("این بخش را حتماً بخوانید");
		// The raw marker must not leak into the rendered text.
		expect(html).not.toContain("[نکته مهم]");
	});

	it("supports GitHub-style markers and maps them to callout types", async () => {
		expect(await render("> [!warning] stop")).toContain("callout-warning");
		expect(await render("> [!note] info")).toContain("callout-note");
		expect(await render("> [!tip] hint")).toContain("callout-tip");
		expect(await render("> [!important] now")).toContain("callout-important");
	});

	it("labels unknown markers verbatim as a generic note", async () => {
		const html = await render("> [یادآوری] فردا امتحان داریم");
		expect(html).toContain("callout-note");
		expect(html).toContain("<strong>یادآوری: </strong>");
	});

	it("keeps plain blockquotes unchanged", async () => {
		const html = await render("> فقط یک نقل‌قول");
		expect(html).toContain("<blockquote>");
		expect(html).not.toContain("callout");
	});

	it("handles a marker on its own line followed by body lines", async () => {
		const html = await render("> [نکته مهم]\n> خط اول\n> خط دوم");
		expect(html).toContain('class="callout callout-important"');
		expect(html).toContain("<strong>نکته مهم: </strong>");
		expect(html).toContain("خط اول");
		expect(html).not.toContain("[نکته مهم]");
	});
});

describe("markdownToHTML — sanitization", () => {
	it("drops script tags and javascript: links", async () => {
		const html = await render(
			"<script>alert(1)</script>\n\n[کلیک](javascript:alert(1))\n\n<img src=x onerror=alert(1)>"
		);
		expect(html).not.toContain("<script");
		expect(html).not.toContain("javascript:");
		expect(html).not.toContain("onerror");
	});

	it("still strips classes that are not callouts", async () => {
		const html = await render('<blockquote class="evil">متن</blockquote>');
		expect(html).not.toContain("evil");
	});
});

import { describe, expect, it } from "vitest";
import { jsonLdProps, safeJsonLd } from "@/lib/seo/json-ld";

describe("safeJsonLd", () => {
	it("keeps normal structured data intact and parseable", () => {
		const data = {
			"@context": "https://schema.org",
			"@type": "Course",
			name: "آموزش Next.js",
			offers: { price: 0, priceCurrency: "USD" },
		};

		const html = safeJsonLd(data);

		expect(JSON.parse(html)).toEqual(data);
		expect(html).toContain("آموزش Next.js");
	});

	it("cannot be used to close the script tag early", () => {
		// A course/deck title is user content — this is the stored-XSS payload.
		const html = safeJsonLd({
			name: "</script><script>alert(1)</script>",
		});

		expect(html).not.toContain("</script>");
		expect(html).not.toContain("<script>");
		expect(html).toContain("\\u003c/script\\u003e");
	});

	it("escapes the JSON line separators that break JS parsing", () => {
		const html = safeJsonLd({ name: "a\u2028b\u2029c" });
		expect(html).not.toContain("\u2028");
		expect(html).not.toContain("\u2029");
		expect(html).toContain("\\u2028");
	});

	it("escapes ampersands and closing brackets from attribute injection", () => {
		const html = safeJsonLd({ name: '& " >' });
		expect(html).not.toContain(">");
		expect(html).toContain("\\u0026");
	});
});

describe("jsonLdProps", () => {
	it("produces ready-to-spread script props", () => {
		const props = jsonLdProps({
			"@type": "Organization",
			name: "Abzar Kankor",
		});

		expect(props.type).toBe("application/ld+json");
		expect(JSON.parse(props.dangerouslySetInnerHTML.__html)).toEqual({
			"@type": "Organization",
			name: "Abzar Kankor",
		});
	});
});

import { describe, expect, it } from "vitest";
import { buildCertificateStorageKey } from "./constants";

describe("buildCertificateStorageKey", () => {
	it("nests the PDF under certificates/{userId}/{certificateId}.pdf", () => {
		expect(
			buildCertificateStorageKey(
				"7f1e2d3c-0000-0000-0000-000000000001",
				"9a8b7c6d-0000-0000-0000-000000000002"
			)
		).toBe(
			"certificates/7f1e2d3c-0000-0000-0000-000000000001/9a8b7c6d-0000-0000-0000-000000000002.pdf"
		);
	});

	it("keeps certificates in a dedicated top-level prefix (never courses/)", () => {
		const key = buildCertificateStorageKey("u", "c");
		expect(key.startsWith("certificates/")).toBe(true);
	});
});

// @vitest-environment node
//
// Renders the real certificate template through @react-pdf/renderer for both
// an LTR (English) and an RTL (Dari) payload — catching font-registration
// regressions, missing glyph crashes, and template layout exceptions.

import { describe, expect, it } from "vitest";
import type { CertificateTemplateProps } from "./template";
import {
	composeVerificationLine,
	composeVerifyHint,
	renderCertificatePdf,
} from "./template";

// 1×1 transparent PNG — stands in for the QR data URL.
const FAKE_QR =
	"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

const englishProps: CertificateTemplateProps = {
	studentName: "Ahmad Ahmadi",
	courseTitle: "Kankor Mathematics — Grade 12",
	verificationCode: "AB12CD34EF56GH78",
	qrDataUrl: FAKE_QR,
	verifyUrlDisplay: "abzarkankor.com/en/verify",
	direction: "ltr",
	strings: {
		platform: "Abzar Kankor",
		title: "Certificate of Completion",
		presentedTo: "This certificate is proudly presented to",
		bodyLine: "for successfully completing the course",
		dateLine: "Issued on July 13, 2026",
		verificationLabel: "Verification code",
		verifyHint: "Verify authenticity at {url}",
		signatureRole: "Issuing platform",
	},
};

const dariProps: CertificateTemplateProps = {
	studentName: "احمد احمدی",
	courseTitle: "ریاضیات کانکور — صنف دوازدهم",
	verificationCode: "AB12CD34EF56GH78",
	qrDataUrl: FAKE_QR,
	verifyUrlDisplay: "abzarkankor.com/fa/verify",
	direction: "rtl",
	strings: {
		platform: "ابزار کانکور",
		title: "گواهینامه تکمیل دوره",
		presentedTo: "این گواهینامه با افتخار تقدیم می‌شود به",
		bodyLine: "به پاس تکمیل موفقانه دوره",
		dateLine: "تاریخ صدور: ۲۲ سرطان ۱۴۰۵",
		verificationLabel: "کد تأیید",
		verifyHint: "برای تأیید اصالت به {url} مراجعه کنید",
		signatureRole: "پلتفرم صادرکننده",
	},
};

function expectValidPdf(buffer: Buffer) {
	expect(buffer.length).toBeGreaterThan(1000);
	// PDF magic bytes.
	expect(buffer.subarray(0, 5).toString("latin1")).toBe("%PDF-");
	// Exactly one page — absolutely-positioned decorations (watermark,
	// guilloché) must never overflow the layout onto a second page.
	const pageCount = buffer
		.toString("latin1")
		.match(/\/Type\s*\/Page[^s]/g)?.length;
	expect(pageCount).toBe(1);
}

// react-pdf lays out mixed-direction lines in logical order (no bidi), so
// for RTL the helpers must emit runs in VISUAL order — Latin parts first
// (leftmost), Arabic-script parts last (rightmost).
describe("RTL visual-order composition", () => {
	it("keeps the natural order for LTR", () => {
		expect(composeVerificationLine("Verification code", "AB12", false)).toBe(
			"Verification code: AB12"
		);
		expect(
			composeVerifyHint("Verify authenticity at {url}", "example.com", false)
		).toBe("Verify authenticity at example.com");
	});

	it("puts the code leftmost and the label rightmost for RTL", () => {
		expect(composeVerificationLine("کد تأیید", "AB12", true)).toBe(
			"AB12 :کد تأیید"
		);
	});

	it("swaps the clauses around the URL for RTL", () => {
		expect(
			composeVerifyHint(
				"برای تأیید اصالت به {url} مراجعه کنید",
				"abzarkankor.com/fa/verify",
				true
			)
		).toBe("مراجعه کنید abzarkankor.com/fa/verify برای تأیید اصالت به");
	});
});

describe("renderCertificatePdf", () => {
	it("renders an English (LTR) certificate", async () => {
		expectValidPdf(await renderCertificatePdf(englishProps));
	});

	it("renders a Dari (RTL, Arabic-script) certificate", async () => {
		expectValidPdf(await renderCertificatePdf(dariProps));
	});
});

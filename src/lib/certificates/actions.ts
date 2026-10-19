"use server";

import { getLocale, getTranslations } from "next-intl/server";
import QRCode from "qrcode";
import { dirOf } from "@/i18n/routing";
import { serverEnv } from "@/lib/env/server-env";
import { isR2Configured } from "@/lib/r2/client";
import { createDownloadUrl, putObject } from "@/lib/r2/presign";
import { createClient } from "@/lib/supabase/server";
import {
	buildCertificateStorageKey,
	CERTIFICATE_DOWNLOAD_TTL_SECONDS,
} from "./constants";
import { renderCertificatePdf } from "./template";

type Result<T = void> =
	| { success: true; data: T }
	| { success: false; error: string };

interface CertificateDownload {
	certificateId: string;
	url: string;
	expiresAt: string;
}

/** BCP-47 tags that give each locale its native digits/calendar in dates. */
const DATE_LOCALES: Record<string, string> = {
	fa: "fa-AF",
	ps: "ps-AF",
	en: "en-US",
};

function downloadExpiry(): string {
	return new Date(
		Date.now() + CERTIFICATE_DOWNLOAD_TTL_SECONDS * 1000
	).toISOString();
}

// ─── Claim (generate on first request, reuse afterwards) ───────────────────
//
// Eligibility is decided entirely by the database: `complete_lesson_for_user`
// inserts the `certificates` row the moment every mandatory lesson is
// complete — and quiz-gated lessons only complete on a passing attempt. So
// this action never re-computes progress; it simply refuses to render a PDF
// for a row that doesn't exist. RLS scopes all reads to the caller.

export async function claimCertificate(input: {
	courseId: string;
}): Promise<Result<CertificateDownload>> {
	if (!isR2Configured()) {
		return { success: false, error: "File storage is not configured." };
	}

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { data: cert, error } = await supabase
		.from("certificates")
		.select(
			"id, user_id, course_title, user_full_name, verification_code, certificate_pdf_url, issued_at, created_at"
		)
		.eq("course_id", input.courseId)
		.eq("user_id", user.id)
		.maybeSingle();
	if (error) return { success: false, error: error.message };
	if (!cert) {
		// No row = the course isn't fully completed yet.
		return { success: false, error: "not_eligible" };
	}

	// Already generated once — just mint a fresh signed URL.
	if (cert.certificate_pdf_url) {
		const url = await createDownloadUrl(
			cert.certificate_pdf_url,
			CERTIFICATE_DOWNLOAD_TTL_SECONDS
		);
		return {
			success: true,
			data: { certificateId: cert.id, url, expiresAt: downloadExpiry() },
		};
	}

	if (!cert.verification_code) {
		return { success: false, error: "Certificate is missing its code." };
	}

	// ── Render the PDF in the claimer's current language ──────────────────
	const locale = await getLocale();
	const t = await getTranslations({ locale, namespace: "certificates.pdf" });

	const issuedAt = new Date();
	const dateLabel = new Intl.DateTimeFormat(
		DATE_LOCALES[locale] ?? DATE_LOCALES.en,
		{ dateStyle: "long" }
	).format(issuedAt);

	const verifyUrl = `${serverEnv.app.address}/${locale}/verify/${cert.verification_code}`;
	const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
		margin: 0,
		width: 256,
		color: { dark: "#16324F", light: "#FDFBF5" },
	});

	const pdfBuffer = await renderCertificatePdf({
		studentName: cert.user_full_name,
		courseTitle: cert.course_title,
		verificationCode: cert.verification_code,
		qrDataUrl,
		verifyUrlDisplay: `${serverEnv.app.address.replace(/^https?:\/\//, "")}/${locale}/verify`,
		direction: dirOf(locale),
		strings: {
			// Localized platform name (e.g. "ابزار کانکور" for fa/ps).
			platform: t("platform"),
			title: t("title"),
			presentedTo: t("presentedTo"),
			bodyLine: t("bodyLine"),
			dateLine: t("dateLine", { date: dateLabel }),
			verificationLabel: t("verificationLabel"),
			// Interpolating "{url}" with itself keeps the placeholder literal —
			// the template substitutes it, RTL-aware (see composeVerifyHint).
			verifyHint: t("verifyHint", { url: "{url}" }),
			signatureRole: t("signatureRole"),
		},
	});

	const storageKey = buildCertificateStorageKey(user.id, cert.id);
	try {
		await putObject(storageKey, pdfBuffer, "application/pdf");
	} catch (err) {
		return {
			success: false,
			error:
				err instanceof Error ? err.message : "Could not store certificate.",
		};
	}

	// Persist via security-definer RPC — users have no UPDATE policy on
	// `certificates`, so name/title/code stay immutable to them.
	// (`as never` casts bridge the gap until the migration is pushed and
	// `pnpm gen:types` regenerates database.types.ts.)
	const { error: attachError } = await supabase.rpc(
		"attach_certificate_pdf" as never,
		{ p_certificate_id: cert.id, p_pdf_storage_key: storageKey } as never
	);
	if (attachError) return { success: false, error: attachError.message };

	const url = await createDownloadUrl(
		storageKey,
		CERTIFICATE_DOWNLOAD_TTL_SECONDS
	);
	return {
		success: true,
		data: { certificateId: cert.id, url, expiresAt: downloadExpiry() },
	};
}

// ─── Download an already-issued certificate ─────────────────────────────────

export async function getCertificateDownloadUrl(input: {
	certificateId: string;
}): Promise<Result<CertificateDownload>> {
	if (!isR2Configured()) {
		return { success: false, error: "File storage is not configured." };
	}

	const supabase = await createClient();

	// RLS: owners (and admins) only.
	const { data: cert, error } = await supabase
		.from("certificates")
		.select("id, certificate_pdf_url")
		.eq("id", input.certificateId)
		.maybeSingle();
	if (error) return { success: false, error: error.message };
	if (!cert?.certificate_pdf_url) {
		return { success: false, error: "Certificate not found." };
	}

	const url = await createDownloadUrl(
		cert.certificate_pdf_url,
		CERTIFICATE_DOWNLOAD_TTL_SECONDS
	);
	return {
		success: true,
		data: { certificateId: cert.id, url, expiresAt: downloadExpiry() },
	};
}

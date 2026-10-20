import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env/server-env";
import { requireBearerSecret } from "@/lib/security/guard";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Server-to-server bridge to the external Python OMR service. Owns the
 * request/response contract documented in docs/omr-module.md: sends
 * {scan_id, image_url, question_order, template_version}, expects back
 * {responses: [{question_id, detected_option_index, confidence}], raw}.
 *
 * Uses the service-role client throughout — record_omr_scan_result and
 * mark_omr_scan_error are intentionally revoked from anon/authenticated in
 * the migration (they trust a caller that already verified the OMR
 * service's response, which only this trusted server context can do).
 *
 * Auth: the OMR service must send `Authorization: Bearer $OMR_INTERNAL_SECRET`
 * (timing-safe compare). Without the secret this route refuses to run —
 * it writes results with the service-role key and must never be public.
 */
export async function POST(request: Request) {
	const denied = requireBearerSecret(request, serverEnv.omr.internalSecret, {
		serviceName: "OMR bridge",
	});
	if (denied) return denied;

	const body = await request.json().catch(() => null);
	const scanId = typeof body?.scan_id === "string" ? body.scan_id : null;
	if (!scanId) {
		return NextResponse.json({ error: "scan_id is required" }, { status: 400 });
	}

	const admin = createServiceRoleClient();

	const { data: scan, error: scanError } = await admin
		.from("omr_scans")
		.select("id, variant_id, image_storage_path")
		.eq("id", scanId)
		.single();
	if (scanError || !scan) {
		return NextResponse.json({ error: "Scan not found" }, { status: 404 });
	}

	const { data: variant, error: variantError } = await admin
		.from("quiz_variants")
		.select("id, question_order, template_version")
		.eq("id", scan.variant_id)
		.single();
	if (variantError || !variant) {
		return NextResponse.json({ error: "Variant not found" }, { status: 404 });
	}

	if (!serverEnv.omr.serviceUrl) {
		await admin.rpc("mark_omr_scan_error", {
			p_scan_id: scanId,
			p_error_message:
				"OMR_SERVICE_URL is not configured — no external OMR service to call yet.",
		});
		return NextResponse.json(
			{ error: "OMR service is not configured" },
			{ status: 503 }
		);
	}

	const { data: signedUrlData, error: signedUrlError } = await admin.storage
		.from("omr-scans")
		.createSignedUrl(scan.image_storage_path, 60 * 10);
	if (signedUrlError || !signedUrlData) {
		await admin.rpc("mark_omr_scan_error", {
			p_scan_id: scanId,
			p_error_message: `Could not sign the uploaded image URL: ${signedUrlError?.message ?? "unknown error"}`,
		});
		return NextResponse.json(
			{ error: "Could not sign image URL" },
			{ status: 500 }
		);
	}

	let omrResponse: Response;
	try {
		omrResponse = await fetch(serverEnv.omr.serviceUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				scan_id: scanId,
				image_url: signedUrlData.signedUrl,
				question_order: variant.question_order,
				template_version: variant.template_version,
			}),
		});
	} catch (err) {
		await admin.rpc("mark_omr_scan_error", {
			p_scan_id: scanId,
			p_error_message: `Could not reach the OMR service: ${err instanceof Error ? err.message : String(err)}`,
		});
		return NextResponse.json(
			{ error: "OMR service unreachable" },
			{ status: 502 }
		);
	}

	if (!omrResponse.ok) {
		await admin.rpc("mark_omr_scan_error", {
			p_scan_id: scanId,
			p_error_message: `OMR service returned ${omrResponse.status}`,
		});
		return NextResponse.json({ error: "OMR service error" }, { status: 502 });
	}

	const payload = await omrResponse.json().catch(() => null);
	if (!payload || !Array.isArray(payload.responses)) {
		await admin.rpc("mark_omr_scan_error", {
			p_scan_id: scanId,
			p_error_message: "OMR service returned an unexpected response shape.",
		});
		return NextResponse.json(
			{ error: "Malformed OMR response" },
			{ status: 502 }
		);
	}

	const { data: updatedScan, error: recordError } = await admin.rpc(
		"record_omr_scan_result",
		{
			p_scan_id: scanId,
			p_responses: payload.responses,
			p_raw_result: payload.raw ?? null,
		}
	);
	if (recordError) {
		await admin.rpc("mark_omr_scan_error", {
			p_scan_id: scanId,
			p_error_message: `Failed to record OMR result: ${recordError.message}`,
		});
		return NextResponse.json({ error: recordError.message }, { status: 500 });
	}

	return NextResponse.json({ scan: updatedScan });
}

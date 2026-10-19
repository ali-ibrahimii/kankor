"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Award, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { claimCertificate } from "@/lib/certificates/actions";
import { createClient } from "@/lib/supabase/client";

export interface CertificateClaimProps {
	courseId: string;
	className?: string;
}

/**
 * "Claim certificate" button shown once a course is fully completed.
 *
 * The button is intentionally dumb about eligibility: the server action
 * refuses to render a PDF unless the DB-created `certificates` row exists
 * (which only happens at 100% completion with all quizzes passed), so the
 * worst a stale client can do is see an error toast.
 */
export function CertificateClaim({
	courseId,
	className,
}: CertificateClaimProps) {
	const t = useTranslations("certificates.claim");

	// Only used to pick the button label (claim vs. re-download) — the claim
	// action itself is idempotent either way.
	const { data: certificate } = useQuery({
		queryKey: ["certificate", courseId],
		queryFn: async () => {
			const client = createClient();
			const { data, error } = await client
				.from("certificates")
				.select("id, certificate_pdf_url")
				.eq("course_id", courseId)
				.maybeSingle();
			if (error) throw error;
			return data;
		},
	});

	const claimMutation = useMutation({
		mutationFn: async () => {
			const result = await claimCertificate({ courseId });
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		onSuccess: ({ url }) => {
			// Signed URL is short-lived; open immediately.
			window.open(url, "_blank", "noopener,noreferrer");
		},
		onError: (error) => {
			toast.error(
				error.message === "not_eligible" ? t("notEligible") : t("claimFailed")
			);
		},
	});

	const alreadyIssued = !!certificate?.certificate_pdf_url;

	return (
		<Button
			size="sm"
			variant={alreadyIssued ? "outline" : "default"}
			className={className}
			disabled={claimMutation.isPending}
			onClick={() => claimMutation.mutate()}
		>
			{claimMutation.isPending ? (
				<>
					<Spinner className="size-4" />
					{t("generating")}
				</>
			) : alreadyIssued ? (
				<>
					<Download className="size-4" />
					{t("download")}
				</>
			) : (
				<>
					<Award className="size-4" />
					{t("claim")}
				</>
			)}
		</Button>
	);
}

"use client";

import { AwardIcon, BanIcon, RotateCcwIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	type CourseCertificateAdminState,
	getCourseCertificateAdmin,
	type ManagedCertificate,
	setCertificateRevoked,
	setCourseCertificateEnabled,
} from "@/lib/certificates/actions";
import { cn } from "@/lib/utils";

// ─── Per-course certificate management (instructor + admin) ─────────────────
//
// Controls whether completing the course issues a certificate and lets the
// manager revoke/restore the certificates already issued. Server errors come
// back as short machine codes and are mapped to localized messages here —
// raw server text is only logged to the console.

type LoadState =
	| { status: "loading" }
	| { status: "error" }
	| { status: "ready"; data: CourseCertificateAdminState };

function formatDate(value: string | null): string {
	if (!value) return "—";
	return new Date(value).toLocaleDateString();
}

export function CertificateManager({ courseId }: { courseId: string }) {
	const t = useTranslations("certificates");
	const [state, setState] = React.useState<LoadState>({ status: "loading" });
	const [pendingId, setPendingId] = React.useState<string | null>(null);
	const [togglePending, setTogglePending] = React.useState(false);

	const load = React.useCallback(async () => {
		setState({ status: "loading" });
		const result = await getCourseCertificateAdmin({ courseId });
		if (result.success) {
			setState({ status: "ready", data: result.data });
		} else {
			console.error("[CertificateManager] load failed", result.error);
			setState({ status: "error" });
		}
	}, [courseId]);

	React.useEffect(() => {
		void load();
	}, [load]);

	async function handleToggle(enabled: boolean) {
		if (state.status !== "ready") return;
		setTogglePending(true);
		// Optimistic flip; reverted on failure.
		const previous = state.data.enabled;
		setState({
			status: "ready",
			data: { ...state.data, enabled },
		});
		const result = await setCourseCertificateEnabled({ courseId, enabled });
		setTogglePending(false);
		if (!result.success) {
			console.error("[CertificateManager] toggle failed", result.error);
			setState({
				status: "ready",
				data: { ...state.data, enabled: previous },
			});
			toast.error(t("manage.saveFailed"));
			return;
		}
		toast.success(t(enabled ? "manage.enabledToast" : "manage.disabledToast"));
	}

	async function handleRevoke(cert: ManagedCertificate) {
		const revoked = !cert.revokedAt;
		setPendingId(cert.id);
		const result = await setCertificateRevoked({
			certificateId: cert.id,
			revoked,
		});
		setPendingId(null);
		if (!result.success) {
			console.error("[CertificateManager] revoke failed", result.error);
			toast.error(t("manage.saveFailed"));
			return;
		}
		toast.success(t(revoked ? "manage.revokedToast" : "manage.restoredToast"));
		await load();
	}

	return (
		<div className="space-y-5 rounded-xl border bg-card p-5">
			<div className="flex items-start gap-3">
				<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
					<AwardIcon className="size-5 text-primary" aria-hidden="true" />
				</div>
				<div className="flex-1">
					<h3 className="text-sm font-semibold">{t("manage.title")}</h3>
					<p className="mt-1 text-xs text-muted-foreground">
						{t("manage.description")}
					</p>
				</div>
			</div>

			{/* ── Enable / disable issuance ── */}
			<div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 px-4 py-3">
				<div>
					<p className="text-sm font-medium">{t("manage.enableLabel")}</p>
					<p className="mt-0.5 text-xs text-muted-foreground">
						{t("manage.enableHint")}
					</p>
				</div>
				<Switch
					checked={state.status === "ready" ? state.data.enabled : false}
					disabled={state.status !== "ready" || togglePending}
					onCheckedChange={(checked) => void handleToggle(checked)}
					aria-label={t("manage.enableLabel")}
				/>
			</div>

			{/* ── Issued certificates ── */}
			<div>
				<h4 className="mb-2 text-xs font-semibold text-muted-foreground">
					{t("manage.issuedTitle")}
				</h4>

				{state.status === "loading" && (
					<div className="space-y-2">
						<Skeleton className="h-9 w-full" />
						<Skeleton className="h-9 w-full" />
					</div>
				)}

				{state.status === "error" && (
					<div className="flex items-center justify-between gap-3 rounded-lg border border-dashed px-4 py-3 text-sm">
						<span className="text-muted-foreground">
							{t("manage.loadError")}
						</span>
						<Button variant="outline" size="sm" onClick={() => void load()}>
							{t("manage.retry")}
						</Button>
					</div>
				)}

				{state.status === "ready" && state.data.certificates.length === 0 && (
					<p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
						{t("manage.empty")}
					</p>
				)}

				{state.status === "ready" && state.data.certificates.length > 0 && (
					<div className="overflow-hidden rounded-lg border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t("manage.student")}</TableHead>
									<TableHead>{t("manage.issuedAt")}</TableHead>
									<TableHead>{t("manage.code")}</TableHead>
									<TableHead>{t("manage.status")}</TableHead>
									<TableHead className="w-28 text-end">
										{t("manage.actions")}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{state.data.certificates.map((cert) => (
									<TableRow key={cert.id}>
										<TableCell className="font-medium">
											{cert.userFullName}
										</TableCell>
										<TableCell>{formatDate(cert.issuedAt)}</TableCell>
										<TableCell className="font-mono text-xs">
											{cert.verificationCode ?? "—"}
										</TableCell>
										<TableCell>
											<span
												className={cn(
													"inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
													cert.revokedAt
														? "bg-destructive/10 text-destructive"
														: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
												)}
											>
												{cert.revokedAt
													? t("manage.statusRevoked")
													: t("manage.statusActive")}
											</span>
										</TableCell>
										<TableCell className="text-end">
											<Button
												variant="ghost"
												size="sm"
												disabled={pendingId === cert.id}
												onClick={() => void handleRevoke(cert)}
											>
												{cert.revokedAt ? (
													<>
														<RotateCcwIcon className="size-3.5 me-1" />
														{t("manage.restore")}
													</>
												) : (
													<>
														<BanIcon className="size-3.5 me-1" />
														{t("manage.revoke")}
													</>
												)}
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}
			</div>
		</div>
	);
}

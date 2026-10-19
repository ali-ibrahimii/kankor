"use client";

import {
	CheckCircle2Icon,
	KeyRoundIcon,
	ShieldCheckIcon,
	UnlinkIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import z from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { useAppForm } from "@/hooks/use-form";
import type { CurrentUser } from "@/lib/auth/types";
import { createClient } from "@/lib/supabase/client";
import { updateEmailAction, updatePasswordAction } from "./actions";

interface AccountSecurityFormProps {
	user: CurrentUser;
}

export function AccountSecurityForm({ user }: AccountSecurityFormProps) {
	const t = useTranslations("account.security");
	const [isGoogleLinked, setIsGoogleLinked] = React.useState<boolean>(false);
	const [googleIdentity, setGoogleIdentity] = React.useState<Record<
		string,
		unknown
	> | null>(null);
	const [isLinking, setIsLinking] = React.useState<boolean>(false);

	React.useEffect(() => {
		const supabase = createClient();
		supabase.auth.getUser().then(({ data }) => {
			const identities = data.user?.identities || [];
			const googleId = identities.find((id) => id.provider === "google");
			if (googleId) {
				setIsGoogleLinked(true);
				setGoogleIdentity(googleId as unknown as Record<string, unknown>);
			}
		});
	}, []);

	// Email Update Form
	const emailForm = useAppForm({
		defaultValues: {
			email: user.email ?? "",
		},
		onSubmit: async ({ value }) => {
			if (value.email === user.email) return;
			const res = await updateEmailAction({ email: value.email });
			if (res.success) {
				toast.success(t("emailHelp"));
			} else {
				toast.error(res.error || t("passwordError"));
			}
		},
	});

	// Password Update Form
	const passwordForm = useAppForm({
		defaultValues: {
			password: "",
			confirmPassword: "",
		},
		onSubmit: async ({ value }) => {
			if (value.password !== value.confirmPassword) {
				toast.error(t("passwordMismatch"));
				return;
			}
			const res = await updatePasswordAction({ password: value.password });
			if (res.success) {
				toast.success(t("passwordSuccess"));
				passwordForm.reset();
			} else {
				toast.error(res.error || t("passwordError"));
			}
		},
	});

	async function handleLinkGoogle() {
		try {
			setIsLinking(true);
			const supabase = createClient();
			const { error } = await supabase.auth.linkIdentity({
				provider: "google",
				options: {
					redirectTo: `${window.location.origin}/api/auth/callback`,
				},
			});
			if (error) {
				toast.error(error.message);
				setIsLinking(false);
			}
		} catch {
			toast.error(t("passwordError"));
			setIsLinking(false);
		}
	}

	async function handleUnlinkGoogle() {
		if (!googleIdentity) return;
		try {
			setIsLinking(true);
			const supabase = createClient();
			const { error } = await supabase.auth.unlinkIdentity(
				googleIdentity as unknown as Parameters<
					typeof supabase.auth.unlinkIdentity
				>[0]
			);
			if (error) {
				toast.error(error.message);
			} else {
				setIsGoogleLinked(false);
				setGoogleIdentity(null);
				toast.success(t("googleUnlinkSuccess"));
			}
			setIsLinking(false);
		} catch {
			toast.error(t("passwordError"));
			setIsLinking(false);
		}
	}

	return (
		<div className="space-y-6">
			{/* Security & Credentials Card */}
			<Card className="border-border/60 shadow-sm backdrop-blur-sm">
				<CardHeader>
					<CardTitle className="text-xl font-semibold flex items-center gap-2">
						<ShieldCheckIcon className="size-5 text-primary" />
						{t("title")}
					</CardTitle>
					<CardDescription>{t("subtitle")}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Email address update */}
					<emailForm.AppForm>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								emailForm.handleSubmit();
							}}
							className="space-y-4 rounded-xl border border-border/40 bg-muted/20 p-4"
						>
							<FieldGroup>
								<emailForm.AppField
									name="email"
									validators={{
										onBlur: z
											.string()
											.email("Please enter a valid email address."),
									}}
								>
									{(field) => (
										<field.TextField
											label={t("email")}
											placeholder="your.email@example.com"
											type="email"
										/>
									)}
								</emailForm.AppField>
							</FieldGroup>
							<div className="flex items-center justify-between pt-1">
								<span className="text-xs text-muted-foreground">
									{t("emailHelp")}
								</span>
								<emailForm.SubmitButton size="sm" variant="outline">
									{t("email")}
								</emailForm.SubmitButton>
							</div>
						</form>
					</emailForm.AppForm>

					{/* Password change */}
					<passwordForm.AppForm>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								passwordForm.handleSubmit();
							}}
							className="space-y-4 rounded-xl border border-border/40 bg-muted/20 p-4"
						>
							<h4 className="text-sm font-semibold flex items-center gap-2">
								<KeyRoundIcon className="size-4 text-primary" />
								{t("changePasswordTitle")}
							</h4>
							<FieldGroup className="grid gap-4 sm:grid-cols-2">
								<passwordForm.AppField
									name="password"
									validators={{
										onBlur: z
											.string()
											.min(6, "Password must be at least 6 characters."),
									}}
								>
									{(field) => (
										<field.TextField
											label={t("newPassword")}
											type="password"
											autoComplete="new-password"
										/>
									)}
								</passwordForm.AppField>

								<passwordForm.AppField
									name="confirmPassword"
									validators={{
										onBlur: z
											.string()
											.min(6, "Password must be at least 6 characters."),
									}}
								>
									{(field) => (
										<field.TextField
											label={t("confirmPassword")}
											type="password"
											autoComplete="new-password"
										/>
									)}
								</passwordForm.AppField>
							</FieldGroup>

							<div className="flex justify-end pt-1">
								<passwordForm.SubmitButton size="sm">
									{t("changePasswordTitle")}
								</passwordForm.SubmitButton>
							</div>
						</form>
					</passwordForm.AppForm>
				</CardContent>
			</Card>

			{/* Connected Google Account */}
			<Card className="border-border/60 shadow-sm backdrop-blur-sm">
				<CardHeader>
					<CardTitle className="text-lg font-semibold flex items-center gap-2">
						<svg className="size-5" viewBox="0 0 24 24">
							<path
								fill="currentColor"
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
							/>
							<path
								fill="currentColor"
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
							/>
							<path
								fill="currentColor"
								d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
							/>
							<path
								fill="currentColor"
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
							/>
						</svg>
						{t("googleAccount")}
					</CardTitle>
					<CardDescription>
						{isGoogleLinked ? t("googleLinked") : t("googleNotLinked")}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/20 p-4">
						<div className="flex items-center gap-3">
							{isGoogleLinked ? (
								<Badge
									variant="secondary"
									className="gap-1.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
								>
									<CheckCircle2Icon className="size-3.5" />
									{t("googleLinked")}
								</Badge>
							) : (
								<Badge variant="outline" className="text-muted-foreground">
									{t("googleNotLinked")}
								</Badge>
							)}
						</div>
						{isGoogleLinked ? (
							<Button
								variant="outline"
								size="sm"
								className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
								onClick={handleUnlinkGoogle}
								disabled={isLinking}
							>
								<UnlinkIcon className="size-4" />
								{t("unlinkGoogle")}
							</Button>
						) : (
							<Button
								variant="outline"
								size="sm"
								className="gap-2"
								onClick={handleLinkGoogle}
								disabled={isLinking}
							>
								{t("linkGoogle")}
							</Button>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

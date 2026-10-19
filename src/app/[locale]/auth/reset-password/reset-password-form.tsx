"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import z from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field";
import { useAppForm } from "@/hooks/use-form";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { resetPasswordAction } from "./action";

export function ResetPasswordForm({
	className,
	...props
}: React.ComponentProps<"div">) {
	const t = useTranslations("auth");
	const [serverError, setServerError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const form = useAppForm({
		defaultValues: { password: "", confirmPassword: "" },
		onSubmit: async ({ value }) => {
			if (value.password !== value.confirmPassword) {
				setServerError(t("validation.passwordMismatch"));
				return;
			}
			setServerError(null);
			const result = await resetPasswordAction({ password: value.password });
			if (result.error) {
				setServerError(result.error);
			} else {
				setSuccess(true);
			}
		},
	});

	if (success) {
		return (
			<div className={cn("flex flex-col gap-6", className)} {...props}>
				<Card>
					<CardHeader className="text-center">
						<CardTitle className="text-xl">
							{t("updatePasswordPage.successTitle")}
						</CardTitle>
						<CardDescription>
							{t("updatePasswordPage.successBody")}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<FieldDescription className="text-center">
							<Link href={routes.auth.login.page()}>
								{t("header.resetPassword.linkText")}
							</Link>
						</FieldDescription>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className={cn("flex flex-col gap-6", className)} {...props}>
			<Card>
				<CardHeader className="text-center">
					<CardTitle className="text-xl">
						{t("updatePasswordPage.title")}
					</CardTitle>
					<CardDescription>{t("updatePasswordPage.subtitle")}</CardDescription>
				</CardHeader>
				<CardContent>
					<form.AppForm>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								form.handleSubmit();
							}}
						>
							<FieldGroup>
								<form.AppField
									name="password"
									validators={{
										onBlur: z
											.string()
											.min(8, t("validation.passwordTooShort"))
											.refine(
												(v) => /[A-Z]/.test(v) && /[0-9]/.test(v),
												t("validation.passwordWeak")
											),
									}}
								>
									{(field) => (
										<field.TextField
											label={t("common.passwordLabel")}
											type="password"
											autoComplete="new-password"
											description={t("updatePasswordPage.passwordHint")}
										/>
									)}
								</form.AppField>

								<form.AppField
									name="confirmPassword"
									validators={{
										onChange: z.string().min(1, t("validation.required")),
										onBlurListenTo: ["password"],
									}}
								>
									{(field) => (
										<field.TextField
											label={t("common.confirmPasswordLabel")}
											type="password"
											autoComplete="new-password"
										/>
									)}
								</form.AppField>

								{serverError && (
									<Alert variant="destructive">
										<AlertDescription>{serverError}</AlertDescription>
									</Alert>
								)}

								<Field>
									<form.Subscribe>
										{(state) => (
											<>
												<form.SubmitButton
													className="w-full"
													disabled={
														!state.values.password ||
														state.values.password !==
															state.values.confirmPassword
													}
												>
													{t("updatePasswordPage.submit")}
												</form.SubmitButton>
											</>
										)}
									</form.Subscribe>
								</Field>
							</FieldGroup>
						</form>
					</form.AppForm>
				</CardContent>
			</Card>
		</div>
	);
}

"use client";

import { useSearchParams } from "next/navigation";
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
import { forgotPasswordAction } from "./action";

export function ForgotPasswordForm({
	className,
	...props
}: React.ComponentProps<"div">) {
	const t = useTranslations("auth");
	const [serverError, setServerError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const searchParams = useSearchParams();
	const emailParam = searchParams.get("email") || "";

	const form = useAppForm({
		defaultValues: { email: emailParam },
		onSubmit: async ({ value }) => {
			setServerError(null);
			const result = await forgotPasswordAction(value);
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
							{t("common.successTitle")}
						</CardTitle>
						<CardDescription>
							{t("resetPasswordPage.successBody")}
						</CardDescription>
					</CardHeader>
				</Card>
			</div>
		);
	}

	return (
		<div className={cn("flex flex-col gap-6", className)} {...props}>
			<Card>
				<CardHeader className="text-center">
					<CardTitle className="text-xl">
						{t("resetPasswordPage.title")}
					</CardTitle>
					<CardDescription>{t("resetPasswordPage.subtitle")}</CardDescription>
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
									name="email"
									validators={{ onBlur: z.email(t("validation.invalidEmail")) }}
								>
									{(field) => (
										<field.TextField
											label={t("common.emailLabel")}
											placeholder={t("common.emailPlaceholder")}
											type="email"
											autoComplete="email"
											description={t("resetPasswordPage.emailHint")}
										/>
									)}
								</form.AppField>

								{serverError && (
									<Alert variant="destructive">
										<AlertDescription>{serverError}</AlertDescription>
									</Alert>
								)}

								<Field>
									<form.SubmitButton className="w-full">
										{t("resetPasswordPage.submit")}
									</form.SubmitButton>
									<FieldDescription className="text-center">
										{t("header.resetPassword.prompt")}{" "}
										<Link href={routes.auth.login.page()}>
											{t("header.resetPassword.linkText")}
										</Link>
									</FieldDescription>
								</Field>
							</FieldGroup>
						</form>
					</form.AppForm>
				</CardContent>
			</Card>

			<FieldDescription className="px-6 text-center">
				{t.rich("footer.agreeToTerms", {
					termsLink: (chunks) => (
						<Link href={routes.termsOfUse.page()}>{chunks}</Link>
					),
					privacyLink: (chunks) => (
						<Link href={routes.privacyPolicy.page()}>{chunks}</Link>
					),
				})}
			</FieldDescription>
		</div>
	);
}

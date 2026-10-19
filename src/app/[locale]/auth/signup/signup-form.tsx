"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import z from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field";
import { useAppForm } from "@/hooks/use-form";
import { useSupabase } from "@/hooks/use-supabase";
import { Link } from "@/i18n/navigation";
import { dirOf } from "@/i18n/routing";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { signupAction } from "./action";
import { type SignUpFormValues } from "./signup-schema";

export type AccountType = "instructor" | "school" | "student";

type Props = {
	type?: AccountType;
};

export function SignupForm({
	type: _type = "student",
	className,
	...props
}: React.ComponentProps<"div"> & Props) {
	const [type, setType] = useState<AccountType>(_type);
	const locale = useLocale();
	const t = useTranslations("auth");
	const [serverError, setServerError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const dir = dirOf(locale);

	// Pick the right page-level translation keys for the active account type.
	const pt =
		type === "school"
			? {
					title: t("registerSchoolPage.title"),
					subtitle: t("registerSchoolPage.subtitle"),
					passwordHint: t("registerSchoolPage.passwordHint"),
					submit: t("registerSchoolPage.submit"),
					successBody: t("registerSchoolPage.successBody"),
				}
			: type === "instructor"
				? {
						title: t("registerInstructorPage.title"),
						subtitle: t("registerInstructorPage.subtitle"),
						passwordHint: t("registerInstructorPage.passwordHint"),
						submit: t("registerInstructorPage.submit"),
						successBody: t("registerInstructorPage.successBody"),
					}
				: {
						title: t("registerStudentPage.title"),
						subtitle: t("registerStudentPage.subtitle"),
						passwordHint: t("registerStudentPage.passwordHint"),
						submit: t("registerStudentPage.submit"),
						successBody: t("registerStudentPage.successBody"),
					};

	const provincesQuery = useSupabase({
		table: "provinces",
		staleTime: 5 * 60 * 1000,
	});

	const form = useAppForm({
		defaultValues: {
			fullName: "",
			email: "",
			password: "",
			confirmPassword: "",
			schoolAddress: "",
			schoolName: "",
			provinceId: "",
			locale,
			type,
		} satisfies SignUpFormValues,

		onSubmit: async ({ value }) => {
			setServerError(null);
			const result = await signupAction(value);
			if (result.error) {
				setServerError(result.code || result.error);
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
						<CardDescription>{pt.successBody}</CardDescription>
					</CardHeader>
				</Card>
			</div>
		);
	}

	const Register = (
		<div className="flex gap-3">
			{type !== "student" && (
				<Button variant={"link"} onClick={() => setType("student")}>
					{t("registerStudent")}
				</Button>
			)}
			{type !== "instructor" && (
				<Button variant={"link"} onClick={() => setType("instructor")}>
					{t("registerInstructor")}
				</Button>
			)}
			{type !== "school" && (
				<Button variant={"link"} onClick={() => setType("school")}>
					{t("registerSchool")}
				</Button>
			)}
		</div>
	);

	return (
		<div className={cn("flex flex-col gap-6", className)} {...props}>
			<div
				className={cn(
					"hidden md:block md:absolute top-5",
					dir === "rtl" ? "right-5" : "left-5"
				)}
			>
				{Register}
			</div>
			<Card>
				<CardHeader className="text-center">
					<CardTitle className="text-xl">{pt.title}</CardTitle>
					<CardDescription>{pt.subtitle}</CardDescription>
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
							<FieldGroup className="gap-5">
								{/* Per-field onBlur runs the individual field schema so the
                    user sees errors as they tab through, before submitting. */}
								<form.AppField
									name="fullName"
									validators={{
										onBlur: z.string().min(1, t("validation.required")),
									}}
								>
									{(field) => (
										<field.TextField
											label={t("common.fullNameLabel")}
											placeholder={t("common.fullNamePlaceholder")}
											autoComplete="name"
										/>
									)}
								</form.AppField>

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
										/>
									)}
								</form.AppField>

								<form.AppField name="provinceId">
									{(field) => (
										<field.ComboboxField
											label={t("common.provinceLabel")}
											placeholder={t("common.provincePlaceholder")}
											options={
												provincesQuery.data?.data?.map((p) => ({
													value: p.id,
													label: p.name,
												})) ?? []
											}
											emptyText="No provinces found"
											showClear
										/>
									)}
								</form.AppField>

								{type === "school" && (
									<>
										<form.AppField
											name="schoolName"
											validators={{
												onBlur: z.string().min(1, t("validation.required")),
											}}
										>
											{(field) => (
												<field.TextField
													label={t("common.schoolNameLabel")}
													placeholder={t("common.schoolNamePlaceholder")}
													type="text"
												/>
											)}
										</form.AppField>
										<form.AppField
											name="schoolAddress"
											validators={{
												onBlur: z.string().min(1, t("validation.required")),
											}}
										>
											{(field) => (
												<field.TextField
													label={t("common.schoolAddressLabel")}
													placeholder={t("common.schoolAddressPlaceholder")}
													type="text"
												/>
											)}
										</form.AppField>
									</>
								)}

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
										<field.PasswordField
											label={t("common.passwordLabel")}
											autoComplete="new-password"
											description={pt.passwordHint}
										/>
									)}
								</form.AppField>

								<form.AppField
									name="confirmPassword"
									validators={{
										// Re-run when password changes so the mismatch error
										// clears immediately if the user fixes the password field.
										onBlurListenTo: ["password"],
										onChange: ({ value, fieldApi }) => {
											if (!value) return t("validation.required");
											if (value !== fieldApi.form.getFieldValue("password"))
												return t("validation.passwordMismatch");
										},
									}}
								>
									{(field) => (
										<field.PasswordField
											label={t("common.confirmPasswordLabel")}
											autoComplete="new-password"
										/>
									)}
								</form.AppField>

								{serverError && (
									<Alert variant="destructive">
										<AlertDescription>{t(serverError)}</AlertDescription>
									</Alert>
								)}

								<Field>
									<form.SubmitButton className="w-full">
										{pt.submit}
									</form.SubmitButton>
									<FieldDescription className="text-center">
										{t("header.register.prompt")}{" "}
										<Link href={routes.auth.login.page()}>
											{t("header.register.linkText")}
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

			<div className="md:hidden mx-auto">{Register}</div>
		</div>
	);
}

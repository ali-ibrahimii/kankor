"use client";

import {
	ArrowUpRight,
	BookOpenCheck,
	CheckCircle2,
	GraduationCap,
	ShieldCheck,
	Sparkles,
	UsersRound,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import z from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field";
import { useAppForm } from "@/hooks/use-form";
import { useSupabase } from "@/hooks/use-supabase";
import { Link } from "@/i18n/navigation";
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

	const accountTypes: { id: AccountType; label: string }[] = [
		{ id: "student", label: t("registerStudent") },
		{ id: "instructor", label: t("registerInstructor") },
		{ id: "school", label: t("registerSchool") },
	];

	const selectAccountType = (nextType: AccountType) => {
		setType(nextType);
		form.setFieldValue("type", nextType);
	};

	if (success) {
		return (
			<div className={cn("mx-auto w-full max-w-6xl", className)} {...props}>
				<section className="grid overflow-hidden rounded-[30px] border border-border/70 bg-card shadow-[0_30px_90px_-45px_rgba(31,41,75,.4)] md:grid-cols-[0.85fr_1.15fr]">
					<aside className="bg-gradient-to-br from-[#18243b] via-[#2b315e] to-[#6546cb] p-7 text-white sm:p-10">
						<div className="inline-flex size-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
							<GraduationCap
								className="size-6 text-[#c7f89c]"
								aria-hidden="true"
							/>
						</div>
						<p className="mt-6 text-sm font-semibold text-white/70">
							{t("signupPromo.eyebrow")}
						</p>
						<h1 className="mt-2 max-w-sm text-2xl font-extrabold leading-tight sm:text-3xl">
							{t("signupPromo.title")}
						</h1>
					</aside>
					<div className="flex flex-col justify-center p-6 text-center sm:p-10">
						<div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
							<CheckCircle2 className="size-7" aria-hidden="true" />
						</div>
						<h2 className="mt-5 text-2xl font-bold tracking-tight">
							{t("common.successTitle")}
						</h2>
						<p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
							{pt.successBody}
						</p>
						<Button
							asChild
							size="lg"
							className="mt-6 w-full rounded-xl sm:mx-auto sm:w-auto"
						>
							<Link href={routes.auth.login.page()}>
								{t("header.register.linkText")}
								<ArrowUpRight className="ms-2 size-4" aria-hidden="true" />
							</Link>
						</Button>
					</div>
				</section>
			</div>
		);
	}

	return (
		<div className={cn("mx-auto w-full max-w-6xl", className)} {...props}>
			<section className="grid overflow-hidden rounded-[30px] border border-border/70 bg-card shadow-[0_30px_90px_-45px_rgba(31,41,75,.4)] md:grid-cols-[0.85fr_1.15fr]">
				<aside className="relative isolate overflow-hidden bg-gradient-to-br from-[#18243b] via-[#2b315e] to-[#6546cb] p-6 text-white sm:p-9 md:flex md:min-h-[700px] md:flex-col md:justify-between md:p-10">
					<div
						aria-hidden="true"
						className="pointer-events-none absolute -end-20 -top-16 size-64 rounded-full border-[32px] border-white/[0.06]"
					/>
					<div
						aria-hidden="true"
						className="pointer-events-none absolute -bottom-24 -start-20 size-72 rounded-full bg-[#b7f486]/10 blur-3xl"
					/>
					<div className="relative">
						<div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-xs font-bold text-white/90 backdrop-blur-sm">
							<GraduationCap
								className="size-4 text-[#c7f89c]"
								aria-hidden="true"
							/>
							Abzar Kankor
						</div>
						<p className="mt-7 text-xs font-bold uppercase tracking-[0.16em] text-[#c7f89c]">
							{t("signupPromo.eyebrow")}
						</p>
						<h1 className="mt-3 max-w-sm text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
							{t("signupPromo.title")}
						</h1>
						<p className="mt-4 max-w-md text-sm leading-relaxed text-white/75 sm:text-base">
							{t("signupPromo.description")}
						</p>
						<ul className="mt-7 hidden space-y-4 md:block">
							<li className="flex items-start gap-3 text-sm leading-relaxed text-white/85">
								<span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#c7f89c]">
									<BookOpenCheck className="size-4" aria-hidden="true" />
								</span>
								<span>{t("signupPromo.benefitCourses")}</span>
							</li>
							<li className="flex items-start gap-3 text-sm leading-relaxed text-white/85">
								<span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#c7f89c]">
									<Sparkles className="size-4" aria-hidden="true" />
								</span>
								<span>{t("signupPromo.benefitRoadmaps")}</span>
							</li>
							<li className="flex items-start gap-3 text-sm leading-relaxed text-white/85">
								<span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#c7f89c]">
									<UsersRound className="size-4" aria-hidden="true" />
								</span>
								<span>{t("signupPromo.benefitCommunity")}</span>
							</li>
						</ul>
					</div>
					<div className="relative mt-6 hidden items-center gap-2 border-t border-white/15 pt-5 text-xs font-medium text-white/65 md:flex">
						<ShieldCheck className="size-4 text-[#c7f89c]" aria-hidden="true" />
						{t("signupPromo.footer")}
					</div>
				</aside>

				<main className="min-w-0 bg-background p-5 sm:p-8 lg:p-10">
					<div className="mb-6">
						<p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
							{t("signupPromo.accountTypeLabel")}
						</p>
						<div
							role="group"
							aria-label={t("signupPromo.accountTypeLabel")}
							className="grid grid-cols-3 gap-1.5 rounded-2xl border border-border/70 bg-muted/45 p-1.5"
						>
							{accountTypes.map((accountType) => (
								<button
									key={accountType.id}
									type="button"
									aria-pressed={type === accountType.id}
									onClick={() => selectAccountType(accountType.id)}
									className={cn(
										"min-h-10 rounded-xl px-1.5 py-2 text-[10px] font-semibold leading-tight transition-colors sm:px-2.5 sm:text-xs",
										type === accountType.id
											? "bg-background text-primary shadow-sm ring-1 ring-border/70"
											: "text-muted-foreground hover:text-foreground"
									)}
								>
									{accountType.label}
								</button>
							))}
						</div>
					</div>

					<div className="mb-6">
						<div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/8 px-3 py-1 text-xs font-bold text-primary">
							<Sparkles className="size-3.5" aria-hidden="true" />
							{t("signupPromo.eyebrow")}
						</div>
						<h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
							{pt.title}
						</h2>
						<p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
							{pt.subtitle}
						</p>
					</div>

					<form.AppForm>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								form.handleSubmit();
							}}
						>
							<FieldGroup className="gap-4">
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
									<form.SubmitButton className="min-h-12 w-full rounded-xl text-sm font-bold shadow-sm">
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

					<FieldDescription className="mt-5 px-1 text-center text-xs leading-relaxed text-muted-foreground">
						{t.rich("footer.agreeToTerms", {
							termsLink: (chunks) => (
								<Link href={routes.termsOfUse.page()}>{chunks}</Link>
							),
							privacyLink: (chunks) => (
								<Link href={routes.privacyPolicy.page()}>{chunks}</Link>
							),
						})}
					</FieldDescription>
				</main>
			</section>
		</div>
	);
}

import { Award, BookOpen, CalendarDays, ShieldCheck } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CertificateClaim } from "@/components/blocks/course";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import type { BaseParams } from "@/types/common.types";

export default async function MyCertificatesPage({
	params,
}: {
	params: Promise<BaseParams>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations("certificates.list");
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	// RLS restricts the query to the signed-in student's own certificates.
	const { data: certificates, error } = user
		? await supabase
				.from("certificates")
				.select(
					"id, course_id, course_title, verification_code, issued_at, created_at"
				)
				.eq("user_id", user.id)
				.order("created_at", { ascending: false })
		: { data: null, error: null };
	const dates = new Intl.DateTimeFormat(
		locale === "en" ? "en-US" : locale === "ps" ? "ps-AF" : "fa-AF",
		{ dateStyle: "medium" }
	);

	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-7 p-5 sm:p-8">
			<div>
				<h1 className="flex items-center gap-2 text-2xl font-bold">
					<Award className="size-7 text-primary" />
					{t("title")}
				</h1>
				<p className="mt-2 text-sm text-muted-foreground">{t("description")}</p>
			</div>
			{error ? (
				<div
					role="alert"
					className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive"
				>
					{t("loadError")}
				</div>
			) : !certificates?.length ? (
				<div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
					<Award className="size-12 text-primary/40" />
					<h2 className="font-semibold">{t("emptyTitle")}</h2>
					<p className="max-w-md text-sm text-muted-foreground">
						{t("emptyDescription")}
					</p>
					<Button asChild variant="outline" className="mt-2">
						<Link href={routes.d.myCourses.page()}>
							<BookOpen className="size-4" />
							{t("browseCourses")}
						</Link>
					</Button>
				</div>
			) : (
				<div className="grid gap-4 md:grid-cols-2">
					{certificates.map((certificate) => (
						<article
							key={certificate.id}
							className="overflow-hidden rounded-2xl border bg-card shadow-sm"
						>
							<div className="flex items-start gap-4 bg-[linear-gradient(120deg,#101a2c,#222340)] p-5 text-white">
								<span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#b7f486]">
									<Award className="size-6" />
								</span>
								<div className="min-w-0">
									<p className="text-xs font-medium text-[#b7f486]">
										{t("badge")}
									</p>
									<h2 className="mt-1 line-clamp-2 font-semibold">
										{certificate.course_title}
									</h2>
								</div>
							</div>
							<div className="space-y-4 p-5">
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<CalendarDays className="size-4" />
									{t("issuedAt", {
										date: dates.format(
											new Date(certificate.issued_at ?? certificate.created_at)
										),
									})}
								</div>
								{certificate.verification_code && (
									<div className="flex items-center gap-2 text-sm">
										<ShieldCheck className="size-4 text-emerald-600" />
										<span>{t("code")}</span>
										<code className="select-all font-mono text-xs" dir="ltr">
											{certificate.verification_code}
										</code>
									</div>
								)}
								<div className="flex flex-wrap gap-2 border-t pt-4">
									<CertificateClaim courseId={certificate.course_id} />
									{certificate.verification_code && (
										<Button asChild variant="outline" size="sm">
											<Link
												href={routes.verify.code.page({
													code: certificate.verification_code,
												})}
											>
												<ShieldCheck className="size-4" />
												{t("verify")}
											</Link>
										</Button>
									)}
								</div>
							</div>
						</article>
					))}
				</div>
			)}
		</div>
	);
}

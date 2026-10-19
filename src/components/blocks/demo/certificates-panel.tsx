"use client";

import {
	Award,
	CheckCircle2,
	ExternalLink,
	ShieldCheck,
	ShieldX,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { revokeCertificate } from "@/lib/demo/actions";
import { routes } from "@/lib/routes";
import { useDemo } from "./demo-context";
import { DemoEmpty, DemoHeading, DemoPanel } from "./demo-ui";

export function DemoCertificates() {
	const t = useTranslations("demo");
	const { state, actor, run, formatDate, setSection } = useDemo();
	const certificates = state.certificates.filter((item) => {
		if (actor.role === "admin") return true;
		if (actor.role === "student") return item.studentId === actor.id;
		const course = state.courses.find((entry) => entry.id === item.courseId);
		return actor.role === "teacher"
			? course?.teacherId === actor.id
			: course?.schoolId === actor.schoolId;
	});
	return (
		<>
			<DemoHeading
				eyebrow={t("certificates.eyebrow")}
				title={t("certificates.heading")}
				description={t("certificates.description")}
			/>
			{actor.role === "student" && (
				<DemoPanel className="mb-5 flex items-start gap-3 border-emerald-100 bg-emerald-50/50 p-5">
					<CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
					<p className="text-xs leading-7 text-emerald-900">
						{t("certificates.eligibility")}
					</p>
				</DemoPanel>
			)}
			{certificates.length ? (
				<div className="grid gap-5 lg:grid-cols-2">
					{certificates.map((certificate) => {
						const course = state.courses.find(
							(entry) => entry.id === certificate.courseId
						);
						const student = state.users.find(
							(entry) => entry.id === certificate.studentId
						);
						return course && student ? (
							<DemoPanel key={certificate.id} className="overflow-hidden p-0">
								<div className="relative flex min-h-[150px] items-center gap-4 overflow-hidden bg-[radial-gradient(circle_at_90%_15%,#584090_0%,transparent_44%),linear-gradient(130deg,#15233a,#252640)] p-6 text-white">
									<div className="relative z-10 flex size-16 shrink-0 items-center justify-center rounded-[24px] border border-white/20 bg-white/10">
										<Award className="size-8 text-[#b7f486]" />
									</div>
									<div className="relative z-10 min-w-0">
										<p className="text-[11px] font-bold text-[#b7f486]">
											{t("certificates.label")}
										</p>
										<h3 className="mt-2 line-clamp-2 text-lg font-extrabold">
											{course.title}
										</h3>
									</div>
									<Award className="absolute -bottom-12 end-5 size-44 rotate-12 text-white/5" />
								</div>
								<div className="p-5">
									<div className="grid grid-cols-2 gap-4 text-xs">
										<div>
											<p className="text-slate-400">
												{t("certificates.student")}
											</p>
											<p className="mt-1 font-bold text-[#19243b]">
												{student.name}
											</p>
										</div>
										<div>
											<p className="text-slate-400">
												{t("certificates.issued")}
											</p>
											<p className="mt-1 font-bold text-[#19243b]">
												{formatDate(certificate.issuedAt)}
											</p>
										</div>
									</div>
									<div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
										<code
											className="text-xs font-bold text-violet-700"
											dir="ltr"
										>
											{certificate.code}
										</code>
										{certificate.revokedAt ? (
											<span className="demo-status demo-status--suspended">
												{t("certificates.revoked")}
											</span>
										) : (
											<span className="demo-status demo-status--active">
												<ShieldCheck className="size-3" />
												{t("certificates.issuedStatus")}
											</span>
										)}
									</div>
									<div className="mt-4 flex flex-wrap gap-2">
										{certificate.revokedAt ? (
											<Button
												type="button"
												size="sm"
												className="demo-rounded"
												disabled
											>
												<ExternalLink className="size-4" />
												{t("certificates.view")}
											</Button>
										) : (
											<Button asChild size="sm" className="demo-rounded">
												<Link
													href={routes.demo.verify.page({
														code: certificate.code,
													})}
												>
													<ExternalLink className="size-4" />
													{t("certificates.view")}
												</Link>
											</Button>
										)}
										{actor.role === "admin" && (
											<Button
												type="button"
												variant="outline"
												size="sm"
												className="demo-rounded"
												onClick={() =>
													run((s, id) =>
														revokeCertificate(
															s,
															id,
															certificate.id,
															!certificate.revokedAt
														)
													)
												}
											>
												<ShieldX className="size-4" />
												{certificate.revokedAt
													? t("certificates.restore")
													: t("certificates.revoke")}
											</Button>
										)}
									</div>
								</div>
							</DemoPanel>
						) : null;
					})}
				</div>
			) : (
				<DemoEmpty
					icon={Award}
					title={t("certificates.empty")}
					description={t("certificates.emptyHint")}
					action={
						actor.role === "student" && (
							<Button
								type="button"
								className="demo-rounded"
								onClick={() => setSection("myCourses")}
							>
								{t("nav.myCourses")}
							</Button>
						)
					}
				/>
			)}
		</>
	);
}

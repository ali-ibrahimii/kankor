"use client";

import {
	ArrowLeft,
	Award,
	CheckCircle2,
	Printer,
	Search,
	ShieldX,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import QRCode from "qrcode";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useRouter } from "@/i18n/navigation";
import { verifyCertificate } from "@/lib/demo/actions";
import { DEMO_STORAGE_KEY, readDemoState } from "@/lib/demo/storage";
import type { DemoState } from "@/lib/demo/types";
import { routes } from "@/lib/routes";
import { DemoEmpty, DemoPanel } from "./demo-ui";

export function DemoCertificateView({ code }: { code: string }) {
	const t = useTranslations("demo");
	const locale = useLocale();
	const router = useRouter();
	// undefined = checking storage, null = no local demo state in this browser.
	const [state, setState] = React.useState<DemoState | null | undefined>(
		undefined
	);
	const [image, setImage] = React.useState("");
	const [query, setQuery] = React.useState(code);
	React.useEffect(() => {
		const sync = () => {
			try {
				if (!window.localStorage.getItem(DEMO_STORAGE_KEY)) {
					setState(null);
					return;
				}
			} catch {
				setState(null);
				return;
			}
			setState(readDemoState(window.localStorage));
		};
		sync();
		const onStorage = (event: StorageEvent) => {
			if (event.key === DEMO_STORAGE_KEY) sync();
		};
		window.addEventListener("storage", onStorage);
		return () => window.removeEventListener("storage", onStorage);
	}, []);
	React.useEffect(() => {
		if (typeof window === "undefined") return;
		QRCode.toDataURL(window.location.href, {
			width: 160,
			margin: 1,
			color: { dark: "#19243b", light: "#ffffff" },
		})
			.then(setImage)
			.catch(() => setImage(""));
	}, [code]);
	const certificate = state && verifyCertificate(state, code);
	const student = state?.users.find(
		(person) => person.id === certificate?.studentId
	);
	const course = state?.courses.find(
		(item) => item.id === certificate?.courseId
	);
	const issued = certificate
		? new Intl.DateTimeFormat(
				locale === "fa" ? "fa-AF" : locale === "ps" ? "ps-AF" : "en-GB",
				{ dateStyle: "long" }
			).format(new Date(certificate.issuedAt))
		: "";
	return (
		<main className="demo-surface min-h-screen px-4 py-8 sm:py-12">
			<div className="mx-auto max-w-4xl">
				<div className="demo-print-hide mb-6 flex flex-wrap items-center justify-between gap-3">
					<Link
						href={routes.demo.page()}
						className="inline-flex items-center gap-2 text-sm font-bold text-violet-700 hover:underline"
					>
						<ArrowLeft className="size-4 rtl:rotate-180" />
						{t("verify.back")}
					</Link>
					<span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
						{t("demoBadge")}
					</span>
				</div>
				<DemoPanel className="demo-print-hide mb-5 flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
					<div className="min-w-0 flex-1">
						<h1 className="text-lg font-extrabold text-[#19243b]">
							{t("verify.heading")}
						</h1>
						<p className="mt-1 text-xs leading-6 text-slate-500">
							{t("verify.browserOnly")}
						</p>
					</div>
					<form
						className="flex flex-col gap-2 sm:flex-row"
						onSubmit={(event) => {
							event.preventDefault();
							if (query.trim())
								router.push(routes.demo.verify.page({ code: query.trim() }));
						}}
					>
						<Input
							className="demo-input w-full sm:w-48"
							aria-label={t("verify.codeInput")}
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							required
						/>
						<Button type="submit" className="demo-rounded">
							<Search className="size-4" />
							{t("verify.check")}
						</Button>
					</form>
				</DemoPanel>
				{state === undefined ? (
					<DemoPanel className="p-12 text-center text-sm text-slate-500">
						{t("verify.loading")}
					</DemoPanel>
				) : certificate && student && course ? (
					<>
						<div className="demo-print-hide mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-emerald-800">
							<span className="flex items-center gap-2 text-xs font-bold">
								<CheckCircle2 className="size-4" />
								{t("verify.valid")}
							</span>
							<Button
								type="button"
								size="sm"
								variant="outline"
								className="demo-rounded bg-white"
								onClick={() => window.print()}
							>
								<Printer className="size-4" />
								{t("certificates.print")}
							</Button>
						</div>
						<article className="demo-print-certificate relative overflow-hidden rounded-[28px] border-[10px] border-[#17233a] bg-white p-4 text-center shadow-2xl shadow-indigo-950/10 sm:p-8">
							<div className="relative flex min-h-[530px] flex-col items-center justify-center overflow-hidden rounded-[18px] border-2 border-[#eee6cf] bg-[radial-gradient(circle_at_50%_35%,#fff_0%,#faf9ff_60%,#f7f6fc_100%)] px-5 py-10 sm:px-12">
								<span
									aria-hidden="true"
									className="pointer-events-none absolute -top-16 -start-16 size-52 rounded-full border-[25px] border-violet-100/70"
								/>
								<span
									aria-hidden="true"
									className="pointer-events-none absolute -bottom-20 -end-16 size-52 rounded-full border-[25px] border-emerald-100/70"
								/>
								<div className="relative z-10 flex size-16 items-center justify-center rounded-[22px] bg-[#17233a] text-[#b7f486]">
									<Award className="size-8" />
								</div>
								<p className="relative z-10 mt-5 text-xs font-bold tracking-[.22em] text-violet-600">
									{state.settings.siteName}
								</p>
								<h2 className="relative z-10 mt-6 text-3xl font-extrabold text-[#19243b] sm:text-4xl">
									{t("certificates.label")}
								</h2>
								<p className="relative z-10 mt-6 text-xs text-slate-500">
									{t("verify.presentedTo")}
								</p>
								<p className="relative z-10 mt-3 border-b border-violet-200 px-7 pb-2 text-2xl font-extrabold text-[#19243b] sm:text-3xl">
									{student.name}
								</p>
								<p className="relative z-10 mt-6 text-xs text-slate-500">
									{t("verify.forCompleting")}
								</p>
								<p className="relative z-10 mt-2 max-w-lg text-lg font-bold leading-8 text-[#352a6c] sm:text-xl">
									{course.title}
								</p>
								<div className="relative z-10 mt-8 flex w-full max-w-xl flex-col items-center justify-between gap-5 border-t border-slate-200 pt-6 sm:flex-row">
									<div className="text-center sm:text-start">
										<p className="text-[11px] text-slate-500">
											{t("certificates.issued")}
										</p>
										<p className="mt-1 text-sm font-bold text-[#19243b]">
											{issued}
										</p>
										<p
											className="mt-2 font-mono text-[11px] text-slate-500"
											dir="ltr"
										>
											{certificate.code}
										</p>
									</div>
									{image && (
										<img
											src={image}
											alt={t("verify.qrAlt")}
											width={82}
											height={82}
											className="rounded-lg bg-white p-1"
										/>
									)}
								</div>
								<p className="relative z-10 mt-5 text-[10px] font-bold text-violet-600">
									{t("verify.demoWatermark")}
								</p>
							</div>
						</article>
						<p className="demo-print-hide mt-4 text-center text-xs leading-6 text-slate-500">
							{t("verify.browserOnly")}
						</p>
					</>
				) : (
					<DemoEmpty
						icon={ShieldX}
						title={t("verify.invalid")}
						description={t("verify.invalidHint")}
					/>
				)}
			</div>
		</main>
	);
}

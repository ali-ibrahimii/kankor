import {
	Apple,
	ArrowDown,
	ArrowLeft,
	ArrowRight,
	BookOpen,
	Building,
	Cloud,
	FileText,
	GraduationCap,
	HardDrive,
	Library,
	Play,
	ShieldCheck,
	User,
	WifiOff,
	Zap,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { RevealGroup } from "@/components/blocks/reveal-group";
import { Link } from "@/i18n/navigation";
import { isRtl } from "@/i18n/routing";
import { serverEnv } from "@/lib/env/server-env";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

export default async function HomeContent({ locale }: { locale: string }) {
	const [t, ta] = await Promise.all([
		getTranslations({ locale, namespace: "landing" }),
		getTranslations({ locale, namespace: "app" }),
	]);

	const Arrow = isRtl(locale) ? ArrowLeft : ArrowRight;

	const instructorUrl = routes.auth.signup.page({ type: "instructor" });
	const schoolUrl = routes.auth.signup.page({ type: "school" });
	const signInUrl = routes.auth.login.page();
	const playStoreUrl = serverEnv.app.playStoreUrl;

	return (
		<div className="min-h-screen bg-white">
			{/* ── Hero ───────────────────────────────────────────── */}
			<section
				id="hero"
				className="relative overflow-hidden px-4 py-28 sm:px-6 sm:py-36 lg:px-8 lg:py-44"
				style={{
					background:
						"linear-gradient(135deg, #040f1e 0%, #0b2240 45%, #1051a0 100%)",
				}}
			>
				{/* dot grid */}
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0 opacity-[0.05]"
					style={{
						backgroundImage:
							"radial-gradient(circle, #ffffff 1px, transparent 1px)",
						backgroundSize: "32px 32px",
					}}
				/>
				{/* glow */}
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0"
					style={{
						background:
							"radial-gradient(ellipse 80% 60% at 50% 60%, rgba(20,97,184,0.4) 0%, transparent 70%)",
					}}
				/>

				<div className="relative mx-auto max-w-4xl text-center">
					<div
						className="mb-6 flex justify-center animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-500"
						style={{ animationDelay: "0ms" }}
					>
						<span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm">
							{t("hero.badge")}
						</span>
					</div>

					<h1
						className="mb-6 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-500"
						style={{ animationDelay: "100ms" }}
					>
						{t.rich("hero.heading", {
							accent: (chunks) => (
								<span className="text-blue-300">{chunks}</span>
							),
						})}
					</h1>

					<p
						className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-white/65 sm:text-xl animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-500"
						style={{ animationDelay: "200ms" }}
					>
						{t("hero.subtitle")}
					</p>

					<div
						className="flex flex-col items-center justify-center gap-3 sm:flex-row animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-500"
						style={{ animationDelay: "300ms" }}
					>
						<a
							href="#modules"
							className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-[#1461B8] shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.99] sm:w-auto"
						>
							{t("hero.ctaPrimary")}
							<ArrowDown className="size-4 shrink-0" />
						</a>
						<a
							href="#educators"
							className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:w-auto"
						>
							{t("hero.ctaSecondary")}
						</a>
					</div>

					<p
						className="mt-7 text-sm text-white/60 animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-500"
						style={{ animationDelay: "400ms" }}
					>
						{t("hero.signInPrompt")}{" "}
						<a
							href={signInUrl}
							className="text-white/70 underline underline-offset-2 transition-colors hover:text-white"
						>
							{t("hero.signInLink")}
						</a>
					</p>
				</div>
			</section>

			{/* ── Stats Strip ────────────────────────────────────── */}
			<div className="border-y border-gray-100 bg-white">
				<RevealGroup className="mx-auto grid max-w-7xl grid-cols-3 divide-x divide-gray-100 px-4 sm:px-6 lg:px-8 rtl:divide-x-reverse">
					{(
						[
							{ val: t("stats.flashcards"), label: t("stats.flashcardsLabel") },
							{ val: t("stats.offline"), label: t("stats.offlineLabel") },
							{ val: t("stats.modules"), label: t("stats.modulesLabel") },
						] as const
					).map((s, i) => (
						<div
							key={i}
							className="reveal-item flex flex-col items-center justify-center py-8 text-center"
							style={{ transitionDelay: `${i * 100}ms` }}
						>
							<span className="text-3xl font-bold text-[#1461B8] sm:text-4xl">
								{s.val}
							</span>
							<span className="mt-1.5 text-xs font-medium text-gray-500 sm:text-sm">
								{s.label}
							</span>
						</div>
					))}
				</RevealGroup>
			</div>

			{/* ── Download ───────────────────────────────────────── */}
			<section className="border-b border-gray-100 bg-white px-4 py-10 sm:px-6 lg:px-8">
				<RevealGroup className="mx-auto flex max-w-7xl flex-col items-center gap-6 sm:flex-row sm:justify-between">
					<div className="reveal-item">
						<p className="text-lg font-bold text-gray-900">
							{t("download.heading")}
						</p>
						<p className="mt-1 text-sm text-gray-500">
							{t("download.subtitle")}
						</p>
					</div>

					<div
						className="reveal-item flex flex-col gap-3 sm:flex-row"
						style={{ transitionDelay: "100ms" }}
					>
						{/* Google Play */}
						<a
							href={playStoreUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-3 rounded-xl bg-gray-900 px-5 py-3 text-white transition-colors hover:bg-gray-800 active:bg-gray-700"
						>
							<Play className="size-6 shrink-0 text-[#00e676]" />
							<div className="text-start leading-tight">
								<div className="text-[10px] font-normal text-white/70">
									{t("download.getItOn")}
								</div>
								<div className="text-sm font-semibold">Google Play</div>
							</div>
						</a>

						{/* App Store — coming soon */}
						<div
							className="inline-flex cursor-not-allowed items-center gap-3 rounded-xl bg-gray-100 px-5 py-3 text-gray-400"
							title={t("download.comingSoon")}
						>
							<Apple className="size-6 shrink-0" />
							<div className="text-start leading-tight">
								<div className="text-[10px] font-normal">
									{t("download.comingSoon")}
								</div>
								<div className="text-sm font-semibold">App Store</div>
							</div>
						</div>
					</div>
				</RevealGroup>
			</section>

			{/* ── App Modules ────────────────────────────────────── */}
			<section
				id="modules"
				className="bg-gray-50 px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
			>
				<RevealGroup className="mx-auto max-w-7xl">
					<div className="reveal-item mb-14 text-center">
						<h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
							{t("app.heading")}
						</h2>
						<p className="mx-auto max-w-2xl text-lg text-gray-500">
							{t("app.subtitle")}
						</p>
					</div>

					<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
						{(
							[
								{
									Icon: BookOpen,
									bg: "bg-blue-100",
									color: "text-blue-600",
									border: "border-blue-100",
									key: "school",
								},
								{
									Icon: Zap,
									bg: "bg-amber-100",
									color: "text-amber-600",
									border: "border-amber-100",
									key: "flashcards",
								},
								{
									Icon: FileText,
									bg: "bg-violet-100",
									color: "text-violet-600",
									border: "border-violet-100",
									key: "tests",
								},
								{
									Icon: Library,
									bg: "bg-emerald-100",
									color: "text-emerald-600",
									border: "border-emerald-100",
									key: "library",
								},
							] as const
						).map(({ Icon, bg, color, border, key }, i) => (
							<div
								key={i}
								className={cn(
									"reveal-item rounded-2xl border bg-white p-7 shadow-sm transition-shadow hover:shadow-md",
									border
								)}
								style={{ transitionDelay: `${(i + 1) * 100}ms` }}
							>
								<div className={cn("mb-5 inline-flex rounded-xl p-3", bg)}>
									<Icon className={cn("size-6", color)} />
								</div>
								<h3 className="mb-3 text-base font-semibold text-gray-900">
									{t(`app.${key}.title`)}
								</h3>
								<p className="text-sm leading-relaxed text-gray-500">
									{t(`app.${key}.description`)}
								</p>
							</div>
						))}
					</div>
				</RevealGroup>
			</section>

			{/* ── Offline Highlight ───────────────────────────────── */}
			<section
				className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
				style={{
					background:
						"linear-gradient(135deg, #040f1e 0%, #0b2240 50%, #0d2e55 100%)",
				}}
			>
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0 opacity-[0.04]"
					style={{
						backgroundImage:
							"radial-gradient(circle, #ffffff 1px, transparent 1px)",
						backgroundSize: "28px 28px",
					}}
				/>

				<RevealGroup className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
					{/* Left: text */}
					<div>
						<div className="reveal-item">
							<span className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/15 px-4 py-1.5 text-xs font-medium text-blue-300">
								<WifiOff className="size-3.5 shrink-0" />
								{t("offline.badgeLabel")}
							</span>
						</div>

						<h2
							className="reveal-item mt-5 text-3xl font-bold text-white sm:text-4xl"
							style={{ transitionDelay: "100ms" }}
						>
							{t("offline.heading")}
						</h2>
						<p
							className="reveal-item mt-4 text-lg leading-relaxed text-white/55"
							style={{ transitionDelay: "200ms" }}
						>
							{t("offline.subtitle")}
						</p>

						<ul className="mt-10 space-y-6">
							{(
								[
									{
										Icon: WifiOff,
										titleKey: "offline.point1Title",
										descKey: "offline.point1Desc",
										iconBg: "bg-blue-500/20",
										iconColor: "text-blue-300",
									},
									{
										Icon: HardDrive,
										titleKey: "offline.point2Title",
										descKey: "offline.point2Desc",
										iconBg: "bg-violet-500/20",
										iconColor: "text-violet-300",
									},
									{
										Icon: Cloud,
										titleKey: "offline.point3Title",
										descKey: "offline.point3Desc",
										iconBg: "bg-emerald-500/20",
										iconColor: "text-emerald-300",
									},
								] as const
							).map(({ Icon, titleKey, descKey, iconBg, iconColor }, i) => (
								<li
									key={i}
									className="reveal-item flex gap-4"
									style={{ transitionDelay: `${300 + i * 100}ms` }}
								>
									<div
										className={cn("mt-0.5 shrink-0 rounded-xl p-2.5", iconBg)}
									>
										<Icon className={cn("size-5 shrink-0", iconColor)} />
									</div>
									<div>
										<p className="font-semibold text-white">{t(titleKey)}</p>
										<p className="mt-1 text-sm leading-relaxed text-white/55">
											{t(descKey)}
										</p>
									</div>
								</li>
							))}
						</ul>
					</div>

					{/* Right: visual */}
					<div
						className="reveal-item flex items-center justify-center lg:justify-end"
						style={{ transitionDelay: "150ms" }}
					>
						<div className="relative w-full max-w-sm">
							<div
								aria-hidden="true"
								className="absolute inset-0 rounded-3xl blur-3xl"
								style={{ background: "rgba(20,97,184,0.25)" }}
							/>
							<div className="relative rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
								{/* Status bar */}
								<div className="mb-6 flex items-center justify-between">
									<div className="flex items-center gap-2">
										<div className="h-2 w-2 rounded-full bg-emerald-400" />
										<span className="text-xs text-white/60">
											{t("offline.badgeLabel")}
										</span>
									</div>
									<WifiOff className="size-4 text-white/30" />
								</div>

								{/* Module list */}
								<div className="space-y-3">
									{(
										[
											{
												Icon: BookOpen,
												bg: "bg-blue-500/20",
												color: "text-blue-300",
												key: "school",
											},
											{
												Icon: Zap,
												bg: "bg-amber-500/20",
												color: "text-amber-300",
												key: "flashcards",
											},
											{
												Icon: FileText,
												bg: "bg-violet-500/20",
												color: "text-violet-300",
												key: "tests",
											},
											{
												Icon: Library,
												bg: "bg-emerald-500/20",
												color: "text-emerald-300",
												key: "library",
											},
										] as const
									).map(({ Icon, bg, color, key }, i) => (
										<div
											key={i}
											className="flex items-center justify-between rounded-xl border border-white/8 bg-white/5 px-4 py-3"
										>
											<div className="flex items-center gap-3">
												<div className={cn("rounded-lg p-1.5", bg)}>
													<Icon className={cn("size-4", color)} />
												</div>
												<span className="text-sm text-white/80">
													{t(`app.${key}.title`)}
												</span>
											</div>
											<div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20">
												<div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
											</div>
										</div>
									))}
								</div>

								{/* Footer bar */}
								<div className="mt-6 rounded-xl border border-white/8 bg-white/5 px-4 py-3 text-center text-xs text-white/40">
									{t("offline.badgeLabel")} ✓
								</div>
							</div>
						</div>
					</div>
				</RevealGroup>
			</section>

			{/* ── Educators Section ───────────────────────────────── */}
			<section
				id="educators"
				className="bg-white px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
			>
				<RevealGroup className="mx-auto max-w-7xl">
					<div className="reveal-item mb-14 text-center">
						<h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
							{t("educators.heading")}
						</h2>
						<p className="mx-auto max-w-2xl text-lg text-gray-500">
							{t("educators.subtitle")}
						</p>
					</div>

					<div className="grid gap-6 lg:grid-cols-2">
						{/* Instructor card */}
						<div
							className="reveal-item relative overflow-hidden rounded-3xl p-8 text-white sm:p-10"
							style={{
								transitionDelay: "100ms",
								background: "linear-gradient(135deg, #1461B8 0%, #0a3d8a 100%)",
							}}
						>
							<div
								aria-hidden="true"
								className="pointer-events-none absolute -inset-e-6 -top-6 size-44 rounded-full bg-white/6"
							/>
							<div
								aria-hidden="true"
								className="pointer-events-none absolute -bottom-10 -inset-e-4 size-72 rounded-full bg-white/5"
							/>
							<div className="relative">
								<div className="mb-6 inline-flex rounded-2xl bg-white/15 p-3.5">
									<GraduationCap className="size-7" />
								</div>
								<h3 className="mb-3 text-2xl font-bold sm:text-3xl">
									{t("instructor.title")}
								</h3>
								<p className="mb-8 max-w-sm text-base leading-relaxed text-white/70">
									{t("instructor.description")}
								</p>
								<Link
									href={instructorUrl}
									className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#1461B8] transition-transform hover:scale-[1.02] active:scale-[0.98]"
								>
									{t("instructor.cta")}
									<Arrow className="size-4 shrink-0" />
								</Link>
							</div>
						</div>

						{/* School card */}
						<div
							className="reveal-item relative overflow-hidden rounded-3xl border border-gray-200 bg-gray-50 p-8 sm:p-10"
							style={{ transitionDelay: "200ms" }}
						>
							<div
								aria-hidden="true"
								className="pointer-events-none absolute -inset-e-6 -top-6 size-44 rounded-full bg-[#1461B8]/5"
							/>
							<div
								aria-hidden="true"
								className="pointer-events-none absolute -bottom-10 -inset-e-4 size-72 rounded-full bg-[#1461B8]/5"
							/>
							<div className="relative">
								<div className="mb-6 inline-flex rounded-2xl bg-[#1461B8]/10 p-3.5">
									<Building className="size-7 text-[#1461B8]" />
								</div>
								<h3 className="mb-3 text-2xl font-bold text-gray-900 sm:text-3xl">
									{t("school.title")}
								</h3>
								<p className="mb-8 max-w-sm text-base leading-relaxed text-gray-500">
									{t("school.description")}
								</p>
								<Link
									href={schoolUrl}
									className="inline-flex items-center gap-2 rounded-xl bg-[#1461B8] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#1050a0] hover:scale-[1.02] active:scale-[0.98]"
								>
									{t("school.cta")}
									<Arrow className="size-4 shrink-0" />
								</Link>
							</div>
						</div>
					</div>
				</RevealGroup>
			</section>

			{/* ── Data Transparency ──────────────────────────────── */}
			<section className="bg-[#f0f6ff] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
				<RevealGroup className="mx-auto max-w-4xl">
					<div className="reveal-item rounded-3xl border border-blue-100 bg-white p-8 shadow-sm sm:p-10">
						<div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
							{/* Left */}
							<div className="shrink-0 lg:w-52">
								<div className="mb-4 inline-flex rounded-2xl bg-blue-50 p-3.5">
									<ShieldCheck className="size-7 text-[#1461B8]" />
								</div>
								<h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
									{t("privacy.heading")}
								</h2>
								<p className="mt-2 text-sm leading-relaxed text-gray-500">
									{t("privacy.subtitle")}
								</p>
							</div>

							{/* Right: items */}
							<div className="flex-1 divide-y divide-gray-100">
								<div className="flex gap-4 pb-5">
									<div className="mt-0.5 shrink-0 rounded-lg bg-blue-100 p-1.5">
										<User className="size-4 text-[#1461B8]" />
									</div>
									<div>
										<p className="text-sm font-semibold text-gray-900">
											{t("privacy.googleTitle")}
										</p>
										<p className="mt-1 text-sm leading-relaxed text-gray-500">
											{t("privacy.googleDesc")}
										</p>
									</div>
								</div>
								<div className="flex gap-4 py-5">
									<div className="mt-0.5 shrink-0 rounded-lg bg-violet-100 p-1.5">
										<Zap className="size-4 text-violet-600" />
									</div>
									<div>
										<p className="text-sm font-semibold text-gray-900">
											{t("privacy.syncTitle")}
										</p>
										<p className="mt-1 text-sm leading-relaxed text-gray-500">
											{t("privacy.syncDesc")}
										</p>
									</div>
								</div>
								<div className="flex gap-4 pt-5">
									<div className="mt-0.5 shrink-0 rounded-lg bg-emerald-100 p-1.5">
										<BookOpen className="size-4 text-emerald-600" />
									</div>
									<div>
										<p className="text-sm font-semibold text-gray-900">
											{t("privacy.noSaleTitle")}
										</p>
										<p className="mt-1 text-sm leading-relaxed text-gray-500">
											{t("privacy.noSaleDesc")}
										</p>
									</div>
								</div>

								<div className="pt-6">
									<Link
										href={routes.privacyPolicy.page()}
										className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1461B8] hover:underline"
									>
										{t("privacy.policyLink")}
										<Arrow className="size-3.5 shrink-0" />
									</Link>
								</div>
							</div>
						</div>
					</div>
				</RevealGroup>
			</section>
		</div>
	);
}

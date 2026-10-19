import {
	ArrowLeft,
	ArrowRight,
	Award,
	BookOpen,
	Check,
	CloudDownload,
	FileText,
	Flame,
	GraduationCap,
	Library,
	Play,
	School,
	ShieldCheck,
	Sparkles,
	Target,
	Users,
	WifiOff,
	Zap,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { isRtl } from "@/i18n/routing";
import { serverEnv } from "@/lib/env/server-env";
import { routes } from "@/lib/routes";

export default async function HomeContent({ locale }: { locale: string }) {
	const [t, app] = await Promise.all([
		getTranslations({ locale, namespace: "landing" }),
		getTranslations({ locale, namespace: "app" }),
	]);
	const Arrow = isRtl(locale) ? ArrowLeft : ArrowRight;

	const modules = [
		{
			key: "school",
			icon: BookOpen,
			href: routes.courses.page(),
			art: "from-[#e8ddff] to-[#cfc7ff] text-[#6a46c7]",
			symbol: "∑",
		},
		{
			key: "flashcards",
			icon: Zap,
			href: routes.decks.page(),
			art: "from-[#def8e7] to-[#b9e6d4] text-[#2a8c68]",
			symbol: "✦",
		},
		{
			key: "tests",
			icon: FileText,
			href: routes.quizzes.page(),
			art: "from-[#ffe5d7] to-[#ffd2b6] text-[#c77849]",
			symbol: "✳",
		},
		{
			key: "library",
			icon: Library,
			href: routes.libraries.page(),
			art: "from-[#ddebff] to-[#b8dafa] text-[#4678c3]",
			symbol: "⌘",
		},
	] as const;

	const roles = [
		{
			icon: GraduationCap,
			title: t("showcase.studentTitle"),
			description: t("showcase.studentDescription"),
			feature: t("showcase.studentFeature"),
			cta: t("showcase.studentCta"),
			href: routes.auth.signup.page({ type: "student" }),
			tint: "bg-[#e8e0ff] text-[#6246be]",
		},
		{
			icon: BookOpen,
			title: t("instructor.title"),
			description: t("instructor.description"),
			feature: t("showcase.teacherFeature"),
			cta: t("instructor.cta"),
			href: routes.auth.signup.page({ type: "instructor" }),
			tint: "bg-[#dcf4e7] text-[#268064]",
		},
		{
			icon: School,
			title: t("school.title"),
			description: t("school.description"),
			feature: t("showcase.schoolFeature"),
			cta: t("school.cta"),
			href: routes.auth.signup.page({ type: "school" }),
			tint: "bg-[#e0ecff] text-[#427dc5]",
		},
	];

	return (
		<div className="min-h-screen overflow-hidden bg-[#f9faff] text-[#19243b] dark:bg-[#141b2c] dark:text-slate-100">
			<section className="mx-auto max-w-[1320px] px-4 pb-0 pt-4 sm:px-6 sm:pt-7 lg:px-8">
				<div className="relative isolate overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_13%_105%,rgba(94,207,173,.18),transparent_34%),radial-gradient(circle_at_94%_0%,rgba(137,100,255,.34),transparent_39%),linear-gradient(125deg,#101a2c_4%,#17233a_58%,#222340_100%)] px-5 py-12 text-white shadow-[0_32px_74px_-42px_rgba(14,19,49,.65)] sm:rounded-[36px] sm:px-9 sm:py-14 lg:px-14 lg:py-[78px]">
					<div
						aria-hidden="true"
						className="pointer-events-none absolute inset-0 opacity-[.16] [background-image:radial-gradient(rgba(255,255,255,.6)_.7px,transparent_.7px)] [background-size:23px_23px]"
					/>
					<div className="relative z-10 grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,.89fr)] lg:gap-14">
						<div className="max-w-[630px]">
							<span className="inline-flex flex-wrap items-center gap-2 rounded-full border border-white/15 bg-white/[.07] px-3.5 py-2 text-xs font-bold text-white/80">
								<Sparkles className="size-3.5 text-[#b7f486]" />
								{t("hero.badge")}
								<span className="mx-1 size-1 rounded-full bg-[#b7f486]" />
								{app("name")}
							</span>
							<h1 className="mt-6 text-[2.15rem] font-extrabold leading-[1.5] tracking-tight sm:text-[3.2rem] lg:text-[3.5rem]">
								{t.rich("hero.heading", {
									accent: (chunks) => (
										<span className="bg-gradient-to-l from-[#b7f486] via-[#7ce5d1] to-[#b8a4ff] bg-clip-text text-transparent">
											{chunks}
										</span>
									),
								})}
							</h1>
							<p className="mt-5 max-w-[550px] text-sm leading-8 text-white/65 sm:text-base sm:leading-9">
								{t("hero.subtitle")}
							</p>
							<div className="mt-8 flex flex-col gap-3 sm:flex-row">
								<Link
									href={routes.courses.page()}
									className="button-primary bg-[#b7f486] text-[#17233a] hover:bg-[#c9f8a2] hover:shadow-primary/25 shadow-black/20"
								>
									<Sparkles className="size-4" />
									{t("showcase.previewCta")}
									<Arrow className="size-4" />
								</Link>
								<Link
									href={routes.courses.page()}
									className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/[.07] px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/[.16]"
								>
									{t("hero.ctaPrimary")}
									<Arrow className="size-4" />
								</Link>
							</div>
							<div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-[11px] font-semibold text-white/65">
								{["featureOne", "featureTwo", "featureThree"].map((key) => (
									<span key={key} className="inline-flex items-center gap-2">
										<span className="flex size-5 items-center justify-center rounded-full bg-[#b7f486]/15 text-[#b7f486]">
											<Check className="size-3" />
										</span>
										{t(`showcase.${key}`)}
									</span>
								))}
							</div>
						</div>
						<div className="relative mx-auto w-full max-w-[485px] pb-9 pt-8 sm:px-5">
							<div
								aria-hidden="true"
								className="absolute -end-2 top-0 size-28 rounded-full bg-violet-500/35 blur-3xl"
							/>
							<div
								aria-hidden="true"
								className="absolute -start-2 bottom-0 size-28 rounded-full bg-emerald-300/20 blur-3xl"
							/>
							<div className="relative z-10 overflow-hidden rounded-[23px] border border-white/15 bg-[#0f182c]/85 shadow-[0_35px_70px_-25px_rgba(0,0,0,.65)] backdrop-blur-lg">
								<div className="flex items-center justify-between border-b border-white/10 px-5 py-4 text-[11px] font-semibold text-white/65">
									<span className="flex items-center gap-2">
										<Target className="size-4 text-[#b7f486]" />
										{t("showcase.previewTitle")}
									</span>
									<span className="flex items-center gap-1.5 text-[#b7f486]">
										<Flame className="size-3.5" />
										{t("showcase.previewBadge")}
									</span>
								</div>
								<div className="p-5 sm:p-6">
									<div className="flex items-start justify-between">
										<div>
											<p className="text-[11px] text-white/45">
												{t("showcase.progress")}
											</p>
											<p className="mt-1.5 text-lg font-extrabold">
												{t("showcase.previewHeading")}
											</p>
										</div>
										<span className="rounded-full bg-[#b7f486]/15 px-2.5 py-1 text-xs font-bold text-[#b7f486]">
											۷۶٪
										</span>
									</div>
									<div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
										<div className="h-full w-[76%] rounded-full bg-gradient-to-r from-[#b7f486] to-[#7ce5d1]" />
									</div>
									<div className="mt-6 space-y-4">
										([
											{ key: "subjectMath", value: 84, color: "#b7f486" },
											{ key: "subjectPhysics", value: 65, color: "#a58cff" },
											{ key: "subjectBio", value: 72, color: "#7ce5d1" },
										] as const).map((item) => (
											<div key={item.key}>
												<div className="mb-2 flex items-center justify-between text-[11px]">
													<span className="font-semibold text-white/75">
														{t(`showcase.${item.key}`)}
													</span>
													<span className="text-white/45">{item.value}٪</span>
												</div>
												<div className="h-1.5 overflow-hidden rounded-full bg-white/10">
													<div
														className="h-full rounded-full"
														style={{
															width: `${item.value}%`,
															background: item.color,
														}}
													/>
												</div>
											</div>
										))}
									</div>
									<div className="mt-6 grid grid-cols-2 gap-2">
										<div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.05] p-3">
											<span className="rounded-xl bg-[#b7f486]/15 p-2 text-[#b7f486]">
												<BookOpen className="size-4" />
											</span>
											<span>
												<strong className="block text-xs">۱۲ / ۱۶</strong>
												<small className="block text-[10px] text-white/45">
													{t("showcase.lessons")}
												</small>
											</span>
										</div>
										<div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.05] p-3">
											<span className="rounded-xl bg-violet-400/15 p-2 text-violet-200">
												<Zap className="size-4" />
											</span>
											<span>
												<strong className="block text-xs">۸۵٪</strong>
												<small className="block text-[10px] text-white/45">
													{t("showcase.quiz")}
												</small>
											</span>
										</div>
									</div>
								</div>
							</div>
							<div className="absolute -start-2 top-0 z-20 flex items-center gap-2 rounded-2xl border border-white/15 bg-[#26324b]/95 px-4 py-3 text-[11px] font-bold shadow-xl backdrop-blur sm:-start-3">
								<span className="rounded-xl bg-[#b7f486]/15 p-2 text-[#b7f486]">
									<Sparkles className="size-4" />
								</span>
								{t("showcase.startHere")}
							</div>
							<div className="absolute -end-2 bottom-0 z-20 flex items-center gap-2 rounded-2xl border border-white/15 bg-[#26324b]/95 px-4 py-3 shadow-xl backdrop-blur sm:-end-3">
								<span className="rounded-xl bg-[#b7f486]/15 p-2 text-[#b7f486]">
									<Users className="size-4" />
								</span>
								<span>
									<strong className="block text-xs">۲٬۴۸۰+</strong>
									<small className="block text-[10px] text-white/50">
										{t("showcase.students")}
									</small>
								</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="mx-auto grid max-w-[1320px] grid-cols-2 gap-3 px-4 pt-5 sm:px-6 lg:grid-cols-4 lg:px-8">
				([
					{
						value: t("stats.flashcards"),
						label: t("stats.flashcardsLabel"),
						icon: Zap,
						tint: "bg-[#eee8ff] text-[#6b4dd7]",
					},
					{
						value: t("stats.offline"),
						label: t("stats.offlineLabel"),
						icon: WifiOff,
						tint: "bg-[#e1f6ec] text-[#258263]",
					},
					{
						value: t("stats.modules"),
						label: t("stats.modulesLabel"),
						icon: BookOpen,
						tint: "bg-[#e6f1ff] text-[#3a79c2]",
					},
					{
						value: t("showcase.statsRoles"),
						label: t("showcase.statsRolesLabel"),
						icon: Users,
						tint: "bg-[#ffeddf] text-[#c87949]",
					},
				] as const).map((item) => (
					<div
						key={item.label}
						className="soft-card flex items-center gap-3 p-4 sm:px-5"
					>
						<span
							className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${item.tint}`}
						>
							<item.icon className="size-5" />
						</span>
						<div>
							<p className="text-xl font-extrabold text-[#1d2841] sm:text-2xl">
								{item.value}
							</p>
							<p className="mt-0.5 text-[11px] text-slate-500">{item.label}</p>
						</div>
					</div>
				))}
			</section>

			<section
				id="modules"
				className="mx-auto max-w-[1320px] px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
			>
				<div className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
					<div>
						<span className="section-kicker">
							{t("showcase.modulesLabel")}
						</span>
						<h2 className="section-title">
							{t("app.heading")}
						</h2>
						<p className="section-copy">
							{t("app.subtitle")}
						</p>
					</div>
					<Link
						href={routes.courses.page()}
						className="inline-flex items-center gap-2 self-start text-sm font-bold text-primary hover:underline"
					>
						{t("showcase.previewCta")}
						<Arrow className="size-4" />
					</Link>
				</div>
				<div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
					{modules.map(({ key, icon: Icon, href, art, symbol }) => (
						<Link
							key={key}
							href={href}
							className="soft-card card-hover flex flex-col overflow-hidden"
						>
							<div
								className={`relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br ${art}`}
							>
								<span className="absolute -end-12 -top-14 size-44 rounded-full border-2 border-white/45 shadow-[0_0_0_35px_rgba(255,255,255,.13)]" />
								<span className="font-serif text-[5rem] font-bold opacity-80">
									{symbol}
								</span>
								<span className="absolute bottom-4 start-4 flex size-11 items-center justify-center rounded-2xl bg-white/60 shadow-sm">
									<Icon className="size-5" />
								</span>
							</div>
							<div className="flex flex-1 flex-col p-5">
								<h3 className="text-base font-extrabold text-[#19243b]">
									{t(`app.${key}.title`)}
								</h3>
								<p className="mt-3 line-clamp-3 text-xs leading-7 text-slate-500">
									{t(`app.${key}.description`)}
								</p>
								<span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-xs font-bold text-[#694bd2]">
									{t("showcase.explore")}
									<Arrow className="size-4 transition-transform group-hover:translate-x-[-3px] ltr:group-hover:translate-x-[3px]" />
								</span>
							</div>
						</Link>
					))}
				</div>
			</section>

			<section className="border-y border-[#e9eaf2] bg-white/75 py-20 dark:border-white/10 dark:bg-[#1b2438] sm:py-24">
				<div className="mx-auto grid max-w-[1320px] items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-8">
					<div className="relative mx-auto w-full max-w-lg rounded-[30px] bg-[#e9e2ff] p-5 sm:p-8">
						<div className="absolute -start-3 -top-5 flex size-20 items-center justify-center rounded-[26px] bg-[#b7f486] text-[#23304a] shadow-lg shadow-[#273953]/10">
							<CloudDownload className="size-9" />
						</div>
						<div className="rounded-[25px] border border-white/65 bg-white p-5 shadow-[0_24px_50px_-31px_rgba(40,32,96,.35)] sm:p-7">
							<div className="flex items-center justify-between border-b border-slate-100 pb-4">
								<span className="flex items-center gap-2 text-sm font-extrabold text-[#19243b]">
									<WifiOff className="size-5 text-[#6a4bd4]" />
									{t("offline.badgeLabel")}
								</span>
								<span className="size-2 rounded-full bg-[#57d4a7]" />
							</div>
							(["school", "flashcards", "tests"] as const).map((key, index) => (
								<div
									key={key}
									className="mt-4 flex items-center gap-3 rounded-2xl bg-[#f8f7fd] p-3"
								>
									<span
										className={`flex size-10 items-center justify-center rounded-xl ${
											index === 0
												? "bg-[#e6ddff] text-violet-600"
												: index === 1
													? "bg-[#dcf5e7] text-emerald-600"
													: "bg-[#ffe7d8] text-orange-600"
										}`}
									>
										{index === 0 ? (
											<BookOpen className="size-5" />
										) : index === 1 ? (
											<Zap className="size-5" />
										) : (
											<FileText className="size-5" />
										)}
									</span>
									<span className="flex-1 text-xs font-bold text-slate-700">
										{t(`app.${key}.title`)}
									</span>
									<Check className="size-4 text-emerald-600" />
								</div>
							))}
						</div>
					</div>
					<div>
						<span className="inline-flex rounded-full bg-[#eef9ec] px-3 py-1.5 text-[11px] font-bold text-[#297b58]">
							{t("showcase.offlineLabel")}
						</span>
						<h2 className="mt-5 text-[1.9rem] font-extrabold leading-[1.5] sm:text-[2.5rem]">
							{t("offline.heading")}
						</h2>
						<p className="mt-4 max-w-lg text-sm leading-8 text-slate-500 dark:text-slate-400">
							{t("offline.subtitle")}
						</p>
						<div className="mt-7 space-y-5">
							([1, 2, 3] as const).map((num) => (
								<div key={num} className="flex items-start gap-3">
									<span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#e8f7e7] text-emerald-700">
										<Check className="size-4" />
									</span>
									<div>
										<h3 className="text-sm font-bold">
											{t(`offline.point${num}Title`)}
										</h3>
										<p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">
											{t(`offline.point${num}Desc`)}
										</p>
									</div>
								</div>
							))}
						</div>
						<a
							href={serverEnv.app.playStoreUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-[#17233a] px-5 py-3 text-xs font-bold text-white transition hover:bg-[#293c5e]"
						>
							<Play className="size-4" />
							{t("download.getItOn")} Google Play
						</a>
					</div>
				</div>
			</section>

			<section
				id="educators"
				className="mx-auto max-w-[1320px] px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
			>
				<div className="mx-auto mb-10 max-w-2xl text-center">
					<span className="section-kicker">
						{t("showcase.educatorLabel")}
					</span>
					<h2 className="section-title text-center mt-4">
						{t("educators.heading")}
					</h2>
					<p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400 mx-auto max-w-xl">
						{t("educators.subtitle")}
					</p>
				</div>
				<div className="grid gap-5 lg:grid-cols-3">
					{roles.map((item) => (
						<div
							key={item.title}
							className="soft-card flex flex-col p-6 sm:p-7"
						>
							<span
								className={`flex size-14 items-center justify-center rounded-[20px] ${item.tint}`}
							>
								<item.icon className="size-7" />
							</span>
							<h3 className="mt-6 text-lg font-extrabold text-[#19243b]">
								{item.title}
							</h3>
							<p className="mt-3 flex-1 text-xs leading-7 text-slate-500">
								{item.description}
							</p>
							<p className="mt-4 flex items-center gap-2 text-[11px] font-bold text-emerald-700">
								<Check className="size-4" />
								{item.feature}
							</p>
							<Link
								href={item.href}
								className="mt-6 inline-flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-xs font-bold text-[#19243b] transition hover:border-violet-300 hover:bg-violet-50"
							>
								{item.cta}
								<Arrow className="size-4" />
							</Link>
						</div>
					))}
				</div>
			</section>

			<section className="mx-auto max-w-[1320px] px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
				<div className="relative isolate overflow-hidden rounded-[30px] bg-[radial-gradient(circle_at_80%_15%,#413c82,transparent_42%),linear-gradient(130deg,#141f34,#222a46)] px-6 py-12 text-center text-white sm:px-10 sm:py-16">
					<div
						aria-hidden="true"
						className="pointer-events-none absolute -start-16 -top-28 size-72 rounded-full border-[45px] border-white/[.035]"
					/>
					<Award className="mx-auto size-9 text-[#b7f486]" />
					<h2 className="mx-auto mt-5 max-w-2xl text-2xl font-extrabold leading-[1.5] sm:text-3xl">
						{t("showcase.ctaHeading")}
					</h2>
					<p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/60">
						{t("showcase.ctaDescription")}
					</p>
					<div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
						<Link
							href={routes.courses.page()}
							className="button-primary bg-[#b7f486] text-[#17233a] hover:bg-[#c9f8a2] hover:shadow-primary/25 shadow-black/20"
						>
							{t("showcase.previewCta")}
							<Arrow className="size-4" />
						</Link>
						<Link
							href={routes.courses.page()}
							className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/20 px-6 py-3 text-sm font-bold text-white hover:bg-white/10"
						>
							{t("showcase.ctaSecondary")}
						</Link>
					</div>
				</div>
			</section>
		</div>
	);
}

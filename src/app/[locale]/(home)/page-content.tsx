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
	Play,
	School,
	Sparkles,
	Target,
	Users,
	WifiOff,
	Zap,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n";
import { Link } from "@/i18n/navigation";
import { isRtl } from "@/i18n/routing";
import { serverEnv } from "@/lib/env/server-env";
import { routes } from "@/lib/routes";
import {
	HomeCourseCard,
	HomeFlashcardDeckCard,
	HomeGeneralBookCard,
	HomeKankorFormCard,
	HomeSchoolBookCard,
} from "./_components/home-cards";
import type { HomeCatalogData } from "./_components/home-catalog-data";
import { HorizontalCardSection } from "./_components/horizontal-card-section";
import { PartnerInstitutionsSection } from "./_components/partner-institutions-section";

export default async function HomeContent({
	locale,
	catalog,
}: {
	locale: Locale;
	catalog: HomeCatalogData;
}) {
	const [t, app] = await Promise.all([
		getTranslations({ locale, namespace: "landing" }),
		getTranslations({ locale, namespace: "app" }),
	]);

	const Arrow = isRtl(locale) ? ArrowLeft : ArrowRight;
	const viewMoreLabel = t("shelves.viewMore");

	const stats = [
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
	] as const;

	const subjects = [
		{
			key: "subjectMath",
			value: 84,
			color: "#b7f486",
		},
		{
			key: "subjectPhysics",
			value: 65,
			color: "#a58cff",
		},
		{
			key: "subjectBio",
			value: 72,
			color: "#7ce5d1",
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
	] as const;

	const offlineModules = ["school", "flashcards", "tests"] as const;
	const offlinePoints = [1, 2, 3] as const;
	const heroFeatures = ["featureOne", "featureTwo", "featureThree"] as const;

	return (
		<div className="min-h-screen overflow-x-clip bg-[#f9faff] text-[#19243b] dark:bg-[#141b2c] dark:text-slate-100">
			{/* Hero */}
			<section className="mx-auto max-w-[1320px] px-4 pt-4 pb-0 sm:px-6 sm:pt-7 lg:px-8">
				<div className="relative isolate overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_13%_105%,rgba(94,207,173,.18),transparent_34%),radial-gradient(circle_at_94%_0%,rgba(137,100,255,.34),transparent_39%),linear-gradient(125deg,#101a2c_4%,#17233a_58%,#222340_100%)] px-5 py-12 text-white shadow-[0_32px_74px_-42px_rgba(14,19,49,.65)] sm:rounded-[36px] sm:px-9 sm:py-14 lg:px-14 lg:py-[68px]">
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
									className="button-primary bg-[#b7f486] text-[#17233a] shadow-black/20 hover:bg-[#c9f8a2] hover:shadow-primary/25"
								>
									<Sparkles className="size-4" />

									{t("showcase.previewCta")}

									<Arrow className="size-4" />
								</Link>

								<Link
									href={routes.auth.signup.page()}
									className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/[.07] px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/[.16]"
								>
									{t("hero.ctaPrimary")}

									<Arrow className="size-4" />
								</Link>
							</div>

							<div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-[11px] font-semibold text-white/65">
								{heroFeatures.map((key) => (
									<span key={key} className="inline-flex items-center gap-2">
										<span className="flex size-5 items-center justify-center rounded-full bg-[#b7f486]/15 text-[#b7f486]">
											<Check className="size-3" />
										</span>

										{t(`showcase.${key}`)}
									</span>
								))}
							</div>
						</div>

						{/* Hero study progress preview card */}
						<div className="relative mx-auto w-full max-w-[485px] pt-8 pb-9 sm:px-5">
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
										{subjects.map((item) => (
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
															backgroundColor: item.color,
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

			{/* Stats */}
			<section className="mx-auto grid max-w-[1320px] grid-cols-2 gap-3 px-4 pt-5 pb-3 sm:px-6 lg:grid-cols-4 lg:px-8">
				{stats.map(({ value, label, icon: Icon, tint }) => (
					<div
						key={label}
						className="soft-card flex items-center gap-3 p-4 sm:px-5"
					>
						<span
							className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${tint}`}
						>
							<Icon className="size-5" />
						</span>

						<div>
							<p className="text-xl font-extrabold text-[#1d2841] sm:text-2xl dark:text-slate-100">
								{value}
							</p>

							<p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
								{label}
							</p>
						</div>
					</div>
				))}
			</section>

			{/* 1. School Courses Horizontal Row — Video Lesson Card Design */}
			<HorizontalCardSection
				id="school-courses"
				title={t("shelves.courses.title")}
				subtitle={t("shelves.courses.subtitle")}
				viewMoreHref={routes.courses.page()}
				viewMoreLabel={viewMoreLabel}
			>
				{catalog.courses.map(({ item, href }) => (
					<HomeCourseCard key={item.id} course={item} href={href} />
				))}
			</HorizontalCardSection>

			{/* 2. Official School Textbooks Horizontal Row — Book-Spine Layout */}
			<HorizontalCardSection
				id="school-books"
				title={t("shelves.schoolBooks.title")}
				subtitle={t("shelves.schoolBooks.subtitle")}
				viewMoreHref={routes.libraries.page()}
				viewMoreLabel={viewMoreLabel}
				surface="tinted"
			>
				{catalog.schoolBooks.map(({ item, href }) => (
					<HomeSchoolBookCard key={item.id} book={item} href={href} />
				))}
			</HorizontalCardSection>

			{/* 3. General Books & Guides Horizontal Row — Editorial Overlay Design */}
			<HorizontalCardSection
				id="general-books"
				title={t("shelves.generalBooks.title")}
				subtitle={t("shelves.generalBooks.subtitle")}
				viewMoreHref={catalog.generalBooksMoreHref}
				viewMoreLabel={viewMoreLabel}
			>
				{catalog.generalBooks.map(({ item, href }) => (
					<HomeGeneralBookCard key={item.id} book={item} href={href} />
				))}
			</HorizontalCardSection>

			{/* 4. Smart Flashcards Horizontal Row — Stacked Deck Card Design */}
			<HorizontalCardSection
				id="flashcards"
				title={t("shelves.decks.title")}
				subtitle={t("shelves.decks.subtitle")}
				viewMoreHref={routes.decks.page()}
				viewMoreLabel={viewMoreLabel}
				surface="tinted"
			>
				{catalog.decks.map(({ item, href }) => (
					<HomeFlashcardDeckCard key={item.id} deck={item} href={href} />
				))}
			</HorizontalCardSection>

			{/* 5. General Kankor Forms Horizontal Row — Structured Exam Sheet Design */}
			<HorizontalCardSection
				id="kankor-forms"
				title={t("shelves.kankorForms.title")}
				subtitle={t("shelves.kankorForms.subtitle")}
				viewMoreHref={routes.quizzes.page()}
				viewMoreLabel={viewMoreLabel}
			>
				{catalog.kankorForms.map(({ item, href }) => (
					<HomeKankorFormCard key={item.id} quiz={item} href={href} />
				))}
			</HorizontalCardSection>

			{/* 6. Collaborating Universities & Schools — Campus Card Design */}
			<PartnerInstitutionsSection
				institutions={catalog.partners}
				labels={{
					title: t("partners.title"),
					subtitle: t("partners.subtitle"),
					ctaTitle: t("partners.ctaTitle"),
					ctaSubtitle: t("partners.ctaSubtitle"),
					ctaButton: t("partners.ctaButton"),
				}}
			/>

			{/* Offline Mobile App Highlight */}
			<section className="py-16 sm:py-22">
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

							{offlineModules.map((key, index) => (
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
							{offlinePoints.map((num) => (
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

			{/* Educators */}
			<section
				id="educators"
				className="mx-auto max-w-[1320px] px-4 py-14 sm:px-6 lg:px-8 lg:py-22"
			>
				<div className="mx-auto mb-10 max-w-2xl text-center">
					<span className="section-kicker">{t("showcase.educatorLabel")}</span>

					<h2 className="section-title mt-4 text-center">
						{t("educators.heading")}
					</h2>

					<p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500 dark:text-slate-400">
						{t("educators.subtitle")}
					</p>
				</div>

				<div className="grid gap-5 lg:grid-cols-3">
					{roles.map(
						({ icon: Icon, title, description, feature, cta, href, tint }) => (
							<div key={title} className="soft-card flex flex-col p-6 sm:p-7">
								<span
									className={`flex size-14 items-center justify-center rounded-[20px] ${tint}`}
								>
									<Icon className="size-7" />
								</span>

								<h3 className="mt-6 text-lg font-extrabold text-[#19243b] dark:text-slate-100">
									{title}
								</h3>

								<p className="mt-3 flex-1 text-xs leading-7 text-slate-500 dark:text-slate-400">
									{description}
								</p>

								<p className="mt-4 flex items-center gap-2 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
									<Check className="size-4" />

									{feature}
								</p>

								<Link
									href={href}
									className="mt-6 inline-flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-xs font-bold text-[#19243b] transition hover:border-violet-300 hover:bg-violet-50 dark:border-white/10 dark:text-slate-100 dark:hover:border-violet-400 dark:hover:bg-violet-400/10"
								>
									{cta}

									<Arrow className="size-4" />
								</Link>
							</div>
						)
					)}
				</div>
			</section>

			{/* Final CTA */}
			<section className="mx-auto max-w-[1320px] px-4 pb-20 sm:px-6 lg:px-8 lg:pb-24">
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
							className="button-primary bg-[#b7f486] text-[#17233a] shadow-black/20 hover:bg-[#c9f8a2] hover:shadow-primary/25"
						>
							{t("showcase.previewCta")}

							<Arrow className="size-4" />
						</Link>

						<Link
							href={routes.courses.page()}
							className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
						>
							{t("showcase.ctaSecondary")}
						</Link>
					</div>
				</div>
			</section>
		</div>
	);
}

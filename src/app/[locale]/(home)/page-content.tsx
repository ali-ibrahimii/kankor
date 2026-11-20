import {
	ArrowLeft,
	ArrowRight,
	BookOpen,
	Check,
	CloudDownload,
	FileText,
	GraduationCap,
	Play,
	School,
	Star,
	Users,
	WifiOff,
	Zap,
} from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import {
	EduleArrowDoodle,
	EduleStitch,
} from "@/components/widgets/edule-sprites";
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
import { ShelfChips } from "./_components/shelf-chips";
import { ShelfSearchBox } from "./_components/shelf-search-box";

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

	return (
		<div className="min-h-screen overflow-x-clip bg-white text-[#19243b] dark:bg-[#141b2c] dark:text-slate-100">
			{/* Hero — EduLe light-mint template skin */}
			<section className="bg-[#eaf6ef] dark:bg-[#12241b]">
				<div className="relative mx-auto max-w-[1320px] px-4 pt-6 pb-12 sm:px-6 sm:pt-8 sm:pb-16 lg:px-8 lg:pt-12 lg:pb-20">
					{/* difyuzel stitches */}
					<EduleStitch className="absolute start-10 top-10 hidden rotate-[14deg] sm:block" />
					<EduleStitch className="absolute start-44 top-4 hidden -rotate-6 sm:block" />
					<EduleStitch className="absolute bottom-16 start-6 hidden rotate-3 lg:block" />

					<div className="relative grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,44%)] lg:gap-6">
						{/* Copy */}
						<div className="relative z-10">
							<p className="text-[13px] font-bold text-emerald-900/70 sm:text-sm dark:text-emerald-300/80">
								{t("hero.eyebrow")}
							</p>

							<h1 className="mt-3 max-w-[560px] text-[1.85rem] font-black leading-[1.55] tracking-tight text-[#17332b] sm:text-[2.4rem] lg:text-[2.75rem] dark:text-slate-100">
								{t.rich("hero.heading", {
									accent: (chunks) => (
										<span className="relative inline-block text-[#1d9a63] dark:text-emerald-400">
											{chunks}

											<span
												aria-hidden="true"
												className="absolute inset-x-0 -bottom-1 h-[3px] rounded-full bg-[#1d9a63]/55 dark:bg-emerald-400/50"
											/>
										</span>
									),
								})}
							</h1>

							<p className="mt-4 max-w-[500px] text-sm leading-7 text-slate-600 sm:leading-8 dark:text-slate-400">
								{t("hero.subtitle")}
							</p>

							<div className="mt-7 flex flex-col gap-3 sm:flex-row">
								<Link
									href={routes.courses.page()}
									className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-edule-green px-7 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-edule-green/90"
								>
									{t("hero.ctaCourses")}
								</Link>

								<Link
									href={routes.auth.signup.page()}
									className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-700/25 bg-white/70 px-6 text-sm font-bold text-emerald-800 backdrop-blur-sm transition hover:bg-white dark:border-emerald-400/25 dark:bg-white/5 dark:text-emerald-300 dark:hover:bg-white/10"
								>
									{t("user.signUp")}

									<Arrow className="size-4" />
								</Link>
							</div>
						</div>

						{/* Student illustration + floating bubbles */}
						<div className="relative mx-auto w-full max-w-[440px] lg:max-w-none">
							<div className="relative aspect-[922/980] w-full">
								<Image
									src="/images/hero/hero-cutout.png"
									alt={t("hero.imageAlt")}
									fill
									priority
									sizes="(max-width: 1024px) 88vw, 44vw"
									className="object-contain object-bottom"
								/>
							</div>

							{/* 1,235 Courses bubble */}
							<div className="absolute start-1 top-3 flex size-24 flex-col items-center justify-center rounded-full bg-[#17845a] text-center text-white shadow-xl shadow-emerald-900/25 sm:size-28 dark:bg-emerald-700">
								<strong className="text-lg font-black sm:text-xl">
									{t("hero.badgeCoursesValue")}
								</strong>

								<span className="text-[10px] font-bold text-white/80">
									{t("hero.badgeCoursesLabel")}
								</span>
							</div>

							{/* 4.8 Rating bubble */}
							<div className="absolute end-0 top-0 flex items-center gap-2 rounded-full bg-white/90 py-2 ps-2 pe-3.5 shadow-lg shadow-emerald-900/10 backdrop-blur-sm dark:bg-white/10 sm:-top-1 sm:end-2">
								<span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-amber-500">
									<Star className="size-3.5 fill-amber-400" />
								</span>

								<span className="leading-tight">
									<strong className="block text-sm font-black text-[#17332b] dark:text-slate-100">
										{t("hero.ratingTitle")}
									</strong>

									<small className="block text-[9px] text-slate-500 dark:text-slate-400">
										{t("hero.ratingLabel")}
									</small>
								</span>
							</div>

							{/* hand-drawn arrow toward the illustration */}
							<EduleArrowDoodle className="absolute start-2 top-[42%] hidden -scale-x-100 lg:block rtl:scale-x-100" />
						</div>
					</div>
				</div>
			</section>

			{/* Stats */}
			<section className="mx-auto grid max-w-[1320px] grid-cols-2 gap-3 px-4 pt-6 pb-3 sm:px-6 lg:grid-cols-4 lg:px-8">
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
			{catalog.courses.length > 0 && (
				<HorizontalCardSection
					id="school-courses"
					title={t("shelves.courses.title")}
					subtitle={t("shelves.courses.subtitle")}
					viewMoreHref={routes.courses.page()}
					viewMoreLabel={viewMoreLabel}
					searchSlot={
						<ShelfSearchBox
							placeholder={t("user.searchPlaceholder")}
							searchLabel={t("user.searchPlaceholder")}
						/>
					}
					chipsSlot={<ShelfChips />}
				>
					{catalog.courses.map(({ item, href }) => (
						<HomeCourseCard key={item.id} course={item} href={href} />
					))}
				</HorizontalCardSection>
			)}

			{/* 2. Official School Textbooks Horizontal Row — Book-Spine Layout */}
			{catalog.schoolBooks.length > 0 && (
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
			)}

			{/* 3. General Books & Guides Horizontal Row — Editorial Overlay Design */}
			{catalog.generalBooks.length > 0 && (
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
			)}

			{/* 4. Smart Flashcards Horizontal Row — Stacked Deck Card Design */}
			{catalog.decks.length > 0 && (
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
			)}

			{/* 5. General Kankor Forms Horizontal Row — Structured Exam Sheet Design */}
			{catalog.kankorForms.length > 0 && (
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
			)}

			{/* EduLe "Other Courses" pill */}
			<div className="flex justify-center pb-2">
				<Link
					href={routes.courses.page()}
					className="inline-flex min-h-11 items-center justify-center rounded-full border border-emerald-600/35 bg-white px-6 text-[13px] font-extrabold text-emerald-800 shadow-sm transition hover:bg-edule-green hover:text-white dark:border-emerald-400/30 dark:bg-white/5 dark:text-emerald-300 dark:hover:bg-edule-green dark:hover:text-white"
				>
					{t("footer.otherCourses")}
				</Link>
			</div>

			{/* 6. Collaborating Universities & Schools — Campus Card Design */}
			{catalog.partners.length > 0 && (
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
			)}

			{/* Offline Mobile App Highlight */}
			<section className="py-16 sm:py-22">
				<div className="mx-auto grid max-w-[1320px] items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-8">
					<div className="relative mx-auto w-full max-w-lg rounded-[30px] bg-[#dcf4e7] p-5 sm:p-8">
						<div className="absolute -start-3 -top-5 flex size-20 items-center justify-center rounded-[26px] bg-edule-green text-white shadow-lg shadow-emerald-600/25">
							<CloudDownload className="size-9" />
						</div>

						<div className="rounded-[25px] border border-white/65 bg-white p-5 shadow-[0_24px_50px_-31px_rgba(40,32,96,.35)] sm:p-7">
							<div className="flex items-center justify-between border-b border-slate-100 pb-4">
								<span className="flex items-center gap-2 text-sm font-extrabold text-[#19243b]">
									<WifiOff className="size-5 text-[#1d9a63]" />

									{t("offline.badgeLabel")}
								</span>

								<span className="size-2 rounded-full bg-[#57d4a7]" />
							</div>

							{offlineModules.map((key, index) => (
								<div
									key={key}
									className="mt-4 flex items-center gap-3 rounded-2xl bg-[#f2faf4] p-3"
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
							className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-edule-green px-5 py-3 text-xs font-bold text-white transition hover:bg-edule-green/90"
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

			{/* Final CTA — EduLe mint banner with hand-drawn arrow */}
			<section className="mx-auto max-w-[1320px] px-4 pt-10 pb-20 sm:px-6 lg:px-8 lg:pb-24">
				<div className="relative isolate overflow-hidden rounded-[26px] bg-[#eaf6ef] px-6 py-12 sm:px-12 sm:py-14 dark:bg-[#12241b]">
					<EduleStitch className="absolute start-8 top-6 hidden rotate-[10deg] sm:block" />
					<EduleStitch className="absolute bottom-8 start-24 hidden -rotate-6 sm:block" />
					<EduleStitch className="absolute start-10 top-1/2 hidden rotate-45 lg:block" />

					<div className="relative z-10 flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
						<div className="max-w-xl">
							<p className="text-sm font-bold text-emerald-900/70 dark:text-emerald-300/80">
								{t("footer.tagline")}
							</p>

							<h2 className="mt-3 text-2xl font-black leading-[1.55] text-[#17332b] sm:text-3xl dark:text-slate-100">
								{t.rich("showcase.ctaHeading", {
									accent: (chunks) => (
										<span className="relative inline-block text-[#1d9a63] dark:text-emerald-400">
											{chunks}

											<span
												aria-hidden="true"
												className="absolute inset-x-0 -bottom-1 h-[3px] rounded-full bg-[#1d9a63]/55 dark:bg-emerald-400/50"
											/>
										</span>
									),
								})}
							</h2>

							<p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
								{t("showcase.ctaDescription")}
							</p>
						</div>

						<EduleArrowDoodle className="hidden xl:block" />

						<div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
							<Link
								href={routes.courses.page()}
								className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-edule-green px-7 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-edule-green/90"
							>
								{t("showcase.previewCta")}

								<Arrow className="size-4" />
							</Link>

							<Link
								href={routes.courses.page()}
								className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-700/25 bg-white/70 px-6 text-sm font-bold text-emerald-800 transition hover:bg-white dark:border-emerald-400/25 dark:bg-white/5 dark:text-emerald-300 dark:hover:bg-white/10"
							>
								{t("showcase.ctaSecondary")}
							</Link>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}

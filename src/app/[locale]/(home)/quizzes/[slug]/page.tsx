import {
	ArrowLeft,
	ArrowRight,
	BookOpen,
	CheckCircle2,
	ClipboardCheck,
	Clock,
	FileText,
	Info,
	MessageCircle,
	Repeat,
	Sparkles,
	Target,
} from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BookmarkButton } from "@/components/blocks/bookmarks";
import { CatalogCourseCard } from "@/components/blocks/course";
import { PublicDeckCard } from "@/components/blocks/decks/public-deck-card";
import { ResourceDiscussionView } from "@/components/blocks/discussions/ResourceDiscussionView";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { buildEntityMetadata } from "@/features/seo";
import type { Locale } from "@/i18n";
import { Link } from "@/i18n/navigation";
import { isRtl } from "@/i18n/routing";
import { isSupabaseServerConfigured, serverEnv } from "@/lib/env/server-env";
import { routes } from "@/lib/routes";
import { safeJsonLd } from "@/lib/seo/json-ld";
import { createClient } from "@/lib/supabase/server";
import { cn, decodeSlugParam } from "@/lib/utils";
import type { BaseParams } from "@/types/common.types";
import type { QuizDetail } from "@/types/queries.types";
import { QuizDetailActions } from "./_components/quiz-detail-actions";

export const revalidate = 86400;

async function fetchPublicQuiz(rawSlug: string) {
	const slug = decodeSlugParam(rawSlug);
	if (!isSupabaseServerConfigured) return null;

	const client = await createClient();
	const { data, error } = await client
		.rpc("get_quiz_details", { p_quiz_slug: slug })
		.single();

	if (error || !data || data.visibility !== "public") return null;
	return data as QuizDetail;
}

export async function generateMetadata({
	params,
}: {
	params: Promise<BaseParams & { slug: string }>;
}) {
	const { slug, locale } = await params;
	const quiz = await fetchPublicQuiz(slug);
	if (!quiz) return {};

	const t = await getTranslations({ locale, namespace: "quizzes" });

	return buildEntityMetadata({
		seoTitle: quiz.seo_title,
		seoDescription: quiz.seo_description,
		fallbackTitle: `${quiz.title} | ${t("title")}`,
		fallbackDescription: quiz.description || t("description"),
		path: routes.quizzes.slug.page({ slug: quiz.slug ?? quiz.id }),
		locale,
	});
}

export default async function QuizDetailPage({
	params,
}: {
	params: Promise<BaseParams & { slug: string }>;
}) {
	const { slug, locale } = await params;
	setRequestLocale(locale);

	const quiz = await fetchPublicQuiz(slug);
	if (!quiz || !isSupabaseServerConfigured) {
		notFound();
	}

	const supabase = await createClient();
	const [t, s] = await Promise.all([
		getTranslations({ locale, namespace: "quizzes" }),
		getTranslations({ locale, namespace: "seo" }),
	]);
	const BackArrow = isRtl(locale as Locale) ? ArrowRight : ArrowLeft;
	const baseUrl = serverEnv.app.address.replace(/\/$/, "");

	const schoolId = quiz.school_id;
	const selectedCourseIds = quiz.related_courses_ids || [];
	const selectedDeckIds = quiz.related_decks_ids || [];

	const [relatedCoursesRes, relatedDecksRes] = await Promise.all([
		supabase.rpc("get_related_courses", {
			p_related_ids: selectedCourseIds,
			p_school_id: schoolId || undefined,
			p_limit: 3,
		}),
		supabase.rpc("get_related_decks", {
			p_related_ids: selectedDeckIds,
			p_school_id: schoolId || undefined,
			p_limit: 3,
		}),
	]);

	const relatedCourses = relatedCoursesRes.data || [];
	const relatedDecks = relatedDecksRes.data || [];

	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "Quiz",
		name: quiz.title,
		description: quiz.description || undefined,
		timeRequired:
			quiz.time_limit_minutes != null
				? `PT${quiz.time_limit_minutes}M`
				: undefined,
		publisher: {
			"@type": "Organization",
			name: "Abzar Kankor",
			url: baseUrl,
		},
	};

	const breadcrumbJsonLd = {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: [
			{
				"@type": "ListItem",
				position: 1,
				name: s("home"),
				item: `${baseUrl}/${locale}`,
			},
			{
				"@type": "ListItem",
				position: 2,
				name: s("quizzes"),
				item: `${baseUrl}/${locale}/quizzes`,
			},
			{
				"@type": "ListItem",
				position: 3,
				name: quiz.title,
				item: `${baseUrl}/${locale}/quizzes/${quiz.slug ?? quiz.id}`,
			},
		],
	};

	const durationValue =
		quiz.time_limit_minutes != null
			? t("timeLimitMinutes", { count: quiz.time_limit_minutes })
			: t("hub.detail.flexible");

	const passingValue =
		quiz.passing_score_percentage != null
			? t("passingScore", { percent: quiz.passing_score_percentage })
			: `${50}%`;

	const attemptsValue =
		quiz.max_attempts != null
			? t("maxAttempts", { count: quiz.max_attempts })
			: t("hub.detail.unlimited");

	const specRows = [
		{
			key: "duration",
			icon: Clock,
			label: t("hub.detail.durationLabel"),
			value: durationValue,
			iconTint:
				"bg-[#faf6ee] text-[#02656b] dark:bg-violet-400/15 dark:text-violet-200",
		},
		{
			key: "passing",
			icon: Target,
			label: t("hub.detail.passingLabel"),
			value: passingValue,
			iconTint:
				"bg-[#e8eeea] text-[#02656b] dark:bg-emerald-400/15 dark:text-emerald-200",
		},
		{
			key: "attempts",
			icon: Repeat,
			label: t("hub.detail.attemptsLabel"),
			value: attemptsValue,
			iconTint:
				"bg-[#faf6ee] text-[#02656b] dark:bg-sky-400/15 dark:text-sky-200",
		},
	] as const;

	return (
		<div className="min-h-screen bg-[#faf6ee] text-[#3b2621] dark:bg-[#251c19] dark:text-slate-100">
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
			/>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
			/>

			{/* Breadcrumb Strip (matching courses/[slug]) */}
			<div className="border-b border-[#faf6ee] bg-white/80 dark:border-white/10 dark:bg-[#3b2621]">
				<div className="mx-auto max-w-[1320px] px-4 py-4 sm:px-6 lg:px-8">
					<Breadcrumb>
						<BreadcrumbList className="flex flex-wrap items-center gap-2 text-xs">
							<BreadcrumbItem>
								<BreadcrumbLink asChild>
									<Link
										href={routes.home.page()}
										className="font-medium text-slate-500 transition-colors hover:text-primary dark:text-slate-400"
									>
										{s("home")}
									</Link>
								</BreadcrumbLink>
							</BreadcrumbItem>

							<BreadcrumbSeparator />

							<BreadcrumbItem>
								<BreadcrumbLink asChild>
									<Link
										href={routes.quizzes.page()}
										className="font-medium text-slate-500 transition-colors hover:text-primary dark:text-slate-400"
									>
										{s("quizzes")}
									</Link>
								</BreadcrumbLink>
							</BreadcrumbItem>

							<BreadcrumbSeparator />

							<BreadcrumbItem>
								<BreadcrumbPage className="max-w-[220px] truncate font-bold text-primary sm:max-w-md dark:text-violet-300">
									{quiz.title}
								</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>
			</div>

			{/* Main Content */}
			<div className="mx-auto max-w-[1320px] space-y-14 px-4 pt-7 pb-24 sm:px-6 lg:px-8">
				{/* Back + Bookmark Top Bar */}
				<div className="flex items-center justify-between gap-4">
					<Link
						href={routes.quizzes.page()}
						className="-ms-2 inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-[#3b2621] dark:text-slate-400 dark:hover:bg-white/[.06] dark:hover:text-white"
					>
						<BackArrow className="size-4" />
						<span>{t("backToList")}</span>
					</Link>

					<BookmarkButton itemType="quiz" itemId={quiz.id} />
				</div>

				{/* Asymmetric Main + Sticky Registration Grid */}
				<div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_370px] lg:gap-10">
					{/* Main Exam Narrative Column */}
					<div className="min-w-0 space-y-6">
						{/* Signature Deep-Navy Exam Banner */}
						<header className="relative isolate overflow-hidden rounded-[26px] border border-white/10 bg-[#251c19] bg-[radial-gradient(circle_at_8%_110%,rgba(94,207,173,.2),transparent_38%),radial-gradient(circle_at_90%_-10%,rgba(137,100,255,.35),transparent_44%),linear-gradient(125deg,#251c19_4%,#3b2621_58%,#3b2621_100%)] p-6 text-white shadow-[0_32px_74px_-44px_rgba(14,19,49,.7)] sm:rounded-[32px] sm:p-9 lg:p-10">
							<div
								aria-hidden="true"
								className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(rgba(255,255,255,.12)_0.7px,transparent_0.7px)] bg-size-[24px_24px]"
							/>
							<div
								aria-hidden="true"
								className="pointer-events-none absolute -end-16 -top-20 -z-10 size-64 rounded-full border-[40px] border-white/[.03]"
							/>

							<div className="flex flex-wrap items-center gap-2">
								<span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[.08] px-3 py-1 text-xs font-bold text-white/90">
									<ClipboardCheck className="size-3.5 text-[#afa5a6]" />
									{t("title")}
								</span>

								{quiz.is_free ? (
									<span className="inline-flex items-center gap-1 rounded-full bg-[#afa5a6] px-3 py-1 text-xs font-extrabold text-[#3b2621]">
										<Sparkles className="size-3" />
										{t("free")}
									</span>
								) : (
									<span className="inline-flex items-center rounded-full border border-white/20 bg-white/[.1] px-3 py-1 text-xs font-bold text-white">
										{t("priceCredits", { count: quiz.price_credits ?? 0 })}
									</span>
								)}
							</div>

							<h1 className="mt-5 text-2xl font-black leading-[1.42] tracking-tight text-white sm:text-3xl lg:text-4xl">
								{quiz.title}
							</h1>

							{quiz.description && (
								<p className="mt-4 max-w-2xl text-sm leading-8 text-white/72 sm:text-base">
									{quiz.description}
								</p>
							)}

							{/* 3 Glass Stat Tiles */}
							<dl className="mt-7 grid gap-3 sm:grid-cols-3">
								{specRows.map(({ key, icon: Icon, label, value }) => (
									<div
										key={key}
										className="rounded-2xl border border-white/10 bg-white/[.055] p-4 backdrop-blur-sm"
									>
										<dt className="flex items-center gap-2 text-[11px] font-medium text-white/55">
											<Icon className="size-3.5 text-[#afa5a6]" />
											<span>{label}</span>
										</dt>
										<dd className="mt-2 text-sm font-extrabold text-white sm:text-base">
											{value}
										</dd>
									</div>
								))}
							</dl>
						</header>

						{/* Instructions Card */}
						{quiz.instructions && (
							<section className="soft-card border-[#e8eeea] bg-white p-6 sm:p-8 dark:border-white/10 dark:bg-[#3b2621]">
								<div className="flex items-center gap-3">
									<span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#faf6ee] text-[#02656b] dark:bg-violet-400/15 dark:text-violet-200">
										<FileText className="size-5" />
									</span>
									<h2 className="text-lg font-extrabold text-[#3b2621] sm:text-xl dark:text-slate-100">
										{t("instructions")}
									</h2>
								</div>

								<p className="mt-4 whitespace-pre-line text-sm leading-8 text-slate-600 dark:text-slate-300">
									{quiz.instructions}
								</p>
							</section>
						)}

						{/* Passing Criteria & Guidance Card */}
						<section className="soft-card border-[#e8eeea] bg-white p-6 sm:p-8 dark:border-white/10 dark:bg-[#3b2621]">
							<div className="flex items-center gap-3">
								<span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#e8eeea] text-[#02656b] dark:bg-emerald-400/15 dark:text-emerald-200">
									<CheckCircle2 className="size-5" />
								</span>
								<h2 className="text-lg font-extrabold text-[#3b2621] sm:text-xl dark:text-slate-100">
									{s("passingCriteria")}
								</h2>
							</div>

							<p className="mt-4 text-sm leading-8 text-slate-600 dark:text-slate-300">
								{s("passingCriteriaText", {
									percent: quiz.passing_score_percentage ?? 50,
									count: quiz.max_attempts ?? 1,
								})}
								{quiz.time_limit_minutes != null && (
									<> {s("timeLimitText", { count: quiz.time_limit_minutes })}</>
								)}
							</p>

							<div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#faf6ee] bg-[#faf6ee] px-4 py-3.5 text-xs leading-7 text-slate-600 dark:border-white/10 dark:bg-[#251c19]/75 dark:text-slate-300">
								<Info className="mt-1 size-4 shrink-0 text-primary dark:text-violet-300" />
								<span>{t("askInstructorForCode")}</span>
							</div>
						</section>
					</div>

					{/* Sticky Registration Sidebar Card */}
					<aside className="soft-card border-[#e8eeea] bg-white p-6 sm:p-7 lg:sticky lg:top-28 dark:border-white/10 dark:bg-[#3b2621]">
						<div className="flex items-center justify-between gap-3">
							<span
								className={cn(
									"inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold",
									quiz.registration_open
										? "border-[#e8eeea] bg-[#faf6ee] text-[#02656b] dark:border-emerald-400/25 dark:bg-emerald-400/12 dark:text-emerald-200"
										: "border-slate-200 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/[.06] dark:text-slate-400"
								)}
							>
								<span
									className={cn(
										"size-2 rounded-full",
										quiz.registration_open
											? "bg-[#02656b] dark:bg-emerald-400"
											: "bg-slate-400"
									)}
								/>
								{quiz.registration_open
									? t("hub.detail.statusOpen")
									: t("hub.detail.statusClosed")}
							</span>

							<span className="text-lg font-black text-[#3b2621] dark:text-slate-100">
								{quiz.is_free
									? t("free")
									: t("priceCredits", { count: quiz.price_credits ?? 0 })}
							</span>
						</div>

						<h2 className="mt-5 text-base font-extrabold text-[#3b2621] dark:text-slate-100">
							{t("hub.detail.registrationTitle")}
						</h2>

						<dl className="mt-4 divide-y divide-slate-100 border-y border-slate-100 dark:divide-white/[.08] dark:border-white/[.08]">
							{specRows.map(({ key, icon: Icon, label, value, iconTint }) => (
								<div
									key={key}
									className="flex items-center justify-between gap-3 py-3 text-xs"
								>
									<dt className="flex items-center gap-2.5 font-medium text-slate-500 dark:text-slate-400">
										<span
											className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${iconTint}`}
										>
											<Icon className="size-3.5" />
										</span>
										<span>{label}</span>
									</dt>
									<dd className="font-extrabold text-[#3b2621] dark:text-slate-100">
										{value}
									</dd>
								</div>
							))}
						</dl>

						<div className="mt-6">
							<QuizDetailActions quiz={quiz} />
						</div>
					</aside>
				</div>

				{/* Related Courses & Flashcard Decks */}
				{(relatedCourses.length > 0 || relatedDecks.length > 0) && (
					<section className="space-y-6 border-t border-[#faf6ee] pt-12 dark:border-white/10">
						<div className="flex items-center gap-3.5">
							<span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#faf6ee] text-[#02656b] dark:bg-violet-400/15 dark:text-violet-200">
								<BookOpen className="size-5" />
							</span>
							<h2 className="text-xl font-extrabold tracking-tight text-[#3b2621] sm:text-2xl dark:text-slate-100">
								{s("relatedResources")}
							</h2>
						</div>

						<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
							{relatedCourses.map((course) => (
								<CatalogCourseCard
									key={course.id}
									course={course as any}
									href={routes.courses.slug.page({
										slug: course.slug ?? course.id,
									})}
								/>
							))}
							{relatedDecks.map((deck) => (
								<PublicDeckCard key={deck.id} deck={deck} />
							))}
						</div>
					</section>
				)}

				{/* Public Discussions */}
				<section className="space-y-6 border-t border-[#faf6ee] pt-12 dark:border-white/10">
					<div className="flex items-center gap-3.5">
						<span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#faf6ee] text-[#02656b] dark:bg-sky-400/15 dark:text-sky-200">
							<MessageCircle className="size-5" />
						</span>
						<h2 className="text-xl font-extrabold tracking-tight text-[#3b2621] sm:text-2xl dark:text-slate-100">
							{s("discussions")}
						</h2>
					</div>

					<div className="soft-card border-[#e8eeea] bg-white p-5 sm:p-7 dark:border-white/10 dark:bg-[#3b2621]">
						<ResourceDiscussionView
							resource_type="quiz"
							resource_id={quiz.id}
							publicView={true}
						/>
					</div>
				</section>
			</div>
		</div>
	);
}

import {
	ArrowRight,
	BookOpen,
	MapPin,
	School,
	Sparkles,
	Users,
} from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { resolveCoverSrc } from "@/components/blocks/course";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import type { BaseParams } from "@/types/common.types";

export default async function SchoolPublicPage({
	params,
}: {
	params: Promise<BaseParams & { school_id: string }>;
}) {
	const { locale, school_id } = await params;
	setRequestLocale(locale);
	const t = await getTranslations({ locale, namespace: "publicProfile" });
	const supabase = await createClient();
	const { data: school } = await supabase
		.from("schools")
		.select("id, name, address, province_id")
		.eq("id", school_id)
		.maybeSingle();
	if (!school) notFound();
	const [{ data: courses }, { data: province }, { count: students }] =
		await Promise.all([
			supabase
				.from("courses")
				.select(
					"id, slug, title, subtitle, cover_image_url, price, is_free, estimated_duration_hours"
				)
				.eq("school_id", school.id)
				.eq("is_published", true)
				.order("published_at", { ascending: false }),
			school.province_id
				? supabase
						.from("provinces")
						.select("name")
						.eq("id", school.province_id)
						.maybeSingle()
				: Promise.resolve({ data: null }),
			supabase
				.from("profiles")
				.select("id", { count: "exact", head: true })
				.eq("school_id", school.id)
				.eq("role", "student"),
		]);
	return (
		<main className="min-h-screen bg-[#f8f9fd] px-4 py-10 text-[#19243b] dark:bg-[#141b2c] dark:text-slate-100 sm:px-6 sm:py-16 lg:px-8">
			<div className="mx-auto max-w-6xl">
				<section className="relative overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_90%_5%,rgba(139,119,255,.4),transparent_32%),linear-gradient(125deg,#121d32,#252b49)] p-6 text-white shadow-xl sm:p-10 lg:p-12">
					<div className="absolute -end-12 -top-20 size-64 rounded-full border-[42px] border-white/[.06]" />
					<div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
						<div>
							<span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-[#c6f69d]">
								<School className="size-4" />
								{t("schoolLabel")}
							</span>
							<h1 className="mt-5 text-3xl font-black sm:text-5xl">
								{school.name || t("schoolLabel")}
							</h1>
							{province?.name && (
								<p className="mt-3 inline-flex items-center gap-1.5 text-sm text-white/65">
									<MapPin className="size-4" />
									{province.name}
									{school.address ? ` · ${school.address}` : ""}
								</p>
							)}
						</div>
						<div className="flex gap-3">
							<div className="rounded-2xl border border-white/10 bg-white/[.08] px-4 py-3">
								<BookOpen className="mb-2 size-5 text-[#c6f69d]" />
								<strong className="block text-xl">
									{courses?.length || 0}
								</strong>
								<small className="text-xs text-white/60">
									{t("coursesCount")}
								</small>
							</div>
							<div className="rounded-2xl border border-white/10 bg-white/[.08] px-4 py-3">
								<Users className="mb-2 size-5 text-[#b9a8ff]" />
								<strong className="block text-xl">{students || 0}</strong>
								<small className="text-xs text-white/60">{t("learners")}</small>
							</div>
						</div>
					</div>
				</section>
				<section className="mt-8 grid gap-7 lg:grid-cols-[.8fr_1.2fr]">
					<article className="h-fit rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#1b2438] sm:p-8">
						<h2 className="flex items-center gap-2 text-xl font-extrabold">
							<Sparkles className="size-5 text-violet-600" />
							{t("about")}
						</h2>
						<p className="mt-4 text-sm leading-8 text-slate-600 dark:text-slate-300">
							{t("schoolIntro", { name: school.name || t("schoolLabel") })}
						</p>
					</article>
					<div>
						<div className="mb-5">
							<p className="text-xs font-bold uppercase tracking-wider text-violet-600">
								{t("learning")}
							</p>
							<h2 className="mt-2 text-2xl font-black">{t("schoolCourses")}</h2>
						</div>
						{courses?.length ? (
							<div className="grid gap-4 sm:grid-cols-2">
								{courses.map((course) => {
									const cover = resolveCoverSrc(course.cover_image_url);
									return (
										<Link
											key={course.id}
											href={`/courses/${course.slug || course.id}`}
											className="group overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm transition dark:border-white/10 dark:bg-[#1b2438] hover:-translate-y-1 hover:shadow-lg"
										>
											<div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-blue-200 to-emerald-100">
												{cover && (
													<Image
														src={cover}
														alt={course.title}
														fill
														className="object-cover transition group-hover:scale-105"
														sizes="(max-width: 640px) 100vw, 50vw"
													/>
												)}
												<span className="absolute start-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-violet-700">
													{course.is_free
														? t("free")
														: `${course.price ?? 0} ${t("credits")}`}
												</span>
											</div>
											<div className="p-5">
												<h3 className="font-extrabold leading-6 group-hover:text-violet-700">
													{course.title}
												</h3>
												{course.subtitle && (
													<p className="mt-2 line-clamp-2 text-xs leading-6 text-slate-500">
														{course.subtitle}
													</p>
												)}
												<div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
													<span className="inline-flex items-center gap-1.5">
														<BookOpen className="size-3.5" />
														{course.estimated_duration_hours || 0} {t("hours")}
													</span>
													<ArrowRight className="size-4 transition group-hover:translate-x-1 rtl:rotate-180" />
												</div>
											</div>
										</Link>
									);
								})}
							</div>
						) : (
							<div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
								{t("emptyCourses")}
							</div>
						)}
					</div>
				</section>
			</div>
		</main>
	);
}

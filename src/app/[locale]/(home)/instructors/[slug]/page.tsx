import {
	ArrowRight,
	BookOpen,
	Globe2,
	GraduationCap,
	MapPin,
	Sparkles,
} from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { resolveCoverSrc } from "@/components/blocks/course";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import type { BaseParams } from "@/types/common.types";

export default async function InstructorPublicPage({
	params,
}: {
	params: Promise<BaseParams & { slug: string }>;
}) {
	const { locale, slug } = await params;
	setRequestLocale(locale);
	const t = await getTranslations({ locale, namespace: "publicProfile" });
	const supabase = await createClient();
	const { data: teacher } = await supabase
		.from("profiles")
		.select("id, full_name, bio, avatar_url, website_url, province_id")
		.eq("slug", decodeURIComponent(slug))
		.eq("role", "instructor")
		.maybeSingle();
	if (!teacher) notFound();
	const [{ data: courses }, { data: province }] = await Promise.all([
		supabase
			.from("courses")
			.select(
				"id, slug, title, subtitle, cover_image_url, price, is_free, estimated_duration_hours"
			)
			.eq("instructor_id", teacher.id)
			.eq("is_published", true)
			.order("published_at", { ascending: false }),
		teacher.province_id
			? supabase
					.from("provinces")
					.select("name")
					.eq("id", teacher.province_id)
					.maybeSingle()
			: Promise.resolve({ data: null }),
	]);
	const initials = teacher.full_name?.trim().slice(0, 1) || "؟";
	return (
		<main className="min-h-screen bg-[#f8f9fd] px-4 pt-8 pb-10 text-[#19243b] dark:bg-[#141b2c] dark:text-slate-100 sm:px-6 sm:pt-10 sm:pb-16 lg:px-8">
			<div className="mx-auto max-w-6xl">
				<section className="relative overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_92%_5%,rgba(183,244,134,.24),transparent_28%),linear-gradient(125deg,#121d32,#2c294c)] p-6 text-white shadow-xl sm:p-10 lg:p-12">
					<div className="absolute -end-16 -bottom-28 size-72 rounded-full border-[44px] border-white/[.05]" />
					<div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
						<Avatar className="size-24 border-4 border-white/20 shadow-xl sm:size-32">
							<AvatarImage
								src={teacher.avatar_url || undefined}
								alt={teacher.full_name || ""}
							/>
							<AvatarFallback className="bg-violet-200 text-3xl font-black text-violet-800">
								{initials}
							</AvatarFallback>
						</Avatar>
						<div className="min-w-0 flex-1">
							<span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-[#c6f69d]">
								<GraduationCap className="size-4" />
								{t("teacherLabel")}
							</span>
							<h1 className="mt-4 text-3xl font-black sm:text-4xl">
								{teacher.full_name || t("teacherLabel")}
							</h1>
							<div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/65">
								{province?.name && (
									<span className="inline-flex items-center gap-1.5">
										<MapPin className="size-4" />
										{province.name}
									</span>
								)}
								{teacher.website_url && (
									<a
										href={teacher.website_url}
										target="_blank"
										rel="noreferrer"
										className="inline-flex items-center gap-1.5 hover:text-white"
									>
										<Globe2 className="size-4" />
										{t("website")}
									</a>
								)}
							</div>
						</div>
						<div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[.08] px-4 py-3">
							<BookOpen className="size-5 text-[#c6f69d]" />
							<span>
								<strong className="block text-xl">
									{courses?.length || 0}
								</strong>
								<small className="text-xs text-white/60">
									{t("coursesCount")}
								</small>
							</span>
						</div>
					</div>
				</section>
				<section className="mt-8 grid gap-7 lg:grid-cols-[.8fr_1.2fr]">
					<article className="h-fit rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#1b2438] sm:p-8">
						<h2 className="flex items-center gap-2 text-xl font-extrabold">
							<Sparkles className="size-5 text-violet-600" />
							{t("about")}
						</h2>
						<p className="mt-4 whitespace-pre-line text-sm leading-8 text-slate-600 dark:text-slate-300">
							{teacher.bio || t("noBio")}
						</p>
					</article>
					<div>
						<div className="mb-5 flex items-end justify-between gap-4">
							<div>
								<p className="text-xs font-bold uppercase tracking-wider text-violet-600">
									{t("learning")}
								</p>
								<h2 className="mt-2 text-2xl font-black">
									{t("teacherCourses")}
								</h2>
							</div>
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
											<div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-violet-200 to-emerald-100">
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

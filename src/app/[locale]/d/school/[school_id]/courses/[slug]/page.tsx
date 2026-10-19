"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BarChart3, Edit3, Eye, Trash2, Users } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { toast } from "sonner";
import { CourseHero, CourseModuleList } from "@/components/blocks/course";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { decodeSlugParam, getSlugOrIdColumn, isUuid } from "@/lib/utils";
import { CourseDetail } from "@/types/queries.types";

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchCourseDetail(rawSlug: string) {
	const slug = decodeSlugParam(rawSlug);
	const client = createClient();

	const { data: details, error: detailError } = await client
		.rpc("get_course_details", {
			[isUuid(slug) ? "p_course_id" : "p_course_slug"]: slug,
		})
		.single();

	if (detailError) throw detailError;

	return details as CourseDetail;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InstructorCourseDetailPage() {
	const t = useTranslations("courses");
	const tDetail = useTranslations("courses.detail");
	const params = useParams<{ slug: string }>();
	const router = useRouter();
	const slug = useMemo(() => decodeSlugParam(params.slug), [params.slug]);

	const {
		data: course,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["courses", slug, "detail"],
		queryFn: () => fetchCourseDetail(slug),
		enabled: !!slug,
	});

	async function handlePublishToggle() {
		if (!course) return;
		const client = createClient();
		const { error } = await client
			.from("courses")
			.update({ is_published: !course.is_published })
			.eq(getSlugOrIdColumn(slug), slug);
		if (error) {
			toast.error("Failed to update publish status.");
		} else {
			toast.success(
				course.is_published ? "Course unpublished." : "Course published."
			);
			router.refresh();
		}
	}

	async function handleDelete() {
		const client = createClient();
		const { error } = await client
			.from("courses")
			.delete()
			.eq(getSlugOrIdColumn(slug), slug);
		if (error) {
			toast.error("Failed to delete course.");
		} else {
			toast.success("Course deleted.");
			router.push("/d/instructor/courses");
		}
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
			</div>
		);
	}

	if (error || !course) {
		return (
			<div className="p-6 text-center">
				<p className="text-sm text-muted-foreground">Course not found.</p>
				<Button asChild variant="outline" size="sm" className="mt-3">
					<Link href="/d/instructor/courses">
						<ArrowLeft className="size-4" />
						Back to Courses
					</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-0">
			{/* Toolbar */}
			<div className="sticky top-14 z-10 flex items-center justify-between gap-3 border-b bg-background/95 px-6 py-3 backdrop-blur supports-backdrop-filter:bg-background/60">
				<div className="flex items-center gap-3 min-w-0">
					<Button asChild variant="ghost" size="icon-sm">
						<Link href="/d/instructor/courses">
							<ArrowLeft className="size-4" />
						</Link>
					</Button>
					<div className="min-w-0">
						<p className="truncate text-sm font-semibold">{course.title}</p>
					</div>
					<Badge
						variant="secondary"
						className={
							course.is_published
								? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
								: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
						}
					>
						{course.is_published
							? tDetail("publishedStatus")
							: tDetail("draftStatus")}
					</Badge>
				</div>

				<div className="flex items-center gap-2 shrink-0">
					<Button asChild variant="outline" size="sm">
						<Link href={`/d/instructor/courses/new/${slug}`}>
							<Edit3 className="size-3.5" />
							{tDetail("editInBuilder")}
						</Link>
					</Button>

					<Button variant="outline" size="sm" onClick={handlePublishToggle}>
						<Eye className="size-3.5" />
						{course.is_published ? t("unpublish") : t("publish")}
					</Button>

					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button
								variant="ghost"
								size="icon-sm"
								className="text-destructive hover:text-destructive"
							>
								<Trash2 className="size-4" />
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Delete course?</AlertDialogTitle>
								<AlertDialogDescription>
									This will permanently delete &ldquo;{course.title}&rdquo; and
									all its modules, lessons, and content. This cannot be undone.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction
									onClick={handleDelete}
									className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
								>
									Delete Course
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</div>

			{/* Tabs */}
			<Tabs defaultValue="overview" className="flex-1">
				<div className="border-b px-6">
					<TabsList className="h-auto rounded-none bg-transparent p-0 gap-4">
						{[
							{ value: "overview", label: tDetail("overview"), icon: Eye },
							{
								value: "curriculum",
								label: tDetail("curriculum"),
								icon: Edit3,
							},
							{ value: "students", label: tDetail("students"), icon: Users },
							{ value: "analytics", label: "Analytics", icon: BarChart3 },
						].map((tab) => (
							<TabsTrigger
								key={tab.value}
								value={tab.value}
								className="relative rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 pt-2 text-sm font-medium text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
							>
								<tab.icon className="me-1.5 size-3.5" />
								{tab.label}
							</TabsTrigger>
						))}
					</TabsList>
				</div>

				<div className="p-6">
					{/* Overview tab */}
					<TabsContent value="overview" className="mt-0">
						<CourseHero course={course} />
					</TabsContent>

					{/* Curriculum tab */}
					<TabsContent value="curriculum" className="mt-0">
						<div className="max-w-3xl">
							{course.modules.length === 0 ? (
								<div className="rounded-xl border border-dashed bg-muted/30 py-16 text-center">
									<p className="text-sm font-medium">No modules yet</p>
									<p className="mt-1 text-xs text-muted-foreground">
										Add modules and lessons to build the course curriculum.
									</p>
									<Button asChild size="sm" className="mt-4">
										<Link href={`/d/instructor/courses/new/${slug}`}>
											<Edit3 className="size-3.5" />
											{tDetail("editInBuilder")}
										</Link>
									</Button>
								</div>
							) : (
								<CourseModuleList
									modules={course.modules}
									defaultExpandedIds={[course.modules[0]?.id]}
								/>
							)}
						</div>
					</TabsContent>

					{/* Students tab */}
					<TabsContent value="students" className="mt-0">
						<div className="rounded-xl border border-dashed bg-muted/30 py-16 text-center">
							<Users className="mx-auto mb-3 size-10 text-muted-foreground/30" />
							<p className="text-sm font-medium">Student management</p>
							<p className="mt-1 text-xs text-muted-foreground">
								{course.total_enrollments ?? 0} students enrolled
							</p>
						</div>
					</TabsContent>

					{/* Analytics tab */}
					<TabsContent value="analytics" className="mt-0">
						<div className="rounded-xl border border-dashed bg-muted/30 py-16 text-center">
							<BarChart3 className="mx-auto mb-3 size-10 text-muted-foreground/30" />
							<p className="text-sm font-medium">Analytics coming soon</p>
						</div>
					</TabsContent>
				</div>
			</Tabs>
		</div>
	);
}

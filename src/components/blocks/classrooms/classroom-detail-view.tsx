"use client";

import { useQuery } from "@tanstack/react-query";
import {
	BellIcon,
	BookOpenIcon,
	FileIcon,
	FilmIcon,
	GlobeIcon,
	GraduationCapIcon,
	LayersIcon,
	LinkIcon,
	ScrollTextIcon,
	ZapIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useQueryState } from "nuqs";
import * as React from "react";
import { formatRelativeTime } from "@/components/blocks/notifications/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@/i18n/navigation";
import { getMyClassroomDetail } from "./actions";
import type {
	ClassroomAnnouncementForMember,
	ClassroomMaterialForMember,
	ClassroomResourceForMember,
} from "./types";

function ResourceIcon({
	type,
}: {
	type: ClassroomResourceForMember["resource_type"];
}) {
	if (type === "deck") return <ZapIcon className="size-4 shrink-0" />;
	if (type === "course") return <BookOpenIcon className="size-4 shrink-0" />;
	return <LayersIcon className="size-4 shrink-0" />;
}

function MaterialTypeIcon({
	type,
}: {
	type: ClassroomMaterialForMember["type"];
}) {
	const icons: Record<string, React.ReactNode> = {
		lesson: <ScrollTextIcon className="size-4 shrink-0" />,
		pdf: <FileIcon className="size-4 shrink-0" />,
		video: <FilmIcon className="size-4 shrink-0" />,
		document: <FileIcon className="size-4 shrink-0" />,
		link: <LinkIcon className="size-4 shrink-0" />,
		practice: <GraduationCapIcon className="size-4 shrink-0" />,
		exam: <GraduationCapIcon className="size-4 shrink-0" />,
	};
	return <>{icons[type] ?? <GlobeIcon className="size-4 shrink-0" />}</>;
}

function ResourcesTabContent({
	resources,
}: {
	resources: ClassroomResourceForMember[];
}) {
	const t = useTranslations("classrooms");

	if (resources.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-16 text-center">
				<LayersIcon className="size-10 text-muted-foreground/40" />
				<p className="text-sm font-medium">{t("detail.noResources")}</p>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			{resources.map((resource) => {
				const content = (
					<>
						<ResourceIcon type={resource.resource_type} />
						<div className="min-w-0 flex-1">
							<p className="truncate text-sm font-medium">{resource.title}</p>
						</div>
						<Badge variant="secondary" className="shrink-0 text-xs capitalize">
							{resource.resource_type}
						</Badge>
					</>
				);

				return resource.href ? (
					<Link
						key={resource.id}
						href={resource.href}
						className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-muted/60"
					>
						{content}
					</Link>
				) : (
					<div
						key={resource.id}
						className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3"
					>
						{content}
					</div>
				);
			})}
		</div>
	);
}

function MaterialsTabContent({
	materials,
}: {
	materials: ClassroomMaterialForMember[];
}) {
	const t = useTranslations("classrooms");

	if (materials.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-16 text-center">
				<FileIcon className="size-10 text-muted-foreground/40" />
				<p className="text-sm font-medium">{t("detail.noMaterials")}</p>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			{materials.map((material) => (
				<div
					key={material.id}
					className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3"
				>
					<MaterialTypeIcon type={material.type} />
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-medium">{material.title}</p>
						{material.description && (
							<p className="truncate text-xs text-muted-foreground">
								{material.description}
							</p>
						)}
					</div>
					<Badge variant="outline" className="shrink-0 text-xs capitalize">
						{material.type}
					</Badge>
				</div>
			))}
		</div>
	);
}

function AnnouncementsTabContent({
	announcements,
}: {
	announcements: ClassroomAnnouncementForMember[];
}) {
	const t = useTranslations("classrooms");
	const locale = useLocale();

	if (announcements.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-16 text-center">
				<BellIcon className="size-10 text-muted-foreground/40" />
				<p className="text-sm font-medium">{t("detail.noAnnouncements")}</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{announcements.map((announcement, i) => {
				const initials =
					announcement.author?.full_name
						?.split(" ")
						.map((n) => n[0])
						.join("")
						.toUpperCase()
						.slice(0, 2) ?? "?";

				return (
					<React.Fragment key={announcement.id}>
						<div className="flex gap-3">
							<Avatar className="size-8 shrink-0">
								{announcement.author?.avatar_url && (
									<AvatarImage src={announcement.author.avatar_url} />
								)}
								<AvatarFallback className="text-xs">{initials}</AvatarFallback>
							</Avatar>
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-2">
									<span className="text-sm font-medium">
										{announcement.author?.full_name ??
											t("detail.unknownAuthor")}
									</span>
									<span className="text-xs text-muted-foreground">
										{formatRelativeTime(announcement.created_at, locale)}
									</span>
								</div>
								<p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
									{announcement.message}
								</p>
							</div>
						</div>
						{i < announcements.length - 1 && <Separator />}
					</React.Fragment>
				);
			})}
		</div>
	);
}

export function ClassroomDetailView({ classroomId }: { classroomId: string }) {
	const t = useTranslations("classrooms");
	const [activeTab, setActiveTab] = useQueryState("tab", {
		defaultValue: "resources",
		parse: (v): string => {
			if (v === "resources" || v === "materials" || v === "announcements") {
				return v;
			}
			return "resources";
		},
	});

	const detailQuery = useQuery({
		queryKey: ["my_classroom_detail", classroomId],
		queryFn: () => getMyClassroomDetail(classroomId),
	});

	if (detailQuery.isLoading) {
		return (
			<div className="flex flex-col gap-4">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-40 w-full rounded-xl" />
			</div>
		);
	}

	if (!detailQuery.data?.success) {
		return (
			<div className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-muted/30 py-20 text-center">
				<p className="text-sm font-medium">{t("detail.loadError")}</p>
				<p className="text-xs text-muted-foreground">
					{detailQuery.data?.error}
				</p>
			</div>
		);
	}

	const classroom = detailQuery.data.data;

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-xl font-bold">{classroom.name}</h1>
				{classroom.description && (
					<p className="mt-0.5 text-sm text-muted-foreground">
						{classroom.description}
					</p>
				)}
			</div>

			<Tabs
				value={activeTab ?? "resources"}
				onValueChange={(v) => void setActiveTab(v)}
			>
				<TabsList>
					<TabsTrigger value="resources">{t("detail.resources")}</TabsTrigger>
					<TabsTrigger value="materials">{t("detail.materials")}</TabsTrigger>
					<TabsTrigger value="announcements">
						{t("detail.announcements")}
					</TabsTrigger>
				</TabsList>
			</Tabs>

			{activeTab === "resources" && (
				<ResourcesTabContent resources={classroom.resources} />
			)}
			{activeTab === "materials" && (
				<MaterialsTabContent materials={classroom.materials} />
			)}
			{activeTab === "announcements" && (
				<AnnouncementsTabContent announcements={classroom.announcements} />
			)}
		</div>
	);
}

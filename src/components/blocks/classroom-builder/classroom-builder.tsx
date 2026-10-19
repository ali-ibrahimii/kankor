"use client";

import { Provider, useAtomValue, useSetAtom } from "jotai";
import {
	ArrowLeftIcon,
	BellIcon,
	FileIcon,
	LayersIcon,
	Settings2Icon,
	UsersIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQueryState } from "nuqs";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnnouncementsTab } from "./announcements-tab";
import { ClassroomSettingsSheet } from "./classroom-settings-sheet";
import { MaterialsTab } from "./materials-tab";
import { MembersTab } from "./members-tab";
import { ResourcesTab } from "./resources-tab";
import {
	activeTabAtom,
	classroomAtom,
	initClassroomBuilderAtom,
	membersAtom,
	setActiveTabAtom,
} from "./store";
import type {
	ClassroomAnnouncement,
	ClassroomBuilderTab,
	ClassroomDetails,
	ClassroomFolder,
	ClassroomMaterial,
	ClassroomMember,
	ClassroomResource,
} from "./types";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ClassroomBuilderProps {
	classroomId: string;
	initialClassroom: ClassroomDetails;
	initialMembers: ClassroomMember[];
	initialResources: ClassroomResource[];
	initialMaterials: ClassroomMaterial[];
	initialFolders: ClassroomFolder[];
	initialAnnouncements: ClassroomAnnouncement[];
	/** Route prefix, e.g. "/d/instructor" */
	basePath: string;
}

// ─── Tab config ───────────────────────────────────────────────────────────────

interface TabConfig {
	value: ClassroomBuilderTab;
	icon: React.ReactNode;
	labelKey: string;
}

const TABS: TabConfig[] = [
	{
		value: "resources",
		icon: <LayersIcon className="size-4" />,
		labelKey: "tabs.resources",
	},
	{
		value: "materials",
		icon: <FileIcon className="size-4" />,
		labelKey: "tabs.materials",
	},
	{
		value: "announcements",
		icon: <BellIcon className="size-4" />,
		labelKey: "tabs.announcements",
	},
	{
		value: "members",
		icon: <UsersIcon className="size-4" />,
		labelKey: "tabs.members",
	},
];

// ─── Inner builder ────────────────────────────────────────────────────────────

function ClassroomBuilderInner({ basePath }: { basePath: string }) {
	const t = useTranslations("classroomBuilder");
	const router = useRouter();

	const classroom = useAtomValue(classroomAtom);
	const members = useAtomValue(membersAtom);
	const activeTab = useAtomValue(activeTabAtom);
	const setActiveTab = useSetAtom(setActiveTabAtom);

	const [urlTab, setUrlTab] = useQueryState<ClassroomBuilderTab>("tab", {
		defaultValue: "resources",
		parse: (v): ClassroomBuilderTab => {
			if (
				v === "resources" ||
				v === "materials" ||
				v === "announcements" ||
				v === "members"
			) {
				return v;
			}
			return "resources";
		},
	});

	// Sync urlTab with activeTab Atom on mount or URL change
	React.useEffect(() => {
		if (urlTab && urlTab !== activeTab) {
			setActiveTab(urlTab);
		}
	}, [urlTab, activeTab, setActiveTab]);

	const [sheetOpen, setSheetOpen] = React.useState(false);

	return (
		<div className="flex h-screen flex-col overflow-hidden">
			{/* Header */}
			<header className="flex shrink-0 items-center gap-3 border-b px-4 py-2.5">
				<Button
					variant="ghost"
					size="icon"
					className="size-8"
					onClick={() => router.push(`${basePath}/classrooms`)}
					aria-label={t("header.back")}
				>
					<ArrowLeftIcon className="size-4" />
				</Button>

				<Separator orientation="vertical" className="h-5" />

				<div className="flex-1 min-w-0">
					<h1 className="truncate text-sm font-semibold">{classroom.name}</h1>
				</div>

				<div className="flex items-center gap-2">
					{classroom.is_archived && (
						<Badge variant="secondary" className="text-xs">
							{t("card.archived")}
						</Badge>
					)}
					<Badge variant="outline" className="gap-1 text-xs">
						<UsersIcon className="size-3" />
						{t("header.memberCount", { count: members.length })}
					</Badge>
					<code className="hidden sm:inline-block rounded bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
						{classroom.join_code}
					</code>
				</div>

				<Separator orientation="vertical" className="h-5" />

				<Button
					variant="outline"
					size="sm"
					onClick={() => setSheetOpen(true)}
					aria-label={t("header.settings")}
				>
					<Settings2Icon className="size-4 me-1.5" />
					{t("header.settings")}
				</Button>
			</header>

			<Tabs
				value={urlTab}
				onValueChange={(v) => {
					const tab = v as ClassroomBuilderTab;
					setActiveTab(tab);
					void setUrlTab(tab);
				}}
				className="flex flex-1 flex-col overflow-hidden"
			>
				<div className="shrink-0 border-b bg-background px-4">
					<TabsList className="h-auto gap-0 rounded-none border-none bg-transparent p-0">
						{TABS.map((tab) => (
							<TabsTrigger
								key={tab.value}
								value={tab.value}
								className="flex items-center gap-1.5 rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
							>
								{tab.icon}
								<span className="hidden sm:inline">
									{t(tab.labelKey as Parameters<typeof t>[0])}
								</span>
							</TabsTrigger>
						))}
					</TabsList>
				</div>

				<main className="flex-1 overflow-y-auto p-6">
					<div className="mx-auto max-w-3xl">
						<TabsContent value="resources" className="mt-0">
							<ResourcesTab />
						</TabsContent>
						<TabsContent value="materials" className="mt-0">
							<MaterialsTab />
						</TabsContent>
						<TabsContent value="announcements" className="mt-0">
							<AnnouncementsTab />
						</TabsContent>
						<TabsContent value="members" className="mt-0">
							<MembersTab />
						</TabsContent>
					</div>
				</main>
			</Tabs>

			{/* Settings sheet */}
			<ClassroomSettingsSheet open={sheetOpen} onOpenChange={setSheetOpen} />
		</div>
	);
}

// ─── Root wrapper (provides Jotai store) ─────────────────────────────────────

export function ClassroomBuilder(props: ClassroomBuilderProps) {
	return (
		<Provider>
			<ClassroomBuilderInit {...props} />
		</Provider>
	);
}

// ─── Initializer ─────────────────────────────────────────────────────────────

function ClassroomBuilderInit({
	classroomId,
	initialClassroom,
	initialMembers,
	initialResources,
	initialMaterials,
	initialFolders,
	initialAnnouncements,
	basePath,
}: ClassroomBuilderProps) {
	const initBuilder = useSetAtom(initClassroomBuilderAtom);
	const [ready, setReady] = React.useState(false);

	React.useEffect(() => {
		initBuilder({
			classroom: initialClassroom,
			members: initialMembers,
			resources: initialResources,
			materials: initialMaterials,
			folders: initialFolders,
			announcements: initialAnnouncements,
		});
		setReady(true);
	}, [classroomId]); // eslint-disable-line react-hooks/exhaustive-deps

	if (!ready) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
			</div>
		);
	}

	return <ClassroomBuilderInner basePath={basePath} />;
}

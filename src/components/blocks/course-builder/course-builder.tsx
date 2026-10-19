"use client";

import { Provider, useAtomValue, useSetAtom } from "jotai";
import {
	ArrowLeftIcon,
	CheckIcon,
	EyeIcon,
	PencilIcon,
	SaveIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { saveCourseContent, setCoursePublished } from "./actions";
import { ContentArea } from "./content-area";
import { ModuleLessonTree } from "./module-lesson-tree";
import { NewCourseDialog } from "./new-course-dialog";
import {
	courseBuilderAtom,
	initBuilderAtom,
	setPublishingAtom,
	setSavingAtom,
} from "./store";
import type { DraftContentBlock, DraftLesson, DraftModule } from "./types";

// ─── Auto-save hook ───────────────────────────────────────────────────────────

type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

function useAutoSave(
	courseId: string,
	modules: DraftModule[],
	lessons: DraftLesson[],
	blocks: DraftContentBlock[],
	debounceMs = 1500
) {
	const [status, setStatus] = React.useState<SaveStatus>("idle");

	// Avoid saving on the initial render (data just loaded from server)
	const initializedRef = React.useRef(false);

	// Always-fresh reference so the debounced callback reads latest state
	const latestRef = React.useRef({ courseId, modules, lessons, blocks });
	latestRef.current = { courseId, modules, lessons, blocks };

	const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
	const idleTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

	React.useEffect(() => {
		if (!initializedRef.current) {
			initializedRef.current = true;
			return;
		}

		setStatus("pending");

		if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
		if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

		saveTimerRef.current = setTimeout(async () => {
			setStatus("saving");
			const { courseId, modules, lessons, blocks } = latestRef.current;
			const result = await saveCourseContent(
				courseId,
				modules,
				lessons,
				blocks
			);
			if (result.success) {
				setStatus("saved");
				idleTimerRef.current = setTimeout(() => setStatus("idle"), 2500);
			} else {
				setStatus("error");
				toast.error(result.error);
			}
		}, debounceMs);

		return () => {
			if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [modules, lessons, blocks]);

	return status;
}

// ─── Auto-save status indicator ───────────────────────────────────────────────

function AutoSaveIndicator({
	status,
	t,
}: {
	status: SaveStatus;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	t: any;
}) {
	if (status === "idle") return null;

	if (status === "pending") {
		return (
			<span className="text-xs text-muted-foreground">
				{t("header.unsavedChanges")}
			</span>
		);
	}

	if (status === "saving") {
		return (
			<span className="flex items-center gap-1.5 text-xs text-muted-foreground">
				<Spinner className="size-3" />
				{t("header.autoSaving")}
			</span>
		);
	}

	if (status === "saved") {
		return (
			<span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
				<CheckIcon className="size-3" />
				{t("header.autoSaved")}
			</span>
		);
	}

	// error — toast already shown by the hook
	return (
		<span className="text-xs text-destructive">
			{t("header.autoSaveFailed")}
		</span>
	);
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CourseBuilderProps {
	courseId: string;
	courseTitle: string;
	isPublished: boolean;
	initialModules: DraftModule[];
	initialLessons: DraftLesson[];
	initialBlocks: DraftContentBlock[];
	/** Route prefix for back navigation, e.g. "/d/instructor" */
	basePath: string;
}

// ─── Inner builder (inside Jotai Provider) ────────────────────────────────────

function CourseBuilderInner({
	courseTitle,
	isPublished: initialIsPublished,
	basePath,
}: Omit<
	CourseBuilderProps,
	"courseId" | "initialModules" | "initialLessons" | "initialBlocks"
>) {
	const t = useTranslations("courseBuilder");
	const router = useRouter();

	const { courseId, modules, lessons, blocks, isSaving, isPublishing } =
		useAtomValue(courseBuilderAtom);
	const setSaving = useSetAtom(setSavingAtom);
	const setPublishing = useSetAtom(setPublishingAtom);

	const [isPublished, setIsPublished] = React.useState(initialIsPublished);
	const [displayTitle, setDisplayTitle] = React.useState(courseTitle);
	const [editDialogOpen, setEditDialogOpen] = React.useState(false);

	const autoSaveStatus = useAutoSave(courseId, modules, lessons, blocks);
	const isBusy = isSaving || isPublishing || autoSaveStatus === "saving";

	async function handleSaveDraft() {
		setSaving(true);
		try {
			const result = await saveCourseContent(
				courseId,
				modules,
				lessons,
				blocks
			);
			if (!result.success) {
				toast.error(result.error);
				return;
			}
			toast.success(t("header.savedDraft"));
		} finally {
			setSaving(false);
		}
	}

	async function handlePublish() {
		setPublishing(true);
		try {
			// Save content first, then publish
			const saveResult = await saveCourseContent(
				courseId,
				modules,
				lessons,
				blocks
			);
			if (!saveResult.success) {
				toast.error(saveResult.error);
				return;
			}

			const publishResult = await setCoursePublished(courseId, !isPublished);
			if (!publishResult.success) {
				toast.error(publishResult.error);
				return;
			}

			setIsPublished((prev) => !prev);
			toast.success(
				isPublished ? t("header.unpublished") : t("header.published")
			);
		} finally {
			setPublishing(false);
		}
	}

	return (
		<div className="flex h-screen flex-col overflow-hidden">
			{/* Header */}
			<header className="flex shrink-0 items-center gap-3 border-b px-4 py-2.5">
				<Button
					variant="ghost"
					size="icon"
					className="size-8"
					onClick={() => router.push(`${basePath}/courses`)}
					aria-label={t("header.back")}
				>
					<ArrowLeftIcon className="size-4" />
				</Button>

				<Separator orientation="vertical" className="h-5" />

				<div className="flex flex-1 min-w-0 items-center gap-1">
					<h1 className="truncate text-sm font-semibold">{displayTitle}</h1>
					<Button
						variant="ghost"
						size="icon"
						className="size-6 shrink-0 text-muted-foreground"
						onClick={() => setEditDialogOpen(true)}
						aria-label={t("header.editDetails")}
						title={t("header.editDetails")}
					>
						<PencilIcon className="size-3.5" />
					</Button>
				</div>

				<Badge
					variant={isPublished ? "default" : "secondary"}
					className="shrink-0 text-xs"
				>
					{isPublished ? t("header.published") : t("header.draft")}
				</Badge>

				<Separator orientation="vertical" className="h-5" />

				<div className="flex items-center gap-3">
					{/* Auto-save status */}
					<AutoSaveIndicator status={autoSaveStatus} t={t} />

					<Separator orientation="vertical" className="h-5" />

					{/* Preview */}
					<Button
						variant="ghost"
						size="sm"
						onClick={() => router.push(`${basePath}/courses/${courseId}`)}
					>
						<EyeIcon className="size-4 me-1.5" />
						{t("header.preview")}
					</Button>

					{/* Save draft */}
					<Button
						variant="outline"
						size="sm"
						onClick={handleSaveDraft}
						disabled={isBusy}
					>
						{isSaving ? (
							<Spinner className="size-4 me-1.5" />
						) : (
							<SaveIcon className="size-4 me-1.5" />
						)}
						{t("header.saveDraft")}
					</Button>

					{/* Publish */}
					<Button
						size="sm"
						onClick={handlePublish}
						disabled={isBusy}
						variant={isPublished ? "destructive" : "default"}
					>
						{isPublishing && <Spinner className="size-4 me-1.5" />}
						{isPublished ? t("header.unpublishBtn") : t("header.publishBtn")}
					</Button>
				</div>
			</header>

			{/* Two-panel layout */}
			<div className="flex flex-1 overflow-hidden">
				{/* Left panel: Module / Lesson tree */}
				<aside className="w-72 shrink-0 border-e overflow-hidden flex flex-col">
					<ModuleLessonTree />
				</aside>

				{/* Center panel: Content block editor */}
				<main className="flex-1 overflow-hidden">
					<ContentArea />
				</main>
			</div>

			<NewCourseDialog
				open={editDialogOpen}
				onOpenChange={setEditDialogOpen}
				basePath={basePath}
				courseId={courseId}
				onUpdated={({ title }) => {
					setDisplayTitle(title);
					router.refresh();
				}}
			/>
		</div>
	);
}

// ─── Root wrapper (provides Jotai store) ─────────────────────────────────────

export function CourseBuilder({
	courseId,
	courseTitle,
	isPublished,
	initialModules,
	initialLessons,
	initialBlocks,
	basePath,
}: CourseBuilderProps) {
	return (
		<Provider>
			<CourseBuilderInit
				courseId={courseId}
				courseTitle={courseTitle}
				isPublished={isPublished}
				initialModules={initialModules}
				initialLessons={initialLessons}
				initialBlocks={initialBlocks}
				basePath={basePath}
			/>
		</Provider>
	);
}

// ─── Initializer (inside Provider) ───────────────────────────────────────────

function CourseBuilderInit({
	courseId,
	courseTitle,
	isPublished,
	initialModules,
	initialLessons,
	initialBlocks,
	basePath,
}: CourseBuilderProps) {
	const initBuilder = useSetAtom(initBuilderAtom);
	const [ready, setReady] = React.useState(false);

	React.useEffect(() => {
		initBuilder({
			courseId,
			modules: initialModules,
			lessons: initialLessons,
			blocks: initialBlocks,
		});
		setReady(true);
	}, [courseId]); // eslint-disable-line react-hooks/exhaustive-deps

	if (!ready) {
		return (
			<div className="flex h-screen items-center justify-center">
				<Spinner className="size-6" />
			</div>
		);
	}

	return (
		<CourseBuilderInner
			courseTitle={courseTitle}
			isPublished={isPublished}
			basePath={basePath}
		/>
	);
}

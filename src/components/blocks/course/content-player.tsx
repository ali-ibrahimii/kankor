"use client";

import { useQuery } from "@tanstack/react-query";
import {
	BookOpen,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	Clock,
	FileQuestion,
	FileText,
	Headphones,
	ImageIcon,
	Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { MDXView } from "@/components/widgets/markdown-view";
import { getAssetSignedUrl } from "@/lib/r2/actions";
import { Enums } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ContentBlock = {
	id: string;
	block_type: Enums<"lesson_content_type">;
	order_index: number;
	text_content?: string | null;
	video_url?: string | null;
	video_provider?: string | null;
	video_storage_key?: string | null;
	audio_url?: string | null;
	audio_storage_key?: string | null;
	document_url?: string | null;
	document_storage_key?: string | null;
	external_resource_url?: string | null;
	external_resource_title?: string | null;
	image_url?: string | null;
};

// ─── Self-hosted (R2) asset resolution ─────────────────────────────────────
//
// A *_storage_key means the file is a private R2 object — the raw key is
// useless without a signed URL, and `getAssetSignedUrl` only returns one
// after confirming (via course_assets RLS) that this user is enrolled in
// the course or manages it. External links (YouTube, a slides URL, …) skip
// this entirely and render directly.

function useSignedAssetUrl(storageKey?: string | null) {
	return useQuery({
		queryKey: ["asset-signed-url", storageKey],
		queryFn: async () => {
			const result = await getAssetSignedUrl(storageKey as string);
			if (!result.success) throw new Error(result.error);
			return result.data.url;
		},
		enabled: !!storageKey,
		staleTime: 3.5 * 60 * 60 * 1000,
		retry: false,
	});
}

export type ContentPlayerProps = {
	lessonTitle: string;
	/** Module the lesson belongs to; hidden when the course has no modules. */
	moduleTitle?: string | null;
	lessonNumber: number;
	totalLessons: number;
	contentBlocks: ContentBlock[];
	isCompleted: boolean;
	isMarkingComplete?: boolean;
	durationMinutes?: number | null;
	nextLessonTitle?: string | null;
	prevLessonTitle?: string | null;
	onMarkComplete: () => void;
	/** Called once when a video block has been watched past the threshold. */
	onAutoComplete?: () => void;
	onNextLesson?: () => void;
	onPrevLesson?: () => void;
	className?: string;
};

// ─── Video watch tracking ─────────────────────────────────────────────────────

/** Fraction of a video that counts as "watched". */
const WATCHED_THRESHOLD = 0.95;

// The global `window.YT` / `onYouTubeIframeAPIReady` types are declared in
// src/app/[locale]/watch/u/[id]/types.ts.
type YouTubeApi = Window["YT"];

let youTubeApiPromise: Promise<YouTubeApi> | null = null;

/** Loads the YouTube IFrame API once and resolves with the YT namespace. */
function loadYouTubeApi(): Promise<YouTubeApi> {
	if (window.YT?.Player) return Promise.resolve(window.YT);
	if (!youTubeApiPromise) {
		youTubeApiPromise = new Promise((resolve) => {
			const previous = window.onYouTubeIframeAPIReady;
			window.onYouTubeIframeAPIReady = () => {
				previous?.();
				resolve(window.YT);
			};
			const script = document.createElement("script");
			script.src = "https://www.youtube.com/iframe_api";
			document.head.appendChild(script);
		});
	}
	return youTubeApiPromise;
}

// ─── VideoPlayer ──────────────────────────────────────────────────────────────

function YouTubeVideo({
	videoId,
	onWatched,
}: {
	videoId: string;
	onWatched?: () => void;
}) {
	const id = React.useId();
	const containerRef = React.useRef<HTMLDivElement>(null);
	const onWatchedRef = React.useRef(onWatched);
	onWatchedRef.current = onWatched;

	React.useEffect(() => {
		const host = containerRef.current;
		if (!host) return;

		// YT.Player replaces the target node, so mount it on a child element to
		// keep the container (and React's DOM) intact.
		const target = document.createElement("div");
		target.id = `yt-${id}`;
		target.className = "h-full w-full";
		host.appendChild(target);

		let pollId: number | undefined;
		let cancelled = false;
		let fired = false;

		const fireWatched = () => {
			if (fired) return;
			fired = true;
			window.clearInterval(pollId);
			onWatchedRef.current?.();
		};

		loadYouTubeApi().then((YT) => {
			if (cancelled) return;
			new YT.Player(target.id, {
				videoId,
				width: "100%",
				height: "100%",
				playerVars: { modestbranding: 1, rel: 0, controls: 1 },
				events: {
					onStateChange: (event) => {
						if (event.data === YT.PlayerState.ENDED) {
							fireWatched();
						} else if (event.data === YT.PlayerState.PLAYING) {
							window.clearInterval(pollId);
							pollId = window.setInterval(() => {
								const duration = event.target.getDuration() ?? 0;
								const current = event.target.getCurrentTime() ?? 0;
								if (duration > 0 && current / duration >= WATCHED_THRESHOLD) {
									fireWatched();
								}
							}, 1000);
						} else {
							window.clearInterval(pollId);
							pollId = undefined;
						}
					},
				},
			});
		});

		return () => {
			cancelled = true;
			window.clearInterval(pollId);
			// Removing the node also tears down the player iframe.
			document.getElementById(target.id)?.remove();
		};
	}, [videoId, id]);

	return (
		<div
			ref={containerRef}
			className="aspect-video w-full overflow-hidden bg-black [&_iframe]:h-full [&_iframe]:w-full"
		/>
	);
}

function VideoPlayer({
	url,
	provider,
	onWatched,
}: {
	url: string;
	provider?: string | null;
	onWatched?: () => void;
}) {
	const t = useTranslations("courses.learn");
	const [failed, setFailed] = React.useState(false);

	// YouTube embed
	if (
		provider === "youtube" ||
		url.includes("youtube.com") ||
		url.includes("youtu.be")
	) {
		const videoId = url.match(
			/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
		)?.[1];
		if (videoId) {
			return <YouTubeVideo videoId={videoId} onWatched={onWatched} />;
		}
	}

	if (failed) return <AssetUnavailable />;

	// Native video
	return (
		<div className="aspect-video w-full overflow-hidden bg-black">
			<video
				src={url}
				controls
				className="h-full w-full"
				preload="metadata"
				onError={() => setFailed(true)}
				onTimeUpdate={(event) => {
					const video = event.currentTarget;
					if (
						video.duration > 0 &&
						video.currentTime / video.duration >= WATCHED_THRESHOLD
					) {
						onWatched?.();
					}
				}}
				onEnded={() => onWatched?.()}
			>
				<p>{t("videoNotSupported")}</p>
			</video>
		</div>
	);
}

// ─── TextContent ──────────────────────────────────────────────────────────────

function TextContent({ html }: { html: string }) {
	return (
		<MDXView
			className="prose prose-sm max-w-none dark:prose-invert"
			// Safe: instructor-authored rich text content
			markdown={html}
		/>
	);
}

// ─── AudioPlayer ─────────────────────────────────────────────────────────────

function AudioPlayer({ url }: { url: string }) {
	const t = useTranslations("courses.learn");

	return (
		<div className="flex flex-col items-center gap-4 px-4 py-6 sm:px-6">
			<div className="flex items-center gap-3">
				<span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
					<Headphones className="size-5" />
				</span>
				<span className="text-sm font-semibold">{t("contentTypes.audio")}</span>
			</div>
			<audio controls src={url} className="w-full max-w-lg">
				{t("videoNotSupported")}
			</audio>
		</div>
	);
}

// ─── PdfViewer ────────────────────────────────────────────────────────────────

function PdfViewer({ url, title }: { url: string; title?: string | null }) {
	const t = useTranslations("courses.learn");

	return (
		<div className="space-y-3">
			<div className="aspect-3/4 w-full overflow-hidden rounded-xl border border-border/70 bg-muted/30">
				<iframe
					src={`${url}#toolbar=1`}
					className="h-full w-full"
					title={title ?? "PDF"}
				/>
			</div>
			<div className="flex justify-end">
				<Button asChild variant="outline" size="sm" className="rounded-xl">
					<a href={url} target="_blank" rel="noopener noreferrer">
						<FileText className="size-3.5" />
						{t("openDocument")}
					</a>
				</Button>
			</div>
		</div>
	);
}

// ─── ExternalResource ─────────────────────────────────────────────────────────

function ExternalResource({
	url,
	title,
}: {
	url: string;
	title?: string | null;
}) {
	const t = useTranslations("courses.learn");

	return (
		<div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
			<div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
				<BookOpen className="size-5" />
			</div>
			<div className="min-w-0 flex-1">
				<p className="truncate text-sm font-bold">
					{title ?? t("contentTypes.external_resource")}
				</p>
				<p className="mt-0.5 truncate text-xs text-muted-foreground">{url}</p>
			</div>
			<Button
				asChild
				variant="outline"
				size="sm"
				className="shrink-0 rounded-xl"
			>
				<a href={url} target="_blank" rel="noopener noreferrer">
					{t("openResource")}
					<ChevronRight className="size-3.5 rtl:rotate-180" />
				</a>
			</Button>
		</div>
	);
}

// ─── Signed-asset loading / error states ───────────────────────────────────

function AssetPending() {
	return (
		<div className="flex aspect-video w-full items-center justify-center bg-muted/40">
			<div className="flex items-center gap-2 text-xs text-muted-foreground">
				<Spinner className="size-4" />
			</div>
		</div>
	);
}

function AssetUnavailable() {
	const t = useTranslations("courses.learn");
	return (
		<div className="flex aspect-video w-full flex-col items-center justify-center gap-2 bg-muted/40 px-4 text-center">
			<FileQuestion className="size-6 text-muted-foreground" />
			<p className="max-w-xs text-xs text-muted-foreground">
				{t("assetUnavailable")}
			</p>
		</div>
	);
}

// ─── Per-block renderers (external URL vs. self-hosted R2 asset) ──────────────

function VideoBlock({
	block,
	onWatched,
}: {
	block: ContentBlock;
	onWatched?: () => void;
}) {
	const signed = useSignedAssetUrl(block.video_storage_key);

	if (block.video_storage_key) {
		if (signed.isPending) return <AssetPending />;
		if (signed.isError || !signed.data) return <AssetUnavailable />;
		return <VideoPlayer url={signed.data} onWatched={onWatched} />;
	}

	return block.video_url ? (
		<VideoPlayer
			url={block.video_url}
			provider={block.video_provider}
			onWatched={onWatched}
		/>
	) : null;
}

function AudioBlock({ block }: { block: ContentBlock }) {
	const signed = useSignedAssetUrl(block.audio_storage_key);

	if (block.audio_storage_key) {
		if (signed.isPending) return <AssetPending />;
		if (signed.isError || !signed.data) return <AssetUnavailable />;
		return <AudioPlayer url={signed.data} />;
	}

	return block.audio_url ? <AudioPlayer url={block.audio_url} /> : null;
}

function PdfBlock({ block }: { block: ContentBlock }) {
	const signed = useSignedAssetUrl(block.document_storage_key);

	if (block.document_storage_key) {
		if (signed.isPending) return <AssetPending />;
		if (signed.isError || !signed.data) return <AssetUnavailable />;
		return <PdfViewer url={signed.data} />;
	}

	return block.document_url ? <PdfViewer url={block.document_url} /> : null;
}

// ─── Unsupported / unrenderable blocks ────────────────────────────────────────
//
// `slide_presentation`, `quiz`, `assignment` and `code_playground` have no
// renderer yet. Falling through to `null` used to leave the learner staring at
// a blank pane, so every unrecognised block now shows what it is and how to
// reach it.

function UnsupportedBlock({ block }: { block: ContentBlock }) {
	const t = useTranslations("courses.learn");
	const label = (() => {
		switch (block.block_type) {
			case "slide_presentation":
				return t("contentTypes.slide_presentation");
			case "quiz":
				return t("contentTypes.quiz");
			case "assignment":
				return t("contentTypes.assignment");
			case "code_playground":
				return t("contentTypes.code_playground");
			default:
				return t("contentTypes.text");
		}
	})();
	const link =
		block.external_resource_url ??
		block.document_url ??
		block.video_url ??
		null;

	return (
		<div className="flex flex-col gap-4 p-4 sm:p-5">
			{block.image_url && (
				// biome-ignore lint/performance/noImgElement: instructor-provided URL of unknown size
				<img
					src={block.image_url}
					alt={label}
					className="w-full rounded-xl border border-border/70 object-contain"
				/>
			)}

			<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
				<div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
					<ImageIcon className="size-5" />
				</div>
				<div className="min-w-0 flex-1">
					<p className="text-sm font-bold">{label}</p>
					<p className="mt-0.5 text-xs text-muted-foreground">
						{t("unsupportedBlock")}
					</p>
				</div>
				{link && (
					<Button
						asChild
						variant="outline"
						size="sm"
						className="shrink-0 rounded-xl"
					>
						<a href={link} target="_blank" rel="noopener noreferrer">
							{t("openResource")}
							<ChevronRight className="size-3.5 rtl:rotate-180" />
						</a>
					</Button>
				)}
			</div>
		</div>
	);
}

// ─── SingleBlock renderer ─────────────────────────────────────────────────────

function RenderBlock({
	block,
	onVideoWatched,
}: {
	block: ContentBlock;
	onVideoWatched?: () => void;
}) {
	switch (block.block_type) {
		case "video":
			return (
				<div className="overflow-hidden rounded-2xl border border-border/70 bg-black shadow-sm">
					<VideoBlock block={block} onWatched={onVideoWatched} />
				</div>
			);

		case "text":
			return block.text_content ? (
				<div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-6 md:p-7">
					<TextContent html={block.text_content} />
				</div>
			) : null;

		case "audio":
			return (
				<div className="rounded-2xl border border-border/70 bg-card shadow-sm">
					<AudioBlock block={block} />
				</div>
			);

		case "pdf_document":
			return (
				<div className="rounded-2xl border border-border/70 bg-card p-3 shadow-sm sm:p-4">
					<PdfBlock block={block} />
				</div>
			);

		case "external_resource":
			return block.external_resource_url ? (
				<div className="rounded-2xl border border-border/70 bg-card shadow-sm">
					<ExternalResource
						url={block.external_resource_url}
						title={block.external_resource_title}
					/>
				</div>
			) : null;

		default:
			return (
				<div className="rounded-2xl border border-border/70 bg-card shadow-sm">
					<UnsupportedBlock block={block} />
				</div>
			);
	}
}

// ─── Empty lesson ─────────────────────────────────────────────────────────────

function EmptyLesson({ onNextLesson }: { onNextLesson?: () => void }) {
	const t = useTranslations("courses.learn");

	return (
		<div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-14 text-center">
			<span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
				<Sparkles className="size-6" />
			</span>
			<div className="space-y-1">
				<p className="text-sm font-bold">{t("noContentTitle")}</p>
				<p className="mx-auto max-w-sm text-xs leading-6 text-muted-foreground">
					{t("noContentDescription")}
				</p>
			</div>
			{onNextLesson && (
				<Button
					size="sm"
					variant="outline"
					className="mt-1 rounded-xl"
					onClick={onNextLesson}
				>
					{t("startNextLesson")}
					<ChevronRight className="size-3.5 rtl:rotate-180" />
				</Button>
			)}
		</div>
	);
}

// ─── Lesson nav button ────────────────────────────────────────────────────────

function LessonNavButton({
	direction,
	label,
	lessonTitle,
	onClick,
	variant = "outline",
}: {
	direction: "prev" | "next";
	label: string;
	lessonTitle?: string | null;
	onClick?: () => void;
	variant?: "outline" | "default";
}) {
	const isPrev = direction === "prev";
	const Chevron = isPrev ? ChevronLeft : ChevronRight;

	return (
		<Button
			variant={variant}
			onClick={onClick}
			disabled={!onClick}
			className={cn(
				"h-11 min-w-11 gap-2 rounded-2xl px-3 text-start",
				variant === "outline" && "border-border/70",
				variant === "default" && "font-bold shadow-sm",
				!isPrev && "justify-end"
			)}
		>
			{isPrev && <Chevron className="size-4 shrink-0 rtl:rotate-180" />}
			<span className="hidden min-w-0 flex-col sm:flex">
				<span className="text-[10px] font-medium text-muted-foreground">
					{label}
				</span>
				{lessonTitle && (
					<span className="max-w-[160px] truncate text-xs font-bold">
						{lessonTitle}
					</span>
				)}
			</span>
			{!isPrev && <Chevron className="size-4 shrink-0 rtl:rotate-180" />}
		</Button>
	);
}

// ─── ContentPlayer ────────────────────────────────────────────────────────────

export function ContentPlayer({
	lessonTitle,
	moduleTitle,
	lessonNumber,
	totalLessons,
	contentBlocks,
	isCompleted,
	isMarkingComplete,
	durationMinutes,
	nextLessonTitle,
	prevLessonTitle,
	onMarkComplete,
	onAutoComplete,
	onNextLesson,
	onPrevLesson,
	className,
}: ContentPlayerProps) {
	const t = useTranslations("courses.learn");

	const sorted = React.useMemo(
		() => contentBlocks.slice().sort((a, b) => a.order_index - b.order_index),
		[contentBlocks]
	);

	// Auto-complete once per lesson when a video crosses the watched threshold.
	const autoCompletedRef = React.useRef(false);
	const handleVideoWatched = React.useCallback(() => {
		if (autoCompletedRef.current || isCompleted || isMarkingComplete) return;
		autoCompletedRef.current = true;
		onAutoComplete?.();
	}, [isCompleted, isMarkingComplete, onAutoComplete]);

	const canGoNext = Boolean(onNextLesson);

	return (
		<div className={cn("flex min-h-0 flex-1 flex-col bg-muted/20", className)}>
			{/* Lesson header */}
			<header className="shrink-0 border-b border-border/70 bg-background px-4 py-4 md:px-6">
				<div className="mx-auto w-full max-w-3xl">
					<div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
						<span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-bold text-primary">
							{t("lessonOf", {
								current: lessonNumber,
								total: totalLessons,
							})}
						</span>
						{moduleTitle && (
							<>
								<span aria-hidden="true">·</span>
								<span className="truncate">{moduleTitle}</span>
							</>
						)}
						{durationMinutes ? (
							<>
								<span aria-hidden="true">·</span>
								<span className="inline-flex items-center gap-1">
									<Clock className="size-3" />
									{t("minutes", { count: durationMinutes })}
								</span>
							</>
						) : null}
					</div>

					<div className="mt-2 flex items-start justify-between gap-3">
						<h1 className="text-lg font-black leading-snug tracking-tight md:text-xl">
							{lessonTitle}
						</h1>
						{isCompleted && (
							<span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
								<CheckCircle2 className="size-3.5" />
								{t("completed")}
							</span>
						)}
					</div>
				</div>
			</header>

			{/* Content blocks */}
			<div className="min-h-0 flex-1 overflow-y-auto">
				<div className="mx-auto w-full max-w-3xl px-4 py-5 md:px-6 md:py-7">
					{sorted.length === 0 ? (
						<EmptyLesson onNextLesson={onNextLesson} />
					) : (
						<div className="space-y-5">
							{sorted.map((block) => (
								<RenderBlock
									key={block.id}
									block={block}
									onVideoWatched={handleVideoWatched}
								/>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Footer nav */}
			<footer className="shrink-0 border-t border-border/70 bg-background/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/70 md:px-6">
				<div className="mx-auto flex w-full max-w-3xl items-center gap-2">
					<LessonNavButton
						direction="prev"
						label={t("previousLesson")}
						lessonTitle={prevLessonTitle}
						onClick={onPrevLesson}
					/>

					<div className="flex flex-1 justify-center">
						{isCompleted ? (
							<span className="inline-flex h-11 items-center gap-1.5 rounded-2xl bg-emerald-500/10 px-4 text-xs font-bold text-emerald-600 dark:text-emerald-400">
								<CheckCircle2 className="size-4" />
								{t("completed")}
							</span>
						) : (
							<Button
								onClick={onMarkComplete}
								disabled={isMarkingComplete}
								className="h-11 gap-2 rounded-2xl px-5 font-bold shadow-sm"
							>
								{isMarkingComplete ? (
									<Spinner className="size-4" />
								) : (
									<CheckCircle2 className="size-4" />
								)}
								{canGoNext ? t("completeAndNext") : t("markComplete")}
							</Button>
						)}
					</div>

					<LessonNavButton
						direction="next"
						label={isCompleted ? t("nextLesson") : t("upNext")}
						lessonTitle={nextLessonTitle}
						onClick={onNextLesson}
						variant={isCompleted && canGoNext ? "default" : "outline"}
					/>
				</div>
			</footer>
		</div>
	);
}

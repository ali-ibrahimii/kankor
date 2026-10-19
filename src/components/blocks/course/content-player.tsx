"use client";

import { useQuery } from "@tanstack/react-query";
import {
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	FileText,
	Headphones,
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
	lessonNumber: number;
	totalLessons: number;
	contentBlocks: ContentBlock[];
	isCompleted: boolean;
	isMarkingComplete?: boolean;
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
			className="aspect-video w-full overflow-hidden rounded-xl bg-black [&_iframe]:h-full [&_iframe]:w-full"
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

	// Native video
	return (
		<div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
			<video
				src={url}
				controls
				className="h-full w-full"
				preload="metadata"
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
	return (
		<div className="flex flex-col items-center gap-4 rounded-xl border bg-muted/30 px-6 py-8">
			<div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
				<Headphones className="size-8 text-primary" />
			</div>
			<audio controls src={url} className="w-full max-w-md">
				Your browser does not support the audio element.
			</audio>
		</div>
	);
}

// ─── PdfViewer ────────────────────────────────────────────────────────────────

function PdfViewer({ url, title }: { url: string; title?: string | null }) {
	return (
		<div className="space-y-3">
			<div className="aspect-3/4 w-full overflow-hidden rounded-xl border">
				<iframe
					src={`${url}#toolbar=1`}
					className="h-full w-full"
					title={title ?? "PDF Document"}
				/>
			</div>
			<div className="flex justify-end">
				<Button asChild variant="outline" size="sm">
					<a href={url} target="_blank" rel="noopener noreferrer">
						<FileText className="size-3.5" />
						Open PDF
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
	return (
		<div className="flex items-center gap-4 rounded-xl border bg-muted/30 p-5">
			<div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
				<ChevronRight className="size-5 text-primary" />
			</div>
			<div className="min-w-0">
				<p className="font-medium">{title ?? "External Resource"}</p>
				<p className="mt-0.5 truncate text-sm text-muted-foreground">{url}</p>
			</div>
			<Button asChild variant="outline" size="sm" className="shrink-0">
				<a href={url} target="_blank" rel="noopener noreferrer">
					Open
				</a>
			</Button>
		</div>
	);
}

// ─── Signed-asset loading / error states ───────────────────────────────────

function AssetPending() {
	return (
		<div className="flex aspect-video w-full items-center justify-center rounded-xl border bg-muted/30">
			<Spinner className="size-5" />
		</div>
	);
}

function AssetUnavailable() {
	const t = useTranslations("courses.learn");
	return (
		<div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed bg-muted/30 px-4 text-center text-sm text-muted-foreground">
			{t("assetUnavailable")}
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
			return <VideoBlock block={block} onWatched={onVideoWatched} />;

		case "text":
			return block.text_content ? (
				<TextContent html={block.text_content} />
			) : null;

		case "audio":
			return <AudioBlock block={block} />;

		case "pdf_document":
			return <PdfBlock block={block} />;

		case "external_resource":
			return block.external_resource_url ? (
				<ExternalResource
					url={block.external_resource_url}
					title={block.external_resource_title}
				/>
			) : null;

		default:
			return null;
	}
}

// ─── ContentPlayer ────────────────────────────────────────────────────────────

export function ContentPlayer({
	lessonTitle,
	lessonNumber,
	totalLessons,
	contentBlocks,
	isCompleted,
	isMarkingComplete,
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

	return (
		<div className={cn("flex flex-col gap-0", className)}>
			{/* Lesson header */}
			<div className="border-b px-4 py-3 md:px-6">
				<p className="text-xs text-muted-foreground">
					{t("lessonOf", { current: lessonNumber, total: totalLessons })}
				</p>
				<h1 className="mt-0.5 text-lg font-semibold leading-snug">
					{lessonTitle}
				</h1>
			</div>

			{/* Content blocks */}
			<div className="flex-1 space-y-8 overflow-y-auto px-4 py-6 md:px-6">
				{sorted.map((block) => (
					<RenderBlock
						key={block.id}
						block={block}
						onVideoWatched={handleVideoWatched}
					/>
				))}
			</div>

			{/* Footer nav */}
			<div className="sticky bottom-0 border-t bg-background/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/60 md:px-6">
				<div className="flex items-center justify-between gap-3">
					{/* Prev */}
					<Button
						variant="outline"
						size="sm"
						onClick={onPrevLesson}
						disabled={!onPrevLesson}
						className="gap-1.5"
					>
						<ChevronLeft className="size-4 rtl:rotate-180" />
						<span className="hidden sm:inline">{t("previousLesson")}</span>
					</Button>

					{/* Mark complete */}
					<Button
						size="sm"
						variant={isCompleted ? "secondary" : "default"}
						className={cn(
							"gap-1.5",
							isCompleted &&
								"bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
						)}
						onClick={onMarkComplete}
						disabled={isCompleted || isMarkingComplete}
					>
						{isMarkingComplete ? (
							<Spinner className="size-4" />
						) : (
							<CheckCircle2 className="size-4" />
						)}
						{isCompleted ? t("completed") : t("markComplete")}
					</Button>

					{/* Next */}
					<Button
						variant="outline"
						size="sm"
						onClick={onNextLesson}
						disabled={!onNextLesson}
						className="gap-1.5"
					>
						<span className="hidden sm:inline">{t("nextLesson")}</span>
						<ChevronRight className="size-4 rtl:rotate-180" />
					</Button>
				</div>
			</div>
		</div>
	);
}

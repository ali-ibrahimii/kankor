"use client";

import { useSetAtom } from "jotai";
import {
	ClipboardListIcon,
	Code2Icon,
	FileTextIcon,
	GripVerticalIcon,
	LinkIcon,
	PresentationIcon,
	Trash2Icon,
	VideoIcon,
	Volume2Icon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LexicalEditor } from "@/features/editor/lexical-editor";
import { cn } from "@/lib/utils";
import { AssetUpload } from "./asset-upload";
import { deleteBlockAtom, patchBlockAtom, setActiveBlockAtom } from "./store";
import type { DraftContentBlock, LessonContentType } from "./types";

// ─── Link / Upload source toggle ───────────────────────────────────────────

type SourceMode = "link" | "upload";

function SourceModeToggle({
	mode,
	onChange,
}: {
	mode: SourceMode;
	onChange: (mode: SourceMode) => void;
}) {
	const t = useTranslations("courseBuilder.block.upload");
	return (
		<ToggleGroup
			type="single"
			variant="outline"
			size="sm"
			value={mode}
			onValueChange={(value) => value && onChange(value as SourceMode)}
		>
			<ToggleGroupItem value="link">{t("modeLink")}</ToggleGroupItem>
			<ToggleGroupItem value="upload">{t("modeUpload")}</ToggleGroupItem>
		</ToggleGroup>
	);
}

// ─── Block type icon map ──────────────────────────────────────────────────────

const BLOCK_ICONS: Record<LessonContentType, React.ElementType> = {
	text: FileTextIcon,
	video: VideoIcon,
	audio: Volume2Icon,
	pdf_document: FileTextIcon,
	slide_presentation: PresentationIcon,
	quiz: ClipboardListIcon,
	assignment: ClipboardListIcon,
	external_resource: LinkIcon,
	code_playground: Code2Icon,
};

// ─── Individual field editors per block type ──────────────────────────────────

function TextField({ block }: { block: DraftContentBlock }) {
	const t = useTranslations("courseBuilder");
	const patchBlock = useSetAtom(patchBlockAtom);
	return (
		<div className="space-y-2">
			<Label>{t("block.textContent")}</Label>
			<LexicalEditor
				content={block.text_content ?? ""}
				onChange={(e) =>
					patchBlock({ id: block.id, patch: { text_content: e } })
				}
				placeholder={t("block.textPlaceholder")}
				className="font-mono text-sm resize-y"
			/>
		</div>
	);
}

function VideoField({ block }: { block: DraftContentBlock }) {
	const t = useTranslations("courseBuilder");
	const patchBlock = useSetAtom(patchBlockAtom);
	const [mode, setMode] = React.useState<SourceMode>(
		block.video_storage_key ? "upload" : "link"
	);

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<Label>{t("block.videoUrl")}</Label>
					<SourceModeToggle
						mode={mode}
						onChange={(next) => {
							setMode(next);
							patchBlock({
								id: block.id,
								patch:
									next === "upload"
										? { video_url: null, video_provider: null }
										: { video_storage_key: null },
							});
						}}
					/>
				</div>
				{mode === "upload" ? (
					<AssetUpload
						courseId={block.course_id ?? ""}
						blockId={block.id}
						kind="video"
						storageKey={block.video_storage_key}
						onUploaded={(key) =>
							patchBlock({
								id: block.id,
								patch: {
									video_storage_key: key,
									video_url: null,
									video_provider: null,
								},
							})
						}
						onRemoved={() =>
							patchBlock({ id: block.id, patch: { video_storage_key: null } })
						}
					/>
				) : (
					<Input
						value={block.video_url ?? ""}
						onChange={(e) =>
							patchBlock({ id: block.id, patch: { video_url: e.target.value } })
						}
						placeholder="https://…"
						type="url"
					/>
				)}
			</div>
			{mode === "link" && (
				<div className="space-y-2">
					<Label>{t("block.videoProvider")}</Label>
					<Select
						value={block.video_provider ?? ""}
						onValueChange={(v) =>
							patchBlock({ id: block.id, patch: { video_provider: v || null } })
						}
					>
						<SelectTrigger>
							<SelectValue placeholder={t("block.providerPlaceholder")} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="youtube">YouTube</SelectItem>
							<SelectItem value="vimeo">Vimeo</SelectItem>
							<SelectItem value="mux">Mux</SelectItem>
							<SelectItem value="bunny">Bunny.net</SelectItem>
							<SelectItem value="custom">
								{t("block.customProvider")}
							</SelectItem>
						</SelectContent>
					</Select>
				</div>
			)}
			<div className="space-y-2">
				<Label>{t("block.transcript")}</Label>
				<Textarea
					value={block.video_transcript ?? ""}
					onChange={(e) =>
						patchBlock({
							id: block.id,
							patch: { video_transcript: e.target.value || null },
						})
					}
					placeholder={t("block.transcriptPlaceholder")}
					rows={4}
				/>
			</div>
		</div>
	);
}

function AudioField({ block }: { block: DraftContentBlock }) {
	const t = useTranslations("courseBuilder");
	const patchBlock = useSetAtom(patchBlockAtom);
	const [mode, setMode] = React.useState<SourceMode>(
		block.audio_storage_key ? "upload" : "link"
	);

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<Label>{t("block.audioUrl")}</Label>
					<SourceModeToggle
						mode={mode}
						onChange={(next) => {
							setMode(next);
							patchBlock({
								id: block.id,
								patch:
									next === "upload"
										? { audio_url: null }
										: { audio_storage_key: null },
							});
						}}
					/>
				</div>
				{mode === "upload" ? (
					<AssetUpload
						courseId={block.course_id ?? ""}
						blockId={block.id}
						kind="audio"
						storageKey={block.audio_storage_key}
						onUploaded={(key) =>
							patchBlock({
								id: block.id,
								patch: { audio_storage_key: key, audio_url: null },
							})
						}
						onRemoved={() =>
							patchBlock({ id: block.id, patch: { audio_storage_key: null } })
						}
					/>
				) : (
					<Input
						value={block.audio_url ?? ""}
						onChange={(e) =>
							patchBlock({ id: block.id, patch: { audio_url: e.target.value } })
						}
						placeholder="https://…"
						type="url"
					/>
				)}
			</div>
			<div className="space-y-2">
				<Label>{t("block.transcript")}</Label>
				<Textarea
					value={block.audio_transcript ?? ""}
					onChange={(e) =>
						patchBlock({
							id: block.id,
							patch: { audio_transcript: e.target.value || null },
						})
					}
					placeholder={t("block.transcriptPlaceholder")}
					rows={4}
				/>
			</div>
		</div>
	);
}

function DocumentField({
	block,
	urlField,
	urlLabel,
}: {
	block: DraftContentBlock;
	urlField: "document_url";
	urlLabel: string;
}) {
	const patchBlock = useSetAtom(patchBlockAtom);
	const [mode, setMode] = React.useState<SourceMode>(
		block.document_storage_key ? "upload" : "link"
	);

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<Label>{urlLabel}</Label>
				<SourceModeToggle
					mode={mode}
					onChange={(next) => {
						setMode(next);
						patchBlock({
							id: block.id,
							patch:
								next === "upload"
									? { [urlField]: null }
									: { document_storage_key: null },
						});
					}}
				/>
			</div>
			{mode === "upload" ? (
				<AssetUpload
					courseId={block.course_id ?? ""}
					blockId={block.id}
					kind="document"
					storageKey={block.document_storage_key}
					onUploaded={(key) =>
						patchBlock({
							id: block.id,
							patch: { document_storage_key: key, [urlField]: null },
						})
					}
					onRemoved={() =>
						patchBlock({ id: block.id, patch: { document_storage_key: null } })
					}
				/>
			) : (
				<Input
					value={(block[urlField] as string) ?? ""}
					onChange={(e) =>
						patchBlock({ id: block.id, patch: { [urlField]: e.target.value } })
					}
					placeholder="https://…"
					type="url"
				/>
			)}
		</div>
	);
}

function ExternalResourceField({ block }: { block: DraftContentBlock }) {
	const t = useTranslations("courseBuilder");
	const patchBlock = useSetAtom(patchBlockAtom);
	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label>{t("block.resourceTitle")}</Label>
				<Input
					value={block.external_resource_title ?? ""}
					onChange={(e) =>
						patchBlock({
							id: block.id,
							patch: { external_resource_title: e.target.value || null },
						})
					}
					placeholder={t("block.resourceTitlePlaceholder")}
				/>
			</div>
			<div className="space-y-2">
				<Label>{t("block.resourceUrl")}</Label>
				<Input
					value={block.external_resource_url ?? ""}
					onChange={(e) =>
						patchBlock({
							id: block.id,
							patch: { external_resource_url: e.target.value || null },
						})
					}
					placeholder="https://…"
					type="url"
				/>
			</div>
		</div>
	);
}

function CodePlaygroundField({ block }: { block: DraftContentBlock }) {
	const t = useTranslations("courseBuilder");
	const patchBlock = useSetAtom(patchBlockAtom);
	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label>{t("block.codeLanguage")}</Label>
				<Select
					value={block.code_language ?? ""}
					onValueChange={(v) =>
						patchBlock({ id: block.id, patch: { code_language: v || null } })
					}
				>
					<SelectTrigger>
						<SelectValue placeholder={t("block.languagePlaceholder")} />
					</SelectTrigger>
					<SelectContent>
						{[
							"javascript",
							"typescript",
							"python",
							"java",
							"c",
							"cpp",
							"go",
							"rust",
							"html",
							"css",
						].map((lang) => (
							<SelectItem key={lang} value={lang}>
								{lang}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className="space-y-2">
				<Label>{t("block.defaultCode")}</Label>
				<Textarea
					value={block.default_code ?? ""}
					onChange={(e) =>
						patchBlock({
							id: block.id,
							patch: { default_code: e.target.value || null },
						})
					}
					placeholder={t("block.codePlaceholder")}
					rows={8}
					className="font-mono text-sm resize-y"
				/>
			</div>
			<div className="space-y-2">
				<Label>{t("block.solutionCode")}</Label>
				<Textarea
					value={block.solution_code ?? ""}
					onChange={(e) =>
						patchBlock({
							id: block.id,
							patch: { solution_code: e.target.value || null },
						})
					}
					placeholder={t("block.solutionPlaceholder")}
					rows={6}
					className="font-mono text-sm resize-y"
				/>
			</div>
		</div>
	);
}

// ─── Block editor (full card) ─────────────────────────────────────────────────

export interface BlockEditorProps {
	block: DraftContentBlock;
	index: number;
	isActive: boolean;
	dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}

export function BlockEditor({
	block,
	index,
	isActive,
	dragHandleProps,
}: BlockEditorProps) {
	const t = useTranslations("courseBuilder");
	const setActiveBlock = useSetAtom(setActiveBlockAtom);
	const deleteBlock = useSetAtom(deleteBlockAtom);
	const Icon = BLOCK_ICONS[block.block_type] ?? FileTextIcon;

	return (
		<div
			className={cn(
				"group rounded-xl border bg-card transition-all",
				isActive
					? "border-primary/50 ring-1 ring-primary/20 shadow-sm"
					: "border-border hover:border-border/80"
			)}
			onClick={() => setActiveBlock(block.id)}
		>
			{/* Block header */}
			<div className="flex items-center gap-2 border-b px-4 py-2.5">
				<button
					{...dragHandleProps}
					className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
					onClick={(e) => e.stopPropagation()}
					aria-label={t("common.dragToReorder")}
				>
					<GripVerticalIcon className="size-4" />
				</button>

				<Icon className="size-4 shrink-0 text-muted-foreground" />
				<span className="flex-1 text-sm font-medium">
					{t(`block.type.${block.block_type}` as Parameters<typeof t>[0])}
					<span className="ms-2 text-xs text-muted-foreground font-normal">
						#{index + 1}
					</span>
				</span>

				<Button
					size="icon"
					variant="ghost"
					className="size-7 shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
					onClick={(e) => {
						e.stopPropagation();
						deleteBlock(block.id);
					}}
					aria-label={t("common.delete")}
				>
					<Trash2Icon className="size-3.5" />
				</Button>
			</div>

			{/* Block content */}
			<div className="px-4 py-4">
				{block.block_type === "text" && <TextField block={block} />}
				{block.block_type === "video" && <VideoField block={block} />}
				{block.block_type === "audio" && <AudioField block={block} />}
				{block.block_type === "pdf_document" && (
					<DocumentField
						block={block}
						urlField="document_url"
						urlLabel={t("block.documentUrl")}
					/>
				)}
				{block.block_type === "slide_presentation" && (
					<DocumentField
						block={block}
						urlField="document_url"
						urlLabel={t("block.slidesUrl")}
					/>
				)}
				{block.block_type === "external_resource" && (
					<ExternalResourceField block={block} />
				)}
				{block.block_type === "code_playground" && (
					<CodePlaygroundField block={block} />
				)}
				{(block.block_type === "quiz" || block.block_type === "assignment") && (
					<div className="flex items-center justify-center py-6 text-center text-sm text-muted-foreground">
						<p>{t("block.quizManagedSeparately")}</p>
					</div>
				)}
			</div>
		</div>
	);
}

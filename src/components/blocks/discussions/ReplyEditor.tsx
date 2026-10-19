"use client";

import {
	Bold,
	Code,
	Italic,
	Link as LinkIcon,
	Loader2,
	Send,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createDiscussionPostAction } from "@/lib/actions/discussions";

interface ReplyEditorProps {
	thread_id: string;
	parent_post_id?: string;
	onSuccess?: () => void;
	onCancel?: () => void;
	placeholder?: string;
	autoFocus?: boolean;
}

export function ReplyEditor({
	thread_id,
	parent_post_id,
	onSuccess,
	onCancel,
	placeholder,
	autoFocus = false,
}: ReplyEditorProps) {
	const t = useTranslations("discussions");
	const [content, setContent] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!content.trim()) return;

		setIsSubmitting(true);
		setErrorMsg(null);

		try {
			await createDiscussionPostAction({
				thread_id,
				content,
				parent_post_id,
			});

			setContent("");
			if (onSuccess) onSuccess();
		} catch (err: any) {
			setErrorMsg(err.message || t("errors.reply_failed"));
		} finally {
			setIsSubmitting(false);
		}
	};

	const wrapSelection = (prefix: string, suffix = prefix) => {
		setContent((prev) => `${prev}${prefix}${t("editor_text_sample")}${suffix}`);
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="space-y-2 bg-background border rounded-lg p-3 shadow-2xs"
		>
			{errorMsg && (
				<div className="p-2 text-xs bg-rose-50 text-rose-700 dark:bg-rose-950/40 rounded">
					{errorMsg}
				</div>
			)}

			{/* Formatting Quick Controls */}
			<div className="flex items-center gap-1 pb-1 border-b text-muted-foreground">
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="h-7 w-7"
					onClick={() => wrapSelection("**")}
					title="Bold"
				>
					<Bold className="w-3.5 h-3.5" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="h-7 w-7"
					onClick={() => wrapSelection("*")}
					title="Italic"
				>
					<Italic className="w-3.5 h-3.5" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="h-7 w-7"
					onClick={() => wrapSelection("`")}
					title="Inline Code"
				>
					<Code className="w-3.5 h-3.5" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="h-7 w-7"
					onClick={() => wrapSelection("[", "](url)")}
					title="Link"
				>
					<LinkIcon className="w-3.5 h-3.5" />
				</Button>
			</div>

			<Textarea
				value={content}
				onChange={(e) => setContent(e.target.value)}
				placeholder={placeholder || t("reply_placeholder")}
				rows={3}
				autoFocus={autoFocus}
				className="resize-y min-h-[70px] text-sm border-0 focus-visible:ring-0 shadow-none p-1"
			/>

			<div className="flex items-center justify-between pt-1 border-t">
				<span className="text-[11px] text-muted-foreground">
					{t("markdown_supported")}
				</span>

				<div className="flex items-center gap-2">
					{onCancel && (
						<Button variant="ghost" size="sm" type="button" onClick={onCancel}>
							{t("cancel")}
						</Button>
					)}
					<Button
						size="sm"
						type="submit"
						disabled={isSubmitting || !content.trim()}
						className="gap-1.5"
					>
						{isSubmitting ? (
							<Loader2 className="w-3.5 h-3.5 animate-spin" />
						) : (
							<Send className="w-3.5 h-3.5" />
						)}
						{t("submit_reply")}
					</Button>
				</div>
			</div>
		</form>
	);
}

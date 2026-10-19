"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface DropzoneProps
	extends Omit<React.ComponentProps<"div">, "onDrop" | "onChange"> {
	onFilesSelected: (files: File[]) => void;
	accept?: string;
	multiple?: boolean;
	disabled?: boolean;
	/** Forwarded to the underlying file input — hints mobile browsers to open the camera directly (e.g. "environment" for the rear camera). */
	capture?: "user" | "environment";
}

/** Generic drag-and-drop + click-to-browse file picker. Styling-only — pass `children` for the visual content. */
function Dropzone({
	onFilesSelected,
	accept,
	multiple = false,
	disabled = false,
	capture,
	className,
	children,
	...props
}: DropzoneProps) {
	const inputRef = React.useRef<HTMLInputElement>(null);
	const [isDragging, setIsDragging] = React.useState(false);

	function handleFiles(fileList: FileList | null) {
		if (!fileList || fileList.length === 0) return;
		onFilesSelected(Array.from(fileList));
	}

	return (
		<div
			data-slot="dropzone"
			data-dragging={isDragging || undefined}
			data-disabled={disabled || undefined}
			role="button"
			tabIndex={disabled ? -1 : 0}
			aria-disabled={disabled}
			onClick={() => !disabled && inputRef.current?.click()}
			onKeyDown={(event) => {
				if (disabled) return;
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					inputRef.current?.click();
				}
			}}
			onDragOver={(event) => {
				event.preventDefault();
				if (!disabled) setIsDragging(true);
			}}
			onDragLeave={() => setIsDragging(false)}
			onDrop={(event) => {
				event.preventDefault();
				setIsDragging(false);
				if (!disabled) handleFiles(event.dataTransfer.files);
			}}
			className={cn(
				"flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-8 text-center transition-colors hover:bg-muted/50",
				"data-dragging:border-primary data-dragging:bg-primary/5",
				"data-disabled:pointer-events-none data-disabled:opacity-50",
				className
			)}
			{...props}
		>
			<input
				ref={inputRef}
				type="file"
				className="sr-only"
				accept={accept}
				multiple={multiple}
				disabled={disabled}
				capture={capture}
				onChange={(event) => {
					handleFiles(event.target.files);
					event.target.value = "";
				}}
			/>
			{children}
		</div>
	);
}

export { Dropzone };

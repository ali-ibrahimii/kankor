"use client";

import { $createCodeNode, CodeHighlightNode, CodeNode } from "@lexical/code";
import {
	$isLinkNode,
	AutoLinkNode,
	LinkNode,
	TOGGLE_LINK_COMMAND,
} from "@lexical/link";
import {
	INSERT_CHECK_LIST_COMMAND,
	INSERT_ORDERED_LIST_COMMAND,
	INSERT_UNORDERED_LIST_COMMAND,
	ListItemNode,
	ListNode,
} from "@lexical/list";
import {
	$convertFromMarkdownString,
	$convertToMarkdownString,
	TRANSFORMERS,
} from "@lexical/markdown";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { ClearEditorPlugin } from "@lexical/react/LexicalClearEditorPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import {
	$createHeadingNode,
	$createQuoteNode,
	HeadingNode,
	QuoteNode,
} from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import {
	INSERT_TABLE_COMMAND,
	TableCellNode,
	TableNode,
	TableRowNode,
} from "@lexical/table";
import {
	$getSelection,
	$isElementNode,
	$isRangeSelection,
	CAN_REDO_COMMAND,
	CAN_UNDO_COMMAND,
	CLEAR_EDITOR_COMMAND,
	COMMAND_PRIORITY_LOW,
	FORMAT_ELEMENT_COMMAND,
	FORMAT_TEXT_COMMAND,
	type LexicalEditor as LexicalEditorType,
	REDO_COMMAND,
	SELECTION_CHANGE_COMMAND,
	UNDO_COMMAND,
} from "lexical";
import {
	AlignCenter,
	AlignJustify,
	AlignLeft,
	AlignRight,
	Bold,
	Check,
	CheckSquare,
	Code,
	Heading1,
	Heading2,
	Heading3,
	Italic,
	Link,
	Link2Off,
	List,
	ListOrdered,
	Quote,
	Redo2,
	Strikethrough,
	Table,
	Trash2,
	Underline,
	Undo2,
} from "lucide-react";
import type * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const EDITOR_NODES = [
	HeadingNode,
	QuoteNode,
	ListNode,
	ListItemNode,
	CodeNode,
	CodeHighlightNode,
	LinkNode,
	AutoLinkNode,
	TableNode,
	TableCellNode,
	TableRowNode,
];

const theme = {
	ltr: "text-left",
	rtl: "text-right",
	placeholder:
		"text-text-disabled-300 absolute pointer-events-none select-none top-4 left-4 right-4",
	paragraph: "text-paragraph-md mb-2 relative leading-relaxed",
	quote:
		"border-l-4 border-primary-500 pl-4 italic text-text-sub-600 my-4 bg-bg-weak-50/50 py-2 pr-2 rounded-r-lg",
	heading: {
		h1: "text-3xl font-bold text-text-strong-950 mt-6 mb-2 leading-tight tracking-tight",
		h2: "text-2xl font-semibold text-text-strong-950 mt-5 mb-2 leading-snug tracking-tight",
		h3: "text-xl font-semibold text-text-strong-950 mt-4 mb-2 leading-normal tracking-tight",
	},
	list: {
		nested: {
			listitem: "list-none",
		},
		ol: "list-decimal pl-6 my-2 space-y-1",
		ul: "list-disc pl-6 my-2 space-y-1",
		listitem: "text-text-strong-950",
		listitemChecked: "editor-listitem-checked",
		listitemUnchecked: "editor-listitem-unchecked",
	},
	checklist: "pl-6 my-2 space-y-1 list-none",
	link: "text-primary-600 underline hover:text-primary-700 cursor-pointer transition duration-150",
	text: {
		bold: "font-bold",
		italic: "italic",
		underline: "underline",
		strikethrough: "line-through",
		code: "font-mono text-sm bg-bg-weak-100 text-text-strong-950 px-1.5 py-0.5 rounded border border-stroke-soft-200",
	},
	code: "font-mono text-sm bg-slate-900 text-slate-100 p-4 rounded-xl my-4 overflow-x-auto block leading-relaxed shadow-inner border border-slate-800",
	codeHighlight: {
		atrule: "text-pink-400",
		attr: "text-yellow-200",
		boolean: "text-purple-400",
		builtin: "text-emerald-400",
		cdata: "text-slate-400",
		char: "text-emerald-400",
		class: "text-blue-400",
		"class-name": "text-blue-400",
		comment: "text-slate-500 italic",
		constant: "text-purple-400",
		deleted: "text-red-400",
		doctype: "text-slate-500",
		entity: "text-amber-400 cursor-help",
		function: "text-sky-400",
		important: "text-amber-400 font-bold",
		inserted: "text-emerald-400",
		keyword: "text-indigo-400 font-medium",
		namespace: "text-amber-400",
		number: "text-amber-400",
		operator: "text-teal-400",
		prolog: "text-slate-500",
		property: "text-pink-400",
		punctuation: "text-slate-400",
		regex: "text-amber-400",
		selector: "text-emerald-400",
		string: "text-emerald-300",
		symbol: "text-amber-400",
		tag: "text-pink-400",
		url: "text-cyan-400 underline",
		variable: "text-violet-400",
	},
	table: "editor-table",
	tableCell: "editor-table-cell",
	tableCellHeader: "editor-table-cell-header",
};

function onError(error: Error) {
	console.error(error);
}

// Syncs content markdown with parent and initializes the editor
type MarkdownSyncPluginProps = {
	content?: string;
	onChange?: (content: string) => void;
};

function MarkdownSyncPlugin({ content, onChange }: MarkdownSyncPluginProps) {
	const [editor] = useLexicalComposerContext();
	const lastContentRef = useRef(content || "");

	// Handle prop content changes from parent
	useEffect(() => {
		if (content !== undefined && content !== lastContentRef.current) {
			lastContentRef.current = content;
			editor.update(() => {
				$convertFromMarkdownString(content, TRANSFORMERS);
			});
		}
	}, [editor, content]);

	return (
		<OnChangePlugin
			onChange={(editorState) => {
				editorState.read(() => {
					const markdown = $convertToMarkdownString(TRANSFORMERS);
					if (markdown !== lastContentRef.current) {
						lastContentRef.current = markdown;
						onChange?.(markdown);
					}
				});
			}}
		/>
	);
}

// Floating Selection Toolbar Component
function FloatingToolbarPlugin() {
	const [editor] = useLexicalComposerContext();
	const [visible, setVisible] = useState(false);
	const [position, setPosition] = useState({ top: 0, left: 0 });
	const [isBold, setIsBold] = useState(false);
	const [isItalic, setIsItalic] = useState(false);
	const [isUnderline, setIsUnderline] = useState(false);
	const [isStrikethrough, setIsStrikethrough] = useState(false);
	const [isCode, setIsCode] = useState(false);
	const [isLink, setIsLink] = useState(false);
	const [linkUrl, setLinkUrl] = useState("");
	const [showLinkInput, setShowLinkInput] = useState(false);

	const updateToolbar = useCallback(() => {
		const selection = $getSelection();
		const nativeSelection = window.getSelection();
		const activeElement = document.activeElement;

		if (
			$isRangeSelection(selection) &&
			nativeSelection &&
			!nativeSelection.isCollapsed &&
			activeElement &&
			editor.getRootElement()?.contains(activeElement)
		) {
			setIsBold(selection.hasFormat("bold"));
			setIsItalic(selection.hasFormat("italic"));
			setIsUnderline(selection.hasFormat("underline"));
			setIsStrikethrough(selection.hasFormat("strikethrough"));
			setIsCode(selection.hasFormat("code"));

			const node = selection.getNodes()[0];
			const parent = node?.getParent();
			const isLinkNode = $isLinkNode(parent) || $isLinkNode(node);
			setIsLink(isLinkNode);
			if (isLinkNode) {
				const url = $isLinkNode(parent)
					? parent.getURL()
					: $isLinkNode(node)
						? node.getURL()
						: "";
				setLinkUrl(url);
			} else {
				setLinkUrl("");
			}

			const range = nativeSelection.getRangeAt(0);
			const rect = range.getBoundingClientRect();
			const rootElement = editor.getRootElement();
			if (rootElement) {
				const parentElement = rootElement.parentElement;
				if (parentElement) {
					const parentRect = parentElement.getBoundingClientRect();
					setPosition({
						top: rect.top - parentRect.top - 48,
						left: rect.left - parentRect.left + rect.width / 2,
					});
				}
			}
			setVisible(true);
		} else {
			setVisible(false);
			setShowLinkInput(false);
		}
	}, [editor]);

	useEffect(() => {
		return editor.registerUpdateListener(({ editorState }) => {
			editorState.read(() => {
				updateToolbar();
			});
		});
	}, [editor, updateToolbar]);

	useEffect(() => {
		return editor.registerCommand(
			SELECTION_CHANGE_COMMAND,
			() => {
				updateToolbar();
				return false;
			},
			COMMAND_PRIORITY_LOW
		);
	}, [editor, updateToolbar]);

	useEffect(() => {
		const rootElement = editor.getRootElement();
		const handleScroll = () => {
			if (visible) updateToolbar();
		};
		rootElement?.addEventListener("scroll", handleScroll);
		return () => {
			rootElement?.removeEventListener("scroll", handleScroll);
		};
	}, [editor, visible, updateToolbar]);

	if (!visible) return null;

	const toggleLink = () => {
		if (isLink) {
			editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
			setShowLinkInput(false);
		} else {
			setShowLinkInput(true);
		}
	};

	const applyLink = () => {
		if (linkUrl.trim()) {
			editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl.trim());
		}
		setShowLinkInput(false);
	};

	return (
		<div
			style={{
				top: `${position.top}px`,
				left: `${position.left}px`,
				transform: "translateX(-50%)",
			}}
			className="absolute z-40 flex items-center gap-1 p-1 bg-bg-white-0 border border-stroke-soft-200 shadow-regular-md rounded-xl backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-100"
		>
			{!showLinkInput ? (
				<>
					<button
						type="button"
						onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
						className={`p-1.5 rounded-md hover:bg-bg-weak-50 text-text-sub-600 transition-colors ${
							isBold
								? "bg-primary-lighter text-primary-base ring-1 ring-primary-light/50 font-bold"
								: ""
						}`}
						title="Bold"
					>
						<Bold className="w-4 h-4" />
					</button>
					<button
						type="button"
						onClick={() =>
							editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")
						}
						className={`p-1.5 rounded-md hover:bg-bg-weak-50 text-text-sub-600 transition-colors ${
							isItalic
								? "bg-primary-lighter text-primary-base ring-1 ring-primary-light/50 italic"
								: ""
						}`}
						title="Italic"
					>
						<Italic className="w-4 h-4" />
					</button>
					<button
						type="button"
						onClick={() =>
							editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")
						}
						className={`p-1.5 rounded-md hover:bg-bg-weak-50 text-text-sub-600 transition-colors ${
							isUnderline
								? "bg-primary-lighter text-primary-base ring-1 ring-primary-light/50 underline"
								: ""
						}`}
						title="Underline"
					>
						<Underline className="w-4 h-4" />
					</button>
					<button
						type="button"
						onClick={() =>
							editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")
						}
						className={`p-1.5 rounded-md hover:bg-bg-weak-50 text-text-sub-600 transition-colors ${
							isStrikethrough
								? "bg-primary-lighter text-primary-base ring-1 ring-primary-light/50 line-through"
								: ""
						}`}
						title="Strikethrough"
					>
						<Strikethrough className="w-4 h-4" />
					</button>
					<button
						type="button"
						onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")}
						className={`p-1.5 rounded-md hover:bg-bg-weak-50 text-text-sub-600 transition-colors ${
							isCode
								? "bg-primary-lighter text-primary-base ring-1 ring-primary-light/50 font-mono"
								: ""
						}`}
						title="Inline Code"
					>
						<Code className="w-4 h-4" />
					</button>
					<div className="w-px h-4 bg-stroke-soft-200 mx-1" />
					<button
						type="button"
						onClick={toggleLink}
						className={`p-1.5 rounded-md hover:bg-bg-weak-50 text-text-sub-600 transition-colors ${
							isLink
								? "bg-primary-lighter text-primary-base ring-1 ring-primary-light/50"
								: ""
						}`}
						title={isLink ? "Remove Link" : "Add Link"}
					>
						{isLink ? (
							<Link2Off className="w-4 h-4" />
						) : (
							<Link className="w-4 h-4" />
						)}
					</button>
				</>
			) : (
				<div className="flex items-center gap-1 px-2 py-1">
					<input
						type="text"
						value={linkUrl}
						onChange={(e) => setLinkUrl(e.target.value)}
						placeholder="Paste link URL..."
						className="text-xs bg-bg-weak-50 outline-none px-2 py-1 rounded border border-stroke-soft-200 w-44"
						onKeyDown={(e) => {
							if (e.key === "Enter") applyLink();
							if (e.key === "Escape") setShowLinkInput(false);
						}}
					/>
					<button
						type="button"
						onClick={applyLink}
						className="p-1 rounded bg-primary-600 text-white hover:bg-primary-700 transition-colors"
					>
						<Check className="w-3.5 h-3.5" />
					</button>
				</div>
			)}
		</div>
	);
}

// Slash Commands Definition
type CommandOption = {
	key: string;
	label: string;
	description: string;
	icon: React.ComponentType<{ className?: string }>;
	action: (editor: LexicalEditorType) => void;
};

const COMMAND_OPTIONS: CommandOption[] = [
	{
		key: "h1",
		label: "Heading 1",
		description: "",
		icon: Heading1,
		action: (_editor) => {
			const selection = $getSelection();
			if ($isRangeSelection(selection)) {
				$setBlocksType(selection, () => $createHeadingNode("h1"));
			}
		},
	},
	{
		key: "h2",
		label: "Heading 2",
		description: "",
		icon: Heading2,
		action: (_editor) => {
			const selection = $getSelection();
			if ($isRangeSelection(selection)) {
				$setBlocksType(selection, () => $createHeadingNode("h2"));
			}
		},
	},
	{
		key: "h3",
		label: "Heading 3",
		description: "",
		icon: Heading3,
		action: (_editor) => {
			const selection = $getSelection();
			if ($isRangeSelection(selection)) {
				$setBlocksType(selection, () => $createHeadingNode("h3"));
			}
		},
	},
	{
		key: "bullet",
		label: "Bullet List",
		description: "",
		icon: List,
		action: (editor) => {
			editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
		},
	},
	{
		key: "numbered",
		label: "Numbered List",
		description: "",
		icon: ListOrdered,
		action: (editor) => {
			editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
		},
	},
	{
		key: "checklist",
		label: "Checklist",
		description: "",
		icon: CheckSquare,
		action: (editor) => {
			editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
		},
	},
	{
		key: "quote",
		label: "Quote",
		description: "",
		icon: Quote,
		action: (_editor) => {
			const selection = $getSelection();
			if ($isRangeSelection(selection)) {
				$setBlocksType(selection, () => $createQuoteNode());
			}
		},
	},
	{
		key: "code",
		label: "Code Block",
		description: "",
		icon: Code,
		action: (_editor) => {
			const selection = $getSelection();
			if ($isRangeSelection(selection)) {
				$setBlocksType(selection, () => $createCodeNode());
			}
		},
	},
	{
		key: "table",
		label: "Table",
		description: "",
		icon: Table,
		action: (editor) => {
			editor.dispatchCommand(INSERT_TABLE_COMMAND, { columns: "3", rows: "3" });
		},
	},
	{
		key: "clear",
		label: "Clear",
		description: "",
		icon: Trash2,
		action: (editor) => {
			editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
		},
	},
];

// Slash Commands Trigger & Dropdown Menu Component
function SlashCommandsPlugin() {
	const [editor] = useLexicalComposerContext();
	const [visible, setVisible] = useState(false);
	const [position, setPosition] = useState({ top: 0, left: 0 });
	const [search, setSearch] = useState("");
	const [selectedIndex, setSelectedIndex] = useState(0);

	const filteredOptions = COMMAND_OPTIONS.filter(
		(option) =>
			option.label.toLowerCase().includes(search.toLowerCase()) ||
			option.key.toLowerCase().includes(search.toLowerCase())
	);

	const updateSlashMenu = useCallback(() => {
		const selection = $getSelection();
		if ($isRangeSelection(selection) && selection.isCollapsed()) {
			const anchor = selection.anchor;
			if (anchor.type === "text") {
				const textNode = anchor.getNode();
				const text = textNode.getTextContent();
				const offset = anchor.offset;

				const lastSlash = text.lastIndexOf("/", offset - 1);
				if (lastSlash !== -1) {
					const textAfterSlash = text.substring(lastSlash + 1, offset);
					if (!textAfterSlash.includes(" ") && textAfterSlash.length < 15) {
						setSearch(textAfterSlash);
						setVisible(true);

						const nativeSelection = window.getSelection();
						if (nativeSelection && nativeSelection.rangeCount > 0) {
							const range = nativeSelection.getRangeAt(0);
							const rect = range.getBoundingClientRect();
							const rootElement = editor.getRootElement();
							if (rootElement) {
								const parentElement = rootElement.parentElement;
								if (parentElement) {
									const parentRect = parentElement.getBoundingClientRect();
									setPosition({
										top: rect.bottom - parentRect.top + 8,
										left: rect.left - parentRect.left,
									});
								}
							}
						}
						return;
					}
				}
			}
		}
		setVisible(false);
	}, [editor]);

	const executeOption = useCallback(
		(option: CommandOption) => {
			editor.update(() => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) {
					const anchor = selection.anchor;
					if (anchor.type === "text") {
						const textNode = anchor.getNode();
						const text = textNode.getTextContent();
						const offset = anchor.offset;
						const lastSlash = text.lastIndexOf("/", offset - 1);
						if (lastSlash !== -1) {
							const prefix = text.substring(0, lastSlash);
							const suffix = text.substring(offset);
							textNode.setTextContent(prefix + suffix);
							textNode.select(lastSlash, lastSlash);
						}
					}
					option.action(editor);
				}
			});
			setVisible(false);
		},
		[editor]
	);

	useEffect(() => {
		return editor.registerUpdateListener(({ editorState }) => {
			editorState.read(() => {
				updateSlashMenu();
			});
		});
	}, [editor, updateSlashMenu]);

	useEffect(() => {
		if (!visible || filteredOptions.length === 0) return;

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "ArrowDown") {
				event.preventDefault();
				setSelectedIndex((prev) => (prev + 1) % filteredOptions.length);
			} else if (event.key === "ArrowUp") {
				event.preventDefault();
				setSelectedIndex(
					(prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length
				);
			} else if (event.key === "Enter") {
				event.preventDefault();
				executeOption(filteredOptions[selectedIndex]);
			} else if (event.key === "Escape") {
				event.preventDefault();
				setVisible(false);
			}
		};

		const rootElement = editor.getRootElement();
		rootElement?.addEventListener("keydown", onKeyDown, true);
		return () => {
			rootElement?.removeEventListener("keydown", onKeyDown, true);
		};
	}, [visible, selectedIndex, filteredOptions, executeOption, editor]);

	useEffect(() => {
		const rootElement = editor.getRootElement();
		const handleScroll = () => {
			if (visible) updateSlashMenu();
		};
		rootElement?.addEventListener("scroll", handleScroll);
		return () => {
			rootElement?.removeEventListener("scroll", handleScroll);
		};
	}, [editor, visible, updateSlashMenu]);

	useEffect(() => {
		setSelectedIndex(0);
	}, []);

	if (!visible || filteredOptions.length === 0) return null;

	return (
		<div
			style={{
				top: `${position.top}px`,
				left: `${position.left}px`,
			}}
			className="absolute z-50 w-64 max-h-80 overflow-y-auto bg-bg-white-0 border border-stroke-soft-200 shadow-regular-md rounded-2xl p-1 flex flex-col gap-0.5 animate-in fade-in-0 slide-in-from-top-2 duration-100"
		>
			{filteredOptions.map((option, idx) => {
				const Icon = option.icon;
				const isSelected = idx === selectedIndex;
				return (
					<button
						key={option.key}
						type="button"
						onClick={() => executeOption(option)}
						onMouseEnter={() => setSelectedIndex(idx)}
						className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-xl transition duration-200 ${
							isSelected
								? "bg-bg-weak-50 text-text-strong-950 shadow-sm"
								: "text-text-sub-600 hover:bg-bg-weak-50/50"
						}`}
					>
						<div
							className={`p-1.5 rounded-md border ${
								isSelected
									? "bg-bg-white-0 border-stroke-soft-200 text-primary-600"
									: "bg-bg-weak-50/50 border-transparent text-text-sub-600"
							}`}
						>
							<Icon className="w-4 h-4" />
						</div>
						<div>
							<div className="text-sm font-medium">{option.label}</div>
							<div className="text-xxs text-text-sub-400">
								{option.description}
							</div>
						</div>
					</button>
				);
			})}
		</div>
	);
}

function ToolbarPlugin() {
	const [editor] = useLexicalComposerContext();
	const [canUndo, setCanUndo] = useState(false);
	const [canRedo, setCanRedo] = useState(false);
	const [isBold, setIsBold] = useState(false);
	const [isItalic, setIsItalic] = useState(false);
	const [isUnderline, setIsUnderline] = useState(false);
	const [isStrikethrough, setIsStrikethrough] = useState(false);
	const [isCode, setIsCode] = useState(false);
	const [alignment, setAlignment] = useState<
		"left" | "center" | "right" | "justify" | ""
	>("");

	const updateToolbar = useCallback(() => {
		const selection = $getSelection();
		if ($isRangeSelection(selection)) {
			setIsBold(selection.hasFormat("bold"));
			setIsItalic(selection.hasFormat("italic"));
			setIsUnderline(selection.hasFormat("underline"));
			setIsStrikethrough(selection.hasFormat("strikethrough"));
			setIsCode(selection.hasFormat("code"));

			const node = selection.getNodes()[0];
			let parent: import("lexical").LexicalNode | null = node
				? node.getParent()
				: null;
			let foundAlignment = false;
			while (parent !== null) {
				if ($isElementNode(parent)) {
					const format = parent.getFormatType();
					setAlignment(format as "left" | "center" | "right" | "justify" | "");
					foundAlignment = true;
					break;
				}
				parent = parent.getParent();
			}
			if (!foundAlignment) {
				setAlignment("");
			}
		}
	}, []);

	useEffect(() => {
		return editor.registerUpdateListener(({ editorState }) => {
			editorState.read(() => {
				updateToolbar();
			});
		});
	}, [editor, updateToolbar]);

	useEffect(() => {
		return editor.registerCommand(
			SELECTION_CHANGE_COMMAND,
			() => {
				updateToolbar();
				return false;
			},
			COMMAND_PRIORITY_LOW
		);
	}, [editor, updateToolbar]);

	useEffect(() => {
		return editor.registerCommand(
			CAN_UNDO_COMMAND,
			(payload) => {
				setCanUndo(payload);
				return false;
			},
			COMMAND_PRIORITY_LOW
		);
	}, [editor]);

	useEffect(() => {
		return editor.registerCommand(
			CAN_REDO_COMMAND,
			(payload) => {
				setCanRedo(payload);
				return false;
			},
			COMMAND_PRIORITY_LOW
		);
	}, [editor]);

	return (
		<div className="flex flex-wrap items-center gap-1 p-2 bg-bg-weak-50 border-b border-stroke-soft-200 rounded-t-2xl sticky top-0 z-10">
			<button
				type="button"
				disabled={!canUndo}
				onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
				className="p-1.5 rounded-md hover:bg-bg-weak-100 disabled:opacity-30 disabled:hover:bg-transparent text-text-sub-600 transition-colors"
				title="Undo"
			>
				<Undo2 className="w-4 h-4" />
			</button>
			<button
				type="button"
				disabled={!canRedo}
				onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
				className="p-1.5 rounded-md hover:bg-bg-weak-100 disabled:opacity-30 disabled:hover:bg-transparent text-text-sub-600 transition-colors"
				title="Redo"
			>
				<Redo2 className="w-4 h-4" />
			</button>

			<div className="w-px h-4 bg-stroke-soft-200 mx-1" />

			<button
				type="button"
				onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
				className={`p-1.5 rounded-md hover:bg-bg-weak-100 text-text-sub-600 transition-colors ${
					isBold
						? "bg-primary-lighter text-primary-base ring-1 ring-primary-light/50 font-bold"
						: ""
				}`}
				title="Bold"
			>
				<Bold className="w-4 h-4" />
			</button>
			<button
				type="button"
				onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
				className={`p-1.5 rounded-md hover:bg-bg-weak-100 text-text-sub-600 transition-colors ${
					isItalic
						? "bg-primary-lighter text-primary-base ring-1 ring-primary-light/50 italic"
						: ""
				}`}
				title="Italic"
			>
				<Italic className="w-4 h-4" />
			</button>
			<button
				type="button"
				onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
				className={`p-1.5 rounded-md hover:bg-bg-weak-100 text-text-sub-600 transition-colors ${
					isUnderline
						? "bg-primary-lighter text-primary-base ring-1 ring-primary-light/50 underline"
						: ""
				}`}
				title="Underline"
			>
				<Underline className="w-4 h-4" />
			</button>
			<button
				type="button"
				onClick={() =>
					editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")
				}
				className={`p-1.5 rounded-md hover:bg-bg-weak-100 text-text-sub-600 transition-colors ${
					isStrikethrough
						? "bg-primary-lighter text-primary-base ring-1 ring-primary-light/50 line-through"
						: ""
				}`}
				title="Strikethrough"
			>
				<Strikethrough className="w-4 h-4" />
			</button>
			<button
				type="button"
				onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")}
				className={`p-1.5 rounded-md hover:bg-bg-weak-100 text-text-sub-600 transition-colors ${
					isCode
						? "bg-primary-lighter text-primary-base ring-1 ring-primary-light/50 font-mono"
						: ""
				}`}
				title="Inline Code"
			>
				<Code className="w-4 h-4" />
			</button>

			<div className="w-px h-4 bg-stroke-soft-200 mx-1" />

			<button
				type="button"
				onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left")}
				className={`p-1.5 rounded-md hover:bg-bg-weak-100 text-text-sub-600 transition-colors ${
					alignment === "left"
						? "bg-primary-lighter text-primary-base ring-1 ring-primary-light/50"
						: ""
				}`}
				title="Align Left"
			>
				<AlignLeft className="w-4 h-4" />
			</button>
			<button
				type="button"
				onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center")}
				className={`p-1.5 rounded-md hover:bg-bg-weak-100 text-text-sub-600 transition-colors ${
					alignment === "center"
						? "bg-primary-lighter text-primary-base ring-1 ring-primary-light/50"
						: ""
				}`}
				title="Align Center"
			>
				<AlignCenter className="w-4 h-4" />
			</button>
			<button
				type="button"
				onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right")}
				className={`p-1.5 rounded-md hover:bg-bg-weak-100 text-text-sub-600 transition-colors ${
					alignment === "right"
						? "bg-primary-lighter text-primary-base ring-1 ring-primary-light/50"
						: ""
				}`}
				title="Align Right"
			>
				<AlignRight className="w-4 h-4" />
			</button>
			<button
				type="button"
				onClick={() =>
					editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "justify")
				}
				className={`p-1.5 rounded-md hover:bg-bg-weak-100 text-text-sub-600 transition-colors ${
					alignment === "justify"
						? "bg-primary-lighter text-primary-base ring-1 ring-primary-light/50"
						: ""
				}`}
				title="Align Justify"
			>
				<AlignJustify className="w-4 h-4" />
			</button>
		</div>
	);
}

type Props = {
	content?: string;
	onChange?: (content: string) => void;
	placeholder?: string;
	className?: string;
};

export function LexicalEditor({
	content,
	onChange,
	placeholder = 'Start typing (or press "/" for commands)...',
	className,
}: Props) {
	const initialConfig = {
		namespace: "MyEditor",
		theme,
		onError,
		nodes: EDITOR_NODES,
		editorState: () => {
			if (content) {
				$convertFromMarkdownString(content, TRANSFORMERS);
			}
		},
	};

	return (
		<LexicalComposer initialConfig={initialConfig}>
			<div
				className={cn(
					"relative border border-stroke-soft-200 rounded-2xl bg-bg-white-0 shadow-regular-sm focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all duration-200",
					className
				)}
			>
				<ToolbarPlugin />
				<div className="prose max-w-none p-4 min-h-[220px] relative prose-p:mt-0">
					<RichTextPlugin
						contentEditable={
							<ContentEditable
								aria-placeholder={placeholder}
								placeholder={
									<div className="text-text-disabled-300 absolute pointer-events-none select-none top-4 left-4 right-4">
										{placeholder}
									</div>
								}
								className="min-h-[200px] outline-none max-h-[600px] overflow-y-auto"
							/>
						}
						ErrorBoundary={LexicalErrorBoundary}
					/>
				</div>
				<HistoryPlugin />
				<MarkdownSyncPlugin content={content} onChange={onChange} />
				<AutoFocusPlugin defaultSelection="rootEnd" />
				<LinkPlugin />
				<ListPlugin />
				<CheckListPlugin />
				<TablePlugin />
				<TabIndentationPlugin />
				<ClearEditorPlugin />
				<MarkdownShortcutPlugin transformers={TRANSFORMERS} />
				<FloatingToolbarPlugin />
				<SlashCommandsPlugin />
			</div>
		</LexicalComposer>
	);
}

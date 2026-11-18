"use client";

import {
	$createCodeNode,
	$isCodeNode,
	CodeHighlightNode,
	CodeNode,
} from "@lexical/code";
import {
	$isLinkNode,
	AutoLinkNode,
	LinkNode,
	TOGGLE_LINK_COMMAND,
} from "@lexical/link";
import {
	$isListItemNode,
	$isListNode,
	INSERT_CHECK_LIST_COMMAND,
	INSERT_ORDERED_LIST_COMMAND,
	INSERT_UNORDERED_LIST_COMMAND,
	ListItemNode,
	ListNode,
} from "@lexical/list";
import {
	$convertFromMarkdownString,
	$convertToMarkdownString,
} from "@lexical/markdown";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { ClearEditorPlugin } from "@lexical/react/LexicalClearEditorPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import {
	$createHorizontalRuleNode,
	HorizontalRuleNode,
	INSERT_HORIZONTAL_RULE_COMMAND,
} from "@lexical/react/LexicalHorizontalRuleNode";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
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
	$isHeadingNode,
	$isQuoteNode,
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
	$createParagraphNode,
	$getSelection,
	$isElementNode,
	$isRangeSelection,
	$isRootNode,
	CAN_REDO_COMMAND,
	CAN_UNDO_COMMAND,
	CLEAR_EDITOR_COMMAND,
	COMMAND_PRIORITY_LOW,
	type ElementNode,
	FORMAT_ELEMENT_COMMAND,
	FORMAT_TEXT_COMMAND,
	type LexicalEditor as LexicalEditorType,
	type LexicalNode,
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
	Code2,
	Eye,
	Heading1,
	Heading2,
	Heading3,
	Image as ImageIcon,
	Italic,
	Lightbulb,
	Link,
	List,
	ListOrdered,
	Minus,
	PenLine,
	Pilcrow,
	Quote,
	Redo2,
	Strikethrough,
	Table,
	Trash2,
	Underline,
	Undo2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
	type ComponentType,
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MDXView } from "@/components/widgets/markdown-view";
import { cn } from "@/lib/utils";
import { MD_TRANSFORMERS } from "./markdown-table-transformer";

/**
 * Marker inserted by the callout (نکته مهم) toolbar/slash action, localized
 * to the active document language so the rendered bold label matches what
 * the author writes in.
 */
function defaultCalloutMarker(): string {
	const lang =
		typeof document !== "undefined" ? document.documentElement.lang : "en";
	if (lang.startsWith("fa")) return "[نکته مهم]";
	if (lang.startsWith("ps")) return "[مهمه نکته]";
	return "[!important]";
}

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
	HorizontalRuleNode,
];

const theme = {
	ltr: "text-left",
	rtl: "text-right",
	placeholder:
		"text-muted-foreground absolute pointer-events-none select-none top-4 start-4 end-4",
	paragraph: "text-sm text-foreground mb-2 relative leading-relaxed",
	quote:
		"border-s-4 border-primary ps-4 italic text-muted-foreground my-4 bg-muted/40 py-2 pe-2 rounded-e-lg",
	heading: {
		h1: "text-2xl font-bold text-foreground mt-5 mb-2 leading-tight tracking-tight",
		h2: "text-xl font-semibold text-foreground mt-4 mb-2 leading-snug tracking-tight",
		h3: "text-lg font-semibold text-foreground mt-3 mb-2 leading-normal tracking-tight",
	},
	list: {
		nested: {
			listitem: "list-none",
		},
		ol: "list-decimal ps-6 my-2 space-y-1",
		ul: "list-disc ps-6 my-2 space-y-1",
		listitem: "text-foreground",
		listitemChecked: "editor-listitem-checked",
		listitemUnchecked: "editor-listitem-unchecked",
	},
	checklist: "ps-6 my-2 space-y-1 list-none",
	link: "text-primary underline underline-offset-2 hover:opacity-80 cursor-pointer transition duration-150",
	text: {
		bold: "font-bold",
		italic: "italic",
		underline: "underline",
		strikethrough: "line-through",
		code: "font-mono text-[0.9em] bg-muted text-foreground px-1.5 py-0.5 rounded border border-border",
	},
	code: "font-mono text-sm bg-slate-900 text-slate-100 p-4 rounded-xl my-3 overflow-x-auto block leading-relaxed shadow-inner border border-slate-800",
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
				$convertFromMarkdownString(content, MD_TRANSFORMERS);
			});
		}
	}, [editor, content]);

	return (
		<OnChangePlugin
			onChange={(editorState) => {
				editorState.read(() => {
					const markdown = $convertToMarkdownString(MD_TRANSFORMERS);
					if (markdown !== lastContentRef.current) {
						lastContentRef.current = markdown;
						onChange?.(markdown);
					}
				});
			}}
		/>
	);
}

// ─── Shared toolbar atoms ─────────────────────────────────────────────────────

function ToolbarButton({
	onClick,
	active = false,
	disabled = false,
	title,
	children,
}: {
	onClick: () => void;
	active?: boolean;
	disabled?: boolean;
	title: string;
	children: ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			title={title}
			aria-label={title}
			aria-pressed={active}
			className={cn(
				"inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent",
				active && "bg-primary/10 text-primary ring-1 ring-primary/30"
			)}
		>
			{children}
		</button>
	);
}

function ToolbarSeparator() {
	return <div className="mx-0.5 h-5 w-px bg-border" aria-hidden="true" />;
}

// Floating Selection Toolbar Component
function FloatingToolbarPlugin() {
	const [editor] = useLexicalComposerContext();
	const t = useTranslations("editor");
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

	const toggleLink = () => {
		if (isLink) {
			editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
		} else {
			setShowLinkInput(true);
		}
	};

	const applyLink = () => {
		if (linkUrl.trim()) {
			editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl.trim());
			setShowLinkInput(false);
		}
	};

	if (!visible) return null;

	return (
		<div
			style={{
				top: `${position.top}px`,
				left: `${position.left}px`,
				transform: "translateX(-50%)",
			}}
			className="absolute z-50 flex items-center gap-0.5 rounded-lg border border-border bg-popover p-1 shadow-md"
		>
			{!showLinkInput ? (
				<>
					<ToolbarButton
						title={t("toolbar.bold")}
						active={isBold}
						onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
					>
						<Bold className="size-4" />
					</ToolbarButton>
					<ToolbarButton
						title={t("toolbar.italic")}
						active={isItalic}
						onClick={() =>
							editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")
						}
					>
						<Italic className="size-4" />
					</ToolbarButton>
					<ToolbarButton
						title={t("toolbar.underline")}
						active={isUnderline}
						onClick={() =>
							editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")
						}
					>
						<Underline className="size-4" />
					</ToolbarButton>
					<ToolbarButton
						title={t("toolbar.strikethrough")}
						active={isStrikethrough}
						onClick={() =>
							editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")
						}
					>
						<Strikethrough className="size-4" />
					</ToolbarButton>
					<ToolbarButton
						title={t("toolbar.inlineCode")}
						active={isCode}
						onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")}
					>
						<Code className="size-4" />
					</ToolbarButton>
					<ToolbarButton
						title={isLink ? t("toolbar.removeLink") : t("toolbar.link")}
						active={isLink}
						onClick={toggleLink}
					>
						<Link className="size-4" />
					</ToolbarButton>
				</>
			) : (
				<div className="flex items-center gap-1 px-1">
					<input
						type="text"
						value={linkUrl}
						onChange={(e) => setLinkUrl(e.target.value)}
						placeholder={t("link.placeholder")}
						className="w-44 rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
						onKeyDown={(e) => {
							if (e.key === "Enter") applyLink();
							if (e.key === "Escape") setShowLinkInput(false);
						}}
					/>
					<button
						type="button"
						onClick={applyLink}
						title={t("link.apply")}
						aria-label={t("link.apply")}
						className="rounded-md bg-primary p-1 text-primary-foreground transition-colors hover:opacity-90"
					>
						<Check className="size-3.5" />
					</button>
				</div>
			)}
		</div>
	);
}

// ─── Slash commands ──────────────────────────────────────────────────────────

type CommandOption = {
	key: string;
	label: string;
	icon: ComponentType<{ className?: string }>;
	action: (editor: LexicalEditorType) => void;
};

function insertMarkdownImage(
	editor: LexicalEditorType,
	alt: string,
	url: string
) {
	editor.update(() => {
		const selection = $getSelection();
		if ($isRangeSelection(selection)) {
			selection.insertText(`![${alt}](${url})`);
		}
	});
}

function getCommandOptions(
	t: ReturnType<typeof useTranslations>
): CommandOption[] {
	return [
		{
			key: "h1",
			label: t("slash.h1"),
			icon: Heading1,
			action: () => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) {
					$setBlocksType(selection, () => $createHeadingNode("h1"));
				}
			},
		},
		{
			key: "h2",
			label: t("slash.h2"),
			icon: Heading2,
			action: () => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) {
					$setBlocksType(selection, () => $createHeadingNode("h2"));
				}
			},
		},
		{
			key: "h3",
			label: t("slash.h3"),
			icon: Heading3,
			action: () => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) {
					$setBlocksType(selection, () => $createHeadingNode("h3"));
				}
			},
		},
		{
			key: "bullet",
			label: t("slash.bullet"),
			icon: List,
			action: (editor) => {
				editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
			},
		},
		{
			key: "numbered",
			label: t("slash.numbered"),
			icon: ListOrdered,
			action: (editor) => {
				editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
			},
		},
		{
			key: "checklist",
			label: t("slash.checklist"),
			icon: CheckSquare,
			action: (editor) => {
				editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
			},
		},
		{
			key: "quote",
			label: t("slash.quote"),
			icon: Quote,
			action: () => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) {
					$setBlocksType(selection, () => $createQuoteNode());
				}
			},
		},
		{
			key: "callout",
			label: t("slash.callout"),
			icon: Lightbulb,
			action: () => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) {
					$setBlocksType(selection, () => $createQuoteNode());
					if (selection.isCollapsed()) {
						selection.insertText(`${defaultCalloutMarker()} `);
					}
				}
			},
		},
		{
			key: "code",
			label: t("slash.code"),
			icon: Code2,
			action: () => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) {
					$setBlocksType(selection, () => $createCodeNode());
				}
			},
		},
		{
			key: "table",
			label: t("slash.table"),
			icon: Table,
			action: (editor) => {
				editor.dispatchCommand(INSERT_TABLE_COMMAND, {
					columns: "3",
					rows: "3",
				});
			},
		},
		{
			key: "hr",
			label: t("slash.hr"),
			icon: Minus,
			action: (editor) => {
				editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
			},
		},
		{
			key: "image",
			label: t("slash.image"),
			icon: ImageIcon,
			action: (editor) => {
				insertMarkdownImage(editor, "alt", "https://");
			},
		},
		{
			key: "clear",
			label: t("slash.clear"),
			icon: Trash2,
			action: (editor) => {
				editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
			},
		},
	];
}

// Slash Commands Trigger & Dropdown Menu Component
function SlashCommandsPlugin() {
	const [editor] = useLexicalComposerContext();
	const t = useTranslations("editor");
	const options = useMemo(() => getCommandOptions(t), [t]);
	const [visible, setVisible] = useState(false);
	const [position, setPosition] = useState({ top: 0, left: 0 });
	const [search, setSearch] = useState("");
	const [selectedIndex, setSelectedIndex] = useState(0);

	const filteredOptions = options.filter(
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
		(option: CommandOption | undefined) => {
			if (!option) return;
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
	}, [search]);

	if (!visible || filteredOptions.length === 0) return null;

	return (
		<div
			style={{
				top: `${position.top}px`,
				left: `${position.left}px`,
			}}
			className="absolute z-50 flex max-h-80 w-64 flex-col gap-0.5 overflow-y-auto rounded-xl border border-border bg-popover p-1 shadow-md"
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
						className={cn(
							"flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-start transition-colors",
							isSelected
								? "bg-muted text-foreground"
								: "text-muted-foreground hover:bg-muted/50"
						)}
					>
						<div
							className={cn(
								"rounded-md border p-1.5",
								isSelected
									? "border-border bg-background text-primary"
									: "border-transparent bg-muted/50 text-muted-foreground"
							)}
						>
							<Icon className="size-4" />
						</div>
						<div className="text-sm font-medium">{option.label}</div>
					</button>
				);
			})}
		</div>
	);
}

// ─── Main toolbar ────────────────────────────────────────────────────────────

function getBlockTypeName(): string {
	const selection = $getSelection();
	if (!$isRangeSelection(selection)) return "paragraph";
	let node: LexicalNode = selection.anchor.getNode();
	while (node.getParent() && !$isRootNode(node.getParent())) {
		const parent: LexicalNode = node.getParent() as LexicalNode;
		node = parent;
	}
	if ($isHeadingNode(node)) return node.getTag();
	if ($isQuoteNode(node)) return "quote";
	if ($isCodeNode(node)) return "code";
	if ($isListNode(node)) return node.getListType();
	if ($isListItemNode(node)) {
		const parent = node.getParent();
		if ($isListNode(parent)) return parent.getListType();
	}
	return "paragraph";
}

function ToolbarPlugin() {
	const [editor] = useLexicalComposerContext();
	const t = useTranslations("editor");
	const [canUndo, setCanUndo] = useState(false);
	const [canRedo, setCanRedo] = useState(false);
	const [isBold, setIsBold] = useState(false);
	const [isItalic, setIsItalic] = useState(false);
	const [isUnderline, setIsUnderline] = useState(false);
	const [isStrikethrough, setIsStrikethrough] = useState(false);
	const [isCode, setIsCode] = useState(false);
	const [blockType, setBlockType] = useState("paragraph");
	const [alignment, setAlignment] = useState<
		"left" | "center" | "right" | "justify" | ""
	>("");
	const [showImageInput, setShowImageInput] = useState(false);
	const [imageAlt, setImageAlt] = useState("");
	const [imageUrl, setImageUrl] = useState("");

	const updateToolbar = useCallback(() => {
		const selection = $getSelection();
		if ($isRangeSelection(selection)) {
			setIsBold(selection.hasFormat("bold"));
			setIsItalic(selection.hasFormat("italic"));
			setIsUnderline(selection.hasFormat("underline"));
			setIsStrikethrough(selection.hasFormat("strikethrough"));
			setIsCode(selection.hasFormat("code"));
			setBlockType(getBlockTypeName());

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

	const setBlock = (create: () => ElementNode) => {
		editor.update(() => {
			const selection = $getSelection();
			if ($isRangeSelection(selection)) {
				$setBlocksType(selection, create);
			}
		});
	};

	const applyImage = () => {
		if (imageUrl.trim()) {
			insertMarkdownImage(editor, imageAlt.trim() || "image", imageUrl.trim());
			setShowImageInput(false);
			setImageAlt("");
			setImageUrl("");
		}
	};

	return (
		<div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 p-1.5">
			<ToolbarButton
				title={t("toolbar.undo")}
				disabled={!canUndo}
				onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
			>
				<Undo2 className="size-4" />
			</ToolbarButton>
			<ToolbarButton
				title={t("toolbar.redo")}
				disabled={!canRedo}
				onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
			>
				<Redo2 className="size-4" />
			</ToolbarButton>

			<ToolbarSeparator />

			<ToolbarButton
				title={t("toolbar.paragraph")}
				active={blockType === "paragraph"}
				onClick={() => setBlock(() => $createParagraphNode())}
			>
				<Pilcrow className="size-4" />
			</ToolbarButton>
			<ToolbarButton
				title={t("toolbar.heading1")}
				active={blockType === "h1"}
				onClick={() => setBlock(() => $createHeadingNode("h1"))}
			>
				<Heading1 className="size-4" />
			</ToolbarButton>
			<ToolbarButton
				title={t("toolbar.heading2")}
				active={blockType === "h2"}
				onClick={() => setBlock(() => $createHeadingNode("h2"))}
			>
				<Heading2 className="size-4" />
			</ToolbarButton>
			<ToolbarButton
				title={t("toolbar.heading3")}
				active={blockType === "h3"}
				onClick={() => setBlock(() => $createHeadingNode("h3"))}
			>
				<Heading3 className="size-4" />
			</ToolbarButton>
			<ToolbarButton
				title={t("toolbar.quote")}
				active={blockType === "quote"}
				onClick={() => setBlock(() => $createQuoteNode())}
			>
				<Quote className="size-4" />
			</ToolbarButton>
			<ToolbarButton
				title={t("toolbar.codeBlock")}
				active={blockType === "code"}
				onClick={() => setBlock(() => $createCodeNode())}
			>
				<Code2 className="size-4" />
			</ToolbarButton>

			<ToolbarSeparator />

			<ToolbarButton
				title={t("toolbar.bulletList")}
				active={blockType === "bullet"}
				onClick={() =>
					editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
				}
			>
				<List className="size-4" />
			</ToolbarButton>
			<ToolbarButton
				title={t("toolbar.orderedList")}
				active={blockType === "number"}
				onClick={() =>
					editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
				}
			>
				<ListOrdered className="size-4" />
			</ToolbarButton>
			<ToolbarButton
				title={t("toolbar.checklist")}
				active={blockType === "check"}
				onClick={() =>
					editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)
				}
			>
				<CheckSquare className="size-4" />
			</ToolbarButton>

			<ToolbarSeparator />

			<ToolbarButton
				title={t("toolbar.bold")}
				active={isBold}
				onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
			>
				<Bold className="size-4" />
			</ToolbarButton>
			<ToolbarButton
				title={t("toolbar.italic")}
				active={isItalic}
				onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
			>
				<Italic className="size-4" />
			</ToolbarButton>
			<ToolbarButton
				title={t("toolbar.underline")}
				active={isUnderline}
				onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
			>
				<Underline className="size-4" />
			</ToolbarButton>
			<ToolbarButton
				title={t("toolbar.strikethrough")}
				active={isStrikethrough}
				onClick={() =>
					editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")
				}
			>
				<Strikethrough className="size-4" />
			</ToolbarButton>
			<ToolbarButton
				title={t("toolbar.inlineCode")}
				active={isCode}
				onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")}
			>
				<Code className="size-4" />
			</ToolbarButton>

			<ToolbarSeparator />

			<ToolbarButton
				title={t("toolbar.link")}
				onClick={() => {
					const selection = $getSelection();
					if ($isRangeSelection(selection)) {
						editor.dispatchCommand(TOGGLE_LINK_COMMAND, "https://");
					}
				}}
			>
				<Link className="size-4" />
			</ToolbarButton>
			<ToolbarButton
				title={t("toolbar.image")}
				active={showImageInput}
				onClick={() => setShowImageInput((prev) => !prev)}
			>
				<ImageIcon className="size-4" />
			</ToolbarButton>
			<ToolbarButton
				title={t("toolbar.table")}
				onClick={() =>
					editor.dispatchCommand(INSERT_TABLE_COMMAND, {
						columns: "3",
						rows: "3",
					})
				}
			>
				<Table className="size-4" />
			</ToolbarButton>
			<ToolbarButton
				title={t("toolbar.hr")}
				onClick={() =>
					editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)
				}
			>
				<Minus className="size-4" />
			</ToolbarButton>
			<ToolbarButton
				title={t("toolbar.callout")}
				onClick={() =>
					editor.update(() => {
						const selection = $getSelection();
						if ($isRangeSelection(selection)) {
							$setBlocksType(selection, () => $createQuoteNode());
							if (selection.isCollapsed()) {
								selection.insertText(`${defaultCalloutMarker()} `);
							}
						}
					})
				}
			>
				<Lightbulb className="size-4" />
			</ToolbarButton>

			<ToolbarSeparator />

			<ToolbarButton
				title={t("toolbar.alignRight")}
				active={alignment === "right"}
				onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right")}
			>
				<AlignRight className="size-4" />
			</ToolbarButton>
			<ToolbarButton
				title={t("toolbar.alignCenter")}
				active={alignment === "center"}
				onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center")}
			>
				<AlignCenter className="size-4" />
			</ToolbarButton>
			<ToolbarButton
				title={t("toolbar.alignLeft")}
				active={alignment === "left"}
				onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left")}
			>
				<AlignLeft className="size-4" />
			</ToolbarButton>
			<ToolbarButton
				title={t("toolbar.alignJustify")}
				active={alignment === "justify"}
				onClick={() =>
					editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "justify")
				}
			>
				<AlignJustify className="size-4" />
			</ToolbarButton>

			<ToolbarSeparator />

			<ToolbarButton
				title={t("toolbar.clear")}
				onClick={() => editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined)}
			>
				<Trash2 className="size-4" />
			</ToolbarButton>

			{showImageInput ? (
				<div className="ms-1 flex flex-wrap items-center gap-1 rounded-lg border border-border bg-background p-1">
					<input
						type="text"
						value={imageAlt}
						onChange={(e) => setImageAlt(e.target.value)}
						placeholder={t("image.altPlaceholder")}
						className="w-28 rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
					/>
					<input
						type="text"
						value={imageUrl}
						onChange={(e) => setImageUrl(e.target.value)}
						placeholder={t("image.urlPlaceholder")}
						className="w-44 rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
						onKeyDown={(e) => {
							if (e.key === "Enter") applyImage();
							if (e.key === "Escape") setShowImageInput(false);
						}}
					/>
					<button
						type="button"
						onClick={applyImage}
						title={t("image.apply")}
						aria-label={t("image.apply")}
						className="rounded-md bg-primary p-1 text-primary-foreground transition-colors hover:opacity-90"
					>
						<Check className="size-3.5" />
					</button>
				</div>
			) : null}
		</div>
	);
}

// ─── Public component (tabbed markdown editor) ───────────────────────────────

type Props = {
	content?: string;
	onChange?: (content: string) => void;
	placeholder?: string;
	className?: string;
};

const PANEL_HEIGHT = "max-h-[480px] overflow-y-auto";

export function LexicalEditor({
	content,
	onChange,
	placeholder = 'Start typing (or press "/" for commands)...',
	className,
}: Props) {
	const t = useTranslations("editor");
	const [markdown, setMarkdown] = useState(content ?? "");
	const [tab, setTab] = useState("write");
	const lastPropRef = useRef(content ?? "");
	const markdownRef = useRef(markdown);
	markdownRef.current = markdown;

	// Parent → local (external content resets).
	useEffect(() => {
		if (content !== undefined && content !== lastPropRef.current) {
			lastPropRef.current = content;
			setMarkdown(content);
		}
	}, [content]);

	const emit = useCallback(
		(next: string) => {
			lastPropRef.current = next;
			setMarkdown(next);
			onChange?.(next);
		},
		[onChange]
	);

	// Built once; reads the live markdown through a ref so tab remounts of the
	// composer always import the latest content (including source-tab edits).
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const initialConfig = useMemo(
		() => ({
			namespace: "CourseMarkdownEditor",
			theme,
			onError,
			nodes: EDITOR_NODES,
			editorState: () => {
				const md = markdownRef.current;
				if (md) {
					$convertFromMarkdownString(md, MD_TRANSFORMERS);
				}
			},
		}),
		[]
	);

	return (
		<div
			className={cn(
				"overflow-hidden rounded-xl border border-border bg-background shadow-xs transition-all duration-200 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20",
				className
			)}
		>
			<Tabs value={tab} onValueChange={setTab}>
				<TabsList className="h-9 w-full justify-start gap-1 rounded-none border-b border-border bg-muted/30 px-2">
					<TabsTrigger value="write" className="gap-1.5 text-xs">
						<PenLine className="size-3.5" />
						{t("tabs.write")}
					</TabsTrigger>
					<TabsTrigger value="preview" className="gap-1.5 text-xs">
						<Eye className="size-3.5" />
						{t("tabs.preview")}
					</TabsTrigger>
					<TabsTrigger value="source" className="gap-1.5 text-xs">
						<Code2 className="size-3.5" />
						{t("tabs.source")}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="write" className="mt-0">
					<LexicalComposer initialConfig={initialConfig}>
						<ToolbarPlugin />
						<div className={cn("relative", PANEL_HEIGHT)}>
							<div className="relative p-4">
								<RichTextPlugin
									contentEditable={
										<ContentEditable
											aria-placeholder={placeholder}
											placeholder={
												<div className="text-muted-foreground absolute pointer-events-none select-none top-4 start-4 end-4">
													{placeholder}
												</div>
											}
											className="min-h-[220px] outline-none"
										/>
									}
									ErrorBoundary={LexicalErrorBoundary}
								/>
							</div>
							<FloatingToolbarPlugin />
							<SlashCommandsPlugin />
						</div>
						<HistoryPlugin />
						<MarkdownSyncPlugin content={markdown} onChange={emit} />
						<LinkPlugin />
						<ListPlugin />
						<CheckListPlugin />
						<TablePlugin />
						<HorizontalRulePlugin />
						<TabIndentationPlugin />
						<ClearEditorPlugin />
						<MarkdownShortcutPlugin transformers={MD_TRANSFORMERS} />
					</LexicalComposer>
				</TabsContent>

				<TabsContent value="preview" className="mt-0">
					<div className={cn("bg-background p-4", PANEL_HEIGHT)}>
						{markdown.trim() ? (
							<MDXView markdown={markdown} className="max-w-none" />
						) : (
							<p className="text-muted-foreground text-sm">
								{t("preview.empty")}
							</p>
						)}
					</div>
				</TabsContent>

				<TabsContent value="source" className="mt-0">
					<div className={cn("bg-background p-3", PANEL_HEIGHT)}>
						<textarea
							value={markdown}
							onChange={(e) => emit(e.target.value)}
							dir="auto"
							spellCheck={false}
							aria-label={t("tabs.source")}
							placeholder={t("source.placeholder")}
							className="min-h-[300px] w-full resize-y rounded-lg border border-border bg-muted/20 p-3 font-mono text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
						/>
						<p className="mt-2 text-muted-foreground text-xs">
							{t("source.hint")}
						</p>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}

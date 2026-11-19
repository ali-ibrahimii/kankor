"use client";

import {
	$createCodeHighlightNode,
	$isCodeNode,
	type CodeNode,
	registerCodeHighlighting,
} from "@lexical/code";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$createLineBreakNode,
	$createParagraphNode,
	$createTabNode,
	$createTextNode,
	$getNodeByKey,
	$getRoot,
	$getSelection,
	$isRangeSelection,
	COMMAND_PRIORITY_LOW,
	KEY_ARROW_DOWN_COMMAND,
	KEY_ENTER_COMMAND,
	type LexicalNode,
} from "lexical";
import { Check, Copy, CornerDownLeft, FolderTree } from "lucide-react";
import { useTranslations } from "next-intl";
import type Prism from "prismjs";
import {
	type RefObject,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import {
	CODE_LANGUAGE_OPTIONS,
	copyTextToClipboard,
	DEFAULT_PROJECT_TREE_TEMPLATE,
	PROJECT_TREE_SNIPPETS,
	resolveCodeBlockMeta,
	tokenizeCode,
} from "@/lib/code-highlight";
import { cn } from "@/lib/utils";

// ─── Lexical Prism Tokenizer ─────────────────────────────────────────────────

function mapPrismTokensToLexicalNodes(
	tokens: Array<string | Prism.Token>,
	inheritedType?: string
): LexicalNode[] {
	const nodes: LexicalNode[] = [];
	for (const token of tokens) {
		if (typeof token === "string") {
			const parts = token.split(/(\n|\t)/);
			for (const part of parts) {
				if (!part) continue;
				if (part === "\n") {
					nodes.push($createLineBreakNode());
				} else if (part === "\t") {
					nodes.push($createTabNode());
				} else {
					nodes.push($createCodeHighlightNode(part, inheritedType));
				}
			}
		} else {
			const nextType = token.type === "unchanged" ? undefined : token.type;
			const { content } = token;
			if (typeof content === "string") {
				nodes.push(...mapPrismTokensToLexicalNodes([content], nextType));
			} else if (Array.isArray(content)) {
				nodes.push(
					...mapPrismTokensToLexicalNodes(
						content as Array<string | Prism.Token>,
						nextType
					)
				);
			} else if (content) {
				nodes.push(
					...mapPrismTokensToLexicalNodes([content as Prism.Token], nextType)
				);
			}
		}
	}
	return nodes;
}

const KANKOR_LEXICAL_TOKENIZER = {
	defaultLanguage: "text",
	tokenize(code: string, language?: string) {
		return tokenizeCode(code, language);
	},
	$tokenize(codeNode: CodeNode, language?: string) {
		const tokens = tokenizeCode(codeNode.getTextContent(), language || "text");
		return mapPrismTokensToLexicalNodes(tokens);
	},
};

function $findParentCodeNode(node: LexicalNode | null): CodeNode | null {
	let cur: LexicalNode | null = node;
	while (cur) {
		if ($isCodeNode(cur)) return cur;
		cur = cur.getParent();
	}
	return null;
}

/**
 * Enables live syntax highlighting inside Lexical `CodeNode`s (while keeping
 * `text` blocks clean & uncolored) and lets authors exit a code block cleanly
 * with Ctrl/Cmd+Enter or ArrowDown at the end of the last block.
 */
export function CodeHighlightPlugin() {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		return registerCodeHighlighting(editor, KANKOR_LEXICAL_TOKENIZER);
	}, [editor]);

	useEffect(() => {
		const unregisterEnter = editor.registerCommand(
			KEY_ENTER_COMMAND,
			(event) => {
				if (!event || !(event.ctrlKey || event.metaKey)) return false;
				const selection = $getSelection();
				if (!$isRangeSelection(selection)) return false;
				const codeNode = $findParentCodeNode(selection.anchor.getNode());
				if (!codeNode) return false;

				event.preventDefault();
				const paragraph = $createParagraphNode();
				codeNode.insertAfter(paragraph);
				paragraph.select();
				return true;
			},
			COMMAND_PRIORITY_LOW
		);

		const unregisterArrowDown = editor.registerCommand(
			KEY_ARROW_DOWN_COMMAND,
			(event) => {
				const selection = $getSelection();
				if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
					return false;
				}
				const anchorNode = selection.anchor.getNode();
				const codeNode = $findParentCodeNode(anchorNode);
				if (!codeNode || codeNode.getNextSibling() !== null) return false;

				const lastDescendant = codeNode.getLastDescendant();
				const atEnd =
					(anchorNode === codeNode &&
						selection.anchor.offset === codeNode.getChildrenSize()) ||
					(lastDescendant !== null &&
						anchorNode === lastDescendant &&
						selection.anchor.offset === lastDescendant.getTextContentSize());
				if (!atEnd) return false;

				event?.preventDefault();
				const paragraph = $createParagraphNode();
				codeNode.insertAfter(paragraph);
				paragraph.select();
				return true;
			},
			COMMAND_PRIORITY_LOW
		);

		return () => {
			unregisterEnter();
			unregisterArrowDown();
		};
	}, [editor]);

	return null;
}

// ─── Per-CodeNode Header Overlay (Kind, Language, Tree Tools, Copy) ──────────

interface CodeBlockOverlayItem {
	key: string;
	language: string;
	top: number;
	left: number;
	width: number;
}

export function CodeBlockControlsPlugin({
	containerRef,
}: {
	containerRef: RefObject<HTMLDivElement | null>;
}) {
	const [editor] = useLexicalComposerContext();
	const t = useTranslations("editor.codeBlock");
	const [items, setItems] = useState<CodeBlockOverlayItem[]>([]);
	const [copiedKey, setCopiedKey] = useState<string | null>(null);
	const copyTimerRef = useRef<number | null>(null);
	// Remembers each block's most recent programming language when toggling to `text`.
	const lastCodeLangRef = useRef<Map<string, string>>(new Map());

	const measureBlocks = useCallback(() => {
		const container = containerRef.current;
		if (!container) return;

		const containerRect = container.getBoundingClientRect();
		const next: CodeBlockOverlayItem[] = [];

		editor.getEditorState().read(() => {
			const root = $getRoot();
			for (const child of root.getChildren()) {
				if (!$isCodeNode(child)) continue;
				const key = child.getKey();
				const el = editor.getElementByKey(key);
				if (!el) continue;

				const rect = el.getBoundingClientRect();
				const rawLang = child.getLanguage() || "text";
				const meta = resolveCodeBlockMeta(rawLang);
				if (meta.kind === "code" && meta.language !== "code") {
					lastCodeLangRef.current.set(key, meta.language);
				}

				next.push({
					key,
					language: rawLang,
					top: rect.top - containerRect.top + 1,
					left: rect.left - containerRect.left + 1,
					width: Math.max(0, rect.width - 2),
				});
			}
		});

		setItems((prev) => {
			if (
				prev.length === next.length &&
				prev.every(
					(p, idx) =>
						p.key === next[idx]?.key &&
						p.language === next[idx]?.language &&
						Math.abs(p.top - (next[idx]?.top ?? 0)) < 0.5 &&
						Math.abs(p.left - (next[idx]?.left ?? 0)) < 0.5 &&
						Math.abs(p.width - (next[idx]?.width ?? 0)) < 0.5
				)
			) {
				return prev;
			}
			return next;
		});
	}, [editor, containerRef]);

	useEffect(() => {
		measureBlocks();
		let rafId: number | null = null;
		const schedule = () => {
			if (rafId !== null) window.cancelAnimationFrame(rafId);
			rafId = window.requestAnimationFrame(() => {
				rafId = null;
				measureBlocks();
			});
		};

		const unregister = editor.registerUpdateListener(() => {
			schedule();
		});

		const container = containerRef.current;
		let ro: ResizeObserver | null = null;
		if (container && typeof ResizeObserver !== "undefined") {
			ro = new ResizeObserver(schedule);
			ro.observe(container);
		}
		window.addEventListener("resize", schedule);

		return () => {
			unregister();
			ro?.disconnect();
			window.removeEventListener("resize", schedule);
			if (rafId !== null) window.cancelAnimationFrame(rafId);
		};
	}, [editor, containerRef, measureBlocks]);

	useEffect(() => {
		return () => {
			if (copyTimerRef.current !== null) {
				window.clearTimeout(copyTimerRef.current);
			}
		};
	}, []);

	const setNodeLanguage = useCallback(
		(nodeKey: string, nextLang: string) => {
			editor.update(() => {
				const node = $getNodeByKey(nodeKey);
				if ($isCodeNode(node)) {
					node.setLanguage(nextLang);
				}
			});
		},
		[editor]
	);

	const switchKind = useCallback(
		(nodeKey: string, targetKind: "text" | "code") => {
			if (targetKind === "text") {
				setNodeLanguage(nodeKey, "text");
				return;
			}
			const remembered = lastCodeLangRef.current.get(nodeKey) ?? "html";
			setNodeLanguage(nodeKey, remembered);
		},
		[setNodeLanguage]
	);

	const insertSnippetInBlock = useCallback(
		(nodeKey: string, snippet: string) => {
			editor.update(() => {
				const node = $getNodeByKey(nodeKey);
				if (!$isCodeNode(node)) return;

				const selection = $getSelection();
				if (
					$isRangeSelection(selection) &&
					$findParentCodeNode(selection.anchor.getNode())?.getKey() === nodeKey
				) {
					selection.insertRawText(snippet);
					return;
				}

				if (node.getTextContentSize() === 0) {
					node.append($createTextNode(snippet));
					node.selectEnd();
				} else {
					node.selectEnd();
					const endSel = $getSelection();
					if ($isRangeSelection(endSel)) {
						endSel.insertRawText(`\n${snippet}`);
					}
				}
			});
		},
		[editor]
	);

	const insertProjectTree = useCallback(
		(nodeKey: string) => {
			editor.update(() => {
				const node = $getNodeByKey(nodeKey);
				if (!$isCodeNode(node)) return;
				node.setLanguage("text");
				const existing = node.getTextContent().trim();
				if (!existing) {
					node.clear();
					node.append($createTextNode(DEFAULT_PROJECT_TREE_TEMPLATE));
					node.selectEnd();
				} else {
					node.selectEnd();
					const sel = $getSelection();
					if ($isRangeSelection(sel)) {
						sel.insertRawText(`\n${DEFAULT_PROJECT_TREE_TEMPLATE}`);
					}
				}
			});
		},
		[editor]
	);

	const insertParagraphBelow = useCallback(
		(nodeKey: string) => {
			editor.update(() => {
				const node = $getNodeByKey(nodeKey);
				if (!$isCodeNode(node)) return;
				const paragraph = $createParagraphNode();
				node.insertAfter(paragraph);
				paragraph.select();
			});
		},
		[editor]
	);

	const handleCopy = useCallback(
		async (nodeKey: string) => {
			let raw = "";
			editor.getEditorState().read(() => {
				const node = $getNodeByKey(nodeKey);
				if ($isCodeNode(node)) {
					raw = node.getTextContent();
				}
			});
			const ok = await copyTextToClipboard(raw);
			if (!ok) return;

			setCopiedKey(nodeKey);
			if (copyTimerRef.current !== null) {
				window.clearTimeout(copyTimerRef.current);
			}
			copyTimerRef.current = window.setTimeout(() => {
				setCopiedKey((cur) => (cur === nodeKey ? null : cur));
				copyTimerRef.current = null;
			}, 1800);
		},
		[editor]
	);

	if (items.length === 0) return null;

	return (
		<>
			{items.map((item) => {
				const meta = resolveCodeBlockMeta(item.language);
				const isText = meta.kind === "text";
				const isCopied = copiedKey === item.key;
				const selectedLang =
					meta.kind === "code" &&
					CODE_LANGUAGE_OPTIONS.some((o) => o.value === meta.language)
						? meta.language
						: "html";

				return (
					<div
						key={item.key}
						dir="ltr"
						contentEditable={false}
						style={{
							position: "absolute",
							top: `${item.top}px`,
							left: `${item.left}px`,
							width: `${item.width}px`,
						}}
						className="z-10 flex h-9 select-none items-center justify-between gap-1.5 overflow-x-auto rounded-t-[11px] border-b border-[#eceff3] bg-[#f8f9fb] px-2.5 text-xs [scrollbar-width:none] dark:border-white/8 dark:bg-[#151d30] [&::-webkit-scrollbar]:hidden"
					>
						{/* Left: Code vs Text type toggle + language selector or tree tools */}
						<div className="flex min-w-0 items-center gap-1.5">
							<div className="inline-flex items-center rounded-md border border-border/80 bg-background/80 p-0.5 dark:border-white/10 dark:bg-black/25">
								<button
									type="button"
									aria-pressed={isText}
									onMouseDown={(e) => e.preventDefault()}
									onClick={() => switchKind(item.key, "text")}
									className={cn(
										"inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors",
										isText
											? "bg-primary text-primary-foreground shadow-2xs"
											: "text-muted-foreground hover:text-foreground"
									)}
								>
									<span
										aria-hidden="true"
										className="font-mono text-[10px] opacity-80"
									>
										{"{}"}
									</span>
									<span>{t("kindText")}</span>
								</button>
								<button
									type="button"
									aria-pressed={!isText}
									onMouseDown={(e) => e.preventDefault()}
									onClick={() => switchKind(item.key, "code")}
									className={cn(
										"inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors",
										!isText
											? "bg-primary text-primary-foreground shadow-2xs"
											: "text-muted-foreground hover:text-foreground"
									)}
								>
									<span
										aria-hidden="true"
										className="font-mono text-[10px] opacity-80"
									>
										{"</>"}
									</span>
									<span>{t("kindCode")}</span>
								</button>
							</div>

							{isText ? (
								<div className="flex items-center gap-1">
									<span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">
										text
									</span>
									<span
										className="mx-0.5 hidden h-3.5 w-px bg-border sm:inline-block"
										aria-hidden="true"
									/>
									{PROJECT_TREE_SNIPPETS.map((s) => (
										<button
											key={s.label}
											type="button"
											title={
												s.hint === "branch"
													? t("insertBranch")
													: s.hint === "last"
														? t("insertLastBranch")
														: t("insertPipe")
											}
											aria-label={
												s.hint === "branch"
													? t("insertBranch")
													: s.hint === "last"
														? t("insertLastBranch")
														: t("insertPipe")
											}
											onMouseDown={(e) => e.preventDefault()}
											onClick={() => insertSnippetInBlock(item.key, s.insert)}
											className="inline-flex h-6 items-center justify-center rounded border border-border/70 bg-background/70 px-1.5 font-mono text-[11px] text-foreground/80 transition-colors hover:bg-muted hover:text-foreground dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
										>
											{s.label}
										</button>
									))}
									<button
										type="button"
										title={t("insertTreeHint")}
										onMouseDown={(e) => e.preventDefault()}
										onClick={() => insertProjectTree(item.key)}
										className="inline-flex h-6 items-center gap-1 rounded border border-border/70 bg-background/70 px-1.5 text-[11px] font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
									>
										<FolderTree className="size-3" />
										<span className="hidden sm:inline">{t("insertTree")}</span>
									</button>
								</div>
							) : (
								<select
									aria-label={t("languageLabel")}
									value={selectedLang}
									onChange={(e) => setNodeLanguage(item.key, e.target.value)}
									className="h-6 rounded-md border border-border/80 bg-background/90 px-2 font-mono text-[11px] font-medium text-foreground outline-none transition-colors hover:bg-muted/60 focus:border-primary dark:border-white/12 dark:bg-[#0d1321]"
								>
									{CODE_LANGUAGE_OPTIONS.map((opt) => (
										<option key={opt.value} value={opt.value}>
											{opt.label} ({opt.value})
										</option>
									))}
								</select>
							)}
						</div>

						{/* Right: Insert paragraph below + Copy button */}
						<div className="flex shrink-0 items-center gap-0.5">
							<button
								type="button"
								title={t("addLineBelow")}
								aria-label={t("addLineBelow")}
								onMouseDown={(e) => e.preventDefault()}
								onClick={() => insertParagraphBelow(item.key)}
								className="inline-flex size-6.5 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-black/6 hover:text-foreground dark:hover:bg-white/10"
							>
								<CornerDownLeft className="size-3.5" />
							</button>
							<button
								type="button"
								title={isCopied ? t("copied") : t("copy")}
								aria-label={isCopied ? t("copied") : t("copy")}
								onMouseDown={(e) => e.preventDefault()}
								onClick={() => handleCopy(item.key)}
								className={cn(
									"inline-flex size-6.5 items-center justify-center rounded-md transition-colors",
									isCopied
										? "text-emerald-600 dark:text-emerald-400"
										: "text-muted-foreground hover:bg-black/6 hover:text-foreground dark:hover:bg-white/10"
								)}
							>
								{isCopied ? (
									<Check className="size-3.5" />
								) : (
									<Copy className="size-3.5" />
								)}
							</button>
						</div>
					</div>
				);
			})}
		</>
	);
}

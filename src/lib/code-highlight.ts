import { Prism } from "./prism-setup";

// Load language grammars in strict dependency order.
import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";
import "prismjs/components/prism-scss";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-python";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-markup-templating";
import "prismjs/components/prism-php";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-swift";
import "prismjs/components/prism-kotlin";
import "prismjs/components/prism-dart";
import "prismjs/components/prism-powershell";
import "prismjs/components/prism-diff";

export type CodeBlockKind = "text" | "code";

export interface CodeLanguageOption {
	/** Canonical fence identifier stored in markdown, e.g. `html`, `javascript`. */
	value: string;
	/** Friendly label shown in dropdowns, e.g. `HTML`, `JavaScript`. */
	label: string;
	/** Prism.languages key (null = uncolored monospace). */
	grammar: string | null;
}

export interface CodeBlockMeta {
	kind: CodeBlockKind;
	language: string;
	displayLabel: string;
	friendlyName: string;
	prismGrammar: string | null;
}

export const CODE_LANGUAGE_OPTIONS: readonly CodeLanguageOption[] = [
	{ value: "html", label: "HTML", grammar: "html" },
	{ value: "css", label: "CSS", grammar: "css" },
	{ value: "scss", label: "SCSS", grammar: "scss" },
	{ value: "javascript", label: "JavaScript", grammar: "javascript" },
	{ value: "typescript", label: "TypeScript", grammar: "typescript" },
	{ value: "jsx", label: "JSX", grammar: "jsx" },
	{ value: "tsx", label: "TSX", grammar: "tsx" },
	{ value: "python", label: "Python", grammar: "python" },
	{ value: "bash", label: "Bash / Terminal", grammar: "bash" },
	{ value: "json", label: "JSON", grammar: "json" },
	{ value: "sql", label: "SQL", grammar: "sql" },
	{ value: "php", label: "PHP", grammar: "php" },
	{ value: "java", label: "Java", grammar: "java" },
	{ value: "csharp", label: "C#", grammar: "csharp" },
	{ value: "c", label: "C", grammar: "c" },
	{ value: "cpp", label: "C++", grammar: "cpp" },
	{ value: "go", label: "Go", grammar: "go" },
	{ value: "rust", label: "Rust", grammar: "rust" },
	{ value: "dart", label: "Dart", grammar: "dart" },
	{ value: "kotlin", label: "Kotlin", grammar: "kotlin" },
	{ value: "swift", label: "Swift", grammar: "swift" },
	{ value: "yaml", label: "YAML", grammar: "yaml" },
	{ value: "xml", label: "XML", grammar: "xml" },
	{ value: "markdown", label: "Markdown", grammar: "markdown" },
	{ value: "powershell", label: "PowerShell", grammar: "powershell" },
	{ value: "diff", label: "Diff", grammar: "diff" },
] as const;

const OPTION_BY_VALUE = new Map<string, CodeLanguageOption>(
	CODE_LANGUAGE_OPTIONS.map((opt) => [opt.value, opt])
);

const TEXT_IDENTIFIERS = new Set([
	"text",
	"plaintext",
	"plain",
	"txt",
	"tree",
	"structure",
	"folder",
	"files",
	"output",
	"none",
]);

const CODE_LANGUAGE_ALIASES: Record<string, string> = {
	htm: "html",
	svg: "xml",
	mathml: "xml",
	js: "javascript",
	mjs: "javascript",
	cjs: "javascript",
	node: "javascript",
	ts: "typescript",
	mts: "typescript",
	cts: "typescript",
	py: "python",
	python3: "python",
	sh: "bash",
	shell: "bash",
	zsh: "bash",
	console: "bash",
	terminal: "bash",
	cmd: "bash",
	jsonc: "json",
	yml: "yaml",
	md: "markdown",
	mdx: "markdown",
	mysql: "sql",
	postgres: "sql",
	postgresql: "sql",
	sqlite: "sql",
	cs: "csharp",
	dotnet: "csharp",
	"c#": "csharp",
	"c++": "cpp",
	cxx: "cpp",
	cc: "cpp",
	h: "c",
	hpp: "cpp",
	golang: "go",
	rs: "rust",
	kt: "kotlin",
	kts: "kotlin",
	ps1: "powershell",
	pwsh: "powershell",
	patch: "diff",
};

/**
 * Classifies a fenced code block language into `"text"` or `"code"` and
 * resolves its canonical language identifier and Prism grammar.
 *
 * Empty / missing language defaults to `"text"` so plain snippets and ASCII
 * project trees render cleanly with `{} text` and without accidental coloring.
 */
export function resolveCodeBlockMeta(rawLang?: string | null): CodeBlockMeta {
	const cleaned = (rawLang ?? "").trim().toLowerCase();

	if (!cleaned || TEXT_IDENTIFIERS.has(cleaned)) {
		return {
			kind: "text",
			language: "text",
			displayLabel: "text",
			friendlyName: "Plain Text",
			prismGrammar: null,
		};
	}

	if (cleaned === "code") {
		return {
			kind: "code",
			language: "code",
			displayLabel: "code",
			friendlyName: "Code",
			prismGrammar: null,
		};
	}

	const canonical = CODE_LANGUAGE_ALIASES[cleaned] ?? cleaned;
	const option = OPTION_BY_VALUE.get(canonical);
	if (option) {
		return {
			kind: "code",
			language: option.value,
			displayLabel: option.value,
			friendlyName: option.label,
			prismGrammar:
				option.grammar && Prism.languages[option.grammar]
					? option.grammar
					: null,
		};
	}

	const directGrammar =
		typeof Prism.languages[canonical] === "object" ? canonical : null;
	return {
		kind: "code",
		language: canonical,
		displayLabel: canonical,
		friendlyName: canonical,
		prismGrammar: directGrammar,
	};
}

/**
 * Tokenizes source code with Prism when the block type is `"code"` and a
 * matching grammar is loaded; returns `[code]` untouched for `"text"` blocks.
 */
export function tokenizeCode(
	code: string,
	rawLang?: string | null
): Array<string | Prism.Token> {
	const meta = resolveCodeBlockMeta(rawLang);
	if (meta.kind === "text" || !meta.prismGrammar) {
		return [code];
	}
	const grammar = Prism.languages[meta.prismGrammar];
	if (!grammar) {
		return [code];
	}
	return Prism.tokenize(code, grammar);
}

/** Ready-to-edit starter template for folder / project-structure text blocks. */
export const DEFAULT_PROJECT_TREE_TEMPLATE = [
	"my-project/",
	"├── index.html",
	"├── css/",
	"│   └── style.css",
	"└── js/",
	"    └── app.js",
].join("\n");

/** Quick-insert box-drawing tokens for writing clean project trees. */
export const PROJECT_TREE_SNIPPETS = [
	{ label: "├──", insert: "├── ", hint: "branch" },
	{ label: "└──", insert: "└── ", hint: "last" },
	{ label: "│", insert: "│   ", hint: "pipe" },
] as const;

/**
 * Lexical `theme.codeHighlight` map forwarding every Prism token type to the
 * shared `.token.<type>` CSS rules in `globals.css`, so the Write tab, Preview
 * tab, and student Lesson Player share identical light & dark syntax colors.
 */
export const LEXICAL_CODE_HIGHLIGHT_THEME: Record<string, string> = {
	atrule: "token atrule",
	attr: "token attr-name",
	"attr-equals": "token attr-equals",
	"attr-name": "token attr-name",
	"attr-value": "token attr-value",
	boolean: "token boolean",
	builtin: "token builtin",
	cdata: "token cdata",
	char: "token char",
	class: "token class-name",
	"class-name": "token class-name",
	comment: "token comment",
	constant: "token constant",
	coord: "token coord",
	decorator: "token decorator",
	deleted: "token deleted",
	directive: "token keyword",
	doctype: "token doctype",
	"doctype-tag": "token doctype-tag",
	entity: "token entity",
	environment: "token variable",
	function: "token function",
	"function-variable": "token function",
	generic: "token class-name",
	important: "token important",
	inserted: "token inserted",
	interpolation: "token interpolation",
	"interpolation-punctuation": "token punctuation",
	key: "token attr-name",
	keyword: "token keyword",
	label: "token symbol",
	macro: "token function",
	method: "token function",
	module: "token keyword",
	name: "token name",
	namespace: "token namespace",
	number: "token number",
	operator: "token operator",
	parameter: "token parameter",
	plain: "token plain",
	prolog: "token prolog",
	property: "token property",
	"property-access": "token property",
	punctuation: "token punctuation",
	regex: "token regex",
	rule: "token keyword",
	selector: "token selector",
	shebang: "token comment",
	string: "token string",
	"string-property": "token property",
	symbol: "token symbol",
	tag: "token tag",
	"template-punctuation": "token string",
	"template-string": "token string",
	title: "token function",
	type: "token class-name",
	unit: "token number",
	url: "token url",
	variable: "token variable",
};

/**
 * Copy helper with a legacy `<textarea>` fallback for browsers or embedded
 * webviews where `navigator.clipboard` is unavailable.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
	if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch {
			// Fall through to execCommand fallback below.
		}
	}

	if (typeof document === "undefined") return false;
	try {
		const textarea = document.createElement("textarea");
		textarea.value = text;
		textarea.setAttribute("readonly", "");
		textarea.style.position = "fixed";
		textarea.style.opacity = "0";
		textarea.style.pointerEvents = "none";
		document.body.appendChild(textarea);
		textarea.select();
		const ok = document.execCommand("copy");
		document.body.removeChild(textarea);
		return ok;
	} catch {
		return false;
	}
}

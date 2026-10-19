#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const ROOT = path.join(__dirname, "..");
const APP_DIR = path.join(ROOT, "src/app");
const ROUTES_OUT = path.join(ROOT, "src/lib/routes.ts");
const TYPES_OUT = path.join(ROOT, "src/types/route.types.ts");
const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const HTTP_METHODS = [
	"GET",
	"POST",
	"PUT",
	"PATCH",
	"DELETE",
	"HEAD",
	"OPTIONS",
];

// ─────────────────────────────────────────────
// 1. FILE DISCOVERY (git → find fallback)
// ─────────────────────────────────────────────

function findFiles() {
	const cmd =
		"find src/app -type f \\( " +
		'-name "page.ts" -o ' +
		'-name "page.tsx" -o ' +
		'-name "page.js" -o ' +
		'-name "page.jsx" -o ' +
		'-name "route.ts" -o ' +
		'-name "route.tsx" -o ' +
		'-name "route.js" -o ' +
		'-name "route.jsx" -o ' +
		'-name "*.md" -o ' +
		'-name "*.mdx" ' +
		"\\)";

	const files = execSync(cmd, { encoding: "utf8" }).split("\n").filter(Boolean);

	return files;
}

function findPages() {
	try {
		return execSync(`git ls-files "src/app/**/page.tsx" "src/app/**/page.ts"`, {
			encoding: "utf8",
		})
			.split("\n")
			.filter(Boolean);
	} catch {
		return execSync(
			`find src/app -type f \\( -name "page.tsx" -o -name "page.ts" \\)`,
			{ encoding: "utf8" }
		)
			.split("\n")
			.filter(Boolean);
	}
}

// ─────────────────────────────────────────────
// 2. NEXT.JS ROUTE RULES
// ─────────────────────────────────────────────
const isRouteGroup = (s) => /^\(.*\)$/.test(s);
const isPrivate = (s) => s.startsWith("_");
const isParallelRoute = (s) => s.startsWith("@");
// (.), (..), (...), (..)(..) etc.
const isInterceptingRoute = (s) =>
	/^\(\.{1,3}\)$/.test(s) || /^\(\.\.\)\(\.\.\)$/.test(s);

const toCamel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const isDynamic = (s) => /^\[.*\]$/.test(s);
const isCatchAll = (s) => /^\[\.\.\..+\]$/.test(s);
const isOptionalCatchAll = (s) => /^\[\[\.\.\..+\]\]$/.test(s);

function wrapKey(key) {
	if (IDENTIFIER.test(key)) return key;
	return `"${key}"`;
}

function paramName(seg) {
	return seg
		.replace(/^\[\[?\.\.\./, "")
		.replace(/^\[\[?/, "")
		.replace(/\]\]?$/, "");
}

// ─────────────────────────────────────────────
// 3. ROUTE PATTERN COMPILER
// ─────────────────────────────────────────────

function segmentToPattern(seg) {
	if (isOptionalCatchAll(seg)) return `:${paramName(seg)}*?`;
	if (isCatchAll(seg)) return `:${paramName(seg)}*`;
	if (isDynamic(seg)) return `:${paramName(seg)}`;
	return seg;
}

// ─────────────────────────────────────────────
// 4. TREE STRUCTURE
// ─────────────────────────────────────────────

function makeNode() {
	return {
		page: null,
		api: {},
		children: {},
	};
}

function stripRoute(file) {
	return file
		.replace(/^src\/app\/?/, "")
		.replace(/\/(page|route)\.(ts|tsx|js|jsx|md|mdx)$/, "");
}

function getRouteType(file) {
	if (file.includes("/route.")) return "api";

	if (file.endsWith(".md") || file.endsWith(".mdx")) {
		return "page"; // treat as UI route
	}

	if (/\.(ts|tsx|js|jsx)$/.test(file)) {
		if (file.includes("/page.")) return "page";
	}

	return "ignore";
}

function buildTree(files) {
	const root = makeNode();
	const routesList = [];

	for (const file of files) {
		const type = getRouteType(file);
		if (type === "ignore") continue;

		let rel = stripRoute(file);
		let segs = rel ? rel.split("/") : [];

		// Next.js rules
		if (segs[0] === "[locale]") segs = segs.slice(1);

		if (
			segs.some(isPrivate) ||
			segs.some(isParallelRoute) ||
			segs.some(isInterceptingRoute)
		) {
			continue;
		}

		segs = segs.filter((s) => !isRouteGroup(s));

		const staticSegs = segs.filter((s) => !/^\[.*\]$/.test(s));
		const params = segs
			.filter((s) => /^\[.*\]$/.test(s))
			.map((s) => s.replace(/\[|\]/g, ""));

		const pattern =
			segs.length === 0 ? "/" : "/" + segs.map(segmentToPattern).join("/");

		const staticKey = (staticSegs.length ? staticSegs : ["home"])
			.map(toCamel)
			.join("/");

		routesList.push({
			file,
			type,
			segs,
			staticSegs,
			params,
			pattern,
			staticKey,
		});
	}

	// Group routes by their camelCased static segment path
	const groups = {};
	for (const route of routesList) {
		groups[route.staticKey] ??= [];
		groups[route.staticKey].push(route);
	}

	// Resolve conflicts dynamically
	for (const key in groups) {
		const routesInGroup = groups[key];
		if (routesInGroup.length === 1) {
			routesInGroup[0].keySegs = routesInGroup[0].staticSegs.length
				? routesInGroup[0].staticSegs
				: ["home"];
		} else {
			for (const route of routesInGroup) {
				const lastSeg = route.segs[route.segs.length - 1];
				const isLastSegDynamic = lastSeg && /^\[.*\]$/.test(lastSeg);

				if (isLastSegDynamic) {
					// Dynamic detail page: keep parameter name to avoid clash with parent/sibling
					const param = paramName(lastSeg);
					route.keySegs = [...route.staticSegs, param];
				} else {
					// Static list page: use default static segments
					route.keySegs = route.staticSegs.length
						? route.staticSegs
						: ["home"];
				}
			}
		}
	}

	// Build the tree nodes using resolved keySegs
	for (const route of routesList) {
		let node = root;

		for (const seg of route.keySegs) {
			const key = toCamel(seg);
			node.children[key] ??= makeNode();
			node = node.children[key];
		}

		if (route.type === "page") {
			node.page = { pattern: route.pattern, params: route.params };
		}

		if (route.type === "api") {
			node.route = { pattern: route.pattern, params: route.params };
		}
	}

	return root;
}

// ─────────────────────────────────────────────
// 5. PAGE FUNCTION GENERATOR (IMPORTANT)
// ─────────────────────────────────────────────

function buildPageFn(page, pad) {
	const inner = pad + "  ";
	const sp = "Record<string, string>";
	const options = "options: {locale?: string, isAbsolute?: boolean;} = {}";

	const hasParams = page.params.length > 0;

	const basePath = page.pattern;

	// STATIC ROUTE
	if (!hasParams) {
		return `(searchParams?: ${sp}, ${options}) => 
${inner}buildPath("${basePath}", {}, searchParams, options)`;
	}

	// DYNAMIC ROUTE
	const paramType = page.params.map((p) => `${p}: string`).join("; ");

	const compiledPath = page.pattern.replace(
		/:([a-zA-Z0-9_]+)\*?\??/g,
		(_, key) => `:${key}`
	);

	return `(params: { ${paramType} }, searchParams?: ${sp}, ${options}) => 
${inner}buildPath("${compiledPath}", params, searchParams, options)`;
}

// ─────────────────────────────────────────────
// 6. RENDER TREE → ROUTES OBJECT
// ─────────────────────────────────────────────

function renderNode(node, depth = 1) {
	const pad = "  ".repeat(depth);
	const pagePad = pad + "  ";

	const lines = ["{"];

	if (node.page) {
		lines.push(`${pagePad}page: ${buildPageFn(node.page, pagePad)},`);
	}

	if (node.route) {
		lines.push(`${pagePad}route: ${buildPageFn(node.route, pagePad)},`);
	}

	const entries = Object.entries(node.children).sort(([a], [b]) =>
		a.localeCompare(b)
	);

	for (const [key, child] of entries) {
		lines.push(`${pagePad}${wrapKey(key)}: ${renderNode(child, depth + 1)},`);
	}

	lines.push(`${pad}}`);

	return lines.join("\n");
}

function buildRoutesFile(root) {
	const entries = Object.entries(root.children).sort(([a], [b]) =>
		a.localeCompare(b)
	);

	return `// AUTO-GENERATED FILE — DO NOT EDIT

import type { Locale } from "@/i18n";
import { clientEnv } from "@/lib/env/client-env";

type BuildPathResult<
	TPath extends string,
	TLocale extends string | undefined = undefined,
> =
	TLocale extends string
	? \`/\${TLocale}\${TPath}\`
	: TPath;


function buildPath<
	TPath extends string,
	TLocale extends string | undefined = undefined,
>(
	pathname: TPath,
	params?: Record<string, string>,
	searchParams?: Record<string, string>,
	{ locale, isAbsolute }: {
		locale?: TLocale;
		isAbsolute?: boolean;
	} = {}
): BuildPathResult<TPath, TLocale> {
  let path = pathname.startsWith("/") ? pathname : "/" + pathname;
  if (locale) path = \`/\${locale}\${path}\`;
  if (params) {
    for (const key in params) {
      path = path.replace(\`:\${key}\`, params[key]);
    }
  }
  if (isAbsolute) path = \`\${clientEnv.app.address}\${path}\`;
  const qs = searchParams ? "?" + new URLSearchParams(searchParams).toString() : "";
  return (qs ? path + qs : path) as BuildPathResult<TPath, TLocale>;
}

export const routes = {
${entries.map(([k, v]) => `  ${wrapKey(k)}: ${renderNode(v, 1)},`).join("\n")}
};
`;
}

// ─────────────────────────────────────────────
// 7. TYPES GENERATION
// ─────────────────────────────────────────────

function collectPages(node, out = []) {
	if (node.page) out.push(node.page);
	if (node.route) out.push(node.route);
	for (const c of Object.values(node.children)) collectPages(c, out);
	return out;
}

function buildTypesFile(root) {
	const pages = collectPages(root);

	const statics = pages.filter((p) => !p.pattern.includes(":"));
	const dynamics = pages.filter((p) => p.pattern.includes(":"));

	return `// AUTO-GENERATED FILE — DO NOT EDIT

export type StaticRoute =
${statics.map((p) => `  | "${p.pattern}"`).join("\n") || "  | never"};

export type DynamicRoute =
${dynamics.map((p) => `  | \`${p.pattern}\``).join("\n") || "  | never"};

export type AppRoute = StaticRoute | DynamicRoute;
`;
}

// ─────────────────────────────────────────────
// 8. MAIN
// ─────────────────────────────────────────────

const pages = findFiles();
const tree = buildTree(pages);

fs.writeFileSync(ROUTES_OUT, buildRoutesFile(tree));
fs.writeFileSync(TYPES_OUT, buildTypesFile(tree));

const all = collectPages(tree).sort((a, b) =>
	a.pattern.localeCompare(b.pattern)
);

console.log(`\nGenerated ${all.length} routes:\n`);
for (const r of all) {
	console.log(`  ${r.pattern}`);
}

console.log(`\nWrote → ${path.relative(ROOT, ROUTES_OUT)}`);
console.log(`Wrote → ${path.relative(ROOT, TYPES_OUT)}`);

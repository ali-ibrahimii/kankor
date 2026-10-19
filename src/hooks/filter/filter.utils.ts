import type { TableViewName } from "@/types/db.types";
import type { QueryState } from "./types";

function encodeValue(value: unknown): string {
	const str = JSON.stringify(value);
	const bytes = new TextEncoder().encode(str);
	let binary = "";
	for (const byte of bytes) binary += String.fromCharCode(byte);

	return btoa(binary)
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
}

function decodeValue(value: string): unknown {
	const base64 = value.replace(/-/g, "+").replace(/_/g, "/");

	const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);

	const binary = atob(padded);
	const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));

	return JSON.parse(new TextDecoder().decode(bytes));
}

export function serializeQuery<T extends TableViewName>(
	state?: QueryState<T>
): Record<string, string> {
	const params: Record<string, string> = {};

	// filters
	if (state?.filters?.length) {
		params.f = state.filters
			.sort((a, b) => String(a.field).localeCompare(String(b.field)))
			.map((f) => [f.field, f.operator, encodeValue(f.value)].join(":"))
			.join(",");
	}

	// sort
	if (state?.sort) {
		params.s = state.sort
			.map((s) => `${String(s.field)}.${s.direction}`)
			.join(",");
	}

	// pagination
	if (state?.pagination) {
		params.p = `${state.pagination.page}.${state.pagination.pageSize}`;
	}

	// search
	if (state?.search) {
		params.q = encodeValue(state.search);
	}

	if (state?.limit) params.l = String(state.limit);

	if (state?.name) params.n = state.name;

	return params;
}

export function deserializeQuery<T extends TableViewName>(
	params: URLSearchParams
): QueryState<T> {
	const state: QueryState<T> = {};

	// filters
	const f = params.get("f");
	if (f) {
		state.filters = f.split(",").map((item) => {
			const [field, operator, value] = item.split(":");

			return {
				field,
				operator,
				value: decodeValue(value),
			} as any; // validate later with Zod
		});
	}

	// sort
	const s = params.get("s");
	if (s) {
		const sorts = s.split(",");
		state.sort = sorts.map((s) => {
			const [field, direction] = s.split(".");
			return {
				field: field as any,
				direction: direction as "asc" | "desc",
			};
		});
	}

	// pagination
	const p = params.get("p");
	if (p) {
		const [page, pageSize] = p.split(".");
		state.pagination = {
			page: Number(page),
			pageSize: Number(pageSize),
		};
	}

	// search
	const q = params.get("q");
	if (q) {
		state.search = decodeValue(q) as string;
	}

	// limit
	const l = params.get("l");
	if (l) {
		state.limit = Number(l);
	}

	// name
	const n = params.get("n");
	if (n) {
		state.name = n;
	}

	return state;
}

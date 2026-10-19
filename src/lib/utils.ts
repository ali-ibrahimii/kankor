import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function decodeSlugParam(slug: string): string {
	try {
		return decodeURIComponent(slug);
	} catch {
		return slug;
	}
}

const UUID_RE =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(val: string): boolean {
	return UUID_RE.test(val);
}

export function getSlugOrIdColumn(identifier: string): "id" | "slug" {
	return isUuid(identifier) ? "id" : "slug";
}

/**
 * Generates a random numeric string of the specified length.
 * Digits can be repeated.
 */
export function generateNumeric(length = 6): string {
	const array = new Uint32Array(length);
	globalThis.crypto.getRandomValues(array);
	let code = "";
	for (let i = 0; i < length; i++) {
		code += (array[i] % 10).toString();
	}
	return code;
}

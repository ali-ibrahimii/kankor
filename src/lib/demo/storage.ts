import { createDemoState } from "./seed";
import type { DemoState } from "./types";

/** Separate namespace from Supabase tokens and the reference project's demo. */
export const DEMO_STORAGE_KEY = "abzarkankor.dashboard-demo.v1";

export function readDemoState(storage: Pick<Storage, "getItem">): DemoState {
	try {
		const value = storage.getItem(DEMO_STORAGE_KEY);
		if (value) {
			const parsed: unknown = JSON.parse(value);
			if (
				parsed &&
				typeof parsed === "object" &&
				"version" in parsed &&
				parsed.version === 1 &&
				"users" in parsed &&
				Array.isArray(parsed.users) &&
				"courses" in parsed &&
				Array.isArray(parsed.courses) &&
				"classrooms" in parsed &&
				Array.isArray(parsed.classrooms) &&
				"enrollments" in parsed &&
				Array.isArray(parsed.enrollments) &&
				"certificates" in parsed &&
				Array.isArray(parsed.certificates) &&
				"schools" in parsed &&
				Array.isArray(parsed.schools) &&
				"settings" in parsed &&
				parsed.settings
			)
				return parsed as DemoState;
		}
	} catch {
		// Private browsing / corrupt old demo data should not break the site.
	}
	return createDemoState();
}

export function writeDemoState(
	storage: Pick<Storage, "setItem">,
	state: DemoState
): void {
	try {
		storage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
	} catch {
		// Quota or storage denied: in-memory demo remains usable for this visit.
	}
}

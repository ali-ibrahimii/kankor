import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import fa from "@/messages/fa.json";
import ps from "@/messages/ps.json";

/**
 * Guards the message keys behind the course-builder's loading and image
 * upload UI. A missing key renders next-intl's raw `namespace.key` fallback
 * (e.g. `loading.title`) to the user, so the three locales must stay in
 * lock-step.
 */
const locales = { en, fa, ps } as const;

function pick(obj: unknown, path: string): unknown {
	return path.split(".").reduce<unknown>((node, key) => {
		if (node && typeof node === "object") {
			return (node as Record<string, unknown>)[key];
		}
		return undefined;
	}, obj);
}

describe("loading + image-storage translations", () => {
	const requiredKeys = [
		"loading.title",
		"loading.description",
		"loading.message",
		"imageUpload.notConfigured",
		"imageUpload.uploadFailed",
		"courseBuilder.newCourse.coverNotConfigured",
		"courseBuilder.newCourse.coverFailed",
	];

	for (const key of requiredKeys) {
		it(`has ${key} in every locale`, () => {
			for (const [name, messages] of Object.entries(locales)) {
				const value = pick(messages, key);
				expect(typeof value, `${name}.${key}`).toBe("string");
				expect((value as string).length, `${name}.${key}`).toBeGreaterThan(0);
			}
		});
	}
});

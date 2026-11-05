import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

/**
 * Guards the `admin.students` translation namespace.
 *
 * next-intl throws at render time for a missing key, so a locale that falls
 * behind shows up as a broken admin page rather than a build error. This
 * test runs the checker script so the three locales can never drift apart.
 */
describe("admin.students translations", () => {
	it("has every required key in all locales", () => {
		const output = execFileSync(
			process.execPath,
			["scripts/check-admin-students-i18n.js"],
			{ cwd: process.cwd(), encoding: "utf8" }
		);

		expect(output).toContain("admin.students keys present");
	});
});

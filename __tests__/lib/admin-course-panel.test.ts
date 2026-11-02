import { describe, expect, it } from "vitest";
import {
	joinLines,
	parseLines,
} from "@/components/blocks/course-builder/types";
import { routes } from "@/lib/routes";

describe("parseLines", () => {
	it("splits a textarea into trimmed items", () => {
		expect(parseLines("Build a Next.js app\nUnderstand routing")).toEqual([
			"Build a Next.js app",
			"Understand routing",
		]);
	});

	it("drops empty lines and Windows line endings", () => {
		expect(parseLines("one\r\n\r\n   \r\ntwo\r\n")).toEqual(["one", "two"]);
	});

	it("strips bullets and numbering people paste in", () => {
		expect(
			parseLines("- first\n• second\n3. third\n* fourth\n۱. پنجم")
		).toEqual(["first", "second", "third", "fourth", "پنجم"]);
	});

	it("removes duplicates but keeps the original order", () => {
		expect(parseLines("b\na\nb")).toEqual(["b", "a"]);
	});

	it("returns an empty list for empty input", () => {
		expect(parseLines("")).toEqual([]);
		expect(parseLines(null)).toEqual([]);
		expect(parseLines(undefined)).toEqual([]);
	});

	it("round-trips through joinLines", () => {
		const items = ["آشنایی با HTML", "نصب Node.js"];
		expect(parseLines(joinLines(items))).toEqual(items);
		expect(joinLines(null)).toBe("");
	});
});

describe("admin course builder route", () => {
	it("builds the URL the New course dialog navigates to", () => {
		// This route is what makes "create a course in the admin panel" usable:
		// without it the dialog landed on a 404 instead of the builder.
		expect(routes.d.admin.courses.new.page({ course_id: "abc-123" })).toBe(
			"/d/admin/courses/new/abc-123"
		);
	});

	it("keeps the locale prefix when one is requested", () => {
		expect(
			routes.d.admin.courses.new.page({ course_id: "abc-123" }, undefined, {
				locale: "fa",
			})
		).toBe("/fa/d/admin/courses/new/abc-123");
	});

	it("still builds the list and builder URLs", () => {
		expect(routes.d.admin.courses.page()).toBe("/d/admin/courses");
		expect(routes.d.admin.courses.slug.page({ slug: "next-js" })).toBe(
			"/d/admin/courses/next-js"
		);
	});
});

import { describe, expect, it } from "vitest";
import {
	normalizeCourseStatus,
	statusToPublishedFilter,
} from "@/app/[locale]/d/instructor/_lib/course-status";

describe("normalizeCourseStatus", () => {
	it("keeps the supported tabs", () => {
		expect(normalizeCourseStatus("published")).toBe("published");
		expect(normalizeCourseStatus("draft")).toBe("draft");
		expect(normalizeCourseStatus("all")).toBe("all");
	});

	it("folds unknown values (including the old ?status=archived links) into all", () => {
		expect(normalizeCourseStatus("archived")).toBe("all");
		expect(normalizeCourseStatus(undefined)).toBe("all");
		expect(normalizeCourseStatus(["published"])).toBe("all");
		expect(normalizeCourseStatus("")).toBe("all");
	});
});

describe("statusToPublishedFilter", () => {
	it("pins the is_published filter per tab", () => {
		expect(statusToPublishedFilter("published")).toBe(true);
		expect(statusToPublishedFilter("draft")).toBe(false);
		expect(statusToPublishedFilter("all")).toBeNull();
	});
});

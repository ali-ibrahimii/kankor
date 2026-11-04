import { describe, expect, it } from "vitest";
import seed from "./seed-real-data.js";

const {
	UNIVERSITIES,
	FACULTIES,
	PROVINCES,
	INSTRUCTORS,
	SCHOOLS,
	deterministicUuid,
} = seed;

describe("seed-real-data reference data", () => {
	it("uses unique province names", () => {
		const names = PROVINCES.map((p) => p.trim());
		expect(new Set(names).size).toBe(names.length);
	});

	it("covers every province referenced by a university", () => {
		const known = new Set(PROVINCES);
		const missing = UNIVERSITIES.filter((u) => !known.has(u.province));
		expect(missing).toEqual([]);
	});

	it("covers every province referenced by a school", () => {
		const known = new Set(PROVINCES);
		const missing = SCHOOLS.filter((s) => !known.has(s.province));
		expect(missing).toEqual([]);
	});

	it("uses unique university names", () => {
		const names = UNIVERSITIES.map((u) => u.name.trim());
		expect(new Set(names).size).toBe(names.length);
	});

	it("uses unique school names", () => {
		const names = SCHOOLS.map((s) => s.name.trim());
		expect(new Set(names).size).toBe(names.length);
	});

	it("only references faculties that exist in the catalogue", () => {
		const known = new Set(FACULTIES);
		const missing = UNIVERSITIES.flatMap((u) =>
			(u.faculties ?? []).filter((f) => !known.has(f))
		);
		expect(missing).toEqual([]);
	});

	it("gives every university at least one faculty", () => {
		const empty = UNIVERSITIES.filter((u) => (u.faculties ?? []).length === 0);
		expect(empty).toEqual([]);
	});

	it("contains real Afghan universities", () => {
		const names = UNIVERSITIES.map((u) => u.name);
		expect(names).toContain("دانشگاه کابل");
		expect(names).toContain("دانشگاه هرات");
		expect(names).toContain("دانشگاه بلخ");
		expect(names).toContain("دانشگاه قندهار");
	});

	it("has no empty names", () => {
		for (const u of UNIVERSITIES) expect(u.name.trim()).not.toBe("");
		for (const s of SCHOOLS) expect(s.name.trim()).not.toBe("");
		for (const f of FACULTIES) expect(f.trim()).not.toBe("");
	});
});

describe("seed-real-data instructors", () => {
	it("uses unique emails", () => {
		const emails = INSTRUCTORS.map((i) => i.email.toLowerCase());
		expect(new Set(emails).size).toBe(emails.length);
	});

	it("provides a name and bio in every supported locale", () => {
		for (const instructor of INSTRUCTORS) {
			for (const locale of ["fa", "ps", "en"]) {
				expect(instructor.names[locale], instructor.email).toBeTruthy();
				expect(instructor.bios[locale], instructor.email).toBeTruthy();
			}
		}
	});

	it("places every instructor in a known province", () => {
		const known = new Set(PROVINCES);
		const missing = INSTRUCTORS.filter((i) => !known.has(i.province));
		expect(missing).toEqual([]);
	});

	it("only references subjects that exist in the catalogue", () => {
		const known = new Set(FACULTIES);
		const missing = INSTRUCTORS.flatMap((i) =>
			(i.subjects ?? []).filter((s) => !known.has(s))
		);
		expect(missing).toEqual([]);
	});

	it("gives every instructor at least one subject", () => {
		const empty = INSTRUCTORS.filter((i) => (i.subjects ?? []).length === 0);
		expect(empty).toEqual([]);
	});
});

describe("deterministicUuid", () => {
	it("returns the same id for the same namespace and key", () => {
		expect(deterministicUuid("province", "کابل")).toBe(
			deterministicUuid("province", "کابل")
		);
	});

	it("returns different ids for different keys", () => {
		expect(deterministicUuid("province", "کابل")).not.toBe(
			deterministicUuid("province", "هرات")
		);
	});

	it("returns different ids for different namespaces", () => {
		expect(deterministicUuid("province", "کابل")).not.toBe(
			deterministicUuid("school", "کابل")
		);
	});

	it("produces a valid RFC 4122 version 5 uuid", () => {
		const id = deterministicUuid("province", "کابل");
		expect(id).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
		);
	});
});

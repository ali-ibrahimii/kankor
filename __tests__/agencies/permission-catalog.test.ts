import { describe, expect, it } from "vitest";
import {
	PERMISSION_CATALOG,
	PROVINCE_SCOPABLE,
} from "@/components/blocks/agencies/permissions";
import { Constants } from "@/lib/supabase/database.types";

describe("agency permission catalog", () => {
	it("matches the agency_permission Postgres enum exactly", () => {
		expect([...PERMISSION_CATALOG].sort()).toEqual(
			[...Constants.public.Enums.agency_permission].sort()
		);
	});

	it("has no duplicate permissions", () => {
		expect(new Set(PERMISSION_CATALOG).size).toBe(PERMISSION_CATALOG.length);
	});

	it("only marks catalog permissions as province-scopable", () => {
		for (const permission of PROVINCE_SCOPABLE) {
			expect(PERMISSION_CATALOG).toContain(permission);
		}
	});
});

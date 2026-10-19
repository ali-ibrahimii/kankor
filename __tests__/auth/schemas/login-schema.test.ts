import { describe, expect, it } from "vitest";
import { loginSchema } from "@/app/[locale]/auth/login/login-schema";

describe("loginSchema", () => {
	it("accepts a valid email and password", () => {
		const result = loginSchema.safeParse({
			email: "user@example.com",
			password: "secret",
		});
		expect(result.success).toBe(true);
	});

	it("rejects an invalid email", () => {
		const result = loginSchema.safeParse({
			email: "not-an-email",
			password: "secret",
		});
		expect(result.success).toBe(false);
	});

	it("rejects an empty email", () => {
		const result = loginSchema.safeParse({ email: "", password: "secret" });
		expect(result.success).toBe(false);
	});

	it("accepts any string for password (no min length at the schema level)", () => {
		const result = loginSchema.safeParse({
			email: "user@example.com",
			password: "",
		});
		expect(result.success).toBe(true);
	});

	it("rejects when email field is missing", () => {
		const result = loginSchema.safeParse({ password: "secret" });
		expect(result.success).toBe(false);
	});
});

import { spawn } from "node:child_process";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(__dirname, "seed-real-data.js");

/**
 * End-to-end test for the real-data seeding script.
 *
 * It boots a tiny HTTP server that speaks just enough of the Supabase REST
 * API (`GET /rest/v1/<table>?select=...` and `POST /rest/v1/<table>?on_conflict=...`)
 * plus the Auth admin endpoints, points the script at it via env vars, and
 * asserts that:
 *
 *  - reference data is upserted (and only re-upserted on a second run),
 *  - province ids are reused rather than forked,
 *  - university↔faculty links are created,
 *  - instructor accounts are created with the expected profile rows,
 *  - re-running does not duplicate anything.
 */

let server;
let baseUrl;
const tables = new Map();
const authUsers = new Map();
const requests = [];

function json(res, status, body) {
	const payload = JSON.stringify(body);
	res.writeHead(status, {
		"Content-Type": "application/json",
		"Content-Length": Buffer.byteLength(payload),
	});
	res.end(payload);
}

beforeAll(async () => {
	server = createServer((req, res) => {
		const url = new URL(req.url, "http://localhost");
		requests.push({ method: req.method, path: url.pathname });

		// ── Auth admin: create user ────────────────────────────────────────
		if (req.method === "POST" && url.pathname === "/auth/v1/admin/users") {
			let raw = "";
			req.on("data", (c) => {
				raw += c;
			});
			req.on("end", () => {
				const body = JSON.parse(raw || "{}");
				if (authUsers.has(body.email)) {
					// 422 → "already registered"
					return json(res, 422, {
						code: 422,
						msg: "User already registered",
					});
				}
				const id = `uuid-${authUsers.size + 1}`;
				authUsers.set(body.email, {
					id,
					email: body.email,
					password: body.password,
					metadata: body.user_metadata,
				});
				json(res, 200, { id, email: body.email });
			});
			return;
		}

		// ── Auth admin: list users ─────────────────────────────────────────
		if (req.method === "GET" && url.pathname === "/auth/v1/admin/users") {
			return json(res, 200, { users: [...authUsers.values()] });
		}

		// ── REST: read a table ─────────────────────────────────────────────
		if (req.method === "GET" && url.pathname.startsWith("/rest/v1/")) {
			const table = url.pathname.slice("/rest/v1/".length);
			return json(res, 200, tables.get(table) ?? []);
		}

		// ── REST: upsert a table ───────────────────────────────────────────
		if (req.method === "POST" && url.pathname.startsWith("/rest/v1/")) {
			const table = url.pathname.slice("/rest/v1/".length);
			let raw = "";
			req.on("data", (c) => {
				raw += c;
			});
			req.on("end", () => {
				const rows = JSON.parse(raw || "[]");
				const existing = tables.get(table) ?? [];

				for (const row of rows) {
					const idx = existing.findIndex((r) => r.id === row.id);
					if (idx === -1) {
						existing.push(row);
					} else {
						existing[idx] = { ...existing[idx], ...row };
					}
				}

				tables.set(table, existing);
				json(res, 201, rows);
			});
			return;
		}

		json(res, 404, { message: "not found" });
	});

	await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
	baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
	await new Promise((resolve) => server.close(resolve));
});

function runScript(args = [], env = {}) {
	return new Promise((resolve, reject) => {
		const child = spawn(process.execPath, [SCRIPT, ...args], {
			env: {
				...process.env,
				NEXT_PUBLIC_SUPABASE_URL: baseUrl,
				NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-test-key",
				SUPABASE_SERVICE_ROLE_KEY: "service-test-key",
				...env,
			},
		});

		let stdout = "";
		let stderr = "";
		child.stdout.on("data", (d) => {
			stdout += d;
		});
		child.stderr.on("data", (d) => {
			stderr += d;
		});

		child.on("close", (code) => {
			resolve({ code, stdout, stderr });
		});
		child.on("error", reject);
	});
}

describe("seed-real-data script", () => {
	it("seeds reference data into a fresh project", async () => {
		const result = await runScript();

		expect(result.code, result.stderr).toBe(0);
		expect(result.stdout).toContain("Done.");

		expect(tables.get("provinces").length).toBeGreaterThan(30);
		expect(tables.get("universities").length).toBeGreaterThan(30);
		expect(tables.get("faculties").length).toBeGreaterThan(10);
		expect(tables.get("universities_faculties").length).toBeGreaterThan(50);
		expect(tables.get("schools").length).toBeGreaterThan(5);
	});

	it("links every university to a province", async () => {
		const provinces = tables.get("provinces");
		const universities = tables.get("universities");
		const provinceIds = new Set(provinces.map((p) => p.id));

		for (const university of universities) {
			expect(provinceIds.has(university.province_id)).toBe(true);
		}
	});

	it("links every university↔faculty row to real ids", async () => {
		const universities = tables.get("universities");
		const faculties = tables.get("faculties");
		const universityIds = new Set(universities.map((u) => u.id));
		const facultyIds = new Set(faculties.map((f) => f.id));

		for (const link of tables.get("universities_faculties")) {
			expect(universityIds.has(link.university_id)).toBe(true);
			expect(facultyIds.has(link.faculty_id)).toBe(true);
		}
	});

	it("is idempotent — a second run does not duplicate rows", async () => {
		const before = {
			provinces: tables.get("provinces").length,
			universities: tables.get("universities").length,
			faculties: tables.get("faculties").length,
			links: tables.get("universities_faculties").length,
			schools: tables.get("schools").length,
		};

		const result = await runScript();
		expect(result.code, result.stderr).toBe(0);

		expect(tables.get("provinces").length).toBe(before.provinces);
		expect(tables.get("universities").length).toBe(before.universities);
		expect(tables.get("faculties").length).toBe(before.faculties);
		expect(tables.get("universities_faculties").length).toBe(before.links);
		expect(tables.get("schools").length).toBe(before.schools);
	});

	it("creates instructor accounts and profile rows", async () => {
		const result = await runScript(["--accounts"]);
		expect(result.code, result.stderr).toBe(0);

		expect(authUsers.size).toBeGreaterThan(0);

		const profiles = tables.get("profiles") ?? [];
		expect(profiles.length).toBe(authUsers.size);

		for (const profile of profiles) {
			expect(profile.role).toBe("instructor");
			expect(profile.instructor_status).toBe("active");
			expect(profile.full_name).toBeTruthy();
			expect(profile.bio).toBeTruthy();
		}
	});

	it("reuses an existing auth user instead of failing on a re-run", async () => {
		const before = authUsers.size;

		const result = await runScript(["--accounts"]);
		expect(result.code, result.stderr).toBe(0);
		expect(authUsers.size).toBe(before);
		expect(result.stdout).toContain("already exists");
	});

	it("refuses to run against a placeholder Supabase URL", async () => {
		const result = await runScript([], {
			NEXT_PUBLIC_SUPABASE_URL: "https://demo.invalid",
		});

		expect(result.code).toBe(1);
		expect(result.stderr).toContain("placeholder");
	});

	it("refuses --accounts without a service-role key", async () => {
		const result = await runScript(["--accounts"], {
			SUPABASE_SERVICE_ROLE_KEY: "",
		});

		expect(result.code).toBe(1);
		expect(result.stderr).toContain("SUPABASE_SERVICE_ROLE_KEY");
	});
});

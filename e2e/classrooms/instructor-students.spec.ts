import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "../auth/auth-helper";
import { createTestUser, loginAs } from "../decks/deck-test-helpers";

const supabaseUrl =
	process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
	throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined");
}

test.describe("Instructor Students List Page", () => {
	test("instructor can view, search, and filter their students", async ({
		page,
	}) => {
		// Increase timeout since dev server compilation can take time on first run
		test.setTimeout(60000);

		// 1. Create test users (instructor and student)
		const { email: instructorEmail, userId: instructorId } =
			await createTestUser("instructor", "instr-studs");
		const { email: studentEmail, userId: studentId } = await createTestUser(
			"student",
			"stud-item"
		);

		const classroomName1 = `Physics Grade 12 ${Date.now()}`;
		const classroomName2 = `Math Grade 11 ${Date.now()}`;

		// Set up authenticated userClient for the instructor to bypass service_role RLS restrictions
		const userClient = createClient(supabaseUrl, supabaseAnonKey, {
			auth: { autoRefreshToken: false, persistSession: false },
		});

		const { error: signInError } = await userClient.auth.signInWithPassword({
			email: instructorEmail,
			password: "ValidPassword123", // TEST_PASSWORD
		});
		if (signInError) throw signInError;

		// 2. Create two classrooms owned by this instructor
		const { data: classroom1, error: err1 } = await userClient
			.from("classrooms")
			.insert({
				name: classroomName1,
				join_code: `P${Date.now().toString().slice(-5)}`,
				user_id: instructorId,
			})
			.select("id")
			.single();
		if (err1 || !classroom1)
			throw new Error(err1?.message ?? "Classroom 1 failed");

		const { data: classroom2, error: err2 } = await userClient
			.from("classrooms")
			.insert({
				name: classroomName2,
				join_code: `M${Date.now().toString().slice(-5)}`,
				user_id: instructorId,
			})
			.select("id")
			.single();
		if (err2 || !classroom2)
			throw new Error(err2?.message ?? "Classroom 2 failed");

		// 3. Add student to classroom 1 as student role
		const { error: joinErr } = await userClient
			.from("classroom_members")
			.insert({
				classroom_id: classroom1.id,
				user_id: studentId,
				role: "student",
			});
		if (joinErr) throw joinErr;

		try {
			// 4. Log in as instructor on browser page
			await loginAs(page, instructorEmail);
			await expect(page).toHaveURL(/\/d\/instructor/);

			// 5. Navigate to students page
			await page.goto("/en/d/instructor/students");
			await page.waitForLoadState("networkidle");

			// 6. Verify student is listed in the table
			const studentNameCell = page.getByRole("cell", {
				name: "Test stud-item",
			});
			await expect(studentNameCell).toBeVisible();

			const studentContactCell = page.getByRole("cell", { name: studentEmail });
			await expect(studentContactCell).toBeVisible();

			// 7. Verify classroom badge is visible
			await expect(page.getByText(classroomName1)).toBeVisible();

			// 8. Test Search functionality (type name of student)
			await page.getByPlaceholder("Search students...").fill("stud-item");
			// Wait for debounce (500ms) and check student is still visible
			await page.waitForTimeout(1000);
			await expect(studentNameCell).toBeVisible();

			// Type something that doesn't exist
			await page
				.getByPlaceholder("Search students...")
				.fill("nonexistentstudentname");
			await page.waitForTimeout(1000);
			await expect(studentNameCell).not.toBeVisible();
			await expect(page.getByText("No students found.")).toBeVisible();

			// Clear search
			await page.getByPlaceholder("Search students...").fill("");
			await page.waitForTimeout(1000);
			await expect(studentNameCell).toBeVisible();

			// 9. Test Classroom Filter dropdown
			// Select Classroom 2 (where student is NOT a member)
			const selectTrigger = page
				.locator("button[data-slot='select-trigger']")
				.nth(1);
			await selectTrigger.click();
			await page.getByRole("option", { name: classroomName2 }).click();
			await page.waitForLoadState("networkidle");

			// Student should not be visible now
			await expect(studentNameCell).not.toBeVisible();

			// Select Classroom 1 (where student is a member)
			await selectTrigger.click();
			await page.getByRole("option", { name: classroomName1 }).click();
			await page.waitForLoadState("networkidle");

			// Student should be visible again
			await expect(studentNameCell).toBeVisible();
		} finally {
			// Cleanup created data
			await userClient
				.from("classroom_members")
				.delete()
				.eq("classroom_id", classroom1.id);
			await userClient
				.from("classrooms")
				.delete()
				.in("id", [classroom1.id, classroom2.id]);
			await supabaseAdmin.auth.admin.deleteUser(instructorId);
			await supabaseAdmin.auth.admin.deleteUser(studentId);
		}
	});
});

import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "../auth/auth-helper";
import {
	createTestUser,
	loginAs,
	TEST_PASSWORD,
} from "../decks/deck-test-helpers";

const supabaseUrl =
	process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
	throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined");
}

test.describe("Classroom tab URL persistence", () => {
	test("instructor can switch tabs and see active tab persisted in URL, and on reload", async ({
		page,
	}) => {
		const { email, userId } = await createTestUser(
			"instructor",
			"class-instructor"
		);

		const classroomName = `Playwright Classroom ${Date.now()}`;
		let classroomId = "";

		const userClient = createClient(supabaseUrl, supabaseAnonKey, {
			auth: { autoRefreshToken: false, persistSession: false },
		});

		try {
			// Sign in userClient as instructor to bypass service_role RLS limits
			const { error: signInError } = await userClient.auth.signInWithPassword({
				email,
				password: TEST_PASSWORD,
			});
			if (signInError) throw signInError;

			// Insert classroom directly via authenticated userClient
			const { data: classroom, error: classroomError } = await userClient
				.from("classrooms")
				.insert({
					name: classroomName,
					description: "Test classroom for tab URL persistence",
					join_code: `TEST${Date.now().toString().slice(-4)}`,
					user_id: userId,
				})
				.select("id")
				.single();

			if (classroomError || !classroom) {
				throw new Error(
					classroomError?.message ?? "Failed to create classroom"
				);
			}

			classroomId = classroom.id;

			// Login via browser page
			await loginAs(page, email);
			await expect(page).toHaveURL(/\/d\/instructor/);

			// Go to edit page
			await page.goto(`/en/d/instructor/classrooms/${classroomId}/edit`);

			// Verify we start on default tab
			await expect(page).toHaveURL(
				new RegExp(`/d/instructor/classrooms/${classroomId}/edit`)
			);
			const tabsList = page.locator("div[role='tablist']");
			await expect(tabsList.locator("button[data-state='active']")).toHaveText(
				/resources/i
			);

			// Click Members tab
			await page.getByRole("tab", { name: /members/i }).click();

			// URL should now have ?tab=members
			await expect(page).toHaveURL(
				new RegExp(`/d/instructor/classrooms/${classroomId}/edit\\?tab=members`)
			);
			await expect(tabsList.locator("button[data-state='active']")).toHaveText(
				/members/i
			);

			// Reload page
			await page.reload();

			// URL and tab state should persist
			await expect(page).toHaveURL(
				new RegExp(`/d/instructor/classrooms/${classroomId}/edit\\?tab=members`)
			);
			await expect(tabsList.locator("button[data-state='active']")).toHaveText(
				/members/i
			);

			// Click Materials tab
			await page.getByRole("tab", { name: /materials/i }).click();

			// URL should now have ?tab=materials
			await expect(page).toHaveURL(
				new RegExp(
					`/d/instructor/classrooms/${classroomId}/edit\\?tab=materials`
				)
			);
			await expect(tabsList.locator("button[data-state='active']")).toHaveText(
				/materials/i
			);
		} finally {
			// Cleanup
			if (classroomId) {
				await supabaseAdmin.from("classrooms").delete().eq("id", classroomId);
			}
			await supabaseAdmin.auth.admin.deleteUser(userId);
		}
	});

	test("student can switch tabs and see active tab persisted in URL, and on reload", async ({
		page,
	}) => {
		const { email: instructorEmail, userId: instructorId } =
			await createTestUser("instructor", "class-inst-2");
		const { email: studentEmail, userId: studentId } = await createTestUser(
			"student",
			"class-student"
		);

		const classroomName = `Playwright Student Classroom ${Date.now()}`;
		let classroomId = "";

		const instructorClient = createClient(supabaseUrl, supabaseAnonKey, {
			auth: { autoRefreshToken: false, persistSession: false },
		});

		try {
			// Sign in instructorClient
			const { error: instSignInError } =
				await instructorClient.auth.signInWithPassword({
					email: instructorEmail,
					password: TEST_PASSWORD,
				});
			if (instSignInError) throw instSignInError;

			// Insert classroom directly via authenticated instructor
			const { data: classroom, error: classroomError } = await instructorClient
				.from("classrooms")
				.insert({
					name: classroomName,
					description: "Test classroom for student tab URL persistence",
					join_code: `STU${Date.now().toString().slice(-4)}`,
					user_id: instructorId,
				})
				.select("id")
				.single();

			if (classroomError || !classroom) {
				throw new Error(
					classroomError?.message ?? "Failed to create classroom"
				);
			}

			classroomId = classroom.id;

			// Add student as member using instructorClient (who can manage members)
			const { error: memberError } = await instructorClient
				.from("classroom_members")
				.insert({
					classroom_id: classroomId,
					user_id: studentId,
					role: "student",
				});

			if (memberError) {
				throw new Error(memberError.message);
			}

			// Login student via page
			await loginAs(page, studentEmail);
			await expect(page).toHaveURL(/\/d/);

			// Go to classroom detail page
			await page.goto(`/en/d/classrooms/${classroomId}`);

			// Verify we start on default tab
			await expect(page).toHaveURL(new RegExp(`/d/classrooms/${classroomId}`));
			const tabsList = page.locator("div[role='tablist']");
			await expect(tabsList.locator("button[data-state='active']")).toHaveText(
				/resources/i
			);

			// Click Materials tab
			await page.getByRole("tab", { name: /materials/i }).click();

			// URL should now have ?tab=materials
			await expect(page).toHaveURL(
				new RegExp(`/d/classrooms/${classroomId}\\?tab=materials`)
			);
			await expect(tabsList.locator("button[data-state='active']")).toHaveText(
				/materials/i
			);

			// Reload page
			await page.reload();

			// URL and tab state should persist
			await expect(page).toHaveURL(
				new RegExp(`/d/classrooms/${classroomId}\\?tab=materials`)
			);
			await expect(tabsList.locator("button[data-state='active']")).toHaveText(
				/materials/i
			);

			// Click Announcements tab
			await page.getByRole("tab", { name: /announcements/i }).click();

			// URL should now have ?tab=announcements
			await expect(page).toHaveURL(
				new RegExp(`/d/classrooms/${classroomId}\\?tab=announcements`)
			);
			await expect(tabsList.locator("button[data-state='active']")).toHaveText(
				/announcements/i
			);
		} finally {
			// Cleanup
			if (classroomId) {
				await supabaseAdmin.from("classrooms").delete().eq("id", classroomId);
			}
			await supabaseAdmin.auth.admin.deleteUser(instructorId);
			await supabaseAdmin.auth.admin.deleteUser(studentId);
		}
	});
});

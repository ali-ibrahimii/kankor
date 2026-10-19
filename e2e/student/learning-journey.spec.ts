import { expect, test } from "@playwright/test";
import { supabaseAdmin } from "../auth/auth-helper";
import { createTestUser, loginAs } from "../decks/deck-test-helpers";

test.describe("Student Learning Journey & Certification", () => {
	test("student can enroll, complete lessons, and verify certificate", async ({
		page,
	}) => {
		// Increase timeout since Next.js compilation / dynamic routes take time
		test.setTimeout(90000);

		// 1. Create Instructor and Student
		const { email: instructorEmail, userId: instructorId } =
			await createTestUser("instructor", "learn-inst");
		const { email: studentEmail, userId: studentId } = await createTestUser(
			"student",
			"learn-stud"
		);

		// 2. Insert Custom Course, Module, Lesson, and Content Block
		const courseSlug = `learning-test-course-${Date.now()}`;
		const courseTitle = `E2E Learning Course ${Date.now()}`;

		const { data: course, error: courseErr } = await supabaseAdmin
			.from("courses")
			.insert({
				title: courseTitle,
				slug: courseSlug,
				instructor_id: instructorId,
				is_published: true,
				is_free: true,
				price_credits: 0,
			})
			.select("id")
			.single();
		expect(courseErr).toBeNull();
		if (!course) throw new Error("Failed to seed course");

		const { data: module, error: moduleErr } = await supabaseAdmin
			.from("modules")
			.insert({
				course_id: course.id,
				title: "Module 1: Algebra Fundamentals",
				order_index: 0,
			})
			.select("id")
			.single();
		expect(moduleErr).toBeNull();
		if (!module) throw new Error("Failed to seed module");

		const { data: lesson, error: lessonErr } = await supabaseAdmin
			.from("lessons")
			.insert({
				course_id: course.id,
				module_id: module.id,
				title: "Lesson 1: Intro to Variables",
				content_type: "text",
				is_mandatory: true,
				order_index: 0,
			})
			.select("id")
			.single();
		expect(lessonErr).toBeNull();
		if (!lesson) throw new Error("Failed to seed lesson");

		const { error: blockErr } = await supabaseAdmin
			.from("lesson_content_blocks")
			.insert({
				lesson_id: lesson.id,
				block_type: "text",
				text_content:
					"In algebra, we use variables like x and y to represent numbers.",
				order_index: 0,
			});
		expect(blockErr).toBeNull();

		try {
			page.on("console", (msg) => {
				console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
			});
			page.on("pageerror", (err) => {
				console.log(`[BROWSER UNCAUGHT ERROR] ${err.message}`);
			});
			page.on("request", (req) => {
				if (req.url().includes("/auth")) {
					console.log(`[NETWORK REQ] ${req.method()} ${req.url()}`);
				}
			});
			page.on("response", (res) => {
				if (res.url().includes("/auth")) {
					console.log(`[NETWORK RES] ${res.status()} ${res.url()}`);
				}
			});

			// 3. Log in as Student
			await page.goto("/en/auth/login");
			await page.waitForLoadState("networkidle");
			await page.getByLabel("Email Address").fill(studentEmail);
			await page.getByLabel("Password").fill("ValidPassword123");
			await page.getByLabel("Password").blur();
			await page.waitForTimeout(500);

			const loginBtn = page.getByRole("button", { name: /^login$/i });
			await expect(loginBtn).toBeEnabled();
			await loginBtn.click();

			try {
				await page.waitForURL(/\/d/, { timeout: 30000 });
			} catch (e) {
				console.log("Login failed! Current URL:", page.url());
				console.log("Page Content:", await page.locator("body").innerText());
				throw e;
			}

			// 4. Navigate to the Course Detail Page
			await page.goto(`/en/courses/${courseSlug}`);
			await page.waitForLoadState("networkidle");

			// 5. Enroll in the Course
			// Click the enroll button in the CourseCtaCard
			const enrollBtn = page.getByRole("button", {
				name: /enroll|get started|free/i,
			});
			await expect(enrollBtn).toBeVisible();
			await enrollBtn.click();

			// Enrollment triggers toast notification and page state change
			await expect(page.getByText(/success/i)).toBeVisible();

			// Once enrolled, the button shifts to "Resume" or "Start learning"
			const startBtn = page.getByRole("link", {
				name: /start learning|resume/i,
			});
			await expect(startBtn).toBeVisible();
			await startBtn.click();

			// 6. Navigate to My Courses Learning Screen
			await expect(page).toHaveURL(new RegExp(`/en/d/my-courses/${course.id}`));
			await expect(
				page.getByText("Lesson 1: Intro to Variables")
			).toBeVisible();

			// 7. Complete the lesson
			const completeBtn = page.getByRole("button", {
				name: "Mark as complete",
			});
			await expect(completeBtn).toBeVisible();
			await completeBtn.click();

			// Course progress hits 100% since it is a single-lesson course
			// This automatically inserts a record into the certificates table.
			await expect(page.getByText("Completed")).toBeVisible();

			// Wait for DB trigger to complete and insert the certificate row
			await page.waitForTimeout(2000);

			// 8. Verify certificate generated in the DB
			const { data: cert, error: certErr } = await supabaseAdmin
				.from("certificates")
				.select("verification_code")
				.eq("course_id", course.id)
				.eq("user_id", studentId)
				.single();
			expect(certErr).toBeNull();
			expect(cert?.verification_code).toBeTruthy();

			// 9. Verify on public verification page (as signed-out user / in new context or simply navigate)
			// Log out to verify signed-out public verification access
			await page.goto("/en/auth/login");
			// If there's a logout action or signout route, we can hit it.
			await page.goto("/api/auth/signout");
			await page.waitForLoadState("networkidle");

			// Go to verify code page
			await page.goto(`/en/verify/${cert?.verification_code}`);
			await page.waitForLoadState("networkidle");

			// Renders the certificate details (Valid certificate, course title, student name)
			await expect(page.getByText("Valid certificate")).toBeVisible();
			await expect(page.getByText(courseTitle)).toBeVisible();
			await expect(page.getByText("Test learn-stud")).toBeVisible();
		} finally {
			// 10. Clean up seeded data
			await supabaseAdmin
				.from("certificates")
				.delete()
				.eq("course_id", course.id);
			await supabaseAdmin
				.from("enrollments")
				.delete()
				.eq("course_id", course.id);
			await supabaseAdmin
				.from("lesson_content_blocks")
				.delete()
				.eq("lesson_id", lesson.id);
			await supabaseAdmin.from("lessons").delete().eq("course_id", course.id);
			await supabaseAdmin.from("modules").delete().eq("course_id", course.id);
			await supabaseAdmin.from("courses").delete().eq("id", course.id);
			await supabaseAdmin.auth.admin.deleteUser(instructorId);
			await supabaseAdmin.auth.admin.deleteUser(studentId);
		}
	});
});

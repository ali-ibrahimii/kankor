import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "../auth/auth-helper";
import { createRoleUser } from "../shared/test-users";

const supabaseUrl =
	process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
	throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined");
}

/**
 * docs/user_flows.md §3.5 flags `get_quiz_details` as a security-relevant
 * invariant worth a regression test: the RPC must never return
 * `entrance_code` or question content to a signed-out/non-owner caller —
 * "enforced server-side, not just hidden in the UI". The Next.js page only
 * calls this RPC from a Server Component (see the public quiz detail
 * page's `fetchPublicQuiz`), so intercepting the browser's network tab
 * would test nothing — the RPC is reachable directly via PostgREST with
 * just the anon key, so that's the actual attack surface to verify.
 */
test.describe("Quiz detail RPC — entrance_code / question leak regression", () => {
	test("get_quiz_details never returns entrance_code or question content to an anonymous caller", async () => {
		const instructor = await createRoleUser("instructor", "quiz-security");

		const { data: quiz, error } = await supabaseAdmin
			.from("quizzes")
			.insert({
				title: `Security Regression Quiz ${Date.now()}`,
				user_id: instructor.userId,
				is_free: true,
				visibility: "public",
				entrance_code: "TOP-SECRET-1234",
			})
			.select("id, slug, entrance_code")
			.single();
		expect(error).toBeNull();
		expect(quiz?.entrance_code).toBe("TOP-SECRET-1234");

		const { error: questionError } = await supabaseAdmin
			.from("questions")
			.insert({
				quiz_id: quiz!.id,
				question_text: "Confidential exam question text",
				question_type: "multiple_choice_single_correct",
			});
		expect(questionError).toBeNull();

		try {
			const anonClient = createClient(supabaseUrl, supabaseAnonKey!, {
				auth: { autoRefreshToken: false, persistSession: false },
			});

			const { data: publicQuiz, error: rpcError } = await anonClient
				.rpc("get_quiz_details", { p_quiz_slug: quiz!.slug })
				.single();

			expect(rpcError).toBeNull();
			expect(publicQuiz).toBeTruthy();

			const serialized = JSON.stringify(publicQuiz);
			expect(publicQuiz).not.toHaveProperty("entrance_code");
			expect(serialized).not.toContain("TOP-SECRET-1234");
			expect(serialized).not.toContain("Confidential exam question text");
		} finally {
			await supabaseAdmin.from("questions").delete().eq("quiz_id", quiz!.id);
			await supabaseAdmin.from("quizzes").delete().eq("id", quiz!.id);
			await supabaseAdmin.auth.admin.deleteUser(instructor.userId);
		}
	});
});

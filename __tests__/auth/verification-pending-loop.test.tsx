import { describe, expect, it, vi } from "vitest";

/**
 * Regression test for the instructor/school dashboard "site won't load" bug.
 *
 * `VerificationPendingPage` used to unconditionally redirect *any* signed-in
 * user to `getDashboardPath(user)`. But the only route that renders it is the
 * one an unverified instructor/school is redirected to *from* its dashboard
 * layout — so for exactly those users the page bounced straight back into the
 * layout that rejected them:
 *
 *     /d/instructor  --(layout: status != active)-->  /verification-pending
 *     /verification-pending  --(page: user != null)-->  /d/instructor
 *     ... forever → ERR_TOO_MANY_REDIRECTS
 *
 * The pending page must render for the user it was created for.
 */

const mockGetCurrentUser = vi.hoisted(() => vi.fn());
const redirectCalls = vi.hoisted(() => [] as string[]);

vi.mock("@/lib/auth/session", () => ({
	getCurrentUser: mockGetCurrentUser,
}));

// `@/i18n/navigation`'s redirect throws in real Next.js; emulate that so a
// loop would surface as a thrown error rather than a silently rendered page.
// next-intl's `redirect({ href, locale })` prefixes the locale onto the path,
// so the recorded value is the real URL the browser would be sent to.
vi.mock("@/i18n/navigation", () => ({
	redirect: ({ href, locale }: { href: string; locale?: string }) => {
		const url = locale ? `/${locale}${href}` : href;
		redirectCalls.push(url);
		throw new Error(`NEXT_REDIRECT:${url}`);
	},
	Link: () => null,
}));

// The page reads the school's approval status with the cookie-bound server
// client, which needs a Next.js request store that unit tests don't have.
const mockSchoolStatus = vi.hoisted(() => vi.fn());
const mockSupabase = vi.hoisted(() => ({
	from: () => ({
		select: () => ({
			eq: () => ({
				maybeSingle: mockSchoolStatus,
			}),
		}),
	}),
}));

vi.mock("@/lib/supabase/server", () => ({
	createClient: async () => mockSupabase,
}));

vi.mock("next-intl/server", () => ({
	getTranslations: async () => (key: string) => key,
	setRequestLocale: vi.fn(),
}));

function makeUser(overrides: Record<string, unknown> = {}) {
	return {
		id: "00000000-0000-0000-0000-0000000000cc",
		role: "instructor",
		instructor_status: "pending",
		schoolMemberships: [],
		agencyMemberships: [],
		...overrides,
	};
}

async function renderPendingPage(type?: string) {
	const { default: VerificationPendingPage } = await import(
		"@/app/[locale]/verification-pending/page"
	);

	const element = await VerificationPendingPage({
		params: Promise.resolve({ locale: "en" }),
		searchParams: Promise.resolve(type ? { type } : {}),
	});

	return element;
}

describe("verification-pending page", () => {
	describe("for a pending instructor", () => {
		it("renders the pending page instead of redirecting to the dashboard", async () => {
			redirectCalls.length = 0;
			mockGetCurrentUser.mockResolvedValue(makeUser());

			await expect(renderPendingPage("instructor")).resolves.toBeTruthy();

			// The old implementation redirected to /en/d/instructor here, which
			// the instructor layout immediately bounced back — an infinite loop.
			expect(redirectCalls).not.toContain("/en/d/instructor");
		});
	});

	describe("for a pending school owner", () => {
		it("renders the pending page instead of redirecting into the school dashboard", async () => {
			redirectCalls.length = 0;
			mockGetCurrentUser.mockResolvedValue(
				makeUser({
					role: "student",
					instructor_status: null,
					schoolMemberships: [
						{
							school_id: "00000000-0000-0000-0000-0000000000bb",
							role: "owner",
						},
					],
				})
			);

			mockSchoolStatus.mockResolvedValue({
				data: { status: "pending" },
				error: null,
			});

			await expect(renderPendingPage("school")).resolves.toBeTruthy();

			expect(
				redirectCalls.some((href) => href.startsWith("/en/d/school/"))
			).toBe(false);
		});
	});

	describe("for an anonymous visitor", () => {
		it("still renders the page", async () => {
			redirectCalls.length = 0;
			mockGetCurrentUser.mockResolvedValue(null);

			await expect(renderPendingPage()).resolves.toBeTruthy();
			expect(redirectCalls).toHaveLength(0);
		});
	});

	describe("for an account that is already approved", () => {
		it("forwards an active instructor to the instructor dashboard", async () => {
			redirectCalls.length = 0;
			mockGetCurrentUser.mockResolvedValue(
				makeUser({ instructor_status: "active" })
			);

			await expect(renderPendingPage("instructor")).rejects.toThrow(
				/NEXT_REDIRECT/
			);
			expect(redirectCalls).toContain("/en/d/instructor");
		});
	});
});

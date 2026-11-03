import { describe, expect, it, vi } from "vitest";

// course-hero is a client component that links and reads the auth context;
// only its pure duration helper is under test here.
vi.mock("@/i18n/navigation", () => ({
	Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
	useRouter: () => ({ push: vi.fn() }),
	usePathname: () => "/",
}));
vi.mock("@/providers/auth.provider", () => ({
	useAuth: () => ({ isAuthenticated: false, user: null }),
}));

const { totalLessonMinutes } = await import(
	"@/components/blocks/course/course-hero"
);

const lesson = (minutes?: number | null) => ({
	estimated_duration_minutes: minutes,
});

describe("totalLessonMinutes", () => {
	it("sums every lesson duration in the curriculum", () => {
		expect(
			totalLessonMinutes([
				{ lessons: [lesson(30), lesson(45)] },
				{ lessons: [lesson(60)] },
			])
		).toBe(135);
	});

	it("ignores lessons that were never timed", () => {
		expect(
			totalLessonMinutes([{ lessons: [lesson(20), lesson(null), lesson()] }])
		).toBe(20);
	});

	it("returns 0 for a course with no modules yet", () => {
		expect(totalLessonMinutes([])).toBe(0);
		expect(totalLessonMinutes(null)).toBe(0);
		expect(totalLessonMinutes(undefined)).toBe(0);
	});
});

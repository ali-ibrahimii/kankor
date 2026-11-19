import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { demoStudentOverview } from "@/lib/demo/mock-dashboard";
import en from "@/messages/en.json";
import fa from "@/messages/fa.json";
import ps from "@/messages/ps.json";
import { StudentOverview } from "./student-overview";

let activeLocale: "en" | "fa" | "ps" = "fa";
const catalogs = { en, fa, ps } as const;

function lookupMessage(namespace: string, key: string): string {
	const fullPath = `${namespace}.${key}`.split(".");
	let current: unknown = catalogs[activeLocale];
	for (const part of fullPath) {
		if (current && typeof current === "object" && part in current) {
			current = (current as Record<string, unknown>)[part];
		} else {
			throw new Error(`MISSING_MESSAGE: ${activeLocale}.${namespace}.${key}`);
		}
	}
	if (typeof current !== "string") {
		throw new Error(`NON_STRING_MESSAGE: ${activeLocale}.${namespace}.${key}`);
	}
	return current;
}

function interpolate(
	template: string,
	values?: Record<string, string | number>
): string {
	if (!values) return template;
	// Handle simple ICU plurals in test mock
	const resolved = template.replace(
		/\{(\w+),\s*plural,\s*([^}]+(?:\{[^}]*\}[^}]*)*)\}/g,
		(_, name: string, body: string) => {
			const raw = Number(values[name] ?? 0);
			const exact = body.match(new RegExp(`=${raw}\\s*\\{([^}]*)\\}`));
			if (exact) return exact[1].replace(/#/g, String(raw));
			const other = body.match(/other\s*\{([^}]*)\}/);
			return other ? other[1].replace(/#/g, String(raw)) : String(raw);
		}
	);
	return resolved.replace(/\{(\w+)\}/g, (_, k: string) =>
		String(values[k] ?? `{${k}}`)
	);
}

vi.mock("next-intl/server", () => ({
	getLocale: async () => activeLocale,
	getTranslations: async (namespace: string) => {
		return (key: string, values?: Record<string, string | number>) =>
			interpolate(lookupMessage(namespace, key), values);
	},
}));

vi.mock("@/i18n/navigation", () => ({
	Link: ({
		href,
		children,
		...rest
	}: {
		href: string;
		children: ReactNode;
		[key: string]: unknown;
	}) => (
		<a href={href} {...rest}>
			{children}
		</a>
	),
}));

describe("StudentOverview personal study desk", () => {
	beforeEach(() => {
		activeLocale = "fa";
	});

	it("renders a warm welcoming study space for a brand-new student in Dari, Pashto, and English", async () => {
		for (const locale of ["fa", "ps", "en"] as const) {
			activeLocale = locale;
			const ui = await StudentOverview({
				overview: null,
				userName: "Ali Student",
			});
			const { unmount } = render(ui);

			const expectedGreeting = catalogs[
				locale
			].overview.student.studySpace.greetingNamed.replace("{name}", "Ali");
			expect(
				screen.getByRole("heading", { level: 1, name: expectedGreeting })
			).toBeTruthy();

			expect(
				screen.getByText(
					catalogs[locale].overview.student.studySpace.stepCourseTitle
				)
			).toBeTruthy();
			expect(
				screen.getByText(
					catalogs[locale].overview.student.studySpace.notebookEmptyTitle
				)
			).toBeTruthy();

			// 14 resting rhythm stones rendered cleanly without chart errors
			const rhythmList = screen.getByRole("list", {
				name: catalogs[locale].overview.student.studySpace.rhythmLabel,
			});
			expect(rhythmList.querySelectorAll("li")).toHaveLength(14);

			unmount();
		}
	});

	it("renders active course bookmark, due memory stack, notebook entries, and practice log", async () => {
		activeLocale = "fa";
		const ui = await StudentOverview({
			overview: demoStudentOverview,
			userName: "مریم احمدی",
		});
		render(ui);

		expect(
			screen.getByRole("heading", { level: 1, name: "سلام مریم" })
		).toBeTruthy();
		expect(
			screen.getByText(demoStudentOverview.continue_learning!.course_title)
		).toBeTruthy();
		expect(
			screen.getByRole("progressbar", {
				name: demoStudentOverview.continue_learning!.course_title,
			})
		).toBeTruthy();

		for (const note of demoStudentOverview.recent_notes) {
			if (note.title) {
				expect(screen.getByText(note.title)).toBeTruthy();
			}
		}
		for (const attempt of demoStudentOverview.recent_quiz_attempts) {
			expect(screen.getByText(attempt.quiz_title)).toBeTruthy();
		}
	});

	it("keeps en, fa, and ps message catalogs in 100% key parity including account and studentNotes", () => {
		const flatten = (
			obj: Record<string, unknown>,
			prefix = "",
			out: string[] = []
		) => {
			for (const [k, v] of Object.entries(obj)) {
				const p = prefix ? `${prefix}.${k}` : k;
				if (v && typeof v === "object" && !Array.isArray(v)) {
					flatten(v as Record<string, unknown>, p, out);
				} else {
					out.push(p);
				}
			}
			return out;
		};

		const enKeys = flatten(en).sort();
		const faKeys = flatten(fa).sort();
		const psKeys = flatten(ps).sort();

		expect(faKeys).toEqual(enKeys);
		expect(psKeys).toEqual(enKeys);
		expect(enKeys).toContain("account.profile.saveButton");
		expect(enKeys).toContain("account.security.updateEmail");
		expect(enKeys).toContain("account.dangerZone.confirmButton");
		expect(enKeys).toContain("studentNotes.newNote");
	});
});

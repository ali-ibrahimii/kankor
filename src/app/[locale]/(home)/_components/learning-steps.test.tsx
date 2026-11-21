import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";
import fa from "@/messages/fa.json";
import ps from "@/messages/ps.json";
import { LearningSteps } from "./learning-steps";

let messages = en.landing.design;
vi.mock("next-intl/server", () => ({
	getTranslations:
		async () => (key: keyof typeof messages, values?: { number: number }) =>
			values ? String(values.number) : messages[key],
}));

describe("Public learning journey", () => {
	it.each([
		["en", en.landing.design],
		["fa", fa.landing.design],
		["ps", ps.landing.design],
	] as const)("renders the complete, accessible journey in %s", async (_locale, copy) => {
		messages = copy;
		const { unmount } = render(await LearningSteps());
		expect(screen.getByRole("region", { name: copy.stepsTitle })).toBeTruthy();
		expect(screen.getAllByRole("listitem")).toHaveLength(3);
		expect(
			screen.getByRole("heading", { name: copy.discoverTitle })
		).toBeTruthy();
		expect(screen.getByRole("heading", { name: copy.learnTitle })).toBeTruthy();
		expect(screen.getByRole("heading", { name: copy.growTitle })).toBeTruthy();
		expect(screen.queryByRole("button")).toBeNull();
		unmount();
	});

	it("keeps the public design translation keys aligned in all three locales", () => {
		const keys = Object.keys(en.landing.design).sort();
		expect(Object.keys(fa.landing.design).sort()).toEqual(keys);
		expect(Object.keys(ps.landing.design).sort()).toEqual(keys);
	});
});

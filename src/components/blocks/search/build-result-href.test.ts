import { describe, expect, it } from "vitest";
import { buildResultHref } from "./build-result-href";

describe("buildResultHref", () => {
	it("builds a course detail href", () => {
		expect(buildResultHref("course", "course-1")).toBe("/courses/course-1");
	});

	it("builds a library detail href", () => {
		expect(buildResultHref("library", "book-1")).toBe("/libraries/book-1");
	});

	it("builds a deck detail href", () => {
		expect(buildResultHref("deck", "deck-1")).toBe("/decks/deck-1");
	});

	it("builds a quiz detail href", () => {
		expect(buildResultHref("quiz", "quiz-1")).toBe("/quizzes/quiz-1");
	});
});

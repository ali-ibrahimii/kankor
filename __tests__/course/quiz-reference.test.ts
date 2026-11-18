import { describe, expect, it } from "vitest";
import { parseQuizReference } from "@/components/blocks/course-builder/quiz-reference";

describe("parseQuizReference", () => {
	it("parses raw entrance codes and normalizes case", () => {
		expect(parseQuizReference("C61F0662")).toEqual({
			code: "C61F0662",
			slug: "C61F0662",
		});
		expect(parseQuizReference("  f935d2bc  ")).toEqual({
			code: "F935D2BC",
			slug: "f935d2bc",
		});
		expect(parseQuizReference("#c61f0662")).toEqual({
			code: "C61F0662",
			slug: "c61f0662",
		});
		expect(parseQuizReference("code: a1b2c3d4")).toEqual({
			code: "A1B2C3D4",
			slug: "a1b2c3d4",
		});
	});

	it("parses public quiz URLs with or without locale prefixes", () => {
		expect(
			parseQuizReference("https://abzarkankor.com/fa/quizzes/physics-chapter-1")
		).toEqual({
			slug: "physics-chapter-1",
		});
		expect(parseQuizReference("/en/quizzes/algebra-midterm")).toEqual({
			slug: "algebra-midterm",
		});
		expect(parseQuizReference("abzarkankor.com/quizzes/chemistry-101")).toEqual(
			{
				slug: "chemistry-101",
			}
		);
	});

	it("extracts both entrance code and slug from share links containing ?code=", () => {
		expect(
			parseQuizReference(
				"https://abzarkankor.com/fa/quizzes/chapter-1-exam?code=c61f0662"
			)
		).toEqual({
			code: "C61F0662",
			slug: "chapter-1-exam",
		});
		expect(
			parseQuizReference("https://abzarkankor.com/quizzes?code=F935D2BC")
		).toEqual({
			code: "F935D2BC",
		});
	});

	it("parses dashboard quiz URLs for admin, instructor, school, and agency", () => {
		expect(
			parseQuizReference(
				"https://abzarkankor.com/fa/d/admin/quizzes/final-exam"
			)
		).toEqual({
			slug: "final-exam",
		});
		expect(
			parseQuizReference(
				"https://abzarkankor.com/fa/d/school/school-1/quizzes/bio-test/omr"
			)
		).toEqual({
			slug: "bio-test",
		});
		expect(
			parseQuizReference(
				"/ps/d/agency/ag-1/quizzes/550e8400-e29b-41d4-a716-446655440000"
			)
		).toEqual({
			quizId: "550e8400-e29b-41d4-a716-446655440000",
		});
	});

	it("parses bare UUIDs and slugs", () => {
		expect(parseQuizReference("550E8400-E29B-41D4-A716-446655440000")).toEqual({
			quizId: "550e8400-e29b-41d4-a716-446655440000",
		});
		expect(parseQuizReference("math-chapter-1-quiz")).toEqual({
			slug: "math-chapter-1-quiz",
		});
	});

	it("returns null for empty, multi-word, or non-quiz URLs", () => {
		expect(parseQuizReference("")).toBeNull();
		expect(parseQuizReference("   ")).toBeNull();
		expect(parseQuizReference("not a valid code")).toBeNull();
		expect(parseQuizReference("https://abzarkankor.com/fa/quizzes")).toBeNull();
		expect(
			parseQuizReference("https://abzarkankor.com/fa/courses/abc")
		).toBeNull();
	});
});

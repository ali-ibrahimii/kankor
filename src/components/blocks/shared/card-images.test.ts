import { describe, expect, it } from "vitest";
import { CARD_IMAGES, resolveEntityCardImage } from "./card-images";

describe("resolveEntityCardImage", () => {
	it("preserves valid relative and whitelisted remote cover URLs", () => {
		expect(
			resolveEntityCardImage({
				customSrc: "/images/custom-cover.jpg",
				kind: "course",
			})
		).toBe("/images/custom-cover.jpg");

		expect(
			resolveEntityCardImage({
				customSrc: "https://storage.googleapis.com/bucket/course.png",
				kind: "course",
			})
		).toBe("https://storage.googleapis.com/bucket/course.png");
	});

	it("falls back cleanly when customSrc is null, malformed, or from an unconfigured host", () => {
		expect(
			resolveEntityCardImage({
				customSrc: "not-a-valid-path",
				text: "ریاضی صنف دوازدهم",
				kind: "course",
			})
		).toBe(CARD_IMAGES.math);

		expect(
			resolveEntityCardImage({
				customSrc: "https://placehold.co/600x400",
				text: "فزیک صنف دوازدهم",
				kind: "course",
			})
		).toBe(CARD_IMAGES.physics);
	});

	it("matches Dari, Pashto, and English subject names to topic photography", () => {
		expect(resolveEntityCardImage({ text: "فزیک میخانیک" })).toBe(
			CARD_IMAGES.physics
		);
		expect(resolveEntityCardImage({ text: "کیمیای عضوی" })).toBe(
			CARD_IMAGES.chemistry
		);
		expect(resolveEntityCardImage({ text: "بیولوژي حجروي" })).toBe(
			CARD_IMAGES.biology
		);
		expect(resolveEntityCardImage({ text: "تاریخ معاصر" })).toBe(
			CARD_IMAGES.humanities
		);
		expect(resolveEntityCardImage({ text: "ادبیات دری و پشتو" })).toBe(
			CARD_IMAGES.languages
		);
		expect(resolveEntityCardImage({ text: "React & Next.js Front-end" })).toBe(
			CARD_IMAGES.frontend
		);
		expect(resolveEntityCardImage({ text: "Node.js & PostgreSQL" })).toBe(
			CARD_IMAGES.backend
		);
		expect(resolveEntityCardImage({ text: "Python & C++ Coding" })).toBe(
			CARD_IMAGES.programming
		);
		expect(resolveEntityCardImage({ text: "اکسل پیشرفته و گرافیک" })).toBe(
			CARD_IMAGES.technicalSkills
		);
		expect(resolveEntityCardImage({ text: "مهارت‌های زندگی و فن بیان" })).toBe(
			CARD_IMAGES.lifeSkills
		);
	});

	it("returns category-appropriate defaults for decks, textbooks, general books, quizzes, live classes, and partners", () => {
		expect(resolveEntityCardImage({ kind: "liveClass" })).toBe(
			CARD_IMAGES.liveClassroom
		);
		expect(resolveEntityCardImage({ kind: "deck" })).toBe(
			CARD_IMAGES.flashcards
		);
		expect(resolveEntityCardImage({ kind: "schoolBook" })).toBe(
			CARD_IMAGES.schoolBooks
		);
		expect(resolveEntityCardImage({ kind: "generalBook" })).toBe(
			CARD_IMAGES.generalLibrary
		);
		expect(resolveEntityCardImage({ kind: "quiz" })).toBe(
			CARD_IMAGES.kankorExam
		);
		expect(resolveEntityCardImage({ kind: "university" })).toBe(
			CARD_IMAGES.university
		);
		expect(resolveEntityCardImage({ kind: "school" })).toBe(CARD_IMAGES.school);
	});
});

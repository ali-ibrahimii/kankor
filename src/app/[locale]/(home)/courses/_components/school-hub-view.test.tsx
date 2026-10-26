import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import faMessages from "@/messages/fa.json";

import { getSchoolHubData } from "./school-hub-data";
import { SchoolHubView } from "./school-hub-view";

vi.mock("@/i18n/navigation", () => ({
	Link: ({ href, children }: { href: string; children: ReactNode }) => (
		<a href={href}>{children}</a>
	),
}));

describe("SchoolHubView (/courses)", () => {
	it("renders featured course cards, all course tracks, and every roadmap without live classes", async () => {
		const data = await getSchoolHubData("fa");
		const { container } = render(
			<NextIntlClientProvider locale="fa" messages={faMessages}>
				<SchoolHubView data={data} />
			</NextIntlClientProvider>
		);

		expect(container.querySelectorAll("h1")).toHaveLength(1);
		expect(screen.getByText("دوره برگزیده")).toBeInTheDocument();
		expect(container).not.toHaveTextContent(/کلاس زنده|کلاس‌های زنده|صنف زنده/);

		for (const title of [
			/ریاضی برای کانکور/,
			/فزیک، کیمیا و بیولوژی/,
			/دری، پشتو و انگلیسی/,
			/تاریخ، جغرافیه، اقتصاد و اسلامیات/,
			/مهارت تست‌زنی و آزمون آزمایشی/,
			/برنامهٔ کامل صنف یازدهم و دوازدهم/,
		]) {
			expect(
				screen.getByRole("heading", { level: 2, name: title })
			).toBeInTheDocument();
		}

		const roadmapButtons = screen.getAllByRole("button", {
			name: "مشاهده دوره‌های این مسیر",
		});
		expect(roadmapButtons).toHaveLength(6);
	});

	it("shows the selected roadmap courses in the configured order", async () => {
		const data = await getSchoolHubData("fa");
		const { container } = render(
			<NextIntlClientProvider locale="fa" messages={faMessages}>
				<SchoolHubView data={data} />
			</NextIntlClientProvider>
		);

		fireEvent.click(
			screen.getAllByRole("button", { name: "مشاهده دوره‌های این مسیر" })[0]
		);

		const selectedPath = data.learningPaths[0];
		const sequence = container.querySelector("#path-course-sequence");
		expect(sequence).toBeInTheDocument();
		expect(sequence).toHaveTextContent(selectedPath.title);

		const expectedTitles = selectedPath.courseIds.map((courseId) => {
			const course = data.courses.find((item) => item.id === courseId);
			expect(course).toBeDefined();
			return course?.title;
		});
		const renderedTitles = Array.from(
			sequence?.querySelectorAll("li h3") ?? []
		).map((heading) => heading.textContent?.trim());

		expect(renderedTitles).toEqual(expectedTitles);
	});

	it("filters the course catalogue by search query", async () => {
		const data = await getSchoolHubData("fa");
		render(
			<NextIntlClientProvider locale="fa" messages={faMessages}>
				<SchoolHubView data={data} />
			</NextIntlClientProvider>
		);

		const searchInput = screen.getByPlaceholderText(/جستجوی مضمون/);
		fireEvent.change(searchInput, { target: { value: "جنتیک" } });
		expect(screen.getAllByText(/بیولوژی: حجره و جنتیک/).length).toBeGreaterThan(
			0
		);
	});

	it("builds every course and path from the messages content namespace", async () => {
		const data = await getSchoolHubData("fa");

		expect(data.courses).toHaveLength(21);
		expect(data.learningPaths).toHaveLength(6);
		for (const course of data.courses) {
			expect(course.title).not.toBe("");
			expect(course.subtitle).not.toBe("");
			expect(course.instructorName).not.toBe("");
		}
		for (const path of data.learningPaths) {
			expect(path.courseIds).toHaveLength(path.coursesCount);
			for (const courseId of path.courseIds) {
				expect(data.courses.some((course) => course.id === courseId)).toBe(
					true
				);
			}
		}
	});
});

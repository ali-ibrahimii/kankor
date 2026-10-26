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
			/برنامه‌نویسی فرانت‌اند/,
			/برنامه‌نویسی بک‌اند/,
			/زبان‌های برنامه‌نویسی/,
			/مهارت‌های فنی، دیجیتال و درآمدزا/,
			/مهارت‌های زندگی/,
			/دروس مکتب و آمادگی امتحان کانکور/,
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

		const searchInput = screen.getByPlaceholderText(/جستجوی دوره/);
		fireEvent.change(searchInput, { target: { value: "PostgreSQL" } });
		expect(
			screen.getByText(/طراحی دیتابیس رابطه‌ای، SQL پیشرفته و PostgreSQL/)
		).toBeInTheDocument();
	});
});

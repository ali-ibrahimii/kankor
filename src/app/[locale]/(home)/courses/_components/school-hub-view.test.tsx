import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";

import faMessages from "@/messages/fa.json";

import { getSchoolHubData } from "./school-hub-data";
import { SchoolHubView } from "./school-hub-view";

describe("SchoolHubView (/courses)", () => {
	it("renders a single unified h1 hero, photo live class cards for universities/schools/teachers, and all 6 learning tracks", async () => {
		const data = await getSchoolHubData("fa");

		const { container } = render(
			<NextIntlClientProvider locale="fa" messages={faMessages}>
				<SchoolHubView data={data} />
			</NextIntlClientProvider>
		);

		// Exactly ONE h1 hero (no duplicate double-hero bug)
		const h1s = container.querySelectorAll("h1");
		expect(h1s.length).toBe(1);

		// Live classes section with University, School, and Independent Teacher hosts
		expect(
			screen.getByRole("heading", {
				name: /کلاس‌های لایو آنلاین — توسط دانشگاه‌ها، مکاتب و معلمان/,
			})
		).toBeInTheDocument();
		expect(screen.getAllByText("دانشگاه").length).toBeGreaterThan(0);
		expect(screen.getAllByText("مکتب").length).toBeGreaterThan(0);
		expect(screen.getAllByText("معلم").length).toBeGreaterThan(0);

		// All 6 requested course sections render cleanly
		expect(
			screen.getByRole("heading", {
				level: 2,
				name: /برنامه‌نویسی فرانت‌اند/,
			})
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { level: 2, name: /برنامه‌نویسی بک‌اند/ })
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { level: 2, name: /زبان‌های برنامه‌نویسی/ })
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", {
				level: 2,
				name: /مهارت‌های فنی، دیجیتال و درآمدزا/,
			})
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { level: 2, name: /مهارت‌های زندگی/ })
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", {
				level: 2,
				name: /دروس مکتب و آمادگی امتحان کانکور/,
			})
		).toBeInTheDocument();
	});

	it("filters live classes by host type and filters courses by search query", async () => {
		const data = await getSchoolHubData("fa");

		render(
			<NextIntlClientProvider locale="fa" messages={faMessages}>
				<SchoolHubView data={data} />
			</NextIntlClientProvider>
		);

		// Filter live classes to Independent Teachers only
		fireEvent.click(screen.getByRole("button", { name: "معلمان مستقل" }));
		expect(
			screen.getByText(/کلاس زنده فن بیان، مکالمه انگلیسی/)
		).toBeInTheDocument();

		// Search narrows across all tracks immediately
		const searchInput = screen.getByPlaceholderText(/جستجوی دوره، کلاس زنده/);
		fireEvent.change(searchInput, { target: { value: "PostgreSQL" } });
		expect(
			screen.getByText(/طراحی دیتابیس رابطه‌ای، SQL پیشرفته و PostgreSQL/)
		).toBeInTheDocument();
	});
});

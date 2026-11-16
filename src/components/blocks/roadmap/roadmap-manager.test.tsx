import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import en from "@/messages/en.json";

import type { RoadmapWithItems } from "./actions";
import { RoadmapManager } from "./roadmap-manager";

const mockCreateRoadmap = vi.hoisted(() => vi.fn());
const mockUpdateRoadmap = vi.hoisted(() => vi.fn());
const mockDeleteRoadmap = vi.hoisted(() => vi.fn());
const mockSetRoadmapItems = vi.hoisted(() => vi.fn());
const mockSearchCourses = vi.hoisted(() => vi.fn());
const mockRefresh = vi.hoisted(() => vi.fn());
const mockToastSuccess = vi.hoisted(() => vi.fn());
const mockToastError = vi.hoisted(() => vi.fn());

vi.mock("./actions", () => ({
	createRoadmap: mockCreateRoadmap,
	updateRoadmap: mockUpdateRoadmap,
	deleteRoadmap: mockDeleteRoadmap,
	setRoadmapItems: mockSetRoadmapItems,
	searchCoursesForRoadmap: mockSearchCourses,
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock("sonner", () => ({
	toast: { success: mockToastSuccess, error: mockToastError },
}));

const ROADMAP: RoadmapWithItems = {
	id: "r1",
	slug: "my-path",
	title: "My Learning Path",
	description: "A path",
	cover_image_url: null,
	accent: "violet",
	created_by: "user-1",
	school_id: null,
	is_published: false,
	created_at: "2026-01-01T00:00:00Z",
	updated_at: "2026-01-01T00:00:00Z",
	roadmap_items: [
		{
			id: "i1",
			roadmap_id: "r1",
			course_id: "c1",
			order_index: 0,
			note: null,
			created_at: "2026-01-01T00:00:00Z",
			course: { title: "Algebra", slug: "algebra" },
		},
	],
};

function renderManager(roadmaps: RoadmapWithItems[]) {
	return render(
		<NextIntlClientProvider locale="en" messages={en}>
			<RoadmapManager roadmaps={roadmaps} />
		</NextIntlClientProvider>
	);
}

describe("RoadmapManager", () => {
	beforeEach(() => {
		mockCreateRoadmap.mockReset();
		mockUpdateRoadmap.mockReset();
		mockDeleteRoadmap.mockReset();
		mockSetRoadmapItems.mockReset();
		mockSearchCourses.mockReset();
		mockRefresh.mockReset();
		mockToastSuccess.mockReset();
		mockToastError.mockReset();
		mockCreateRoadmap.mockResolvedValue({
			success: true,
			data: { id: "r-new" },
		});
		mockUpdateRoadmap.mockResolvedValue({ success: true, data: {} });
		mockSetRoadmapItems.mockResolvedValue({ success: true, data: [] });
		mockSearchCourses.mockResolvedValue({ success: true, data: [] });
	});

	it("shows the empty state when there are no roadmaps", () => {
		renderManager([]);
		expect(
			screen.getByText(
				"You have not created a roadmap yet. Create your first one."
			)
		).toBeInTheDocument();
	});

	it("renders roadmap cards with course counts and a draft badge", () => {
		renderManager([ROADMAP]);
		expect(screen.getByText("My Learning Path")).toBeInTheDocument();
		expect(screen.getByText("1 courses")).toBeInTheDocument();
		expect(screen.getByText("Draft")).toBeInTheDocument();
	});

	it("creates a roadmap from the dialog", async () => {
		renderManager([]);
		fireEvent.click(screen.getByRole("button", { name: "New roadmap" }));
		fireEvent.change(screen.getByLabelText("Title"), {
			target: { value: "Fresh Path" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Create" }));

		await waitFor(() =>
			expect(mockCreateRoadmap).toHaveBeenCalledWith({
				title: "Fresh Path",
				description: undefined,
			})
		);
		expect(mockToastSuccess).toHaveBeenCalledWith("Roadmap created");
		expect(mockRefresh).toHaveBeenCalled();
	});

	it("publishes a draft roadmap", async () => {
		renderManager([ROADMAP]);
		fireEvent.click(screen.getByRole("button", { name: "Publish" }));
		await waitFor(() =>
			expect(mockUpdateRoadmap).toHaveBeenCalledWith("r1", {
				is_published: true,
			})
		);
	});

	it("saves the reordered course list", async () => {
		renderManager([ROADMAP]);
		fireEvent.click(screen.getByRole("button", { name: "Manage courses" }));
		fireEvent.click(screen.getByRole("button", { name: "Save course list" }));

		await waitFor(() =>
			expect(mockSetRoadmapItems).toHaveBeenCalledWith("r1", ["c1"])
		);
		expect(mockToastSuccess).toHaveBeenCalledWith("Course list saved");
	});

	it("reports failures with a localized toast, not the raw error", async () => {
		const consoleSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => undefined);
		mockUpdateRoadmap.mockResolvedValue({
			success: false,
			error: "relation roadmaps does not exist",
		});
		renderManager([ROADMAP]);

		fireEvent.click(screen.getByRole("button", { name: "Publish" }));
		await waitFor(() =>
			expect(mockToastError).toHaveBeenCalledWith(
				"Something went wrong. Please try again."
			)
		);
		expect(mockToastError).not.toHaveBeenCalledWith(
			"relation roadmaps does not exist"
		);
		consoleSpy.mockRestore();
	});
});

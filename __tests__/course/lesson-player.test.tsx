import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import type { ContentBlock } from "@/components/blocks/course/content-player";
import { ContentPlayer } from "@/components/blocks/course/content-player";
import { LessonSidebar } from "@/components/blocks/course/lesson-sidebar";
import faMessages from "@/messages/fa.json";
import type { ModuleItem } from "@/types/queries.types";

// The signed-URL helper is a server action; these tests never request an asset.
vi.mock("@/lib/r2/actions", () => ({
	getAssetSignedUrl: vi.fn(async () => ({
		success: true as const,
		data: { url: "https://example.com/asset.mp4" },
	})),
}));

const lesson = (
	id: string,
	title: string,
	order: number,
	completed = false
) => ({
	id,
	title,
	content_type: "video" as const,
	order_index: order,
	estimated_duration_minutes: 12,
	is_previewable: false,
	lesson_progress: completed
		? ({
				is_completed: true,
			} as never)
		: null,
});

const modules: ModuleItem[] = [
	{
		id: "m1",
		title: "__DEFAULT__",
		description: null,
		order_index: 0,
		lessons: [
			lesson("l1", "جلسه ۱", 0, true),
			lesson("l2", "جلسه ۲", 1),
			lesson("l3", "جلسه ۳", 2),
		],
	},
	{
		id: "m2",
		title: "بخش کانکور",
		description: null,
		order_index: 1,
		lessons: [lesson("l4", "جلسه ۴", 0)],
	},
] as ModuleItem[];

function withIntl(ui: React.ReactNode) {
	return (
		<NextIntlClientProvider locale="fa" messages={faMessages}>
			{ui}
		</NextIntlClientProvider>
	);
}

describe("lesson player", () => {
	it("shows a friendly empty state instead of an empty media area", () => {
		const onNextLesson = vi.fn();
		render(
			withIntl(
				<ContentPlayer
					lessonTitle="جلسه ۲"
					moduleTitle="بخش کانکور"
					lessonNumber={2}
					totalLessons={4}
					contentBlocks={[]}
					isCompleted={false}
					onMarkComplete={vi.fn()}
					onNextLesson={onNextLesson}
					nextLessonTitle="جلسه ۳"
				/>
			)
		);

		expect(
			screen.getByText("برای این درس هنوز محتوایی منتشر نشده")
		).toBeInTheDocument();
		expect(screen.getByText("درس 2 از 4")).toBeInTheDocument();
		expect(screen.getByText("بخش کانکور")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: /رفتن به درس بعدی/ }));
		expect(onNextLesson).toHaveBeenCalledTimes(1);
	});

	it("offers complete-and-next as the primary action while unfinished", () => {
		const onMarkComplete = vi.fn();
		render(
			withIntl(
				<ContentPlayer
					lessonTitle="جلسه ۲"
					lessonNumber={2}
					totalLessons={4}
					contentBlocks={[]}
					isCompleted={false}
					onMarkComplete={onMarkComplete}
					onNextLesson={vi.fn()}
					onPrevLesson={vi.fn()}
					prevLessonTitle="جلسه ۱"
					nextLessonTitle="جلسه ۳"
				/>
			)
		);

		fireEvent.click(screen.getByRole("button", { name: /تکمیل و درس بعدی/ }));
		expect(onMarkComplete).toHaveBeenCalledTimes(1);
		expect(screen.getByText("جلسه ۱")).toBeInTheDocument();
		expect(screen.getByText("جلسه ۳")).toBeInTheDocument();
	});

	it("switches the primary action to next lesson once completed", () => {
		const onNextLesson = vi.fn();
		render(
			withIntl(
				<ContentPlayer
					lessonTitle="جلسه ۲"
					lessonNumber={2}
					totalLessons={4}
					contentBlocks={[]}
					isCompleted
					onMarkComplete={vi.fn()}
					onNextLesson={onNextLesson}
					nextLessonTitle="جلسه ۳"
				/>
			)
		);

		expect(screen.getAllByText("تکمیل شده").length).toBeGreaterThan(0);
		// The step forward becomes the primary action once the lesson is done.
		fireEvent.click(screen.getByRole("button", { name: /^درس بعدی/ }));
		expect(onNextLesson).toHaveBeenCalled();
	});

	it("renders text blocks inside a readable card", () => {
		const blocks: ContentBlock[] = [
			{
				id: "b1",
				block_type: "text",
				order_index: 0,
				text_content: "# عنوان درس\n\nمتن نمونه برای آزمون.",
			},
		];

		render(
			withIntl(
				<ContentPlayer
					lessonTitle="جلسه ۲"
					lessonNumber={2}
					totalLessons={4}
					contentBlocks={blocks}
					isCompleted={false}
					onMarkComplete={vi.fn()}
				/>
			)
		);

		expect(
			screen.queryByText("برای این درس هنوز محتوایی منتشر نشده")
		).not.toBeInTheDocument();
	});

	it("explains a block type the player cannot render instead of leaving it blank", () => {
		const blocks: ContentBlock[] = [
			{
				id: "b1",
				block_type: "slide_presentation",
				order_index: 0,
				external_resource_url: "https://example.com/slides",
			},
		];

		render(
			withIntl(
				<ContentPlayer
					lessonTitle="جلسه ۲"
					lessonNumber={2}
					totalLessons={4}
					contentBlocks={blocks}
					isCompleted={false}
					onMarkComplete={vi.fn()}
				/>
			)
		);

		expect(screen.getByText("اسلاید")).toBeInTheDocument();
		expect(
			screen.getByText(/این بخش از درس در این نسخه قابل نمایش نیست/)
		).toBeInTheDocument();
		expect(screen.getByRole("link", { name: /باز کردن/ })).toHaveAttribute(
			"href",
			"https://example.com/slides"
		);
	});

	it("marks the active lesson and replaces the __DEFAULT__ module name", () => {
		const onLessonSelect = vi.fn();
		render(
			withIntl(
				<LessonSidebar
					courseTitle="دری (صنف دوازدهم)"
					modules={modules}
					activeLessonId="l2"
					totalProgress={25}
					onLessonSelect={onLessonSelect}
					isOpen={false}
					onClose={vi.fn()}
				/>
			)
		);

		expect(screen.getByText("دروس کورس")).toBeInTheDocument();
		expect(screen.getByText("بخش کانکور")).toBeInTheDocument();
		expect(screen.getByText("1 از 4 درس")).toBeInTheDocument();
		expect(screen.getByText("25%")).toBeInTheDocument();

		const active = screen.getByRole("button", { current: "step" });
		expect(active).toHaveTextContent("جلسه ۲");

		fireEvent.click(screen.getByText("جلسه ۳"));
		expect(onLessonSelect).toHaveBeenCalledWith("l3");
	});
});

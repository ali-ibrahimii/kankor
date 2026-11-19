import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MDXView } from "@/components/widgets/markdown-view";

describe("MDXView", () => {
	it("renders markdown content without whitespace-pre-line double spacing", async () => {
		const { container } = render(
			<MDXView markdown={"پاراگراف اول\n\nپاراگراف دوم"} />
		);
		await waitFor(() => expect(container.querySelector("p")).toBeTruthy());
		// The old `whitespace-pre-line` class rendered the newlines between
		// block elements as visible blank lines (the big empty gaps bug).
		expect(container.firstChild).not.toHaveClass("whitespace-pre-line");
		expect(container.querySelectorAll("p")).toHaveLength(2);
	});

	it("shows a non-text placeholder skeleton while rendering", () => {
		const { container } = render(<MDXView markdown="# عنوان" />);
		expect(container.querySelector("[aria-hidden='true']")).toBeTruthy();
		// No hardcoded English placeholder text.
		expect(screen.queryByText(/rendering/i)).toBeNull();
	});

	it("copies plain project-structure text and highlighted HTML code cleanly", async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(navigator, "clipboard", {
			value: { writeText },
			configurable: true,
		});

		const md = [
			"```text",
			"html-course/",
			"└── index.html",
			"```",
			"",
			"```html",
			'<h1 class="title">سلام دنیا</h1>',
			"```",
		].join("\n");

		const { container } = render(<MDXView markdown={md} />);
		await waitFor(() =>
			expect(container.querySelectorAll(".code-block")).toHaveLength(2)
		);

		const copyTextBtn = screen.getByRole("button", { name: "Copy text" });
		fireEvent.click(copyTextBtn);
		await waitFor(() =>
			expect(writeText).toHaveBeenCalledWith("html-course/\n└── index.html")
		);
		await waitFor(() =>
			expect(copyTextBtn).toHaveAttribute("data-copied", "true")
		);

		const copyCodeBtn = screen.getByRole("button", { name: "Copy code" });
		fireEvent.click(copyCodeBtn);
		await waitFor(() =>
			expect(writeText).toHaveBeenCalledWith('<h1 class="title">سلام دنیا</h1>')
		);
	});
});

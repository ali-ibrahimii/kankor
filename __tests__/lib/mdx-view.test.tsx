import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

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
});

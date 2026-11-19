import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import faMessages from "@/messages/fa.json";

import { LexicalEditor } from "./lexical-editor";

function renderEditor(props: {
	content?: string;
	onChange?: (markdown: string) => void;
}) {
	return render(
		<NextIntlClientProvider locale="fa" messages={faMessages}>
			<LexicalEditor
				content={props.content}
				onChange={props.onChange}
				placeholder="اینجا بنویسید"
			/>
		</NextIntlClientProvider>
	);
}

describe("LexicalEditor (tabbed markdown editor)", () => {
	it("renders the three markdown tabs (write / preview / source)", () => {
		renderEditor({ content: "## عنوان" });

		expect(screen.getByRole("tab", { name: "نوشتن" })).toBeInTheDocument();
		expect(screen.getByRole("tab", { name: "پیش‌نمایش" })).toBeInTheDocument();
		expect(screen.getByRole("tab", { name: "کد" })).toBeInTheDocument();
	});

	it("shows a full markdown toolbar with localized tooltips", () => {
		renderEditor({ content: "" });

		for (const label of [
			"برگشت",
			"بازانجام",
			"متن عادی",
			"عنوان ۱",
			"عنوان ۲",
			"عنوان ۳",
			"نقل‌قول",
			"بلاک کد",
			"کادر متن / ساختار پروژه",
			"فهرست نقطه‌ای",
			"فهرست شماره‌دار",
			"فهرست چک‌باکس",
			"پررنگ",
			"ایتالیک",
			"زیرخط‌دار",
			"خط‌خورده",
			"کد درون‌خطی",
			"پیوند",
			"تصویر",
			"جدول",
			"افزودن ردیف جدول",
			"خط افقی",
			"نکته مهم",
			"پاک‌سازی متن",
		]) {
			expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
		}
	});

	it("continues the table by adding a row after the selected row", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		const { container } = renderEditor({ content: "", onChange });

		const editable = container.querySelector('[contenteditable="true"]');
		expect(editable).not.toBeNull();
		await user.click(editable as HTMLElement);
		await user.click(screen.getByRole("button", { name: "جدول" }));
		await waitFor(() =>
			expect(container.querySelectorAll("table tr")).toHaveLength(3)
		);

		const lastCell = container.querySelector(
			"table tr:last-child td:last-child"
		);
		expect(lastCell).not.toBeNull();
		await user.click(lastCell as HTMLElement);
		const addRowButton = screen.getByRole("button", {
			name: "افزودن ردیف جدول",
		});
		await user.click(addRowButton);
		await user.click(addRowButton);

		await waitFor(() =>
			expect(container.querySelectorAll("table tr")).toHaveLength(5)
		);
		await waitFor(() => {
			const markdown = onChange.mock.calls.at(-1)?.[0] as string | undefined;
			expect(markdown?.match(/^\|.*\|$/gm)).toHaveLength(6);
		});
	});

	it("edits raw markdown in the source tab and reports changes", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderEditor({ content: "## عنوان", onChange });

		await user.click(screen.getByRole("tab", { name: "کد" }));

		const area = await screen.findByPlaceholderText(
			/مارک‌داون را اینجا بنویسید/
		);
		expect(area).toHaveValue("## عنوان");

		await user.clear(area);
		await user.type(area, "متن تازه");
		expect(onChange).toHaveBeenLastCalledWith("متن تازه");
	});

	it("lets authors toggle code vs text type, pick language with live syntax tokens, insert project trees, and copy", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		const writeText = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(navigator, "clipboard", {
			value: { writeText },
			configurable: true,
		});

		const { container } = renderEditor({
			content: "```text\nhtml-course/\n└── index.html\n```",
			onChange,
		});

		// Header renders with Text/Code kind toggle, tree helpers, and Copy button.
		const copyBtn = await screen.findByRole("button", { name: "کپی" });
		await user.click(copyBtn);
		expect(writeText).toHaveBeenCalledWith("html-course/\n└── index.html");

		// Switch block type from Text -> Code and pick JavaScript.
		await user.click(screen.getByRole("button", { name: "کد" }));
		const langSelect = await screen.findByRole("combobox", {
			name: "زبان کد",
		});
		await user.selectOptions(langSelect, "javascript");
		await waitFor(() =>
			expect(onChange).toHaveBeenLastCalledWith(
				"```javascript\nhtml-course/\n└── index.html\n```"
			)
		);

		// Switch back to Text and confirm tree helper restores ```text fence.
		await user.click(screen.getByRole("button", { name: "متن" }));
		await waitFor(() =>
			expect(onChange).toHaveBeenLastCalledWith(
				"```text\nhtml-course/\n└── index.html\n```"
			)
		);
		expect(container.querySelector(".editor-code .token")).toBeNull();
	});

	it("renders live syntax-highlight token spans for code blocks and inserts project trees on empty text blocks", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		const { container } = renderEditor({
			content: "```javascript\nconst total = 42;\n```",
			onChange,
		});

		await waitFor(() =>
			expect(
				container.querySelector(".editor-code .token.keyword")
			).toHaveTextContent("const")
		);
		expect(
			container.querySelector(".editor-code .token.number")
		).toHaveTextContent("42");

		// Switch to an empty text block via Source, return to Write, click Project Tree.
		await user.click(screen.getByRole("tab", { name: "کد" }));
		const area = await screen.findByPlaceholderText(
			/مارک‌داون را اینجا بنویسید/
		);
		await user.clear(area);
		await user.type(area, "```text\n```");
		await user.click(screen.getByRole("tab", { name: "نوشتن" }));

		const treeBtn = await screen.findByTitle("درج نمونه ساختار پوشه و فایل");
		await user.click(treeBtn);
		await waitFor(() =>
			expect(onChange).toHaveBeenLastCalledWith(
				expect.stringContaining("├── index.html")
			)
		);
	});
});

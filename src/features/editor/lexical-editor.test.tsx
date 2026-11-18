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
			"خط افقی",
			"نکته مهم",
			"پاک‌سازی متن",
		]) {
			expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
		}
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
});

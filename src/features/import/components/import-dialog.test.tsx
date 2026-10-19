import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";
import type {
	ImportableRow,
	ImportBatchOutcome,
	ImportTarget,
} from "../services/import-target";
import type { ImportRunSummary } from "../types/validation.types";
import { ImportDialog } from "./import-dialog";

function renderWithIntl(ui: ReactElement) {
	return render(
		<NextIntlClientProvider locale="en" messages={en}>
			{ui}
		</NextIntlClientProvider>
	);
}

function csvFile(contents: string, name = "quizzes.csv") {
	return new File([contents], name, { type: "text/csv" });
}

function getFileInput() {
	// The dialog renders via a Radix portal, so it ends up outside RTL's
	// default render container — query the document instead.
	const input = document.body.querySelector('input[type="file"]');
	if (!input) throw new Error("Dropzone file input not found");
	return input as HTMLInputElement;
}

describe("ImportDialog", () => {
	it("walks a CSV through upload → mapping → preview → import", async () => {
		const insertBatch = vi.fn(
			async (
				_table: string,
				rows: ImportableRow[]
			): Promise<ImportBatchOutcome> => ({
				insertedCount: rows.length,
				errors: [],
			})
		);
		const stubTarget: ImportTarget = { insertBatch };
		const onComplete = vi.fn<(summary: ImportRunSummary) => void>();

		renderWithIntl(
			<ImportDialog
				table="quizzes"
				open
				onOpenChange={() => {}}
				onComplete={onComplete}
				importTarget={stubTarget}
			/>
		);

		// Step 1: upload — the exact-name column matcher should auto-map "title".
		fireEvent.change(getFileInput(), {
			target: { files: [csvFile("title\nMy Quiz\n")] },
		});

		const continueButton = await screen.findByRole("button", {
			name: /continue/i,
		});
		expect(continueButton).toBeEnabled();
		fireEvent.click(continueButton);

		// Step 2 (preview): the mapped value should show up in the table.
		expect(await screen.findByText("My Quiz")).toBeInTheDocument();

		const importButton = screen.getByRole("button", { name: /import 1 row/i });
		fireEvent.click(importButton);

		await waitFor(() => expect(insertBatch).toHaveBeenCalledTimes(1));
		expect(insertBatch).toHaveBeenCalledWith(
			"quizzes",
			expect.arrayContaining([
				expect.objectContaining({ values: { title: "My Quiz" } }),
			])
		);

		await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
		expect(onComplete).toHaveBeenCalledWith(
			expect.objectContaining({ insertedCount: 1, errors: [] })
		);
		expect(await screen.findByText(/1 row imported/i)).toBeInTheDocument();
	});

	it("blocks continuing past mapping when a required column has no source or default", async () => {
		const stubTarget: ImportTarget = {
			insertBatch: vi.fn(async () => ({ insertedCount: 0, errors: [] })),
		};

		renderWithIntl(
			<ImportDialog
				table="quizzes"
				open
				onOpenChange={() => {}}
				importTarget={stubTarget}
			/>
		);

		fireEvent.change(getFileInput(), {
			target: { files: [csvFile("description\nSome text\n")] },
		});

		const continueButton = await screen.findByRole("button", {
			name: /continue/i,
		});
		expect(continueButton).toBeDisabled();
		expect(
			screen.getByText(/required fields need a source or default value/i)
		).toBeInTheDocument();
	});
});

import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import { ProvinceForm } from "../../src/components/blocks/provinces/province-form";
import en from "../../src/messages/en.json";

function renderWithProviders(ui: React.ReactElement) {
	return render(
		<NextIntlClientProvider locale="en" messages={en}>
			{ui}
		</NextIntlClientProvider>
	);
}

describe("ProvinceForm", () => {
	it("renders name field and save button", () => {
		renderWithProviders(<ProvinceForm onSubmit={async () => {}} />);
		expect(screen.getByLabelText(/province name/i)).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
	});
});

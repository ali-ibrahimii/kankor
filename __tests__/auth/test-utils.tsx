import { type RenderOptions, render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
import en from "../../src/messages/en.json";

function IntlWrapper({ children }: { children: React.ReactNode }) {
	return (
		<NextIntlClientProvider locale="en" messages={en}>
			{children}
		</NextIntlClientProvider>
	);
}

export function renderWithIntl(
	ui: ReactElement,
	options?: Omit<RenderOptions, "wrapper">
) {
	return render(ui, { wrapper: IntlWrapper, ...options });
}

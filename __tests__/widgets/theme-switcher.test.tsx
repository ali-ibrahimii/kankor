import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { ThemeSwitcher } from "@/components/widgets/theme-switcher";
import { ThemeProvider } from "@/providers/theme.provider";
import { THEME_STORAGE_KEY } from "@/providers/theme-script";

function renderSwitcher() {
	return render(
		<ThemeProvider defaultTheme="light">
			<ThemeSwitcher label="Toggle theme" />
		</ThemeProvider>
	);
}

describe("ThemeProvider + ThemeSwitcher", () => {
	beforeEach(() => {
		localStorage.clear();
		document.documentElement.classList.remove("light", "dark");
	});

	it("starts on the default theme and exposes a toggle", async () => {
		renderSwitcher();

		const trigger = screen.getByRole("button", { name: "Toggle theme" });
		expect(trigger).toBeInTheDocument();

		await waitFor(() => {
			expect(document.documentElement.classList.contains("light")).toBe(true);
		});
	});

	it("switches to dark, persists the choice and applies the class", async () => {
		renderSwitcher();

		fireEvent.click(screen.getByRole("button", { name: "Toggle theme" }));

		await waitFor(() => {
			expect(document.documentElement.classList.contains("dark")).toBe(true);
		});
		expect(document.documentElement.classList.contains("light")).toBe(false);
		expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
	});

	it("adopts a previously stored theme on mount", async () => {
		localStorage.setItem(THEME_STORAGE_KEY, "dark");
		renderSwitcher();

		await waitFor(() => {
			expect(document.documentElement.classList.contains("dark")).toBe(true);
		});
	});
});

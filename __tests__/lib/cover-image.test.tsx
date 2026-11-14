import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CoverFillImage } from "@/components/blocks/course/cover-image";

afterEach(() => {
	cleanup();
	vi.unstubAllEnvs();
});

describe("CoverFillImage", () => {
	it("renders a plain img for hosts outside the next/image allowlist", () => {
		vi.stubEnv("NEXT_PUBLIC_R2_PUBLIC_HOSTNAME", "storage.abzarkankor.com");
		render(
			<CoverFillImage
				src="https://foreign-host.example.com/courses/c1/cover/x.jpg"
				alt="Html"
				sizes="300px"
				className="object-cover"
			/>
		);
		const img = screen.getByAltText("Html");
		expect(img.tagName).toBe("IMG");
		// next/image wraps/annotates its images; a plain <img> keeps the raw src.
		expect(img).toHaveAttribute(
			"src",
			"https://foreign-host.example.com/courses/c1/cover/x.jpg"
		);
	});

	it("renders through next/image for the configured R2 host", () => {
		vi.stubEnv("NEXT_PUBLIC_R2_PUBLIC_HOSTNAME", "storage.abzarkankor.com");
		render(
			<CoverFillImage
				src="https://storage.abzarkankor.com/courses/c1/cover/x.jpg"
				alt="Html"
				sizes="300px"
			/>
		);
		const img = screen.getByAltText("Html");
		expect(img.tagName).toBe("IMG");
		// next/image marks optimized images with a srcset of the loader.
		expect(
			img.getAttribute("srcset") ?? img.getAttribute("srcSet")
		).toBeTruthy();
	});
});

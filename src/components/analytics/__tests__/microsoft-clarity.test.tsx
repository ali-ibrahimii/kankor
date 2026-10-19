import clarity from "@microsoft/clarity";
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MicrosoftClarity } from "../microsoft-clarity";

vi.mock("@microsoft/clarity", () => ({
	default: {
		init: vi.fn(),
	},
}));

describe("MicrosoftClarity Component", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("initializes clarity when projectId is provided", () => {
		render(<MicrosoftClarity projectId="test-project-123" />);
		expect(clarity.init).toHaveBeenCalledTimes(1);
		expect(clarity.init).toHaveBeenCalledWith("test-project-123");
	});

	it("does not initialize clarity when projectId is empty string", () => {
		render(<MicrosoftClarity projectId="" />);
		expect(clarity.init).not.toHaveBeenCalled();
	});
});

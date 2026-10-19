// @vitest-environment node
// Pure math — the jsdom environment only slows the fuzz test down.

import { describe, expect, it } from "vitest";
import { buildGuillocheLayers } from "./guilloche";

// Mirrors the values the template uses.
const OPTS = { cx: 420.945, cy: 285, baseRadius: 150 };

describe("buildGuillocheLayers", () => {
	it("is deterministic: the same code always yields identical paths", () => {
		const a = buildGuillocheLayers("AB12CD34EF56GH78", OPTS);
		const b = buildGuillocheLayers("AB12CD34EF56GH78", OPTS);
		expect(a).toEqual(b);
	});

	it("gives every certificate a unique pattern", () => {
		const a = buildGuillocheLayers("AB12CD34EF56GH78", OPTS);
		const b = buildGuillocheLayers("ZZ99YY88XX77WW66", OPTS);
		expect(a.map((l) => l.d)).not.toEqual(b.map((l) => l.d));
	});

	it("produces closed, well-formed SVG paths", () => {
		const layers = buildGuillocheLayers("AB12CD34EF56GH78", OPTS);
		expect(layers).toHaveLength(4);
		for (const { d } of layers) {
			expect(d.startsWith("M")).toBe(true);
			expect(d.endsWith("Z")).toBe(true);
			// One turn at the default resolution.
			expect(d.match(/L/g)?.length).toBe(360);
		}
	});

	it("keeps the pattern inside the frame area for any seed", () => {
		// Fuzz across many synthetic verification codes — the pattern must
		// never escape the inner gold frame regardless of the drawn seed.
		for (let i = 0; i < 50; i++) {
			const layers = buildGuillocheLayers(`SEED-${i}-${i * 7919}`, OPTS);
			const coords = layers
				.flatMap((l) => l.d.replace(/[MZ]/g, "").split("L"))
				.map((pair) => pair.split(" ").map(Number));
			for (const [x, y] of coords) {
				// Inner gold frame sits at inset 26 on an 841.89×595.28 page.
				expect(x).toBeGreaterThan(26);
				expect(x).toBeLessThan(841.89 - 26);
				expect(y).toBeGreaterThan(26);
				expect(y).toBeLessThan(595.28 - 26);
			}
		}
	});
});

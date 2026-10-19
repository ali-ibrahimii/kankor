/**
 * Guilloché pattern generator — banknote-style interwoven curves whose
 * geometry is derived deterministically from the certificate's verification
 * code.
 *
 * Why: a PDF can always be copied byte-for-byte, so authenticity ultimately
 * rests on the /verify/[code] lookup. What this adds is *counterfeit
 * resistance*: every certificate carries a mathematically unique background
 * pattern that (a) is visually hard to redraw convincingly, and (b) can be
 * regenerated from the code at any time — a doctored certificate whose
 * pattern doesn't match its own verification code exposes itself.
 *
 * The curves are harmonic roses: r(t) = R + A₁·sin(f₁t + φ₁) + A₂·sin(f₂t + φ₂).
 * Integer frequencies guarantee the path closes seamlessly after one turn.
 */

// ─── Deterministic seeding ──────────────────────────────────────────────────

/** FNV-1a 32-bit — tiny, stable string hash (not cryptographic; not needed). */
function fnv1a(input: string): number {
	let hash = 0x811c9dc5;
	for (let i = 0; i < input.length; i++) {
		hash ^= input.charCodeAt(i);
		hash = Math.imul(hash, 0x01000193);
	}
	return hash >>> 0;
}

/** Mulberry32 — small deterministic PRNG over a 32-bit seed. */
function mulberry32(seed: number): () => number {
	let state = seed;
	return () => {
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

// ─── Pattern generation ─────────────────────────────────────────────────────

export interface GuillocheLayer {
	/** Closed SVG path (`M … Z`) ready for a react-pdf `<Path d>` prop. */
	d: string;
}

export interface GuillocheOptions {
	/** Pattern centre, in page points. */
	cx: number;
	cy: number;
	/** Mean radius of the innermost curve. */
	baseRadius: number;
	/** Number of interwoven curves. */
	layers?: number;
	/** Sample points per curve — 360 keeps paths smooth yet small. */
	steps?: number;
}

/**
 * Builds the rosette's curve layers for a given seed (the verification
 * code). Same seed in → byte-identical paths out, forever.
 */
export function buildGuillocheLayers(
	seed: string,
	{ cx, cy, baseRadius, layers = 4, steps = 360 }: GuillocheOptions
): GuillocheLayer[] {
	const rand = mulberry32(fnv1a(seed));
	const result: GuillocheLayer[] = [];

	for (let layer = 0; layer < layers; layer++) {
		// Integer frequencies → the curve closes exactly after 2π.
		const f1 = 4 + Math.floor(rand() * 6); // 4..9 petals
		const f2 = 2 + Math.floor(rand() * 5); // 2..6 modulation
		const a1 = 16 + rand() * 18;
		const a2 = 6 + rand() * 12;
		const p1 = rand() * Math.PI * 2;
		const p2 = rand() * Math.PI * 2;
		const radius = baseRadius + layer * 14 + rand() * 8;

		let d = "";
		for (let s = 0; s <= steps; s++) {
			const t = (s / steps) * Math.PI * 2;
			const r =
				radius + a1 * Math.sin(f1 * t + p1) + a2 * Math.sin(f2 * t + p2);
			const x = cx + r * Math.cos(t);
			const y = cy + r * Math.sin(t);
			d += `${s === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
		}
		d += "Z";
		result.push({ d });
	}

	return result;
}

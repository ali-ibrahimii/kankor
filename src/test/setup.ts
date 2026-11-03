import "@testing-library/jest-dom";

// Dummy values: unit tests never reach the network. A real project ref used to
// live here, which needlessly published the production project reference.
process.env.NEXT_PUBLIC_SUPABASE_URL ||= "https://test-project.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= "test-anon-key";

// Radix UI (dialog, select, scroll-area) uses ResizeObserver, which jsdom does
// not implement. Without this stub any component test rendering a Radix
// primitive fails with "ResizeObserver is not defined".
if (typeof globalThis.ResizeObserver === "undefined") {
	globalThis.ResizeObserver = class ResizeObserver {
		observe() {}
		unobserve() {}
		disconnect() {}
	} as unknown as typeof globalThis.ResizeObserver;
}

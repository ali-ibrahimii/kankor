import Prism from "prismjs";

// Prevent Prism from auto-highlighting DOM elements on DOMContentLoaded;
// we tokenize explicitly for both Markdown rendering and the Lexical editor.
Prism.manual = true;

if (typeof globalThis !== "undefined") {
	(globalThis as Record<string, unknown>).Prism = Prism;
}

export { Prism };

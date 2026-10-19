import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "Abzar Kankor",
		short_name: "Abzar Kankor",
		description:
			"An offline-first educational mobile application for students in Afghanistan, providing comprehensive learning tools including video courses, spaced repetition flashcards, mock exams, and a digital library.",
		start_url: "/",
		scope: "/",
		id: "/",
		display: "standalone",
		orientation: "portrait",
		background_color: "#030712",
		theme_color: "#2563eb",
		categories: ["education", "learning", "productivity"],
		icons: [
			{
				src: "/favicon-96x96.png",
				sizes: "96x96",
				type: "image/png",
				purpose: "any",
			},
			{
				src: "/web-app-manifest-192x192.png",
				sizes: "192x192",
				type: "image/png",
				purpose: "maskable",
			},
			{
				src: "/web-app-manifest-512x512.png",
				sizes: "512x512",
				type: "image/png",
				purpose: "maskable",
			},
			{
				src: "/apple-touch-icon.png",
				sizes: "180x180",
				type: "image/png",
				purpose: "any",
			},
		],
	};
}

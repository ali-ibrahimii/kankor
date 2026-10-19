import type { YouTubePlayerConfig } from "./types";
import { YouTubePlayerComponent } from "./youtube-player";

export async function generateMetadata() {
	return {
		robots: {
			index: false,
			follow: false,
		},
	};
}

export default async function YoutubeVideo({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams: Promise<Record<string, string>>;
}) {
	const { id } = await params;
	const query = await searchParams;

	// Build player configuration from query parameters
	const playerConfig: YouTubePlayerConfig = {
		videoId: id,
		end: query.end ? Number(query.end) : undefined,
		list: query.list,
		color: query.color === "white" ? "white" : "red",
		start: query.start ? Number(query.start) : undefined,
		rel: query.rel === "1",
		loop: query.loop === "1",
		listType: query.listType,
		playerLang: query.playerLang,
		playlist: query.playlist,
		controls: query.controls !== "0",
		ccLangPref: query.cc_lang_pref,
		contentScale: query.contentScale ? Number(query.contentScale) : 1.0,
		allowWebViewZoom: query.allowWebViewZoom === "true",
		modestbranding: query.modestbranding !== "0",
		ivLoadPolicy: query.iv_load_policy
			? Number(query.iv_load_policy)
			: undefined,
		preventFullScreen: query.preventFullScreen === "1",
		showClosedCaptions: query.showClosedCaptions === "1",
	};

	return (
		<main style={{ margin: 0, padding: 0, width: "100%", height: "100vh" }}>
			<YouTubePlayerComponent config={playerConfig} />
		</main>
	);
}

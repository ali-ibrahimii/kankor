// TypeScript type definitions for YouTube IFrame Player API

export interface YouTubePlayerConfig {
	videoId: string;
	end?: number;
	list?: string;
	color?: "red" | "white";
	start?: number;
	rel?: boolean;
	loop?: boolean;
	listType?: string;
	playerLang?: string;
	playlist?: string;
	controls?: boolean;
	ccLangPref?: string;
	contentScale?: number;
	allowWebViewZoom?: boolean;
	modestbranding?: boolean;
	ivLoadPolicy?: number;
	preventFullScreen?: boolean;
	showClosedCaptions?: boolean;
}

export interface YouTubePlayerVars {
	end?: number;
	rel?: 0 | 1;
	list?: string;
	color?: "red" | "white";
	loop?: 0 | 1;
	start?: number;
	playsinline?: 0 | 1;
	hl?: string;
	playlist?: string;
	listType?: string;
	controls?: 0 | 1;
	fs?: 0 | 1;
	cc_lang_pref?: string;
	iv_load_policy?: number;
	modestbranding?: 0 | 1;
	cc_load_policy?: 0 | 1;
}

export interface YouTubePlayer {
	playVideo: () => void;
	pauseVideo: () => void;
	mute: () => void;
	unMute: () => void;
	setVolume: (volume: number) => void;
	setPlaybackRate: (rate: number) => void;
	getPlayerState: () => number;
	getCurrentTime: () => number;
	getDuration: () => number;
}

export interface YouTubePlayerEvent {
	data: number;
	target: YouTubePlayer;
}

export interface PlayerMessage {
	eventType:
		| "playerReady"
		| "playerStateChange"
		| "playerError"
		| "playbackRateChange"
		| "playerQualityChange"
		| "fullScreenChange"
		| "playerProgress";
	data?: number | string | boolean | { currentTime: number; duration: number };
}

export interface ControlMessage {
	eventName:
		| "playVideo"
		| "pauseVideo"
		| "muteVideo"
		| "unMuteVideo"
		| "setVolume"
		| "setPlaybackRate";
	meta?: {
		volume?: number;
		playbackRate?: number;
	};
}

// YouTube Player States
export enum PlayerState {
	UNSTARTED = -1,
	ENDED = 0,
	PLAYING = 1,
	PAUSED = 2,
	BUFFERING = 3,
	CUED = 5,
}

// Global YouTube API types
declare global {
	interface Window {
		YT: {
			Player: new (
				elementId: string,
				config: {
					width?: string | number;
					height?: string | number;
					videoId: string;
					playerVars?: YouTubePlayerVars;
					events?: {
						onReady?: (event: YouTubePlayerEvent) => void;
						onStateChange?: (event: YouTubePlayerEvent) => void;
						onError?: (event: YouTubePlayerEvent) => void;
						onPlaybackRateChange?: (event: YouTubePlayerEvent) => void;
						onPlaybackQualityChange?: (event: YouTubePlayerEvent) => void;
					};
				}
			) => YouTubePlayer;
			PlayerState: typeof PlayerState;
		};
		onYouTubeIframeAPIReady?: () => void;
		ReactNativeWebView?: {
			postMessage: (message: string) => void;
		};
	}
}

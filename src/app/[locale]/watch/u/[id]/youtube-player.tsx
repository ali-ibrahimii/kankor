"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef } from "react";
import type {
	ControlMessage,
	PlayerMessage,
	YouTubePlayer,
	YouTubePlayerConfig,
	YouTubePlayerEvent,
} from "./types";
import styles from "./youtube-player.module.css";

interface YouTubePlayerComponentProps {
	config: YouTubePlayerConfig;
}

export function YouTubePlayerComponent({
	config,
}: YouTubePlayerComponentProps) {
	const playerRef = useRef<YouTubePlayer | null>(null);
	const playerContainerRef = useRef<HTMLDivElement>(null);
	const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
		null
	);

	// Send messages to React Native WebView
	const sendMessageToRN = useCallback((message: PlayerMessage) => {
		if (typeof window !== "undefined" && window.ReactNativeWebView) {
			window.ReactNativeWebView.postMessage(JSON.stringify(message));
		}
	}, []);

	const stopProgressPolling = useCallback(() => {
		if (progressIntervalRef.current) {
			clearInterval(progressIntervalRef.current);
			progressIntervalRef.current = null;
		}
	}, []);

	const startProgressPolling = useCallback(() => {
		if (progressIntervalRef.current) return;
		progressIntervalRef.current = setInterval(() => {
			if (
				playerRef.current &&
				typeof playerRef.current.getCurrentTime === "function" &&
				typeof playerRef.current.getDuration === "function"
			) {
				try {
					const currentTime = playerRef.current.getCurrentTime();
					const duration = playerRef.current.getDuration();
					sendMessageToRN({
						eventType: "playerProgress",
						data: { currentTime, duration },
					});
				} catch (err) {
					console.error("Error reading player progress:", err);
				}
			}
		}, 1000);
	}, [sendMessageToRN]);

	useEffect(() => {
		return () => {
			if (progressIntervalRef.current) {
				clearInterval(progressIntervalRef.current);
			}
		};
	}, []);

	// Event handlers
	const handlePlayerReady = useCallback(() => {
		sendMessageToRN({ eventType: "playerReady" });
	}, [sendMessageToRN]);

	const handlePlayerStateChange = useCallback(
		(event: YouTubePlayerEvent) => {
			sendMessageToRN({
				eventType: "playerStateChange",
				data: event.data,
			});
			if (event.data === 1) {
				startProgressPolling();
			} else {
				stopProgressPolling();
			}
		},
		[sendMessageToRN, startProgressPolling, stopProgressPolling]
	);

	const handlePlayerError = useCallback(
		(event: YouTubePlayerEvent) => {
			sendMessageToRN({
				eventType: "playerError",
				data: event.data,
			});
		},
		[sendMessageToRN]
	);

	const handlePlaybackRateChange = useCallback(
		(event: YouTubePlayerEvent) => {
			sendMessageToRN({
				eventType: "playbackRateChange",
				data: event.data,
			});
		},
		[sendMessageToRN]
	);

	const handlePlaybackQualityChange = useCallback(
		(event: YouTubePlayerEvent) => {
			sendMessageToRN({
				eventType: "playerQualityChange",
				data: event.data,
			});
		},
		[sendMessageToRN]
	);

	// Handle fullscreen changes
	const handleFullScreenChange = useCallback(() => {
		const doc = document as Document & {
			msFullscreenElement?: Element;
			mozFullScreenElement?: Element;
			webkitFullscreenElement?: Element;
		};

		const isFullScreen = Boolean(
			document.fullscreenElement ||
				doc.msFullscreenElement ||
				doc.mozFullScreenElement ||
				doc.webkitFullscreenElement
		);

		sendMessageToRN({
			eventType: "fullScreenChange",
			data: isFullScreen,
		});
	}, [sendMessageToRN]);

	// Handle control messages from WebView
	const handleControlMessage = useCallback((event: MessageEvent) => {
		if (!playerRef.current) return;

		try {
			const message: ControlMessage = JSON.parse(event.data);

			switch (message.eventName) {
				case "playVideo":
					playerRef.current.playVideo();
					break;
				case "pauseVideo":
					playerRef.current.pauseVideo();
					break;
				case "muteVideo":
					playerRef.current.mute();
					break;
				case "unMuteVideo":
					playerRef.current.unMute();
					break;
				case "setVolume":
					if (message.meta?.volume !== undefined) {
						playerRef.current.setVolume(message.meta.volume);
					}
					break;
				case "setPlaybackRate":
					if (message.meta?.playbackRate !== undefined) {
						playerRef.current.setPlaybackRate(message.meta.playbackRate);
					}
					break;
			}
		} catch (error) {
			console.error("Error parsing control message:", error);
		}
	}, []);

	// Initialize player when YouTube API is ready
	const initializePlayer = useCallback(() => {
		if (!playerContainerRef.current) {
			return;
		}

		// Check if YT and YT.Player are available
		if (!window.YT || !window.YT.Player) {
			return;
		}

		// Generate unique player ID
		const playerId = `player-${Date.now()}`;
		playerContainerRef.current.id = playerId;

		// Create player instance
		playerRef.current = new window.YT.Player(playerId, {
			width: "100%",
			height: "100%",
			videoId: config.videoId,
			playerVars: {
				end: config.end,
				rel: config.rel ? 1 : 0,
				list: config.list,
				color: config.color,
				loop: config.loop ? 1 : 0,
				start: config.start,
				playsinline: 1,
				hl: config.playerLang,
				playlist: config.playlist,
				listType: config.listType,
				controls: config.controls === false ? 0 : 1,
				fs: config.preventFullScreen ? 0 : 1,
				cc_lang_pref: config.ccLangPref,
				iv_load_policy: config.ivLoadPolicy,
				modestbranding: config.modestbranding === false ? 0 : 1,
				cc_load_policy: config.showClosedCaptions ? 1 : 0,
			},
			events: {
				onReady: handlePlayerReady,
				onStateChange: handlePlayerStateChange,
				onError: handlePlayerError,
				onPlaybackRateChange: handlePlaybackRateChange,
				onPlaybackQualityChange: handlePlaybackQualityChange,
			},
		});
	}, [
		config,
		handlePlayerReady,
		handlePlayerStateChange,
		handlePlayerError,
		handlePlaybackRateChange,
		handlePlaybackQualityChange,
	]);

	// Setup YouTube API ready callback
	useEffect(() => {
		// Set the global callback for YouTube API
		window.onYouTubeIframeAPIReady = () => {
			initializePlayer();
		};

		// If API is already loaded, initialize immediately
		if (window.YT?.Player) {
			initializePlayer();
		}

		return () => {
			// Clean up the global callback
			window.onYouTubeIframeAPIReady = undefined;
		};
	}, [initializePlayer]);

	// Setup effect
	useEffect(() => {
		// Set viewport meta tag for WebView scaling
		if (config.contentScale || config.allowWebViewZoom !== undefined) {
			const viewport = document.querySelector("meta[name=viewport]");
			if (viewport) {
				let metaString = "width=device-width, ";
				if (config.contentScale) {
					metaString += `initial-scale=${config.contentScale}, `;
				}
				if (!config.allowWebViewZoom && config.contentScale) {
					metaString += `maximum-scale=${config.contentScale}`;
				}
				viewport.setAttribute("content", metaString);
			}
		}

		// Add fullscreen event listeners
		document.addEventListener("fullscreenchange", handleFullScreenChange);
		document.addEventListener("msfullscreenchange", handleFullScreenChange);
		document.addEventListener("mozfullscreenchange", handleFullScreenChange);
		document.addEventListener("webkitfullscreenchange", handleFullScreenChange);

		// Add message listener for control messages
		window.addEventListener("message", handleControlMessage);

		// Cleanup
		return () => {
			document.removeEventListener("fullscreenchange", handleFullScreenChange);
			document.removeEventListener(
				"msfullscreenchange",
				handleFullScreenChange
			);
			document.removeEventListener(
				"mozfullscreenchange",
				handleFullScreenChange
			);
			document.removeEventListener(
				"webkitfullscreenchange",
				handleFullScreenChange
			);
			window.removeEventListener("message", handleControlMessage);
		};
	}, [
		config.contentScale,
		config.allowWebViewZoom,
		handleControlMessage,
		handleFullScreenChange,
	]);

	return (
		<>
			<Script
				src="https://www.youtube.com/iframe_api"
				strategy="afterInteractive"
			/>
			<div className={styles.container}>
				<div ref={playerContainerRef} className={styles.player} />
			</div>
		</>
	);
}

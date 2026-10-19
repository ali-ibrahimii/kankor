# YouTube IFrame Player Integration

This page (`src/app/watch/u/[id]/page.tsx`) provides a custom YouTube player that can be embedded in a React Native WebView. It uses the YouTube IFrame API to provide full control over video playback.

## Usage in React Native

### Basic Example

```tsx
import { WebView } from 'react-native-webview';

function VideoPlayer({ videoId }: { videoId: string }) {
  const handleMessage = (event: any) => {
    const message = JSON.parse(event.nativeEvent.data);
    console.log('Player event:', message);
    
    switch (message.eventType) {
      case 'playerReady':
        console.log('Player is ready');
        break;
      case 'playerStateChange':
        console.log('Player state changed:', message.data);
        // 0 = ended, 1 = playing, 2 = paused, 3 = buffering
        break;
      case 'playerError':
        console.error('Player error:', message.data);
        break;
    }
  };

  const webViewRef = React.useRef<WebView>(null);

  return (
    <WebView
      ref={webViewRef}
      source={{ 
        uri: `https://yourdomain.com/watch/u/${videoId}` 
      }}
      onMessage={handleMessage}
      allowsFullscreenVideo={true}
      allowsInlineMediaPlayback={true}
      mediaPlaybackRequiresUserAction={false}
    />
  );
}
```

## Query Parameters

You can customize the player behavior using query parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `start` | number | - | Start time in seconds |
| `end` | number | - | End time in seconds |
| `rel` | '0' \| '1' | '0' | Show related videos (0 = only from same channel) |
| `loop` | '0' \| '1' | '0' | Loop the video |
| `controls` | '0' \| '1' | '1' | Show player controls |
| `modestbranding` | '0' \| '1' | '1' | Hide YouTube logo |
| `color` | 'red' \| 'white' | - | Progress bar color |
| `playerLang` | string | - | Player language (e.g., 'en', 'es') |
| `preventFullScreen` | '0' \| '1' | '0' | Prevent fullscreen |
| `showClosedCaptions` | '0' \| '1' | '0' | Show closed captions |
| `contentScale` | string | '1.0' | WebView content scale |
| `allowWebViewZoom` | 'true' \| 'false' | - | Allow pinch to zoom |

### Example with Parameters

```tsx
const videoUrl = `https://yourdomain.com/watch/u/${videoId}?start=30&loop=1&controls=1`;
```

## Controlling the Player

Send messages to the WebView to control playback:

```tsx
// Play video
webViewRef.current?.postMessage(JSON.stringify({
  eventName: 'playVideo'
}));

// Pause video
webViewRef.current?.postMessage(JSON.stringify({
  eventName: 'pauseVideo'
}));

// Mute/Unmute
webViewRef.current?.postMessage(JSON.stringify({
  eventName: 'muteVideo'
}));

webViewRef.current?.postMessage(JSON.stringify({
  eventName: 'unMuteVideo'
}));

// Set volume (0-100)
webViewRef.current?.postMessage(JSON.stringify({
  eventName: 'setVolume',
  meta: { volume: 50 }
}));

// Set playback rate (0.25, 0.5, 1, 1.5, 2)
webViewRef.current?.postMessage(JSON.stringify({
  eventName: 'setPlaybackRate',
  meta: { playbackRate: 1.5 }
}));
```

## Events Received from Player

The player sends the following events via `postMessage`:

### playerReady
Fired when the player is ready to receive commands.

```json
{
  "eventType": "playerReady"
}
```

### playerStateChange
Fired when the player state changes.

```json
{
  "eventType": "playerStateChange",
  "data": 1  // 0=ended, 1=playing, 2=paused, 3=buffering, 5=cued
}
```

### playerError
Fired when an error occurs.

```json
{
  "eventType": "playerError",
  "data": 150  // Error code
}
```

### playbackRateChange
Fired when playback rate changes.

```json
{
  "eventType": "playbackRateChange",
  "data": 1.5  // Playback rate
}
```

### playerQualityChange
Fired when video quality changes.

```json
{
  "eventType": "playerQualityChange",
  "data": "hd720"  // Quality level
}
```

### fullScreenChange
Fired when fullscreen mode changes.

```json
{
  "eventType": "fullScreenChange",
  "data": true  // true = fullscreen, false = normal
}
```

## Complete React Native Component Example

```tsx
import React, { useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';

export function YouTubePlayer({ videoId }: { videoId: string }) {
  const webViewRef = useRef<WebView>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const handleMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      if (message.eventType === 'playerStateChange') {
        // 1 = playing, 2 = paused
        setIsPlaying(message.data === 1);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  };

  const togglePlayPause = () => {
    webViewRef.current?.postMessage(
      JSON.stringify({
        eventName: isPlaying ? 'pauseVideo' : 'playVideo'
      })
    );
  };

  const toggleMute = () => {
    webViewRef.current?.postMessage(
      JSON.stringify({
        eventName: isMuted ? 'unMuteVideo' : 'muteVideo'
      })
    );
    setIsMuted(!isMuted);
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ 
          uri: `https://yourdomain.com/watch/u/${videoId}?controls=1` 
        }}
        onMessage={handleMessage}
        allowsFullscreenVideo={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        style={styles.webview}
      />
      
      <View style={styles.controls}>
        <TouchableOpacity onPress={togglePlayPause}>
          <Text>{isPlaying ? 'Pause' : 'Play'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={toggleMute}>
          <Text>{isMuted ? 'Unmute' : 'Mute'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#fff',
  },
});
```

## Notes

- The lint warning about `dangerouslySetInnerHTML` is expected and safe in this context, as we're embedding the official YouTube IFrame API.
- Make sure to replace `https://yourdomain.com` with your actual domain where this Next.js app is hosted.
- The player requires an internet connection to load the YouTube IFrame API.

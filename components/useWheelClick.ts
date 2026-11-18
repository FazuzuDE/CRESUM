import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';

/** Short opt-in UI feedback; no playback queue or React updates during scrolling. */
export function useWheelClick(enabled: boolean) {
  const playerRef = useRef<AudioPlayer | null>(null);
  const ready = useRef(false);
  const seeking = useRef(false);
  const generation = useRef(0);
  const lastClick = useRef(-Infinity);
  useEffect(() => {
    if (!enabled) return;
    let player: AudioPlayer;
    try {
      player = createAudioPlayer(require('../assets/audio/language-tick.wav'), {
        keepAudioSessionActive: true,
      });
      player.volume = 0.18;
    } catch {
      return;
    }
    playerRef.current = player;
    ready.current = false;
    seeking.current = false;
    lastClick.current = -Infinity;
    const current = ++generation.current;
    void setAudioModeAsync({
      playsInSilentMode: false,
      interruptionMode: 'mixWithOthers',
      allowsRecording: false,
      shouldPlayInBackground: false,
    })
      .then(() => {
        if (generation.current === current) ready.current = true;
      })
      .catch(() => {});
    return () => {
      generation.current = current + 1;
      ready.current = false;
      seeking.current = false;
      playerRef.current = null;
      try {
        player.remove();
      } catch {
        /* Feedback cannot block dismissal. */
      }
    };
  }, [enabled]);
  return useCallback(() => {
    const player = playerRef.current;
    const now = Date.now();
    if (
      !enabled ||
      !ready.current ||
      !player?.isLoaded ||
      seeking.current ||
      AppState.currentState !== 'active' ||
      now - lastClick.current < 50
    )
      return;
    lastClick.current = now;
    seeking.current = true;
    const current = generation.current;
    // Drop fast/interrupted ticks rather than accumulate delayed clicks.
    void (async () => {
      try {
        await player.seekTo(0);
        if (
          generation.current === current &&
          AppState.currentState === 'active'
        )
          player.play();
      } catch {
        // Feedback failure must not affect selection or scrolling.
      } finally {
        if (generation.current === current) seeking.current = false;
      }
    })();
  }, [enabled]);
}

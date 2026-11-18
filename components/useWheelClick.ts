import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';

type Voice = { player: AudioPlayer; atStart: boolean };

/** Short opt-in UI feedback; no playback queue or React updates during scrolling. */
export function useWheelClick(enabled: boolean) {
  const voices = useRef<Voice[]>([]);
  const ready = useRef(false);
  const lastClick = useRef(-Infinity);
  useEffect(() => {
    if (!enabled) return;
    let mounted = true;
    const dispose: (() => void)[] = [];
    ready.current = false;
    lastClick.current = -Infinity;

    // Rewind a player after its click ends. A second player can start immediately
    // while the first rewinds, so scrolling never waits for an asynchronous seek.
    for (let index = 0; index < 2; index++) {
      try {
        const player = createAudioPlayer(
          require('../assets/audio/language-tick.wav'),
          {
            keepAudioSessionActive: true,
          },
        );
        dispose.push(() => player.remove());
        player.volume = 0.18;
        const voice = { player, atStart: true };
        const subscription = player.addListener(
          'playbackStatusUpdate',
          (status) => {
            if (!mounted || !status.didJustFinish) return;
            void player
              .seekTo(0)
              .then(() => {
                if (mounted) voice.atStart = true;
              })
              .catch(() => {});
          },
        );
        dispose.push(() => subscription.remove());
        voices.current.push(voice);
      } catch {
        // Audio is optional even if a player cannot be initialized.
      }
    }
    if (voices.current.length) {
      void setAudioModeAsync({
        playsInSilentMode: false,
        interruptionMode: 'mixWithOthers',
        allowsRecording: false,
        shouldPlayInBackground: false,
      })
        .then(() => {
          if (mounted) ready.current = true;
        })
        .catch(() => {});
    }

    return () => {
      mounted = false;
      ready.current = false;
      voices.current = [];
      for (const release of dispose.reverse()) {
        try {
          release();
        } catch {
          // Feedback cannot block dismissal.
        }
      }
    };
  }, [enabled]);

  return useCallback(() => {
    const now = Date.now();
    if (
      !enabled ||
      !ready.current ||
      AppState.currentState !== 'active' ||
      now - lastClick.current < 50
    )
      return;

    try {
      const voice = voices.current.find(
        ({ player, atStart }) => atStart && player.isLoaded,
      );
      if (!voice) return;
      lastClick.current = now;
      voice.player.play();
      voice.atStart = false;
    } catch {
      // Feedback failure must not affect selection or scrolling.
    }
  }, [enabled]);
}

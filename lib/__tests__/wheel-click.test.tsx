import { useEffect } from 'react';
import { AppState } from 'react-native';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { useWheelClick } from '../../components/useWheelClick';
const { act, create } = jest.requireActual('react-test-renderer');

function mockCreateVoice() {
  let listener: ((status: { didJustFinish: boolean }) => void) | undefined;
  const removeListener = jest.fn();
  return {
    isLoaded: true,
    volume: 1,
    seekTo: jest.fn(async () => {}),
    play: jest.fn(),
    remove: jest.fn(),
    removeListener,
    addListener: jest.fn(
      (_event, callback: (status: { didJustFinish: boolean }) => void) => {
        listener = callback;
        return { remove: removeListener };
      },
    ),
    finish: () => listener?.({ didJustFinish: true }),
  };
}
let mockVoices: ReturnType<typeof mockCreateVoice>[];
jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => {
    const voice = mockCreateVoice();
    mockVoices.push(voice);
    return voice;
  }),
  setAudioModeAsync: jest.fn(async () => {}),
}));
let click: () => void;
function Harness({ enabled = true }: { enabled?: boolean }) {
  const tick = useWheelClick(enabled);
  useEffect(() => {
    click = tick;
  }, [tick]);
  return null;
}
const originalState = AppState.currentState;
beforeEach(() => {
  jest.clearAllMocks();
  mockVoices = [];
  AppState.currentState = 'active';
});
afterEach(() => {
  AppState.currentState = originalState;
  jest.restoreAllMocks();
});

it('plays prepared clicks immediately and drops requests during cooldown or while both players are busy', async () => {
  const now = jest.spyOn(Date, 'now').mockReturnValue(0);
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(<Harness />);
  });
  const [first, second] = mockVoices;
  expect(createAudioPlayer).toHaveBeenCalledTimes(2);
  expect(setAudioModeAsync).toHaveBeenCalledWith(
    expect.objectContaining({
      playsInSilentMode: false,
      interruptionMode: 'mixWithOthers',
      shouldPlayInBackground: false,
    }),
  );
  expect(first.volume).toBe(0.18);
  expect(first.play).not.toHaveBeenCalled();
  act(() => click());
  expect(first.play).toHaveBeenCalledTimes(1);
  expect(first.seekTo).not.toHaveBeenCalled();

  now.mockReturnValue(20);
  act(() => click());
  expect(second.play).not.toHaveBeenCalled();
  let finishSeek!: () => void;
  first.seekTo.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finishSeek = resolve;
      }),
  );
  act(() => first.finish());
  expect(first.seekTo).toHaveBeenCalledWith(0);

  now.mockReturnValue(50);
  act(() => click());
  expect(second.play).toHaveBeenCalledTimes(1);
  now.mockReturnValue(100);
  act(() => click());
  await act(async () => finishSeek());
  expect(first.play).toHaveBeenCalledTimes(1);
  expect(second.play).toHaveBeenCalledTimes(1);
  act(() => click());
  expect(first.play).toHaveBeenCalledTimes(2);

  act(() => view.unmount());
  for (const voice of mockVoices) {
    expect(voice.remove).toHaveBeenCalledTimes(1);
    expect(voice.removeListener).toHaveBeenCalledTimes(1);
  }
});

it('skips unloaded, background and disabled audio and isolates playback failures', async () => {
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(<Harness enabled={false} />);
  });
  expect(createAudioPlayer).not.toHaveBeenCalled();
  await act(async () => view.update(<Harness />));
  const [first, second] = mockVoices;
  first.isLoaded = second.isLoaded = false;
  act(() => click());
  first.isLoaded = second.isLoaded = true;
  AppState.currentState = 'background';
  act(() => click());
  expect(first.play).not.toHaveBeenCalled();
  expect(second.play).not.toHaveBeenCalled();
  AppState.currentState = 'active';
  first.play.mockImplementationOnce(() => {
    throw new Error('Feedback unavailable');
  });
  expect(() => act(() => click())).not.toThrow();
  act(() => view.unmount());
  act(() => first.finish());
  expect(first.seekTo).not.toHaveBeenCalled();
});

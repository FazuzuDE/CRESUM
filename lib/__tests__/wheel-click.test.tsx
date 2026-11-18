import { useEffect } from 'react';
import { AppState } from 'react-native';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { useWheelClick } from '../../components/useWheelClick';
const { act, create } = jest.requireActual('react-test-renderer');
const mockPlayer = {
  isLoaded: true,
  volume: 1,
  seekTo: jest.fn(async () => {}),
  play: jest.fn(),
  remove: jest.fn(),
};
jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => mockPlayer),
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
  mockPlayer.isLoaded = true;
  mockPlayer.seekTo.mockImplementation(async () => {});
  AppState.currentState = 'active';
});
afterEach(() => {
  AppState.currentState = originalState;
  jest.restoreAllMocks();
});

it('configures quiet mixed playback respecting silent mode, without a mount click or a rapid-click queue', async () => {
  const now = jest.spyOn(Date, 'now').mockReturnValue(0);
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(<Harness />);
  });
  try {
    expect(createAudioPlayer).toHaveBeenCalledTimes(1);
    expect(setAudioModeAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        playsInSilentMode: false,
        interruptionMode: 'mixWithOthers',
        shouldPlayInBackground: false,
      }),
    );
    expect(mockPlayer.volume).toBe(0.18);
    expect(mockPlayer.play).not.toHaveBeenCalled();
    await act(async () => click());
    expect(mockPlayer.play).toHaveBeenCalledTimes(1);
    now.mockReturnValue(10);
    await act(async () => {
      click();
      click();
    });
    expect(mockPlayer.play).toHaveBeenCalledTimes(1);
    now.mockReturnValue(60);
    await act(async () => click());
    expect(mockPlayer.play).toHaveBeenCalledTimes(2);
  } finally {
    act(() => view.unmount());
  }
  expect(mockPlayer.remove).toHaveBeenCalledTimes(1);
});

it('drops pending clicks on dismissal instead of playing them after the dialog closes', async () => {
  let finishSeek!: () => void;
  mockPlayer.seekTo.mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        finishSeek = resolve;
      }),
  );
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(<Harness />);
  });
  act(() => {
    click();
    click();
  });
  expect(mockPlayer.seekTo).toHaveBeenCalledTimes(1);
  act(() => view.unmount());
  await act(async () => finishSeek());
  expect(mockPlayer.play).not.toHaveBeenCalled();
});

it('skips unloaded/background/disabled audio and isolates playback failures from selection', async () => {
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(<Harness enabled={false} />);
  });
  expect(createAudioPlayer).not.toHaveBeenCalled();
  await act(async () => click());
  await act(async () => view.update(<Harness />));
  mockPlayer.isLoaded = false;
  await act(async () => click());
  mockPlayer.isLoaded = true;
  AppState.currentState = 'background';
  await act(async () => click());
  expect(mockPlayer.seekTo).not.toHaveBeenCalled();
  AppState.currentState = 'active';
  mockPlayer.seekTo.mockRejectedValue(new Error('Feedback unavailable'));
  await act(async () => click());
  expect(mockPlayer.play).not.toHaveBeenCalled();
  act(() => view.unmount());
});

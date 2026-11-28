/* global jest */
// Expo's Jest preset supplies the legacy methods. Add the current native API
// mock while retaining the legacy methods used by existing gesture tests.
jest.mock(
  'react-native-gesture-handler/lib/module/RNGestureHandlerModule',
  () => {
    const legacy = jest.requireActual(
      'react-native-gesture-handler/lib/module/RNGestureHandlerModule',
    );
    const current = jest.requireActual(
      'react-native-gesture-handler/lib/module/mocks/module',
    );
    return {
      __esModule: true,
      default: { ...legacy.default, ...current.default },
    };
  },
);
// Renderer tests do not install native gesture recognizers. Swipe callbacks are
// exercised separately; physical gesture acceptance stays a device check.
jest.mock('react-native-gesture-handler', () => ({
  ...jest.requireActual('react-native-gesture-handler'),
  GestureDetector: jest.requireActual('react-native').View,
  GestureHandlerRootView: jest.requireActual('react-native').View,
}));
// Renderer tests run gesture worklets on the test thread.
jest.mock('react-native-worklets', () => ({
  ...jest.requireActual('react-native-worklets/lib/module/mock'),
  scheduleOnRN: (callback, ...args) => callback(...args),
}));
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: {
    View: jest.requireActual('react-native').View,
    createAnimatedComponent: (component) => component,
  },
  cancelAnimation: jest.fn(),
  makeMutable: (initial) => {
    let value = initial;
    return {
      get: () => value,
      set: (next) => {
        value = next;
      },
    };
  },
  setGestureState: jest.fn(),
  isSharedValue: (value) => value?._isReanimatedSharedValue === true,
  useComposedEventHandler: () => undefined,
  useAnimatedStyle: (createStyle) => createStyle(),
  useEvent: () => undefined,
  useHandler: () => undefined,
  useReducedMotion: () => false,
  useSharedValue: (initial) =>
    jest.requireActual('react').useMemo(() => {
      let value = initial;
      return {
        _isReanimatedSharedValue: true,
        get: () => value,
        set: (next) => {
          value = next;
        },
      };
    }, []),
  withTiming: jest.fn((value, _config, complete) => {
    complete?.(true);
    return value;
  }),
}));
// Native crypto is unavailable in Jest. Use Node's real secure UUID generator
// at this platform boundary instead of Expo's empty generated native mock.
jest.mock('expo-crypto', () => ({
  __esModule: true,
  ...jest.requireActual('expo-crypto'),
  randomUUID: () => jest.requireActual('node:crypto').randomUUID(),
}));

// Screen tests do not execute native pan gestures. The dedicated workout-list
// suite replaces this with a controllable Swipeable test double.
jest.mock('react-native-gesture-handler/ReanimatedSwipeable', () => ({
  __esModule: true,
  default: jest.requireActual('react-native').View,
}));

// Renderer tests exercise local persistence through the in-memory native mock.
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual(
    '@react-native-async-storage/async-storage/jest/async-storage-mock',
  ),
);

// Core screen tests never access device files; archive durability has dedicated port tests.
jest.mock('./lib/automatic-backup-files', () => ({
  supportsAutomaticBackups: false,
  automaticBackupFiles: { read: async () => null, write: async () => {} },
}));

// Unrelated Core screen tests never initialize network clients. Auth suites override this boundary.
jest.mock('./lib/supabase-auth', () => ({
  createSupabaseAuthRepository: jest.fn(() => null),
}));

// Renderer tests use inert platform feedback. Device playback requires iOS.
jest.mock('expo-audio', () => ({
  setAudioModeAsync: jest.fn(async () => {}),
  useAudioPlayer: jest.fn(() => ({ isLoaded: false, playing: false })),
}));

// Native visual effects are verified on a device, not by the renderer.
jest.mock('expo-glass-effect', () => ({
  GlassView: jest.requireActual('react-native').View,
  isGlassEffectAPIAvailable: () => false,
  isLiquidGlassAvailable: () => false,
}));

// Native slider gestures are exercised on-device. Screen tests call its callbacks.
jest.mock('@react-native-community/slider', () => ({
  __esModule: true,
  default: jest.requireActual('react-native').View,
}));

// Modal safe areas come from the presented native window on device.
jest.mock('./components/ScreenModal', () => ({
  ScreenModal: jest.requireActual('react-native').Modal,
}));

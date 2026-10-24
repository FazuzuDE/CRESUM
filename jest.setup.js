/* global jest */
// Renderer tests do not install native gesture recognizers. Swipe callbacks are
// exercised separately; physical gesture acceptance stays a device check.
jest.mock('react-native-gesture-handler', () => ({
  ...jest.requireActual('react-native-gesture-handler'),
  GestureHandlerRootView: jest.requireActual('react-native').View,
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

// Core screen tests never access device files; archive durability has dedicated port tests.
jest.mock('./lib/automatic-backup-files', () => ({
  supportsAutomaticBackups: false,
  automaticBackupFiles: { read: async () => null, write: async () => {} },
}));

// Unrelated Core screen tests never initialize network clients. Auth suites override this boundary.
jest.mock('./lib/supabase-auth', () => ({
  createSupabaseAuthRepository: jest.fn(() => null),
}));

/* global jest */
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

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
  },
}));

import { useSettingsStore } from '../settingsStore';

describe('settingsStore', () => {
  beforeEach(() => {
    useSettingsStore.setState({ soundEnabled: true });
  });

  test('defaults soundEnabled to true', () => {
    const state = useSettingsStore.getState();
    expect(state.soundEnabled).toBe(true);
  });

  test('setSoundEnabled updates sound setting', () => {
    useSettingsStore.getState().setSoundEnabled(false);
    expect(useSettingsStore.getState().soundEnabled).toBe(false);

    useSettingsStore.getState().setSoundEnabled(true);
    expect(useSettingsStore.getState().soundEnabled).toBe(true);
  });
});

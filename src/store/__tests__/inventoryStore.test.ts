jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
  },
}));

import { useInventoryStore } from '../inventoryStore';

describe('inventoryStore', () => {
  beforeEach(() => {
    useInventoryStore.setState({ items: [] });
  });

  test('addItem appends a new inventory entry', () => {
    useInventoryStore.getState().addItem('inside-tip');
    expect(useInventoryStore.getState().items).toEqual([{ itemId: 'inside-tip', quantity: 1 }]);
  });

  test('addItem increments quantity when the item already exists', () => {
    useInventoryStore.setState({ items: [{ itemId: 'inside-tip', quantity: 2 }] });
    useInventoryStore.getState().addItem('inside-tip', 3);
    expect(useInventoryStore.getState().items).toEqual([{ itemId: 'inside-tip', quantity: 5 }]);
  });

  test('addItem ignores non-positive quantities', () => {
    useInventoryStore.getState().addItem('inside-tip', 0);
    useInventoryStore.getState().addItem('inside-tip', -2);
    expect(useInventoryStore.getState().items).toEqual([]);
  });

  test('clearInventory removes all items', () => {
    useInventoryStore.setState({ items: [{ itemId: 'false-alarm', quantity: 1 }] });
    useInventoryStore.getState().clearInventory();
    expect(useInventoryStore.getState().items).toEqual([]);
  });
});

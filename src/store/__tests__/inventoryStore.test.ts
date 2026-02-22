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

  test('removeItem decrements quantity by 1', () => {
    useInventoryStore.setState({ items: [{ itemId: 'false-alarm', quantity: 3 }] });
    useInventoryStore.getState().removeItem('false-alarm');
    expect(useInventoryStore.getState().items).toEqual([{ itemId: 'false-alarm', quantity: 2 }]);
  });

  test('removeItem removes the entry when quantity reaches 0', () => {
    useInventoryStore.setState({ items: [{ itemId: 'false-alarm', quantity: 1 }] });
    useInventoryStore.getState().removeItem('false-alarm');
    expect(useInventoryStore.getState().items).toEqual([]);
  });

  test('removeItem does nothing for an unknown item', () => {
    useInventoryStore.setState({ items: [{ itemId: 'false-alarm', quantity: 1 }] });
    useInventoryStore.getState().removeItem('unknown-item');
    expect(useInventoryStore.getState().items).toEqual([{ itemId: 'false-alarm', quantity: 1 }]);
  });

  test('removeItem ignores non-positive quantity values', () => {
    useInventoryStore.setState({ items: [{ itemId: 'false-alarm', quantity: 2 }] });
    useInventoryStore.getState().removeItem('false-alarm', 0);
    useInventoryStore.getState().removeItem('false-alarm', -1);
    expect(useInventoryStore.getState().items).toEqual([{ itemId: 'false-alarm', quantity: 2 }]);
  });

  test('clearInventory removes all items', () => {
    useInventoryStore.setState({ items: [{ itemId: 'false-alarm', quantity: 1 }] });
    useInventoryStore.getState().clearInventory();
    expect(useInventoryStore.getState().items).toEqual([]);
  });
});

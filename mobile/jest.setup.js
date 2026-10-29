jest.mock('@expo/vector-icons', () => {
  const { Text } = require('react-native');
  return new Proxy(
    {},
    {
      get: () => {
        return function MockIcon({ name, ...props }) {
          return <Text {...props}>{name || 'icon'}</Text>;
        };
      },
    }
  );
});

jest.mock('@expo/vector-icons/Ionicons', () => {
  const { Text } = require('react-native');
  return function MockIonicons({ name, ...props }) {
    return <Text {...props}>{name || 'icon'}</Text>;
  };
});

jest.mock('@expo/vector-icons/Feather', () => {
  const { Text } = require('react-native');
  return function MockFeather({ name, ...props }) {
    return <Text {...props}>{name || 'icon'}</Text>;
  };
});

jest.mock('@expo/vector-icons/MaterialIcons', () => {
  const { Text } = require('react-native');
  return function MockMaterialIcons({ name, ...props }) {
    return <Text {...props}>{name || 'icon'}</Text>;
  };
});

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => {
  const { Text } = require('react-native');
  return function MockMCI({ name, ...props }) {
    return <Text {...props}>{name || 'icon'}</Text>;
  };
});

jest.mock('expo-font', () => ({
  isLoaded: jest.fn(() => true),
  loadAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-asset', () => ({
  Asset: {
    fromModule: jest.fn(() => ({
      downloadAsync: jest.fn(() => Promise.resolve()),
    })),
  },
}));

jest.mock('expo-status-bar', () => {
  const React = require('react');
  return {
    StatusBar: () => null,
  };
});

let mockSecureStore = {};
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn((key) => Promise.resolve(mockSecureStore[key] || null)),
  setItemAsync: jest.fn((key, value) => {
    mockSecureStore[key] = value;
    return Promise.resolve();
  }),
  deleteItemAsync: jest.fn((key) => {
    delete mockSecureStore[key];
    return Promise.resolve();
  }),
}));

beforeEach(() => {
  mockSecureStore = {};
});

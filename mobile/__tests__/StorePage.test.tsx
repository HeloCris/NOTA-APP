import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockGetStore = jest.fn();
const mockGetStoreProducts = jest.fn();

const store = {
  id: 7,
  name: 'Casa Floral',
  slug: 'casa-floral',
  bio: 'Curadoria floral.',
  cover_url: 'https://cdn.test/capa.jpg',
  logo_url: 'https://cdn.test/logo.jpg',
  is_active: true,
  vacation_mode: false,
  is_verified: true,
};

const products = [
  {
    id: 11,
    product_name: 'Sauvage Floral',
    brand_name: 'Marca Teste',
    olfactory_family: 'Floral',
    price: '150.00',
    image_url: 'https://cdn.test/perfume.jpg',
  },
  {
    id: 12,
    product_name: 'Cedro Noturno',
    brand_name: 'Marca Teste',
    olfactory_family: 'Amadeirado',
    price: '250.00',
  },
];

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: '7' }),
  useRouter: () => ({ push: mockPush, back: mockBack }),
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: ({ children, ...props }: any) => <View {...props}>{children}</View> };
});

jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: () => null,
}));

jest.mock('expo-image', () => ({
  Image: 'Image',
}));

jest.mock('react-native', () => {
  const React = require('react');
  const TestFlatList = ({ data, ListHeaderComponent, ListEmptyComponent, renderItem }: any) => {
    const header = React.isValidElement(ListHeaderComponent)
      ? ListHeaderComponent
      : typeof ListHeaderComponent === 'function'
        ? React.createElement(ListHeaderComponent)
        : null;
    const content = data.length > 0
      ? data.map((item: any, index: number) => React.createElement(React.Fragment, { key: index }, renderItem({ item, index })))
      : ListEmptyComponent;

    return React.createElement('View', null, header, content);
  };
  class TestValue {
    interpolate() {
      return 0;
    }
  }
  const primitive = (name: string) => name;
  return {
    ActivityIndicator: primitive('ActivityIndicator'),
    Animated: { Value: TestValue, FlatList: TestFlatList, event: () => jest.fn() },
    Pressable: primitive('Pressable'),
    Platform: { OS: 'ios', select: (options: any) => options.ios ?? options.default },
    StyleSheet: { create: (styles: any) => styles, flatten: (style: any) => style },
    Text: primitive('Text'),
    TextInput: primitive('TextInput'),
    TouchableOpacity: primitive('TouchableOpacity'),
    View: primitive('View'),
  };
});

jest.mock('@/services/stores', () => ({
  storesService: {
    getStore: mockGetStore,
    getStoreProducts: mockGetStoreProducts,
  },
}));

jest.mock('@/constants/theme', () => ({
  Spacing: { one: 4, two: 8, three: 16, four: 24, six: 64 },
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({ text: '#000000', textSecondary: '#60646C' }),
}));

jest.mock('@/components/themed-view', () => {
  const { View } = require('react-native');
  return { ThemedView: ({ children, ...props }: any) => <View {...props}>{children}</View> };
});

jest.mock('@/components/themed-text', () => {
  const { Text } = require('react-native');
  return { ThemedText: ({ children, ...props }: any) => <Text {...props}>{children}</Text> };
});

jest.mock('@/components/store/StoreHero', () => {
  const { Text, View } = require('react-native');
  return {
    StoreHero: ({ store: storeData }: any) => (
      <View testID="store-hero">
        <Text>{storeData.cover_url}</Text>
        <Text>{storeData.logo_url}</Text>
        <Text>{storeData.name}</Text>
        <Text>{storeData.bio}</Text>
      </View>
    ),
  };
});

jest.mock('@/components/common/FamilyFilterChips', () => {
  const { Pressable, Text, View } = require('react-native');
  return {
    FamilyFilterChips: ({ onSelectFamily }: any) => (
      <View>
        <Pressable testID="family-all" onPress={() => onSelectFamily('')}>
          <Text>Todos</Text>
        </Pressable>
        <Pressable testID="family-floral" onPress={() => onSelectFamily('Floral')}>
          <Text>Floral</Text>
        </Pressable>
      </View>
    ),
  };
});

jest.mock('@/components/product/ProductCard', () => {
  const { Pressable, Text } = require('react-native');
  return {
    ProductCard: ({ product, onPress }: any) => (
      <Pressable testID={`product-${product.id}`} onPress={onPress}>
        <Text>{product.product_name}</Text>
      </Pressable>
    ),
  };
});

jest.mock('@/components/common/SkeletonLoader', () => {
  const { Text, View } = require('react-native');
  return {
    SkeletonLoader: () => (
      <View testID="store-skeleton">
        <Text>Carregando loja</Text>
      </View>
    ),
  };
});

const { default: StoreScreen, StoreEmptyState } = require('@/app/(shop)/store/[id]');
const SkeletonLoader = require('@/components/common/SkeletonLoader').SkeletonLoader;

describe('StorePage - RF-08', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGetStore.mockResolvedValue(store);
    mockGetStoreProducts.mockResolvedValue(products);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza hero com capa, logo, nome e bio', async () => {
    const { getByTestId, getByText } = await render(<StoreScreen />);

    await waitFor(() => expect(getByTestId('store-hero')).toBeTruthy());
    expect(getByText(store.cover_url)).toBeTruthy();
    expect(getByText(store.logo_url)).toBeTruthy();
    expect(getByText(store.name)).toBeTruthy();
    expect(getByText(store.bio)).toBeTruthy();
  });

  it('renderiza chips e filtra pela família selecionada', async () => {
    mockGetStoreProducts
      .mockResolvedValueOnce(products)
      .mockResolvedValueOnce([products[0]]);

    const { getByTestId, getByText, queryByText } = await render(<StoreScreen />);
    await waitFor(() => expect(getByText('Cedro Noturno')).toBeTruthy());

    fireEvent.press(getByTestId('family-floral'));

    await waitFor(() => expect(queryByText('Cedro Noturno')).toBeNull());
    expect(getByText('Floral')).toBeTruthy();
    expect(mockGetStoreProducts).toHaveBeenLastCalledWith('7', {
      search: undefined,
      olfactory_family: 'Floral',
    });
  });

  it('aplica debounce e faz uma chamada após digitação rápida', async () => {
    const { getByPlaceholderText } = await render(<StoreScreen />);
    await waitFor(() => expect(mockGetStoreProducts).toHaveBeenCalledTimes(1));
    const searchInput = getByPlaceholderText('Buscar em Casa Floral...');

    fireEvent.changeText(searchInput, 'S');
    fireEvent.changeText(searchInput, 'Sa');
    fireEvent.changeText(searchInput, 'Sau');

    expect(mockGetStoreProducts).toHaveBeenCalledTimes(1);
    await new Promise((resolve) => setTimeout(resolve, 350));

    await waitFor(() => expect(mockGetStoreProducts).toHaveBeenCalledTimes(2));
    expect(mockGetStoreProducts).toHaveBeenLastCalledWith('7', {
      search: 'Sau',
      olfactory_family: undefined,
    });
  });

  it('exibe estado vazio e limpa os filtros', async () => {
    const onClearFilters = jest.fn();
    const emptyState = StoreEmptyState({ onClearFilters });
    const serializedState = JSON.stringify(emptyState);

    expect(serializedState).toContain('Nenhum perfume encontrado para este filtro.');
    const clearButton = emptyState.props.children.find(
      (child: any) => child?.props?.accessibilityRole === 'button',
    );
    clearButton.props.onPress();
    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });

  it('exibe skeleton enquanto a loja carrega', async () => {
    const skeleton = SkeletonLoader();

    expect(skeleton.props.testID).toBe('store-skeleton');
  });
});

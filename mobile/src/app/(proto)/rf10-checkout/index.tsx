import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import Feather from '@expo/vector-icons/Feather';

interface ShippingOption {
  id: 'express' | 'standard';
  title: string;
  estimate: string;
  price: number;
}

export default function ProtoRF10Checkout() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const containerWidth = Math.min(windowWidth, 460);

  // --- Endereço de Entrega (RF-10.2 / RF-10.3) ---
  const [cep, setCep] = useState('01310-100');
  const [street, setStreet] = useState('Av. Paulista');
  const [number, setNumber] = useState('1000');
  const [complement, setComplement] = useState('Apt 42');
  const [neighborhood, setNeighborhood] = useState('Bela Vista');
  const [city, setCity] = useState('São Paulo');
  const [stateUf, setStateUf] = useState('SP');
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  // --- Modalidade de Frete (RF-10.4) ---
  const shippingOptions: ShippingOption[] = [
    {
      id: 'express',
      title: 'Expresso',
      estimate: '2–3 dias úteis',
      price: 25.0,
    },
    {
      id: 'standard',
      title: 'Econômico',
      estimate: '5–7 dias úteis',
      price: 12.0,
    },
  ];
  const [selectedShipping, setSelectedShipping] = useState<'express' | 'standard'>('express');

  // --- Resumo do Pedido (RF-10.1) ---
  const items = [
    {
      id: '1',
      brand: 'YVES SAINT LAURENT',
      name: 'Libre EDP',
      volume: '50ml',
      quantity: 1,
      price: 620.0,
    },
    {
      id: '2',
      brand: 'MAISON F. KURKDJIAN',
      name: 'Baccarat Rouge 540',
      volume: '70ml',
      quantity: 1,
      price: 1890.0,
    },
  ];

  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const currentShippingCost =
    shippingOptions.find((opt) => opt.id === selectedShipping)?.price || 0;
  const total = subtotal + currentShippingCost;

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleCepSearch = async (text: string) => {
    const raw = text.replace(/\D/g, '');
    let formatted = raw;
    if (raw.length > 5) {
      formatted = `${raw.slice(0, 5)}-${raw.slice(5, 8)}`;
    }
    setCep(formatted);

    if (raw.length === 8) {
      setIsLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setStreet(data.logradouro || '');
          setNeighborhood(data.bairro || '');
          setCity(data.localidade || '');
          setStateUf(data.uf || '');
        }
      } catch {
        setStreet('Av. Paulista');
        setNeighborhood('Bela Vista');
        setCity('São Paulo');
        setStateUf('SP');
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  const isFormValid =
    cep.length >= 8 &&
    street.trim().length > 0 &&
    number.trim().length > 0 &&
    neighborhood.trim().length > 0 &&
    city.trim().length > 0 &&
    stateUf.trim().length > 0;

  const handleGoToPayment = () => {
    router.push('/rf11-pagamento' as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F1EA" />
      <View style={[styles.mainWrapper, { maxWidth: containerWidth }]}>
        {/* --- HEADER COM BOTÃO VOLTAR --- */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#1C252E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout (RF-10)</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* --- SEÇÃO 1: RESUMO DO PEDIDO --- */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Feather name="package" size={18} color="#2C4659" />
              <Text style={styles.cardTitle}>Resumo do Pedido</Text>
            </View>

            <View style={styles.storeTag}>
              <Text style={styles.storeTagText}>Lojas Oficiais NŌTA</Text>
            </View>

            {items.map((item, idx) => (
              <View
                key={item.id}
                style={[
                  styles.itemRow,
                  idx !== items.length - 1 && styles.itemRowDivider,
                ]}
              >
                <View style={styles.itemInfo}>
                  <Text style={styles.itemBrand}>{item.brand}</Text>
                  <Text style={styles.itemName}>
                    {item.name} ({item.volume})
                  </Text>
                  <Text style={styles.itemQuantity}>Qtd: {item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>
                  R$ {formatBRL(item.price * item.quantity)}
                </Text>
              </View>
            ))}
          </View>

          {/* --- SEÇÃO 2: ENDEREÇO DE ENTREGA --- */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="location-outline" size={19} color="#A85A38" />
              <Text style={styles.cardTitle}>Endereço de Entrega</Text>
            </View>

            {/* CEP */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CEP</Text>
              <View style={styles.inputWithIcon}>
                <TextInput
                  style={styles.input}
                  placeholder="00000-000"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={cep}
                  onChangeText={handleCepSearch}
                  maxLength={9}
                />
                {isLoadingCep && (
                  <ActivityIndicator
                    size="small"
                    color="#2C4659"
                    style={styles.inputSpinner}
                  />
                )}
              </View>
            </View>

            {/* Rua */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Rua / Logradouro</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Av. Paulista"
                placeholderTextColor="#9CA3AF"
                value={street}
                onChangeText={setStreet}
              />
            </View>

            {/* Número & Complemento */}
            <View style={styles.rowTwoCols}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Número</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={number}
                  onChangeText={setNumber}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1.4, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Complemento</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Apto, Bloco..."
                  placeholderTextColor="#9CA3AF"
                  value={complement}
                  onChangeText={setComplement}
                />
              </View>
            </View>

            {/* Bairro */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bairro</Text>
              <TextInput
                style={styles.input}
                placeholder="Bairro"
                placeholderTextColor="#9CA3AF"
                value={neighborhood}
                onChangeText={setNeighborhood}
              />
            </View>

            {/* Cidade & Estado */}
            <View style={styles.rowTwoCols}>
              <View style={[styles.inputGroup, { flex: 2, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Cidade</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Cidade"
                  placeholderTextColor="#9CA3AF"
                  value={city}
                  onChangeText={setCity}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>UF</Text>
                <TextInput
                  style={styles.input}
                  placeholder="SP"
                  placeholderTextColor="#9CA3AF"
                  maxLength={2}
                  autoCapitalize="characters"
                  value={stateUf}
                  onChangeText={setStateUf}
                />
              </View>
            </View>
          </View>

          {/* --- SEÇÃO 3: MODALIDADE DE FRETE --- */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Feather name="truck" size={18} color="#2C4659" />
              <Text style={styles.cardTitle}>Modalidade de Frete</Text>
            </View>

            {shippingOptions.map((opt) => {
              const isSelected = selectedShipping === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.shippingOption,
                    isSelected && styles.shippingOptionActive,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => setSelectedShipping(opt.id)}
                >
                  <View style={styles.radioOuter}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>

                  <View style={styles.shippingDetails}>
                    <Text style={styles.shippingTitle}>
                      {opt.title}{' '}
                      <Text style={styles.shippingEstimate}>
                        ({opt.estimate})
                      </Text>
                    </Text>
                  </View>

                  <Text style={styles.shippingPrice}>
                    R$ {formatBRL(opt.price)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* --- RESUMO TOTAL --- */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryLine}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryVal}>R$ {formatBRL(subtotal)}</Text>
            </View>

            <View style={styles.summaryLine}>
              <Text style={styles.summaryLabel}>
                Frete ({selectedShipping === 'express' ? 'Expresso' : 'Econômico'})
              </Text>
              <Text style={styles.summaryVal}>
                R$ {formatBRL(currentShippingCost)}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Total a Pagar</Text>
              <Text style={styles.totalVal}>R$ {formatBRL(total)}</Text>
            </View>
          </View>

          {/* --- BOTÃO DE AÇÃO: IR PARA PAGAMENTO --- */}
          <TouchableOpacity
            style={[
              styles.payButton,
              !isFormValid && styles.payButtonDisabled,
            ]}
            activeOpacity={0.88}
            onPress={handleGoToPayment}
            disabled={!isFormValid}
          >
            <Text style={styles.payButtonText}>
              Ir para Pagamento → R$ {formatBRL(total)}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 36 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F1EA',
    alignItems: 'center',
  },
  mainWrapper: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#F4F1EA',
  },
  contentContainer: {
    paddingBottom: 24,
  },

  // --- Header ---
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 16 : 10,
    paddingBottom: 14,
    backgroundColor: '#F4F1EA',
    borderBottomWidth: 1,
    borderBottomColor: '#EBE7DE',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C252E',
  },

  // --- Card Container ---
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFECE4',
    marginHorizontal: 18,
    marginTop: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C252E',
  },
  storeTag: {
    backgroundColor: '#F4F7FA',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 12,
  },
  storeTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2C4659',
  },

  // --- Resumo Itens ---
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F2EB',
  },
  itemInfo: {
    flex: 1,
    paddingRight: 12,
  },
  itemBrand: {
    fontSize: 10,
    fontWeight: '700',
    color: '#78716C',
    letterSpacing: 0.5,
  },
  itemName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1C252E',
    marginTop: 1,
  },
  itemQuantity: {
    fontSize: 12,
    color: '#78716C',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C252E',
  },

  // --- Inputs ---
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#FAF9F5',
    borderWidth: 1,
    borderColor: '#E8E4D8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 9,
    fontSize: 14,
    color: '#1C252E',
  },
  inputWithIcon: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputSpinner: {
    position: 'absolute',
    right: 12,
  },
  rowTwoCols: {
    flexDirection: 'row',
  },

  // --- Frete Selector ---
  shippingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFECE4',
    marginBottom: 10,
    backgroundColor: '#FAF9F5',
  },
  shippingOptionActive: {
    borderColor: '#2C4659',
    backgroundColor: '#F3F6F9',
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#2C4659',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#2C4659',
  },
  shippingDetails: {
    flex: 1,
  },
  shippingTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1C252E',
  },
  shippingEstimate: {
    fontSize: 12,
    fontWeight: '400',
    color: '#78716C',
  },
  shippingPrice: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#2C4659',
  },

  // --- Resumo Total ---
  summaryCard: {
    marginHorizontal: 18,
    marginTop: 16,
    paddingHorizontal: 8,
    gap: 6,
  },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 13.5,
    color: '#78716C',
  },
  summaryVal: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1C252E',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E1D5',
    marginVertical: 6,
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1C252E',
  },
  totalVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2C4659',
  },

  // --- CTA Button ---
  payButton: {
    backgroundColor: '#273847',
    marginHorizontal: 18,
    marginTop: 22,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  payButtonDisabled: {
    opacity: 0.5,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '700',
  },
});

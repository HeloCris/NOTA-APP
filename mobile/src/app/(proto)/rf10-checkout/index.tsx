import React, { useState, useEffect } from 'react';
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
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import Feather from '@expo/vector-icons/Feather';
import { storesService, ShippingQuoteResponse } from '@/services/stores';
import { useCart } from '@/context/CartContext';
import {
  UserAddress,
  getDefaultAddress,
  getSavedAddresses,
  addOrUpdateAddress,
} from '@/utils/addressStorage';

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

  const { items: cartItems } = useCart();

  // Usa itens reais do carrinho ou fallback se acessado diretamente
  const items = cartItems.length > 0
    ? cartItems.map((c) => ({
        id: c.id,
        brand: c.storeName || c.brandName,
        name: c.productName,
        volume: c.volume,
        quantity: c.quantity,
        price: c.price,
        storeId: c.storeId,
      }))
    : [
        {
          id: '1',
          brand: 'YVES SAINT LAURENT',
          name: 'Libre EDP',
          volume: '50ml',
          quantity: 1,
          price: 620.0,
          storeId: 2,
        },
      ];

  const primaryStoreId = items[0]?.storeId || 2;

  // --- Endereço de Entrega (Carregado dinamicamente de Meus Endereços) ---
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [isEditingNewAddress, setIsEditingNewAddress] = useState(false);

  const [newTag, setNewTag] = useState('Casa');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [stateUf, setStateUf] = useState('');
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [shippingQuote, setShippingQuote] = useState<ShippingQuoteResponse | null>(null);

  // Carrega a lista de endereços e define o padrão (se houver)
  const loadAddresses = async () => {
    try {
      const list = await getSavedAddresses();
      setSavedAddresses(list);
      if (list.length > 0) {
        const def = list.find((a) => a.isDefault) || list[0];
        setSelectedAddress(def);
        setIsEditingNewAddress(false);

        // Preenche os campos do formulário para referência
        setCep(def.cep || '');
        setStreet(def.street || '');
        setNumber(def.number || '');
        setComplement(def.complement || '');
        setNeighborhood(def.neighborhood || '');
        setCity(def.city || '');
        setStateUf(def.stateUf || '');

        if (def.cep) {
          const raw = def.cep.replace(/\D/g, '');
          if (raw.length === 8) {
            fetchShippingForCep(raw, def.stateUf || 'GO');
          }
        }
      } else {
        setSelectedAddress(null);
        setIsEditingNewAddress(true);
      }
    } catch (err) {
      console.error('Erro ao carregar endereços salvos:', err);
    }
  };

  React.useEffect(() => {
    loadAddresses();
  }, []);

  // Selecionar um endereço existente da lista
  const handleSelectAddress = (addr: UserAddress) => {
    setSelectedAddress(addr);
    setIsEditingNewAddress(false);
    setIsAddressModalVisible(false);

    setCep(addr.cep || '');
    setStreet(addr.street || '');
    setNumber(addr.number || '');
    setComplement(addr.complement || '');
    setNeighborhood(addr.neighborhood || '');
    setCity(addr.city || '');
    setStateUf(addr.stateUf || '');

    if (addr.cep) {
      const raw = addr.cep.replace(/\D/g, '');
      if (raw.length === 8) {
        fetchShippingForCep(raw, addr.stateUf || 'GO');
      }
    }
  };

  // Abrir formulário para adicionar novo endereço
  const handleStartAddNewAddress = () => {
    setSelectedAddress(null);
    setIsEditingNewAddress(true);
    setIsAddressModalVisible(false);
    setNewTag('Casa');
    setCep('');
    setStreet('');
    setNumber('');
    setComplement('');
    setNeighborhood('');
    setCity('');
    setStateUf('');
    setShippingOptions([]);
  };

  // --- Modalidade de Frete Dinâmica conectada à loja (RF-10.4) ---
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<'express' | 'standard'>('express');

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

  const fetchShippingForCep = async (cleanCep: string, uf: string) => {
    setIsLoadingShipping(true);
    try {
      const quote = await storesService.calculateShippingQuote(primaryStoreId, {
        postal_code: cleanCep,
        cart_subtotal: subtotal,
        state: uf,
      });
      setShippingQuote(quote);

      const sedexMethod = quote.methods.find((m) => m.id === 'SEDEX');
      const pacMethod = quote.methods.find((m) => m.id === 'PAC');

      setShippingOptions([
        {
          id: 'express',
          title: 'SEDEX (Expresso)',
          estimate: `${sedexMethod?.total_delivery_days_min || 1}–${sedexMethod?.total_delivery_days_max || 3} dias úteis`,
          price: sedexMethod?.price ?? 12.92,
        },
        {
          id: 'standard',
          title: 'PAC (Econômico)',
          estimate: `${pacMethod?.total_delivery_days_min || 3}–${pacMethod?.total_delivery_days_max || 5} dias úteis`,
          price: pacMethod?.price ?? 13.0,
        },
      ]);
    } catch (quoteErr) {
      console.error('Erro ao buscar cotação de frete:', quoteErr);
    } finally {
      setIsLoadingShipping(false);
    }
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
        let currentUf = 'GO';
        if (!data.erro) {
          setStreet(data.logradouro || '');
          setNeighborhood(data.bairro || '');
          setCity(data.localidade || '');
          setStateUf(data.uf || '');
          currentUf = data.uf || 'GO';
        }
        await fetchShippingForCep(raw, currentUf);
      } catch (err) {
        console.error('Erro ao buscar CEP:', err);
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  const isFormValid =
    (selectedAddress !== null && !isEditingNewAddress) ||
    (cep.length >= 8 &&
      street.trim().length > 0 &&
      number.trim().length > 0 &&
      neighborhood.trim().length > 0 &&
      city.trim().length > 0 &&
      stateUf.trim().length > 0);

  const handleGoToPayment = async () => {
    if (!isFormValid) return;

    // Se estiver preenchendo um novo endereço, salva em Meus Endereços
    if (isEditingNewAddress) {
      try {
        await addOrUpdateAddress({
          tag: newTag || 'Principal',
          street: street.trim(),
          number: number.trim(),
          complement: complement.trim() || undefined,
          neighborhood: neighborhood.trim(),
          city: city.trim(),
          stateUf: stateUf.trim().toUpperCase(),
          cep: cep.trim(),
          isDefault: savedAddresses.length === 0,
        });
      } catch (err) {
        console.error('Erro ao salvar endereço em Meus Endereços:', err);
      }
    }

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
          <Text style={styles.headerTitle}>Entrega</Text>
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
          {selectedAddress && !isEditingNewAddress ? (
            // CARD DE ENDEREÇO SELECIONADO / PADRÃO
            <View style={styles.card}>
              <View style={styles.cardHeaderBetween}>
                <View style={styles.cardHeaderTitleGroup}>
                  <Ionicons name="location" size={20} color="#A85A38" />
                  <Text style={styles.cardTitle}>Endereço de Entrega</Text>
                </View>
                <TouchableOpacity
                  style={styles.changeAddressBtn}
                  onPress={() => setIsAddressModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.changeAddressText}>Trocar</Text>
                  <Feather name="chevron-right" size={16} color="#A85A38" />
                </TouchableOpacity>
              </View>

              <View style={styles.selectedAddressContent}>
                <View style={styles.addressTagRow}>
                  <View style={styles.addressBadge}>
                    <Text style={styles.addressBadgeText}>
                      {selectedAddress.tag || 'Principal'}
                    </Text>
                  </View>
                  {selectedAddress.isDefault ? (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Padrão</Text>
                    </View>
                  ) : null}
                </View>

                <Text style={styles.selectedAddressLine1}>
                  {selectedAddress.street}, {selectedAddress.number}
                  {selectedAddress.complement ? ` - ${selectedAddress.complement}` : ''}
                </Text>
                <Text style={styles.selectedAddressLine2}>
                  {selectedAddress.neighborhood} • {selectedAddress.city} - {selectedAddress.stateUf}
                </Text>
                <Text style={styles.selectedAddressCep}>
                  CEP: {selectedAddress.cep}
                </Text>
              </View>
            </View>
          ) : (
            // FORMULÁRIO DE NOVO ENDEREÇO
            <View style={styles.card}>
              <View style={styles.cardHeaderBetween}>
                <View style={styles.cardHeaderTitleGroup}>
                  <Ionicons name="location-outline" size={19} color="#A85A38" />
                  <Text style={styles.cardTitle}>Novo Endereço de Entrega</Text>
                </View>
                {savedAddresses.length > 0 ? (
                  <TouchableOpacity
                    onPress={() => {
                      setIsEditingNewAddress(false);
                      const def = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
                      if (def) handleSelectAddress(def);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelNewAddressText}>Cancelar</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Tag / Identificador */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Identificação (Ex: Casa, Trabalho)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Casa, Trabalho"
                  placeholderTextColor="#9CA3AF"
                  value={newTag}
                  onChangeText={setNewTag}
                />
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
                  {isLoadingCep ? (
                    <ActivityIndicator
                      size="small"
                      color="#2C4659"
                      style={styles.inputSpinner}
                    />
                  ) : null}
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
          )}

          {/* --- SEÇÃO 3: MODALIDADE DE FRETE --- */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Feather name="truck" size={18} color="#2C4659" />
              <Text style={styles.cardTitle}>Modalidade de Frete</Text>
            </View>

            {isLoadingShipping ? (
              <View style={styles.shippingLoading}>
                <ActivityIndicator size="small" color="#2C4659" />
                <Text style={styles.shippingLoadingText}>Calculando frete com a transportadora...</Text>
              </View>
            ) : shippingOptions.length > 0 ? (
              shippingOptions.map((opt) => {
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
                      {isSelected ? <View style={styles.radioInner} /> : null}
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
              })
            ) : (
              <Text style={styles.emptyShippingText}>
                {isFormValid
                  ? 'Nenhuma opção de frete disponível para esta região.'
                  : 'Preencha o CEP para consultar opções de envio.'}
              </Text>
            )}
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
            <Text style={styles.payButtonText}>Ir para o pagamento</Text>
          </TouchableOpacity>

          <View style={{ height: 36 }} />
        </ScrollView>

        {/* --- MODAL DE SELEÇÃO DE ENDEREÇOS --- */}
        <Modal
          visible={isAddressModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsAddressModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { maxWidth: containerWidth - 32 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Endereços Salvos</Text>
                <TouchableOpacity
                  onPress={() => setIsAddressModalVisible(false)}
                  style={styles.modalCloseBtn}
                >
                  <Ionicons name="close" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                {savedAddresses.map((addr) => {
                  const isCur = selectedAddress?.id === addr.id;
                  return (
                    <TouchableOpacity
                      key={addr.id}
                      style={[
                        styles.addressChoiceCard,
                        isCur && styles.addressChoiceCardActive,
                      ]}
                      onPress={() => handleSelectAddress(addr)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.radioOuter}>
                        {isCur ? <View style={styles.radioInner} /> : null}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.addressTagRow}>
                          <Text style={styles.addressChoiceTag}>{addr.tag || 'Endereço'}</Text>
                          {addr.isDefault ? (
                            <View style={styles.defaultBadge}>
                              <Text style={styles.defaultBadgeText}>Padrão</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={styles.addressChoiceText}>
                          {addr.street}, {addr.number}
                          {addr.complement ? ` - ${addr.complement}` : ''}
                        </Text>
                        <Text style={styles.addressChoiceSub}>
                          {addr.neighborhood} • {addr.city}-{addr.stateUf} • CEP {addr.cep}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity
                style={styles.modalAddNewBtn}
                onPress={handleStartAddNewAddress}
                activeOpacity={0.8}
              >
                <Feather name="plus-circle" size={18} color="#A85A38" />
                <Text style={styles.modalAddNewBtnText}>Adicionar outro endereço</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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

  // --- Endereço Selecionado Card & Header ---
  cardHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  changeAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  changeAddressText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#A85A38',
  },
  cancelNewAddressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#78716C',
  },
  selectedAddressContent: {
    backgroundColor: '#FAF9F5',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFECE4',
    gap: 4,
  },
  addressTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  addressBadge: {
    backgroundColor: '#EBE7DE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  addressBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  defaultBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D32',
  },
  selectedAddressLine1: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C252E',
  },
  selectedAddressLine2: {
    fontSize: 13,
    color: '#525B64',
  },
  selectedAddressCep: {
    fontSize: 12.5,
    color: '#78716C',
    fontWeight: '500',
    marginTop: 2,
  },

  // --- Shipping States ---
  shippingLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  shippingLoadingText: {
    fontSize: 13,
    color: '#78716C',
  },
  emptyShippingText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
    paddingVertical: 8,
  },

  // --- Modal de Endereços ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F2EB',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1C252E',
  },
  modalCloseBtn: {
    padding: 4,
  },
  addressChoiceCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFECE4',
    marginBottom: 10,
    backgroundColor: '#FAF9F5',
  },
  addressChoiceCardActive: {
    borderColor: '#2C4659',
    backgroundColor: '#F3F6F9',
  },
  addressChoiceTag: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2C4659',
  },
  addressChoiceText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1C252E',
    marginTop: 2,
  },
  addressChoiceSub: {
    fontSize: 12,
    color: '#78716C',
    marginTop: 2,
  },
  modalAddNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#A85A38',
    borderStyle: 'dashed',
    borderRadius: 14,
    backgroundColor: '#FFF9F6',
  },
  modalAddNewBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#A85A38',
  },
});

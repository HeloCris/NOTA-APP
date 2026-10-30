import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { useCart } from '@/context/CartContext';
import { storesService, ShippingQuoteResponse } from '@/services/stores';
import { formatProductVolume } from '@/utils/productUtils';
import {
  UserAddress,
  getSavedAddresses,
  addOrUpdateAddress,
} from '@/utils/addressStorage';
import { CheckoutStepper } from '@/components/checkout/CheckoutStepper';

interface ShippingOption {
  id: 'express' | 'standard';
  title: string;
  badge: string;
  estimate: string;
  price: number;
}

export default function CheckoutShippingScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const containerWidth = Math.min(windowWidth, 460);

  const { items: cartItems, subtotal } = useCart();

  const items = cartItems.length > 0
    ? cartItems.map((c) => ({
        ...c,
        storeProductId: Number(c.storeProductId || (c.productId === 7 ? 14 : c.productId === 8 ? 12 : 4)),
        storeId: c.storeId || 1,
      }))
    : [
        {
          id: '1',
          productId: 3,
          storeProductId: 16,
          brandName: 'Decants & Co. Perfumaria',
          productName: 'Perseus',
          volume: 'DECANT • 10 ML',
          volumeMl: 10,
          quantity: 1,
          price: 15.0,
          storeId: 2,
        },
      ];

  const primaryStoreId = items[0]?.storeId || 2;

  // Agrupa os itens por loja
  const storeGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        storeName: string;
        storeIsOfficial?: boolean;
        items: typeof items;
      }
    >();

    items.forEach((item) => {
      const key = item.storeName || item.brandName || 'Loja Parceira';
      if (!map.has(key)) {
        map.set(key, {
          storeName: key,
          storeIsOfficial: item.storeIsOfficial,
          items: [],
        });
      }
      map.get(key)!.items.push(item);
    });

    return Array.from(map.values());
  }, [items]);

  // Endereços
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);

  // Campos para novo endereço
  const [newTag, setNewTag] = useState('Casa');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [stateUf, setStateUf] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [addressError, setAddressError] = useState('');

  // Frete
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([
    {
      id: 'express',
      title: 'SEDEX',
      badge: 'Expresso',
      estimate: 'Chega entre sex, 23 e seg, 26 out',
      price: 12.92,
    },
    {
      id: 'standard',
      title: 'PAC',
      badge: 'Econômico',
      estimate: 'Chega entre ter, 27 e sex, 30 out',
      price: 9.5,
    },
  ]);
  const [selectedShipping, setSelectedShipping] = useState<'express' | 'standard'>('express');
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const selectedShippingOption = shippingOptions.find((opt) => opt.id === selectedShipping);
  const currentShippingCost = selectedShippingOption?.price || 0;
  const total = subtotal + currentShippingCost;

  const fetchShippingForCep = async (cleanCep: string, uf: string) => {
    setIsLoadingShipping(true);
    try {
      const quote = await storesService.calculateShippingQuote(primaryStoreId, {
        postal_code: cleanCep,
        cart_subtotal: subtotal,
        state: uf,
      });

      const sedexMethod = quote.methods.find((m) => m.id === 'SEDEX');
      const pacMethod = quote.methods.find((m) => m.id === 'PAC');

      setShippingOptions([
        {
          id: 'express',
          title: 'SEDEX',
          badge: 'Expresso',
          estimate: `Chega em ${sedexMethod?.total_delivery_days_min || 1} a ${sedexMethod?.total_delivery_days_max || 3} dias úteis`,
          price: sedexMethod?.price ?? 12.92,
        },
        {
          id: 'standard',
          title: 'PAC',
          badge: 'Econômico',
          estimate: `Chega em ${pacMethod?.total_delivery_days_min || 3} a ${pacMethod?.total_delivery_days_max || 5} dias úteis`,
          price: pacMethod?.price ?? 9.5,
        },
      ]);
    } catch (err) {
      console.warn('Usando cotação de frete padrão regional');
    } finally {
      setIsLoadingShipping(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        let list = await getSavedAddresses();

        if (!isMounted) return;
        setSavedAddresses(list);
        if (list.length > 0) {
          const def = list.find((a) => a.isDefault) || list[0];
          setSelectedAddressId(def.id || '');
          if (def.cep) {
            fetchShippingForCep(def.cep.replace(/\D/g, ''), def.stateUf || 'GO');
          }
        }
      } catch (err) {
        console.error('Erro ao inicializar endereços:', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectAddress = (addr: UserAddress) => {
    setSelectedAddressId(addr.id || '');
    if (addr.cep) {
      fetchShippingForCep(addr.cep.replace(/\D/g, ''), addr.stateUf || 'GO');
    }
  };

  // Reconhecimento automático de CEP via ViaCEP com preenchimento instantâneo
  const handleCepSearch = async (text: string) => {
    const raw = text.replace(/\D/g, '');
    let formatted = raw;
    if (raw.length > 5) {
      formatted = `${raw.slice(0, 5)}-${raw.slice(5, 8)}`;
    }
    setCep(formatted);
    if (addressError) setAddressError('');

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
        } else {
          setAddressError('CEP não encontrado. Por favor, verifique ou preencha os dados manualmente.');
        }
      } catch {
        // Fallback gracioso caso sem conexão
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  const resetAddressForm = () => {
    setNewTag('Casa');
    setCep('');
    setStreet('');
    setNumber('');
    setComplement('');
    setNeighborhood('');
    setCity('');
    setStateUf('');
    setIsDefault(false);
    setAddressError('');
  };

  const handleOpenAddAddressModal = () => {
    resetAddressForm();
    setIsAddressModalVisible(true);
  };

  const handleSaveNewAddress = async () => {
    const rawCep = cep.replace(/\D/g, '');
    if (!street.trim() || !number.trim() || rawCep.length < 8) {
      setAddressError('Preencha CEP válido (8 dígitos), Rua e Número para continuar.');
      return;
    }

    const newAddr: UserAddress = {
      id: Date.now().toString(),
      tag: newTag.trim() || 'Casa',
      street: street.trim(),
      number: number.trim(),
      complement: complement.trim() || undefined,
      neighborhood: neighborhood.trim() || 'Centro',
      city: city.trim() || 'Goiânia',
      stateUf: stateUf.trim().toUpperCase() || 'GO',
      cep: cep.trim(),
      isDefault: isDefault || savedAddresses.length === 0,
    };

    await addOrUpdateAddress(newAddr);
    const updated = await getSavedAddresses();
    setSavedAddresses(updated);
    setIsAddressModalVisible(false);
    resetAddressForm();
    setSelectedAddressId(newAddr.id || '');
    fetchShippingForCep(newAddr.cep.replace(/\D/g, ''), newAddr.stateUf || 'GO');
  };

  const handleContinueToPayment = () => {
    const selectedAddr = savedAddresses.find((a) => a.id === selectedAddressId) || savedAddresses[0];

    const payloadItems = items.map((i) => ({
      store_product_id: Number(i.storeProductId),
      store_id: i.storeId,
      store_name: i.storeName || i.brandName,
      quantity: i.quantity,
      unit_price: Number(i.price).toFixed(2),
    }));

    router.push({
      pathname: '/checkout/payment' as any,
      params: {
        store_id: String(primaryStoreId),
        total_amount: total.toFixed(2),
        shipping_cost: String(currentShippingCost.toFixed(2)),
        shipping_service: selectedShipping === 'express' ? 'SEDEX' : 'PAC',
        address: JSON.stringify(selectedAddr),
        cartItems: JSON.stringify(payloadItems),
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={[styles.mainWrapper, { maxWidth: containerWidth }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#1C252E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Entrega</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Stepper (1 Sacola concluída, 2 Entrega ativa, 3 Pagamento) */}
        <CheckoutStepper currentStep="entrega" />

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Endereço de Entrega */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Endereço de entrega</Text>
            <TouchableOpacity onPress={handleOpenAddAddressModal} activeOpacity={0.7}>
              <Text style={styles.linkText}>Adicionar endereço</Text>
            </TouchableOpacity>
          </View>

          {/* Lista de Endereços Salvos em Rádio Card */}
          {savedAddresses.map((addr) => {
            const isSelected = (addr.id || '') === selectedAddressId;
            return (
              <TouchableOpacity
                key={addr.id}
                style={[styles.addressCard, isSelected && styles.addressCardSelected]}
                onPress={() => handleSelectAddress(addr)}
                activeOpacity={0.8}
              >
                <View style={styles.radioOuter}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>

                <View style={styles.addressInfo}>
                  <View style={styles.addressTagRow}>
                    <Text style={styles.addressTagTitle}>{addr.tag}</Text>
                    {addr.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Padrão</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.addressStreet} numberOfLines={1}>
                    {addr.street}, {addr.number}
                  </Text>
                  <Text style={styles.addressCity}>
                    {addr.neighborhood} • {addr.city}, {addr.stateUf} - {addr.cep}
                  </Text>
                </View>

                {isSelected && (
                  <TouchableOpacity style={styles.editIconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Feather name="edit-2" size={14} color="#8A867E" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })}

          {/* Botão Adicionar novo endereço (visível se já houver pelo menos 1 endereço) */}
          {savedAddresses.length > 0 && (
            <TouchableOpacity
              style={styles.addAddressButton}
              onPress={handleOpenAddAddressModal}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={16} color="#1E2B37" />
              <Text style={styles.addAddressButtonText}>Adicionar novo endereço</Text>
            </TouchableOpacity>
          )}

          {/* Se o usuário NÃO tiver nenhum endereço cadastrado, o formulário já fica aberto direto na tela com o padrão de Meus Endereços */}
          {savedAddresses.length === 0 && (
            <View style={styles.newAddressBox}>
              <Text style={styles.newAddressTitle}>Cadastre seu endereço de entrega</Text>
              <Text style={styles.newAddressSubtitle}>
                Preencha os dados abaixo para calcular o frete e continuar seu pedido.
              </Text>

              {addressError ? (
                <View style={styles.addressErrorBox}>
                  <Feather name="alert-circle" size={14} color="#DC2626" />
                  <Text style={styles.addressErrorText}>{addressError}</Text>
                </View>
              ) : null}

              {/* Identificador (Casa, Trabalho, Outro) */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Identificador</Text>
                <View style={styles.tagSelectorRow}>
                  {['Casa', 'Trabalho', 'Outro'].map((tagOption) => (
                    <TouchableOpacity
                      key={tagOption}
                      style={[
                        styles.tagOptionBtn,
                        newTag === tagOption && styles.tagOptionBtnActive,
                      ]}
                      onPress={() => setNewTag(tagOption)}
                    >
                      <Text
                        style={[
                          styles.tagOptionText,
                          newTag === tagOption && styles.tagOptionTextActive,
                        ]}
                      >
                        {tagOption}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* CEP com Busca Automática e Spinner */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>CEP</Text>
                <View style={styles.inputWithIcon}>
                  <TextInput
                    style={styles.innerInput}
                    placeholder="00000-000"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={cep}
                    onChangeText={handleCepSearch}
                    maxLength={9}
                  />
                  {isLoadingCep && (
                    <ActivityIndicator size="small" color="#1E2B37" style={{ marginRight: 6 }} />
                  )}
                </View>
              </View>

              {/* Rua / Logradouro */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Rua / Logradouro</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Av. Paulista"
                  placeholderTextColor="#9CA3AF"
                  value={street}
                  onChangeText={(t) => {
                    setStreet(t);
                    if (addressError) setAddressError('');
                  }}
                />
              </View>

              {/* Número & Complemento */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Número</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="123"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={number}
                    onChangeText={(t) => {
                      setNumber(t);
                      if (addressError) setAddressError('');
                    }}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1.4 }]}>
                  <Text style={styles.formLabel}>Complemento</Text>
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
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Bairro</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Bairro"
                  placeholderTextColor="#9CA3AF"
                  value={neighborhood}
                  onChangeText={setNeighborhood}
                />
              </View>

              {/* Cidade & UF */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={[styles.formGroup, { flex: 2 }]}>
                  <Text style={styles.formLabel}>Cidade</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Cidade"
                    placeholderTextColor="#9CA3AF"
                    value={city}
                    onChangeText={setCity}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>UF</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="GO"
                    placeholderTextColor="#9CA3AF"
                    maxLength={2}
                    autoCapitalize="characters"
                    value={stateUf}
                    onChangeText={(t) => setStateUf(t.toUpperCase())}
                  />
                </View>
              </View>

              {/* Checkbox: Definir como padrão */}
              <TouchableOpacity
                style={styles.checkboxRow}
                activeOpacity={0.7}
                onPress={() => setIsDefault(!isDefault)}
              >
                <View style={[styles.checkboxBox, isDefault && styles.checkboxBoxActive]}>
                  {isDefault && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                </View>
                <Text style={styles.checkboxLabel}>Definir como endereço padrão</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: '#1E2B37', marginTop: 12 }]}
                onPress={handleSaveNewAddress}
                activeOpacity={0.88}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Salvar Endereço</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 2. Seu Pedido Resumido */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Seu pedido</Text>
            <Text style={styles.itemCountText}>
              {items.length} {items.length === 1 ? 'item' : 'itens'}
            </Text>
          </View>

          <View style={styles.card}>
            {storeGroups.map((group, groupIdx) => (
              <View
                key={group.storeName}
                style={groupIdx > 0 ? { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F5F2EB' } : undefined}
              >
                <View style={styles.storeHeader}>
                  <Ionicons name="storefront-outline" size={16} color="#1C252E" />
                  <Text style={styles.storeName}>{group.storeName}</Text>
                  {group.storeIsOfficial && (
                    <Ionicons name="checkmark-circle" size={15} color="#1B8754" />
                  )}
                </View>

                {group.items.map((item, idx) => (
                  <View key={idx} style={[styles.itemRow, idx > 0 && { marginTop: 10 }]}>
                    <View style={styles.imageBox}>
                      {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={styles.itemImage} contentFit="contain" />
                      ) : (
                        <Ionicons name="flask-outline" size={22} color="#A8A29E" />
                      )}
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemVolumeTag}>
                        {(item.volume || formatProductVolume(item.volumeMl)).toUpperCase()}
                      </Text>
                      <Text style={styles.itemName}>{item.productName}</Text>
                      <Text style={styles.itemQty}>Qtd: {item.quantity}</Text>
                    </View>
                    <Text style={styles.itemPrice}>
                      R$ {formatBRL(item.price * item.quantity)}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>

          {/* 3. Como você quer receber? */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Como você quer receber?</Text>
            {isLoadingShipping && <ActivityIndicator size="small" color="#1E2B37" />}
          </View>

          {shippingOptions.map((opt) => {
            const isSelected = selectedShipping === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.shippingCard, isSelected && styles.shippingCardSelected]}
                onPress={() => setSelectedShipping(opt.id)}
                activeOpacity={0.8}
              >
                <View style={styles.radioOuter}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>

                <View style={styles.shippingInfo}>
                  <View style={styles.shippingTitleRow}>
                    <Text style={styles.shippingTitle}>{opt.title}</Text>
                    <Text style={styles.shippingBadge}> • {opt.badge}</Text>
                  </View>
                  <Text style={styles.shippingEstimate}>{opt.estimate}</Text>
                </View>

                <Text style={styles.shippingPrice}>R$ {formatBRL(opt.price)}</Text>
              </TouchableOpacity>
            );
          })}

          {/* 4. Resumo Total */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>R$ {formatBRL(subtotal)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Frete ({selectedShipping === 'express' ? 'SEDEX' : 'PAC'})
              </Text>
              <Text style={styles.summaryValue}>R$ {formatBRL(currentShippingCost)}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>R$ {formatBRL(total)}</Text>
            </View>
          </View>

          {/* Botão de prosseguir */}
          <TouchableOpacity
            style={styles.continueButton}
            activeOpacity={0.88}
            onPress={handleContinueToPayment}
          >
            <Text style={styles.continueButtonText}>Continuar para o pagamento</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
          </TouchableOpacity>

          <View style={{ height: 28 }} />
        </ScrollView>

        {/* Modal Pop-up para Adicionar Novo Endereço */}
        <Modal
          visible={isAddressModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setIsAddressModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { maxWidth: containerWidth - 32 }]}>
              {/* Header do Modal exatamente igual a Meus Endereços */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Novo Endereço</Text>
                <TouchableOpacity
                  onPress={() => setIsAddressModalVisible(false)}
                  activeOpacity={0.6}
                >
                  <Ionicons name="close" size={22} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Erro inline */}
              {addressError ? (
                <View style={styles.addressErrorBox}>
                  <Feather name="alert-circle" size={14} color="#DC2626" />
                  <Text style={styles.addressErrorText}>{addressError}</Text>
                </View>
              ) : null}

              {/* Inputs sem scroll: cabe perfeitamente na janela do modal */}
              <View style={styles.modalBody}>
                {/* Identificador (Casa, Trabalho, Outro) */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Identificador</Text>
                  <View style={styles.tagSelectorRow}>
                    {['Casa', 'Trabalho', 'Outro'].map((tagOption) => (
                      <TouchableOpacity
                        key={tagOption}
                        style={[
                          styles.tagOptionBtn,
                          newTag === tagOption && styles.tagOptionBtnActive,
                        ]}
                        onPress={() => setNewTag(tagOption)}
                      >
                        <Text
                          style={[
                            styles.tagOptionText,
                            newTag === tagOption && styles.tagOptionTextActive,
                          ]}
                        >
                          {tagOption}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* CEP */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>CEP</Text>
                  <View style={styles.inputWithIcon}>
                    <TextInput
                      style={styles.innerInput}
                      placeholder="00000-000"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                      value={cep}
                      onChangeText={handleCepSearch}
                      maxLength={9}
                    />
                    {isLoadingCep && (
                      <ActivityIndicator size="small" color="#2C4659" style={{ marginRight: 6 }} />
                    )}
                  </View>
                </View>

                {/* Rua / Logradouro */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Rua / Logradouro</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Av. Paulista"
                    placeholderTextColor="#9CA3AF"
                    value={street}
                    onChangeText={(t) => {
                      setStreet(t);
                      if (addressError) setAddressError('');
                    }}
                  />
                </View>

                {/* Número & Complemento */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Número</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="123"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                      value={number}
                      onChangeText={(t) => {
                        setNumber(t);
                        if (addressError) setAddressError('');
                      }}
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1.4 }]}>
                    <Text style={styles.formLabel}>Complemento</Text>
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
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Bairro</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Bairro"
                    placeholderTextColor="#9CA3AF"
                    value={neighborhood}
                    onChangeText={setNeighborhood}
                  />
                </View>

                {/* Cidade & UF */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={[styles.formGroup, { flex: 2 }]}>
                    <Text style={styles.formLabel}>Cidade</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Cidade"
                      placeholderTextColor="#9CA3AF"
                      value={city}
                      onChangeText={setCity}
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>UF</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="SP"
                      placeholderTextColor="#9CA3AF"
                      maxLength={2}
                      autoCapitalize="characters"
                      value={stateUf}
                      onChangeText={(t) => setStateUf(t.toUpperCase())}
                    />
                  </View>
                </View>

                {/* Checkbox: Definir como padrão */}
                <TouchableOpacity
                  style={styles.checkboxRow}
                  activeOpacity={0.7}
                  onPress={() => setIsDefault(!isDefault)}
                >
                  <View style={[styles.checkboxBox, isDefault && styles.checkboxBoxActive]}>
                    {isDefault && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                  </View>
                  <Text style={styles.checkboxLabel}>Definir como endereço padrão</Text>
                </TouchableOpacity>

                {/* Botões do Modal idênticos a Meus Endereços */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    activeOpacity={0.7}
                    onPress={() => setIsAddressModalVisible(false)}
                  >
                    <Text style={styles.modalCancelText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalSaveBtn}
                    activeOpacity={0.88}
                    onPress={handleSaveNewAddress}
                  >
                    <Text style={styles.modalSaveText}>Salvar Endereço</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
    backgroundColor: '#F4F1EA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C252E',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C252E',
  },
  linkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E2B37',
    textDecorationLine: 'underline',
  },
  itemCountText: {
    fontSize: 13,
    color: '#78716C',
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#EFEBE2',
  },
  addressCardSelected: {
    borderColor: '#1E2B37',
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#1E2B37',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1E2B37',
  },
  addressInfo: {
    flex: 1,
  },
  addressTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressTagTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C252E',
  },
  defaultBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1B8754',
  },
  addressStreet: {
    fontSize: 13,
    color: '#1C252E',
    marginTop: 2,
  },
  addressCity: {
    fontSize: 12,
    color: '#78716C',
    marginTop: 1,
  },
  editIconBtn: {
    padding: 4,
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#C7C2B6',
    backgroundColor: '#FDFCFA',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
    marginBottom: 8,
  },
  addAddressButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E2B37',
  },
  newAddressBox: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  newAddressTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C252E',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
    ...Platform.select({
      web: {
        outlineStyle: 'none' as any,
        outlineWidth: 0,
      },
    }),
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  innerInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1C252E',
    borderWidth: 0,
    ...Platform.select({
      web: {
        outlineStyle: 'none' as any,
        outlineWidth: 0,
      },
    }),
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EFEBE2',
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F2EB',
    marginBottom: 10,
  },
  storeName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C252E',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  imageBox: {
    width: 48,
    height: 56,
    backgroundColor: '#FAF7F2',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemImage: {
    width: 40,
    height: 48,
  },
  itemInfo: {
    flex: 1,
  },
  itemVolumeTag: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8A867E',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C252E',
  },
  itemQty: {
    fontSize: 12,
    color: '#78716C',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C252E',
  },
  shippingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#EFEBE2',
  },
  shippingCardSelected: {
    borderColor: '#1E2B37',
  },
  shippingInfo: {
    flex: 1,
  },
  shippingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shippingTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1C252E',
  },
  shippingBadge: {
    fontSize: 12,
    color: '#78716C',
    fontWeight: '600',
  },
  shippingEstimate: {
    fontSize: 11,
    color: '#78716C',
    marginTop: 2,
  },
  shippingPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1C252E',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFEBE2',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 13,
    color: '#1C252E',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F0E6',
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C252E',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C252E',
  },
  continueButton: {
    backgroundColor: '#1E2B37',
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E2B37',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  newAddressSubtitle: {
    fontSize: 12,
    color: '#78716C',
    marginBottom: 10,
    lineHeight: 16,
  },
  addressErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
  },
  addressErrorText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
    flex: 1,
  },
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
    borderRadius: 22,
    padding: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDE4',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C252E',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    marginBottom: 4,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F4F1EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#4B5563',
  },
  modalSaveBtn: {
    flex: 1.5,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#A85A38',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  formGroup: {
    marginBottom: 10,
  },
  modalBody: {
    paddingTop: 2,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 5,
  },
  tagSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tagOptionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E4D8',
    backgroundColor: '#FAF9F5',
  },
  tagOptionBtnActive: {
    backgroundColor: '#273847',
    borderColor: '#273847',
  },
  tagOptionText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#4B5563',
  },
  tagOptionTextActive: {
    color: '#FFFFFF',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
    marginBottom: 10,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#A85A38',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxActive: {
    backgroundColor: '#A85A38',
  },
  checkboxLabel: {
    fontSize: 13,
    color: '#1C252E',
    fontWeight: '500',
  },
});

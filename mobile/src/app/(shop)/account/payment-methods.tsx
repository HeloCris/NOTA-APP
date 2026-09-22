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
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import Feather from '@expo/vector-icons/Feather';

interface PaymentCard {
  id: string;
  brand: 'Mastercard' | 'Visa' | 'Elo';
  last4: string;
  holder: string;
  expiry: string;
  isDefault: boolean;
}

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const containerWidth = Math.min(windowWidth, 460);

  const [cards, setCards] = useState<PaymentCard[]>([
    {
      id: '1',
      brand: 'Mastercard',
      last4: '4532',
      holder: 'ANA FERREIRA',
      expiry: '12/28',
      isDefault: true,
    },
    {
      id: '2',
      brand: 'Visa',
      last4: '8810',
      holder: 'ANA FERREIRA',
      expiry: '08/29',
      isDefault: false,
    },
  ]);

  // Modal para adicionar cartão
  const [modalVisible, setModalVisible] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [holderName, setHolderName] = useState('ANA FERREIRA');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [isDefaultNew, setIsDefaultNew] = useState(false);

  const handleSetDefault = (id: string) => {
    setCards((prev) =>
      prev.map((c) => ({
        ...c,
        isDefault: c.id === id,
      }))
    );
  };

  const handleDeleteCard = (id: string) => {
    setCards((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      if (remaining.length > 0 && !remaining.some((c) => c.isDefault)) {
        remaining[0].isDefault = true;
      }
      return remaining;
    });
  };

  const handleFormatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 16);
    const parts = cleaned.match(/[\s\S]{1,4}/g) || [];
    setCardNumber(parts.join(' '));
  };

  const handleFormatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 3) {
      setExpiryDate(`${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`);
    } else {
      setExpiryDate(cleaned);
    }
  };

  const handleSaveCard = () => {
    const digitsOnly = cardNumber.replace(/\D/g, '');
    if (digitsOnly.length < 4 || !holderName.trim() || !expiryDate.trim()) {
      return;
    }

    const last4Digits = digitsOnly.slice(-4);
    const detectedBrand: 'Mastercard' | 'Visa' | 'Elo' =
      digitsOnly.startsWith('4') ? 'Visa' : 'Mastercard';

    const newCard: PaymentCard = {
      id: Date.now().toString(),
      brand: detectedBrand,
      last4: last4Digits,
      holder: holderName.trim().toUpperCase(),
      expiry: expiryDate.trim(),
      isDefault: isDefaultNew || cards.length === 0,
    };

    setCards((prev) => {
      if (newCard.isDefault) {
        return [newCard, ...prev.map((c) => ({ ...c, isDefault: false }))];
      }
      return [newCard, ...prev];
    });

    // Resetar
    setCardNumber('');
    setHolderName('ANA FERREIRA');
    setExpiryDate('');
    setCvv('');
    setIsDefaultNew(false);
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F1EA" />
      <View style={[styles.mainWrapper, { maxWidth: containerWidth }]}>
        {/* --- HEADER --- */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={21} color="#1C252E" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Meios de Pagamento</Text>
            <Text style={styles.headerSubtitle}>
              {cards.length}{' '}
              {cards.length === 1 ? 'cartão salvo' : 'cartões salvos'}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* --- BOTÃO ADICIONAR NOVO CARTÃO --- */}
          <TouchableOpacity
            style={styles.addBtn}
            activeOpacity={0.88}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="card-outline" size={20} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Adicionar Novo Cartão</Text>
          </TouchableOpacity>

          {/* --- LISTA DE CARTÕES --- */}
          <View style={styles.cardList}>
            {cards.map((card) => (
              <View
                key={card.id}
                style={[
                  styles.cardBox,
                  card.isDefault && styles.cardBoxDefault,
                ]}
              >
                {/* Top Row: Bandeira & Badge de Padrão */}
                <View style={styles.cardTopRow}>
                  <View style={styles.brandRow}>
                    <View style={styles.iconCircle}>
                      <Ionicons name="card" size={17} color="#2C4659" />
                    </View>
                    <Text style={styles.brandTitle}>
                      {card.brand} •••• {card.last4}
                    </Text>
                  </View>

                  {card.isDefault ? (
                    <View style={styles.defaultBadge}>
                      <Ionicons name="checkmark" size={13} color="#A85A38" />
                      <Text style={styles.defaultBadgeText}>Padrão</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.setDefaultBtn}
                      activeOpacity={0.7}
                      onPress={() => handleSetDefault(card.id)}
                    >
                      <Text style={styles.setDefaultText}>Definir como padrão</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Card Info */}
                <View style={styles.cardDetails}>
                  <Text style={styles.holderText}>{card.holder}</Text>
                  <Text style={styles.expiryText}>Expira em {card.expiry}</Text>
                </View>

                {/* Footer com Remover */}
                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    activeOpacity={0.65}
                    onPress={() => handleDeleteCard(card.id)}
                  >
                    <Feather name="trash-2" size={14} color="#9CA3AF" />
                    <Text style={styles.deleteText}>Remover</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* Dica de Segurança */}
          <View style={styles.securityBox}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#5C6B4E" />
            <Text style={styles.securityText}>
              Seus dados de pagamento são criptografados de ponta a ponta e
              armazenados com segurança padrão PCI-DSS.
            </Text>
          </View>

          <View style={{ height: 36 }} />
        </ScrollView>
      </View>

      {/* --- MODAL PARA NOVO CARTÃO --- */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: containerWidth - 32 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Cartão de Crédito</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                activeOpacity={0.6}
              >
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Número do Cartão */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Número do Cartão</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0000 0000 0000 0000"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={cardNumber}
                  onChangeText={handleFormatCardNumber}
                  maxLength={19}
                />
              </View>

              {/* Titular */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nome do Titular</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nome impresso no cartão"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="characters"
                  value={holderName}
                  onChangeText={setHolderName}
                />
              </View>

              {/* Validade & CVV em linha */}
              <View style={styles.rowTwoCols}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Validade (MM/AA)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="12/28"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={expiryDate}
                    onChangeText={handleFormatExpiry}
                    maxLength={5}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>CVV</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="123"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    secureTextEntry
                    value={cvv}
                    onChangeText={setCvv}
                    maxLength={4}
                  />
                </View>
              </View>

              {/* Checkbox: Definir como padrão */}
              <TouchableOpacity
                style={styles.checkboxRow}
                activeOpacity={0.7}
                onPress={() => setIsDefaultNew(!isDefaultNew)}
              >
                <View
                  style={[
                    styles.checkboxBox,
                    isDefaultNew && styles.checkboxBoxActive,
                  ]}
                >
                  {isDefaultNew && (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>
                  Definir como cartão padrão para compras
                </Text>
              </TouchableOpacity>

              {/* Botões do Modal */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  activeOpacity={0.7}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  activeOpacity={0.88}
                  onPress={handleSaveCard}
                >
                  <Text style={styles.modalSaveText}>Salvar Cartão</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  backBtn: {
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
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17.5,
    fontWeight: '800',
    color: '#1C252E',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#78716C',
    marginTop: 1,
  },

  // --- Botão Adicionar ---
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#273847',
    marginHorizontal: 18,
    marginTop: 18,
    marginBottom: 16,
    paddingVertical: 13,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },

  // --- Cards ---
  cardList: {
    paddingHorizontal: 18,
    gap: 14,
  },
  cardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardBoxDefault: {
    borderColor: '#A85A38',
    borderWidth: 1.5,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF4F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C252E',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FAF0EA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  defaultBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#A85A38',
  },
  setDefaultBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  setDefaultText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C4659',
    textDecorationLine: 'underline',
  },
  cardDetails: {
    gap: 2,
    paddingLeft: 40,
  },
  holderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C252E',
  },
  expiryText: {
    fontSize: 12,
    color: '#78716C',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F5F2EB',
    marginTop: 12,
    paddingTop: 8,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  deleteText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },

  // --- Dica de Segurança ---
  securityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0F4EC',
    marginHorizontal: 18,
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
  },
  securityText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
    color: '#5C6B4E',
    fontWeight: '500',
  },

  // --- Modal ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
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
  rowTwoCols: {
    flexDirection: 'row',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
    marginBottom: 20,
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
  modalActions: {
    flexDirection: 'row',
    gap: 10,
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
});

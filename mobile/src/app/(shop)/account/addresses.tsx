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
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import Feather from '@expo/vector-icons/Feather';

interface Address {
  id: string;
  tag: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  stateUf: string;
  cep: string;
  isDefault: boolean;
}

export default function SavedAddressesScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const containerWidth = Math.min(windowWidth, 460);

  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: '1',
      tag: 'Casa',
      street: 'Av. Paulista',
      number: '1000',
      complement: 'Apt 42',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      stateUf: 'SP',
      cep: '01310-100',
      isDefault: true,
    },
    {
      id: '2',
      tag: 'Trabalho',
      street: 'Rua Oscar Freire',
      number: '720',
      complement: 'Conjunto 101',
      neighborhood: 'Cerqueira César',
      city: 'São Paulo',
      stateUf: 'SP',
      cep: '01426-001',
      isDefault: false,
    },
  ]);

  // Modal para adicionar novo endereço
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  // Form de novo endereço
  const [newTag, setNewTag] = useState('Casa');
  const [newCep, setNewCep] = useState('');
  const [newStreet, setNewStreet] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [newComplement, setNewComplement] = useState('');
  const [newNeighborhood, setNewNeighborhood] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newStateUf, setNewStateUf] = useState('');
  const [newIsDefault, setNewIsDefault] = useState(false);

  // Definir como padrão
  const handleSetDefault = (id: string) => {
    setAddresses((prev) =>
      prev.map((addr) => ({
        ...addr,
        isDefault: addr.id === id,
      }))
    );
  };

  // Excluir endereço
  const handleDeleteAddress = (id: string) => {
    setAddresses((prev) => {
      const remaining = prev.filter((a) => a.id !== id);
      // Se o excluído era padrão, torna o primeiro restante como padrão
      if (remaining.length > 0 && !remaining.some((a) => a.isDefault)) {
        remaining[0].isDefault = true;
      }
      return remaining;
    });
  };

  // Busca de CEP no formulário do modal
  const handleCepSearch = async (text: string) => {
    const raw = text.replace(/\D/g, '');
    let formatted = raw;
    if (raw.length > 5) {
      formatted = `${raw.slice(0, 5)}-${raw.slice(5, 8)}`;
    }
    setNewCep(formatted);

    if (raw.length === 8) {
      setIsLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setNewStreet(data.logradouro || '');
          setNewNeighborhood(data.bairro || '');
          setNewCity(data.localidade || '');
          setNewStateUf(data.uf || '');
        }
      } catch {
        // Fallback gracioso
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  // Salvar novo endereço
  const handleSaveAddress = () => {
    if (!newStreet.trim() || !newNumber.trim() || !newCep.trim()) {
      return;
    }

    const newAddress: Address = {
      id: Date.now().toString(),
      tag: newTag || 'Outro',
      street: newStreet.trim(),
      number: newNumber.trim(),
      complement: newComplement.trim() || undefined,
      neighborhood: newNeighborhood.trim(),
      city: newCity.trim(),
      stateUf: newStateUf.trim().toUpperCase(),
      cep: newCep.trim(),
      isDefault: newIsDefault || addresses.length === 0,
    };

    setAddresses((prev) => {
      if (newAddress.isDefault) {
        return [newAddress, ...prev.map((a) => ({ ...a, isDefault: false }))];
      }
      return [newAddress, ...prev];
    });

    // Resetar form e fechar modal
    setNewTag('Casa');
    setNewCep('');
    setNewStreet('');
    setNewNumber('');
    setNewComplement('');
    setNewNeighborhood('');
    setNewCity('');
    setNewStateUf('');
    setNewIsDefault(false);
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
            <Text style={styles.headerTitle}>Endereços Salvos</Text>
            <Text style={styles.headerSubtitle}>
              {addresses.length}{' '}
              {addresses.length === 1
                ? 'endereço cadastrado'
                : 'endereços cadastrados'}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* --- BOTÃO ADICIONAR NOVO ENDEREÇO --- */}
          <TouchableOpacity
            style={styles.addBtn}
            activeOpacity={0.88}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Adicionar Novo Endereço</Text>
          </TouchableOpacity>

          {/* --- LISTA DE ENDEREÇOS --- */}
          <View style={styles.addressList}>
            {addresses.map((addr) => (
              <View
                key={addr.id}
                style={[
                  styles.addressCard,
                  addr.isDefault && styles.addressCardDefault,
                ]}
              >
                {/* Cabeçalho do Card */}
                <View style={styles.cardTopRow}>
                  <View style={styles.tagWrapper}>
                    <View style={styles.iconCircle}>
                      <Ionicons
                        name={addr.tag === 'Trabalho' ? 'briefcase-outline' : 'home-outline'}
                        size={16}
                        color="#2C4659"
                      />
                    </View>
                    <Text style={styles.tagText}>{addr.tag}</Text>
                  </View>

                  {addr.isDefault ? (
                    <View style={styles.defaultBadge}>
                      <Ionicons name="checkmark" size={13} color="#A85A38" />
                      <Text style={styles.defaultBadgeText}>Padrão</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.setDefaultBtn}
                      activeOpacity={0.7}
                      onPress={() => handleSetDefault(addr.id)}
                    >
                      <Text style={styles.setDefaultText}>Definir como padrão</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Detalhes do Endereço */}
                <View style={styles.addressDetails}>
                  <Text style={styles.streetText}>
                    {addr.street}, {addr.number}
                    {addr.complement ? ` · ${addr.complement}` : ''}
                  </Text>
                  <Text style={styles.cityText}>
                    {addr.neighborhood}, {addr.city} — {addr.stateUf}
                  </Text>
                  <Text style={styles.cepText}>CEP: {addr.cep}</Text>
                </View>

                {/* Rodapé do Card com Ação de Excluir */}
                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    activeOpacity={0.65}
                    onPress={() => handleDeleteAddress(addr.id)}
                  >
                    <Feather name="trash-2" size={14} color="#9CA3AF" />
                    <Text style={styles.deleteText}>Remover</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          <View style={{ height: 36 }} />
        </ScrollView>
      </View>

      {/* --- MODAL PARA NOVO ENDEREÇO --- */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: containerWidth - 32 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Endereço</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                activeOpacity={0.6}
              >
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Identificador (Casa, Trabalho...) */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Identificador</Text>
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
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CEP</Text>
                <View style={styles.inputWithIcon}>
                  <TextInput
                    style={styles.input}
                    placeholder="00000-000"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={newCep}
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
                  value={newStreet}
                  onChangeText={setNewStreet}
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
                    value={newNumber}
                    onChangeText={setNewNumber}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1.4, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Complemento</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Apto, Bloco..."
                    placeholderTextColor="#9CA3AF"
                    value={newComplement}
                    onChangeText={setNewComplement}
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
                  value={newNeighborhood}
                  onChangeText={setNewNeighborhood}
                />
              </View>

              {/* Cidade & UF */}
              <View style={styles.rowTwoCols}>
                <View style={[styles.inputGroup, { flex: 2, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Cidade</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Cidade"
                    placeholderTextColor="#9CA3AF"
                    value={newCity}
                    onChangeText={setNewCity}
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
                    value={newStateUf}
                    onChangeText={setNewStateUf}
                  />
                </View>
              </View>

              {/* Checkbox: Definir como padrão */}
              <TouchableOpacity
                style={styles.checkboxRow}
                activeOpacity={0.7}
                onPress={() => setNewIsDefault(!newIsDefault)}
              >
                <View
                  style={[
                    styles.checkboxBox,
                    newIsDefault && styles.checkboxBoxActive,
                  ]}
                >
                  {newIsDefault && (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>
                  Definir como endereço padrão
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
                  onPress={handleSaveAddress}
                >
                  <Text style={styles.modalSaveText}>Salvar Endereço</Text>
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

  // --- Add Button ---
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

  // --- Address Cards ---
  addressList: {
    paddingHorizontal: 18,
    gap: 14,
  },
  addressCard: {
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
  addressCardDefault: {
    borderColor: '#A85A38',
    borderWidth: 1.5,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tagWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EFF4F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagText: {
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
  addressDetails: {
    gap: 3,
    paddingLeft: 38,
  },
  streetText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C252E',
  },
  cityText: {
    fontSize: 13,
    color: '#6B7280',
  },
  cepText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
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

  // --- Modal Styles ---
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

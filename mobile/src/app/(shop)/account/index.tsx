import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Modal,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import Feather from '@expo/vector-icons/Feather';
import { useAuth } from '../../../context/AuthContext';
import { useUnreadNotifications } from '../../../hooks/use-unread-notifications';

function formatPhoneMask(rawValue: string): string {
  const digits = rawValue.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function AccountScreen() {
  const router = useRouter();
  const { user, signOut, updateProfile } = useAuth();
  const { unreadCount } = useUnreadNotifications();
  const { width: windowWidth } = useWindowDimensions();
  const containerWidth = Math.min(windowWidth, 460);

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [fullNameInput, setFullNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  const displayEmail = user?.email || '';
  const displayPhone = user?.phone || '';
  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
    (displayEmail ? displayEmail.split('@')[0] : 'Usuário');
  const avatarLetter = (user?.first_name?.[0] || displayEmail[0] || 'U').toUpperCase();
  const olfactoryFamilies = user?.olfactory_families ?? [];
  const preferredNotes = user?.preferred_notes ?? [];
  const hasOlfactoryProfile = olfactoryFamilies.length > 0 || preferredNotes.length > 0;

  const isCustomer = !user?.role || user?.role === 'CUSTOMER';

  const confirmSignOut = async () => {
    setShowLogoutModal(false);
    await signOut();
    router.replace('/(auth)/login' as never);
  };

  const openEditProfile = () => {
    setFullNameInput([user?.first_name, user?.last_name].filter(Boolean).join(' '));
    setPhoneInput(formatPhoneMask(user?.phone ?? ''));
    setProfileError(null);
    setShowEditProfileModal(true);
  };

  const saveEditProfile = async () => {
    const nameParts = fullNameInput.trim().split(/\s+/).filter(Boolean);
    if (nameParts.length === 0) {
      setProfileError('Informe seu nome completo.');
      return;
    }

    const phoneDigits = phoneInput.replace(/\D/g, '');
    if (phoneDigits.length > 0 && phoneDigits.length < 10) {
      setProfileError('Informe um telefone válido com DDD.');
      return;
    }

    setIsSavingProfile(true);
    setProfileError(null);
    try {
      await updateProfile({
        first_name: nameParts[0],
        last_name: nameParts.slice(1).join(' '),
        phone: phoneInput.trim(),
      });
      setShowEditProfileModal(false);
      setProfileSuccess('Dados pessoais atualizados com sucesso.');
    } catch {
      setProfileError('Não foi possível salvar seus dados. Tente novamente.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const menuItems = [
    {
      id: 'orders',
      label: 'Meus Pedidos',
      icon: <Feather name="package" size={19} color="#4A6072" />,
      onPress: () => router.push('/orders' as never),
    },
    {
      id: 'addresses',
      label: 'Endereços Salvos',
      icon: <Ionicons name="location-outline" size={20} color="#4A6072" />,
      onPress: () => router.push('/(shop)/account/addresses' as never),
    },
    {
      id: 'payments',
      label: 'Meios de Pagamento',
      icon: <Ionicons name="card-outline" size={20} color="#4A6072" />,
      onPress: () => router.push('/(shop)/account/payment-methods' as never),
    },
    {
      id: 'following',
      label: 'Lojas que Sigo',
      icon: <Ionicons name="heart-outline" size={20} color="#4A6072" />,
      onPress: () => router.push('/(shop)/account/following' as never),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={[styles.mainWrapper, { maxWidth: containerWidth }]}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* --- USER HEADER --- */}
          <View style={styles.userHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{avatarLetter}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{displayName}</Text>
              {displayEmail ? <Text style={styles.userEmail}>{displayEmail}</Text> : null}
            </View>

            <TouchableOpacity
              style={styles.notificationButton}
              activeOpacity={0.7}
              onPress={() => router.push('/(shop)/notifications/' as never)}
              accessibilityRole="button"
              accessibilityLabel="Abrir notificações"
            >
              <Ionicons
                name="notifications-outline"
                size={21}
                color="#273847"
              />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* --- BANNER PERFIL OLFATIVO --- */}
          {isCustomer && (
            hasOlfactoryProfile ? (
              <View style={styles.olfactoryBanner}>
                <View style={styles.olfactoryHeaderRow}>
                  <Text style={styles.olfactorySectionTitle}>Perfil Olfativo</Text>
                  <TouchableOpacity
                    onPress={() => router.push('/(shop)/account/edit-olfactory-profile' as never)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.editOlfactoryText}>Editar</Text>
                  </TouchableOpacity>
                </View>

                {olfactoryFamilies.length > 0 && (
                  <>
                    <Text style={styles.olfactoryTitle}>Famílias</Text>
                    <View style={styles.chipsRow}>
                      {olfactoryFamilies.map((family: string) => (
                        <Text key={family} style={styles.profileChip}>
                          {family}
                        </Text>
                      ))}
                    </View>
                  </>
                )}

                {preferredNotes.length > 0 && (
                  <>
                    <Text style={[styles.olfactoryTitle, styles.notesTitle]}>
                      Notas favoritas
                    </Text>
                    <View style={styles.chipsRow}>
                      {preferredNotes.map((note: string) => (
                        <Text key={note} style={styles.profileChip}>
                          {note}
                        </Text>
                      ))}
                    </View>
                  </>
                )}
              </View>
            ) : (
              <View style={styles.olfactoryBanner}>
                <Text style={styles.olfactoryTitle}>Complete seu perfil olfativo</Text>
                <Text style={styles.olfactoryDesc}>
                  Responda 5 perguntas rápidas e receba recomendações de fragrâncias
                  sob medida para você.
                </Text>
                <TouchableOpacity
                  style={styles.olfactoryBtn}
                  activeOpacity={0.85}
                  onPress={() => router.push('/(shop)/account/edit-olfactory-profile' as never)}
                >
                  <Text style={styles.olfactoryBtnText}>Completar agora</Text>
                </TouchableOpacity>
              </View>
            )
          )}

          {/* --- DADOS PESSOAIS --- */}
          {displayEmail ? (
            <View style={styles.personalSection}>
              <View style={styles.personalHeading}>
                <Text style={styles.personalTitle}>Dados Pessoais</Text>
                <TouchableOpacity
                  onPress={openEditProfile}
                  accessibilityRole="button"
                  accessibilityLabel="Editar dados pessoais"
                >
                  <Text style={styles.editText}>Editar</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.personalEmail}>{displayEmail}</Text>
              {displayPhone ? (
                <Text style={styles.personalPhone}>{displayPhone}</Text>
              ) : null}
              {profileSuccess ? (
                <Text style={styles.profileSuccess}>{profileSuccess}</Text>
              ) : null}
            </View>
          ) : null}

          {/* --- MENU CARD --- */}
          <View style={styles.menuCard}>
            {menuItems.map((item, index) => {
              const isLast = index === menuItems.length - 1;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.menuRow, !isLast && styles.menuRowDivider]}
                  activeOpacity={0.65}
                  onPress={item.onPress}
                >
                  <View style={styles.menuIconBox}>{item.icon}</View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* --- BOTÃO SAIR --- */}
          <View style={styles.logoutWrapper}>
            <TouchableOpacity
              style={styles.logoutBtn}
              activeOpacity={0.7}
              onPress={() => setShowLogoutModal(true)}
            >
              <Ionicons
                name="exit-outline"
                size={16}
                color="#A85A38"
                style={styles.logoutIcon}
              />
              <Text style={styles.logoutText}>Sair</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 36 }} />
        </ScrollView>
      </View>

      {/* --- MODAL CONFIRMAÇÃO DE SAÍDA --- */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconBox}>
              <Ionicons name="log-out-outline" size={26} color="#A85A38" />
            </View>

            <Text style={styles.modalTitle}>Deseja realmente sair?</Text>
            <Text style={styles.modalDesc}>
              Você será desconectado da sua conta neste dispositivo.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                activeOpacity={0.7}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                activeOpacity={0.88}
                onPress={confirmSignOut}
              >
                <Text style={styles.modalConfirmText}>Sim, sair</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showEditProfileModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!isSavingProfile) setShowEditProfileModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, styles.editProfileCard]}>
            <Text style={styles.modalTitle}>Editar dados pessoais</Text>
            <Text style={styles.modalDesc}>
              Atualize seu nome e telefone para receber suas compras NŌTA.
            </Text>

            <Text style={styles.inputLabel}>Nome completo</Text>
            <TextInput
              style={styles.textInput}
              value={fullNameInput}
              onChangeText={(text) => {
                setFullNameInput(text);
                if (profileError) setProfileError(null);
              }}
              placeholder="Ana Ferreira"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              editable={!isSavingProfile}
            />

            <Text style={styles.inputLabel}>E-mail</Text>
            <TextInput
              style={[styles.textInput, styles.readOnlyInput]}
              value={displayEmail}
              editable={false}
            />

            <Text style={styles.inputLabel}>Telefone</Text>
            <TextInput
              style={styles.textInput}
              value={phoneInput}
              onChangeText={(text) => {
                setPhoneInput(formatPhoneMask(text));
                if (profileError) setProfileError(null);
              }}
              placeholder="(11) 99999-0000"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              maxLength={15}
              editable={!isSavingProfile}
            />

            {profileError ? (
              <Text style={styles.profileError}>{profileError}</Text>
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                activeOpacity={0.7}
                disabled={isSavingProfile}
                onPress={() => setShowEditProfileModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                activeOpacity={0.88}
                disabled={isSavingProfile}
                onPress={saveEditProfile}
                accessibilityRole="button"
                accessibilityLabel="Salvar dados pessoais"
              >
                {isSavingProfile ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
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
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 18 : 12,
    paddingBottom: 18,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#273847',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarLetter: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userInfo: {
    marginLeft: 14,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C252E',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: '#78716C',
    fontWeight: '400',
  },
  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E1D2',
    marginLeft: 10,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: '#A85A38',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  olfactoryBanner: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FAF0EA',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F4DFD5',
    padding: 18,
  },
  olfactoryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  olfactorySectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#273847',
  },
  editOlfactoryText: {
    color: '#A85A38',
    fontSize: 13,
    fontWeight: '700',
  },
  olfactoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#A85A38',
    marginBottom: 6,
  },
  olfactoryDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    color: '#78716C',
    marginBottom: 14,
  },
  olfactoryBtn: {
    backgroundColor: '#A85A38',
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 20,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  olfactoryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  notesTitle: { marginTop: 12 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  profileChip: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8D8CF',
    borderRadius: 16,
    borderWidth: 1,
    color: '#5D514A',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  personalSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  personalHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  personalTitle: { color: '#273847', fontSize: 16, fontWeight: '800' },
  editText: { color: '#A85A38', fontSize: 13, fontWeight: '700' },
  personalEmail: { color: '#78716C', fontSize: 13 },
  personalPhone: { color: '#78716C', fontSize: 13, marginTop: 3 },
  profileSuccess: {
    color: '#3A5C30',
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 8,
  },
  menuCard: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFECE4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3EFE6',
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF4F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuLabel: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1C252E',
  },
  logoutWrapper: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF6ED',
    borderWidth: 1,
    borderColor: '#E8DED1',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  logoutIcon: {
    marginRight: 6,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A85A38',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  modalIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FAF0EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17.5,
    fontWeight: '800',
    color: '#1C252E',
    textAlign: 'center',
    marginBottom: 6,
  },
  modalDesc: {
    fontSize: 13.5,
    color: '#78716C',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 16,
  },
  modalCancelBtn: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F4F1EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#4B5563',
  },
  modalConfirmBtn: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#A85A38',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  editProfileCard: {
    alignItems: 'stretch',
    maxWidth: 380,
  },
  inputLabel: {
    color: '#273847',
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 12,
  },
  textInput: {
    backgroundColor: '#F9F7F1',
    borderColor: '#E6E1D2',
    borderRadius: 12,
    borderWidth: 1,
    color: '#1C252E',
    fontSize: 14,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  readOnlyInput: {
    color: '#78716C',
    opacity: 0.8,
  },
  profileError: {
    color: '#A85A38',
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 12,
  },
});
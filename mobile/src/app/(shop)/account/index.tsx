import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../../context/AuthContext';

export default function AccountScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { width: windowWidth } = useWindowDimensions();
  const containerWidth = Math.min(windowWidth, 460);

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Carrega dinamicamente os dados do usuário autenticado no AuthContext
  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
    'Ana Ferreira';
  const displayEmail = user?.email || 'ana.ferreira@email.com';
  const avatarLetter = (user?.first_name?.[0] || 'A').toUpperCase();

  const confirmSignOut = async () => {
    setShowLogoutModal(false);
    await signOut();
    router.replace('/(auth)/login' as any);
  };

  const menuItems = [
    {
      id: 'orders',
      label: 'Meus Pedidos',
      icon: <Feather name="package" size={19} color="#4A6072" />,
      onPress: () => router.push('/(shop)/orders' as any),
    },
    {
      id: 'addresses',
      label: 'Endereços Salvos',
      icon: <Ionicons name="location-outline" size={20} color="#4A6072" />,
      onPress: () => router.push('/(shop)/account/addresses' as any),
    },
    {
      id: 'payments',
      label: 'Meios de Pagamento',
      icon: <Ionicons name="card-outline" size={20} color="#4A6072" />,
      onPress: () => router.push('/(shop)/account/payment-methods' as any),
    },
    {
      id: 'settings',
      label: 'Configurações',
      icon: (
        <MaterialCommunityIcons
          name="cog-outline"
          size={20}
          color="#4A6072"
        />
      ),
      onPress: () => {},
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F1EA" />
      <View style={[styles.mainWrapper, { maxWidth: containerWidth }]}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* --- USER HEADER (Dinâmico com os dados do usuário) --- */}
          <View style={styles.userHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{avatarLetter}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{displayName}</Text>
              <Text style={styles.userEmail}>{displayEmail}</Text>
            </View>
          </View>

          {/* --- BANNER PERFIL OLFATIVO --- */}
          <View style={styles.olfactoryBanner}>
            <Text style={styles.olfactoryTitle}>
              Complete seu Perfil Olfativo
            </Text>
            <Text style={styles.olfactoryDesc}>
              Responda 5 perguntas rápidas e receba recomendações de fragrâncias
              sob medida para você.
            </Text>
            <TouchableOpacity
              style={styles.olfactoryBtn}
              activeOpacity={0.85}
              onPress={() =>
                router.push('/(shop)/account/edit-olfactory-profile' as any)
              }
            >
              <Text style={styles.olfactoryBtnText}>Completar Agora</Text>
            </TouchableOpacity>
          </View>

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

  // --- Banner Perfil Olfativo ---
  olfactoryBanner: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FAF0EA',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F4DFD5',
    padding: 18,
  },
  olfactoryTitle: {
    fontSize: 15.5,
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

  // --- Menu Card ---
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

  // --- Botão Sair ---
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

  // --- Modal de Confirmação ---
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
});
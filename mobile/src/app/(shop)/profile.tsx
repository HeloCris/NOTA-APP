import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, updateProfile } = useAuth();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: user?.first_name ?? '',
    last_name: user?.last_name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
  });

  const openEdit = () => {
    setForm({
      first_name: user?.first_name ?? '',
      last_name: user?.last_name ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(form);
      setEditing(false);
    } catch (error: any) {
      const errorData = error?.response?.data;
      const firstErrorKey = errorData ? Object.keys(errorData)[0] : null;
      Alert.alert(
        'Erro',
        (firstErrorKey && errorData[firstErrorKey]?.[0]) ||
          'Não foi possível salvar seus dados.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sair', 'Deseja realmente sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const hasOlfactoryProfile =
    (user?.olfactory_families?.length ?? 0) > 0 ||
    (user?.preferred_notes?.length ?? 0) > 0;

  const initials = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`.trim();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || 'N'}</Text>
          </View>
          <Text style={styles.name}>
            {[user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Minha Conta'}
          </Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dados Pessoais</Text>
            <TouchableOpacity onPress={openEdit}>
              <Text style={styles.editLink}>Editar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nome</Text>
            <Text style={styles.infoValue}>{user?.first_name || '—'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Sobrenome</Text>
            <Text style={styles.infoValue}>{user?.last_name || '—'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>E-mail</Text>
            <Text style={styles.infoValue}>{user?.email || '—'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Telefone</Text>
            <Text style={styles.infoValue}>{user?.phone || '—'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meu Perfil Olfativo</Text>

          {!hasOlfactoryProfile ? (
            <View style={styles.olfactoryCta}>
              <Text style={styles.olfactoryCtaText}>
                Complete seu perfil olfativo e receba recomendações personalizadas 🌸
              </Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.push('/(shop)/edit-olfactory-profile')}
              >
                <Text style={styles.primaryButtonText}>Completar agora</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {user?.olfactory_families?.length ? (
                <View style={styles.chipGroup}>
                  <Text style={styles.chipLabel}>Famílias</Text>
                  <View style={styles.chipRow}>
                    {user.olfactory_families.map((family) => (
                      <View key={family} style={styles.chip}>
                        <Text style={styles.chipText}>{family}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              {user?.preferred_notes?.length ? (
                <View style={styles.chipGroup}>
                  <Text style={styles.chipLabel}>Notas favoritas</Text>
                  <View style={styles.chipRow}>
                    {user.preferred_notes.map((note) => (
                      <View key={note} style={styles.chip}>
                        <Text style={styles.chipText}>{note}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.editPreferenceButton}
                onPress={() => router.push('/(shop)/edit-olfactory-profile')}
              >
                <Text style={styles.editPreferenceText}>Editar preferências</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <MaterialIcons name="logout" size={18} color="#BA1A1A" />
          <Text style={styles.signOutText}>Sair</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={editing}
        transparent
        animationType="slide"
        onRequestClose={() => setEditing(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Editar dados pessoais</Text>

            {(
              [
                ['first_name', 'Nome', 'Ana'],
                ['last_name', 'Sobrenome', 'Ferreira'],
                ['email', 'E-mail', 'ana@email.com'],
                ['phone', 'Telefone', '11 99999-0000'],
              ] as const
            ).map(([key, label, placeholder]) => (
              <View key={key} style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{label}</Text>
                <TextInput
                  style={styles.input}
                  value={form[key]}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, [key]: value }))}
                  placeholder={placeholder}
                  placeholderTextColor="#A8A39A"
                  keyboardType={key === 'email' ? 'email-address' : key === 'phone' ? 'phone-pad' : 'default'}
                  autoCapitalize={key === 'email' ? 'none' : 'words'}
                />
              </View>
            ))}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditing(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3E9',
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#1E3446',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '700',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E3446',
  },
  email: {
    fontSize: 14,
    color: '#63666A',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#FCFBF7',
    borderWidth: 1,
    borderColor: '#ECE8DD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3446',
    marginBottom: 12,
  },
  editLink: {
    color: '#1E3446',
    fontSize: 14,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    color: '#63666A',
    fontSize: 14,
  },
  infoValue: {
    color: '#1E3446',
    fontSize: 14,
    fontWeight: '600',
  },
  olfactoryCta: {
    backgroundColor: '#EFEADF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  olfactoryCtaText: {
    color: '#1E3446',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#1E3446',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  chipGroup: {
    marginBottom: 16,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#63666A',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#E4EAEF',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  chipText: {
    color: '#33495C',
    fontSize: 13,
    fontWeight: '600',
  },
  editPreferenceButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  editPreferenceText: {
    color: '#1E3446',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  signOutText: {
    color: '#BA1A1A',
    fontWeight: '600',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FCFBF7',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3446',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E3446',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#ECE8DD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1E3446',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    color: '#63666A',
    fontWeight: '600',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#1E3446',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 96,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
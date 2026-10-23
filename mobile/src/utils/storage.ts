import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Sanitiza a chave para ser 100% compatível com as regras do expo-secure-store.
 * Remove caracteres inválidos como '@', ':', espaços e converte para '_'.
 */
function sanitizeKey(key: string): string {
  if (!key || typeof key !== 'string') {
    throw new Error('Storage: Uma chave válida (string não vazia) deve ser fornecida.');
  }
  return key.replace(/[^a-zA-Z0-9.-_]/g, '_');
}

export async function saveToken(key: string, value: string): Promise<void> {
  const safeKey = sanitizeKey(key);
  if (Platform.OS === 'web') {
    localStorage.setItem(safeKey, value);
  } else {
    await SecureStore.setItemAsync(safeKey, value);
  }
}

export async function getToken(key: string): Promise<string | null> {
  const safeKey = sanitizeKey(key);
  if (Platform.OS === 'web') {
    return localStorage.getItem(safeKey);
  } else {
    return await SecureStore.getItemAsync(safeKey);
  }
}

export async function deleteToken(key: string): Promise<void> {
  const safeKey = sanitizeKey(key);
  if (Platform.OS === 'web') {
    localStorage.removeItem(safeKey);
  } else {
    await SecureStore.deleteItemAsync(safeKey);
  }
}
import { saveToken, getToken } from './storage';

export interface UserAddress {
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

// Removido o caractere '@' para atender às regras de chave do expo-secure-store
const ADDRESSES_STORAGE_KEY = 'app_user_addresses';

export async function getSavedAddresses(): Promise<UserAddress[]> {
  try {
    const raw = await getToken(ADDRESSES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Erro ao ler endereços salvos:', err);
    return [];
  }
}

export async function saveAddresses(addresses: UserAddress[]): Promise<void> {
  try {
    await saveToken(ADDRESSES_STORAGE_KEY, JSON.stringify(addresses));
  } catch (err) {
    console.error('Erro ao salvar endereços:', err);
  }
}

export async function getDefaultAddress(): Promise<UserAddress | null> {
  const list = await getSavedAddresses();
  if (list.length === 0) return null;
  const def = list.find((a) => a.isDefault);
  return def || list[0];
}

export async function addOrUpdateAddress(
  newAddr: Omit<UserAddress, 'id'> & { id?: string }
): Promise<UserAddress[]> {
  const current = await getSavedAddresses();
  const id = newAddr.id || Date.now().toString();

  const isDefault = newAddr.isDefault || current.length === 0;

  const item: UserAddress = {
    ...newAddr,
    id,
    isDefault,
  };

  let updated: UserAddress[];
  const existingIdx = current.findIndex((a) => a.id === id);

  if (existingIdx > -1) {
    updated = [...current];
    updated[existingIdx] = item;
  } else {
    updated = [item, ...current];
  }

  if (isDefault) {
    updated = updated.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
  }

  await saveAddresses(updated);
  return updated;
}

export async function setDefaultAddress(id: string): Promise<UserAddress[]> {
  const current = await getSavedAddresses();
  const updated = current.map((a) => ({
    ...a,
    isDefault: a.id === id,
  }));
  await saveAddresses(updated);
  return updated;
}

export async function deleteAddress(id: string): Promise<UserAddress[]> {
  const current = await getSavedAddresses();
  let updated = current.filter((a) => a.id !== id);
  if (updated.length > 0 && !updated.some((a) => a.isDefault)) {
    updated[0].isDefault = true;
  }
  await saveAddresses(updated);
  return updated;
}
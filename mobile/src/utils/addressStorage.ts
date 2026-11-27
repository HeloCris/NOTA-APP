import { saveToken, getToken, deleteToken } from './storage';

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

const LEGACY_ADDRESSES_STORAGE_KEY = 'app_user_addresses';
let activeUserId: string | number | null = null;

export function setAddressStorageUserId(userId: string | number | null): void {
  activeUserId = userId;
}

function resolveStorageKey(userId?: string | number | null): string {
  const effectiveId = userId ?? activeUserId;
  return effectiveId ? `app_user_addresses_${effectiveId}` : LEGACY_ADDRESSES_STORAGE_KEY;
}

export async function getSavedAddresses(userId?: string | number | null): Promise<UserAddress[]> {
  try {
    const key = resolveStorageKey(userId);
    let raw = await getToken(key);

    if (!raw && key !== LEGACY_ADDRESSES_STORAGE_KEY) {
      const legacyRaw = await getToken(LEGACY_ADDRESSES_STORAGE_KEY);
      if (legacyRaw) {
        await saveToken(key, legacyRaw);
        await deleteToken(LEGACY_ADDRESSES_STORAGE_KEY).catch(() => {});
        raw = legacyRaw;
      }
    }

    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Erro ao ler endereços salvos:', err);
    return [];
  }
}

export async function saveAddresses(
  addresses: UserAddress[],
  userId?: string | number | null,
): Promise<void> {
  try {
    await saveToken(resolveStorageKey(userId), JSON.stringify(addresses));
  } catch (err) {
    console.error('Erro ao salvar endereços:', err);
  }
}

export async function getDefaultAddress(
  userId?: string | number | null,
): Promise<UserAddress | null> {
  const list = await getSavedAddresses(userId);
  if (list.length === 0) return null;
  const def = list.find((a) => a.isDefault);
  return def || list[0];
}

export async function addOrUpdateAddress(
  newAddr: Omit<UserAddress, 'id'> & { id?: string },
  userId?: string | number | null,
): Promise<UserAddress[]> {
  const current = await getSavedAddresses(userId);
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

  await saveAddresses(updated, userId);
  return updated;
}

export async function setDefaultAddress(
  id: string,
  userId?: string | number | null,
): Promise<UserAddress[]> {
  const current = await getSavedAddresses(userId);
  const updated = current.map((a) => ({
    ...a,
    isDefault: a.id === id,
  }));
  await saveAddresses(updated, userId);
  return updated;
}

export async function deleteAddress(
  id: string,
  userId?: string | number | null,
): Promise<UserAddress[]> {
  const current = await getSavedAddresses(userId);
  let updated = current.filter((a) => a.id !== id);
  if (updated.length > 0 && !updated.some((a) => a.isDefault)) {
    updated[0].isDefault = true;
  }
  await saveAddresses(updated, userId);
  return updated;
}
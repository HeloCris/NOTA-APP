import { saveToken, getToken } from './storage';

export interface SavedPaymentCard {
  id: string;
  brand: 'Mastercard' | 'Visa' | 'Elo' | 'Amex' | 'Hipercard' | 'Cartão';
  last4: string;
  holder: string;
  expiry: string;
  isDefault: boolean;
}

const CARDS_STORAGE_KEY = '@app_user_saved_cards';

export async function getSavedCards(): Promise<SavedPaymentCard[]> {
  try {
    const raw = await getToken(CARDS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Erro ao ler cartões salvos:', err);
    return [];
  }
}

export async function saveCards(cards: SavedPaymentCard[]): Promise<void> {
  try {
    await saveToken(CARDS_STORAGE_KEY, JSON.stringify(cards));
  } catch (err) {
    console.error('Erro ao salvar cartões:', err);
  }
}

export async function addOrUpdateCard(
  card: Omit<SavedPaymentCard, 'id'> & { id?: string }
): Promise<SavedPaymentCard[]> {
  const current = await getSavedCards();
  const id = card.id || Date.now().toString();
  const isDefault = card.isDefault || current.length === 0;

  const item: SavedPaymentCard = {
    ...card,
    id,
    isDefault,
  };

  let updated: SavedPaymentCard[];
  const existingIdx = current.findIndex((c) => c.id === id);

  if (existingIdx > -1) {
    updated = [...current];
    updated[existingIdx] = item;
  } else {
    updated = [item, ...current];
  }

  if (isDefault) {
    updated = updated.map((c) => ({
      ...c,
      isDefault: c.id === id,
    }));
  }

  await saveCards(updated);
  return updated;
}

export async function setDefaultCard(id: string): Promise<SavedPaymentCard[]> {
  const current = await getSavedCards();
  const updated = current.map((c) => ({
    ...c,
    isDefault: c.id === id,
  }));
  await saveCards(updated);
  return updated;
}

export async function deleteCard(id: string): Promise<SavedPaymentCard[]> {
  const current = await getSavedCards();
  let updated = current.filter((c) => c.id !== id);
  if (updated.length > 0 && !updated.some((c) => c.isDefault)) {
    updated[0].isDefault = true;
  }
  await saveCards(updated);
  return updated;
}

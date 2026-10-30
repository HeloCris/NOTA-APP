/**
 * Helper de formatação de volume do produto.
 * Regra do negócio NŌTA:
 * Apenas volumetrias menores ou iguais a 15ml (ex.: 2ml, 5ml, 10ml, 15ml) são Decants.
 * Volumetrias maiores (ex.: 30ml, 50ml, 75ml, 100ml, 200ml) são frascos regulares / produto padrão.
 */
export function formatProductVolume(volumeMl?: number | null, fallbackText?: string): string {
  if (!volumeMl || typeof volumeMl !== 'number') {
    return fallbackText || '';
  }

  if (volumeMl <= 15) {
    return `Decant ${volumeMl}ml`;
  }

  return `${volumeMl}ml`;
}

/**
 * Retorna se a volumetria é considerada Decant (≤ 15ml).
 */
export function isDecantVolume(volumeMl?: number | null): boolean {
  if (!volumeMl || typeof volumeMl !== 'number') return false;
  return volumeMl <= 15;
}

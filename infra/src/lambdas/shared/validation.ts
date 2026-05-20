export const ALLOWED_SUPERMARKETS = ['carrefour', 'mercadona', 'lidl', 'aldi', 'eroski'] as const;
export const ALLOWED_DIFFICULTIES = ['Facil', 'Media', 'Alta'] as const;

export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function normalizeBarcode(raw: unknown) {
  if (typeof raw !== 'string') return null;
  const normalized = raw.trim().replace(/\s+/g, '');
  if (!normalized) return null;
  if (!/^\d+$/.test(normalized)) return null;
  if (![8, 12, 13].includes(normalized.length)) return null;
  return normalized;
}

export function isDigitsOnly(value: string) {
  return /^\d+$/.test(value);
}

export function isAllowedBarcodeLength(value: string) {
  return [8, 12, 13].includes(value.length);
}

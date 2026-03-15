import type { AuthUser } from '@/features/auth/domain/auth.types';

function normalizeIdentityValue(value: string | null | undefined) {
  return value?.trim() || null;
}

function getUsernameFromEmail(email: string) {
  return email.split('@')[0] ?? email;
}

function getWords(value: string) {
  return value
    .replace(/[._-]+/g, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);
}

export function getUserDisplayName(user: AuthUser | null) {
  const username = normalizeIdentityValue(user?.username);
  const email = normalizeIdentityValue(user?.email);

  if (username && email && username.toLowerCase() === email.toLowerCase()) {
    return getUsernameFromEmail(email);
  }

  return username ?? (email ? getUsernameFromEmail(email) : 'Tu cuenta');
}

export function getUserInitials(user: AuthUser | null) {
  const displayName = getUserDisplayName(user);
  const words = getWords(displayName);

  if (words.length === 0) {
    return 'CC';
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
}

export function getUserSessionLabel(user: AuthUser | null) {
  return normalizeIdentityValue(user?.email) ?? normalizeIdentityValue(user?.username) ?? 'Usuario autenticado';
}

export function getUserSessionMeta(user: AuthUser | null) {
  const username = normalizeIdentityValue(user?.username);
  const email = normalizeIdentityValue(user?.email);

  if (username && email && username.toLowerCase() !== email.toLowerCase()) {
    return username;
  }

  return normalizeIdentityValue(user?.sub);
}

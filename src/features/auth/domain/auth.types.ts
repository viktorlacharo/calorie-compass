export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export type AuthSession = {
  accessToken: string;
  idToken: string;
  refreshToken: string | null;
  expiresAt: number;
  tokenType: string;
};

export type AuthUser = {
  sub: string | null;
  email: string | null;
  username: string | null;
  claims: Record<string, unknown>;
};

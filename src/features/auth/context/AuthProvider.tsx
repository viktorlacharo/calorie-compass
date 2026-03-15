import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import type { AuthSession, AuthStatus, AuthUser } from '@/features/auth/domain/auth.types';
import {
  getStoredAuthSession,
  getAuthUserFromSession,
  isSessionExpired,
  isSessionPayloadExpired,
  refreshAuthSession,
  signInWithPassword,
  signOutAuth,
} from '@/features/auth/services/cognito-auth.service';
import { clearHttpAuthToken, setHttpAuthToken } from '@/lib/api/http-client';

type AuthContextValue = {
  status: AuthStatus;
  session: AuthSession | null;
  user: AuthUser | null;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  getCurrentUserSub: () => string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getUserFromSession(session: AuthSession | null) {
  return session ? getAuthUserFromSession(session) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<AuthSession | null>(null);

  const applySession = useCallback(async (nextSession: AuthSession | null) => {
    if (!nextSession) {
      clearHttpAuthToken();
      setSession(null);
      setStatus('unauthenticated');
      return;
    }

    setHttpAuthToken(nextSession.accessToken);
    setSession(nextSession);
    setStatus('authenticated');
  }, []);

  const restoreSession = useCallback(async () => {
    const storedSession = await getStoredAuthSession();

    if (!storedSession) {
      clearHttpAuthToken();
      setSession(null);
      setStatus('unauthenticated');
      return;
    }

    try {
      if (isSessionExpired(storedSession) || isSessionPayloadExpired(storedSession)) {
        const refreshedSession = await refreshAuthSession();
        await applySession(refreshedSession);
        return;
      }

      setHttpAuthToken(storedSession.accessToken);
      setSession(storedSession);
      setStatus('authenticated');
    } catch {
      await applySession(null);
    }
  }, [applySession]);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    function handleAppStateChange(nextState: AppStateStatus) {
      if (nextState !== 'active' || !session) {
        return;
      }

      void (async () => {
        try {
          if (isSessionExpired(session) || isSessionPayloadExpired(session)) {
            const refreshedSession = await refreshAuthSession();
            await applySession(refreshedSession);
          }
        } catch {
          await applySession(null);
        }
      })();
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [applySession, session]);

  const signIn = useCallback(
    async (username: string, password: string) => {
      queryClient.clear();
      const nextSession = await signInWithPassword(username, password);
      await applySession(nextSession);
    },
    [applySession, queryClient]
  );

  const signOut = useCallback(async () => {
    queryClient.clear();
    await signOutAuth();
    await applySession(null);
  }, [applySession, queryClient]);

  const getAccessToken = useCallback(async () => {
    if (!session) {
      return null;
    }

    if (!isSessionExpired(session) && !isSessionPayloadExpired(session)) {
      return session.accessToken;
    }

    try {
      const refreshedSession = await refreshAuthSession();
      await applySession(refreshedSession);
      return refreshedSession.accessToken;
    } catch {
      await applySession(null);
      return null;
    }
  }, [applySession, session]);

  const user = useMemo(() => getUserFromSession(session), [session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      user,
      signIn,
      signOut,
      getAccessToken,
      getCurrentUserSub: () => user?.sub ?? null,
    }),
    [getAccessToken, session, signIn, signOut, status, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}

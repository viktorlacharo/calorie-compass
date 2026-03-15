import { Amplify } from 'aws-amplify';
import { fetchAuthSession, getCurrentUser, signIn, signOut } from 'aws-amplify/auth';
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';
import type { KeyValueStorageInterface } from 'aws-amplify/utils';
import { authConfig, hasCognitoConfig } from '@/features/auth/config/auth.config';
import type { AuthSession, AuthUser } from '@/features/auth/domain/auth.types';
import { amplifyKeyValueStorage } from '@/features/auth/services/auth-storage';
import { decodeJwtPayload, getJwtExpiration } from '@/features/auth/utils/jwt';

const EXPIRATION_SKEW_MS = 30_000;

let isAmplifyConfigured = false;

function configureAmplifyAuth() {
  if (isAmplifyConfigured) {
    return;
  }

  if (!hasCognitoConfig()) {
    throw new Error('Falta configurar Cognito en las variables de entorno.');
  }

  cognitoUserPoolsTokenProvider.setKeyValueStorage(amplifyKeyValueStorage as KeyValueStorageInterface);

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: authConfig.userPoolId,
        userPoolClientId: authConfig.appClientId,
        loginWith: {
          email: true,
        },
      },
    },
  });

  isAmplifyConfigured = true;
}

function buildAuthSessionFromTokens(tokens: Awaited<ReturnType<typeof fetchAuthSession>>['tokens']): AuthSession {
  if (!tokens?.accessToken || !tokens.idToken) {
    throw new Error('No hay tokens validos en la sesion actual.');
  }

  return {
    accessToken: tokens.accessToken.toString(),
    idToken: tokens.idToken.toString(),
    tokenType: 'Bearer',
    refreshToken: null,
    expiresAt: (tokens.accessToken.payload.exp ?? 0) * 1000,
  };
}

export function getAuthUserFromSession(session: AuthSession): AuthUser {
  const claims = decodeJwtPayload(session.idToken);

  return {
    sub: typeof claims.sub === 'string' ? claims.sub : null,
    email: typeof claims.email === 'string' ? claims.email : null,
    username:
      typeof claims['cognito:username'] === 'string'
        ? claims['cognito:username']
        : typeof claims.email === 'string'
          ? claims.email
          : null,
    claims,
  };
}

export function isSessionExpired(session: AuthSession) {
  return session.expiresAt - EXPIRATION_SKEW_MS <= Date.now();
}

export function isSessionPayloadExpired(session: AuthSession) {
  return getJwtExpiration(session.accessToken) * 1000 - EXPIRATION_SKEW_MS <= Date.now();
}

export async function getStoredAuthSession() {
  configureAmplifyAuth();

  try {
    await getCurrentUser();
    const session = await fetchAuthSession();
    return buildAuthSessionFromTokens(session.tokens);
  } catch {
    return null;
  }
}

export async function signInWithPassword(username: string, password: string) {
  configureAmplifyAuth();

  try {
    const result = await signIn({
      username: username.trim(),
      password,
      options: {
        authFlowType: 'USER_SRP_AUTH',
      },
    });

    if (!result.isSignedIn) {
      const step = result.nextStep.signInStep;
      throw new Error(
        step === 'DONE'
          ? 'No se pudo iniciar sesion.'
          : `El usuario requiere un paso adicional no soportado ahora mismo: ${step}`
      );
    }

    const session = await fetchAuthSession();
    return buildAuthSessionFromTokens(session.tokens);
  } catch (error) {
    console.log('Amplify signIn error raw', error);
    console.log('Amplify signIn error name', (error as { name?: string })?.name);
    console.log('Amplify signIn error message', (error as { message?: string })?.message);
    console.log('Amplify signIn error cause', (error as { cause?: unknown })?.cause);
    console.log('Amplify signIn error recovery', (error as { recoverySuggestion?: string })?.recoverySuggestion);
    console.log('Amplify signIn error stack', (error as { stack?: string })?.stack);
    throw error;
  }
}

export async function refreshAuthSession() {
  configureAmplifyAuth();

  const session = await fetchAuthSession({ forceRefresh: true });
  return buildAuthSessionFromTokens(session.tokens);
}

export async function signOutAuth() {
  configureAmplifyAuth();
  await signOut();
}

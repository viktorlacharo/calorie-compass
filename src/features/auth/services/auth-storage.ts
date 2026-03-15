import * as SecureStore from 'expo-secure-store';
import type { KeyValueStorageInterface } from 'aws-amplify/utils';
import { Platform } from 'react-native';

const AUTH_STORAGE_KEYS_INDEX = 'calorie-compass.auth.keys';

function readWebStorage(key: string) {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  return localStorage.getItem(key);
}

function writeWebStorage(key: string, value: string) {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem(key, value);
}

function removeWebStorage(key: string) {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.removeItem(key);
}

async function readTrackedKeys() {
  const raw =
    Platform.OS === 'web'
      ? readWebStorage(AUTH_STORAGE_KEYS_INDEX)
      : await SecureStore.getItemAsync(AUTH_STORAGE_KEYS_INDEX);

  if (!raw) {
    return [] as string[];
  }

  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [] as string[];
  }
}

async function writeTrackedKeys(keys: string[]) {
  const raw = JSON.stringify([...new Set(keys)]);

  if (Platform.OS === 'web') {
    writeWebStorage(AUTH_STORAGE_KEYS_INDEX, raw);
    return;
  }

  await SecureStore.setItemAsync(AUTH_STORAGE_KEYS_INDEX, raw);
}

async function trackStorageKey(key: string) {
  const keys = await readTrackedKeys();

  if (!keys.includes(key)) {
    await writeTrackedKeys([...keys, key]);
  }
}

async function untrackStorageKey(key: string) {
  const keys = await readTrackedKeys();
  await writeTrackedKeys(keys.filter((entry) => entry !== key));
}

export const amplifyKeyValueStorage: KeyValueStorageInterface = {
  async setItem(key, value) {
    if (Platform.OS === 'web') {
      writeWebStorage(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }

    await trackStorageKey(key);
  },

  async getItem(key) {
    return Platform.OS === 'web' ? readWebStorage(key) : SecureStore.getItemAsync(key);
  },

  async removeItem(key) {
    if (Platform.OS === 'web') {
      removeWebStorage(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }

    await untrackStorageKey(key);
  },

  async clear() {
    const keys = await readTrackedKeys();

    await Promise.all(
      keys.map((key) =>
        Platform.OS === 'web' ? Promise.resolve(removeWebStorage(key)) : SecureStore.deleteItemAsync(key)
      )
    );

    if (Platform.OS === 'web') {
      removeWebStorage(AUTH_STORAGE_KEYS_INDEX);
    } else {
      await SecureStore.deleteItemAsync(AUTH_STORAGE_KEYS_INDEX);
    }
  },
};

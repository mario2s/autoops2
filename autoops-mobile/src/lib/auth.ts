import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { jwtDecode } from 'jwt-decode';
import type { JwtPayload } from './types';

const TOKEN_KEY = 'autoops.jwt';

const webStore = {
  async getItemAsync(key: string): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  },
  async setItemAsync(key: string, value: string): Promise<void> {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);
  },
  async deleteItemAsync(key: string): Promise<void> {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  },
};

const store = Platform.OS === 'web' ? webStore : SecureStore;

export async function getToken(): Promise<string | null> {
  return store.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await store.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await store.deleteItemAsync(TOKEN_KEY);
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwtDecode<JwtPayload>(token);
  } catch {
    return null;
  }
}

export function isExpired(payload: JwtPayload | null): boolean {
  if (!payload) return true;
  return payload.exp * 1000 <= Date.now();
}

export async function getValidSession(): Promise<JwtPayload | null> {
  const token = await getToken();
  if (!token) return null;
  const payload = decodeToken(token);
  if (!payload || isExpired(payload)) {
    await clearToken();
    return null;
  }
  return payload;
}

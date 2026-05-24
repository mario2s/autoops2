import { router } from 'expo-router';
import { clearToken, getToken } from './auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  console.warn('EXPO_PUBLIC_API_URL is not set');
}

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

async function request<T>(
  method: Method,
  path: string,
  body?: unknown,
  options?: { skipAuthRedirect?: boolean },
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new ApiError(0, 'NETWORK_ERROR', e instanceof Error ? e.message : 'Network error');
  }

  let payload: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!res.ok) {
    if (res.status === 401 && !options?.skipAuthRedirect) {
      await clearToken();
      try {
        router.replace('/login');
      } catch {
        // navigator not ready yet
      }
    }
    const p = payload as { error?: string; code?: string } | null;
    throw new ApiError(
      res.status,
      p?.code ?? `HTTP_${res.status}`,
      p?.error ?? `Request failed with status ${res.status}`,
    );
  }

  return payload as T;
}

export function get<T>(path: string, options?: { skipAuthRedirect?: boolean }): Promise<T> {
  return request<T>('GET', path, undefined, options);
}

export function post<T>(path: string, body?: unknown, options?: { skipAuthRedirect?: boolean }): Promise<T> {
  return request<T>('POST', path, body, options);
}

export function patch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>('PATCH', path, body);
}

export function del<T>(path: string): Promise<T> {
  return request<T>('DELETE', path);
}

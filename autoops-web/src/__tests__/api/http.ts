export const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000';

export type ApiResponse<T = unknown> = {
  status: number;
  body: T;
};

type RequestOpts = {
  method?: string;
  token?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

export async function apiRequest<T = any>(
  path: string,
  opts: RequestOpts = {},
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers || {}),
  };
  if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method: opts.method || 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  let body: any = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  return { status: res.status, body };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(v: unknown): boolean {
  return typeof v === 'string' && UUID_RE.test(v);
}

export function containsPasswordHash(obj: unknown): boolean {
  if (obj === null || obj === undefined) return false;
  if (typeof obj !== 'object') return false;
  const seen = new WeakSet<object>();
  const walk = (node: any): boolean => {
    if (!node || typeof node !== 'object') return false;
    if (seen.has(node)) return false;
    seen.add(node);
    if (Array.isArray(node)) return node.some(walk);
    for (const k of Object.keys(node)) {
      if (k === 'password_hash' || k === 'passwordHash') return true;
      if (walk(node[k])) return true;
    }
    return false;
  };
  return walk(obj);
}

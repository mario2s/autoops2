import { NextResponse } from 'next/server';
import { ApiError } from './api-error';

export function success<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function paginated<T>(
  data: T[],
  pagination: { page: number; pageSize: number; total: number },
) {
  return NextResponse.json({ data, pagination });
}

export function error(status: number, code: string, message: string) {
  return NextResponse.json({ error: message, code }, { status });
}

export function handleError(e: unknown) {
  if (e instanceof ApiError) {
    return error(e.status, e.code, e.message);
  }
  console.error('Unhandled API error:', e);
  return error(500, 'INTERNAL_ERROR', 'Internal server error');
}

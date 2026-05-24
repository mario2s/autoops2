import { apiRequest, isUuid } from './http';
import { context } from './context';

const UNKNOWN_CLIENT_ID = '00000000-0000-0000-0000-000000000001';

describe('catalog/clients', () => {
  test('CAT-CLI-01 — Create a client (mechanic)', async () => {
    const res = await apiRequest('/api/v1/catalog/clients', {
      method: 'POST',
      token: context.mechanicToken,
      body: {
        name: 'Test Client',
        phone: '+359 88 000 0000',
        email: 'test@client.com',
        notes: 'Test note',
      },
    });
    expect(res.status).toBe(201);
    expect(isUuid(res.body.data.id)).toBe(true);
    expect(res.body.data.name).toBe('Test Client');
    context.clientId = res.body.data.id;
  });

  test('CAT-CLI-02 — Create client with missing name', async () => {
    const res = await apiRequest('/api/v1/catalog/clients', {
      method: 'POST',
      token: context.mechanicToken,
      body: { phone: '+359 88 111 1111' },
    });
    expect(res.status).toBe(400);
  });

  test('CAT-CLI-03 — Edit client (admin)', async () => {
    const res = await apiRequest(`/api/v1/catalog/clients/${context.clientId}`, {
      method: 'PATCH',
      token: context.adminToken,
      body: { notes: 'Updated by admin' },
    });
    expect(res.status).toBe(200);
    expect(res.body.data.notes).toBe('Updated by admin');
  });

  test('CAT-CLI-04 — Edit client (mechanic — forbidden)', async () => {
    const res = await apiRequest(`/api/v1/catalog/clients/${context.clientId}`, {
      method: 'PATCH',
      token: context.mechanicToken,
      body: { notes: 'Should not work' },
    });
    expect(res.status).toBe(403);
  });

  test('CAT-CLI-05 — List clients', async () => {
    const res = await apiRequest('/api/v1/catalog/clients', {
      token: context.mechanicToken,
    });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(1);
  });

  test('CAT-CLI-06 — Get client by id', async () => {
    const res = await apiRequest(`/api/v1/catalog/clients/${context.clientId}`, {
      token: context.mechanicToken,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(context.clientId);
  });

  test('CAT-CLI-07 — Delete client (mechanic — forbidden)', async () => {
    const res = await apiRequest(`/api/v1/catalog/clients/${context.clientId}`, {
      method: 'DELETE',
      token: context.mechanicToken,
    });
    expect(res.status).toBe(403);
  });

  test('CAT-CLI-08 — Delete protected Unknown client (admin — 409)', async () => {
    const res = await apiRequest(`/api/v1/catalog/clients/${UNKNOWN_CLIENT_ID}`, {
      method: 'DELETE',
      token: context.adminToken,
    });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CLIENT_PROTECTED');
  });
});

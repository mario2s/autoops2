import { apiRequest, isUuid } from './http';
import { context } from './context';

describe('clients', () => {
  test('CLI-01 — Create a client (mechanic)', async () => {
    const res = await apiRequest('/api/v1/clients', {
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

  test('CLI-02 — Create client with missing name', async () => {
    const res = await apiRequest('/api/v1/clients', {
      method: 'POST',
      token: context.mechanicToken,
      body: { phone: '+359 88 111 1111' },
    });
    expect(res.status).toBe(400);
  });

  test('CLI-03 — Edit client (admin)', async () => {
    const res = await apiRequest(`/api/v1/clients/${context.clientId}`, {
      method: 'PATCH',
      token: context.adminToken,
      body: { notes: 'Updated by admin' },
    });
    expect(res.status).toBe(200);
    expect(res.body.data.notes).toBe('Updated by admin');
  });

  test('CLI-04 — Edit client (mechanic — forbidden)', async () => {
    const res = await apiRequest(`/api/v1/clients/${context.clientId}`, {
      method: 'PATCH',
      token: context.mechanicToken,
      body: { notes: 'Should not work' },
    });
    expect(res.status).toBe(403);
  });
});
